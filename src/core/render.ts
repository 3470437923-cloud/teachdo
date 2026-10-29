/* ============================================================
   师作 TeachDo B02 · 版面引擎 render.ts
   唯一排版真源：Slide IR + 画风 → 定位盒子列表（1280×720）。
   同一份输出同时驱动：
     · 界面预览（React 绝对定位渲染）
     · PPTX 导出（坐标 ×9525 转 EMU）
     · 校验器（溢出/密度检查）
   改版式只改这里，预览与导出永远一致。
   ============================================================ */
import type { Slide, DeckStyle } from "./deck";
import { measure, deckRules, LAYOUT_MAP } from "./deck";

export const CV_W = 1280;
export const CV_H = 720;
const M = 76;             // 页边距
const CW = CV_W - M * 2;  // 版心宽

export interface Box {
  x: number; y: number; w: number; h: number;
  kind: "text" | "bar" | "card" | "rule" | "chip";
  text?: string;
  size?: number;          // px
  color?: string;         // 解析后的具体色值
  bold?: boolean;
  align?: "l" | "c" | "r";
  valign?: "t" | "m";
  lines?: string[];       //  computed 折行结果
  overflow?: boolean;     //  computed 溢出标记
  fill?: string;          // card/bar/chip 填充色
  lineW?: number;         // rule 线宽
}

/* 折行：按宽度估算切行 */
export function wrap(text: string, size: number, width: number): string[] {
  const out: string[] = [];
  let cur = "";
  for (const ch of text) {
    if (ch === "\n") { out.push(cur); cur = ""; continue; }
    if (measure(cur + ch, size) > width && cur) { out.push(cur); cur = ch; }
    else cur += ch;
  }
  if (cur) out.push(cur);
  return out.length ? out : [""];
}

function textBox(
  x: number, y: number, w: number, maxH: number,
  text: string, size: number, color: string,
  opt: Partial<Box> = {}
): Box {
  const lines = wrap(text, size, w);
  const lh = size * deckRules.lineHeight;
  const b: Box = {
    x, y, w, h: Math.min(maxH, lines.length * lh), kind: "text",
    text, size, color, lines, align: "l", valign: "t", ...opt,
  };
  if (lines.length * lh > maxH + 1) b.overflow = true;
  return b;
}

function bar(x: number, y: number, w: number, h: number, fill: string): Box {
  return { x, y, w, h, kind: "bar", fill };
}
function card(x: number, y: number, w: number, h: number, fill: string): Box {
  return { x, y, w, h, kind: "card", fill };
}
function rule(x: number, y: number, w: number, color: string, lineW = 1): Box {
  return { x, y, w, h: lineW, kind: "rule", fill: color, lineW };
}

/* 页脚（血缘 + 页码），封面不画 */
function footer(s: Slide, st: DeckStyle): Box[] {
  return [
    textBox(M, CV_H - 44, CW * 0.7, 24, s.source || "", st.scale.small, st.colors.dim),
    textBox(M + CW * 0.7, CV_H - 44, CW * 0.3, 24, `${s.no}`, st.scale.small, st.colors.dim, { align: "r" }),
  ];
}

/* 页首：kicker + 标题 + 强调短线（内容页通用） */
function head(s: Slide, st: DeckStyle): { boxes: Box[]; nextY: number } {
  const boxes: Box[] = [];
  let y = 56;
  if (s.kicker) {
    boxes.push(textBox(M, y, CW, 26, s.kicker, st.scale.kicker, st.colors.accent, { bold: true }));
    y += 30;
  }
  boxes.push(textBox(M, y, CW, st.scale.title * 1.6, s.title, st.scale.title, st.colors.ink, { bold: true }));
  y += st.scale.title * 1.6 + 10;
  boxes.push(bar(M, y, 54, 5, st.colors.accent));
  return { boxes, nextY: y + 26 };
}

/* 逐行要点（带方形 marker） */
function bulletBoxes(lines: string[], y0: number, st: DeckStyle, opt: { x?: number; w?: number; size?: number; gap?: number } = {}): Box[] {
  const x = opt.x ?? M;
  const w = opt.w ?? CW;
  const size = opt.size ?? st.scale.body;
  const gap = opt.gap ?? 14;
  const boxes: Box[] = [];
  let y = y0;
  const remain = () => CV_H - 64 - y;
  for (const ln of lines) {
    const tb = textBox(x + 26, y, w - 26, remain(), ln, size, st.colors.body);
    boxes.push(bar(x, y + size * 0.42, 9, 9, st.colors.accent));
    boxes.push(tb);
    y += tb.lines!.length * size * deckRules.lineHeight + gap;
  }
  return boxes;
}

export function renderSlide(s: Slide, st: DeckStyle): Box[] {
  const C = st.colors;
  const boxes: Box[] = [];

  switch (s.layout) {
    case "cover": {
      boxes.push(bar(0, 0, CV_W, 10, C.accent));
      const yMid = 240;
      if (s.kicker) boxes.push(textBox(M, yMid, CW, 30, s.kicker, st.scale.kicker + 2, C.accent, { bold: true }));
      boxes.push(textBox(M, yMid + 40, CW, st.scale.coverTitle * 1.7, s.title, st.scale.coverTitle, C.ink, { bold: true }));
      const sub = (s.lines || [])[0];
      if (sub) boxes.push(textBox(M, yMid + 40 + st.scale.coverTitle * 1.7 + 18, CW, 60, sub, st.scale.body, C.dim));
      boxes.push(textBox(M, CV_H - 56, CW, 24, "师作 TeachDo", st.scale.small, C.dim));
      break;
    }
    case "toc": {
      const h = head(s, st);
      boxes.push(...h.boxes);
      let y = h.nextY + 6;
      (s.lines || []).forEach((ln, i) => {
        boxes.push(textBox(M, y, 56, 40, String(i + 1).padStart(2, "0"), st.scale.title - 4, C.accent, { bold: true }));
        const tb = textBox(M + 66, y + 2, CW - 66, CV_H - 64 - y, ln, st.scale.body + 2, C.ink);
        boxes.push(tb);
        y += tb.lines!.length * (st.scale.body + 2) * deckRules.lineHeight + 16;
      });
      boxes.push(...footer(s, st));
      break;
    }
    case "section": {
      boxes.push(bar(M, 200, 6, 190, C.accent));
      if (s.kicker) boxes.push(textBox(M + 30, 210, CW - 30, 30, s.kicker, st.scale.kicker + 2, C.accent, { bold: true }));
      boxes.push(textBox(M + 30, 250, CW - 30, 120, s.title, 56, C.ink, { bold: true }));
      const sub = (s.lines || [])[0];
      if (sub) boxes.push(textBox(M + 30, 380, CW - 30, 60, sub, st.scale.body, C.dim));
      boxes.push(...footer(s, st));
      break;
    }
    case "bigidea": {
      if (s.kicker) boxes.push(textBox(M, 120, CW, 28, s.kicker, st.scale.kicker, C.accent, { bold: true, align: "c" }));
      const big = s.big?.text || s.title;
      boxes.push(textBox(M + 40, 220, CW - 80, 240, big, 44, C.ink, { bold: true, align: "c", valign: "m" }));
      const sub = s.big?.sub;
      if (sub) boxes.push(textBox(M + 120, 500, CW - 240, 40, sub, st.scale.body, C.dim, { align: "c" }));
      boxes.push(bar(CV_W / 2 - 27, 470, 54, 5, C.accent));
      boxes.push(...footer(s, st));
      break;
    }
    case "bignum": {
      if (s.kicker) boxes.push(textBox(M, 110, CW, 28, s.kicker, st.scale.kicker, C.accent, { bold: true, align: "c" }));
      const big = s.big?.text || s.title;
      boxes.push(textBox(M, 170, CW, 260, big, 190, C.accent, { bold: true, align: "c", valign: "m" }));
      const sub = s.big?.sub || s.title;
      boxes.push(textBox(M + 120, 470, CW - 240, 90, sub, st.scale.body + 2, C.body, { align: "c" }));
      boxes.push(...footer(s, st));
      break;
    }
    case "qa": {
      boxes.push(bar(0, 0, CV_W, 6, C.accent));
      if (s.kicker) boxes.push(textBox(M, 130, CW, 28, s.kicker, st.scale.kicker, C.dim, { align: "c" }));
      const q = s.big?.text || s.title;
      boxes.push(textBox(M + 60, 240, CW - 120, 200, q, 46, C.ink, { bold: true, align: "c", valign: "m" }));
      boxes.push(textBox(M, 480, CW, 30, "想一想，写下来，等会儿请你来说", st.scale.body - 2, C.dim, { align: "c" }));
      boxes.push(...footer(s, st));
      break;
    }
    case "bullets":
    case "summary": {
      const h = head(s, st);
      boxes.push(...h.boxes);
      boxes.push(...bulletBoxes(s.lines || [], h.nextY + 10, st));
      boxes.push(...footer(s, st));
      break;
    }
    case "board": {
      const h = head(s, st);
      boxes.push(...h.boxes);
      const areaY = h.nextY + 4;
      boxes.push(card(M, areaY, CW, CV_H - 64 - areaY - 10, C.soft));
      boxes.push(...bulletBoxes(s.lines || [], areaY + 22, st, { x: M + 24, w: CW - 48, size: st.scale.body }));
      boxes.push(...footer(s, st));
      break;
    }
    case "twocol":
    case "compare": {
      const h = head(s, st);
      boxes.push(...h.boxes);
      const top = h.nextY + 6;
      const colW = (CW - 28) / 2;
      const colH = CV_H - 64 - top - 8;
      (s.cols || []).slice(0, 2).forEach((c, i) => {
        const x = M + i * (colW + 28);
        boxes.push(card(x, top, colW, colH, C.soft));
        boxes.push(bar(x, top, colW, 4, C.accent));
        boxes.push(textBox(x + 22, top + 18, colW - 44, 34, c.h, st.scale.body + 2, C.ink, { bold: true }));
        boxes.push(...bulletBoxes(c.lines || [], top + 62, st, { x: x + 22, w: colW - 44, size: st.scale.body - 2, gap: 10 }));
      });
      if (s.layout === "compare") boxes.push({ x: M + colW + 13.5, y: top + 12, w: 1, h: colH - 24, kind: "rule", fill: C.dim, lineW: 1 });
      boxes.push(...footer(s, st));
      break;
    }
    case "steps": {
      const h = head(s, st);
      boxes.push(...h.boxes);
      let y = h.nextY + 8;
      (s.steps || []).forEach((sp, i) => {
        const r = 17;
        boxes.push({ x: M, y: y + 2, w: r * 2, h: r * 2, kind: "chip", fill: C.accent });
        boxes.push(textBox(M, y + 2, r * 2, r * 2, String(i + 1), st.scale.body, st.id === "modern" || st.dark ? "#0f1115" : "#ffffff", { bold: true, align: "c", valign: "m" }));
        const hb = textBox(M + 48, y, CW * 0.32, 34, sp.h, st.scale.body, C.ink, { bold: true });
        boxes.push(hb);
        if (sp.d) boxes.push(textBox(M + 48 + CW * 0.32 + 12, y + 2, CW - 48 - CW * 0.32 - 12, 60, sp.d, st.scale.body - 3, C.body));
        const rowH = Math.max(40, hb.lines!.length * st.scale.body * deckRules.lineHeight);
        if (i < (s.steps || []).length - 1) boxes.push({ x: M + r - 0.5, y: y + 2 + r * 2, w: 1, h: 24, kind: "rule", fill: C.dim, lineW: 1 });
        y += rowH + 24;
      });
      boxes.push(...footer(s, st));
      break;
    }
    case "timeline": {
      const h = head(s, st);
      boxes.push(...h.boxes);
      const items = s.steps || [];
      const n = Math.max(items.length, 1);
      const axisY = 380;
      boxes.push({ x: M, y: axisY, w: CW, h: 2, kind: "rule", fill: C.dim, lineW: 2 });
      items.forEach((sp, i) => {
        const cx = M + (CW / n) * i + CW / n / 2;
        boxes.push({ x: cx - 7, y: axisY - 7, w: 14, h: 14, kind: "chip", fill: C.accent });
        const bw = CW / n - 24;
        const up = i % 2 === 0;
        const by = up ? axisY - 150 : axisY + 26;
        boxes.push(textBox(cx - bw / 2, by, bw, 34, sp.h, st.scale.body, C.ink, { bold: true, align: "c" }));
        if (sp.d) boxes.push(textBox(cx - bw / 2, by + 36, bw, 80, sp.d, st.scale.body - 4, C.body, { align: "c" }));
      });
      boxes.push(...footer(s, st));
      break;
    }
    case "table": {
      const h = head(s, st);
      boxes.push(...h.boxes);
      const t = s.table;
      if (t && t.head.length) {
        const cols = t.head.length;
        const cellW = CW / cols;
        let y = h.nextY + 8;
        const rowH = 46;
        t.head.forEach((hd, i) => {
          const x = M + i * cellW;
          boxes.push(card(x, y, cellW, rowH, C.accent));
          boxes.push(textBox(x + 10, y, cellW - 20, rowH, hd, st.scale.body - 2, st.dark ? "#0f1115" : "#ffffff", { bold: true, valign: "m" }));
        });
        y += rowH;
        (t.rows || []).slice(0, 6).forEach((row, ri) => {
          row.forEach((cell, ci) => {
            const x = M + ci * cellW;
            boxes.push(card(x, y, cellW, rowH, ri % 2 === 0 ? C.soft : C.bg));
            boxes.push(textBox(x + 10, y, cellW - 20, rowH, cell, st.scale.body - 3, C.body, { valign: "m" }));
          });
          y += rowH;
        });
      }
      boxes.push(...footer(s, st));
      break;
    }
    case "quote": {
      boxes.push(textBox(M, 130, 120, 120, "「", 96, C.accent, { bold: true }));
      const qt = s.quote?.text || s.title;
      boxes.push(textBox(M + 100, 220, CW - 200, 220, qt, 34, C.ink, { align: "c", valign: "m" }));
      if (s.quote?.from) boxes.push(textBox(M + 100, 470, CW - 200, 32, "—— " + s.quote.from, st.scale.body, C.dim, { align: "r" }));
      boxes.push(bar(CV_W / 2 - 27, 530, 54, 5, C.accent));
      boxes.push(...footer(s, st));
      break;
    }
    case "activity": {
      const h = head(s, st);
      boxes.push(...h.boxes);
      const a = s.activity;
      const top = h.nextY + 6;
      boxes.push(card(M, top, CW, 120, C.soft));
      boxes.push(textBox(M + 26, top + 18, 90, 30, "任务", st.scale.body, C.accent, { bold: true }));
      boxes.push(textBox(M + 110, top + 18, CW - 140, 90, a?.task || s.title, st.scale.body + 2, C.ink, { bold: true }));
      let chipX = M;
      const chipY = top + 138;
      if (a?.group) {
        boxes.push({ x: chipX, y: chipY, w: measure(a.group, st.scale.small + 2) + 32, h: 30, kind: "chip", fill: C.accent });
        boxes.push(textBox(chipX, chipY, measure(a.group, st.scale.small + 2) + 32, 30, a.group, st.scale.small + 2, st.dark ? "#0f1115" : "#ffffff", { align: "c", valign: "m", bold: true }));
        chipX += measure(a.group, st.scale.small + 2) + 44;
      }
      if (a?.minutes) {
        const t = `${a.minutes} 分钟`;
        boxes.push({ x: chipX, y: chipY, w: measure(t, st.scale.small + 2) + 32, h: 30, kind: "chip", fill: C.dim });
        boxes.push(textBox(chipX, chipY, measure(t, st.scale.small + 2) + 32, 30, t, st.scale.small + 2, st.dark ? "#0f1115" : "#ffffff", { align: "c", valign: "m", bold: true }));
      }
      if (a?.rules?.length) boxes.push(...bulletBoxes(a.rules, chipY + 52, st, { size: st.scale.body - 2 }));
      boxes.push(...footer(s, st));
      break;
    }
    case "homework": {
      const h = head(s, st);
      boxes.push(...h.boxes);
      let y = h.nextY + 10;
      (s.homework || []).forEach((hw) => {
        const tagW = measure(hw.level, st.scale.body) + 36;
        boxes.push({ x: M, y, w: tagW, h: 40, kind: "chip", fill: C.accent });
        boxes.push(textBox(M, y, tagW, 40, hw.level, st.scale.body, st.dark ? "#0f1115" : "#ffffff", { bold: true, align: "c", valign: "m" }));
        const tb = textBox(M + tagW + 20, y + 2, CW - tagW - 20, 80, hw.task, st.scale.body, C.body, { valign: "m" });
        boxes.push(tb);
        y += Math.max(56, tb.lines!.length * st.scale.body * deckRules.lineHeight + 16);
      });
      boxes.push(...footer(s, st));
      break;
    }
  }
  return boxes;
}

/* ============================================================
   校验器：渲染一遍，收集程序可判的问题
   ============================================================ */
export interface SlideIssue { no: number; level: "bad" | "warn"; msg: string }

export function validateSlide(s: Slide, st: DeckStyle): SlideIssue[] {
  const out: SlideIssue[] = [];
  const spec = LAYOUT_BUDGET(s.layout);
  if (s.title && s.title.length > spec.title && spec.title > 0)
    out.push({ no: s.no, level: "warn", msg: `标题「${s.title.slice(0, 12)}…」超过 ${spec.title} 字预算` });
  if (s.kicker && s.kicker.length > spec.kicker)
    out.push({ no: s.no, level: "warn", msg: "眉题过长" });
  if ((s.lines || []).length > spec.lines && spec.lines > 0)
    out.push({ no: s.no, level: "bad", msg: `要点 ${(s.lines || []).length} 行，超过 ${spec.lines} 行上限` });
  (s.lines || []).forEach((ln) => {
    if (spec.line > 0 && ln.length > spec.line)
      out.push({ no: s.no, level: "warn", msg: `单行「${ln.slice(0, 10)}…」超过 ${spec.line} 字` });
  });
  (s.cols || []).forEach((c) => {
    if (c.lines.length > spec.colLines) out.push({ no: s.no, level: "bad", msg: `栏「${c.h}」超过 ${spec.colLines} 行` });
    c.lines.forEach((ln) => { if (ln.length > spec.colLine) out.push({ no: s.no, level: "warn", msg: `栏内单行超 ${spec.colLine} 字` }); });
  });
  if (s.big && spec.big > 0 && s.big.text.length > spec.big)
    out.push({ no: s.no, level: "bad", msg: `主视觉文字超过 ${spec.big} 字` });
  (s.table?.rows || []).forEach((r) => r.forEach((cell) => {
    if (spec.cell > 0 && cell.length > spec.cell) out.push({ no: s.no, level: "warn", msg: `表格单元格「${cell.slice(0, 8)}…」超 ${spec.cell} 字` });
  }));
  /* 渲染级溢出（折行后超出版心） */
  const boxes = renderSlide(s, st);
  boxes.forEach((b) => {
    if (b.overflow) out.push({ no: s.no, level: "bad", msg: `「${(b.text || "").slice(0, 12)}…」渲染后溢出页面` });
  });
  return out;
}

function LAYOUT_BUDGET(id: Slide["layout"]) {
  return LAYOUT_MAP[id].budget;
}

/* 整 deck 校验 */
export function validateDeck(slides: Slide[], st: DeckStyle): SlideIssue[] {
  const out: SlideIssue[] = [];
  if (slides.length < deckRules.minPages) out.push({ no: 0, level: "warn", msg: `共 ${slides.length} 页，少于建议下限 ${deckRules.minPages} 页` });
  if (slides.length > deckRules.maxPages) out.push({ no: 0, level: "bad", msg: `共 ${slides.length} 页，超过上限 ${deckRules.maxPages} 页` });
  if (slides[0] && slides[0].layout !== "cover") out.push({ no: 1, level: "bad", msg: "第 1 页必须是封面" });
  const last = slides[slides.length - 1];
  if (last && last.layout !== "homework" && last.layout !== "summary")
    out.push({ no: last.no, level: "warn", msg: "最后一页建议是作业或总结" });
  slides.forEach((s) => {
    if (!s.source) out.push({ no: s.no, level: "bad", msg: "缺少 source（环节血缘）" });
    out.push(...validateSlide(s, st));
  });
  return out;
}
