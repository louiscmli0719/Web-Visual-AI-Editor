import { useState } from "react";
import type { LayoutContext, LayoutIntent } from "../../shared/types";
import { InspectorSection } from "./InspectorSection";

type LayoutPanelProps = {
  context: LayoutContext | null;
  hasSelection: boolean;
  onSave(intent: LayoutIntent): void;
};

const DIRECTION_OPTIONS: Array<{ value: LayoutIntent["direction"]; label: string }> = [
  { value: "none", label: "不指定方向" },
  { value: "horizontal", label: "改为横向排列" },
  { value: "vertical", label: "改为纵向排列" }
];

const ALIGNMENT_OPTIONS: Array<{ value: LayoutIntent["alignment"]; label: string }> = [
  { value: "none", label: "不指定对齐" },
  { value: "start", label: "起点对齐" },
  { value: "center", label: "居中对齐" },
  { value: "end", label: "终点对齐" },
  { value: "space-between", label: "两端等距" }
];

export function LayoutPanel({ context, hasSelection, onSave }: LayoutPanelProps) {
  const [direction, setDirection] = useState<LayoutIntent["direction"]>("none");
  const [alignment, setAlignment] = useState<LayoutIntent["alignment"]>("none");
  const [gap, setGap] = useState("");
  const [note, setNote] = useState("");
  const canSave = hasSelection && context !== null && (direction !== "none" || alignment !== "none" || gap.trim() || note.trim());

  function handleSave(): void {
    if (!canSave) return;

    onSave({
      direction,
      alignment,
      gap: gap.trim(),
      note: note.trim()
    });
    setDirection("none");
    setAlignment("none");
    setGap("");
    setNote("");
  }

  return (
    <InspectorSection as="section" className="wvaie-layout-panel">
      <div className="wvaie-section-heading">
        <h2>布局辅助</h2>
        <span>V0.8</span>
      </div>
      <div className="wvaie-layout-direct-card">
        <strong>直接拖动布局</strong>
        <p>顶部工具栏点“自动布局”，选中元素后拖动紫色横条，可在同一父容器内与兄弟元素换位。</p>
      </div>
      {!hasSelection && <p className="wvaie-inline-empty">选择元素后查看父容器布局。</p>}
      {hasSelection && !context && <p className="wvaie-inline-empty">当前元素没有可识别的父容器布局。</p>}
      {context && (
        <>
          <dl className="wvaie-layout-facts">
            <div>
              <dt>父容器</dt>
              <dd>{context.parentSelector}</dd>
            </div>
            <div>
              <dt>布局</dt>
              <dd>{context.display}</dd>
            </div>
            <div>
              <dt>方向</dt>
              <dd>{context.flexDirection || "未指定"}</dd>
            </div>
            <div>
              <dt>对齐</dt>
              <dd>{context.justifyContent || "未指定"} / {context.alignItems || "未指定"}</dd>
            </div>
            <div>
              <dt>间距</dt>
              <dd>row {context.gap.row} / column {context.gap.column}</dd>
            </div>
            <div>
              <dt>位置</dt>
              <dd>{context.childIndex + 1} / {context.siblingCount}</dd>
            </div>
          </dl>
          <div className="wvaie-form-row">
            <div className="wvaie-form-field">
              <label htmlFor="wvaie-layout-direction">布局方向</label>
              <select
                className="wvaie-select"
                id="wvaie-layout-direction"
                value={direction}
                onChange={(event) => setDirection(event.target.value as LayoutIntent["direction"])}
              >
                {DIRECTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="wvaie-form-field">
              <label htmlFor="wvaie-layout-alignment">对齐方式</label>
              <select
                className="wvaie-select"
                id="wvaie-layout-alignment"
                value={alignment}
                onChange={(event) => setAlignment(event.target.value as LayoutIntent["alignment"])}
              >
                {ALIGNMENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="wvaie-form-field">
            <label htmlFor="wvaie-layout-gap">目标间距</label>
            <input
              className="wvaie-style-input"
              id="wvaie-layout-gap"
              onChange={(event) => setGap(event.target.value)}
              placeholder="例如 16px"
              value={gap}
            />
          </div>
          <div className="wvaie-form-field">
            <label htmlFor="wvaie-layout-note">布局说明</label>
            <textarea
              className="wvaie-textarea"
              id="wvaie-layout-note"
              onChange={(event) => setNote(event.target.value)}
              placeholder="补充布局意图，例如保持按钮等宽、移动端换行等。"
              rows={3}
              value={note}
            />
          </div>
          <button className="wvaie-button" disabled={!canSave} onClick={handleSave} type="button">
            保存布局意图
          </button>
        </>
      )}
    </InspectorSection>
  );
}
