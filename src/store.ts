/* ============================================================
   师作 TeachDo B02 · 应用状态 store.ts
   单一可变 store + useSyncExternalStore；项目数据落 localStorage。
   ============================================================ */
import { useSyncExternalStore } from "react";
import type { Project } from "./core/project";
import { blankProject, loadProject, saveProject, lastProjectName } from "./core/project";
import type { LLMSettings } from "./core/llm";
import { loadSettings, saveSettings } from "./core/llm";
import { usage } from "./core/agent";

export type ScreenId = "input" | "lesson" | "deck" | "script" | "review" | "export";
export const SCREENS: { id: ScreenId; name: string }[] = [
  { id: "input", name: "备课输入" },
  { id: "lesson", name: "教案" },
  { id: "deck", name: "课件" },
  { id: "script", name: "讲稿" },
  { id: "review", name: "冷读评审" },
  { id: "export", name: "导出" },
];

export interface AppState {
  proj: Project;
  screen: ScreenId;
  settingsOpen: boolean;
  projectsOpen: boolean;
  selSlide: number;              // 课件屏选中页（0 基）
  busy: null | { msg: string };  // 全局进度
  theme: "light" | "dark";
  callCount: number;             // 本次会话模型调用数
}

let state: AppState = {
  proj: blankProject(),
  screen: "input",
  settingsOpen: false,
  projectsOpen: false,
  selSlide: 0,
  busy: null,
  theme: (localStorage.getItem("td2_theme") as "light" | "dark") || "light",
  callCount: 0,
};

/* 恢复上次项目 */
{
  const last = lastProjectName();
  if (last) {
    const p = loadProject(last);
    if (p) {
      state.proj = p;
      if (p.lesson) state.screen = "lesson";
    }
  }
}

document.documentElement.setAttribute("data-theme", state.theme);

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }

export function getState(): AppState { return state; }
export function setState(patch: Partial<AppState>) {
  state = { ...state, ...patch };
  emit();
}
export function touchProject() {
  state = { ...state, proj: { ...state.proj } };
  emit();
}
export function progress(msg: string) { setState({ busy: { msg }, callCount: usage.calls }); }
export function progressDone() { setState({ busy: null, callCount: usage.calls }); }

export function persistProject() {
  saveProject(state.proj);
  touchProject();
}

/* 设置 */
let settings: LLMSettings = loadSettings();
export function getSettings(): LLMSettings { return settings; }
export function putSettings(s: LLMSettings) {
  settings = s;
  saveSettings(s);
  emit();
}

/* React 绑定 */
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
export function useApp(): AppState {
  return useSyncExternalStore(subscribe, () => state);
}

/* 主题 */
export function toggleTheme() {
  const next = state.theme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("td2_theme", next);
  setState({ theme: next });
}
