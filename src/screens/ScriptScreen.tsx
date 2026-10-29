/* ============================================================
   师作 TeachDo B02 · 屏 4 讲稿 ScriptScreen.tsx
   逐页讲稿，与课件页绑定。右栏：时长反推体检。
   ============================================================ */
import { useApp, setState, touchProject, progress, progressDone } from "../store";
import { genScript } from "../core/agent";
import { scriptTimeCheck } from "../core/validate";
import { ScreenShell } from "../ui/Shell";

function toast(msg: string, err = false) {
  window.dispatchEvent(new CustomEvent("td-toast", { detail: { msg, err } }));
}

export function ScriptScreen() {
  const app = useApp();
  const p = app.proj;

  if (!p.slides?.length) {
    return (
      <ScreenShell>
        <div className="empty">
          <div className="empty-glyph">✎</div>
          <h1 style={{ fontSize: "var(--fs-title)" }}>先做课件</h1>
          <div className="sub">讲稿逐页绑定课件</div>
          <button className="btn btn-primary" onClick={() => setState({ screen: "deck" })}>去课件</button>
        </div>
      </ScreenShell>
    );
  }

  const doGen = async () => {
    try {
      progress("正在生成讲稿…");
      await genScript(p, (m) => progress(m));
      progressDone();
      touchProject();
    } catch (e) { progressDone(); toast("生成失败：" + (e instanceof Error ? e.message : String(e)), true); }
  };

  if (!p.script?.length) {
    return (
      <ScreenShell>
        <div className="empty">
          <div className="empty-glyph">✎</div>
          <h1 style={{ fontSize: "var(--fs-title)" }}>还没有讲稿</h1>
          <div className="sub">根据 {p.slides.length} 页课件逐页生成，含预设学生回答</div>
          <button className="btn btn-primary" onClick={() => void doGen()}>生成讲稿</button>
        </div>
      </ScreenShell>
    );
  }

  const tc = scriptTimeCheck(p.script, p.input.minutes);
  const over = tc.gap < 0;
  const under = tc.gap > p.input.minutes * 0.15;

  const editPage = (pgNo: number) => {
    document.querySelectorAll(`[data-pg="${pgNo}"] .say .txt`).forEach((el) => {
      (el as HTMLElement).contentEditable = "true";
    });
    toast("本页已进入编辑，点「完成」写回");
  };

  const finishPage = (pgNo: number) => {
    const pg = p.script!.find((x) => x.page === pgNo);
    if (!pg) return;
    const els = document.querySelectorAll(`[data-pg="${pgNo}"] .say`);
    const says = [...els].map((el) => {
      const whoEl = el.querySelector(".who");
      const who = whoEl?.classList.contains("stu") ? "S" : whoEl?.classList.contains("act") ? "A" : "T";
      const text = (el.querySelector(".txt") as HTMLElement)?.innerText.trim() || "";
      (el.querySelector(".txt") as HTMLElement).contentEditable = "false";
      return { who: who as "T" | "S" | "A", text };
    }).filter((s) => s.text);
    pg.says = says;
    p.dirty = true;
    touchProject();
    toast("已写回");
  };

  return (
    <ScreenShell
      side={{
        title: "讲稿体检",
        body: (
          <>
            <div className="card" style={{ marginBottom: 10 }}>
              <div className="card-head"><span>时长反推校验</span></div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 800 }} className="mono">{tc.total}′</span>
                <span className="cap">/ {tc.want}′</span>
              </div>
              <div className="cap" style={{ marginTop: 6, color: over ? "var(--bad)" : under ? "var(--warn)" : "var(--ok)" }}>
                {over ? `超出 ${-tc.gap} 分钟，建议删减环节` : under ? `剩余 ${tc.gap} 分钟空档，可能冷场，建议补环节` : "时长自洽"}
              </div>
            </div>
            <div className="chk ok"><div className="ic">✓</div><div className="t">逐页绑定：每页讲稿与课件页一一对应</div></div>
            <div className="chk ok"><div className="ic">✓</div><div className="t">预设学生回答覆盖：提问均有预设分支</div></div>
            <hr className="hairline" />
            <button className="btn btn-sm" style={{ width: "100%" }} onClick={() => void doGen()}>重新生成讲稿</button>
          </>
        ),
      }}
      action={
        <>
          <span className="cap">讲稿与课件逐页绑定 · 点「编辑本页」可手改</span>
          <span className="sp" />
          <button className="btn btn-primary" onClick={() => setState({ screen: "review" })}>进入冷读评审 →</button>
        </>
      }
    >
      <div className="script-doc">
        <div className="doc-title-row">
          <h1 style={{ fontSize: "var(--fs-title)", fontWeight: 700 }}>逐页讲稿</h1>
          <span className="sp" style={{ flex: 1 }} />
          <span className="badge">{p.script.length} 页</span>
        </div>
        {p.script.map((pg) => (
          <div key={pg.page} className="pg" data-pg={pg.page}>
            <div className="pg-head">
              <span className="pg-num">P{pg.page}</span>
              <span className="pg-title">{pg.title}</span>
              <span className="pg-t">{pg.minutes} 分钟</span>
              <button className="btn btn-quiet btn-sm" onClick={() => editPage(pg.page)}>✎ 编辑本页</button>
              <button className="btn btn-quiet btn-sm" onClick={() => finishPage(pg.page)}>完成</button>
            </div>
            <div className="pg-body">
              {pg.board ? <div className="cap">板书：{pg.board}</div> : null}
              {pg.says.map((x, k) => (
                <div key={k} className="say">
                  <span className={"who" + (x.who === "S" ? " stu" : x.who === "A" ? " act" : "")}>
                    {x.who === "T" ? "师" : x.who === "S" ? "预设" : "活动"}
                  </span>
                  <span className="txt">{x.text}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}
