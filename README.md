# 师作 TeachDo B02

**教师备课工作台** —— 一次备课，教案 / 课件 / 讲稿 三件套同源生成。

B02 是一次大修：Tauri 原生窗口、React + TypeScript 技术栈、
课件从「一次 JSON 填充」升级为「真 Agent 逐页设计」、设置界面补齐
检测连接 / 模型清单拉取 / 具名配置、画风选择后置到课件阶段。

## 快速开始

1. 双击桌面 **「师作 TeachDo」** 快捷方式（原生窗口，可拖拽 / 缩放 / 最大化。
   Windows 是无框 + 自绘窗控；macOS 用系统原生红黄绿三键）
2. 右上角 **⚙ 设置** → 选平台（DeepSeek / 通义 / 月之暗面 / OpenAI / 自定义）
   → 填 API Key → 自动**检测连接**并拉取模型清单 → 下拉选模型
   → 可存多条**具名配置**一键切换；有**省 token 模式**开关（默认关）
3. **1 备课输入**：三步卡片 —— 面向谁（学段/学科/学情）→ 上什么
   （K12 级联选题 / 大学专业搜索选课）→ 怎么上（课时/教法/补充要求）
4. **2 教案**（唯一真源）：块可直接点击修改；改动后下游课件自动标**陈旧**
5. **3 课件**：启动课件 Agent（策划 → 逐页设计 → 逐页自检修复）；
   顶部**画风条 8 套即时换肤**；画布点文字直接改；右栏对 **Agent 说人话**
   改页（拆页/换版式/插页/删页）；陈旧页一键重做
6. **4 讲稿**：逐页绑定课件，含预设学生回答；时长反推体检
7. **5 冷读评审**：学生 / 教研员 / 督导三评委独立评审（评委看到的是
   **课件逐页版式摘要**，不只是大纲文本），仲裁层汇总共识与分歧
8. **6 导出**：合并 ZIP 或分开保存，落盘到 `下载/师作导出/`
   （Windows `%USERPROFILE%\Downloads`，macOS `$HOME/Downloads`）；
   均含可核验**引用清单**（+ 评审报告），免责证据链完整

## 开发 / 构建

```
pnpm install          # 前端依赖
pnpm dev              # 浏览器开发（5184 端口，AI 调用回落 fetch）
pnpm build            # tsc 类型检查 + vite 打包
pnpm tauri:dev        # 原生窗口开发
pnpm tauri:build      # Windows：src-tauri 下 cargo build --release → 产 exe
pnpm tauri:build:mac  # macOS：产 .app + .dmg（见 README-macOS.md）
```

技术栈：React 19 + TypeScript + Vite 7 + Tauri 2（Windows 无框窗口 / macOS 原生标题栏）。
AI 请求与导出落盘走 Rust 命令（避开 WebView CORS）。

### macOS（Apple Silicon）

完整步骤见 [`README-macOS.md`](README-macOS.md)。三条要点先记在这里：

1. **窗口外壳按平台分流**，差异全在 `src-tauri/tauri.macos.conf.json`：
   Windows 保持 `decorations: false`（无框 + 自绘窗控），
   macOS 用系统原生红黄绿三键（`decorations: true` + `titleBarStyle: "Overlay"`）。
   Tauri 只在 macOS 上合并这个文件，**Windows 侧不受影响**。
2. **`src-tauri/capabilities/default.json` 不能删**。
   Tauri 2 的 `@tauri-apps/api/window` 是 core 命令，必须授权；
   删了它窗口就拖不动、关不掉（且错误会被降级吞掉，很难查）。
3. **导出字体按平台分支**（`src/core/fonts.ts`）：
   Windows `Microsoft YaHei` / macOS `PingFang SC`。
   版面盒子坐标由 `render.ts` 的算术引擎决定，**与字体无关**。

## 架构主线：单一真源 + 血缘

```
输入 ──→ 教案(唯一真源) ──→ 课件(Slide IR) ──→ 讲稿
            ↑ 你手改           ↑ 画风/手编/Agent 改
       下游自动标 stale    版面引擎 render.ts
                          （预览与 PPTX 导出同一坐标系）
```

## 课件引擎（B02 核心重做）

- **Slide IR 与画风解耦**：`src/core/deck.ts` 定义 16 种教学版式原型
  （封面/学习地图/环节页/核心观点/关键词特写/要点/双栏/对比/流程/
  时间线/表格/金句/板书/活动/提问/总结/作业），每种带字数预算；
  8 套完整画风 token。换画风 = 即时重渲染，不动内容。
- **Agent 回路**（`src/core/agent.ts`）：策划案（整 deck 页面方案）→
  逐页设计（元素级内容）→ 程序化自检（预算/溢出/密度/血缘）→
  不合格回灌修复 → 对话式局部手术（rewrite/split/insert/delete）。
- **版面引擎**（`src/core/render.ts`）：1280×720 坐标系算盒子列表，
  界面预览与 PPTX 导出（`src/core/export.ts`，坐标 ×9525 转 EMU）
  消费同一份输出 —— 所见即所导。
- **省 token 模式**：设置里开关（默认关）。开启后单次生成整 deck
  （1–3 次调用）；关闭时走完整 Agent 回路（约 10–20 次调用）。

## 内置知识资产（全自研，零三方素材）

| 资产 | 内容 | 位置 |
|---|---|---|
| 课标摘录库 | 26 条 · 义教 2022 版 + 高中 2017/2020 版，每条带可核验出处 | `src/core/kb.ts` |
| 公开课骨架库 | 6 套教学结构骨架，只取环节结构 | `src/core/kb.ts` |
| 课题目录 | K12 全学段：学段→学科→版本→年级册→单元→课题→分课 | `src/core/catalog.ts` |
| 大学课程库 | 12 门类 · 90 专业 · 核心课程 + 课题 | `src/core/majors.ts` |
| 课件设计库 | 16 版式原型 + 8 画风 + 数值化视觉规则 | `src/core/deck.ts` |
| 强约束 Prompt | 红线 / 证据 / 模板 / 格式 / 校验 / 修复 六层 | `src/core/prompts.ts` |
| 校验器 | 时长自洽 / 课标核验 / 学段词汇 / AI 套话 / 版式预算 / 溢出 | `src/core/validate.ts` `render.ts` |
| 导出器 | ZIP + DOCX + PPTX（OOXML 全手写，含 CRC32） | `src/core/export.ts` |

## 安全与合规

- 课标引用必须带出处，未命中内置库一律非法（校验器拦截）
- 公开课只入库结构骨架，不复制任何原文表述
- AI 套话负向清单命中即拦；学段词汇越界拦截
- 导出包必带引用清单 + 评审报告，教研活动免责证据链

## 隐私

所有数据只存在**本机 localStorage** 与你主动导出的文件里。
API Key 仅存本机，只发往你配置的模型服务商。

## 界面

- **浅色（默认）**：晨雾白冷调，纯灰阶，适合投影与日常
- **深色**：曜石黑中性石墨阶，无彩色系，适合长时间备课
- 设计纪律：实色明度阶梯 / 零渐变零模糊 / 强调色只出现在
  当前状态与主操作两处（tokens → surface → app 三层 CSS 契约）

## B02 已知边界（诚实声明）

- 公开课库仍是自研归纳的结构骨架，实时爬取在 M5
- 课件画布编辑支持标题与要点行的点改；表格/流程等结构化槽位
  的格内编辑走 Agent 对话或重新设计
- 评审的仲裁仍是单轮
- 大学学段暂无国家课标条目，用通用教学法约束代替
- 图表（柱/饼）与配图位暂为占位，真实数据图在下一版
- **macOS 版未签名、未公证**，首次从「下载」目录打开需右键 → 打开
  或 `xattr -dr com.apple.quarantine`（见 `README-macOS.md` §5.2）
- **导出产物的字体在两端不同**（Win 雅黑 / Mac 苹方）。
  版面盒子坐标由算术引擎决定、与字体无关，折行位置一致；
  但字面观感有差异，**待 Mac 上实眼验证**

## 版本沿革

- **B01**（2026-10-10）：纯 HTML/JS 零依赖原型，六屏流水线、
  课题目录、课标核验、手写 OOXML 导出。源码保留在 `app/` 目录作历史参照。
- **B02**（2026-10-10）：Tauri 原生窗口 + React/TS 重构；
  课件引擎重做（Agent 回路 / 16 版式 / 画风后置 / 所见即所导）；
  设置补齐（检测连接 / 模型清单 / 具名配置 / 省 token）；
  输入向导化并修复大学选课；教案块编辑真正写回数据模型。
- **B02-macOS**：移植到 Apple Silicon / macOS 26。
  补齐 `capabilities/default.json`（Tauri 2 ACL，窗口控制必需）；
  `ai.rs` 的主目录改 `HOME` 优先（原来只读 `USERPROFILE`，
  导致 macOS 上导出 100% 失败）；窗口外壳按平台分流
  （macOS 用系统原生三键）；补 `icon.icns` 与 macOS 打包配置；
  导出字体平台分支。**Windows 侧行为逐项比对未变** —— 见
  [`README-macOS.md`](README-macOS.md) §10。

## 许可

MIT，见 [LICENSE](LICENSE)。
