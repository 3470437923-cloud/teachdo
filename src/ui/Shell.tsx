/* ============================================================
   师作 TeachDo B02 · 屏壳 Shell.tsx
   统一结构：主区（滚动内容 + 底栏动作） + 可选右栏面板。
   所有屏共用，保证排布一致。
   ============================================================ */
import { useApp, setState, persistProject, touchProject } from "../store";
import { SCREENS } from "../store";
import type { ScreenId } from "../store";
import { SAVE_HINT } from "./platform";

export function StepsBar() {
  const app = useApp();
  const p = app.proj;
  const hasL = !!p.lesson;
  const hasS = !!(p.slides && p.slides.length);
  const hasC = !!(p.script && p.script.length);
  const hasR = !!p.review;
  const staleN = hasS ? p.slides!.filter((s) => s.status === "stale").length : 0;
  const done: Record<ScreenId, boolean> = {
    input: !!p.input.topic, lesson: hasL, deck: hasS, script: hasC, review: hasR, export: hasL && hasS && hasC,
  };
  const state: Partial<Record<ScreenId, string>> = {
    lesson: hasL ? "已定稿" : "",
    deck: hasS ? (staleN ? `${staleN} 页陈旧` : "已就绪") : "",
    script: hasC ? "已就绪" : "",
  };
  return (
    <nav className="steps-bar">
      {SCREENS.map((s, i) => (
        <span key={s.id} style={{ display: "contents" }}>
          <button
            className={"step-pill" + (app.screen === s.id ? " cur" : "") + (done[s.id] ? " done" : "")}
            onClick={() => setState({ screen: s.id })}
          >
            <span className="s-no">{done[s.id] && app.screen !== s.id ? "✓" : i + 1}</span>
            <span>{s.name}</span>
            {state[s.id] ? <span className="s-state">{state[s.id]}</span> : null}
          </button>
          {i < SCREENS.length - 1 ? <span className="step-arrow">›</span> : null}
        </span>
      ))}
    </nav>
  );
}

export function ScreenShell({ side, action, children, wide }: {
  side?: { title: React.ReactNode; body: React.ReactNode };
  action?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="main">
      <section className="pane pane-main" style={wide ? { overflow: "hidden" } : undefined}>
        <div className="pane-body" style={wide ? { padding: 0, display: "flex", flexDirection: "column" } : undefined}>
          {children}
        </div>
        {action ? <div className="actionbar">{action}</div> : null}
      </section>
      {side ? (
        <aside className="pane pane-side">
          <div className="pane-head">{side.title}</div>
          <div className="pane-body">{side.body}</div>
        </aside>
      ) : null}
    </div>
  );
}

export function StatusBar() {
  const app = useApp();
  const dirty = app.proj.dirty;
  return (
    <footer className="statusbar">
      <span>{app.busy ? app.busy.msg : "师作 TeachDo B02"}</span>
      <span className="grow" />
      {app.callCount > 0 ? <span className="mono">本次会话 · {app.callCount} 次模型调用</span> : null}
      <span className={"stamp " + (dirty ? "draft" : "solid")}>
        <span className="stamp-line" />
        <span>{dirty ? `有未保存改动 · ${SAVE_HINT}` : "已保存"}</span>
      </span>
    </footer>
  );
}

export function useProjectActions() {
  return { persistProject, touchProject };
}
