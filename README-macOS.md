# 师作 TeachDo · macOS 构建与验收手册

> 目标平台：**Apple Silicon（arm64）/ macOS 26**。
> 本文是**照着敲就能跑完**的操作步骤；「为什么」写在每步下面。
>
> **硬性前提：Windows 行为不得变化。** 本文所有改动都遵守这条 ——
> Windows 侧的窗口外壳（无边框 + 自绘窗控）、打包开关、导出字体族名
> 全部保持原值，平台差异一律走 `tauri.macos.conf.json` 或运行时分支。

---

## 0. 一句话现状

三个硬阻塞**都已在源码里修好**，打包链路也已备好。
你在 Mac 上要做的只有：装环境 → `pnpm install` → 跑 → 打包 → 验收。

**三个阻塞的修法（已落地，无需你动手）**

| # | 阻塞 | 修法 | 文件 |
|---|---|---|---|
| 1 | `capabilities/` 目录整个不存在 → 窗口拖不动/关不掉 | 新建能力文件，放行 5 个 `core:window` 命令 | `src-tauri/capabilities/default.json` |
| 2 | `ai.rs` 读 `USERPROFILE` → macOS 上导出 100% 失败 | 新增 `home_dir()`：macOS 优先 `HOME`，Windows 仍优先 `USERPROFILE` | `src-tauri/src/ai.rs` |
| 3 | `decorations:false` → macOS 上 traffic light 全消失 | macOS 改走系统原生三键（`decorations:true` + `titleBarStyle:Overlay`） | `src-tauri/tauri.macos.conf.json` |

详见 §2。

---

## 1. 装环境

### 1.1 Xcode 命令行工具（必需）

Tauri 在 macOS 上要链接系统框架，**必须有 Xcode 或至少 Command Line Tools**：

```bash
xcode-select --install
sudo xcodebuild -license accept
```

验证：

```bash
xcodebuild -version     # 期望 Xcode 16.x 或更高
clang --version
```

> 只装 Command Line Tools 通常就够（本项目不写 Swift/Objective-C）。
> 但若 `cargo build` 报找不到 SDK，就装完整 Xcode。

### 1.2 Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustup target add aarch64-apple-darwin
```

验证：

```bash
rustc --version     # 期望 1.77 以上（Cargo.toml 的 rust-version = "1.77"）
cargo --version
```

### 1.3 Node.js 与 pnpm

```bash
# Node 20 LTS 或更高（本项目在 Node 24 上验证过前端构建）
node --version
corepack enable && corepack prepare pnpm@latest --activate
pnpm --version
```

### 1.4 不需要装的东西（省你时间）

- **不需要 `brew install openssl`**。`Cargo.toml:21` 的 `reqwest` 用的是
  `features = ["json", "rustls-tls"], default-features = false` ——
  **纯 rustls，不依赖系统 OpenSSL**。arm64 上开箱即用。
- **不需要 Windows 侧的任何工具链**。

---

## 2. 三个硬阻塞：修法与验证

### 阻塞 1 —— ACL 能力文件缺失（最硬）

**现象**：窗口不能拖、不能最小化、不能最大化、不能关闭，**控制台一句话都没有**。

**原因**：Tauri 2 里 `@tauri-apps/api/window` 属于 **core 命令**，
必须由 `src-tauri/capabilities/` 下的能力文件显式授权。
原项目该目录整个不存在（`src-tauri/gen/schemas/capabilities.json` 内容是 `{}`），
`tauri.conf.json` 的 `app.security` 也只有 `csp`。
于是 `src/ui/winctl.ts:28,32,36,40,45` 五个调用全被 ACL 拒绝，
而它们原本都写成 `.catch(() => undefined)` —— **错误被静默吞掉**。

**修法**：新建 `src-tauri/capabilities/default.json`：

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "师作 TeachDo 主窗口能力集。…",
  "windows": ["main"],
  "permissions": [
    "core:window:default",
    "core:window:allow-close",
    "core:window:allow-minimize",
    "core:window:allow-toggle-maximize",
    "core:window:allow-start-dragging"
  ]
}
```

两个关键点：

- **`"windows": ["main"]` 必须能对上窗口标签**。
  原来 `tauri.conf.json` 的窗口配置**没有写 `label`**，
  默认值是 `"main"`。为避免这个隐式约定被将来改动打破，
  已在 `tauri.conf.json` 与 `tauri.macos.conf.json` 里**显式写上 `"label": "main"`**。
- **自定义命令不用加权限**。`ai_chat` / `ai_models` / `export_save`
  由 `lib.rs:6-10` 的 `invoke_handler` 注册，属于 app 命令，
  **默认对所有窗口开放**，不受 ACL 约束。所以 `permissions` 里不列它们。

**附带修的一处隐患**：`src/ui/winctl.ts` 的五个 `.catch(() => undefined)`
改为调用 `warn()` —— 仍然降级不抛（不打断交互），
但会把原因打到控制台。以后再出这类问题，一眼就能看见
「not allowed」而不是对着一个不动的窗口猜。

**已验证**（Windows 上实测）：`cargo check` 通过，
且 `tauri-build` 真的解析并解析出了这份能力文件 ——
构建产物 `target/debug/build/teachdo-*/out/capabilities.json` 内容为：

```json
{"default":{"identifier":"default","local":true,"windows":["main"],
 "permissions":["core:window:default","core:window:allow-close",
 "core:window:allow-minimize","core:window:allow-toggle-maximize",
 "core:window:allow-start-dragging"]}}
```

五个权限全部解析成功（有一个写错，`tauri-build` 会直接报错中止）。

**Mac 上怎么确认**：跑起来后拖标题栏、点最小化/最大化/关闭。
若仍失效，打开 devtools 看有没有 `[winctl] … 失败` 的告警。

---

### 阻塞 2 —— `USERPROFILE` 在 macOS 上不存在

**现象**：macOS 上点「导出」，**100% 失败**，报「找不到用户目录」。

**原因**：`src-tauri/src/ai.rs:131`（原行号）写的是

```rust
let home = std::env::var("USERPROFILE").map_err(|_| "找不到用户目录".to_string())?;
```

`USERPROFILE` 是 **Windows 专有**环境变量；macOS 用的是 `HOME`。

**修法**：新增 `home_dir()`，按平台决定读取顺序：

```rust
fn home_dir() -> Option<PathBuf> {
    let order: [&str; 2] = if cfg!(windows) {
        ["USERPROFILE", "HOME"]
    } else {
        ["HOME", "USERPROFILE"]
    };
    for key in order {
        if let Ok(v) = std::env::var(key) {
            let v = v.trim();
            if !v.is_empty() { return Some(PathBuf::from(v)); }
        }
    }
    None
}
```

三个刻意的设计决定：

1. **Windows 上 `USERPROFILE` 仍排第一** → 取值与原来**完全一致**，
   Windows 行为零变化。
2. **不是 `cfg` 二选一，而是「优先 + 回退」**。从 Finder 首次启动 `.app`
   时 `HOME` 偶发缺失，回退能兜住。
3. **没有引入 `dirs` crate**。`Cargo.toml` 里本来没有它，
   为读两个环境变量去加一棵依赖树不划算。

**已验证**（Windows 上用独立 `rustc` 编译运行了等价逻辑）：

```
PASS macOS: HOME used
PASS macOS: falls back to USERPROFILE
PASS macOS: None when neither set
PASS macOS: blank HOME skipped
PASS Windows: USERPROFILE still wins (behaviour unchanged)
ALL PASS
```

**导出落盘位置**：`$HOME/Downloads/师作导出/`。
文件名清洗逻辑**未改动**（仍替换 `\ / : * ? " < > |`），
所以 macOS 上文件名行为与 Windows 一致。

**关于 TCC 隐私弹窗**：macOS 保护「下载」文件夹。
首次写入会弹
**「师作 TeachDo」想要访问「下载」文件夹中的文件**。
- 点「好」→ 正常导出；
- 点「不允许」→ 返回 EPERM，界面显示
  `写入失败: Operation not permitted`。
  **这是预期行为，不是 bug**（代码里已加注释说明）。
- 想撤销授权：系统设置 → 隐私与安全性 → 文件与文件夹。

---

### 阻塞 3 —— `decorations: false` 与 `-webkit-app-region`

**现象**：macOS 上窗口没有红黄绿三键，配合阻塞 1 就是**既拖不动也关不掉**。

**原因**：
- `tauri.conf.json:20` 的 `"decorations": false` 在 macOS 上会让
  原生 traffic light **全部消失**；
- `src/styles/app.css:20` 的 `-webkit-app-region: drag` 是
  **Chromium 专有属性，WKWebView 不支持**，所以那条「双保险」在 macOS 上
  完全无效；
- 于是 `Titlebar.tsx:37-41` 的 `dragWindow()` 是**唯一**手段，
  而它又被阻塞 1 掐掉了。

#### 决策：macOS 走「原生优先」，Windows 保持无框

按「**功能等价 + UI 高度接近 + 原生优先**」三条验收标准权衡后，
选择**按平台分流**，而不是二选一：

| | Windows（不变） | macOS（本次） |
|---|---|---|
| `decorations` | `false`（无框） | `true`（系统原生边框） |
| `titleBarStyle` | — | `"Overlay"`（标题栏透明，内容顶到窗口顶部） |
| 窗控三键 | 自绘（`Titlebar.tsx` 的 `.win-tools`） | **系统原生红黄绿**，自绘三键隐藏 |
| 拖拽 | `startDragging()` + `-webkit-app-region` | `startDragging()`（唯一手段） |

**为什么这样选**

1. **「原生优先」是用户拍板的 UI 策略**，而 macOS 上红黄绿三键是最强的
   平台惯例：位置、尺寸、悬停行为、全屏语义都由系统负责，
   用户肌肉记忆直接可用。自绘三键在 Mac 上永远「差一点」。
2. **功能等价**：最小化 / 最大化（缩放）/ 关闭 / 拖拽 / 双击标题栏
   —— 五条能力一条不少。而且 `titleBarStyle: Overlay` 保留了
   「标题栏与内容同色」的观感，视觉上仍是无框的感觉。
3. **UI 高度接近**：`Overlay` 让内容延伸到窗口顶部，标题栏自绘部分
   照旧渲染，只是左边让出 80px 给三键。除这一处外，
   版式、配色、步骤签、状态条**完全一致**。
4. **Windows 零风险**：全部差异放进 `tauri.macos.conf.json`，
   Tauri 只在 macOS 上合并这个文件，Windows 读到的仍是原配置。

**为什么不用 `Transparent`**：它同样要 `decorations: true`，
但标题栏会变成纯色块（显示窗口背景色），与现有设计语言的
「零渐变零模糊、实色明度阶梯」冲突，观感反而更差。

**前端配套改动**

- `src/ui/platform.ts`（新增）：`IS_MAC` 与 `SAVE_HINT`。
- `src/ui/Titlebar.tsx`：macOS 上**不渲染**自绘三键
  （`{IS_MAC ? null : (…)}`）。Windows 分支渲染结果与原来**逐字节相同**。
- `src/main.tsx`：macOS 上给 `<html>` 打 `data-os="mac"`。
- `src/styles/app.css`：新增两条规则给三键让位 ——

  ```css
  html[data-os="mac"] .titlebar  { padding-left: 80px; }
  html[data-os="mac"] .set-head  { padding-left: 80px; }
  ```

  Windows / Linux 不带 `data-os`，规则不命中，**表现零变化**。

**拖动仍靠 `startDragging()`**：`Titlebar.tsx` 的 `onMouseDown`
与 `onDoubleClick` 未改动。注意 Tauri 官方提示：
`Overlay` 下窗口**失焦时无法拖动**（tauri-apps/tauri#4316），
这是已知上游限制，不是本项目的问题。

**待 Mac 上微调**：三键的垂直位置随 macOS 版本变化，
若与 44px 高的标题栏对不齐，用
`trafficLightPosition: { x: 20, y: 22 }` 微调
（该字段要求 `titleBarStyle: Overlay` 且 `decorations: true`，条件已满足）。

---

## 3. 打包链路

### 3.1 平台分文件（关键设计）

**`tauri.conf.json`（Windows / 通用）—— 未改动打包开关**

```json
"bundle": { "active": false, "icon": ["icons/32x32.png", "icons/128x128.png",
                                     "icons/128x128@2x.png", "icons/icon.ico"] }
```

**`tauri.macos.conf.json`（新增，仅 macOS 生效）**

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "app": { "windows": [ { "label": "main", "decorations": true,
            "titleBarStyle": "Overlay", "hiddenTitle": true,
            "acceptFirstMouse": true, … } ] },
  "bundle": { "active": true, "targets": ["app", "dmg"],
              "icon": ["icons/32x32.png","icons/128x128.png",
                       "icons/128x128@2x.png","icons/icon.icns"],
              "macOS": { "minimumSystemVersion": "11.0" } }
}
```

Tauri 2 会在读取 `tauri.conf.json` 后**按平台合并**
`tauri.macos.conf.json` / `tauri.windows.conf.json` / `tauri.linux.conf.json`。
这是官方机制，不是本项目自创 —— 所以 **Windows 侧打包完全不受影响**。

> 字段名已对照 **tauri-utils 2.10.1 源码**逐一核对：
> `MacConfig` 用 `#[serde(rename = "macOS", alias = "macos")]`，
> 所以键名写作 `"macOS"` 是对的；
> `BundleType` 的取值 `App` / `Dmg` 序列化为 `"app"` / `"dmg"`，也对。

### 3.2 npm 脚本

```json
"tauri:build":     "tauri build --no-bundle",   // Windows 用，保持原样
"tauri:build:mac": "tauri build"                // macOS 用，产出 .app + .dmg
```

Windows 上继续用 `pnpm tauri:build`，行为不变。

### 3.3 图标：`icon.icns` 已经准备好了

**macOS 打包强制需要 `.icns`**，原来 `src-tauri/icons/` 里没有。
现已**直接提供** `src-tauri/icons/icon.icns`（61964 字节，合法 ICNS，
含 16/32/64/128/256/512/1024 全套尺寸与掩码），
所以**你不需要先跑 `pnpm tauri icon` 就能打包**。

> 这个 `.icns` 是用 `pnpm tauri icon` 生成的 —— 该命令在 Windows 上也能跑
> （Tauri 自带纯 Rust 的 icns 写入器，不依赖 macOS 的 `iconutil`）。
> 已校验：magic = `icns`、声明长度与实际长度一致、12 个标准成员。
> 同时新增了母图 `src-tauri/icons/icon-1024.png`（1024×1024）。

**既有的 7 个图标文件（`32x32.png` / `128x128.png` / `128x128@2x.png` /
`256x256.png` / `512x512.png` / `icon.png` / `icon.ico`）一个字节都没动** ——
Windows 侧图标不受影响。

**想换图标时**：

```bash
# 方式一（推荐）：从母图一次生成全套（含 icns）
pnpm tauri icon src-tauri/icons/icon-1024.png

# 方式二：重新画一张母图再生成
python3 tools/make_icons.py          # 产出 icons/icon-1024.png
pnpm tauri icon src-tauri/icons/icon-1024.png
```

> ⚠️ `pnpm tauri icon` 会**重写** `icons/` 下所有 PNG/ICO
> （并新增 `android/`、`ios/` 子目录与 Windows Store 的 `Square*Logo.png`）。
> 重新编码后文件字节会变、观感不变。若你在意 Windows 侧图标的字节稳定，
> 就别跑它，直接沿用仓库里的 icns。

> ⚠️⚠️ **`tools/make_icons.py` 已修好，但仍然要小心**。
> 它现在有两道硬闸：找不到带「师」字形的字体 → 直接中止；
> 渲染出来是空的 → 也中止。**两种情况都不会覆盖任何文件**。
> 已实测：把候选字体全指向不存在的路径时，退出码 1 且**一个文件都不写**；
> 在 Windows 上正常运行时，产出的 7 个图标与仓库里的**逐字节完全相同**。

---

## 4. 跑起来（开发）

```bash
cd "/path/to/04_师作TeachDo"
pnpm install
pnpm tauri:dev
```

首次会编译 Rust 依赖，几分钟。

### 4.1 纯浏览器模式也可用（Mac 上同样成立）

```bash
pnpm dev     # http://localhost:5184
```

`src/ui/winctl.ts:19` 在非 Tauri 环境下全部降级为 no-op，
`src/core/llm.ts:103-105` 用 `__TAURI_INTERNALS__` 能力探测而非 UA 判断，
所以浏览器里 AI 调用回落 `fetch`（可能撞 CORS，仅调试用），
窗口控制静默无效但**不会报错**。这条路径在 Mac 上照常可用。

---

## 5. 打包

```bash
pnpm tauri:build:mac
```

产物：

```
src-tauri/target/release/bundle/macos/师作 TeachDo.app
src-tauri/target/release/bundle/dmg/师作 TeachDo_2.0.0_aarch64.dmg
```

### 5.1 验收

```bash
# 架构必须是 arm64
lipo -archs "src-tauri/target/release/bundle/macos/师作 TeachDo.app/Contents/MacOS/teachdo"
# 期望：arm64

# 最低系统版本
/usr/libexec/PlistBuddy -c "Print :LSMinimumSystemVersion" \
  "src-tauri/target/release/bundle/macos/师作 TeachDo.app/Contents/Info.plist"
# 期望：11.0

# 图标确实嵌进去了
ls -la "src-tauri/target/release/bundle/macos/师作 TeachDo.app/Contents/Resources/"
# 期望看到 icon.icns
```

### 5.2 Gatekeeper

没有 Apple 开发者签名/公证，从「下载」目录首次打开会被拦：

```bash
xattr -dr com.apple.quarantine "src-tauri/target/release/bundle/macos/师作 TeachDo.app"
```

或 Finder 里 **右键 → 打开 → 打开**。

> 要做可分发的签名+公证版，需要 Apple Developer 账号并配置
> `bundle.macOS.signingIdentity` + `notarytool`。**本次移植不含签名与公证。**

---

## 6. 功能验收清单

| # | 操作 | 期望 |
|---|---|---|
| 1 | 启动 `.app` | 窗口出现，**红黄绿三键在左上角** |
| 2 | 拖标题栏空白处 | 窗口跟随移动 |
| 3 | 双击标题栏 | 在最大化/还原之间切换 |
| 4 | 点黄键 / 绿键 | 最小化 / 全屏缩放正常 |
| 5 | 点红键 | 窗口关闭，进程退出 |
| 6 | 标题栏右侧 | **只有 4 个按钮**（保存/打开/设置/主题），无自绘窗控 |
| 7 | 品牌「师」字方印 | **不被三键压住**（左侧已留 80px） |
| 8 | ⌘S | 保存项目并弹 toast |
| 9 | 状态条文案 | 有未保存改动时显示 **`有未保存改动 · ⌘S`**（不是 Ctrl+S） |
| 10 | ⚙ 设置 → 填 API Key → 检测连接 | 拉到模型清单（走 Rust `reqwest`，rustls） |
| 11 | 1 备课输入 → 生成教案 | 正常生成（走 `ai_chat`） |
| 12 | 3 课件 → 启动课件 Agent | 逐页生成、画风切换正常 |
| 13 | 6 导出 → 合并打包 | **首次会弹 TCC 授权**；允许后落盘到 `~/Downloads/师作导出/` |
| 14 | 打开导出的 `.docx` | 中文正常显示，**不是豆腐块**；字体显示为 PingFang SC |
| 15 | 打开导出的 `.pptx` | 同上 |
| 16 | 浅色 / 深色切换 | 两套都正常 |
| 17 | 最小窗口尺寸 | 缩到 1024×660 就不再缩 |

### 关于第 9 项（⌘S 文案）

`Titlebar.tsx:54` 与 `Shell.tsx:79` 原来硬编码 `Ctrl+S`。
`App.tsx:80` 的**逻辑本来就同时接受 Cmd**（`e.ctrlKey || e.metaKey`），
所以只是文案不对。现改为读 `platform.ts` 的 `SAVE_HINT`：
macOS → `⌘S`，Windows → `Ctrl+S`（**与原值完全相同**）。

### 关于第 14/15 项（导出字体，这是「功能等价」的一个真实威胁）

先说清一个容易搞错的点：

> **本项目不存在「按字体度量算盒子坐标」这回事。**
> `deck.ts:214 measure()` 是**纯算术估算** ——
> 全角（`charCode > 0xff`）按 `1.0 × fontSize`，半角按 `0.55 × fontSize`，
> **不查任何字体表**。
> 所以 `render.ts` 输出的全部 Box 坐标、折行结果、溢出判定
> **与具体字体无关**，Windows / macOS 完全一致。
> 字体名只出现在 OOXML 的渲染提示位上
> （`<a:latin>` / `<a:ea>` / `<w:rFonts>`）。

于是真正的风险只有一条：**字体缺失导致 Word / PowerPoint 回退到
不含 CJK 字形的字体 → 豆腐块**。

**采用的方案：平台分支给一个「本机一定有」的字体名。**

| | 字体族名 | 依据 |
|---|---|---|
| Windows | `Microsoft YaHei` | **与改动前逐字节相同**，Windows 产物零变化 |
| macOS | `PingFang SC` | macOS 10.11+ 系统内置，无需安装 |

实现在 `src/core/fonts.ts`（新增），`export.ts` 里 4 处硬编码
（原 `:114,200,248`）改为读它。

**为什么不做字体嵌入**（评估过，否决了）：

1. **嵌入 Microsoft YaHei 违反授权** —— 该字体不可再分发；
2. 换成可再分发的思源黑体 / Noto 嵌入，会**同时改掉 Windows 侧产物**，
   违反「Windows 行为必须保持不变」；
3. **换不来版面收益** —— 盒子坐标本就由算术引擎钉死，与字体无关。

**版式会变吗**：PingFang SC 与 Microsoft YaHei 的 CJK 表意字
**都是全角（advance = 1 em）**，正是 `deckRules.cjkWidth = 1.0` 的前提，
所以盒内折行位置一致。差异只落在**半角字符宽度**上
（而半角本来就是 `0.55` 的经验系数）。
**结论：盒内折行不变，字面观感有差异。待 Mac 上验证版式。**

> 若你要把 Mac 生成的产物拿到 **Windows** 打开、且希望字体名也是
> Windows 语义：把 `src/core/fonts.ts` 的
> `EXPORT_FONT_OVERRIDE` 设为 `"Microsoft YaHei"` 即可
> （版面不受影响）。反之亦然。

---

## 7. 已知事项

| 事项 | 说明 | 要做什么 |
|---|---|---|
| `师作 TeachDo.lnk` | Windows 快捷方式，macOS 不认 | 用 `.app`；想要桌面快捷方式就在 Finder 里给 `.app` 做**替身**（⌘L 做别名，拖到桌面） |
| `tauri.conf.json` 的 `identifier` 是 `com.teachdo.desktop` | 未改动 | 它决定 `.app` 的 Bundle ID；若要公证需与开发者账号匹配 |
| `main.rs:2` 的 `windows_subsystem` 属性 | macOS 上静默忽略 | 不是问题，未改动 |
| `Cargo.lock` 里的 `winreg` / `windows-sys` / `webview2-com` | **cfg-gated 传递依赖，macOS 上不编译** | 不用管 |
| `src-tauri/gen/schemas/capabilities.json` 是 `{}` | **生成物**，`tauri dev` / `tauri build` 会重新生成 | 不用管；`cargo check` 时真正的解析结果写在 `target/…/out/capabilities.json` |
| `tools/convert-data.mjs` 原来写死 `S:/dsh/teachdo` | 已改为从 `import.meta.url` 推导项目根 | 已修，见 §8 |
| `app/` 与 `preview/` 目录 | B01 历史原型，不参与构建 | 保留，未改动 |
| `pnpm-workspace.yaml` 的 `allowBuilds` 与 `package.json` 的 `pnpm.onlyBuiltDependencies` | pnpm 新版不再读 `package.json` 里的 `pnpm` 字段（会打印 WARN） | 不影响构建，可忽略 |
| 无签名 / 无公证 | 本次范围之外 | 见 §5.2 |

---

## 8. 本次移植改动的文件一览

| 文件 | 改动 |
|---|---|
| `src-tauri/capabilities/default.json` | **新增**。放行 5 个 `core:window` 命令（阻塞 1） |
| `src-tauri/src/ai.rs` | 新增 `home_dir()`：`HOME` 优先 + `USERPROFILE` 回退（阻塞 2）；TCC 注释 |
| `src-tauri/tauri.macos.conf.json` | **新增**。macOS 专属：`decorations:true` + `titleBarStyle:Overlay`（阻塞 3）、`bundle.active:true` + `targets:["app","dmg"]` |
| `src-tauri/tauri.conf.json` | 仅加 `"label": "main"`（与能力文件的 `windows` 对齐）；**打包开关与 `decorations:false` 未动** |
| `src-tauri/icons/icon.icns` | **新增**。macOS 打包必需，61964 字节 |
| `src-tauri/icons/icon-1024.png` | **新增**。母图，供 `pnpm tauri icon` 重生成 |
| `src/ui/platform.ts` | **新增**。`IS_MAC` / `SAVE_HINT` |
| `src/ui/Titlebar.tsx` | macOS 隐藏自绘三键；`Ctrl+S` → `SAVE_HINT` |
| `src/ui/Shell.tsx` | 状态条 `Ctrl+S` → `SAVE_HINT` |
| `src/ui/winctl.ts` | 五个 `.catch(() => undefined)` → `warn()`，失败不再静默 |
| `src/main.tsx` | macOS 给 `<html>` 打 `data-os="mac"` |
| `src/styles/app.css` | 新增 `html[data-os="mac"]` 两条让位规则 |
| `src/core/fonts.ts` | **新增**。导出字体族名平台分支 |
| `src/core/export.ts` | 4 处硬编码 `Microsoft YaHei` → `FONT`（平台分支） |
| `tools/convert-data.mjs` | `S:/dsh/teachdo` → 从 `import.meta.url` 推导 |
| `tools/make_icons.py` | 路径相对化；补 macOS 字体候选；**两道防覆盖硬闸**；产出 1024 母图 |
| `package.json` | 新增 `tauri:build:mac` 脚本 |
| `README-macOS.md` | **新增**（本文） |
| `README.md` | 补 macOS 章节 |

**未改动**（刻意）：`Cargo.toml`、`Cargo.lock`、`src/lib.rs`、`src/main.rs`、
`src/core/{deck,render,agent,llm,project,prompts,kb,catalog,majors,validate}.ts`、
`src/styles/tokens.css`（字体栈**本来就含** `-apple-system` / `PingFang SC` / `SF Mono`）、
`vite.config.ts`、`src-tauri/build.rs`、`app/`、`preview/`、`tests/`。

---

## 9. 待 Mac 上验证的项

以下是 Windows 上**无法验证**、必须在 Mac 上确认的：

1. **`titleBarStyle: Overlay` 下三键与 44px 标题栏的对齐观感**
   —— 三键位置随 macOS 版本变化，可能要用 `trafficLightPosition` 微调。
2. **`Overlay` 下失焦时不能拖动**（上游 tauri-apps/tauri#4316）
   —— 需确认实际影响范围。
3. **`acceptFirstMouse: true` 的实际手感**（未聚焦时点击是否穿透到 webview）。
4. **首次启动的 TCC 弹窗文案与授权流程**（§2 阻塞 2）。
5. **导出产物的字体观感与版式**（§6 第 14/15 项）——
   盒内折行已论证不变，但**字面观感差异必须实眼看**。
6. **`.dmg` 是否正常生成与挂载**（`bundle.targets: ["app","dmg"]`）。
7. **`icon.icns` 在 Finder / Dock 里的实际显示效果**
   —— 结构已校验合法，但渲染效果未在 macOS 上看过。
8. **arm64 原生编译是否顺利**（`reqwest` + rustls 在 aarch64-apple-darwin 上）。
9. **`pnpm tauri:dev` 的窗口热重载行为**。

---

## 10. Windows 侧未被破坏的证据

| 检查项 | 结果 |
|---|---|
| `cargo check` | ✅ **exit 0**（1m01s，`Finished dev profile`） |
| `tauri-build` 解析能力文件 | ✅ 5 个权限全部解析成功 |
| `home_dir()` Windows 分支 | ✅ `USERPROFILE` 仍优先，取值与原实现一致 |
| `pnpm build`（`tsc --noEmit && vite build`） | ✅ **exit 0**，63 模块，无类型错误 |
| `tauri.conf.json` 的 `decorations` | ✅ 仍为 `false` |
| `tauri.conf.json` 的 `bundle.active` | ✅ 仍为 `false` |
| 既有 7 个图标文件 | ✅ 逐字节未变（SHA256 比对） |
| `tauri.macos.conf.json` 是否影响 Windows | ✅ 不会 —— Tauri 只在 macOS 上合并它 |
| `html[data-os="mac"]` CSS | ✅ Windows 不设该属性，规则不命中 |
| `SAVE_HINT` | ✅ Windows 取 `Ctrl+S`，与原硬编码相同 |
| `exportTypeface()` | ✅ Windows 取 `Microsoft YaHei`，与原硬编码相同 |
| `make_icons.py` 重跑产物 | ✅ 与仓库图标逐字节相同 |
| `convert-data.mjs` 重跑产物 | ✅ 与 `src/core/{catalog,majors}.ts` 逐字节相同 |
