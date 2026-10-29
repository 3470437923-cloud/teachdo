/* ============================================================
   师作 TeachDo B01 · LLM 网关 llm.js
   纯云 API（OpenAI 兼容 / DeepSeek / 通义），流式输出，
   结构化 JSON 约束 + 重试。配置仅存本机 localStorage。
   ============================================================ */
"use strict";
window.TD = window.TD || {};

TD.LLM = {
  cfg: null,
  load(){
    try{ this.cfg = JSON.parse(localStorage.getItem("td_llm")||"null"); }catch(e){ this.cfg=null; }
    if(!this.cfg) this.cfg = { base:"https://api.deepseek.com", key:"", model:"deepseek-chat", provider:"deepseek" };
    return this.cfg;
  },
  save(c){ this.cfg = c; localStorage.setItem("td_llm", JSON.stringify(c)); },
  presets:{
    deepseek:{ base:"https://api.deepseek.com", model:"deepseek-chat" },
    qwen:{ base:"https://dashscope.aliyuncs.com/compatible-mode/v1", model:"qwen-plus" },
    moonshot:{ base:"https://api.moonshot.cn/v1", model:"kimi-k2-0905-preview" },
    openai:{ base:"https://api.openai.com/v1", model:"gpt-4o-mini" }
  },

  /* 非流式 JSON 生成（主要路径）：结构化输出 + 重试 */
  async json(system, user, opts){
    opts = opts||{};
    const cfg = this.cfg || this.load();
    if(!cfg.key) throw new Error("尚未配置 API Key。点右上角 ⚙ 设置。");
    const url = cfg.base.replace(/\/+$/,"") + "/chat/completions";
    const body = {
      model: cfg.model,
      messages:[{role:"system",content:system},{role:"user",content:user}],
      temperature: opts.temperature!=null ? opts.temperature : 0.6,
      response_format:{type:"json_object"}
    };
    const maxTry = opts.retry!=null ? opts.retry : 2;
    let lastErr = null;
    for(let t=0;t<=maxTry;t++){
      try{
        const r = await fetch(url,{ method:"POST", headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+cfg.key }, body:JSON.stringify(body) });
        if(!r.ok){
          const txt = await r.text().catch(()=>"" );
          throw new Error("HTTP "+r.status+"："+txt.slice(0,200));
        }
        const data = await r.json();
        const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if(!content) throw new Error("模型返回为空");
        return TD.LLM.parseJSON(content);
      }catch(e){
        lastErr = e;
        if(e.message && /^HTTP 4(01|03)/.test(e.message)) break; // 鉴权错误不重试
        await new Promise(res=>setTimeout(res, 600*(t+1)));
      }
    }
    throw lastErr;
  },

  /* 修复回路：带错误清单重试 */
  async jsonRepair(system, taskPrompt, badOutput, errors, opts){
    const user = TD.P.repair(taskPrompt, badOutput, errors);
    return this.json(system, user, Object.assign({temperature:0.3}, opts||{}));
  },

  /* 解析 JSON：容忍围栏与前后杂质，但记录 */
  parseJSON(s){
    if(typeof s !== "string") throw new Error("返回不是字符串");
    let t = s.trim();
    t = t.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"").trim();
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if(a>=0 && b>a) t = t.slice(a, b+1);
    return JSON.parse(t);
  },

  /* 流式（右栏聊天用） */
  async stream(system, user, onChunk){
    const cfg = this.cfg || this.load();
    if(!cfg.key) throw new Error("尚未配置 API Key。点右上角 ⚙ 设置。");
    const url = cfg.base.replace(/\/+$/,"") + "/chat/completions";
    const r = await fetch(url,{ method:"POST", headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+cfg.key },
      body:JSON.stringify({ model:cfg.model, messages:[{role:"system",content:system},{role:"user",content:user}], temperature:0.7, stream:true }) });
    if(!r.ok) throw new Error("HTTP "+r.status);
    const reader = r.body.getReader(); const dec = new TextDecoder("utf-8");
    let buf = "";
    for(;;){
      const {done, value} = await reader.read();
      if(done) break;
      buf += dec.decode(value, {stream:true});
      let idx;
      while((idx = buf.indexOf("\n")) >= 0){
        const line = buf.slice(0, idx).trim(); buf = buf.slice(idx+1);
        if(!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if(payload === "[DONE]") return;
        try{
          const j = JSON.parse(payload);
          const d = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content;
          if(d) onChunk(d);
        }catch(e){/* 半行，忽略 */}
      }
    }
  }
};
TD.LLM.ready = true;
