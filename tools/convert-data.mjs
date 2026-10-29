/* 把 B01 的 app/js/catalog.js 与 majors.js 机械转换为 TS 模块（只改外壳，不动数据） */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/* 项目根 = 本文件所在目录（tools/）的上一级。
   原实现写死 "S:/dsh/teachdo"，换机器/换目录必挂 —— 改为从
   import.meta.url 推导，Windows / macOS 都成立。 */
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/* ---------- catalog.ts ---------- */
let cat = readFileSync(join(ROOT, "app/js/catalog.js"), "utf8");

// 去掉原头部注释与 TD 挂载
cat = cat.replace(/^[\s\S]*?window\.TD = window\.TD \|\| \{\};\s*\n\s*\n?TD\.CAT = \{\};\s*\n/, "");

const header = `/* ============================================================
   师作 TeachDo B02 · 课题目录库（自 B01 app/js/catalog.js 机械转换）
   K12 全学段：学段→学科→学制→版本→年级→册→单元→课题→分课
   原则：默认人教版（统编版语文/道法/历史）；分课反映实际教学
   拆分（课本一节 ≠ 实际一课时），与单元课标对齐。
   ============================================================ */

export interface Lesson { title: string; parts?: string[] }
export interface Unit { unit: string; lessons: Lesson[] }
export type BookCatalog = Record<string, Unit[]>;           // gradeKey → 单元列表
export type SubjectCatalog = Record<string, BookCatalog>;   // 版本 → 册
export type StageCatalog = Record<string, SubjectCatalog>;  // 学科 → 版本
export type CatalogRoot = Record<string, StageCatalog>;     // 学段 → 学科
`;

const footer = `
/** 查询：版本无独立目录时回落到该学科第一个版本（人教版系） */
export function get(stage: string, subject: string, version: string, gradeKey: string): Unit[] | null {
  const s = catalog[stage]; if (!s) return null;
  const sub = s[subject]; if (!sub) return null;
  const v = sub[version] || sub[Object.keys(sub)[0]];
  if (!v) return null;
  return v[gradeKey] || null;
}
export function hasCatalog(stage: string, subject: string): boolean {
  const s = catalog[stage]; return !!(s && s[subject]);
}
/** 某学科在某学段下可用的册键（高中选册用） */
export function bookKeys(stage: string, subject: string, version: string): string[] {
  const sub = catalog[stage]?.[subject];
  if (!sub) return [];
  const v = sub[version] || sub[Object.keys(sub)[0]];
  return v ? Object.keys(v) : [];
}
`;

cat = cat
  .replace(/TD\.CAT\.subjects =/, "export const subjects: Record<string, string[]> =")
  .replace(/TD\.CAT\.systems =/, "export const systems: string[] =")
  .replace(/TD\.CAT\.grades = function\(stage, system\)/, "export function grades(stage: string, system: string): string[]")
  .replace(/TD\.CAT\.terms =/, "export const terms: string[] =")
  .replace(/TD\.CAT\.versions =/, "export const versions: Record<string, string[]> =")
  .replace(/TD\.CAT\.catalog = /, "const catalog: CatalogRoot = ")
  .replace(/TD\.CAT\.catalog\[/g, "catalog[")
  // 去掉尾部旧查询器（用上面的 typed 版本替代）
  .replace(/\/\* -+ 查询器 -+ \*\/[\s\S]*$/, "");

writeFileSync(join(ROOT, "src/core/catalog.ts"), header + cat + footer, "utf8");

/* ---------- majors.ts ---------- */
let mj = readFileSync(join(ROOT, "app/js/majors.js"), "utf8");
mj = mj.replace(/^[\s\S]*?window\.TD = window\.TD \|\| \{\};\s*\n\s*\n?TD\.MAJORS = \{\};\s*\n/, "");

const mjHeader = `/* ============================================================
   师作 TeachDo B02 · 大学专业课程库（自 B01 app/js/majors.js 机械转换）
   按学科门类组织：专业 → 核心课程 → 课程下可拆课题
   ============================================================ */

export interface MajorCourse { course: string; topics: string[] }
`;

const mjFooter = `
export interface MajorEntry { major: string; cat: string }

export function allMajors(): MajorEntry[] {
  const out: MajorEntry[] = [];
  Object.keys(categories).forEach((cat) => {
    categories[cat].forEach((m) => out.push({ major: m, cat }));
  });
  return out;
}
export function search(q: string): MajorEntry[] {
  if (!q) return allMajors();
  const s = q.toLowerCase();
  return allMajors().filter((m) => m.major.toLowerCase().includes(s));
}
export function coursesOf(major: string): MajorCourse[] {
  return courses[major] || [];
}
export function searchCourses(major: string, q: string): MajorCourse[] {
  const list = coursesOf(major);
  if (!q) return list;
  const s = q.toLowerCase();
  return list.filter(
    (c) => c.course.toLowerCase().includes(s) || c.topics.some((t) => t.toLowerCase().includes(s))
  );
}
`;

mj = mj
  .replace(/TD\.MAJORS\.categories =/, "export const categories: Record<string, string[]> =")
  .replace(/TD\.MAJORS\.courses =/, "const courses: Record<string, MajorCourse[]> =")
  .replace(/\/\* -+ 搜索 -+ \*\/[\s\S]*$/, "");

writeFileSync(join(ROOT, "src/core/majors.ts"), mjHeader + mj + mjFooter, "utf8");

console.log("converted: catalog.ts", (header + cat + footer).length, "chars; majors.ts", (mjHeader + mj + mjFooter).length, "chars");
