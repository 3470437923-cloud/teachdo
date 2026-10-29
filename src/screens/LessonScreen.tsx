/* ============================================================
   师作 TeachDo B02 · 屏 2 教案 LessonScreen.tsx
   教案 = 唯一真源。块编辑（contenteditable）真正写回数据模型
   （B01 只回写 board 一个字段 —— 已修）。
   改动 → 教案重哈希 → 下游课件自动标陈旧。
   ============================================================ */
import { useRef } from "react";
import { useApp, setState, touchProject, progress, progressDone } from "../store";
import { hash, markSlidesStale } from "../core/project";
import { genLesson } from "../core/agent";
import { fullCheck } from "../core/validate";
import { ScreenShell } from "../ui/Shell";

function toast(msg: string, err = false) {
  window.dispatchEvent(new CustomEvent("td-toast", { detail: { msg, err } }));
}

export function LessonScreen() {
  const app = useApp();
  const p = app.proj;
  const L = p.lesson;
  const editTimer = useRef<number | undefined>(undefined);

  if (!L) {
    return (
      <ScreenShell>
        <div className="empty">
          <div className="empty-glyph">▤</div>
          <h1 style={{ fontSize: "var(--fs-title)" }}>还没有教案</h1>
          <div className="sub">先在「备课输入」选好课题，然后生成教案</div>
          <button className="btn btn-primary" onClick={() => setState({ screen: "input" })}>去备课输入</button>
        </div>
      </ScreenShell>
    );
  }

  const linesToArr = (txt: string): string[] =>
    txt.split("\n").map((x) => x.replace(/^\s*\d+[.、]\s*/, "").replace(/^[-·•]\s*/, "").trim()).filter(Boolean);

  const commitEdit = (blk: string, el: HTMLElement) => {
    const txt = el.innerText;
    if (blk === "objectives") L.objectives = linesToArr(txt);
    else if (blk === "keypoints") {
      const key = txt.match(/重点[:：]?\s*([\s\S]*?)(?:难点[:：]|$)/);
      const hard = txt.match(/难点[:：]?\s*([\s\S]*)/);
      if (key) L.keypoints.key = key[1].trim();
      if (hard) L.keypoints.hard = hard[1].trim();
    } else if (blk === "board") L.board = txt;
    else if (blk === "homework") {
      L.homework = linesToArr(txt).map((ln) => {
        const m = ln.match(/^【(.+?)】\s*(.*)$/);
        return m ? { level: m[1], task: m[2] } : { level: "基础", task: ln };
      });
    }
    L.hash = hash(L);
    markSlidesStale(p);
    p.checks = fullCheck(L, p.input, p.pkg);
    p.dirty = true;
    touchProject();
  };

  const editable = (blk: string) => ({
    contentEditable: true,
    suppressContentEditableWarning: true,
    onInput: (e: React.FormEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const host = el.closest(".blk");
      host?.classList.remove("synced");
      host?.classList.add("edited");
      window.clearTimeout(editTimer.current);
      editTimer.current = window.setTimeout(() => commitEdit(blk, el), 700);
    },
    onBlur: (e: React.FocusEvent<HTMLDivElement>) => commitEdit(blk, e.currentTarget),
  });

  const doGen = async () => {
    try {
      progress("开始生成教案…");
      await genLesson(p, (m) => progress(m));
      progressDone();
      touchProject();
    } catch (e) {
      progressDone();
      toast("生成失败：" + (e instanceof Error ? e.message : String(e)), true);
    }
  };

  const checks = p.checks || [];
  const okN = checks.filter((c) => c.level === "ok").length;
  const warnN = checks.filter((c) => c.level !== "ok").length;

  return (
    <ScreenShell
      side={{
        title: "强约束校验",
        body: (
          <>
            <div style={{ marginBottom: 8 }}>
              <span className="badge badge-ok">{okN} 通过</span>{" "}
              <span className="badge badge-warn">{warnN} 提示</span>
            </div>
            {checks.map((c, k) => (
              <div key={k} className={"chk " + c.level}>
                <div className="ic">{c.level === "ok" ? "✓" : c.level === "warn" ? "!" : "✕"}</div>
                <div className="t">{c.t}</div>
              </div>
            ))}
            <hr className="hairline" />
            <button className="btn btn-sm" style={{ width: "100%" }}
              onClick={() => { p.checks = fullCheck(L, p.input, p.pkg); touchProject(); }}>
              重新校验
            </button>
            <hr className="hairline" />
            <div className="cap" style={{ lineHeight: 1.7 }}>
              教案是唯一真源：这里的任何修改都会让下游课件标记为「陈旧」，到课件屏可一键重做陈旧页。
            </div>
          </>
        ),
      }}
      action={
        <>
          <span className="cap">改完教案后，下游课件自动标为陈旧</span>
          <span className="sp" />
          <button className="btn" onClick={() => void doGen()}>重新生成教案</button>
          <button className="btn btn-primary" onClick={() => setState({ screen: "deck" })}>生成课件 →</button>
        </>
      }
    >
      <div className="lesson-doc">
        <div className="doc-title-row">
          <h1>{L.meta.topic || p.input.topic} · 教案</h1>
          <span className="sp" style={{ flex: 1 }} />
          <span className="badge">{L.stages.length} 环节 · {p.input.minutes}′</span>
        </div>

        <div className="blk synced">
          <div className="blk-line" />
          <div className="blk-head"><span className="blk-kind">基本信息</span></div>
          <div className="blk-body">
            学段：{p.input.stage}　学科：{p.input.subject}　教材：{p.input.version}{p.input.grade}{p.input.term}　单元：{p.input.unit || "—"}
            <br />课标依据：{L.basis?.length ? L.basis.map((b) => `[${b}]`).join(" ") : "—"}
          </div>
        </div>

        <div className="blk synced">
          <div className="blk-line" />
          <div className="blk-head"><span className="blk-kind">教学目标</span><span className="sp" style={{ flex: 1 }} /><span className="cap">点击可改</span></div>
          <div className="blk-body" {...editable("objectives")}>
            {L.objectives.map((o, k) => <p key={k}>{k + 1}. {o}</p>)}
          </div>
        </div>

        <div className="blk synced">
          <div className="blk-line" />
          <div className="blk-head"><span className="blk-kind">教学重难点</span></div>
          <div className="blk-body" {...editable("keypoints")}>
            <p><b>重点</b>：{L.keypoints.key || ""}</p>
            <p><b>难点</b>：{L.keypoints.hard || ""}</p>
          </div>
        </div>

        <div className="blk synced">
          <div className="blk-line" />
          <div className="blk-head"><span className="blk-kind">教学过程</span><span className="sp" style={{ flex: 1 }} /><span className="cap">共 {p.input.minutes} 分钟</span></div>
          <div className="blk-body">
            <table>
              <thead><tr><th style={{ width: 150 }}>环节</th><th style={{ width: 44 }}>时长</th><th>教师</th><th>学生</th></tr></thead>
              <tbody>
                {L.stages.map((s, k) => (
                  <tr key={k}>
                    <td><b>{k + 1}</b> {s.name}</td>
                    <td className="mono">{s.minutes}′</td>
                    <td>{s.teacher}</td>
                    <td>{s.student}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="blk synced">
          <div className="blk-line" />
          <div className="blk-head"><span className="blk-kind">板书设计</span></div>
          <div className="blk-body" {...editable("board")}>{L.board}</div>
        </div>

        <div className="blk synced">
          <div className="blk-line" />
          <div className="blk-head"><span className="blk-kind">分层作业</span></div>
          <div className="blk-body" {...editable("homework")}>
            {L.homework.map((h, k) => <p key={k}>【{h.level}】{h.task}</p>)}
          </div>
        </div>
      </div>
    </ScreenShell>
  );
}
