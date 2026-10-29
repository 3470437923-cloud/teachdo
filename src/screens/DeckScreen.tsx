/* ============================================================
   师作 TeachDo B02 · 屏 3 课件 DeckScreen.tsx
   真 Agent 工作台：
     · 风格后置：顶部画风条，点选即时换肤（IR 与画风解耦）
     · 真实预览：与导出同源的版面引擎渲染
     · 画布上点文字直接改（写回 IR，标 edited）
     · Agent 对话：一句话改页（rewrite/split/insert/delete）
     · 陈旧页一键重做（只重做 stale，手编页保留）
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp, setState, touchProject, progress, progressDone } from "../store";
import { STYLES, STYLE_MAP, LAYOUT_MAP, type LayoutId } from "../core/deck";
import { renderSlide, validateSlide } from "../core/render";
import { genDeck, regenStale, applySlideOps } from "../core/agent";
import { hash } from "../core/project";
import { ScreenShell } from "../ui/Shell";
import { SlideCanvas } from "../ui/SlideCanvas";

function toast(msg: string, err = false) {
  window.dispatchEvent(new CustomEvent("td-toast", { detail: { msg, err } }));
}

/* 画布自适应缩放容器 */
function FitCanvas({ children }: { children: (w: number) => React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const cw = el.clientWidth - 24;
      const ch = (el.clientHeight - 24) * (16 / 9);
      setW(Math.max(320, Math.min(cw, ch, 1280)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <div ref={ref} className="canvas-fit">{children(w)}</div>;
}

export function DeckScreen() {
  const app = useApp();
  const p = app.proj;
  const slides = p.slides;
  const style = STYLE_MAP[p.deckStyle || "paper"] || STYLE_MAP.paper;
  const sel = Math.min(app.selSlide, Math.max(0, (slides?.length || 1) - 1));
  const cur = slides?.[sel];
  const [agentMsg, setAgentMsg] = useState("");
  const [sideTab, setSideTab] = useState<"pages" | "agent" | "check">("pages");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [p.slideChat.length]);

  const issues = useMemo(
    () => (slides ? validateSlide(slides[sel], style) : []),
    [slides, sel, style]
  );

  if (!p.lesson) {
    return (
      <ScreenShell>
        <div className="empty">
          <div className="empty-glyph">▦</div>
          <h1 style={{ fontSize: "var(--fs-title)" }}>先定教案</h1>
          <div className="sub">课件由教案派生 —— 教案是唯一真源</div>
          <button className="btn btn-primary" onClick={() => setState({ screen: "lesson" })}>去教案</button>
        </div>
      </ScreenShell>
    );
  }

  const doGen = async () => {
    try {
      progress("课件 Agent 启动…");
      await genDeck(p, (m) => progress(m));
      progressDone();
      touchProject();
      setState({ selSlide: 0 });
    } catch (e) {
      progressDone();
      toast("生成失败：" + (e instanceof Error ? e.message : String(e)), true);
    }
  };

  const doRegenStale = async () => {
    try {
      progress("重做陈旧页…");
      await regenStale(p, (m) => progress(m));
      progressDone();
      touchProject();
      toast("已重做陈旧页");
    } catch (e) { progressDone(); toast("失败：" + (e instanceof Error ? e.message : String(e)), true); }
  };

  const doAgent = async () => {
    const msg = agentMsg.trim();
    if (!msg || !slides) return;
    setAgentMsg("");
    p.slideChat.push({ role: "user", text: msg });
    touchProject();
    try {
      progress("课件 Agent 处理中…");
      const r = await applySlideOps(p, msg, (m) => progress(m));
      progressDone();
      touchProject();
      if (r.changed.length) setState({ selSlide: Math.min(r.changed[0] - 1, slides.length - 1) });
    } catch (e) {
      progressDone();
      p.slideChat.push({ role: "ai", text: "出错了：" + (e instanceof Error ? e.message : String(e)) });
      touchProject();
      toast("Agent 调用失败", true);
    }
  };

  /* 画布文字编辑：改 title / lines 写回 IR */
  const editBox = (kind: "title" | "kicker" | "line", idx: number, text: string) => {
    if (!cur) return;
    if (kind === "title") cur.title = text;
    else if (kind === "kicker") cur.kicker = text;
    else if (cur.lines) cur.lines[idx] = text;
    cur.status = "edited";
    cur.srcHash = p.lesson?.hash || hash(p.lesson);
    p.dirty = true;
    touchProject();
  };

  const staleN = slides ? slides.filter((s) => s.status === "stale").length : 0;

  const pickStyle = (id: string) => {
    p.deckStyle = id;
    p.dirty = true;
    touchProject();
  };

  const sideTitle = (
    <span style={{ display: "flex", gap: 4 }}>
      {([["pages", "页面"], ["agent", "Agent"], ["check", "本页体检"]] as const).map(([k, label]) => (
        <button key={k} className={"chip" + (sideTab === k ? " on" : "")} style={{ padding: "2px 9px" }}
          onClick={() => setSideTab(k)}>{label}</button>
      ))}
    </span>
  );

  const sideBody = sideTab === "pages" ? (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {(slides || []).map((s, i) => (
        <button key={i} className={"page-row" + (i === sel ? " on" : "")} onClick={() => setState({ selSlide: i })}>
          <span className="pn">{String(s.no).padStart(2, "0")}</span>
          <span className="pl">{LAYOUT_MAP[s.layout]?.name || s.layout}</span>
          <span className="pt">{s.title || "(无标题)"}</span>
          <span className={"st" + (s.status === "stale" ? " stale" : s.status === "edited" ? " edited" : "")} />
        </button>
      ))}
      {!slides?.length ? <div className="cap" style={{ padding: 8 }}>还没有课件，点下方「启动课件 Agent」。</div> : null}
    </div>
  ) : sideTab === "agent" ? (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="cap" style={{ marginBottom: 8 }}>
        对课件说人话即可，例：「第 3 页太挤了拆成两页」「P5 换成对比版式」「在 P2 后加一页学习目标」
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div className="agent-log">
          {p.slideChat.map((m, i) => (
            <div key={i} className={"agent-msg " + m.role}>{m.text}</div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>
      <div className="agent-input" style={{ marginTop: 8 }}>
        <input className="field" placeholder="对课件说点什么…" value={agentMsg}
          onChange={(e) => setAgentMsg(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) void doAgent(); }} />
        <button className="btn btn-primary btn-sm" onClick={() => void doAgent()}>发送</button>
      </div>
    </div>
  ) : (
    <div>
      {issues.length === 0 ? (
        <div className="chk ok"><div className="ic">✓</div><div className="t">本页通过版式预算与溢出检查</div></div>
      ) : issues.map((x, k) => (
        <div key={k} className={"chk " + x.level}>
          <div className="ic">{x.level === "warn" ? "!" : "✕"}</div>
          <div className="t">{x.msg}</div>
        </div>
      ))}
      <hr className="hairline" />
      <div className="label">换版式（内容保留，重排）</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {(Object.keys(LAYOUT_MAP) as LayoutId[]).map((lid) => (
          <button key={lid} type="button" className={"chip" + (cur?.layout === lid ? " on" : "")}
            onClick={() => {
              if (!cur) return;
              cur.layout = lid; cur.status = "edited";
              touchProject();
            }}>
            {LAYOUT_MAP[lid].name}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <ScreenShell
      wide
      side={{ title: sideTitle, body: sideBody }}
      action={
        <>
          <div className="style-bar" style={{ flex: 1, minWidth: 0 }}>
            <span className="cap" style={{ marginRight: 2 }}>画风</span>
            {STYLES.map((s) => (
              <button key={s.id} type="button" className={"style-pick" + (p.deckStyle === s.id || (!p.deckStyle && s.id === "paper") ? " on" : "")}
                title={s.desc} onClick={() => pickStyle(s.id)}>
                <span className="sw">{s.swatch.slice(0, 3).map((c) => <i key={c} style={{ background: c }} />)}</span>
                {s.name}
              </button>
            ))}
          </div>
          {staleN > 0 ? <button className="btn" onClick={() => void doRegenStale()}>✦ 重做 {staleN} 页陈旧</button> : null}
          <button className="btn" disabled={!slides?.length} onClick={() => void doGen()}>重新生成课件</button>
          <button className="btn btn-primary" disabled={!slides?.length} onClick={() => setState({ screen: "script" })}>生成讲稿 →</button>
        </>
      }
    >
      {!slides?.length ? (
        <div className="empty">
          <div className="empty-glyph">▦</div>
          <h1 style={{ fontSize: "var(--fs-title)" }}>用 Agent 制作课件</h1>
          <div className="sub" style={{ maxWidth: 420 }}>
            不是模板填充：先策划页面方案，再逐页设计版式与内容，每页过字数预算与溢出自检。
            生成后画风随时一键换，不满意直接对 Agent 说。
          </div>
          <button className="btn btn-primary" onClick={() => void doGen()}>启动课件 Agent</button>
        </div>
      ) : cur ? (
        <div className="deck-wrap" style={{ flex: 1, minHeight: 0 }}>
          {/* 缩略图 */}
          <div className="thumbs">
            {slides.map((s, i) => (
              <div key={i} className={"thumb" + (i === sel ? " on" : "") + (s.status === "stale" ? " stale" : s.status === "edited" ? " edited" : "")}
                onClick={() => setState({ selSlide: i })}>
                <div className="tstate" />
                <div className="thumb-inner">
                  <SlideCanvas slide={s} style={style} width={150} />
                </div>
                <div className="tnum">{s.no}</div>
              </div>
            ))}
          </div>

          {/* 主画布 */}
          <div className="canvas-zone">
            <FitCanvas>
              {(w) => (
                <div style={{ position: "relative" }}>
                  <SlideCanvas slide={cur} style={style} width={w} />
                  {/* 编辑热点层：标题与要点行可点改 */}
                  <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    {renderSlide(cur, style)
                      .filter((b) => b.kind === "text" && b.text && (b.bold || b.size === style.scale.body))
                      .slice(0, 10)
                      .map((b, i) => {
                        const isTitle = b.text === cur.title;
                        const lineIdx = isTitle ? -1 : (cur.lines || []).indexOf(b.text || "");
                        if (!isTitle && lineIdx < 0) return null;
                        const sc = w / 1280;
                        return (
                          <div
                            key={i}
                            contentEditable
                            suppressContentEditableWarning
                            onInput={(e) => editBox(isTitle ? "title" : "line", lineIdx, e.currentTarget.innerText.trim())}
                            title="点击编辑"
                            style={{
                              position: "absolute", pointerEvents: "auto", cursor: "text",
                              left: b.x * sc, top: b.y * sc, width: b.w * sc, height: b.h * sc,
                              outline: "none", borderRadius: 3,
                            }}
                            onFocus={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px var(--accent-line)"; }}
                            onBlur={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                          >
                            {b.text}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </FitCanvas>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="cap">
                P{cur.no} · {LAYOUT_MAP[cur.layout]?.name} · 来源环节「{cur.source || "—"}」·{" "}
                {cur.status === "stale" ? <span style={{ color: "var(--warn)" }}>陈旧（教案已改）</span>
                  : cur.status === "edited" ? <span style={{ color: "var(--accent-text)" }}>已手编</span>
                  : <span style={{ color: "var(--ok)" }}>与教案同步</span>}
              </span>
              <span className="row" style={{ gap: 4 }}>
                <button className="btn btn-sm" disabled={sel === 0} onClick={() => setState({ selSlide: sel - 1 })}>← 上页</button>
                <button className="btn btn-sm" disabled={sel >= slides.length - 1} onClick={() => setState({ selSlide: sel + 1 })}>下页 →</button>
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </ScreenShell>
  );
}
