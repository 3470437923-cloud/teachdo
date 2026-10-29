//! 网络能力：AI 调用、模型清单拉取、导出落盘。
//!
//! 为什么放在 Rust：WebView 里直接 fetch 会撞 CORS（file:// 或 tauri:// 源发出去
//! 的跨域请求多数上游会拒），且超时与错误体不受前端控制。这里只做「转发」——
//! 协议编排、校验、修复回路全部在 TS 侧。

use base64::Engine;
use serde::Deserialize;
use serde_json::Value;
use std::path::PathBuf;

/// 非流式对话请求（OpenAI 兼容 /chat/completions）
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatRequest {
    pub base_url: String,
    pub api_key: String,
    pub body: Value,
}

/// 返回上游 choices[0].message.content 的文本。
/// 错误体截断到 200 字符再返回：上游错误页常是整份 HTML，无界转发会撑爆前端提示。
#[tauri::command]
pub async fn ai_chat(request: ChatRequest) -> Result<String, String> {
    let ChatRequest { base_url, api_key, body } = request;

    let base = base_url.trim().trim_end_matches('/');
    if base.is_empty() {
        return Err("尚未配置 API 地址。点右上角 ⚙ 设置。".into());
    }
    if api_key.trim().is_empty() {
        return Err("尚未配置 API Key。点右上角 ⚙ 设置。".into());
    }
    let url = format!("{base}/chat/completions");

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(180))
        .build()
        .map_err(|e| format!("HTTP 客户端创建失败: {e}"))?;

    let resp = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", api_key.trim()))
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("连接失败: {e}"))?;

    let status = resp.status();
    let text = resp.text().await.unwrap_or_default();
    if !status.is_success() {
        let brief: String = text.chars().take(200).collect();
        return Err(format!("HTTP {}：{}", status.as_u16(), brief));
    }

    let v: Value = serde_json::from_str(&text).map_err(|_| "响应不是 JSON".to_string())?;
    let content = v
        .get("choices")
        .and_then(|c| c.get(0))
        .and_then(|c| c.get("message"))
        .and_then(|m| m.get("content"))
        .and_then(|c| c.as_str())
        .ok_or_else(|| "模型返回为空".to_string())?;
    Ok(content.to_string())
}

/// 拉取上游模型清单（GET {base}/models，Bearer 鉴权）。设置屏「检测连接」用。
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelsRequest {
    pub base_url: String,
    pub api_key: String,
}

#[tauri::command]
pub async fn ai_models(request: ModelsRequest) -> Result<Vec<String>, String> {
    let ModelsRequest { base_url, api_key } = request;

    let base = base_url.trim().trim_end_matches('/');
    if base.is_empty() || api_key.trim().is_empty() {
        return Err("请先填写接口地址与 API Key".into());
    }
    // base 可能带 /v1 后缀；两种习惯都兼容
    let url = if base.ends_with("/v1") {
        format!("{base}/models")
    } else {
        format!("{base}/v1/models")
    };

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| format!("HTTP 客户端创建失败: {e}"))?;

    let resp = client
        .get(&url)
        .header("authorization", format!("Bearer {}", api_key.trim()))
        .send()
        .await
        .map_err(|e| format!("连接失败: {e}"))?;

    let status = resp.status();
    let text = resp.text().await.unwrap_or_default();
    if !status.is_success() {
        let brief: String = text.chars().take(200).collect();
        return Err(format!("HTTP {}：{}", status.as_u16(), brief));
    }

    let v: Value = serde_json::from_str(&text).map_err(|_| "响应不是 JSON".to_string())?;
    let mut ids: Vec<String> = Vec::new();
    if let Some(arr) = v.get("data").and_then(|d| d.as_array()) {
        for item in arr {
            if let Some(id) = item.get("id").and_then(|i| i.as_str()) {
                ids.push(id.to_string());
            }
        }
    }
    ids.sort();
    Ok(ids)
}

/// 导出落盘：写进「下载/师作导出/」，文件名做 Windows 非法字符清洗。
/// 返回实际路径，供界面回显「已导出到 …」。
#[tauri::command]
pub fn export_save(file_name: String, data_base64: String) -> Result<String, String> {
    let raw = base64::engine::general_purpose::STANDARD
        .decode(data_base64.as_bytes())
        .map_err(|e| format!("数据解码失败: {e}"))?;

    let dir: PathBuf = home_dir()
        .ok_or_else(|| "找不到用户目录（HOME / USERPROFILE 都未设置）".to_string())?
        .join("Downloads")
        .join("师作导出");
    // ★ macOS 首次写入会触发 TCC 隐私授权弹窗（「师作 TeachDo」想要访问
    //   「下载」文件夹）。用户点「不允许」时此处会返回 EPERM，前端会原样
    //   显示 "写入失败: Operation not permitted"——这是预期行为，不是 bug。
    std::fs::create_dir_all(&dir).map_err(|e| format!("创建导出目录失败: {e}"))?;

    let clean: String = file_name
        .chars()
        .map(|c| match c {
            '\\' | '/' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '＿',
            other => other,
        })
        .collect();
    let clean = clean.trim().to_string();
    let clean = if clean.is_empty() { "导出文件".to_string() } else { clean };

    let path = dir.join(&clean);
    std::fs::write(&path, raw).map_err(|e| format!("写入失败: {e}"))?;
    Ok(path.to_string_lossy().to_string())
}

/// 用户主目录：跨平台取法。
///
/// 为什么不用 `std::env::var("USERPROFILE")`：那是 Windows 专有变量，
/// macOS 上根本没有 —— 原实现会让导出功能在 Mac 上 100% 失败并报
/// 「找不到用户目录」。macOS 用的是 `HOME`。
///
/// 两个都读一遍再回退，是为了：
///   · Windows 上仍优先 `USERPROFILE`（保持原有取值与行为不变）；
///   · macOS / Linux 上走 `HOME`；
///   · 某些被裁剪的环境变量场景下（如通过 launchd 启动、或从 Finder 首次
///     启动 .app 时）`HOME` 偶发缺失，此时回退 `USERPROFILE` 能兜住。
///
/// 刻意不引入 `dirs` crate：Cargo.toml 里没有它，为一个环境变量读两行
/// 代码去加一个依赖（及其整棵依赖树）不划算。
fn home_dir() -> Option<PathBuf> {
    // 平台差异只体现在「先读哪个」，用 cfg! 让编译器把另一支折掉。
    let order: [&str; 2] = if cfg!(windows) {
        ["USERPROFILE", "HOME"]
    } else {
        ["HOME", "USERPROFILE"]
    };

    for key in order {
        if let Ok(v) = std::env::var(key) {
            let v = v.trim();
            if !v.is_empty() {
                return Some(PathBuf::from(v));
            }
        }
    }
    None
}
