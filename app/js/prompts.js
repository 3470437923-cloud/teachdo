/* ============================================================
   师作 TeachDo B01 · 强约束 Prompt 体系 prompts.js
   六层约束：红线层 / 证据层 / 模板层 / 格式层 / 校验层 / 修复回路
   ============================================================ */
"use strict";
window.TD = window.TD || {};

TD.P = {};

/* ---------- 红线层（System，每次生成必带） ---------- */
TD.P.redline = function(stage, subject){
  return [
    "你是一名有 20 年教龄的" + stage + subject + "教师，同时为教研组写可直接上课的教学材料。",
    "【硬红线，违反任何一条本份产物作废】",
    "1. 不得超出国家课程标准范围；所有课标引用必须逐字来自下方「课标摘录」，且保留出处编号，不得凭记忆编造条文。",
    "2. 不得编造文献、名言、数据、史实、人物经历；没有可靠依据就不要写。",
    "3. 不得出现任何考试原题、模拟卷原题或疑似泄题内容。",
    "4. 不得出现涉黄、涉暴、政治敏感、地域歧视、性别刻板内容；例证必须符合该学段学生的年龄与认知。",
    "5. 禁止 AI 套话与空话（详见禁词表）；每句话都要是教师真的会写在教案里的话。",
    "6. 全部输出必须是严格合法的 JSON，不含 Markdown 代码围栏，不含 JSON 以外的任何文字。"
  ].join("\n");
};

/* ---------- 证据层（ContextPackage → prompt） ---------- */
TD.P.evidence = function(pkg){
  const parts = [];
  if (pkg.standards.length){
    parts.push("【课标摘录（唯一合法引用来源，按 id 引用）】");
    pkg.standards.forEach(s=>{
      parts.push("[" + s.id + "] " + s.topic + "：「" + s.quote + "」（出处：" + s.cite + "）");
    });
  }
  if (pkg.skeleton){
    parts.push("【公开课结构骨架（只借鉴结构与时间配比，禁止复制其中任何表述）】");
    parts.push(pkg.skeleton.name + "：" + pkg.skeleton.skeleton.map(function(x,i){
      return (i+1) + "." + x.role + "（约占" + Math.round(x.ratio*100) + "%·" + x.form + "）";
    }).join(" → "));
    parts.push("板书形态参考：" + pkg.skeleton.board);
  }
  if (pkg.profile){
    parts.push("【学情画像】" + Object.keys(pkg.profile).map(k=>k+"："+pkg.profile[k]).join("；"));
  }
  if (pkg.style){
    parts.push("【课件画风】" + pkg.style.name + "：" + pkg.style.rules.join("；") + "；配色 " + pkg.style.swatch.join("/"));
  }
  return parts.join("\n");
};

/* ---------- 模板层 + 格式层（任务与 Schema） ---------- */
TD.P.schemaLesson = {
  type:"object", required:["meta","objectives","keypoints","stages","board","homework"],
  properties:{
    meta:{type:"object"},
    objectives:{type:"array"}, keypoints:{type:"object"},
    stages:{type:"array"}, board:{type:"string"}, homework:{type:"array"}, reflection:{type:"string"}
  }
};

TD.P.lesson = function(pkg, input){
  const bookLine = (input.textbook||input.version) ? ("教材：" + (input.version||"") + " · " + (input.grade||"") + input.term + (input.unit?(" · " + input.unit):"")) : "";
  const uniNote = input.stage==="大学" ? ("专业：" + (input.major||"未定") + "　课程：" + (input.majorCourse||"未定") + "　课题：" + (input.majorTopic||input.topic)) : "";
  return [
    "任务：为下面这节课生成一份结构化教案。",
    "课题：" + input.topic + "　学段：" + input.stage + "　学科：" + input.subject,
    bookLine,
    uniNote,
    "课时长度：" + input.minutes + " 分钟",
    "教学法：" + input.method + "（必须严格按下方公开课骨架的环节结构组织）",
    "补充要求：" + (input.extra||"无"),
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
    "- stages 的 minutes 之和必须等于 " + input.minutes + "；单个环节不超过课时的 42%；每个环节不少于 3 分钟。",
    "- stages 环节顺序必须与公开课骨架一致（可微调环节名，不可改变骨架逻辑）。",
    "- meta.basis 必须列出本教案引用到的课标摘录 id（至少 1 个），正文凡涉及课标处用 [id] 标注。",
    "- 每个 stage 必须含 teacher/student/intent 三栏；student 栏必须写具体可做的动作，禁止「认真听讲」这类词。",
    "- 禁用词表：" + TD.KB.rules.aiTone.join("、") + "。",
    "- 该学段禁用词汇：" + (TD.KB.rules.vocabCaps[Object.keys(TD.KB.stageKey(input.stage))[0]]||[]).join("、")
  ].join("\n");
};

TD.P.schemaSlides = { type:"object", required:["slides"], properties:{slides:{type:"array"}} };

TD.P.slides = function(pkg, lesson){
  return [
    "任务：根据已定稿教案生成课件大纲（Slide JSON）。",
    "教案 JSON 如下：",
    JSON.stringify(lesson),
    "",
    "输出 JSON：{ \"slides\":[ { \"layout\":\"cover|title|bullets|compare|table|end\", \"title\":\"\", \"kicker\":\"\", \"bullets\":[\"…\"], \"note\":\"本页设计意图\", \"source\":\"对应教案环节名\" } ] }",
    "",
    "约束：",
    "- 总页数 10–16 页；第 1 页必须是 cover（封面），最后 1 页必须是 end（作业/结语）。",
    "- 每个教案环节至少对应 1 页，source 必须填环节名（用于血缘追踪）。",
    "- 画风规则：" + (pkg.style ? pkg.style.rules.join("；") : "每页正文不超过 5 行"),
    "- bullets 每条不超过 22 字；整页 bullets 不超过 5 条；不得把教案发到课件上（课件是给学生看的，不是给教师看的）。",
    "- 课件里不得出现「教学目标」「重难点」这类教师用语；换成学生视角的说法（如「今天要解决的三个问题」）。",
    "- 禁用词表同前，课件文字要比教案更口语、更短。"
  ].join("\n");
};

TD.P.script = function(pkg, slides){
  return [
    "任务：根据课件逐页生成教师讲稿。",
    "课件 JSON：",
    JSON.stringify(slides),
    "",
    "输出 JSON：{ \"pages\":[ { \"page\":1, \"title\":\"\", \"minutes\":0, \"board\":\"板书提示\", \"says\":[{\"who\":\"T|S|A\",\"text\":\"…\"}] } ] }",
    "who 含义：T=教师的话，S=预设学生回答，A=活动指令。",
    "",
    "约束：",
    "- 每页 minutes 之和必须等于课件总页对应课时；",
    "- 每个 T 提问后面必须跟至少 1 条 S（预设学生回答），S 要符合该学段学生真实会说出的话（允许不完整、允许说错）；",
    "- A 写明小组人数、时长、教师巡视要点；",
    "- 不得出现「下面我们来看」「大家想一想对不对」这类过渡套话；",
    "- 讲稿是教师站在讲台上真的会说的口语，不是书面语。"
  ].join("\n");
};

/* ---------- 冷读评审（三评委互不可见 + 仲裁） ---------- */
TD.P.reviewRole = function(role, pkg, bundle){
  return [
    role.brief,
    "本班学情：" + (pkg.profileText || "未提供，按学段默认"),
    "你要评审的三件套成品如下（这是你唯一能看到的东西，你看不到它们的生成过程）：",
    "教案：", JSON.stringify(bundle.lesson).slice(0, 2600),
    "课件大纲：", JSON.stringify(bundle.slides).slice(0, 1600),
    "",
    "输出 JSON：{ \"score\":0, \"comment\":\"你的总评语（口语、说人话、100字内）\", \"stuck\":[\"走神点\"], \"confused\":[\"没听懂点\"], \"fake\":[\"觉得假的地方\"], \"advice\":[\"最重要的 1-2 条修改建议\"] }"
  ].join("\n");
};

TD.P.reviewArbiter = function(pkg, roleResults){
  return [
    "你是评审仲裁员。三位评委（学生/教研员/督导）在互不可见的情况下完成了对同一份备课三件套的独立评审，结果如下：",
    JSON.stringify(roleResults).slice(0, 3000),
    "",
    "输出 JSON：{ \"total\":0, \"consensus\":[{\"text\":\"三位评委一致同意的结论\",\"evidence\":\"依据\"}], \"divergence\":[{\"topic\":\"分歧点\",\"positions\":{\"student\":\"…\",\"peer\":\"…\",\"inspector\":\"…\"},\"lean\":\"仲裁倾向\",\"reason\":\"倾向理由\",\"final\":\"由教师决定\"}] }",
    "规则：consensus 必须是三位评委都提到或都认可的；任何一位没提的不得算共识。divergence 中 lean 要结合学情与本课要求给倾向，但必须标注由教师决定。"
  ].join("\n");
};

/* ---------- 修复回路（校验失败时回灌） ---------- */
TD.P.repair = function(taskPrompt, badOutput, errors){
  return [
    taskPrompt,
    "",
    "你上一次的输出未通过校验，错误如下：",
    errors.map((e,i)=>(i+1)+". "+e).join("\n"),
    "",
    "你上一次的输出：",
    (typeof badOutput === "string" ? badOutput : JSON.stringify(badOutput)).slice(0, 2400),
    "",
    "请只修正这些错误，重新输出完整 JSON（结构不变，仍不含任何 JSON 以外的文字）。"
  ].join("\n");
};

TD.P.ready = true;
