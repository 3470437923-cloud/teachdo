/* ============================================================
   师作 TeachDo B02 · 项目模型 project.ts
   单一真源 + 血缘：输入 → ContextPackage → 教案(真源) → 课件 → 讲稿
   ============================================================ */
import type { Standard, OpenClassSkeleton, StageProfile } from "./kb";
import type { Unit } from "./catalog";
import type { Slide } from "./deck";

/* ---------- 输入 ---------- */
export interface TDInput {
  stage: string;        // 小学/初中/高中/大学
  subject: string;
  system: string;       // 六三制/五四制
  version: string;      // 教材版本
  grade: string;
  term: string;         // 上册/下册
  gradeKey: string;     // 七上 / 必修上册 …
  courseId: string;     // 目录选项 id
  topic: string;
  topicCustom: boolean;
  unit: string;
  minutes: number;
  method: string;       // 教学法
  extra: string;        // 补充要求
  classNote: string;    // 班级学情
  major: string;        // 大学：专业
  majorCourse: string;  // 大学：课程
  majorTopic: string;   // 大学：课题
}

/* ---------- 上下文包 ---------- */
export interface ContextPackage {
  stage: string; subject: string; method: string;
  standards: Standard[];
  skeleton: OpenClassSkeleton;
  profile: StageProfile;
  profileText: string | null;
  courseCtx: Unit[] | null;
  gradeKey: string; version: string; term: string;
  assembledAt: string;
}

/* ---------- 教案（唯一真源） ---------- */
export interface LessonStage {
  name: string; minutes: number;
  teacher: string; student: string; intent: string; board: string;
}
export interface Lesson {
  meta: { topic?: string; stage?: string; subject?: string; minutes?: number; basis?: string[] };
  objectives: string[];
  keypoints: { key?: string; hard?: string };
  stages: LessonStage[];
  board: string;
  homework: { level: string; task: string }[];
  reflection: string;
  basis: string[];
  hash: string;
}

/* ---------- 讲稿 ---------- */
export interface ScriptSay { who: "T" | "S" | "A"; text: string }
export interface ScriptPage {
  page: number; title: string; minutes: number; board: string; says: ScriptSay[];
}

/* ---------- 评审 ---------- */
export interface RoleReview {
  role: string; name: string; icon: string; weight: number;
  score?: number; comment?: string;
  stuck?: string[]; confused?: string[]; fake?: string[]; advice?: string[];
}
export interface Arbiter {
  consensus: { text: string; evidence?: string }[];
  divergence: { topic: string; lean?: string; reason?: string; final?: string }[];
}
export interface Review {
  roles: RoleReview[];
  arbiter: Arbiter;
  total: number;
  at: string;
}

/* ---------- 校验结果 ---------- */
export interface Check { level: "ok" | "warn" | "bad"; t: string }

/* ---------- 课件 Agent 对话 ---------- */
export interface ChatMsg { role: "user" | "ai"; text: string }

/* ---------- 项目 ---------- */
export interface Project {
  v: "B02";
  createdAt: string;
  input: TDInput;
  deckStyle: string;              // 画风（课件阶段选择，后置）
  pkg: ContextPackage | null;
  lesson: Lesson | null;
  slides: Slide[] | null;
  script: ScriptPage[] | null;
  review: Review | null;
  checks: Check[];
  slideChat: ChatMsg[];           // 课件 agent 对话记录
  dirty: boolean;
}

export function blankInput(): TDInput {
  return {
    stage: "初中", subject: "语文", system: "六三制", version: "统编版（人教）",
    grade: "七年级", term: "上册", gradeKey: "七上",
    courseId: "", topic: "", topicCustom: false, unit: "",
    minutes: 45, method: "优秀公开课教学",
    extra: "", classNote: "", major: "", majorCourse: "", majorTopic: "",
  };
}

export function blankProject(): Project {
  return {
    v: "B02",
    createdAt: new Date().toISOString(),
    input: blankInput(),
    deckStyle: "",
    pkg: null, lesson: null, slides: null, script: null, review: null,
    checks: [], slideChat: [],
    dirty: false,
  };
}

/* ---------- 血缘哈希 ---------- */
export function hash(o: unknown): string {
  const s = typeof o === "string" ? o : JSON.stringify(o);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/* ---------- 持久化（localStorage） ---------- */
const PROJ_PREFIX = "td2_proj_";
const LAST_KEY = "td2_last";

export function saveProject(p: Project) {
  p.dirty = false;
  localStorage.setItem(PROJ_PREFIX + (p.input.topic || "未命名"), JSON.stringify(p));
  localStorage.setItem(LAST_KEY, p.input.topic || "未命名");
}
export function loadProject(name: string): Project | null {
  try {
    const raw = localStorage.getItem(PROJ_PREFIX + name);
    if (raw) return JSON.parse(raw) as Project;
  } catch { /* 损坏即无 */ }
  return null;
}
export function listProjects(): string[] {
  const out: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PROJ_PREFIX)) out.push(k.slice(PROJ_PREFIX.length));
  }
  return out;
}
export function lastProjectName(): string | null {
  return localStorage.getItem(LAST_KEY);
}
export function deleteProject(name: string) {
  localStorage.removeItem(PROJ_PREFIX + name);
}

/* ---------- 血缘失效传播 ---------- */
export function markSlidesStale(p: Project) {
  if (p.slides && p.lesson) {
    p.slides.forEach((s) => { if (s.srcHash !== p.lesson!.hash) s.status = "stale"; });
  }
}
