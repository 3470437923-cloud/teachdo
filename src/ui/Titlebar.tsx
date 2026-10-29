/* ============================================================
   师作 TeachDo B02 · 标题栏 Titlebar.tsx
   无框窗口：品牌 + 步骤签入口 + 窗控三键；空白处按住拖动，
   双击切换最大化（DeepCompose 同款交互纪律）。

   macOS 分支：窗口改由系统提供红黄绿三键
   （tauri.macos.conf.json: decorations:true + titleBarStyle:Overlay），
   因此隐藏自绘窗控，改由 CSS 在左侧让出三键位置。
   拖动仍走 winctl.startDragging —— WKWebView 不支持
   `-webkit-app-region: drag`（Chromium 专有），这是唯一手段。
   ============================================================ */
import { useEffect, useState } from "react";
import { dragWindow, maximizeWindow, minimizeWindow, closeWindow, isMaximized } from "./winctl";
import { IS_MAC, SAVE_HINT } from "./platform";
import { useApp, toggleTheme, setState, persistProject } from "../store";

function Svg({ d, extra }: { d: string; extra?: string }) {
  return (
    <svg viewBox="0 0 20 20">
      <path d={d} />
      {extra ? <path d={extra} /> : null}
    </svg>
  );
}

export function Titlebar() {
  const app = useApp();
  const [maxed, setMaxed] = useState(false);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      const m = await isMaximized();
      if (alive) setMaxed(m);
    };
    void poll();
    const t = setInterval(poll, 800);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <header
      className="titlebar"
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        if ((e.target as HTMLElement).closest("button")) return;
        void dragWindow();
      }}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        void maximizeWindow();
      }}
    >
      <div className="brand">
        <div className="brand-mark">师</div>
        师作 TeachDo
        <span className="brand-sub">教师备课工作台 B02</span>
      </div>

      <div className="tb-right">
        <button className="tb-btn" title={`保存项目 (${SAVE_HINT})`} onClick={() => persistProject()}>💾</button>
        <button className="tb-btn" title="打开项目" onClick={() => setState({ projectsOpen: true })}>📂</button>
        <button className="tb-btn" title="设置" onClick={() => setState({ settingsOpen: true })}>⚙</button>
        <button className="tb-btn" title="切换浅色 / 深色" onClick={toggleTheme}>◐</button>
        {IS_MAC ? null : (
          <>
            <span className="tb-div" />
            <div className="win-tools">
              <button className="wbtn" title="最小化" onClick={() => void minimizeWindow()}>
                <Svg d="M5 10h10" />
              </button>
              <button className="wbtn" title={maxed ? "向下还原" : "最大化"} onClick={() => void maximizeWindow()}>
                {maxed ? (
                  <svg viewBox="0 0 20 20">
                    <rect x="3.4" y="6.6" width="10" height="10" rx="2" />
                    <path d="M6.6 6.6V5.4a2 2 0 0 1 2-2h5.8a2 2 0 0 1 2 2v5.8a2 2 0 0 1-2 2h-1.2" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20"><rect x="4" y="4.5" width="11" height="11" rx="2" /></svg>
                )}
              </button>
              <button className="wbtn close" title="关闭" onClick={() => void closeWindow()}>
                <Svg d="M5.5 5.5l9 9M14.5 5.5l-9 9" />
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
