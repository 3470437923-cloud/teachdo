/* ============================================================
   师作 TeachDo B02 · 设置屏 SettingsScreen.tsx
   移植 DeepCompose ProviderSection 的完整能力：
     平台瓷贴（地址内置可改）· 检测连接（自动+手动，请求序号防竞态）
     · /models 拉清单 → 自绘模型下拉（只选不混填、可筛选）
     · 具名配置（多条 url+key 档位：应用/覆盖/删除）
     · Key 显隐 + 遮罩回显 · 温度 · 省 token 开关
   自动保存：改动 900ms 防抖落盘，也可点「保存」立即生效。
   ============================================================ */
import { useEffect, useRef, useState } from "react";
import {
  PLATFORMS, presetOf, platformOfUrl, fetchModels, maskKey,
  type PlatformId, type ProviderProfile,
} from "../core/llm";
import { getSettings, putSettings, setState } from "../store";

/* ---------- 自绘模型下拉 ---------- */
function ModelSelect({ value, options, onChange }: {
  value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); setOpen(false); }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((m) => m.toLowerCase().includes(q)) : options;

  return (
    <div className="combo" ref={wrapRef}>
      <button
        type="button" className="a-form-input" style={{ textAlign: "left", cursor: "pointer" }}
        aria-haspopup="listbox" aria-expanded={open}
        onClick={() => { setOpen((v) => !v); setQuery(""); }}
      >
        <span style={{ color: value ? "var(--tx-1)" : "var(--tx-dim)" }}>
          {value || "请选择模型（先点「检测连接」拉取清单）"}
        </span>
      </button>
      {open ? (
        <div className="combo-pop">
          {options.length > 6 ? (
            <input
              autoFocus className="a-form-input" style={{ margin: 4, width: "calc(100% - 8px)" }}
              placeholder="筛选模型…" value={query} onChange={(e) => setQuery(e.target.value)}
            />
          ) : null}
          {filtered.length === 0 ? (
            <div className="combo-empty">
              {options.length === 0 ? "尚未拉取到模型清单，请先点上方「检测连接」" : "无匹配模型"}
            </div>
          ) : filtered.map((m) => (
            <button
              key={m} type="button"
              className={"combo-item" + (m === value ? " on" : "")}
              onClick={() => { onChange(m); setOpen(false); }}
            >
              {m}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function profileId(name: string, baseUrl: string): string {
  return `${name}|${baseUrl}`;
}

export function SettingsScreen() {
  const [form, setForm] = useState(() => getSettings());
  const [conn, setConn] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [connMsg, setConnMsg] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [showKey, setShowKey] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [localMsg, setLocalMsg] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const detectSeq = useRef(0);
  const stableKeyRef = useRef(form.apiKey);
  const saveTimer = useRef<number | undefined>(undefined);

  /* 平台高亮：显式点选优先，否则由地址推断 */
  const [chosen, setChosen] = useState<PlatformId | null>(null);
  const current: PlatformId = chosen ?? platformOfUrl(form.baseUrl);
  const preset = presetOf(current);

  /* 自动保存（900ms 防抖） */
  useEffect(() => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      putSettings(form);
    }, 900);
    return () => window.clearTimeout(saveTimer.current);
  }, [form]);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  /* ---------- 检测连接 ---------- */
  const detect = async () => {
    if (!form.baseUrl.trim() || !form.apiKey.trim()) {
      setConn("error"); setConnMsg("请先填写接口地址与 API Key");
      return;
    }
    const seq = ++detectSeq.current;
    setConn("testing"); setConnMsg("");
    try {
      const list = await fetchModels(form.baseUrl.trim(), form.apiKey.trim());
      if (seq !== detectSeq.current) return;
      setModels(list);
      setConn(list.length ? "ok" : "error");
      setConnMsg(list.length ? `连接正常，获取到 ${list.length} 个模型` : "连接正常，但端点未返回模型清单");
      if (list.length && !form.model) update("model", list[0]);
    } catch (e) {
      if (seq !== detectSeq.current) return;
      setConn("error");
      setConnMsg(e instanceof Error ? e.message : String(e));
    }
  };

  /* 端点/Key 变化：重置检测；未动过的 Key 自动检测一次（半截 Key 不发上游） */
  useEffect(() => {
    setConn("idle"); setConnMsg(""); setModels([]);
    if (form.apiKey === stableKeyRef.current && form.baseUrl.trim() && form.apiKey.trim()) {
      const t = window.setTimeout(() => void detect(), 600);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.baseUrl, form.apiKey]);

  const choosePlatform = (id: PlatformId) => {
    const p = presetOf(id);
    setChosen(id);
    setForm((f) => ({ ...f, platform: id, baseUrl: p.baseUrl || f.baseUrl }));
    setLocalMsg("");
  };

  const modelOptions = Array.from(new Set([...preset.suggestedModels, ...models]));

  /* ---------- 具名配置 ---------- */
  const saveAsNew = () => {
    const name = profileName.trim() || `${preset.label} ${form.profiles.length + 1}`;
    const entry: ProviderProfile = {
      id: profileId(name, form.baseUrl), name, platform: current,
      baseUrl: form.baseUrl, apiKey: form.apiKey, model: form.model,
    };
    const next = [...form.profiles.filter((p) => p.id !== entry.id), entry];
    update("profiles", next);
    setProfileName("");
    setLocalMsg(`已保存「${name}」`);
  };
  const applyProfile = (p: ProviderProfile) => {
    setForm((f) => ({ ...f, platform: p.platform, baseUrl: p.baseUrl, apiKey: p.apiKey, model: p.model }));
    setChosen(p.platform);
    stableKeyRef.current = p.apiKey;
    setLocalMsg(`已切换到「${p.name}」`);
  };
  const overwriteProfile = (p: ProviderProfile) => {
    const entry: ProviderProfile = { ...p, baseUrl: form.baseUrl, apiKey: form.apiKey, model: form.model, platform: current };
    update("profiles", form.profiles.map((x) => (x.id === p.id ? entry : x)));
    setLocalMsg(`已用当前值覆盖「${p.name}」`);
  };
  const deleteProfile = (p: ProviderProfile) => {
    update("profiles", form.profiles.filter((x) => x.id !== p.id));
    setLocalMsg(`已删除「${p.name}」`);
  };

  const saveNow = () => {
    putSettings(form);
    setSaveMsg("已保存");
    window.setTimeout(() => setSaveMsg(""), 1500);
  };

  return (
    <div className="settings-screen">
      <div className="set-head">
        <button className="btn btn-quiet" onClick={() => setState({ settingsOpen: false })}>← 返回</button>
        <span className="title">设置</span>
        <span className="sp" style={{ flex: 1 }} />
      </div>

      <div className="set-body">
        <div className="set-main">
          <div className="set-inner">

            {/* 平台 */}
            <div className="a-card">
              <div className="a-card-head">
                <span className="a-card-title">平台</span>
                <span className="a-card-side">{preset.label}</span>
              </div>
              <div className="a-card-desc">内置接口地址随平台自动填入（仍可改）。选「自定义 API」可接任何 OpenAI 兼容端点。</div>
              <div className="a-platform-grid" role="radiogroup" aria-label="平台">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id} type="button" role="radio" aria-checked={current === p.id}
                    className={"a-platform-tile" + (current === p.id ? " on" : "")}
                    onClick={() => choosePlatform(p.id)}
                  >
                    <span className="a-platform-name">{p.label}</span>
                    <span className="a-platform-hint">{p.hint}</span>
                    <span className="a-platform-url">{p.baseUrl || "自填端点"}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 接入参数 */}
            <div className="a-card">
              <div className="a-card-head">
                <span className="a-card-title">接入参数</span>
                {conn === "ok" ? <span className="d-badge ok"><i />已连接</span>
                  : conn === "testing" ? <span className="d-badge off"><i />检测中…</span>
                  : conn === "error" ? <span className="d-badge bad"><i />连接失败</span>
                  : <span className="d-badge off"><i />未检测</span>}
                <button className="a-toolbtn" style={{ marginLeft: 8 }} onClick={() => void detect()} disabled={conn === "testing"}>
                  {conn === "testing" ? "检测中…" : "检测连接"}
                </button>
                <span className="a-card-side">{form.model || "未选择模型"}</span>
              </div>
              {connMsg ? <div className={"a-flash" + (conn === "error" ? " error" : "")}>{connMsg}</div> : null}
              <div className="a-card-desc">填好地址与 Key 后自动检测并拉取模型清单，也可手动检测。所有改动自动保存。</div>

              <div className="a-form-row">
                <label className="a-form-label">
                  接口地址（Base URL）
                  {preset.baseUrl && form.baseUrl === preset.baseUrl ? <span style={{ fontWeight: 400, marginLeft: 6 }}>（{preset.label} 内置地址）</span> : null}
                </label>
                <input
                  className="a-form-input" type="text" placeholder="https://api.deepseek.com"
                  value={form.baseUrl} spellCheck={false}
                  onChange={(e) => { setChosen(null); update("baseUrl", e.target.value); }}
                />
              </div>

              <div className="a-form-row">
                <label className="a-form-label">API Key</label>
                <div className="a-key-row">
                  <input
                    className="a-form-input" type={showKey ? "text" : "password"} placeholder="sk-…"
                    value={form.apiKey} spellCheck={false} autoComplete="off"
                    onChange={(e) => update("apiKey", e.target.value)}
                  />
                  <button type="button" className="a-toolbtn" onClick={() => setShowKey((v) => !v)}>
                    {showKey ? "隐藏" : "显示"}
                  </button>
                </div>
                <div className="a-key-mask">当前：{maskKey(form.apiKey)}　·　仅存本机</div>
              </div>

              <div className="a-form-row">
                <label className="a-form-label">
                  模型{models.length > 0 ? <span style={{ fontWeight: 400, marginLeft: 6 }}>（检测到 {models.length} 个，点开下拉选择）</span> : null}
                </label>
                <ModelSelect value={form.model} options={modelOptions} onChange={(v) => update("model", v)} />
              </div>

              <div className="a-form-row">
                <label className="a-form-label">温度（{form.temperature}）</label>
                <input
                  type="range" min={0} max={1.5} step={0.05} style={{ width: "100%" }}
                  value={form.temperature}
                  onChange={(e) => update("temperature", parseFloat(e.target.value))}
                />
              </div>
            </div>

            {/* 生成模式 */}
            <div className="a-card">
              <div className="a-card-head"><span className="a-card-title">课件生成模式</span></div>
              <div className="a-card-row">
                <div>
                  <div className="row-name">省 token 模式</div>
                  <div className="row-sub">
                    {form.economy
                      ? "整套课件一次生成（1–3 次调用），版式多样性略降"
                      : "Agent 完整回路：策划 → 逐页设计 → 逐页自检修复（约 10–20 次调用，质量优先）"}
                  </div>
                </div>
                <span className="sp" />
                <button className={"a-switch" + (form.economy ? " on" : "")} onClick={() => update("economy", !form.economy)}><i /></button>
              </div>
            </div>

            {/* 具名配置 */}
            <div className="a-card">
              <div className="a-card-head">
                <span className="a-card-title">具名配置</span>
                <span className="a-card-side">{form.profiles.length} 条</span>
              </div>
              <div className="a-card-desc">把当前地址与 Key 存成命名档位，之后一键切换（多 Key / 多模型场景）。</div>
              {form.profiles.length === 0 ? (
                <div className="cap" style={{ padding: "4px 0 10px" }}>还没有已保存的配置。</div>
              ) : form.profiles.map((p) => {
                const on = p.baseUrl === form.baseUrl && p.apiKey === form.apiKey && p.model === form.model;
                return (
                  <div key={p.id} className={"a-profile-row" + (on ? " on" : "")}>
                    <div>
                      <div className="a-profile-name">{p.name}{on ? <span className="a-profile-tag">当前</span> : null}</div>
                      <div className="a-profile-meta">{presetOf(p.platform).label} · {p.model || "未选模型"} · {maskKey(p.apiKey)}</div>
                    </div>
                    <div className="a-profile-actions">
                      <button className="a-toolbtn" disabled={on} onClick={() => applyProfile(p)}>应用</button>
                      <button className="a-toolbtn" onClick={() => overwriteProfile(p)}>覆盖</button>
                      <button className="a-toolbtn danger" onClick={() => deleteProfile(p)}>删除</button>
                    </div>
                  </div>
                );
              })}
              <div className="a-key-row" style={{ marginTop: 8 }}>
                <input
                  className="a-form-input" placeholder={preset.label + " 配置"}
                  value={profileName} onChange={(e) => setProfileName(e.target.value)}
                />
                <button className="a-toolbtn" onClick={saveAsNew} disabled={!form.baseUrl.trim()}>保存为新配置</button>
              </div>
              {localMsg ? <div className="cap" style={{ marginTop: 6 }}>{localMsg}</div> : null}
            </div>

            <div className="row" style={{ marginBottom: 24 }}>
              <button className="btn btn-primary" onClick={saveNow}>保存</button>
              {saveMsg ? <span className="cap">{saveMsg}</span> : null}
              <span className="sp" />
              <span className="cap">API Key 只存于本机，除模型服务商外不发往任何地方。</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
