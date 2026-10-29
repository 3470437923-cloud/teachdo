/* ============================================================
   师作 TeachDo B02 · 导出字体族 export.ts 专用 fonts.ts

   ★ 背景（先纠正一个常见误解）★
   本项目**不存在「按字体度量算盒子坐标」这回事**：
   `deck.ts:214 measure()` 是纯算术估算 ——
     全角（charCode > 0xff）按 1.0 × fontSize，半角按 0.55 × fontSize，
   不查任何字体表。因此 render.ts 输出的全部 Box 坐标、
   折行结果、溢出行判定，**与具体字体无关**，Windows / macOS 完全一致。
   字体名只出现在 OOXML 的渲染提示位上（`<a:latin>` / `<a:ea>` / `<w:rFonts>`）。

   于是「导出产物在 Mac 上会不会走版」的真正风险只有一条：
   字体缺失导致 Word / PowerPoint 回退到**不含 CJK 字形**的字体 → 豆腐块。

   ★ 方案 ★
   平台分支给一个「本机一定有」的字体名：
     · Windows → "Microsoft YaHei"（与改动前逐字节相同，Windows 产物零变化）
     · macOS   → "PingFang SC"（macOS 10.11+ 系统内置，无需安装）
   两家字体的 CJK 表意字都是**全角（advance = 1 em）**，正是
   `deckRules.cjkWidth = 1.0` 的前提，所以盒内折行位置也保持一致；
   差异只落在半角字符的宽度上（而半角本来就是 0.55 的经验系数）。

   ★ 为什么不做字体嵌入 ★
   1) 嵌入 Microsoft YaHei 是**违反授权**的（该字体不可再分发）；
   2) 换成可再分发的思源黑体/Noto 嵌入，会同时改掉 Windows 侧产物，
      违反「Windows 行为必须保持不变」；
   3) 盒子坐标本就由算术引擎钉死，嵌入字体换不来版面收益。
   ============================================================ */

const WINDOWS_FACE = "Microsoft YaHei";
const MACOS_FACE = "PingFang SC";

/**
 * 强制指定导出字体（null = 按平台自动选）。
 *
 * 什么时候需要改它：如果 Mac 上生成的 .docx/.pptx 要拿去 **Windows**
 * 打开、且希望字体名也保持 Windows 语义，把这里设成 `WINDOWS_FACE`
 * 即可（版面不受影响，因为坐标由算术引擎决定）。反之亦然。
 * 默认 null：本机生成的产物用本机字体，最不容易出现豆腐块。
 */
export const EXPORT_FONT_OVERRIDE: string | null = null;

/** 导出 OOXML 时写入的字体族名。 */
export function exportTypeface(): string {
  if (EXPORT_FONT_OVERRIDE) return EXPORT_FONT_OVERRIDE;
  if (typeof navigator !== "undefined" && /Mac OS X|Macintosh/i.test(navigator.userAgent)) {
    return MACOS_FACE;
  }
  return WINDOWS_FACE;
}
