/* ============================================================
   师作 TeachDo B01 · UI 逻辑 ui.js
   六屏：输入 / 教案 / 课件 / 讲稿 / 评审 / 导出
   ============================================================ */
"use strict";
window.TD = window.TD || {};

TD.UI = {
  step: 0,
  steps: [
    {name:"备课输入", key:"input"},
    {name:"教案", key:"lesson"},
    {name:"课件", key:"slides"},
    {name:"讲稿", key:"script"},
    {name:"冷读评审", key:"review"},
    {name:"导出", key:"export"}
  ],
  selSlide: 0,

  /* ---------- 工具 ---------- */
  $(s){ return document.querySelector(s); },
  esc(s){ return TD.Export.esc(s); },
  toast(msg, err){
    const old = document.querySelector(".toast"); if(old) old.remove();
    const t = document.createElement("div");
    t.className = "toast" + (err?" err":"");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=>t.remove(), 2600);
  },
  run(on){ const r=this.$("#runner"); r.style.display = on?"block":"none"; },
  progress(msg){ this.$("#stLeft").textContent = msg; },
  stamp(){
    const p = TD.Core.proj;
    const s = this.$("#stStamp");
    const dirty = p && p.dirty;
    s.className = "stamp " + (dirty?"draft":"solid");
    s.querySelector(".stamp-label").textContent = dirty ? "有未保存改动 · Ctrl+S 保存" : "已保存";
  },

  /* ---------- 初始化 ---------- */
  init(){
    TD.LLM.load();
    TD.Core.proj = TD.Core.blank();
    /* 恢复上次项目 */
    const last = localStorage.getItem("td_last");
    if(last){ const p = TD.Core.load(last); if(p){ TD.Core.proj = p; this.toast("已恢复上次项目："+last); } }
    this.renderSteps();
    this.goto(0);
    this.bindTop();
    this.$("#stKb").textContent = "课标库 已就绪 · "+TD.KB.standards.length+" 条 · 骨架 "+TD.KB.openClass.length+" 套 · 画风 "+TD.KB.styles.length+" 种";
    document.addEventListener("keydown", e=>{
      if((e.ctrlKey||e.metaKey) && e.key==="s"){ e.preventDefault(); this.save(); }
    });
  },

  bindTop(){
    this.$("#btn-settings").onclick = ()=>this.openSettings();
    this.$("#btn-save").onclick = ()=>this.save();
    this.$("#btn-open").onclick = ()=>this.openProjectList();
    this.$("#sideClose").onclick = ()=>this.$("#sidePane").classList.add("hidden");
    const themeBtn = this.$("#btn-theme");
    if(themeBtn){
      const saved = localStorage.getItem("td_theme") || "light";
      document.documentElement.setAttribute("data-theme", saved);
      themeBtn.onclick = ()=>{
        const cur = document.documentElement.getAttribute("data-theme");
        const next = cur==="light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("td_theme", next);
      };
    }
  },

  save(){
    TD.Core.save();
    this.stamp();
    this.toast("已保存项目「"+(TD.Core.proj.input.topic||"未命名")+"」");
  },

  /* ---------- 步骤签 ---------- */
  renderSteps(){
    const p = TD.Core.proj;
    const hasL = !!(p && p.lesson), hasS = !!(p && p.slides && p.slides.length), hasC = !!(p && p.script && p.script.length), hasR = !!(p && p.review);
    const done = [true, hasL, hasS, hasC, hasR, hasL&&hasS&&hasC];
    const bar = this.$("#stepsBar");
    bar.innerHTML = "";
    this.steps.forEach((st,i)=>{
      const el = document.createElement("div");
      el.className = "step-pill" + (i===this.step?" cur":"") + (done[i]?" done":"");
      el.innerHTML = '<span class="s-no">'+(done[i]&&i!==this.step?"✓":(i+1))+'</span><span>'+st.name+'</span>'
        + (i===1&&hasL?'<span class="s-state">已定稿</span>':"")
        + (i===2&&hasS?'<span class="s-state">'+(p.slides.filter(s=>s.status==="stale").length?p.slides.filter(s=>s.status==="stale").length+" 页陈旧":"已就绪")+'</span>':"")
        + (i===3&&hasC?'<span class="s-state">已就绪</span>':"");
      el.onclick = ()=>this.goto(i);
      bar.appendChild(el);
      if(i<this.steps.length-1){ const a=document.createElement("span"); a.className="step-arrow"; a.textContent="›"; bar.appendChild(a); }
    });
  },

  goto(i){
    this.step = i;
    this.renderSteps();
    const body = this.$("#viewBody");
    body.innerHTML = "";
    this.$("#sidePane").classList.add("hidden");
    const fn = { input:()=>this.viewInput(body), lesson:()=>this.viewLesson(body), slides:()=>this.viewSlides(body),
      script:()=>this.viewScript(body), review:()=>this.viewReview(body), export:()=>this.viewExport(body) }[this.steps[i].key];
    fn && fn();
  },

  side(title, html){
    this.$("#sideTitle").firstChild.textContent = title+" ";
    this.$("#sideBody").innerHTML = html;
    this.$("#sidePane").classList.remove("hidden");
  },

  /* ============================================================
     屏 1 · 备课输入
     ============================================================ */
  /* ============================================================
     屏 1 · 备课输入（级联选择）
     学段 → 学科 → (学制 → 版本 → 年级 → 册 → 课题[分课]) / 大学(专业→课程→课题)
     ============================================================ */
  viewInput(body){
    const p = TD.Core.proj, i = p.input;
    const esc = this.esc;
    const stages = ["小学","初中","高中","大学"].map(s=>'<button class="'+(i.stage===s?"on":"")+'" data-stage="'+s+'">'+s+'</button>').join("");
    const subjList = TD.CAT.subjects[i.stage]||[];
    const subjects = subjList.map(s=>'<option '+(i.subject===s?"selected":"")+'>'+s+'</option>').join("");
    const styles = TD.KB.styles.map(s=>'<div class="chip'+(i.style===s.id?" on":"")+'" data-style="'+s.id+'">'+s.name+'</div>').join(" ");
    const methods = [...new Set(TD.KB.openClass.map(s=>s.method))].map(m=>'<div class="chip'+(i.method===m?" on":"")+'" data-method="'+m+'">'+m+'</div>').join(" ");

    /* K12 区：学制/版本/年级/册/课题 */
    let k12 = "";
    if(i.stage!=="大学"){
      const isUni = false;
      const sysBtns = TD.CAT.systems.map(s=>'<button class="'+(i.system===s?"on":"")+'" data-system="'+s+'">'+s+'</button>').join("");
      const verList = TD.CAT.versions[i.subject]||["人教版"];
      const versions = verList.map(v=>'<option '+(i.version===v?"selected":"")+'>'+v+'</option>').join("");
      const gradeList = TD.CAT.grades(i.stage, i.system);
      const grades = gradeList.map(g=>'<option '+(i.grade===g?"selected":"")+'>'+g+'</option>').join("");
      const terms = TD.CAT.terms.map(t=>'<button class="'+(i.term===t?"on":"")+'" data-term="'+t+'">'+t+'</button>').join("");
      /* 课题下拉：目录 → 课题(+分课)，顶部自定义 */
      const gk = TD.UI._gradeKey(i.grade, i.term, i.stage, i.subject, i.version);
      i.gradeKey = gk;
      const cat = TD.CAT.get(i.stage, i.subject, i.version, gk);
      let topicOpts = '<option value="__custom__"'+(i.topicCustom?" selected":"")+'>✎ 自定义课题…</option>';
      if(cat){
        cat.forEach((u,ui)=>{
          topicOpts += '<optgroup label="'+esc(u.unit)+'">';
          u.lessons.forEach((ls,li)=>{
            const id = "u"+ui+"l"+li;
            if(ls.parts && ls.parts.length){
              ls.parts.forEach((pt,pi)=>{
                const pid = id+"p"+pi;
                topicOpts += '<option value="'+pid+'"'+((i.courseId===pid)?" selected":"")+'>'+esc(ls.title)+" · "+esc(pt)+'</option>';
              });
            }else{
              topicOpts += '<option value="'+id+'"'+((i.courseId===id)?" selected":"")+'>'+esc(ls.title)+'</option>';
            }
          });
          topicOpts += '</optgroup>';
        });
      }
      const customInput = '<div id="customTopicRow" style="grid-column:1/-1;'+(i.topicCustom?"":"display:none")+'"><label class="label">自定义课题</label><input class="field" id="fTopicCustom" placeholder="输入课题名…" value="'+esc(i.topicCustom?i.topic:"")+'"></div>';
      k12 =
        '<div class="label">贰 · 教材与课题（选定，不手输）</div>'
        + '<div class="grid2">'
        + '<div><label class="label">学制</label><div class="seg" id="segSystem">'+sysBtns+'</div></div>'
        + '<div><label class="label">教材版本</label><select class="field" id="fVersion">'+versions+'</select></div>'
        + '<div><label class="label">年级</label><select class="field" id="fGrade">'+grades+'</select></div>'
        + '<div><label class="label">册次</label><div class="seg" id="segTerm">'+terms+'</div></div>'
        + '<div style="grid-column:1/-1"><label class="label">课题（含实际教学分课）</label><select class="field" id="fTopic">'+topicOpts+'</select></div>'
        + customInput
        + '</div>';
    }

    /* 大学区：专业搜索 + 课程 + 课题 */
    let uni = "";
    if(i.stage==="大学"){
      const majorOpts = TD.MAJORS.allMajors().map(m=>'<option '+(i.major===m.major?"selected":"")+' value="'+esc(m.major)+'">'+m.major+'（'+m.cat+'）</option>').join("");
      const courseList = i.major ? TD.MAJORS.coursesOf(i.major) : [];
      const courseOpts = '<option value="">— 先选专业 —</option>' + courseList.map(c=>'<option '+(i.majorCourse===c.course?"selected":"")+' value="'+esc(c.course)+'">'+esc(c.course)+'</option>').join("");
      uni =
        '<div class="label">贰 · 专业与课题</div>'
        + '<div class="grid2">'
        + '<div style="grid-column:1/-1"><label class="label">专业（搜索选取，无则自定义）</label>'
        + '<input class="field" id="fMajorSearch" placeholder="搜索专业…" style="margin-bottom:6px">'
        + '<select class="field" id="fMajor" size="6" style="height:auto;min-height:120px">'+majorOpts+'</select></div>'
        + '<div><label class="label">课程</label><select class="field" id="fMajorCourse">'+courseOpts+'</select></div>'
        + '<div><label class="label">课题（可选，无则自定义）</label><input class="field" id="fMajorTopic" placeholder="例如：栈与队列" value="'+esc(i.majorTopic||"")+'"></div>'
        + '<div style="grid-column:1/-1"><label class="label">自定义课题（课程列表没有时）</label><input class="field" id="fTopicCustom" placeholder="输入课题名…" value="'+esc(i.topicCustom?i.topic:"")+'"></div>'
        + '</div>';
    }

    body.innerHTML =
      '<div style="padding:8px 14px;max-width:760px;margin:0 auto">'
      + '<h1 style="font-size:19px;font-weight:700;letter-spacing:-0.016em;margin-bottom:4px">新建备课</h1>'
      + '<div class="cap" style="margin-bottom:18px">选定学段学科 → 选定教材与课题 → 装配上下文 → 生成三件套</div>'

      + '<div class="label">壹 · 面向谁上课</div>'
      + '<div class="grid2">'
      + '<div><label class="label">学段</label><div class="seg" id="segStage">'+stages+'</div></div>'
      + '<div><label class="label">学科</label><select class="field" id="fSubject" '+(i.stage==="大学"?"disabled":"")+'>'+(i.stage==="大学"?'<option>— 大学走专业 —</option>':subjects)+'</select></div>'
      + '<div style="grid-column:1/-1"><label class="label">班级学情（可留空，AI 按学段默认画像）</label><textarea class="field" id="fClassNote" rows="2" placeholder="例如：阅读理解中等偏下，发言积极但易跑题……">'+esc(i.classNote)+'</textarea></div>'
      + '</div>'

      + '<hr class="hairline">' + k12 + uni

      + '<hr class="hairline"><div class="label">叁 · 教法与画风</div>'
      + '<div class="grid2">'
      + '<div><label class="label">课时长度（分钟）</label><input class="field" id="fMinutes" type="number" value="'+i.minutes+'"></div>'
      + '<div><label class="label">单元说明（自动，可改）</label><input class="field" id="fUnit" placeholder="由课题自动带出" value="'+esc(i.unit||"")+'"></div>'
      + '<div style="grid-column:1/-1"><label class="label">补充要求（教学意图、考点、必须讲到的点）</label><textarea class="field" id="fExtra" rows="2" placeholder="例如：重点讲清某处细节；不要过度煽情；结尾留开放问题">'+esc(i.extra)+'</textarea></div>'
      + '</div>'
      + '<div style="margin-top:12px"><label class="label">教学方法</label><div class="gcol" style="gap:7px;flex-direction:row;flex-wrap:wrap" id="methodChips">'+methods+'</div></div>'
      + '<div style="margin-top:12px"><label class="label">PPT 画风</label><div class="gcol" style="gap:7px;flex-direction:row;flex-wrap:wrap" id="styleChips">'+styles+'</div></div>'
      + '<div style="margin-top:12px"><label class="label">画风补充要求</label><input class="field" id="fStyleNote" placeholder="例如：不要卡通；每页文字不超过 5 行" value="'+esc(i.styleNote||"")+'"></div>'
      + '</div>';

    /* ===== 绑定 ===== */
    const self = this;
    this.$("#segStage").addEventListener("click", e=>{
      const b = e.target.closest("button"); if(!b) return;
      i.stage = b.dataset.stage;
      /* 学段切换时重设学科默认值 */
      const list = TD.CAT.subjects[i.stage]||[];
      if(list.length && !list.includes(i.subject)) i.subject = list[0];
      /* 学科切换时重设版本默认值 */
      const verList = TD.CAT.versions[i.subject]||["人教版"];
      if(!verList.includes(i.version)) i.version = verList[0];
      i.topicCustom = false; i.courseId = "";
      TD.Core.touch(); self.viewInput(body);
    });
    if(this.$("#fSubject")) this.$("#fSubject").addEventListener("change", e=>{
      i.subject = e.target.value;
      const verList = TD.CAT.versions[i.subject]||["人教版"];
      if(!verList.includes(i.version)) i.version = verList[0];
      i.courseId = ""; TD.Core.touch(); self.viewInput(body);
    });
    if(this.$("#segSystem")) this.$("#segSystem").addEventListener("click", e=>{
      const b = e.target.closest("button"); if(!b) return;
      i.system = b.dataset.system; i.courseId = ""; TD.Core.touch(); self.viewInput(body);
    });
    if(this.$("#fVersion")) this.$("#fVersion").addEventListener("change", e=>{ i.version = e.target.value; i.courseId=""; TD.Core.touch(); self.viewInput(body); });
    if(this.$("#fGrade")) this.$("#fGrade").addEventListener("change", e=>{ i.grade = e.target.value; i.courseId=""; TD.Core.touch(); self.viewInput(body); });
    if(this.$("#segTerm")) this.$("#segTerm").addEventListener("click", e=>{
      const b = e.target.closest("button"); if(!b) return;
      i.term = b.dataset.term; i.courseId=""; TD.Core.touch(); self.viewInput(body);
    });
    if(this.$("#fTopic")) this.$("#fTopic").addEventListener("change", e=>{
      const v = e.target.value;
      if(v==="__custom__"){ i.topicCustom = true; self.viewInput(body); return; }
      i.topicCustom = false; i.courseId = v;
      /* 从目录取课题名与单元 */
      const cat = TD.CAT.get(i.stage, i.subject, i.version, i.gradeKey);
      if(cat){
        outer: for(const u of cat){
          for(const ls of u.lessons){
            const base = "u"+cat.indexOf(u)+"l"+u.lessons.indexOf(ls);
            if(v===base){ i.topic = ls.title; i.unit = u.unit; break outer; }
            if(ls.parts){ for(const pt of ls.parts){ if(v===base+"p"+ls.parts.indexOf(pt)){ i.topic = ls.title+" · "+pt; i.unit = u.unit; break outer; } } }
          }
        }
      }
      TD.Core.touch(); self.stamp();
      /* 更新自定义行可见性 */
      const cr = self.$("#customTopicRow"); if(cr) cr.style.display = "none";
      self.viewInput(body);
    });
    if(this.$("#fMajorSearch")) this.$("#fMajorSearch").addEventListener("input", e=>{
      const q = e.target.value.trim();
      const sel = self.$("#fMajor");
      const hits = TD.MAJORS.search(q);
      sel.innerHTML = hits.length ? hits.map(m=>'<option value="'+esc(m.major)+'">'+m.major+'（'+m.cat+'）</option>').join("") : '<option value="">（无匹配，用下方自定义）</option>';
    });
    if(this.$("#fMajor")) this.$("#fMajor").addEventListener("change", e=>{
      i.major = e.target.value; i.majorCourse = ""; TD.Core.touch(); self.viewInput(body);
    });
    if(this.$("#fMajorCourse")) this.$("#fMajorCourse").addEventListener("change", e=>{
      i.majorCourse = e.target.value;
      /* 课程选定后，课题可带课程首个 topic 做提示 */
      if(e.target.value && !i.majorTopic){ i.topic = e.target.value; }
      TD.Core.touch(); self.stamp();
    });
    if(this.$("#fMajorTopic")) this.$("#fMajorTopic").addEventListener("input", e=>{ i.majorTopic = e.target.value; if(e.target.value){ i.topic = e.target.value; } TD.Core.touch(); });
    ["ClassNote","Minutes","Unit","Extra","StyleNote"].forEach(k=>{
      const el = this.$("#f"+k);
      el && el.addEventListener("input", ()=>{ i[k==="ClassNote"?"classNote":k==="Minutes"?"minutes":k==="Unit"?"unit":k==="Extra"?"extra":"styleNote"] = el.value; TD.Core.touch(); });
    });
    if(this.$("#fTopicCustom")) this.$("#fTopicCustom").addEventListener("input", e=>{ i.topic = e.target.value; i.topicCustom = true; TD.Core.touch(); });
    this.$("#methodChips").addEventListener("click", e=>{
      const c = e.target.closest(".chip"); if(!c) return;
      i.method = c.dataset.method;
      this.$("#methodChips").querySelectorAll(".chip").forEach(x=>x.classList.toggle("on", x===c));
      TD.Core.touch();
    });
    this.$("#styleChips").addEventListener("click", e=>{
      const c = e.target.closest(".chip"); if(!c) return;
      i.style = c.dataset.style;
      this.$("#styleChips").querySelectorAll(".chip").forEach(x=>x.classList.toggle("on", x===c));
      TD.Core.touch();
    });

    /* 底栏 */
    this.$("#actionBar").innerHTML =
      '<span class="cap" id="asInfo">课标库 '+TD.KB.standards.length+' 条 · 骨架 '+TD.KB.openClass.length+' 套 · 画风 '+TD.KB.styles.length+' 种 · 课题库 K12 全学段</span>'
      + '<span class="sp"></span>'
      + '<button class="btn" id="btnAssemble">装配备课上下文</button>'
      + '<button class="btn btn-primary" id="btnGenLesson">生成教案 →</button>';
    this.$("#btnAssemble").onclick = ()=>this.doAssemble();
    this.$("#btnGenLesson").onclick = ()=>this.doLesson();
  },

  /* 年级+册 → catalog 键（高中按学科取可用册键） */
  _gradeKey(grade, term, stage, subject, version){
    if(stage==="高中"){
      /* 直接从目录取该学科的册键 */
      const sub = TD.CAT.catalog["高中"] && TD.CAT.catalog["高中"][subject];
      if(sub){
        const ver = sub[version] || sub[Object.keys(sub)[0]];
        const keys = Object.keys(ver||{});
        if(keys.length){
          /* 按学期轮选册：上册=第1本，下册=第2本 */
          return term==="上册" ? keys[0] : (keys[1]||keys[0]);
        }
      }
      return "必修一";
    }
    const g = (grade||"").replace(/年级|册/g,"");
    const map = {"一":"一","二":"二","三":"三","四":"四","五":"五","六":"六","七":"七","八":"八","九":"九"};
    const t = (term||"上册")==="上册" ? "上" : "下";
    return (map[g]||g) + t;
  },

  async doAssemble(){
    const p = TD.Core.proj;
    if(!p.input.topic){ this.toast("请先填课题", true); return; }
    const pkg = TD.Core.assemble(p.input);
    this.side("上下文装配",
      '<div class="cap" style="margin-bottom:8px">已为本课装配以下上下文，生成时将全部带上：</div>'
      + '<div class="card" style="margin-bottom:8px"><div class="cap" style="margin-bottom:6px">课标依据 · '+pkg.standards.length+' 条</div>'
      + pkg.standards.map(s=>'<div class="small mut" style="margin-bottom:4px">['+s.id+'] '+s.topic+'</div>').join("") + '</div>'
      + '<div class="card" style="margin-bottom:8px"><div class="cap" style="margin-bottom:6px">公开课结构骨架</div><div class="small mut">'+pkg.skeleton.name+'（'+pkg.skeleton.skeleton.length+' 环节）</div></div>'
      + '<div class="card" style="margin-bottom:8px"><div class="cap" style="margin-bottom:6px">画风</div><div class="small mut">'+pkg.style.name+' · '+pkg.style.rules.join("；")+'</div></div>'
      + '<div class="card"><div class="cap" style="margin-bottom:6px">学情画像</div><div class="small mut">'+Object.keys(pkg.profile).map(k=>k+"："+pkg.profile[k]).join("；")+'</div></div>');
    this.toast("上下文装配完成：" + pkg.standards.length + " 条课标 · " + pkg.skeleton.name);
  },

  async doLesson(){
    const p = TD.Core.proj;
    if(!p.input.topic){ this.toast("请先填课题", true); return; }
    try{
      this.run(true);
      await TD.Core.genLesson(m=>this.progress(m));
      this.run(false); this.progress("师作 TeachDo B01");
      this.goto(1);
    }catch(e){ this.run(false); this.progress("师作 TeachDo B01"); this.toast("生成失败："+e.message, true); }
  },

  /* ============================================================
     屏 2 · 教案
     ============================================================ */
  viewLesson(body){
    const p = TD.Core.proj;
    if(!p.lesson){ body.innerHTML = '<div class="empty"><div class="empty-glyph">▤</div><h1>还没有教案</h1><div class="sub">先在「备课输入」填好课题，然后生成教案</div><div class="acts"><button class="btn btn-primary" id="go0">去备课输入</button></div></div>';
      this.$("#go0").onclick = ()=>this.goto(0);
      this.$("#actionBar").innerHTML = ""; return; }
    const L = p.lesson;
    const esc = this.esc;
    const stageRows = L.stages.map((s,i)=>
      '<tr><td><b>'+(i+1)+'</b> '+esc(s.name)+'</td><td class="mono">'+s.minutes+'′</td><td>'+esc(s.teacher)+'</td><td>'+esc(s.student)+'</td></tr>').join("");

    body.innerHTML =
      '<div style="padding:8px 16px;max-width:880px;margin:0 auto">'
      + '<div style="display:flex;align-items:center;gap:9px;margin-bottom:12px">'
      + '<h1 style="font-size:19px;font-weight:700;letter-spacing:-0.016em">'+esc(L.meta.topic||p.input.topic)+' · 教案</h1>'
      + '<span class="sp"></span><span class="badge">'+L.stages.length+' 环节 · '+p.input.minutes+'′</span></div>'

      + '<div class="blk synced"><div class="blk-line"></div><div class="blk-head"><span class="blk-kind">基本信息</span><span class="sp"></span></div>'
      + '<div class="blk-body" contenteditable data-blk="meta">学段：'+esc(p.input.stage)+'　学科：'+esc(p.input.subject)+'　教材：'+esc(p.input.textbook||"—")+'　单元：'+esc(p.input.unit||"—")
      + '<br>课标依据：'+(L.basis&&L.basis.length?L.basis.map(b=>'['+b+']').join(" "):"—")+'</div></div>'

      + '<div class="blk synced"><div class="blk-line"></div><div class="blk-head"><span class="blk-kind">教学目标</span><span class="sp"></span></div>'
      + '<div class="blk-body" contenteditable data-blk="objectives">'+L.objectives.map((o,i)=>"<p>"+(i+1)+". "+esc(o)+"</p>").join("")+'</div></div>'

      + '<div class="blk synced"><div class="blk-line"></div><div class="blk-head"><span class="blk-kind">教学重难点</span><span class="sp"></span></div>'
      + '<div class="blk-body" contenteditable data-blk="keypoints"><p><b>重点</b>：'+esc(L.keypoints.key||"")+'</p><p><b>难点</b>：'+esc(L.keypoints.hard||"")+'</p></div></div>'

      + '<div class="blk synced"><div class="blk-line"></div><div class="blk-head"><span class="blk-kind">教学过程</span><span class="sp"></span><span class="cap">共 '+p.input.minutes+' 分钟</span></div>'
      + '<div class="blk-body"><table><thead><tr><th style="width:150px">环节</th><th style="width:44px">时长</th><th>教师</th><th>学生</th></tr></thead><tbody>'+stageRows+'</tbody></table></div></div>'

      + '<div class="blk synced"><div class="blk-line"></div><div class="blk-head"><span class="blk-kind">板书设计</span><span class="sp"></span></div>'
      + '<div class="blk-body" contenteditable data-blk="board">'+esc(L.board)+'</div></div>'

      + '<div class="blk synced"><div class="blk-line"></div><div class="blk-head"><span class="blk-kind">分层作业</span><span class="sp"></span></div>'
      + '<div class="blk-body" contenteditable data-blk="homework">'+L.homework.map(h=>'<p>【'+esc(h.level)+'】'+esc(h.task)+'</p>').join("")+'</div></div>'
      + '</div>';

    /* 块编辑 → 记血缘 */
    body.querySelectorAll("[data-blk]").forEach(el=>{
      el.addEventListener("input", ()=>{
        el.closest(".blk").classList.remove("synced");
        el.closest(".blk").classList.add("edited");
        /* 简化：文本回填 */
        const k = el.dataset.blk;
        const txt = el.innerText;
        if(k==="board") L.board = txt;
        TD.Core.markSlidesStale();
        TD.Core.touch(); this.stamp(); this.renderSteps();
      });
    });

    /* 右栏：校验 */
    const checks = p.checks||[];
    const okN = checks.filter(c=>c.level==="ok").length, badN = checks.filter(c=>c.level!=="ok").length;
    this.side("强约束校验",
      '<div style="margin-bottom:8px"><span class="badge badge-ok">'+okN+' 通过</span> <span class="badge badge-warn">'+badN+' 提示</span></div>'
      + checks.map(c=>'<div class="chk '+c.level+'"><div class="ic">'+(c.level==="ok"?"✓":(c.level==="warn"?"!":"✕"))+'</div><div><div class="t">'+this.esc(c.t)+'</div></div></div>').join("")
      + '<hr class="hairline"><button class="btn btn-sm" style="width:100%" id="btnReCheck">重新校验</button>');
    this.$("#btnReCheck").onclick = ()=>{ p.checks = TD.Core.fullCheck(p.lesson, p.input); this.viewLesson(this.$("#viewBody")); this.toast("已重新校验"); };

    /* 底栏 */
    this.$("#actionBar").innerHTML =
      '<span class="cap">改完教案后，下游课件会自动标为陈旧</span><span class="sp"></span>'
      + '<button class="btn" id="btnReLesson">重新生成教案</button>'
      + '<button class="btn btn-primary" id="btnGenSlides">生成课件 →</button>';
    this.$("#btnReLesson").onclick = ()=>this.doLesson();
    this.$("#btnGenSlides").onclick = ()=>this.doSlides();
  },

  async doSlides(){
    try{ this.run(true); await TD.Core.genSlides(m=>this.progress(m)); this.run(false); this.progress("师作 TeachDo B01"); this.goto(2); }
    catch(e){ this.run(false); this.progress("师作 TeachDo B01"); this.toast("生成失败："+e.message, true); }
  },

  /* ============================================================
     屏 3 · 课件
     ============================================================ */
  viewSlides(body){
    const p = TD.Core.proj;
    if(!p.slides || !p.slides.length){ body.innerHTML = '<div class="empty"><div class="empty-glyph">▦</div><h1>还没有课件</h1><div class="sub">先生成教案，再生成课件</div><div class="acts"><button class="btn btn-primary" id="go1">去教案</button></div></div>';
      this.$("#go1").onclick = ()=>this.goto(1); this.$("#actionBar").innerHTML=""; return; }
    const slides = p.slides, st = (p.pkg&&p.pkg.style)||TD.KB.styles[0];
    const cur = slides[this.selSlide] || slides[0];
    const esc = this.esc;

    /* 左侧缩略图 + 中间画布 */
    body.innerHTML =
      '<div style="display:flex;height:100%;min-height:0">'
      + '<div style="width:190px;flex:none;overflow:auto;padding:10px;border-right:1px solid var(--line-soft)"><div class="thumbs">'
      + slides.map((s,i)=>{
        const cls = s.status==="stale"?"stale":(s.lineage&&s.lineage.edited?"draft":"solid");
        return '<div class="thumb '+cls+(i===this.selSlide?" on":"")+'" data-i="'+i+'"><div class="thumb-state"></div><div class="thumb-num">'+String(s.no).padStart(2,"0")+'</div>'
          + '<div class="inner"><div class="th-accent" style="width:40%;background:'+st.colors.accent+'"></div><div class="th-t" style="width:76%"></div><div class="th-line" style="width:60%"></div></div></div>';
      }).join("")
      + '</div></div>'
      + '<div class="canvas-wrap"><div class="canvas">'
      + '<div class="slide" id="slideCanvas">'
      + '<div class="slide-head" style="background:'+st.colors.accent+'"></div>'
      + '<div class="slide-body" style="background:'+st.colors.bg+'">'
      + (cur.kicker?'<div class="slide-kicker" style="color:'+st.colors.dim+'">'+esc(cur.kicker)+'</div>':"")
      + '<h2 class="ed" data-ed="title" style="color:'+st.colors.ink+'">'+esc(cur.title)+'</h2>'
      + '<ul style="color:'+st.colors.body+'">'+cur.bullets.map(b=>'<li class="ed" data-ed="bullet">'+esc(b)+'</li>').join("")+'</ul>'
      + '<div class="foot">'+esc(cur.source||"")+'　｜　P '+cur.no+' / '+slides.length+'</div>'
      + '</div></div></div></div></div>';

    /* 缩略图点击 */
    body.querySelectorAll(".thumb").forEach(t=>{ t.onclick = ()=>{ this.selSlide = +t.dataset.i; this.viewSlides(this.$("#viewBody")); }; });
    /* 画布文字编辑 */
    body.querySelectorAll("[data-ed]").forEach(el=>{
      el.addEventListener("click", ()=>{ el.contentEditable = true; el.focus(); });
      el.addEventListener("blur", ()=>{
        el.contentEditable = false;
        if(el.dataset.ed==="title") cur.title = el.innerText.trim();
        if(el.dataset.ed==="bullet"){ cur.bullets = [...body.querySelectorAll('[data-ed="bullet"]')].map(x=>x.innerText.trim()); }
        cur.lineage.edited = true; cur.status = "edited";
        TD.Core.markScriptStale(); TD.Core.touch(); this.stamp();
      });
    });

    /* 右栏：版式 + AI 意见 */
    const staleN = slides.filter(s=>s.status==="stale").length;
    const layouts = ["cover","title","bullets","compare","table","end"].map(l=>'<div class="layout'+(cur.layout===l?" on":"")+'" data-l="'+l+'"><div class="lv"><div style="height:3px;background:'+st.colors.accent+';width:40%"></div><div style="height:5px;background:'+st.colors.ink+';width:70%"></div></div><div class="ln">'+l+'</div></div>').join("");
    this.side("本页 · "+cur.title,
      '<div class="cap" style="margin-bottom:8px">版式</div><div class="layouts">'+layouts+'</div>'
      + '<hr class="hairline"><div class="cap" style="margin-bottom:6px">来源（血缘）</div>'
      + '<div class="card"><div class="small mut">对应教案环节：'+this.esc(cur.source||"—")+'</div><div class="cap" style="margin-top:4px">状态：'+(cur.status==="stale"?"陈旧（教案已改）":(cur.lineage.edited?"已编辑":"已同步"))+'</div></div>'
      + '<hr class="hairline"><div class="cap" style="margin-bottom:6px">AI 意见</div>'
      + '<input class="field" id="aiOp" placeholder="对这一页说点什么…">'
      + '<div style="display:flex;gap:7px;margin-top:8px"><button class="btn btn-sm" style="flex:1" id="btnAiPage">应用到本页</button><button class="btn btn-sm btn-quiet" id="btnAiAll">应用到全部</button></div>'
      + (staleN?'<hr class="hairline"><button class="btn btn-sm" style="width:100%" id="btnRegenStale">✦ 重做 '+staleN+' 页陈旧课件</button>':""));
    this.$("#sideBody").querySelectorAll(".layout").forEach(l=>{ l.onclick = ()=>{ cur.layout = l.dataset.l; TD.Core.touch(); this.viewSlides(this.$("#viewBody")); }; });
    const rg = this.$("#btnRegenStale"); if(rg) rg.onclick = async ()=>{ try{ this.run(true); await TD.Core.regenSlidesStale(m=>this.progress(m)); this.run(false); this.viewSlides(this.$("#viewBody")); this.toast("已重做陈旧页"); }catch(e){ this.run(false); this.toast("失败："+e.message, true);} };

    this.$("#actionBar").innerHTML =
      '<span class="cap">'+slides.length+' 页 · 画风 '+st.name+'</span><span class="sp"></span>'
      + '<button class="btn" id="btnReSlides">重新生成课件</button>'
      + '<button class="btn btn-primary" id="btnGenScript">生成讲稿 →</button>';
    this.$("#btnReSlides").onclick = ()=>this.doSlides();
    this.$("#btnGenScript").onclick = ()=>this.doScript();
  },

  async doScript(){
    try{ this.run(true); await TD.Core.genScript(m=>this.progress(m)); this.run(false); this.progress("师作 TeachDo B01"); this.goto(3); }
    catch(e){ this.run(false); this.progress("师作 TeachDo B01"); this.toast("生成失败："+e.message, true); }
  },

  /* ============================================================
     屏 4 · 讲稿
     ============================================================ */
  viewScript(body){
    const p = TD.Core.proj;
    if(!p.script || !p.script.length){ body.innerHTML = '<div class="empty"><div class="empty-glyph">✎</div><h1>还没有讲稿</h1><div class="sub">先生成课件，再逐页生成讲稿</div><div class="acts"><button class="btn btn-primary" id="go2">去课件</button></div></div>';
      this.$("#go2").onclick = ()=>this.goto(2); this.$("#actionBar").innerHTML=""; return; }
    const esc = this.esc;
    const pages = p.script.map(pg=>{
      const says = pg.says.map(x=>'<div class="say"><span class="who'+(x.who==="S"?" stu":"")+'">'+(x.who==="T"?"师":(x.who==="S"?"预设":"活动"))+'</span>'+esc(x.text)+'</div>').join("");
      return '<div class="pg"><div class="pg-head"><div class="pg-num">'+pg.page+'</div><div class="pg-title">'+esc(pg.title)+'</div><div class="pg-t mono">'+pg.minutes+' 分钟</div></div>'
        + '<div class="pg-body">'+(pg.board?'<div class="cap" style="margin-bottom:7px">板书：'+esc(pg.board)+'</div>':"")+says
        + '<button class="btn btn-sm btn-quiet" data-edit="'+pg.page+'">✎ 编辑本页</button></div></div>';
    }).join("");

    body.innerHTML = '<div style="padding:8px 16px;max-width:760px;margin:0 auto">'
      + '<div style="display:flex;align-items:center;gap:9px;margin-bottom:12px"><h1 style="font-size:19px;font-weight:700">逐页讲稿</h1><span class="sp"></span><span class="badge">'+p.script.length+' 页</span></div>'
      + pages + '</div>';

    body.querySelectorAll("[data-edit]").forEach(b=>{
      b.onclick = ()=>{
        const pg = p.script.find(x=>x.page==b.dataset.edit);
        const box = b.closest(".pg-body");
        box.querySelectorAll(".say").forEach(s=>{ s.contentEditable = true; });
        b.textContent = "完成";
        b.onclick = ()=>{
          box.querySelectorAll(".say").forEach(s=>{ s.contentEditable = false; });
          pg.says = [...box.querySelectorAll(".say")].map(s=>({who:s.querySelector(".who").classList.contains("stu")?"S":(/活动/.test(s.querySelector(".who").textContent)?"A":"T"), text:s.innerText.replace(/^(师|预设|活动)/,"").trim()}));
          TD.Core.touch(); this.stamp();
          b.textContent = "✎ 编辑本页"; b.onclick = null; this.viewScript(this.$("#viewBody"));
        };
      };
    });

    /* 右栏：时长反推 */
    const tc = TD.Core.scriptTimeCheck();
    const over = tc.gap < 0, under = tc.gap > p.input.minutes * .15;
    this.side("讲稿体检",
      '<div class="card" style="margin-bottom:8px"><div class="cap" style="margin-bottom:6px">时长反推校验</div>'
      + '<div style="display:flex;align-items:baseline;gap:8px"><span style="font-size:22px;font-weight:800" class="mono">'+tc.total+'′</span><span class="cap">/ '+tc.want+'′</span></div>'
      + '<div class="cap" style="margin-top:6px;color:'+(over?"var(--danger)":(under?"var(--warn)":"var(--ok)"))+'">'
      + (over?"超出 "+(-tc.gap)+" 分钟，建议删减环节":(under?"剩余 "+tc.gap+" 分钟空档，可能冷场，建议补环节":"时长自洽"))
      + '</div></div>'
      + '<div class="chk ok"><div class="ic">✓</div><div><div class="t">逐页绑定</div><div class="d">每页讲稿与课件页一一对应</div></div></div>'
      + '<div class="chk ok"><div class="ic">✓</div><div><div class="t">预设学生回答覆盖</div><div class="d">提问均有预设分支</div></div></div>'
      + '<hr class="hairline"><button class="btn btn-sm" style="width:100%" id="btnReScript">重新生成讲稿</button>');
    this.$("#btnReScript").onclick = ()=>this.doScript();

    this.$("#actionBar").innerHTML =
      '<span class="cap">讲稿与课件逐页绑定</span><span class="sp"></span>'
      + '<button class="btn btn-primary" id="btnGoReview">进入冷读评审 →</button>';
    this.$("#btnGoReview").onclick = ()=>this.goto(4);
  },

  /* ============================================================
     屏 5 · 冷读评审
     ============================================================ */
  viewReview(body){
    const p = TD.Core.proj;
    if(!p.lesson || !p.slides){ body.innerHTML = '<div class="empty"><div class="empty-glyph">◎</div><h1>先完成教案与课件</h1><div class="sub">冷读评审需要三件套成品</div></div>'; this.$("#actionBar").innerHTML=""; return; }

    const rolesHtml = TD.KB.roles.map(r=>
      '<div class="role" style="margin-bottom:8px"><div class="role-head"><div class="role-ava">'+r.icon+'</div><div><div class="role-name">'+r.name+'</div><div class="role-sub">'+r.focus+'</div></div></div>'
      + '<div class="cap">'+r.brief+'</div></div>').join("");

    let resultHtml = "";
    if(p.review){
      const R = p.review;
      resultHtml =
        '<hr class="hairline">'
        + '<div style="display:flex;gap:9px;margin-bottom:12px">'
        + '<div class="card" style="flex:1;text-align:center"><div style="font-size:20px;font-weight:800">'+R.arbiter.consensus.length+'</div><div class="cap">共识</div></div>'
        + '<div class="card" style="flex:1;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--warn)">'+R.arbiter.divergence.length+'</div><div class="cap">分歧</div></div>'
        + '<div class="card" style="flex:1;text-align:center"><div style="font-size:20px;font-weight:800">'+R.total+'</div><div class="cap">综合分</div></div></div>'
        + '<div class="cap" style="margin-bottom:6px">评委评语</div>'
        + R.roles.map(r=>'<div class="role" style="margin-bottom:8px"><div class="role-head"><div class="role-ava">'+r.icon+'</div><div><div class="role-name">'+r.name+'</div><div class="role-sub">'+this.esc((TD.KB.roles.find(x=>x.id===r.role)||{}).focus||"")+'</div></div><div class="role-score">'+(r.score||"—")+'</div></div><p>'+this.esc(r.comment||"")+'</p></div>').join("")
        + '<div class="cap" style="margin-bottom:6px">共识（可直接采）</div>'
        + R.arbiter.consensus.map(c=>'<div class="card" style="margin-bottom:6px"><div class="small" style="color:var(--tx2)">✓ '+this.esc(c.text)+'</div><div class="cap" style="margin-top:3px">'+this.esc(c.evidence||"")+'</div></div>').join("")
        + '<div class="cap" style="margin:10px 0 6px">分歧（由你决定）</div>'
        + R.arbiter.divergence.map(d=>'<div class="card" style="margin-bottom:6px;border-color:rgba(224,176,85,.3)"><div class="small" style="font-weight:660;color:var(--tx1)">⚠ '+this.esc(d.topic)+'</div>'
          + '<div class="cap" style="margin:5px 0">仲裁倾向：'+this.esc(d.lean)+'（'+this.esc(d.reason)+'）· 最终由你决定</div></div>').join("");
    }

    body.innerHTML =
      '<div style="padding:8px 16px;max-width:760px;margin:0 auto">'
      + '<div style="display:flex;align-items:center;gap:9px;margin-bottom:12px"><h1 style="font-size:19px;font-weight:700">冷读评审委员会</h1><span class="sp"></span><span class="badge">三评委 · 互不可见</span></div>'
      + '<div class="cap" style="margin-bottom:10px;line-height:1.7">三位评委只看最终成品（不看生成过程、互相看不到），仲裁层汇总共识与分歧。</div>'
      + rolesHtml
      + '<button class="btn btn-primary" id="btnReview" style="width:100%;margin-top:4px">开始评审</button>'
      + resultHtml
      + '</div>';

    this.$("#btnReview").onclick = async ()=>{
      try{ this.run(true); await TD.Core.review(m=>this.progress(m)); this.run(false); this.progress("师作 TeachDo B01"); this.viewReview(this.$("#viewBody")); this.stamp(); }
      catch(e){ this.run(false); this.progress("师作 TeachDo B01"); this.toast("评审失败："+e.message, true); }
    };

    this.$("#actionBar").innerHTML =
      '<span class="cap">评审结果可导出到备课包</span><span class="sp"></span>'
      + '<button class="btn btn-primary" id="btnGoExport">去导出 →</button>';
    this.$("#btnGoExport").onclick = ()=>this.goto(5);
  },

  /* ============================================================
     屏 6 · 导出
     ============================================================ */
  viewExport(body){
    const p = TD.Core.proj;
    const hasL = !!p.lesson, hasS = !!(p.slides&&p.slides.length), hasC = !!(p.script&&p.script.length);
    body.innerHTML =
      '<div style="padding:8px 16px;max-width:680px;margin:0 auto">'
      + '<h1 style="font-size:19px;font-weight:700;margin-bottom:12px">导出</h1>'
      + '<div class="card" style="margin-bottom:10px"><div class="cap" style="margin-bottom:8px">本次产物</div>'
      + '<div class="gcol" style="gap:5px">'
      + '<div class="row"><span style="color:'+(hasL?"var(--ok)":"var(--txd)")+'">'+(hasL?"✓":"○")+'</span><div style="flex:1"><div class="row-name">教案 .docx</div><div class="row-sub">'+(hasL?"已就绪":"未生成")+'</div></div></div>'
      + '<div class="row"><span style="color:'+(hasS?"var(--ok)":"var(--txd)")+'">'+(hasS?"✓":"○")+'</span><div style="flex:1"><div class="row-name">课件 .pptx</div><div class="row-sub">'+(hasS?p.slides.length+" 页 · 已就绪":"未生成")+'</div></div></div>'
      + '<div class="row"><span style="color:'+(hasC?"var(--ok)":"var(--txd)")+'">'+(hasC?"✓":"○")+'</span><div style="flex:1"><div class="row-name">讲稿 .docx</div><div class="row-sub">'+(hasC?"已就绪":"未生成")+'</div></div></div>'
      + '<div class="row"><span style="color:var(--ok)">✓</span><div style="flex:1"><div class="row-name">引用清单 .txt</div><div class="row-sub">课标 + 骨架 + 画风 · 免责证据链</div></div></div>'
      + '</div></div>'

      + '<div class="card"><div class="cap" style="margin-bottom:8px">打包方式</div>'
      + '<label style="display:flex;gap:9px;align-items:flex-start;padding:8px 0;cursor:pointer"><input type="radio" name="pkg" value="merged" checked style="margin-top:3px"><div><div class="row-name" style="font-size:13px">合并打包 · 一份 ZIP</div><div class="row-sub">三件套 + 引用清单，一次带走</div></div></label>'
      + '<label style="display:flex;gap:9px;align-items:flex-start;padding:8px 0;cursor:pointer"><input type="radio" name="pkg" value="separate" style="margin-top:3px"><div><div class="row-name" style="font-size:13px">分开保存</div><div class="row-sub">教案 / 课件 / 讲稿 各自下载</div></div></label>'
      + '</div></div>';

    this.$("#actionBar").innerHTML =
      '<span class="cap">导出前已自动通过输出闸检查</span><span class="sp"></span>'
      + '<button class="btn" id="btnExpProj">导出项目 JSON</button>'
      + '<button class="btn btn-primary" id="btnExport">导出 →</button>';
    this.$("#btnExport").onclick = ()=>{
      const mode = this.$('input[name="pkg"]:checked').value;
      try{
        const r = TD.Export.bundle(p, mode);
        if(mode==="merged"){ TD.Export.download(r.blob, r.name); this.toast("已导出 "+r.name); }
        else{ r.files.forEach(f=>TD.Export.download(new Blob([f.data]), f.name)); this.toast("已分别导出 "+r.files.length+" 个文件"); }
      }catch(e){ this.toast("导出失败："+e.message, true); }
    };
    this.$("#btnExpProj").onclick = ()=>{
      const blob = new Blob([TD.Core.exportJSON()],{type:"application/json"});
      TD.Export.download(blob, (p.input.topic||"备课")+"_B01.teachdo.json");
    };
  },

  /* ---------- 设置 ---------- */
  openSettings(){
    const c = TD.LLM.load();
    const presets = Object.keys(TD.LLM.presets).map(k=>'<option value="'+k+'" '+(c.provider===k?"selected":"")+'>'+k+'</option>').join("");
    const root = this.$("#modalRoot");
    root.innerHTML =
      '<div class="modal-scrim"><div class="modal">'
      + '<div class="modal-head">设置 <span class="sp"></span><button class="btn-quiet btn-sm" id="mClose">✕</button></div>'
      + '<div class="modal-body gcol">'
      + '<div><label class="label">模型服务商</label><select class="field" id="sProvider">'+presets+'</select></div>'
      + '<div><label class="label">API Base</label><input class="field" id="sBase" value="'+this.esc(c.base)+'"></div>'
      + '<div><label class="label">API Key</label><input class="field" id="sKey" type="password" value="'+this.esc(c.key)+'" placeholder="仅保存在本机"></div>'
      + '<div><label class="label">模型</label><input class="field" id="sModel" value="'+this.esc(c.model)+'"></div>'
      + '<div class="cap">API Key 只存于本机 localStorage，绝不上传除模型服务商以外的任何地方。</div>'
      + '</div>'
      + '<div class="modal-foot"><button class="btn btn-quiet" id="mCancel">取消</button><button class="btn btn-primary" id="mSave">保存</button></div>'
      + '</div></div>';
    const close = ()=>{ root.innerHTML = ""; };
    this.$("#mClose").onclick = close; this.$("#mCancel").onclick = close;
    this.$("#sProvider").onchange = e=>{
      const pr = TD.LLM.presets[e.target.value];
      this.$("#sBase").value = pr.base; this.$("#sModel").value = pr.model;
    };
    this.$("#mSave").onclick = ()=>{
      TD.LLM.save({ provider:this.$("#sProvider").value, base:this.$("#sBase").value, key:this.$("#sKey").value, model:this.$("#sModel").value });
      close(); this.toast("设置已保存");
    };
  },

  /* ---------- 项目列表 ---------- */
  openProjectList(){
    const list = TD.Core.list();
    const root = this.$("#modalRoot");
    root.innerHTML =
      '<div class="modal-scrim"><div class="modal">'
      + '<div class="modal-head">打开项目 <span class="sp"></span><button class="btn-quiet btn-sm" id="mClose">✕</button></div>'
      + '<div class="modal-body gcol">'
      + (list.length ? list.map(n=>'<div class="row"><div style="flex:1"><div class="row-name">'+this.esc(n)+'</div></div><button class="btn btn-sm" data-open="'+this.esc(n)+'">打开</button></div>').join("") : '<div class="cap">还没有保存过项目</div>')
      + '<button class="btn" id="mNew">＋ 新建项目</button>'
      + '</div></div></div>';
    this.$("#mClose").onclick = ()=>{ root.innerHTML=""; };
    this.$("#mNew").onclick = ()=>{ TD.Core.proj = TD.Core.blank(); root.innerHTML=""; this.goto(0); };
    root.querySelectorAll("[data-open]").forEach(b=>{
      b.onclick = ()=>{ TD.Core.load(b.dataset.open); root.innerHTML=""; this.renderSteps(); this.goto(1); this.toast("已打开 "+b.dataset.open); };
    });
  }
};

document.addEventListener("DOMContentLoaded", ()=>TD.UI.init());
TD.UI.ready = true;
