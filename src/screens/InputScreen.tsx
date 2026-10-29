/* ============================================================
   师作 TeachDo B02 · 屏 1 备课输入 InputScreen.tsx
   分步卡片向导：壹 面向谁 → 贰 上什么 → 叁 怎么上。
   级联改动只失效真正受影响的下游字段（B01 整屏重渲染丢状态的
   根因在此消除）；大学专业用自绘搜索下拉（B01 原生 select
   重刷丢选中态的修复）。画风不在本阶段 —— 已后置到课件屏。
   ============================================================ */
import { useEffect, useMemo, useRef, useState } from "react";
import * as CAT from "../core/catalog";
import * as MJ from "../core/majors";
import * as KB from "../core/kb";
import { useApp, setState, touchProject } from "../store";
import type { TDInput } from "../core/project";
import { assemble } from "../core/agent";

/* ---------- 自绘搜索下拉（专业） ---------- */
function MajorCombo({ value, onPick }: { value: string; onPick: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const hits = useMemo(() => MJ.search(q).slice(0, 60), [q]);

  return (
    <div className="combo" ref={ref}>
      <button type="button" className="a-form-input" style={{ textAlign: "left", cursor: "pointer" }}
        onClick={() => { setOpen((v) => !v); setQ(""); }}>
        <span style={{ color: value ? "var(--tx-1)" : "var(--tx-dim)" }}>
          {value || "搜索并选择专业…"}
        </span>
      </button>
      {open ? (
        <div className="combo-pop">
          <input autoFocus className="a-form-input" style={{ margin: 4, width: "calc(100% - 8px)" }}
            placeholder="输入专业名，如：计算机 / 法学 / 护理" value={q} onChange={(e) => setQ(e.target.value)} />
          {hits.length === 0 ? <div className="combo-empty">无匹配专业 —— 可留空并在下方手输课题</div> : hits.map((m) => (
            <button key={m.major} type="button" className={"combo-item" + (m.major === value ? " on" : "")}
              onClick={() => { onPick(m.major); setOpen(false); }}>
              {m.major}<span className="cat">{m.cat}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- 步骤壳 ---------- */
function WizStep({ no, title, done, open, onHead, children }: {
  no: number; title: string; done: boolean; open: boolean;
  onHead: () => void; children: React.ReactNode;
}) {
  return (
    <section className={"wiz-step" + (done && !open ? " done" : "") + (open ? " cur" : "")}>
      <button type="button" className="wiz-head" onClick={onHead}>
        <span className="wiz-no">{done && !open ? "✓" : no}</span>
        <span className="wiz-title">{title}</span>
        <span className="sp" style={{ flex: 1 }} />
        {done && !open ? <span className="wiz-sum">已完成，点击修改</span> : null}
      </button>
      {open ? <div className="wiz-body">{children}</div> : null}
    </section>
  );
}

export function InputScreen() {
  const app = useApp();
  const p = app.proj;
  const i = p.input;
  const [openStep, setOpenStep] = useState<number | null>(
    i.topic ? (p.pkg ? null : 3) : 1
  );

  const set = (patch: Partial<TDInput>) => {
    Object.assign(p.input, patch);
    touchProject();
  };

  /* ---------- 级联派生数据 ---------- */
  const isUni = i.stage === "大学";
  const subjList = CAT.subjects[i.stage] || [];
  const verList = CAT.versions[i.subject] || ["人教版"];
  const gradeList = CAT.grades(i.stage, i.system);
  const bookKeys = isUni ? [] : CAT.bookKeys(i.stage, i.subject, i.version);

  /* 高中册键跟随 上册/下册 */
  const gradeKey = useMemo(() => {
    if (isUni) return "";
    if (i.stage === "高中") {
      if (bookKeys.length) return i.term === "上册" ? bookKeys[0] : (bookKeys[1] || bookKeys[0]);
      return "必修上册";
    }
    const g = (i.grade || "").replace(/年级|册/g, "");
    return g + (i.term === "上册" ? "上" : "下");
  }, [isUni, i.stage, i.grade, i.term, i.subject, i.version, bookKeys.join("|")]);

  const units = useMemo(
    () => (isUni ? null : CAT.get(i.stage, i.subject, i.version, gradeKey)),
    [isUni, i.stage, i.subject, i.version, gradeKey]
  );

  /* 课题选项：目录 → 课题(+分课) 扁平化 */
  const topicOptions = useMemo(() => {
    const out: { id: string; label: string; unit: string }[] = [];
    (units || []).forEach((u, ui) => {
      u.lessons.forEach((ls, li) => {
        const base = `u${ui}l${li}`;
        if (ls.parts?.length) {
          ls.parts.forEach((pt, pi) => out.push({ id: `${base}p${pi}`, label: `${ls.title} · ${pt}`, unit: u.unit }));
        } else {
          out.push({ id: base, label: ls.title, unit: u.unit });
        }
      });
    });
    return out;
  }, [units]);

  /* 大学课程 topics */
  const courseList = i.major ? MJ.coursesOf(i.major) : [];
  const courseTopics = courseList.find((c) => c.course === i.majorCourse)?.topics || [];

  /* ---------- 级联事件（只失效真正下游） ---------- */
  const pickStage = (stage: string) => {
    const list = CAT.subjects[stage] || [];
    const patch: Partial<TDInput> = { stage, courseId: "", topicCustom: false };
    if (list.length && !list.includes(i.subject)) patch.subject = list[0];
    if (patch.subject || stage === "大学") {
      const vl = CAT.versions[patch.subject || i.subject] || ["人教版"];
      patch.version = vl[0];
    }
    if (stage === "大学") { patch.grade = ""; patch.gradeKey = ""; }
    else {
      const gl = CAT.grades(stage, i.system);
      if (!gl.includes(i.grade)) patch.grade = gl[0] || "";
    }
    set(patch);
    setOpenStep(2);
  };
  const pickSubject = (subject: string) => {
    const vl = CAT.versions[subject] || ["人教版"];
    set({ subject, version: vl.includes(i.version) ? i.version : vl[0], courseId: "", topic: i.topicCustom ? i.topic : "", unit: "" });
  };
  const pickSystem = (system: string) => {
    const gl = CAT.grades(i.stage, system);
    set({ system, grade: gl.includes(i.grade) ? i.grade : (gl[0] || i.grade), courseId: "" });
  };
  const pickVersion = (version: string) => set({ version, courseId: "" });
  const pickGrade = (grade: string) => set({ grade, courseId: "" });
  const pickTerm = (term: string) => set({ term, courseId: "" });
  const pickTopic = (id: string) => {
    if (id === "__custom__") { set({ topicCustom: true, courseId: "" }); return; }
    const opt = topicOptions.find((o) => o.id === id);
    if (opt) set({ topicCustom: false, courseId: id, topic: opt.label, unit: opt.unit });
  };
  const pickMajor = (major: string) => set({ major, majorCourse: "", majorTopic: "" });
  const pickCourse = (course: string) => {
    set({ majorCourse: course, majorTopic: "" });
  };

  const methods = [...new Set(KB.openClass.map((s) => s.method))];

  /* ---------- 完成判定 ---------- */
  const step1Done = !!i.subject || isUni;
  const step2Done = isUni
    ? (!!i.major || i.topicCustom || !!i.majorTopic)
    : (!!i.topic && (i.topicCustom || !!i.courseId));
  const step3Done = i.minutes > 0 && !!i.method;

  const canGenerate = !!i.topic && step3Done;

  const doGen = () => {
    if (!canGenerate) return;
    assemble(p);
    touchProject();
    setOpenStep(null);
    setState({ screen: "lesson", settingsOpen: false });
    window.dispatchEvent(new CustomEvent("td-gen-lesson"));
  };

  return (
    <div className="wizard">
      <div style={{ marginBottom: 2 }}>
        <h1 style={{ fontSize: "var(--fs-title)", fontWeight: 700, letterSpacing: "var(--tr-title)" }}>新建备课</h1>
        <div className="cap">选定对象与课题 → 装配课标上下文 → 生成教案三件套</div>
      </div>

      {/* 壹 · 面向谁 */}
      <WizStep no={1} title="面向谁上课" done={step1Done} open={openStep === 1}
        onHead={() => setOpenStep(openStep === 1 ? (step2Done ? null : 2) : 1)}>
        <div>
          <label className="label">学段</label>
          <div className="seg" style={{ maxWidth: 320 }}>
            {["小学", "初中", "高中", "大学"].map((s) => (
              <button key={s} className={i.stage === s ? "on" : ""} onClick={() => pickStage(s)}>{s}</button>
            ))}
          </div>
        </div>
        {!isUni ? (
          <div>
            <label className="label">学科</label>
            <select className="field" style={{ maxWidth: 240 }} value={i.subject} onChange={(e) => pickSubject(e.target.value)}>
              {subjList.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        ) : (
          <div className="cap">大学走「专业 → 课程 → 课题」，在下一步选择。</div>
        )}
        <div>
          <label className="label">班级学情（可留空，AI 按学段默认画像）</label>
          <textarea className="field" rows={2} placeholder="例如：阅读理解中等偏下，发言积极但易跑题……"
            value={i.classNote} onChange={(e) => set({ classNote: e.target.value })} />
        </div>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-primary btn-sm" onClick={() => setOpenStep(2)}>下一步：选课题 →</button>
        </div>
      </WizStep>

      {/* 贰 · 上什么 */}
      <WizStep no={2} title={isUni ? "专业与课题" : "教材与课题"} done={step2Done} open={openStep === 2}
        onHead={() => setOpenStep(openStep === 2 ? (step3Done ? null : 3) : 2)}>
        {isUni ? (
          <>
            <div className="grid2">
              <div className="span2">
                <label className="label">专业（搜索选取，无则留空手输课题）</label>
                <MajorCombo value={i.major} onPick={pickMajor} />
              </div>
              <div>
                <label className="label">课程</label>
                <select className="field" value={i.majorCourse} disabled={!i.major}
                  onChange={(e) => pickCourse(e.target.value)}>
                  <option value="">{i.major ? "— 选择核心课程 —" : "先选专业"}</option>
                  {courseList.map((c) => <option key={c.course}>{c.course}</option>)}
                </select>
              </div>
              <div>
                <label className="label">课题</label>
                <input className="field" placeholder={i.majorCourse ? "点上方候选或手输" : "手输课题名"}
                  value={i.majorTopic}
                  onChange={(e) => {
                    const v = e.target.value;
                    set({ majorTopic: v, topic: v || i.majorCourse, topicCustom: !courseTopics.includes(v) });
                  }} />
                {courseTopics.length ? (
                  <div className="row" style={{ flexWrap: "wrap", marginTop: 6, gap: 5 }}>
                    {courseTopics.map((t) => (
                      <button key={t} type="button" className={"chip" + (i.majorTopic === t ? " on" : "")}
                        onClick={() => set({ majorTopic: t, topic: t, topicCustom: false })}>{t}</button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            {!i.major && i.topic ? (
              <div className="cap">当前课题（自定义）：{i.topic}</div>
            ) : null}
            {!i.major && (
              <div>
                <label className="label">或直接手输课题（不选专业）</label>
                <input className="field" placeholder="例如：《乡土中国》整本书阅读导引"
                  value={i.topicCustom ? i.topic : ""}
                  onChange={(e) => set({ topic: e.target.value, topicCustom: true })} />
              </div>
            )}
          </>
        ) : (
          <div className="grid2">
            <div>
              <label className="label">学制</label>
              <div className="seg">
                {CAT.systems.map((s) => (
                  <button key={s} className={i.system === s ? "on" : ""} onClick={() => pickSystem(s)}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">教材版本</label>
              <select className="field" value={i.version} onChange={(e) => pickVersion(e.target.value)}>
                {verList.map((v) => <option key={v}>{v}</option>)}
              </select>
              {!units ? <div className="cap" style={{ marginTop: 3 }}>该版本无独立目录，回落 {verList[0]} 参考</div> : null}
            </div>
            {i.stage !== "高中" ? (
              <div>
                <label className="label">年级</label>
                <select className="field" value={i.grade} onChange={(e) => pickGrade(e.target.value)}>
                  {gradeList.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="label">分册</label>
                <select className="field" value={i.term} onChange={(e) => pickTerm(e.target.value)}>
                  {CAT.terms.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            )}
            {i.stage !== "高中" ? (
              <div>
                <label className="label">册次</label>
                <div className="seg">
                  {CAT.terms.map((t) => (
                    <button key={t} className={i.term === t ? "on" : ""} onClick={() => pickTerm(t)}>{t}</button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="span2">
              <label className="label">课题（含实际教学分课）</label>
              <select className="field" value={i.topicCustom ? "__custom__" : i.courseId}
                onChange={(e) => pickTopic(e.target.value)}>
                <option value="__custom__">✎ 自定义课题…</option>
                {topicOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              {i.topicCustom ? (
                <input className="field" style={{ marginTop: 6 }} placeholder="输入课题名…" autoFocus
                  value={i.topic} onChange={(e) => set({ topic: e.target.value })} />
              ) : null}
            </div>
          </div>
        )}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-primary btn-sm" onClick={() => setOpenStep(3)}>下一步：教法与课时 →</button>
        </div>
      </WizStep>

      {/* 叁 · 怎么上 */}
      <WizStep no={3} title="教法与课时" done={step3Done} open={openStep === 3}
        onHead={() => setOpenStep(openStep === 3 ? null : 3)}>
        <div className="grid2">
          <div>
            <label className="label">课时长度（分钟）</label>
            <input className="field" type="number" min={5} max={240} value={i.minutes}
              onChange={(e) => set({ minutes: parseInt(e.target.value, 10) || 45 })} />
          </div>
          <div>
            <label className="label">单元说明（自动，可改）</label>
            <input className="field" placeholder="由课题自动带出" value={i.unit}
              onChange={(e) => set({ unit: e.target.value })} />
          </div>
          <div className="span2">
            <label className="label">教学方法</label>
            <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
              {methods.map((m) => (
                <button key={m} type="button" className={"chip" + (i.method === m ? " on" : "")}
                  onClick={() => set({ method: m })}>{m}</button>
              ))}
            </div>
          </div>
          <div className="span2">
            <label className="label">补充要求（教学意图、必须讲到的点）</label>
            <textarea className="field" rows={2} placeholder="例如：重点讲清某处细节；不要过度煽情；结尾留开放问题"
              value={i.extra} onChange={(e) => set({ extra: e.target.value })} />
          </div>
        </div>
      </WizStep>

      <div className="row" style={{ marginTop: 4 }}>
        <span className="cap">
          课标库 {KB.standards.length} 条 · 骨架 {KB.openClass.length} 套 ·
          {isUni ? ` 专业库 ${MJ.allMajors().length} 个` : " 课题目录 K12 全学段"}
        </span>
        <span className="sp" />
        <button className="btn" onClick={() => { assemble(p); touchProject(); }}>装配上下文预览</button>
        <button className="btn btn-primary" disabled={!canGenerate} onClick={() => void doGen()}>
          生成教案 →
        </button>
      </div>
    </div>
  );
}
