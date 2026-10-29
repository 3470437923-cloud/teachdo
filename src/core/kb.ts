/* ============================================================
   师作 TeachDo B02 · 内置知识库 kb.ts
   课标摘录库 / 公开课环节骨架库 / 校验规则 / 学情画像 / 评审角色
   版权纪律：课标为国家公开发布的课程文件（摘录引用注明出处）；
   公开课只入库"环节骨架"（自研归纳的教学结构模式），不录原文。
   （画风库已移至 deck.ts —— 画风是课件阶段的资产）
   ============================================================ */

/* ---------- 一、课标摘录库 ---------- */
export interface Standard {
  id: string;
  stage: string;
  subject: string;
  topic: string;
  quote: string;
  cite: string;
}

export const standards: Standard[] = [
  /* —— 义务教育语文课程标准（2022年版） —— */
  { id: "yw-core", stage: "义教", subject: "语文", topic: "核心素养",
    quote: "义务教育语文课程培养的核心素养，是学生在积极的语文实践活动中积累、建构并在真实的语言运用情境中表现出来的，是文化自信和语言运用、思维能力、审美创造的综合体现。",
    cite: "义务教育语文课程标准（2022年版）· 课程性质与课程理念 · 核心素养内涵" },
  { id: "yw-s1-read", stage: "第一学段(1-2年级)", subject: "语文", topic: "阅读与鉴赏",
    quote: "喜欢阅读，感受阅读的乐趣。学习用普通话正确、流利、有感情地朗读课文。结合上下文和生活实际了解课文中词句的意思，在阅读中积累词语。",
    cite: "义务教育语文课程标准（2022年版）· 学段目标 · 第一学段 · 阅读与鉴赏" },
  { id: "yw-s2-read", stage: "第二学段(3-4年级)", subject: "语文", topic: "阅读与鉴赏",
    quote: "能联系上下文，理解词句的意思，体会课文中关键词句表达情意的作用。能初步把握文章的主要内容，体会文章表达的思想感情。能对课文中不理解的地方提出疑问。",
    cite: "义务教育语文课程标准（2022年版）· 学段目标 · 第二学段 · 阅读与鉴赏" },
  { id: "yw-s3-read", stage: "第三学段(5-6年级)", subject: "语文", topic: "阅读与鉴赏",
    quote: "在阅读中揣摩文章的表达顺序，体会作者的思想感情，初步领悟文章基本的表达方法。阅读叙事性作品，了解事件梗概，能简单描述自己印象最深的场景、人物、细节。",
    cite: "义务教育语文课程标准（2022年版）· 学段目标 · 第三学段 · 阅读与鉴赏" },
  { id: "yw-s4-read", stage: "第四学段(7-9年级)", subject: "语文", topic: "阅读与鉴赏",
    quote: "在通读课文的基础上，理清思路，理解、分析主要内容，体味和推敲重要词句在语言环境中的意义和作用。对课文的内容和表达有自己的心得，能提出自己的看法，并能运用合作的方式，共同探讨、分析、解决疑难问题。",
    cite: "义务教育语文课程标准（2022年版）· 学段目标 · 第四学段 · 阅读与鉴赏" },
  { id: "yw-s4-write", stage: "第四学段(7-9年级)", subject: "语文", topic: "表达与交流",
    quote: "写作要有真情实感，力求表达自己对自然、社会、人生的感受、体验和思考。多角度观察生活，发现生活的丰富多彩，能抓住事物的特征，有自己的感受和认识，表达力求有创意。",
    cite: "义务教育语文课程标准（2022年版）· 学段目标 · 第四学段 · 表达与交流" },
  { id: "yw-taskgroup", stage: "义教", subject: "语文", topic: "学习任务群",
    quote: "义务教育语文课程内容主要以学习任务群组织与呈现。设计语文学习任务，要围绕特定学习主题，确定具有内在逻辑关联的语文实践活动。",
    cite: "义务教育语文课程标准（2022年版）· 课程内容 · 学习任务群" },
  { id: "yw-eval", stage: "义教", subject: "语文", topic: "教学评价",
    quote: "过程性评价应有助于教与学的及时改进。教师要有意识地利用评价过程和结果发现学生语文学习的特点与问题，提出有针对性的指导意见。",
    cite: "义务教育语文课程标准（2022年版）· 学业质量与评价建议 · 过程性评价" },

  /* —— 义务教育数学课程标准（2022年版） —— */
  { id: "sx-core", stage: "义教", subject: "数学", topic: "核心素养（三会）",
    quote: "会用数学的眼光观察现实世界，会用数学的思维思考现实世界，会用数学的语言表达现实世界。",
    cite: "义务教育数学课程标准（2022年版）· 课程性质与课程理念 · 核心素养" },
  { id: "sx-s1", stage: "第一学段(1-2年级)", subject: "数学", topic: "学段目标",
    quote: "经历简单的数的抽象过程，认识万以内的数，能进行简单的整数四则运算，形成初步的数感、符号意识和运算能力。能在教师指导下，从日常生活中提出简单的数学问题，尝试运用所学的知识和方法解决问题。",
    cite: "义务教育数学课程标准（2022年版）· 学段目标 · 第一学段" },
  { id: "sx-s2", stage: "第二学段(3-4年级)", subject: "数学", topic: "学段目标",
    quote: "认识自然数，了解小数和分数，能进行较复杂的整数四则运算和简单的小数、分数的加减运算，形成数感、运算能力和初步的推理意识。认识常见的平面图形，经历平面图形的周长和面积的测量过程，形成量感、空间观念和初步的几何直观。",
    cite: "义务教育数学课程标准（2022年版）· 学段目标 · 第二学段" },
  { id: "sx-s3", stage: "第三学段(5-6年级)", subject: "数学", topic: "学段目标",
    quote: "能进行小数和分数的四则运算，探索运算的一致性，形成运算能力和推理意识。探索几何图形面积和体积的计算方法，形成空间观念、几何直观和量感。认识折线统计图和扇形统计图，形成数据意识。",
    cite: "义务教育数学课程标准（2022年版）· 学段目标 · 第三学段" },
  { id: "sx-s4", stage: "第四学段(7-9年级)", subject: "数学", topic: "学段目标",
    quote: "理解负数、无理数，掌握实数运算；掌握代数式、方程与不等式、函数的基础知识，形成抽象能力、运算能力、推理能力和模型观念。掌握基本的几何图形性质与证明，形成几何直观、空间观念和推理能力。",
    cite: "义务教育数学课程标准（2022年版）· 学段目标 · 第四学段" },
  { id: "sx-situation", stage: "义教", subject: "数学", topic: "教学建议",
    quote: "注重创设真实情境。真实情境创设可从社会生活、科学和学生已有数学经验等方面入手，围绕教学任务，选择贴近学生生活经验、符合学生年龄特点和认知加工特点的素材。",
    cite: "义务教育数学课程标准（2022年版）· 课程实施 · 教学建议" },

  /* —— 义务教育英语课程标准（2022年版） —— */
  { id: "yy-core", stage: "义教", subject: "英语", topic: "核心素养",
    quote: "英语课程要培养的学生核心素养包括语言能力、文化意识、思维品质和学习能力等方面。",
    cite: "义务教育英语课程标准（2022年版）· 课程性质与课程理念 · 核心素养" },
  { id: "yy-view", stage: "义教", subject: "英语", topic: "英语学习活动观",
    quote: "秉持在体验中学习、在实践中运用、在迁移中创新的学习理念，倡导学生围绕真实情境和真实问题，激活已知，参与到指向主题意义探究的学习理解、应用实践和迁移创新等一系列相互关联、循环递进的语言学习和运用活动中。",
    cite: "义务教育英语课程标准（2022年版）· 课程实施 · 英语学习活动观" },
  { id: "yy-level", stage: "义教", subject: "英语", topic: "分级目标",
    quote: "义务教育英语课程分为三个学段，各学段目标之间具有连续性、顺序性和进阶性。3-4年级达到一级要求，5-6年级达到二级要求，7-9年级达到三级要求。",
    cite: "义务教育英语课程标准（2022年版）· 学段目标 · 级别设置" },

  /* —— 高中课程标准（2017年版2020年修订）核心素养 —— */
  { id: "gz-yw", stage: "高中", subject: "语文", topic: "学科核心素养",
    quote: "语文学科核心素养是学生在积极的语言实践活动中积累与构建起来，并在真实的语言运用情境中表现出来的语言能力及其品质；主要包括语言建构与运用、思维发展与提升、审美鉴赏与创造、文化传承与理解四个方面。",
    cite: "普通高中语文课程标准（2017年版2020年修订）· 学科核心素养与课程目标" },
  { id: "gz-sx", stage: "高中", subject: "数学", topic: "学科核心素养",
    quote: "数学学科核心素养包括：数学抽象、逻辑推理、数学建模、直观想象、数学运算和数据分析。",
    cite: "普通高中数学课程标准（2017年版2020年修订）· 学科核心素养与课程目标" },
  { id: "gz-yy", stage: "高中", subject: "英语", topic: "学科核心素养",
    quote: "英语学科核心素养主要包括语言能力、文化意识、思维品质和学习能力。",
    cite: "普通高中英语课程标准（2017年版2020年修订）· 学科核心素养与课程目标" },
  { id: "gz-wl", stage: "高中", subject: "物理", topic: "学科核心素养",
    quote: "物理学科核心素养主要包括物理观念、科学思维、科学探究、科学态度与责任四个方面。",
    cite: "普通高中物理课程标准（2017年版2020年修订）· 学科核心素养与课程目标" },
  { id: "gz-hx", stage: "高中", subject: "化学", topic: "学科核心素养",
    quote: "化学学科核心素养包括宏观辨识与微观探析、变化观念与平衡思想、证据推理与模型认知、科学探究与创新意识、科学态度与社会责任。",
    cite: "普通高中化学课程标准（2017年版2020年修订）· 学科核心素养与课程目标" },
  { id: "gz-sw", stage: "高中", subject: "生物", topic: "学科核心素养",
    quote: "生物学学科核心素养包括生命观念、科学思维、科学探究和社会责任。",
    cite: "普通高中生物学课程标准（2017年版2020年修订）· 学科核心素养与课程目标" },
  { id: "gz-ls", stage: "高中", subject: "历史", topic: "学科核心素养",
    quote: "历史学科核心素养包括唯物史观、时空观念、史料实证、历史解释、家国情怀。",
    cite: "普通高中历史课程标准（2017年版2020年修订）· 学科核心素养与课程目标" },
  { id: "gz-zz", stage: "高中", subject: "思想政治", topic: "学科核心素养",
    quote: "思想政治学科核心素养包括政治认同、科学精神、法治意识和公共参与。",
    cite: "普通高中思想政治课程标准（2017年版2020年修订）· 学科核心素养与课程目标" },
  { id: "gz-dl", stage: "高中", subject: "地理", topic: "学科核心素养",
    quote: "地理学科核心素养包括人地协调观、综合思维、区域认知和地理实践力。",
    cite: "普通高中地理课程标准（2017年版2020年修订）· 学科核心素养与课程目标" },
];

/* 学段关键词 → 课标条目选择器 */
export function stageKey(stage: string): Record<string, string> {
  if (/小/.test(stage)) return { s1: "第一学段(1-2年级)", s2: "第二学段(3-4年级)", s3: "第三学段(5-6年级)" };
  if (/初/.test(stage)) return { s4: "第四学段(7-9年级)" };
  if (/高中/.test(stage)) return { hs: "高中" };
  if (/大学/.test(stage)) return { uni: "大学" };
  return {};
}

/* 按学段+学科取课标条目（确定性选择，绝不凭模型记忆） */
export function selectStandards(stage: string, subject: string): Standard[] {
  const out: Standard[] = [];
  const push = (id: string) => {
    const s = standards.find((x) => x.id === id);
    if (s) out.push(s);
  };
  if (/初/.test(stage)) {
    if (subject === "语文") { push("yw-core"); push("yw-s4-read"); push("yw-s4-write"); push("yw-taskgroup"); push("yw-eval"); }
    else if (subject === "数学") { push("sx-core"); push("sx-s4"); push("sx-situation"); }
    else if (subject === "英语") { push("yy-core"); push("yy-view"); push("yy-level"); }
    else { push("yw-taskgroup"); }
  } else if (/高中/.test(stage)) {
    const map: Record<string, string> = { 语文: "gz-yw", 数学: "gz-sx", 英语: "gz-yy", 物理: "gz-wl", 化学: "gz-hx", 生物: "gz-sw", 历史: "gz-ls", 思想政治: "gz-zz", 地理: "gz-dl" };
    if (map[subject]) push(map[subject]);
  } else if (/小/.test(stage)) {
    if (subject === "语文") { push("yw-core"); push("yw-s1-read"); push("yw-s2-read"); push("yw-s3-read"); push("yw-taskgroup"); }
    else if (subject === "数学") { push("sx-core"); push("sx-s1"); push("sx-s2"); push("sx-s3"); push("sx-situation"); }
    else if (subject === "英语") { push("yy-core"); push("yy-view"); push("yy-level"); }
    else { push("yw-taskgroup"); }
  } else if (/大学/.test(stage)) {
    /* 大学段无国家课标条目：使用教学法层面的通用约束 */
  }
  return out;
}

/* ---------- 二、公开课环节骨架库 ----------
   自研归纳：对常见优秀公开课的教学结构抽象成"环节骨架"。
   每条只含结构（环节类型/时长占比/互动形态/板书形态），不含任何具体课文表述。 */
export interface SkeletonStage { role: string; ratio: number; form: string; note: string }
export interface OpenClassSkeleton {
  id: string; method: string; name: string;
  skeleton: SkeletonStage[]; board: string;
}

export const openClass: OpenClassSkeleton[] = [
  { id: "gk-import-scene", method: "优秀公开课教学", name: "情境导入型",
    skeleton: [
      { role: "导入", ratio: 0.09, form: "多媒体情境（音频/图片/短视频）", note: "只给一个感官刺激，不讲解" },
      { role: "初读感知", ratio: 0.13, form: "自由朗读+一句话概括", note: "建立整体框架" },
      { role: "细读探究", ratio: 0.34, form: "小组分工圈点批注", note: "核心环节，教师只收束不评价" },
      { role: "对比提升", ratio: 0.20, form: "两处对比朗读/对读", note: "由内容到表达" },
      { role: "情感体验", ratio: 0.15, form: "配乐朗读或角色扮演", note: "可选，视班级学情" },
      { role: "开放收束", ratio: 0.09, form: "留白问题，不给答案", note: "悬念带出教室" },
    ], board: "中央关键词+左右两翼留白，随课堂生成" },
  { id: "gk-question-chain", method: "优秀公开课教学", name: "问题链驱动型",
    skeleton: [
      { role: "悬念设问", ratio: 0.09, form: "一个反常识问题", note: "制造认知冲突" },
      { role: "逐段剥离", ratio: 0.31, form: "每段一主问题", note: "问题之间要有递进" },
      { role: "对比朗读", ratio: 0.20, form: "改句与原句对比", note: "体味表达效果" },
      { role: "主旨归纳", ratio: 0.24, form: "学生自己归纳，教师板书", note: "答案从学生中来" },
      { role: "小结作业", ratio: 0.16, form: "分层作业布置", note: "基础/提升/拓展" },
    ], board: "问题链阶梯状排列，箭头连接" },
  { id: "gk-daily", method: "实用日常教学", name: "讲授-练习型",
    skeleton: [
      { role: "复习导入", ratio: 0.07, form: "上节回顾提问", note: "不超过3分钟" },
      { role: "新知讲授", ratio: 0.36, form: "讲练结合，讲一段练一段", note: "板书为主" },
      { role: "例题精讲", ratio: 0.24, form: "一题多解或变式", note: "暴露思维过程" },
      { role: "当堂练习", ratio: 0.22, form: "独立练习+当堂订正", note: "人人过关" },
      { role: "小结作业", ratio: 0.11, form: "知识结构小结", note: "用思维导图收束" },
    ], board: "左侧知识结构，右侧例题，中间留演算区" },
  { id: "gk-flip", method: "翻转课堂", name: "翻转课堂型",
    skeleton: [
      { role: "课前任务单反馈", ratio: 0.09, form: "展示典型课前答案", note: "正误并置" },
      { role: "疑难聚焦", ratio: 0.16, form: "学生票选最疑难问题", note: "教师不讲全会的内容" },
      { role: "合作探究", ratio: 0.35, form: "小组攻坚+教师巡回点拨", note: "只点拨卡点" },
      { role: "展示互评", ratio: 0.24, form: "组间展示+量规互评", note: "互评用同一量规" },
      { role: "迁移应用", ratio: 0.16, form: "变式或真实任务", note: "检验迁移" },
    ], board: "课前问题清单→课堂攻坚清单，两栏对照" },
  { id: "gk-group", method: "小组汇报课", name: "小组汇报型",
    skeleton: [
      { role: "任务认领", ratio: 0.07, form: "各组领取子课题", note: "任务要有区分度" },
      { role: "组内准备", ratio: 0.16, form: "分工整理汇报稿", note: "教师巡回" },
      { role: "小组汇报", ratio: 0.40, form: "每组限时汇报", note: "计时器可视化" },
      { role: "质询互评", ratio: 0.24, form: "他组提问+量规打分", note: "教师主持" },
      { role: "教师点评提升", ratio: 0.13, form: "教师只讲各组都没讲到的", note: "兜底" },
    ], board: "中央为量规，四周为各组编号与得分" },
  { id: "gk-review", method: "实用日常教学", name: "复习课型",
    skeleton: [
      { role: "知识唤醒", ratio: 0.11, form: "思维导图回顾", note: "学生补充" },
      { role: "典型错题", ratio: 0.27, form: "错因归类分析", note: "来自作业/测验真实错题" },
      { role: "方法提炼", ratio: 0.22, form: "归纳通性通法", note: "学生先说" },
      { role: "变式训练", ratio: 0.29, form: "由易到难三层变式", note: "分层要求" },
      { role: "小结", ratio: 0.11, form: "一句话总结+预告", note: "承上启下" },
    ], board: "错因分类表" },
];

/* ---------- 三、校验规则库 ---------- */
export const rules = {
  /* AI 味词表（命中即提示，强约束负向清单） */
  aiTone: ["首先", "其次", "再次", "最后", "综上所述", "总而言之", "由此可见", "让我们一起", "本节课我们将要", "接下来我们将", "大家准备好了吗", "值得注意的是", "众所周知", "毋庸置疑", "显而易见", "不难发现", "通过本节课的学习，同学们"],
  /* 学段词汇上限（示例级硬约束：义教段禁用词） */
  vocabCaps: {
    "第一学段(1-2年级)": ["沁人心脾", "跌宕起伏", "寓意深刻", "潜移默化", "荡气回肠"],
    "第二学段(3-4年级)": ["沁人心脾", "跌宕起伏", "潜移默化", "荡气回肠", "曲高和寡"],
    "第三学段(5-6年级)": ["沁人心脾", "潜移默化", "曲高和寡"],
    "第四学段(7-9年级)": ["曲高和寡"],
  } as Record<string, string[]>,
  /* 空话密度检测：连续抽象词 */
  emptyTalk: ["提高", "提升", "培养", "增强", "促进", "落实", "把握", "夯实"],
  /* 环节时间合理性 */
  maxStageRatio: 0.42,      /* 单一环节不得超过课时 42% */
  minStageMin: 3,           /* 环节不得短于 3 分钟 */
  similarityMax: 0.25,      /* 成品与参考的最大相似度阈值 */
};

/* ---------- 四、学情画像（按学段默认） ---------- */
export interface StageProfile {
  reading: string; vocab: string; example: string; interact: string; focus: string;
}
export const profiles: Record<string, StageProfile> = {
  小学: { reading: "具象思维为主", vocab: "口语化，禁用术语", example: "生活场景：玩具、零食、上学路", interact: "朗读、表演、游戏化", focus: "注意力约15-20分钟，需频繁切换活动" },
  初中: { reading: "能把握主旨，细节归纳弱", vocab: "可用学科术语但需解释", example: "校园生活、同伴关系、家庭日常", interact: "小组讨论、同桌交流、圈点批注", focus: "注意力约25分钟，适合问题链驱动" },
  高中: { reading: "能进行抽象概括与批判性思考", vocab: "学科术语规范使用", example: "社会现象、学科史、真实数据", interact: "论证、辩论、项目化任务", focus: "可承受35分钟以上的深度探究" },
  大学: { reading: "自主探究", vocab: "学术规范", example: "行业案例、研究文献", interact: "研讨、报告、互评", focus: "以问题与项目驱动" },
};

/* ---------- 五、评审角色库（冷读委员会） ---------- */
export interface ReviewRole {
  id: string; name: string; icon: string; focus: string; brief: string; weight: number;
}
export const roles: ReviewRole[] = [
  { id: "student", name: "学生视角", icon: "🧑‍🎓", focus: "听得懂 / 接得住 / 是否假",
    brief: "你是这个班的一名真实学生。只说你的真实感受：哪里走神、哪里没听懂、哪里觉得假。不恭维，不用大人腔。", weight: 1.2 },
  { id: "peer", name: "教研员", icon: "👩‍🏫", focus: "环节逻辑 / 时间分配 / 教法一致性",
    brief: "你是资深教研员。只看结构与可操作性：环节是否闭环、时间是否够、教法与所选教学法是否一致、有没有花架子。", weight: 1.0 },
  { id: "inspector", name: "督导", icon: "📝", focus: "目标达成 / 课标对齐 / 安全合规",
    brief: "你是校级督导。只看目标可达成性、课标对齐、合规与安全（涉敏、超纲、学生隐私、应试边界）。", weight: 1.0 },
];
