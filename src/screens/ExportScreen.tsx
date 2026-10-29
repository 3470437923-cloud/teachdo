/* ============================================================
   师作 TeachDo B02 · 屏 6 导出 ExportScreen.tsx
   三件套 + 引用清单 + 评审报告。合并 ZIP 或分开保存。
   Tauri 下落盘到 下载/师作导出；浏览器 dev 下走下载。
   ============================================================ */
import { useState } from "react";
import { useApp } from "../store";
import { downloadBundle, buildBundle } from "../core/export";
import { ScreenShell } from "../ui/Shell";
import { persistProject } from "../store";

function toast(msg: string, err = false) {
  window.dispatchEvent(new CustomEvent("td-toast", { detail: { msg, err } }));
}

export function ExportScreen() {
  const app = useApp();
  const p = app.proj;
  const [mode, setMode] = useState<"merged" | "separate">("merged");
  const [busyExport, setBusyExport] = useState(false);
  const [donePaths, setDonePaths] = useState<string[]>([]);

  const items = buildBundle(p);
  const hasL = !!p.lesson, hasS = !!(p.slides?.length), hasC = !!(p.script?.length);

  const doExport = async () => {
    setBusyExport(true);
    setDonePaths([]);
    try {
      persistProject();
      const paths = await downloadBundle(p, mode);
      setDonePaths(paths);
      toast(`已导出 ${paths.length} 个文件`);
    } catch (e) {
      toast("导出失败：" + (e instanceof Error ? e.message : String(e)), true);
    }
    setBusyExport(false);
  };

  return (
    <ScreenShell>
      <div className="export-doc">
        <h1 style={{ fontSize: "var(--fs-title)", fontWeight: 700, marginBottom: 12 }}>导出</h1>

        <div className="card" style={{ marginBottom: 10 }}>
          <div className="card-head"><span>本次产物</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              { ok: hasL, name: "教案 .docx", sub: hasL ? "已就绪" : "未生成" },
              { ok: hasS, name: "课件 .pptx", sub: hasS ? `${p.slides!.length} 页 · ${p.deckStyle || "paper"} 画风 · 已就绪` : "未生成" },
              { ok: hasC, name: "讲稿 .docx", sub: hasC ? "已就绪" : "未生成" },
              { ok: true, name: "引用清单 .txt", sub: "课标 + 骨架 + 画风 · 免责证据链" },
              { ok: !!p.review, name: "评审报告 .txt", sub: p.review ? "已就绪" : "未评审" },
            ].map((r) => (
              <div key={r.name} className="row" style={{ padding: "4px 0" }}>
                <span style={{ color: r.ok ? "var(--ok)" : "var(--tx-dim)", width: 18 }}>{r.ok ? "✓" : "○"}</span>
                <div style={{ flex: 1 }}>
                  <div className="row-name">{r.name}</div>
                  <div className="row-sub">{r.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 10 }}>
          <div className="card-head"><span>打包方式</span></div>
          <label className="row" style={{ padding: "8px 0", cursor: "pointer", alignItems: "flex-start" }}>
            <input type="radio" name="pkg" checked={mode === "merged"} onChange={() => setMode("merged")} style={{ marginTop: 3 }} />
            <div>
              <div className="row-name" style={{ fontSize: "var(--fs-sub)" }}>合并打包 · 一份 ZIP</div>
              <div className="row-sub">三件套 + 引用清单，一次带走</div>
            </div>
          </label>
          <label className="row" style={{ padding: "8px 0", cursor: "pointer", alignItems: "flex-start" }}>
            <input type="radio" name="pkg" checked={mode === "separate"} onChange={() => setMode("separate")} style={{ marginTop: 3 }} />
            <div>
              <div className="row-name" style={{ fontSize: "var(--fs-sub)" }}>分开保存</div>
              <div className="row-sub">教案 / 课件 / 讲稿 各自保存</div>
            </div>
          </label>
        </div>

        <button className="btn btn-primary" style={{ width: "100%" }} disabled={busyExport || !hasL} onClick={() => void doExport()}>
          {busyExport ? "导出中…" : `导出 ${items.length} 个文件 →`}
        </button>

        {donePaths.length ? (
          <div className="card" style={{ marginTop: 10 }}>
            <div className="card-head"><span>已落盘</span></div>
            {donePaths.map((x) => (
              <div key={x} className="mono" style={{ fontSize: "var(--fs-caption)", color: "var(--tx-3)", padding: "2px 0", userSelect: "text" }}>{x}</div>
            ))}
          </div>
        ) : null}
      </div>
    </ScreenShell>
  );
}
