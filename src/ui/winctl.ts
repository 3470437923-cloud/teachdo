/* ============================================================
   师作 TeachDo B02 · 窗口控制 winctl.ts
   Tauri 下走 getCurrentWindow（拖拽/最小化/最大化/关闭）；
   纯浏览器 dev 下全部降级为 no-op。
   ============================================================ */
import { isTauri } from "../core/llm";

type Win = {
  startDragging(): Promise<void>;
  minimize(): Promise<void>;
  toggleMaximize(): Promise<void>;
  close(): Promise<void>;
  isMaximized(): Promise<boolean>;
  setMaximized(v: boolean): Promise<void>;
};

let winPromise: Promise<Win | null> | null = null;
function win(): Promise<Win | null> {
  if (!isTauri()) return Promise.resolve(null);
  if (!winPromise) {
    winPromise = import("@tauri-apps/api/window").then((m) => m.getCurrentWindow() as unknown as Win);
  }
  return winPromise;
}

/**
 * 失败不再静默。
 *
 * 原先五个调用都是 `.catch(() => undefined)`，一旦 ACL 没放权
 * （Tauri 2 的 core 命令必须由 src-tauri/capabilities/ 授权），
 * 表现是「窗口不能拖 / 不能最小化 / 不能最大化 / 不能关闭」，
 * 而控制台里一个字都没有 —— 极难定位。这里保留降级语义
 * （不抛、不打断交互），但把原因打到控制台。
 *
 * 排错提示：看到 "not allowed" 就去看 src-tauri/capabilities/default.json。
 */
function warn(action: string, e: unknown): void {
  console.warn(`[winctl] ${action} 失败（窗口控制权限缺失？检查 src-tauri/capabilities/default.json）：`, e);
}

export async function dragWindow(): Promise<void> {
  const w = await win();
  if (w) await w.startDragging().catch((e) => warn("startDragging", e));
}
export async function minimizeWindow(): Promise<void> {
  const w = await win();
  if (w) await w.minimize().catch((e) => warn("minimize", e));
}
export async function maximizeWindow(): Promise<void> {
  const w = await win();
  if (w) await w.toggleMaximize().catch((e) => warn("toggleMaximize", e));
}
export async function closeWindow(): Promise<void> {
  const w = await win();
  if (w) await w.close().catch((e) => warn("close", e));
}
export async function isMaximized(): Promise<boolean> {
  const w = await win();
  if (!w) return false;
  try { return await w.isMaximized(); } catch { return false; }
}
