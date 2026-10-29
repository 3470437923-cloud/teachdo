/* ============================================================
   师作 TeachDo B02 · 应用外壳 App.tsx
   标题栏 + 步骤签 + 主屏 + 状态条 + 设置推入层 + 项目模态 + Toast。
   ============================================================ */
import { useEffect, useState } from "react";
import { useApp, setState, getState, touchProject, persistProject, progress, progressDone } from "./store";
import { blankProject, listProjects, loadProject } from "./core/project";
import { Titlebar } from "./ui/Titlebar";
import { StepsBar, StatusBar } from "./ui/Shell";
import { SettingsScreen } from "./screens/SettingsScreen";
import { InputScreen } from "./screens/InputScreen";
import { LessonScreen } from "./screens/LessonScreen";
import { DeckScreen } from "./screens/DeckScreen";
import { ScriptScreen } from "./screens/ScriptScreen";
import { ReviewScreen } from "./screens/ReviewScreen";
import { ExportScreen } from "./screens/ExportScreen";
import { genLesson } from "./core/agent";

/* ---------- Toast 宿主 ---------- */
function ToastHost() {
  const [toast, setToast] = useState<{ msg: string; err: boolean } | null>(null);
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent).detail as { msg: string; err?: boolean };
      setToast({ msg: d.msg, err: !!d.err });
      window.setTimeout(() => setToast(null), 2800);
    };
    window.addEventListener("td-toast", h);
    return () => window.removeEventListener("td-toast", h);
  }, []);
  if (!toast) return null;
  return <div className={"toast" + (toast.err ? " err" : "")}>{toast.msg}</div>;
}

/* ---------- 项目列表模态 ---------- */
function ProjectsModal() {
  const app = useApp();
  if (!app.projectsOpen) return null;
  const list = listProjects();
  const close = () => setState({ projectsOpen: false });
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="打开项目">
        <div className="modal-head">
          打开项目
          <span className="sp" style={{ flex: 1 }} />
          <button className="btn btn-quiet btn-sm" onClick={close}>✕</button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {list.length === 0 ? <div className="cap">还没有保存过项目</div> : list.map((n) => (
            <button key={n} className="row" style={{ padding: "8px 10px", borderRadius: "var(--r-sm)", background: "var(--well)", textAlign: "left" }}
              onClick={() => {
                const p = loadProject(n);
                if (p) {
                  setState({ proj: p, projectsOpen: false, screen: p.lesson ? "lesson" : "input", selSlide: 0 });
                  window.dispatchEvent(new CustomEvent("td-toast", { detail: { msg: "已打开 " + n } }));
                }
              }}>
              <span className="row-name" style={{ flex: 1 }}>{n}</span>
              <span className="cap">打开 →</span>
            </button>
          ))}
          <button className="btn" style={{ marginTop: 6 }}
            onClick={() => { setState({ proj: blankProject(), projectsOpen: false, screen: "input", selSlide: 0 }); }}>
            ＋ 新建项目
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 主工作台 ---------- */
export default function App() {
  const app = useApp();

  /* Ctrl+S 保存 / Esc 关设置 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        persistProject();
        window.dispatchEvent(new CustomEvent("td-toast", { detail: { msg: `已保存项目「${getState().proj.input.topic || "未命名"}」` } }));
      }
      if (e.key === "Escape" && getState().settingsOpen) setState({ settingsOpen: false });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* 屏内容路由 */
  const body =
    app.screen === "input" ? <InputScreen /> :
    app.screen === "lesson" ? <LessonScreen /> :
    app.screen === "deck" ? <DeckScreen /> :
    app.screen === "script" ? <ScriptScreen /> :
    app.screen === "review" ? <ReviewScreen /> :
    <ExportScreen />;

  /* 输入屏点「生成教案 →」：触发真实生成 */
  useEffect(() => {
    const h = () => {
      void (async () => {
        try {
          progress("开始生成教案…");
          await genLesson(getState().proj, (m) => progress(m));
          progressDone();
          touchProject();
        } catch (e) {
          progressDone();
          window.dispatchEvent(new CustomEvent("td-toast", { detail: { msg: "生成失败：" + (e instanceof Error ? e.message : String(e)), err: true } }));
        }
      })();
    };
    window.addEventListener("td-gen-lesson", h);
    return () => window.removeEventListener("td-gen-lesson", h);
  }, []);

  return (
    <div className="app">
      <Titlebar />
      <StepsBar />
      {app.busy ? <div className="runner" /> : null}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative" }}>
        {body}
      </div>
      <StatusBar />
      {app.settingsOpen ? <SettingsScreen /> : null}
      <ProjectsModal />
      <ToastHost />
    </div>
  );
}
