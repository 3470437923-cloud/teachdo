/* ============================================================
   师作 TeachDo B02 · 生成编排 agent.ts
   教案：生成 → 校验 → 修复回路
   课件：真 Agent 回路 —— 策划案 → 逐页设计 → 逐页自检修复
        （省 token 模式：单次出整 deck）
   局部重生成：只重做 stale 页，手编页保留
   对话修改：教师一句话 → ops 手术
   评审：三评委独立 + 仲裁（输入含课件版式摘要）
   ============================================================ */
import * as P from "./prompts";
import * as LLM from "./llm";
import { loadSettings } from "./llm";
import * as KB from "./kb";
import * as VT from "./validate";
import { hash, markSlidesStale } from "./project";
import type { Project, Lesson, ScriptPage, Review, RoleReview } from "./project";
import type { Slide, LayoutId } from "./deck";
import { LAYOUT_MAP, STYLE_MAP, deckRules } from "./deck";
import { validateSlide, validateDeck, renderSlide } from "./render";

export type Progress = (msg: string) => void;

/* 调用计数（界面显示"本次共 N 次模型调用"） */
export const usage = { calls: 0 };
function counted() { usage.calls++; }

function currentStyle(p: Project) {
  return STYLE_MAP[p.deckStyle || "paper"] || STYLE_MAP.paper;
}

/* ============================================================
   上下文装配
   ============================================================ */
export function assemble(p: Project) {
  const input = p.input;
  const standards = KB.selectStandards(input.stage, input.subject);
  const skeleton = KB.openClass.find((s) => s.method === input.method) || KB.openClass[0];
  const profile = KB.profiles[input.stage] || KB.profiles["初中"];
  p.pkg = {
    stage: input.stage, subject: input.subject, method: input.method,
    standards, skeleton, profile,
    profileText: input.classNote || null,
    courseCtx: null,
    gradeKey: input.gradeKey || "", version: input.version || "", term: input.term || "",
    assembledAt: new Date().toISOString(),
  };
  p.dirty = true;
  return p.pkg;
}

/* ============================================================
   教案生成（Stage 1）
   ============================================================ */
export function wrapLesson(raw: Partial<Lesson>): Lesson {
  const L: Lesson = {
    meta: raw.meta || {},
    objectives: raw.objectives || [],
    keypoints: raw.keypoints || {},
    stages: (raw.stages || []).map((s) => ({
      name: s.name || "环节", minutes: s.minutes || 0,
      teacher: s.teacher || "", student: s.student || "",
      intent: s.intent || "", board: s.board || "",
    })),
    board: raw.board || "",
    homework: raw.homework || [],
    reflection: raw.reflection || "",
    basis: (raw.meta && raw.meta.basis) || [],
    hash: "",
  };
  L.hash = hash(L);
  return L;
}

export async function genLesson(p: Project, progress?: Progress): Promise<Lesson> {
  if (!p.pkg) assemble(p);
  const pkg = p.pkg!;
  const system = P.redline(p.input.stage, p.input.subject);
  const task = P.lesson(pkg, p.input);
  const user = P.evidence(pkg) + "\n\n" + task;
  progress && progress("正在生成教案…");
  counted();
  let raw = (await LLM.json(system, user, { temperature: 0.55 })) as Partial<Lesson>;
  let L = wrapLesson(raw);
  let errors = VT.validateLesson(L, p.input, pkg);
  for (let round = 0; round < 2 && errors.length; round++) {
    progress && progress(`校验未通过（${errors.length} 处），修复第 ${round + 1} 轮…`);
    counted();
    raw = (await LLM.json(system, P.repair(task, raw, errors), { temperature: 0.3 })) as Partial<Lesson>;
    L = wrapLesson(raw);
    errors = VT.validateLesson(L, p.input, pkg);
  }
  p.lesson = L;
  p.checks = VT.fullCheck(L, p.input, pkg);
  markSlidesStale(p);
  p.dirty = true;
  return L;
}

/* ============================================================
   课件生成（Stage 2）—— Agent 回路
   ============================================================ */
interface PlanItem { layout: string; purpose: string; source: string; title: string }

function normalizeSlide(raw: Record<string, unknown>, no: number, source: string, srcHash: string): Slide {
  const layout = (typeof raw.layout === "string" && LAYOUT_MAP[raw.layout as LayoutId] ? raw.layout : "bullets") as LayoutId;
  const s: Slide = {
    no, layout,
    title: String(raw.title || ""),
    kicker: raw.kicker ? String(raw.kicker) : undefined,
    lines: Array.isArray(raw.lines) ? raw.lines.map(String) : undefined,
    cols: Array.isArray(raw.cols) ? (raw.cols as []).slice(0, 2).map((c: Record<string, unknown>) => ({
      h: String(c?.h || ""), lines: Array.isArray(c?.lines) ? (c.lines as unknown[]).map(String) : [],
    })) : undefined,
    steps: Array.isArray(raw.steps) ? (raw.steps as []).map((x: Record<string, unknown>) => ({ h: String(x?.h || ""), d: x?.d ? String(x.d) : undefined })) : undefined,
    table: raw.table ? {
      head: Array.isArray((raw.table as { head?: unknown[] }).head) ? ((raw.table as { head: unknown[] }).head).map(String) : [],
      rows: Array.isArray((raw.table as { rows?: unknown[] }).rows) ? ((raw.table as { rows: unknown[][] }).rows || []).map((r) => (r || []).map(String)) : [],
    } : undefined,
    quote: raw.quote ? { text: String((raw.quote as { text?: string }).text || ""), from: (raw.quote as { from?: string }).from } : undefined,
    big: raw.big ? { text: String((raw.big as { text?: string }).text || ""), sub: (raw.big as { sub?: string }).sub } : undefined,
    activity: raw.activity ? {
      task: String((raw.activity as { task?: string }).task || ""),
      group: (raw.activity as { group?: string }).group,
      minutes: (raw.activity as { minutes?: number }).minutes,
      rules: Array.isArray((raw.activity as { rules?: unknown[] }).rules) ? ((raw.activity as { rules: unknown[] }).rules || []).map(String) : undefined,
    } : undefined,
    homework: Array.isArray(raw.homework) ? (raw.homework as []).map((h: Record<string, unknown>) => ({ level: String(h?.level || "基础"), task: String(h?.task || "") })) : undefined,
    note: raw.note ? String(raw.note) : undefined,
    source: String(raw.source || source || ""),
    status: "synced",
    srcHash,
  };
  return s;
}

/* 单页校验（含修复回路），返回可用页 */
async function designOnePage(
  system: string, pkg: ReturnType<typeof assemble>, lesson: Lesson, planItem: PlanItem,
  input: Project["input"], srcHash: string, no: number, style: ReturnType<typeof currentStyle>,
  progress?: Progress
): Promise<Slide> {
  const task = P.slideDesign(pkg, lesson, planItem, input);
  counted();
  let raw = (await LLM.json(system, P.evidence(pkg) + "\n\n" + task, { temperature: 0.5 })) as Record<string, unknown>;
  let s = normalizeSlide({ ...raw, source: planItem.source }, no, planItem.source, srcHash);
  let issues = validateSlide(s, style);
  for (let round = 0; round < 2 && issues.length; round++) {
    counted();
    const errs = issues.map((i) => i.msg);
    raw = (await LLM.json(system, P.repair(task, raw, errs), { temperature: 0.3 })) as Record<string, unknown>;
    s = normalizeSlide({ ...raw, source: planItem.source }, no, planItem.source, srcHash);
    issues = validateSlide(s, style);
  }
  return s;
}

export async function genDeck(p: Project, progress?: Progress): Promise<Slide[]> {
  if (!p.lesson) throw new Error("请先生成教案");
  if (!p.pkg) assemble(p);
  const pkg = p.pkg!;
  const lesson = p.lesson;
  const style = currentStyle(p);
  const system = P.redline(p.input.stage, p.input.subject);
  const economy = loadSettings().economy;

  let slides: Slide[];

  if (economy) {
    /* 省 token 模式：单次出整 deck */
    progress && progress("（省 token 模式）单次生成整套课件…");
    const task = P.deckOneShot(pkg, lesson, p.input);
    counted();
    let out = (await LLM.json(system, P.evidence(pkg) + "\n\n" + task, { temperature: 0.5 })) as { slides: Record<string, unknown>[] };
    let arr = (out.slides || []).map((r, i) => normalizeSlide(r, i + 1, String(r.source || ""), lesson.hash));
    let issues = validateDeck(arr, style);
    for (let round = 0; round < 2 && issues.some((i) => i.level === "bad"); round++) {
      progress && progress(`课件未通过校验，修复第 ${round + 1} 轮…`);
      counted();
      out = (await LLM.json(system, P.repair(task, out, issues.map((i) => `P${i.no} ${i.msg}`)), { temperature: 0.3 })) as { slides: Record<string, unknown>[] };
      arr = (out.slides || []).map((r, i) => normalizeSlide(r, i + 1, String(r.source || ""), lesson.hash));
      issues = validateDeck(arr, style);
    }
    slides = arr;
  } else {
    /* Agent 模式：策划 → 逐页设计 */
    progress && progress("课件 Agent：策划页面方案…");
    const planTask = P.deckPlan(pkg, lesson, p.input);
    counted();
    let plan = (await LLM.json(system, P.evidence(pkg) + "\n\n" + planTask, { temperature: 0.45 })) as { pages: PlanItem[] };
    if (!Array.isArray(plan.pages) || plan.pages.length < 4) {
      counted();
      plan = (await LLM.json(system, P.repair(planTask, plan, ["pages 数组少于 4 项"]), { temperature: 0.3 })) as { pages: PlanItem[] };
    }
    const pages = (plan.pages || []).slice(0, deckRules.maxPages);
    slides = [];
    for (let i = 0; i < pages.length; i++) {
      const item = pages[i];
      progress && progress(`课件 Agent：设计第 ${i + 1}/${pages.length} 页「${(item.title || "").slice(0, 10)}」…`);
      const s = await designOnePage(system, pkg, lesson, item, p.input, lesson.hash, i + 1, style, progress);
      slides.push(s);
    }
    /* 整 deck 体检（页数/首尾页），坏页不重出（逐页已各自修复过） */
    const deckIssues = validateDeck(slides, style);
    if (deckIssues.some((x) => x.no === 1 && x.level === "bad")) slides[0].layout = "cover";
    const lastS = slides[slides.length - 1];
    if (lastS && lastS.layout !== "homework" && lastS.layout !== "summary") {
      lastS.layout = "homework";
      if (!lastS.homework?.length) {
        lastS.homework = (lesson.homework || []).map((h) => ({ level: h.level, task: h.task }));
        lastS.title = "课后任务";
        lastS.lines = undefined;
      }
    }
  }

  p.slides = slides;
  if (p.script) (p as Project & { scriptStale?: boolean }).scriptStale = true;
  p.dirty = true;
  return slides;
}

/* ---------- 局部重生成：只重做 stale 页 ---------- */
export async function regenStale(p: Project, progress?: Progress): Promise<void> {
  if (!p.slides || !p.lesson) return;
  const stale = p.slides.filter((s) => s.status === "stale");
  if (!stale.length) return;
  if (!p.pkg) assemble(p);
  const pkg = p.pkg!;
  const style = currentStyle(p);
  const system = P.redline(p.input.stage, p.input.subject);
  progress && progress(`重新设计 ${stale.length} 页陈旧课件…`);
  for (const s of stale) {
    const item: PlanItem = { layout: s.layout, purpose: s.note || `承担环节「${s.source}」`, source: s.source, title: s.title };
    progress && progress(`重做 P${s.no}…`);
    const fresh = await designOnePage(system, pkg, p.lesson!, item, p.input, p.lesson!.hash, s.no, style, progress);
    fresh.status = "synced";
    p.slides[s.no - 1] = fresh;
  }
  p.slides.forEach((x) => { if (x.status === "edited") x.srcHash = p.lesson!.hash; });
  p.dirty = true;
}

/* ---------- 对话修改（ops 手术） ---------- */
export interface OpsResult { reply: string; changed: number[] }

export async function applySlideOps(p: Project, userMsg: string, progress?: Progress): Promise<OpsResult> {
  if (!p.slides || !p.lesson) throw new Error("请先生成课件");
  const pkg = p.pkg || assemble(p);
  const system = P.redline(p.input.stage, p.input.subject);
  progress && progress("课件 Agent 正在理解你的要求…");
  counted();
  const out = (await LLM.json(system, P.slideOps(pkg, p.slides, userMsg), { temperature: 0.3 })) as {
    ops: { op: string; no?: number; after?: number; slide?: Record<string, unknown>; slides?: Record<string, unknown>[]; layout?: string; reply?: string }[];
    reply?: string;
  };
  const changed: number[] = [];
  let slides = [...p.slides];
  const srcHash = p.lesson.hash;

  for (const o of out.ops || []) {
    try {
      if (o.op === "rewrite" && o.no && o.slide) {
        const old = slides.find((s) => s.no === o.no);
        const ns = normalizeSlide({ ...o.slide, source: o.slide.source || old?.source || "" }, o.no, String(o.slide.source || old?.source || ""), srcHash);
        ns.status = "edited";
        slides[slides.findIndex((s) => s.no === o.no)] = ns;
        changed.push(o.no);
      } else if (o.op === "relayout" && o.no) {
        const idx = slides.findIndex((s) => s.no === o.no);
        if (idx >= 0 && o.slide) {
          const ns = normalizeSlide(o.slide, o.no, slides[idx].source, srcHash);
          ns.status = "edited";
          slides[idx] = ns;
          changed.push(o.no);
        } else if (idx >= 0 && o.layout) {
          slides[idx] = { ...slides[idx], layout: o.layout as LayoutId, status: "edited" };
          changed.push(o.no);
        }
      } else if (o.op === "split" && o.no && Array.isArray(o.slides) && o.slides.length >= 2) {
        const idx = slides.findIndex((s) => s.no === o.no);
        if (idx >= 0) {
          const parts = o.slides.map((r, i) => {
            const ns = normalizeSlide(r, idx + 1 + i, slides[idx].source, srcHash);
            ns.status = "edited";
            return ns;
          });
          slides.splice(idx, 1, ...parts);
          changed.push(idx + 1);
        }
      } else if (o.op === "delete" && o.no) {
        const idx = slides.findIndex((s) => s.no === o.no);
        if (idx >= 0 && slides.length > 4) { slides.splice(idx, 1); changed.push(o.no); }
      } else if (o.op === "insert" && o.after != null && o.slide) {
        const idx = slides.findIndex((s) => s.no === o.after);
        const ns = normalizeSlide(o.slide, idx + 2, String(o.slide.source || slides[Math.max(idx, 0)]?.source || ""), srcHash);
        ns.status = "edited";
        slides.splice(idx + 1, 0, ns);
        changed.push(idx + 2);
      }
    } catch { /* 单条 op 失败不阻断其余 */ }
  }
  /* 重排页码 */
  slides = slides.map((s, i) => ({ ...s, no: i + 1 }));
  p.slides = slides;
  p.slideChat.push({ role: "user", text: userMsg }, { role: "ai", text: out.reply || (changed.length ? `已修改 ${changed.join("、")} 页` : "没有需要改动的页") });
  (p as Project & { scriptStale?: boolean }).scriptStale = true;
  p.dirty = true;
  return { reply: out.reply || "", changed };
}

/* ============================================================
   讲稿生成（Stage 3）
   ============================================================ */
export async function genScript(p: Project, progress?: Progress): Promise<ScriptPage[]> {
  if (!p.slides || !p.slides.length) throw new Error("请先生成课件");
  const pkg = p.pkg || assemble(p);
  const system = P.redline(p.input.stage, p.input.subject);
  const task = P.script(pkg, p.slides);
  progress && progress("正在生成讲稿…");
  counted();
  const out = (await LLM.json(system, P.evidence(pkg) + "\n\n" + task, { temperature: 0.5 })) as {
    pages: { page: number; title: string; minutes: number; board?: string; says: { who: string; text: string }[] }[];
  };
  p.script = (out.pages || []).map((pg, i) => ({
    page: pg.page || i + 1,
    title: pg.title || "",
    minutes: pg.minutes || 0,
    board: pg.board || "",
    says: (pg.says || []).map((x) => ({ who: (["T", "S", "A"].includes(x.who) ? x.who : "T") as "T" | "S" | "A", text: x.text || "" })),
  }));
  (p as Project & { scriptStale?: boolean }).scriptStale = false;
  p.dirty = true;
  return p.script;
}

/* ============================================================
   课件版式摘要（评审输入：让评委"看到"每页版面）
   ============================================================ */
export function slideDigests(p: Project): string {
  if (!p.slides) return "（未生成课件）";
  const st = currentStyle(p);
  return p.slides.map((s) => {
    const boxes = renderSlide(s, st);
    const textLen = boxes.reduce((a, b) => a + (b.kind === "text" ? (b.text || "").length : 0), 0);
    const spec = LAYOUT_MAP[s.layout];
    const budget = spec ? spec.budget.lines * spec.budget.line : 120;
    const density = textLen > budget ? "文字偏多" : textLen > budget * 0.6 ? "适中" : "疏朗";
    const parts = [`P${s.no} [${s.layout}·${spec?.name || ""}] 「${s.title}」 文字量${textLen}字(${density}) 环节:${s.source}`];
    if (s.lines?.length) parts.push("要点:" + s.lines.join("/"));
    if (s.big?.text) parts.push("主视觉:" + s.big.text);
    if (s.cols?.length) parts.push("栏:" + s.cols.map((c) => c.h).join("|"));
    if (s.steps?.length) parts.push("步骤:" + s.steps.map((x) => x.h).join("→"));
    return parts.join("　");
  }).join("\n");
}

/* ============================================================
   冷读评审（三评委 + 仲裁）
   ============================================================ */
export async function runReview(p: Project, progress?: Progress): Promise<Review> {
  const pkg = p.pkg || assemble(p);
  const digests = slideDigests(p);
  const systemBase = P.redline(p.input.stage, p.input.subject);
  const results: RoleReview[] = [];
  for (const role of KB.roles) {
    progress && progress(`评委「${role.name}」独立评审中…`);
    counted();
    const r = (await LLM.json(systemBase, P.reviewRole(role, pkg, { lesson: p.lesson, slideDigests: digests }), { temperature: 0.7 })) as RoleReview;
    results.push({ ...r, role: role.id, name: role.name, icon: role.icon, weight: role.weight });
  }
  progress && progress("仲裁层汇总中…");
  counted();
  const arb = (await LLM.json(systemBase, P.reviewArbiter(pkg, results), { temperature: 0.3 })) as Review["arbiter"];
  arb.consensus = Array.isArray(arb.consensus) ? arb.consensus : [];
  arb.divergence = Array.isArray(arb.divergence) ? arb.divergence : [];
  const total = Math.round(
    results.reduce((a, r) => a + (r.score ?? 0) * r.weight, 0) / results.reduce((a, r) => a + r.weight, 0)
  );
  p.review = { roles: results, arbiter: arb, total, at: new Date().toISOString() };
  p.dirty = true;
  return p.review;
}
