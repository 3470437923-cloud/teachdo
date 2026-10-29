/* ============================================================
   师作 TeachDo B02 · LLM 网关 llm.ts
   网络请求走 Rust 侧（避开 WebView CORS）；纯浏览器 dev 时
   回落到 fetch。结构化 JSON + 重试 + 修复回路。
   设置只存本机 localStorage。
   ============================================================ */

export type PlatformId = "deepseek" | "qwen" | "moonshot" | "openai" | "custom";

export interface PlatformPreset {
  id: PlatformId;
  label: string;
  baseUrl: string;
  suggestedModels: string[];
  hint: string;
}

export const PLATFORMS: PlatformPreset[] = [
  { id: "deepseek", label: "DeepSeek 官方", baseUrl: "https://api.deepseek.com",
    suggestedModels: ["deepseek-chat", "deepseek-reasoner"],
    hint: "官方直连，长上下文，性价比高。" },
  { id: "qwen", label: "通义千问", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    suggestedModels: ["qwen-plus", "qwen-max", "qwen-turbo"],
    hint: "阿里云百炼，OpenAI 兼容端点。" },
  { id: "moonshot", label: "月之暗面", baseUrl: "https://api.moonshot.cn/v1",
    suggestedModels: ["kimi-k2-0905-preview", "moonshot-v1-32k"],
    hint: "Kimi，长文本见长。" },
  { id: "openai", label: "OpenAI", baseUrl: "https://api.openai.com/v1",
    suggestedModels: ["gpt-4o-mini", "gpt-4o"],
    hint: "需要可直连的网络环境。" },
  { id: "custom", label: "自定义 API", baseUrl: "",
    suggestedModels: [],
    hint: "任何 OpenAI 兼容端点，地址自填。" },
];

export function presetOf(id: PlatformId): PlatformPreset {
  return PLATFORMS.find((p) => p.id === id) || PLATFORMS[PLATFORMS.length - 1];
}

/* 由地址反推平台（手改地址后高亮跟随） */
export function platformOfUrl(url: string): PlatformId {
  const u = (url || "").trim();
  for (const p of PLATFORMS) {
    if (p.baseUrl && u.startsWith(p.baseUrl.replace(/\/+$/, ""))) return p.id;
  }
  return "custom";
}

/* ---------- 设置模型 ---------- */
export interface ProviderProfile {
  id: string;          // name + baseUrl 派生
  name: string;
  platform: PlatformId;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface LLMSettings {
  platform: PlatformId;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  economy: boolean;             // 省 token 模式（默认关）
  profiles: ProviderProfile[];  // 具名配置
}

const KEY = "td2_settings";

export const DEFAULT_SETTINGS: LLMSettings = {
  platform: "deepseek",
  baseUrl: "https://api.deepseek.com",
  apiKey: "",
  model: "deepseek-chat",
  temperature: 0.6,
  economy: false,
  profiles: [],
};

export function loadSettings(): LLMSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* 损坏则回默认 */ }
  return { ...DEFAULT_SETTINGS };
}
export function saveSettings(s: LLMSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function maskKey(key: string): string {
  const k = key.trim();
  if (!k) return "未填写";
  if (k.length <= 8) return "sk-****";
  return `${k.slice(0, 5)}****${k.slice(-4)}`;
}

/* ---------- 传输层 ---------- */
declare global {
  interface Window { __TAURI_INTERNALS__?: unknown }
}
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function tauriInvoke<T>(cmd: string, args: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}

/** 非流式 chat/completions：返回 content 文本 */
async function chatRaw(s: LLMSettings, body: Record<string, unknown>): Promise<string> {
  if (isTauri()) {
    return tauriInvoke<string>("ai_chat", {
      request: { baseUrl: s.baseUrl, apiKey: s.apiKey, body },
    });
  }
  /* 浏览器 dev 回落（可能撞 CORS，仅开发调试用） */
  const url = s.baseUrl.replace(/\/+$/, "") + "/chat/completions";
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + s.apiKey },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("HTTP " + r.status + "：" + (await r.text().catch(() => "")).slice(0, 200));
  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("模型返回为空");
  return content;
}

/** 拉取模型清单（设置屏检测连接用） */
export async function fetchModels(baseUrl: string, apiKey: string): Promise<string[]> {
  if (isTauri()) {
    return tauriInvoke<string[]>("ai_models", { request: { baseUrl, apiKey } });
  }
  const base = baseUrl.trim().replace(/\/+$/, "");
  const url = base.endsWith("/v1") ? base + "/models" : base + "/v1/models";
  const r = await fetch(url, { headers: { Authorization: "Bearer " + apiKey.trim() } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const data = await r.json();
  const ids: string[] = (data?.data || []).map((m: { id?: string }) => m.id || "").filter(Boolean);
  return ids.sort();
}

/** 导出落盘（Tauri：写到 下载/师作导出；浏览器：anchor 下载） */
export async function saveFile(fileName: string, data: Uint8Array): Promise<string> {
  if (isTauri()) {
    let bin = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < data.length; i += CHUNK) {
      bin += String.fromCharCode(...data.subarray(i, i + CHUNK));
    }
    return tauriInvoke<string>("export_save", { fileName, dataBase64: btoa(bin) });
  }
  const blob = new Blob([data.buffer as ArrayBuffer]);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  return fileName;
}

/* ---------- JSON 生成（主路径） ---------- */
export interface GenOpts { temperature?: number; retry?: number }

export function parseJSON(s: string): unknown {
  let t = s.trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return JSON.parse(t);
}

export async function json<T = unknown>(system: string, user: string, opts: GenOpts = {}): Promise<T> {
  const s = loadSettings();
  if (!s.apiKey) throw new Error("尚未配置 API Key。点右上角 ⚙ 设置。");
  const body = {
    model: s.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: opts.temperature != null ? opts.temperature : s.temperature,
    response_format: { type: "json_object" },
  };
  const maxTry = opts.retry != null ? opts.retry : 2;
  let lastErr: Error | null = null;
  for (let t = 0; t <= maxTry; t++) {
    try {
      const content = await chatRaw(s, body);
      return parseJSON(content) as T;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (/^HTTP 4(01|03)/.test(lastErr.message)) break; // 鉴权错误不重试
      await new Promise((res) => setTimeout(res, 600 * (t + 1)));
    }
  }
  throw lastErr;
}
