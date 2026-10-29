/* ============================================================
   师作 TeachDo B02 · 平台判定 platform.ts
   只服务于「界面文案与窗口外壳」的平台差异，不承担任何安全判定。
   ============================================================ */

/**
 * 是否 macOS。
 *
 * 为什么这里用 UA，而 `llm.ts` 的 `isTauri()` 用能力探测：
 * 「是不是 Tauri」有可探测的运行时能力（`__TAURI_INTERNALS__`），
 * 而「是不是 macOS」没有 —— Tauri 2 把 OS 信息挪进了独立的
 * `@tauri-apps/plugin-os` 插件，本项目没装它。为一个字符串判定去加一个
 * Rust 插件（及其权限项）不划算。WKWebView 的 UA 稳定含 "Macintosh"，
 * 且 `pnpm dev` 浏览器模式在 Mac 上同样成立，开发与打包行为一致。
 *
 * 用途仅两处，都不涉及安全边界：
 *   · 窗口外壳：macOS 用系统原生 traffic light，隐藏自绘窗控三键；
 *   · 快捷键文案：⌘S / Ctrl+S。
 */
export const IS_MAC: boolean =
  typeof navigator !== "undefined" && /Mac OS X|Macintosh/i.test(navigator.userAgent);

/** 「保存」快捷键的展示文案，按平台习惯写法。 */
export const SAVE_HINT: string = IS_MAC ? "⌘S" : "Ctrl+S";
