/* ============================================================
   师作 TeachDo B02 · 版面画布 SlideCanvas.tsx
   把 render.ts 的盒子列表渲染成 DOM（1280×720 坐标系）。
   预览、缩略图、导出共用同一份盒子数据 —— 所见即所导。
   ============================================================ */
import type { Box } from "../core/render";
import { CV_W, CV_H } from "../core/render";
import type { DeckStyle, Slide } from "../core/deck";
import { renderSlide } from "../core/render";

function boxStyle(b: Box): React.CSSProperties {
  const base: React.CSSProperties = {
    left: b.x, top: b.y, width: b.w, height: Math.max(b.h, 1),
  };
  switch (b.kind) {
    case "text":
      return {
        ...base,
        fontSize: b.size, color: b.color, fontWeight: b.bold ? 700 : 400,
        textAlign: b.align === "c" ? "center" : b.align === "r" ? "right" : "left",
        lineHeight: 1.5,
        display: b.valign === "m" ? "flex" : "block",
        alignItems: b.valign === "m" ? "center" : undefined,
      };
    case "bar":
    case "rule":
      return { ...base, background: b.fill };
    case "card":
      return { ...base, background: b.fill };
    case "chip":
      return { ...base, background: b.fill };
    default:
      return base;
  }
}

export function Boxes({ boxes }: { boxes: Box[] }) {
  return (
    <>
      {boxes.map((b, i) => {
        if (b.kind === "text") {
          return (
            <div key={i} className="slide-box sb-text" style={boxStyle(b)}>
              {(b.lines || [b.text || ""]).map((ln, j) => (
                <div key={j}>{ln || "\u00a0"}</div>
              ))}
            </div>
          );
        }
        return <div key={i} className={"slide-box sb-" + b.kind} style={boxStyle(b)} />;
      })}
    </>
  );
}

export function SlideCanvas({
  slide, style, width, editable, onEditText,
}: {
  slide: Slide;
  style: DeckStyle;
  width: number;              // 渲染宽（px），高度按 16:9
  editable?: boolean;
  onEditText?: (kind: "title" | "line", idx: number, text: string) => void;
}) {
  const scale = width / CV_W;
  const boxes = renderSlide(slide, style);
  return (
    <div
      style={{
        width, height: width * (CV_H / CV_W), position: "relative",
        background: style.colors.bg, borderRadius: 2, overflow: "hidden",
        boxShadow: width > 400 ? "var(--sh-2)" : "none",
      }}
    >
      <div style={{ width: CV_W, height: CV_H, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute" }}>
        <Boxes boxes={boxes} />
      </div>
    </div>
  );
}
