/* ============================================================
   师作 TeachDo B02 · 强约束 Prompt 体系 prompts.ts
   六层：红线层 / 证据层 / 模板层 / 格式层 / 校验层 / 修复回路
   B02 新增：课件 Agent（策划案 / 逐页设计 / 对话修改）、
   评审输入升级为「课件版式摘要」。
   ============================================================ */
import * as KB from "./kb";
import type { ContextPackage, TDInput, Lesson } from "./project";
import type { Slide } from "./deck";
import { LAYOUT_MAP, layoutMenu } from "./deck";

/* ---------- 红线层（System，每次生成必带） ---------- */
export function redline(stage: string, subject: string): string {
  return [
    `你是一名有 20 年教龄的${stage}${subject}教师，同时为教研组写可直接上课的教学材料。`,
    "【硬红线，违反任何一条本份产物作废】",
    "1. 不得超出国家课程标准范围；所有课标引用必须逐字来自下方「课标摘录」，且保留出处编号，不得凭记忆编造条文。",
    "2. 不得编造文献、名言、数据、史实、人物经历；没有可靠依据就不要写。",
    "3. 不得出现任何考试原题、模拟卷原题或疑似泄题内容。",
    "4. 不得出现涉黄、涉暴、政治敏感、地域歧视、性别刻板内容；例证必须符合该学段学生的年龄与认知。",
    "5. 禁止 AI 套话与空话（详见禁词表）；每句话都要是教师真的会写在教案里的话。",
    "6. 全部输出必须是严格合法的 JSON，不含 Markdown 代码围栏，不含 JSON 以外的任何文字。",
  ].join("\n");
}

/* ---------- 证据层（ContextPackage → prompt） ---------- */
export function evidence(pkg: ContextPackage): string {
  const parts: string[] = [];
  if (pkg.standards.length) {
    parts.push("【课标摘录（唯一合法引用来源，按 id 引用）】");
    pkg.standards.forEach((s) => {
      parts.push(`[${s.id}] ${s.topic}：「${s.quote}」（出处：${s.cite}）`);
    });
  }
  if (pkg.skeleton) {
    parts.push("【公开课结构骨架（只借鉴结构与时间配比，禁止复制其中任何表述）】");
    parts.push(
      pkg.skeleton.name + "：" +
      pkg.skeleton.skeleton.map((x, i) => `${i + 1}.${x.role}（约占${Math.round(x.ratio * 100)}%·${x.form}）`).join(" → ")
    );
    parts.push("板书形态参考：" + pkg.skeleton.board);
  }
  if (pkg.profile) {
    parts.push("【学情画像】" + Object.entries(pkg.profile).map(([k, v]) => `${k}：${v}`).join("；"));
  }
  return parts.join("\n");
}

/* ---------- 教案 ---------- */
export function lesson(pkg: ContextPackage, input: TDInput): string {
  const bookLine = (input.version)
    ? `教材：${input.version} · ${input.grade}${input.term}${input.unit ? " · " + input.unit : ""}`
    : "";
  const uniNote = input.stage === "大学"
    ? `专业：${input.major || "未定"}　课程：${input.majorCourse || "未定"}　课题：${input.majorTopic || input.topic}`
    : "";
  return [
    "任务：为下面这节课生成一份结构化教案。",
    `课题：${input.topic}　学段：${input.stage}　学科：${input.subject}`,
    bookLine,
    uniNote,
    `课时长度：${input.minutes} 分钟`,
    `教学法：${input.method}（必须严格按下方公开课骨架的环节结构组织）`,
    `补充要求：${input.extra || "无"}`,
    "",
    "输出 JSON，结构必须是：",
    '{ "meta":{"topic":"","stage":"","subject":"","minutes":0,"basis":[""]},',
    '  "objectives":["…","…","…"],',
    '  "keypoints":{"key":"…","hard":"…"},',
    '  "stages":[{"name":"…","minutes":0,"teacher":"教师做什么","student":"学生做什么","intent":"设计意图","board":"本环节板书"}],',
    '  "board":"整体板书设计（文字描述）",',
    '  "homework":[{"level":"基础|提升|拓展","task":"…"}],',
    '  "reflection":"教学反思预留问题" }',
    "",
    "约束：",
    "- objectives 恰好 3 条，每条以可观测行为动词开头（说出/圈出/归纳/朗读/比较…），禁止「理解」「掌握」单独作动词。",
    `- stages 的 minutes 之和必须等于 ${input.minutes}；单个环节不超过课时的 42%；每个环节不少于 3 分钟。`,
    "- stages 环节顺序必须与公开课骨架一致（可微调环节名，不可改变骨架逻辑）。",
    "- meta.basis 必须列出本教案引用到的课标摘录 id（至少 1 个），正文凡涉及课标处用 [id] 标注。",
    "- 每个 stage 必须含 teacher/student/intent 三栏；student 栏必须写具体可做的动作，禁止「认真听讲」这类词。",
    "- 禁用词表：" + KB.rules.aiTone.join("、"),
    "- 该学段禁用词汇：" + (KB.rules.vocabCaps[Object.keys(KB.stageKey(input.stage))[0]] || []).join("、"),
  ].join("\n");
}

/* ---------- 课件 · 策划案（Agent 第 1 步） ---------- */
export function deckPlan(pkg: ContextPackage, lesson: Lesson, input: TDInput): string {
  return [
    "任务：根据已定稿教案，为这节课策划一套课件的页面方案。",
    "教案 JSON 如下：",
    JSON.stringify(lesson),
    "",
    "可用版式（id · 名称 · 适用场景）：",
    layoutMenu(),
    "",
    "输出 JSON：",
    '{ "pages":[ { "layout":"cover|toc|section|…", "purpose":"这一页承担什么教学任务", "source":"对应教案环节名", "title":"页面标题" } ] }',
    "",
    "约束：",
    `- 总页数 10–16 页；第 1 页必须是 cover，第 2 页建议 toc（学习地图），最后 1 页必须是 homework。`,
    "- 每个教案环节至少对应 1 页；环节转场可用 section 页。",
    "- 版式要服务于教学内容：步骤类内容用 steps，对比用 compare，表格归纳用 table，品读原句用 quote，提问用 qa，小组任务用 activity。不要通篇 bullets。",
    "- source 必须填教案里的环节名（用于血缘追踪）。",
    "- 课件是给学生看的：不得出现「教学目标」「重难点」这类教师用语。",
    `- 学段：${input.stage}，课时 ${input.minutes} 分钟。`,
  ].join("\n");
}

/* ---------- 课件 · 逐页设计（Agent 第 2 步，每页一次调用） ---------- */
export function slideDesign(pkg: ContextPackage, lesson: Lesson, planItem: { layout: string; purpose: string; source: string; title: string }, input: TDInput): string {
  const spec = LAYOUT_MAP[planItem.layout as keyof typeof LAYOUT_MAP];
  const budgetLines = spec ? [
    `本页版式是 ${planItem.layout}（${spec.name}），字数预算（全角字）：标题≤${spec.budget.title}，眉题≤${spec.budget.kicker}，要点单行≤${spec.budget.line}、最多${spec.budget.lines}行，双栏单行≤${spec.budget.colLine}、每栏≤${spec.budget.colLines}行，主视觉大字≤${spec.budget.big}，表格单元格≤${spec.budget.cell}。`,
  ] : [];
  return [
    "任务：为课件的某一页写内容（只写这一页）。",
    `页面定位：${planItem.purpose}`,
    `对应教案环节：${planItem.source}`,
    `页面标题：${planItem.title}`,
    ...budgetLines,
    "",
    "教案相关环节（从中取材，不得超出）：",
    JSON.stringify((lesson.stages || []).filter((s) => planItem.source.includes(s.name) || s.name.includes(planItem.source)).concat(lesson.stages || []).slice(0, 2)),
    "教案全文（参考）：",
    JSON.stringify(lesson).slice(0, 3000),
    "",
    "输出 JSON（按版式填对应字段，用不到的字段不要输出）：",
    '{ "layout":"' + planItem.layout + '", "title":"", "kicker":"可选眉题",',
    '  "lines":["要点…"],',
    '  "cols":[{"h":"栏头","lines":["…"]},{"h":"栏头","lines":["…"]}],',
    '  "steps":[{"h":"步骤名","d":"一句话说明"}],',
    '  "table":{"head":["…"],"rows":[["…","…"]]},',
    '  "quote":{"text":"课文原句","from":"出处"},',
    '  "big":{"text":"大字","sub":"一行注解"},',
    '  "activity":{"task":"任务指令","group":"4人一组","minutes":8,"rules":["要求…"]},',
    '  "homework":[{"level":"基础|提升|拓展","task":"…"}],',
    '  "note":"本页设计意图（教师用，不上屏）" }',
    "",
    "约束：",
    "- 严格守住字数预算，超出即作废。",
    "- 学生视角行文：口语、短句，不出现教师用语。",
    "- 内容必须取材于教案，不得编造教案外的事实。",
    "- 禁用词表：" + KB.rules.aiTone.join("、"),
  ].join("\n");
}

/* ---------- 课件 · 省 token 模式（单次出整 deck） ---------- */
export function deckOneShot(pkg: ContextPackage, lesson: Lesson, input: TDInput): string {
  return [
    "任务：根据已定稿教案一次性生成整套课件。",
    "教案 JSON：",
    JSON.stringify(lesson),
    "",
    "可用版式：",
    layoutMenu(),
    "",
    "输出 JSON：{ \"slides\":[ 每页一个对象，字段同逐页设计：layout/title/kicker/lines/cols/steps/table/quote/big/activity/homework/source/note ] }",
    "",
    "约束：",
    "- 总页数 10–14 页；第 1 页 cover，最后 1 页 homework。",
    "- 每个教案环节至少 1 页，source 填环节名。",
    "- 版式多样，不要通篇 bullets；遵守各版式字数预算（要点单行≤24 字、最多 5 行）。",
    "- 学生视角，不出现教师用语；禁用词表：" + KB.rules.aiTone.join("、"),
  ].join("\n");
}

/* ---------- 课件 · 对话修改（Agent 第 3 形态） ---------- */
export function slideOps(pkg: ContextPackage, slides: Slide[], userMsg: string): string {
  return [
    "你是课件编辑 Agent。教师对着课件说了一句话，你要把它翻译成一组页面操作。",
    "当前课件（页码 no 从 1 开始）：",
    JSON.stringify(slides.map((s) => ({ no: s.no, layout: s.layout, title: s.title, lines: s.lines, big: s.big }))).slice(0, 3000),
    "",
    "教师说：「" + userMsg + "」",
    "",
    "输出 JSON：{ \"ops\":[ 操作对象 ], \"reply\":\"用一句话告诉教师你改了什么\" }",
    "操作对象必须是以下之一：",
    '- {"op":"rewrite","no":3,"slide":{…完整页面字段…}}  重写某页（含 layout/title/lines 等）',
    '- {"op":"relayout","no":3,"layout":"compare"}  只换某页版式（内容尽量保留，你负责把内容适配到新槽位时也在 slide 字段里给出完整页）',
    '- {"op":"split","no":3,"slides":[{…},{…}]}  把一页拆成两页',
    '- {"op":"delete","no":3}  删除某页',
    '- {"op":"insert","after":3,"slide":{…}}  在某页后插入一页',
    '- {"op":"none"}  无需改动（reply 里解释原因）',
    "",
    "约束：",
    "- 操作后的页面仍须遵守版式字数预算。",
    "- 不得改动教师没让改的页。",
    "- reply 必须是口语一句话。",
  ].join("\n");
}

/* ---------- 讲稿 ---------- */
export function script(pkg: ContextPackage, slides: Slide[]): string {
  return [
    "任务：根据课件逐页生成教师讲稿。",
    "课件 JSON：",
    JSON.stringify(slides.map((s) => ({ no: s.no, layout: s.layout, title: s.title, lines: s.lines, big: s.big, activity: s.activity }))),
    "",
    '输出 JSON：{ "pages":[ { "page":1, "title":"", "minutes":0, "board":"板书提示", "says":[{"who":"T|S|A","text":"…"}] } ] }',
    "who 含义：T=教师的话，S=预设学生回答，A=活动指令。",
    "",
    "约束：",
    "- 每页 minutes 之和必须等于课件总页对应课时；",
    "- 每个 T 提问后面必须跟至少 1 条 S（预设学生回答），S 要符合该学段学生真实会说出的话（允许不完整、允许说错）；",
    "- A 写明小组人数、时长、教师巡视要点；",
    "- 不得出现「下面我们来看」「大家想一想对不对」这类过渡套话；",
    "- 讲稿是教师站在讲台上真的会说的口语，不是书面语。",
  ].join("\n");
}

/* ---------- 冷读评审（输入含课件版式摘要） ---------- */
export function reviewRole(role: KB.ReviewRole, pkg: ContextPackage, bundle: { lesson: Lesson | null; slideDigests: string }): string {
  return [
    role.brief,
    "本班学情：" + (pkg.profileText || "未提供，按学段默认"),
    "你要评审的备课成品如下（这是你唯一能看到的东西，你看不到生成过程）：",
    "教案：", JSON.stringify(bundle.lesson).slice(0, 2400),
    "课件（逐页版式摘要：版式/标题/文字量/密度，等同你看到了这套 PPT 的每一页）：",
    bundle.slideDigests.slice(0, 1600),
    "",
    '输出 JSON：{ "score":0, "comment":"总评语（口语、说人话、100字内）", "stuck":["走神点"], "confused":["没听懂点"], "fake":["觉得假的地方"], "advice":["最重要的 1-2 条修改建议"] }',
  ].join("\n");
}

export function reviewArbiter(pkg: ContextPackage, roleResults: unknown): string {
  return [
    "你是评审仲裁员。三位评委（学生/教研员/督导）在互不可见的情况下完成了对同一份备课三件套的独立评审，结果如下：",
    JSON.stringify(roleResults).slice(0, 3000),
    "",
    '输出 JSON：{ "total":0, "consensus":[{"text":"三位评委一致同意的结论","evidence":"依据"}], "divergence":[{"topic":"分歧点","positions":{"student":"…","peer":"…","inspector":"…"},"lean":"仲裁倾向","reason":"倾向理由","final":"由教师决定"}] }',
    "规则：consensus 必须是三位评委都提到或都认可的；任何一位没提的不得算共识。divergence 中 lean 要结合学情与本课要求给倾向，但必须标注由教师决定。",
  ].join("\n");
}

/* ---------- 修复回路 ---------- */
export function repair(taskPrompt: string, badOutput: unknown, errors: string[]): string {
  return [
    taskPrompt,
    "",
    "你上一次的输出未通过校验，错误如下：",
    errors.map((e, i) => `${i + 1}. ${e}`).join("\n"),
    "",
    "你上一次的输出：",
    (typeof badOutput === "string" ? badOutput : JSON.stringify(badOutput)).slice(0, 2400),
    "",
    "请只修正这些错误，重新输出完整 JSON（结构不变，仍不含任何 JSON 以外的文字）。",
  ].join("\n");
}
