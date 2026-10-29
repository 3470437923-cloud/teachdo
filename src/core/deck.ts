/* ============================================================
   师作 TeachDo B02 · 课件设计知识库 deck.ts
   三层资产：
     1. 版式原型库（16 种教学版式，每种带槽位与字数预算）
     2. 画风库（8 套完整视觉 token：色阶/字阶/规则）
     3. 视觉规则（密度/留白/对比度的数值约束，程序可执行）
   方法论来源（已消化为自研规则，未复制任何代码与文案）：
     - PPT 设计通则：一页一个中心观点、字号阶梯、留白≥30%、对比度
     - 教学课件惯例：封面/目录/环节页/活动页/板书页/作业页的
       结构模式（参考公开课课件与 AI PPT 工具的版式分类学）
   ============================================================ */

/* ============================================================
   一、Slide IR（中间表示）
   设计原则：IR 与画风解耦 —— 同一份 IR 换画风即时重排，
   这是「画风后置到课件阶段」的技术前提。
   ============================================================ */
export type LayoutId =
  | "cover"     // 封面
  | "toc"       // 学习地图 / 目录
  | "section"   // 环节转场页（大序号 + 环节名）
  | "bigidea"   // 核心观点（一句话大字）
  | "bignum"    // 大数字 / 关键词特写
  | "bullets"   // 标准要点页
  | "twocol"    // 左右双栏
  | "compare"   // 对比双栏（带栏头）
  | "steps"     // 流程阶梯（编号步骤）
  | "timeline"  // 时间线
  | "table"     // 表格
  | "quote"     // 课文金句 / 引用
  | "board"     // 板书快照
  | "activity"  // 课堂活动指令页
  | "qa"        // 提问页（大问题居中）
  | "summary"   // 总结页
  | "homework"; // 分层作业页

export interface SlideCol { h: string; lines: string[] }
export interface SlideStep { h: string; d?: string }
export interface SlideTable { head: string[]; rows: string[][] }
export interface SlideQuote { text: string; from?: string }
export interface SlideBig { text: string; sub?: string }
export interface SlideActivity { task: string; group?: string; minutes?: number; rules?: string[] }
export interface SlideHomework { level: string; task: string }

export interface Slide {
  no: number;
  layout: LayoutId;
  title: string;
  kicker?: string;
  lines?: string[];                 // bullets / toc / summary / board
  cols?: SlideCol[];                // twocol / compare（恰好 2）
  steps?: SlideStep[];              // steps / timeline
  table?: SlideTable;               // table
  quote?: SlideQuote;               // quote
  big?: SlideBig;                   // bigidea / bignum / qa
  activity?: SlideActivity;         // activity
  homework?: SlideHomework[];       // homework
  note?: string;                    // 设计意图（教师用，不上屏）
  source: string;                   // 对应教案环节名（血缘）
  status: "synced" | "edited" | "stale";
  srcHash?: string;                 // 生成时教案哈希
}

/* ============================================================
   二、版式原型库
   每种版式声明：槽位、字数预算（chardbudget，按全角字计）、
   密度上限。校验器按预算拦截，渲染器按槽位排版。
   ============================================================ */
export interface LayoutSpec {
  id: LayoutId;
  name: string;          // 中文名（界面与 prompt 用）
  use: string;           // 适用场景（prompt 用）
  budget: {
    title: number;       // 标题最多全角字数
    kicker: number;      // 眉题
    line: number;        // 单行要点最多字数
    lines: number;       // 要点行数上限
    colLine: number;     // 双栏单行
    colLines: number;    // 双栏行数上限
    big: number;         // 主视觉大字
    cell: number;        // 表格单元格
  };
}

export const LAYOUTS: LayoutSpec[] = [
  { id: "cover", name: "封面", use: "第 1 页：课题 + 学科年级信息",
    budget: { title: 16, kicker: 20, line: 18, lines: 2, colLine: 0, colLines: 0, big: 0, cell: 0 } },
  { id: "toc", name: "学习地图", use: "第 2 页：本课路径 / 要解决的几个问题",
    budget: { title: 14, kicker: 16, line: 16, lines: 5, colLine: 0, colLines: 0, big: 0, cell: 0 } },
  { id: "section", name: "环节页", use: "教学环节之间的转场",
    budget: { title: 12, kicker: 14, line: 16, lines: 1, colLine: 0, colLines: 0, big: 0, cell: 0 } },
  { id: "bigidea", name: "核心观点", use: "全课最重要的一句话",
    budget: { title: 10, kicker: 14, line: 24, lines: 1, colLine: 0, colLines: 0, big: 22, cell: 0 } },
  { id: "bignum", name: "关键词特写", use: "一个字/词/数字承载的品读点",
    budget: { title: 10, kicker: 14, line: 26, lines: 1, colLine: 0, colLines: 0, big: 6, cell: 0 } },
  { id: "bullets", name: "要点页", use: "默认内容页：并列要点",
    budget: { title: 18, kicker: 16, line: 24, lines: 5, colLine: 0, colLines: 0, big: 0, cell: 0 } },
  { id: "twocol", name: "双栏页", use: "两类并列信息（如：现象/原因）",
    budget: { title: 16, kicker: 16, line: 0, lines: 0, colLine: 14, colLines: 5, big: 0, cell: 0 } },
  { id: "compare", name: "对比页", use: "两处文本/两种做法对照",
    budget: { title: 16, kicker: 16, line: 0, lines: 0, colLine: 16, colLines: 5, big: 0, cell: 0 } },
  { id: "steps", name: "流程页", use: "实验步骤 / 解题步骤 / 任务流程",
    budget: { title: 16, kicker: 16, line: 0, lines: 0, colLine: 0, colLines: 0, big: 0, cell: 0 } },
  { id: "timeline", name: "时间线", use: "历史脉络 / 情节发展",
    budget: { title: 16, kicker: 16, line: 0, lines: 0, colLine: 0, colLines: 0, big: 0, cell: 0 } },
  { id: "table", name: "表格页", use: "归纳对比表 / 记录单",
    budget: { title: 16, kicker: 16, line: 0, lines: 0, colLine: 0, colLines: 0, big: 0, cell: 10 } },
  { id: "quote", name: "金句页", use: "课文原句品读 / 名言引用",
    budget: { title: 10, kicker: 14, line: 0, lines: 0, colLine: 0, colLines: 0, big: 0, cell: 0 } },
  { id: "board", name: "板书页", use: "把黑板结构搬上屏（知识结构）",
    budget: { title: 14, kicker: 14, line: 12, lines: 7, colLine: 0, colLines: 0, big: 0, cell: 0 } },
  { id: "activity", name: "活动页", use: "小组任务指令：做什么/怎么分组/几分钟",
    budget: { title: 14, kicker: 14, line: 20, lines: 4, colLine: 0, colLines: 0, big: 0, cell: 0 } },
  { id: "qa", name: "提问页", use: "一个值得想的大问题",
    budget: { title: 10, kicker: 14, line: 0, lines: 0, colLine: 0, colLines: 0, big: 26, cell: 0 } },
  { id: "summary", name: "总结页", use: "收束：本课知识结构",
    budget: { title: 14, kicker: 16, line: 20, lines: 4, colLine: 0, colLines: 0, big: 0, cell: 0 } },
  { id: "homework", name: "作业页", use: "最后一页：分层作业",
    budget: { title: 10, kicker: 14, line: 0, lines: 0, colLine: 0, colLines: 0, big: 0, cell: 0 } },
];

export const LAYOUT_MAP: Record<LayoutId, LayoutSpec> =
  Object.fromEntries(LAYOUTS.map((l) => [l.id, l])) as Record<LayoutId, LayoutSpec>;

/* 给 prompt 用的版式菜单 */
export function layoutMenu(): string {
  return LAYOUTS.map((l) => `- ${l.id}（${l.name}）：${l.use}`).join("\n");
}

/* ============================================================
   三、画风库（8 套完整视觉 token）
   colors 语义：bg 底 / ink 标题墨 / body 正文 / dim 辅助 /
   accent 强调（一套画风只许一个强调色）/ soft 卡片底
   ============================================================ */
export interface DeckStyle {
  id: string;
  name: string;
  desc: string;
  dark?: boolean;
  colors: { bg: string; ink: string; body: string; dim: string; accent: string; soft: string };
  /* 字号阶梯（px，1280×720 画布基准） */
  scale: { coverTitle: number; title: number; kicker: number; body: number; big: number; small: number };
  rules: string[];     // 给 prompt 的画风规则
  swatch: string[];    // 界面色板
}

export const STYLES: DeckStyle[] = [
  { id: "paper", name: "素雅纸本", desc: "留白大 · 克制 · 通用",
    colors: { bg: "#f7f8fa", ink: "#1c2330", body: "#3c4452", dim: "#8a93a6", accent: "#5567c0", soft: "#eef0f5" },
    scale: { coverTitle: 54, title: 34, kicker: 15, body: 20, big: 72, small: 13 },
    rules: ["每页正文不超过 5 行", "强调只用靛青一处", "大留白，文字靠左对齐", "不用图片，只用文字与线条"],
    swatch: ["#f7f8fa", "#5567c0", "#1c2330", "#8a93a6"] },
  { id: "warm", name: "暖阳课堂", desc: "暖色圆润 · 亲和 · 适合小学",
    colors: { bg: "#fdf7ec", ink: "#3a3128", body: "#5a4f42", dim: "#a89a84", accent: "#c9743a", soft: "#f7ecd9" },
    scale: { coverTitle: 56, title: 36, kicker: 16, body: 22, big: 76, small: 14 },
    rules: ["每页不超过 4 行", "字号偏大，低年级友好", "圆角与暖色块", "语气亲切，可带emoji不超过1个"],
    swatch: ["#fdf7ec", "#c9743a", "#5b7a52", "#3a3128"] },
  { id: "modern", name: "现代极简", desc: "深底高对比 · 适合高中/大学",
    colors: { bg: "#0f1115", ink: "#e9edf3", body: "#b9c1cd", dim: "#79828f", accent: "#3b82f6", soft: "#181b21" },
    scale: { coverTitle: 56, title: 36, kicker: 14, body: 20, big: 80, small: 13 },
    rules: ["每页一个中心观点", "大字号少文字", "可用深色底上的高对比色块", "图表优先于段落"],
    swatch: ["#0f1115", "#3b82f6", "#e9edf3", "#79828f"] },
  { id: "chalk", name: "板书风", desc: "粉笔字 · 黑板底 · 有温度",
    colors: { bg: "#20262e", ink: "#ece9e0", body: "#cbc7ba", dim: "#8b8878", accent: "#e0b055", soft: "#262d36" },
    scale: { coverTitle: 54, title: 34, kicker: 15, body: 21, big: 72, small: 13 },
    rules: ["标题有手写感", "可用箭头/圈注等板书语汇", "不用彩色图片", "行列之间留白宽松"],
    swatch: ["#20262e", "#e0b055", "#ece9e0", "#8b8878"], dark: true },
  { id: "indigo", name: "靛青学术", desc: "学报感 · 严谨 · 适合理科",
    colors: { bg: "#f4f6fb", ink: "#16213e", body: "#33405c", dim: "#7d88a3", accent: "#2f4bd7", soft: "#e8ecf7" },
    scale: { coverTitle: 52, title: 33, kicker: 14, body: 20, big: 70, small: 13 },
    rules: ["网格对齐严格", "编号与层级清晰", "强调色只用于关键公式与结论", "每页不超过 5 行"],
    swatch: ["#f4f6fb", "#2f4bd7", "#16213e", "#7d88a3"] },
  { id: "forest", name: "青野自然", desc: "青绿 · 舒展 · 适合生物/地理/语文",
    colors: { bg: "#f3f7f2", ink: "#1e2b22", body: "#40544a", dim: "#8a9a90", accent: "#3d7a52", soft: "#e6efe7" },
    scale: { coverTitle: 54, title: 34, kicker: 15, body: 20, big: 72, small: 13 },
    rules: ["每页不超过 5 行", "可用分隔线组织层次", "强调色取自然绿", "配图只用剪影语汇"],
    swatch: ["#f3f7f2", "#3d7a52", "#1e2b22", "#8a9a90"] },
  { id: "cinnabar", name: "印泥宣纸", desc: "米白底 · 印泥红 · 适合语文/历史",
    colors: { bg: "#f7f3ea", ink: "#2b241c", body: "#4d4438", dim: "#9a8f7c", accent: "#b03a2e", soft: "#efe8d8" },
    scale: { coverTitle: 56, title: 35, kicker: 15, body: 21, big: 76, small: 13 },
    rules: ["标题可用竖排感短句", "强调只用印泥红一处", "宜衬线感的视觉节奏", "金句页优先"],
    swatch: ["#f7f3ea", "#b03a2e", "#2b241c", "#9a8f7c"] },
  { id: "ocean", name: "深海蓝", desc: "深蓝底 · 冷静 · 适合高中理科/大学",
    colors: { bg: "#0e1a2b", ink: "#e8eef7", body: "#b4c2d6", dim: "#7488a3", accent: "#38bdf8", soft: "#152238" },
    scale: { coverTitle: 54, title: 34, kicker: 14, body: 20, big: 76, small: 13 },
    rules: ["每页一个中心观点", "高对比、少文字", "数据与公式用大号字", "强调色只用于关键信息"],
    swatch: ["#0e1a2b", "#38bdf8", "#e8eef7", "#7488a3"], dark: true },
];

export const STYLE_MAP: Record<string, DeckStyle> =
  Object.fromEntries(STYLES.map((s) => [s.id, s]));

/* 按学段推荐默认画风 */
export function defaultStyleFor(stage: string): string {
  if (/小/.test(stage)) return "warm";
  if (/初/.test(stage)) return "paper";
  if (/高中/.test(stage)) return "indigo";
  return "modern"; // 大学
}

/* ============================================================
   四、视觉规则（程序可执行的数值约束）
   ============================================================ */
export const deckRules = {
  minPages: 8,            // 一节课的合理页数下限
  maxPages: 18,
  densityMax: 0.62,       // 单页文字面积占比上限（留白纪律）
  cjkWidth: 1.0,          // 全角字宽 = 字号
  latinWidth: 0.55,       // 半角字宽系数
  lineHeight: 1.5,        // 行距系数
};

/* 文本宽度估算（全角 1.0、半角 0.55） */
export function measure(text: string, fontSize: number): number {
  let w = 0;
  for (const ch of text) {
    w += (ch.charCodeAt(0) > 0xff ? deckRules.cjkWidth : deckRules.latinWidth) * fontSize;
  }
  return w;
}
