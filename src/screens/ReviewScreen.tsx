/* ============================================================
   师作 TeachDo B02 · 屏 5 冷读评审 ReviewScreen.tsx
   三评委互不可见 + 仲裁汇总。评审输入含课件逐页版式摘要
   （评委"看到"PPT 的版面与文字量，而不只是大纲文本）。
   ============================================================ */
import { useApp, setState, touchProject, progress, progressDone } from "../store";
import * as KB from "../core/kb";
import { runReview, slideDigests } from "../core/agent";
import { ScreenShell } from "../ui/Shell";

function toast(msg: string, err = false) {
  window.dispatchEvent(new CustomEvent("td-toast", { detail: { msg, err } }));
}

export function ReviewScreen() {
  const app = useApp();
  const p = app.proj;

  if (!p.lesson || !p.slides?.length) {
    return (
      <ScreenShell>
        <div className="empty">
          <div className="empty-glyph">◎</div>
          <h1 style={{ fontSize: "var(--fs-title)" }}>先完成教案与课件</h1>
          <div className="sub">冷读评审需要三件套成品</div>
          <button className="btn btn-primary" onClick={() => setState({ screen: "lesson" })}>去教案</button>
        </div>
      </ScreenShell>
    );
  }

  const doReview = async () => {
    try {
      progress("冷读评审启动…");
      await runReview(p, (m) => progress(m));
      progressDone();
      touchProject();
    } catch (e) { progressDone(); toast("评审失败：" + (e instanceof Error ? e.message : String(e)), true); }
  };

  const R = p.review;

  return (
    <ScreenShell
      side={{
        title: "评委看到的课件摘要",
        body: (
          <div style={{ userSelect: "text", fontSize: "var(--fs-caption)", lineHeight: 1.8, color: "var(--tx-3)", whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)" }}>
            {slideDigests(p)}
          </div>
        ),
      }}
      action={
        <>
          <span className="cap">评审结果随备课包一并导出（免责证据链）</span>
          <span className="sp" />
          <button className="btn btn-primary" onClick={() => setState({ screen: "export" })}>去导出 →</button>
        </>
      }
    >
      <div className="review-doc">
        <div className="doc-title-row">
          <h1 style={{ fontSize: "var(--fs-title)", fontWeight: 700 }}>冷读评审委员会</h1>
          <span className="sp" style={{ flex: 1 }} />
          <span className="badge">三评委 · 互不可见</span>
        </div>
        <div className="cap" style={{ marginBottom: 12, lineHeight: 1.7 }}>
          三位评委只看最终成品（含课件逐页版式摘要），互相看不到；仲裁层汇总共识与分歧。
        </div>

        {!R ? (
          <>
            {KB.roles.map((r) => (
              <div key={r.id} className="role-card">
                <div className="role-head">
                  <span className="role-ava">{r.icon}</span>
                  <div>
                    <div className="role-name">{r.name}</div>
                    <div className="role-sub">{r.focus}</div>
                  </div>
                </div>
                <div className="cap">{r.brief}</div>
              </div>
            ))}
            <button className="btn btn-primary" style={{ width: "100%", marginTop: 4 }} onClick={() => void doReview()}>
              开始评审（约 4 次模型调用）
            </button>
          </>
        ) : (
          <>
            <div className="stat-cards">
              <div className="card stat-card"><div className="n">{R.arbiter.consensus.length}</div><div className="l">共识</div></div>
              <div className="card stat-card"><div className="n" style={{ color: "var(--warn)" }}>{R.arbiter.divergence.length}</div><div className="l">分歧</div></div>
              <div className="card stat-card"><div className="n">{R.total}</div><div className="l">综合分</div></div>
            </div>

            <div className="label" style={{ margin: "4px 0 8px" }}>评委评语</div>
            {R.roles.map((r) => (
              <div key={r.role} className="role-card">
                <div className="role-head">
                  <span className="role-ava">{r.icon}</span>
                  <div>
                    <div className="role-name">{r.name}</div>
                    <div className="role-sub">{(KB.roles.find((x) => x.id === r.role) || {}).focus || ""}</div>
                  </div>
                  <span className="role-score">{r.score ?? "—"}</span>
                </div>
                <p style={{ fontSize: "var(--fs-sub)", color: "var(--tx-2)", lineHeight: 1.7 }}>{r.comment || ""}</p>
                {(r.advice || []).length ? (
                  <div style={{ marginTop: 6 }}>
                    {r.advice!.map((a, k) => <div key={k} className="cap" style={{ marginTop: 2 }}>→ {a}</div>)}
                  </div>
                ) : null}
              </div>
            ))}

            <div className="label" style={{ margin: "12px 0 8px" }}>共识（可直接采）</div>
            {R.arbiter.consensus.map((c, k) => (
              <div key={k} className="card" style={{ marginBottom: 6 }}>
                <div style={{ fontSize: "var(--fs-sub)", color: "var(--tx-1)" }}>✓ {c.text}</div>
                {c.evidence ? <div className="cap" style={{ marginTop: 3 }}>{c.evidence}</div> : null}
              </div>
            ))}

            <div className="label" style={{ margin: "12px 0 8px" }}>分歧（由你决定）</div>
            {R.arbiter.divergence.map((d, k) => (
              <div key={k} className="card" style={{ marginBottom: 6, borderColor: "var(--warn-soft)" }}>
                <div style={{ fontSize: "var(--fs-sub)", fontWeight: 660, color: "var(--tx-1)" }}>⚠ {d.topic}</div>
                <div className="cap" style={{ margin: "5px 0" }}>
                  仲裁倾向：{d.lean || "—"}（{d.reason || ""}）· 最终由你决定
                </div>
              </div>
            ))}

            <button className="btn" style={{ marginTop: 10 }} onClick={() => void doReview()}>重新评审</button>
          </>
        )}
      </div>
    </ScreenShell>
  );
}
