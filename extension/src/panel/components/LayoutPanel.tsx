import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import type {
  LayoutContext,
  LayoutIntent,
  StyleDraft,
  StylePropertyName,
  StylePropertySnapshot,
  StyleUnit,
} from "../../shared/types";
import { InspectorSection } from "./InspectorSection";
import { convertLengthValue, getLengthUnitOptions, normalizeLengthValue, splitLengthValue } from "./style-length";

type LayoutPanelProps = {
  context: LayoutContext | null;
  hasSelection: boolean;
  spacingDraft: StyleDraft;
  spacingSnapshot: StylePropertySnapshot[];
  onStyleChange(property: StylePropertyName, value: string): void;
  onSave(intent: LayoutIntent): void;
};

const ALIGNMENT_OPTIONS: Array<{ value: LayoutIntent["alignment"]; label: string }> = [
  { value: "none", label: "不指定对齐" },
  { value: "start", label: "起点对齐" },
  { value: "center", label: "居中对齐" },
  { value: "end", label: "终点对齐" },
  { value: "space-between", label: "两端等距" },
];

const SPACING_GROUPS: Array<{
  title: string;
  items: Array<{ label: string; property: StylePropertyName; icon: ReactNode }>;
}> = [
  {
    title: "内边距",
    items: [
      { label: "上", property: "paddingTop", icon: <SpacingSideIcon side="top" /> },
      { label: "右", property: "paddingRight", icon: <SpacingSideIcon side="right" /> },
      { label: "下", property: "paddingBottom", icon: <SpacingSideIcon side="bottom" /> },
      { label: "左", property: "paddingLeft", icon: <SpacingSideIcon side="left" /> },
    ],
  },
  {
    title: "外边距",
    items: [
      { label: "上", property: "marginTop", icon: <SpacingSideIcon side="top" /> },
      { label: "右", property: "marginRight", icon: <SpacingSideIcon side="right" /> },
      { label: "下", property: "marginBottom", icon: <SpacingSideIcon side="bottom" /> },
      { label: "左", property: "marginLeft", icon: <SpacingSideIcon side="left" /> },
    ],
  },
];

function isActionableLayoutContext(context: LayoutContext): boolean {
  return ["flex", "inline-flex", "grid", "inline-grid"].includes(context.display) && context.siblingCount > 1;
}

export function LayoutPanel({
  context,
  hasSelection,
  spacingDraft,
  spacingSnapshot,
  onStyleChange,
  onSave,
}: LayoutPanelProps) {
  const [direction, setDirection] = useState<LayoutIntent["direction"]>("none");
  const [alignment, setAlignment] = useState<LayoutIntent["alignment"]>("none");
  const [gap, setGap] = useState("");
  const [note, setNote] = useState("");
  const canSave = hasSelection && context !== null && (direction !== "none" || alignment !== "none" || gap.trim() || note.trim());

  const snapshotMap = useMemo(() => {
    const map = new Map<StylePropertyName, StylePropertySnapshot>();
    spacingSnapshot.forEach((item) => map.set(item.property, item));
    return map;
  }, [spacingSnapshot]);

  function handleSave(): void {
    if (!canSave) return;

    onSave({
      direction,
      alignment,
      gap: gap.trim(),
      note: note.trim(),
    });
    setDirection("none");
    setAlignment("none");
    setGap("");
    setNote("");
  }

  if (!hasSelection) {
    return (
      <InspectorSection as="section" className="wvaie-layout-panel">
        <h2 className="wvaie-card-title">自动布局</h2>
        <p className="wvaie-inline-empty">选择元素后查看父容器布局。</p>
      </InspectorSection>
    );
  }

  if (!context) {
    return (
      <InspectorSection as="section" className="wvaie-layout-panel">
        <h2 className="wvaie-card-title">自动布局</h2>
        <p className="wvaie-inline-empty">当前元素没有可识别的父容器布局。</p>
      </InspectorSection>
    );
  }

  if (!isActionableLayoutContext(context)) {
    return (
      <InspectorSection as="section" className="wvaie-layout-panel wvaie-layout-panel-empty">
        <h2 className="wvaie-card-title">自动布局</h2>
        <p className="wvaie-inline-empty">
          当前父容器不是 flex / grid，或没有可交换的兄弟元素；布局参数已收起，避免产生无效记录。
        </p>
      </InspectorSection>
    );
  }

  const resolvedDirection =
    direction !== "none"
      ? direction
      : context.flexDirection?.startsWith("column")
        ? "vertical"
        : context.flexDirection?.startsWith("row")
          ? "horizontal"
          : "none";

  return (
    <InspectorSection as="section" className="wvaie-layout-panel">
      <h2 className="wvaie-card-title">自动布局</h2>
      <div className="wvaie-layout-direction-grid" role="group" aria-label="布局方向">
        <DirectionButton
          active={resolvedDirection === "vertical"}
          icon={<VerticalLayoutIcon />}
          label="纵向"
          onClick={() => setDirection(direction === "vertical" ? "none" : "vertical")}
        />
        <DirectionButton
          active={resolvedDirection === "horizontal"}
          icon={<HorizontalLayoutIcon />}
          label="横向"
          onClick={() => setDirection(direction === "horizontal" ? "none" : "horizontal")}
        />
      </div>

      <div className="wvaie-layout-overview-grid">
        <div className="wvaie-layout-preview-card">
          <div
            className={[
              "wvaie-layout-preview-bars",
              resolvedDirection === "horizontal" ? "wvaie-layout-preview-bars-horizontal" : "",
            ].filter(Boolean).join(" ")}
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
          </div>
          <div className="wvaie-layout-preview-meta">
            <span>父容器</span>
            <strong>{context.parentSelector}</strong>
          </div>
        </div>

        <div className="wvaie-layout-gap-card">
          <span className="wvaie-layout-gap-caption"><GapIcon /> Gap</span>
          <input
            className="wvaie-style-input"
            onChange={(event) => setGap(event.target.value)}
            placeholder={`${context.gap.row}`}
            value={gap}
          />
        </div>
      </div>

      {SPACING_GROUPS.map((group) => (
        <div className="wvaie-layout-spacing-block" key={group.title}>
          <div className="wvaie-layout-spacing-title">{group.title}</div>
          <div className="wvaie-layout-spacing-grid">
            {group.items.map((item) => (
              <SpacingCell
                currentValue={spacingDraft[item.property] ?? snapshotMap.get(item.property)?.value ?? "0px"}
                icon={item.icon}
                key={item.property}
                label={item.label}
                onChange={(next) => onStyleChange(item.property, next)}
                snapshot={snapshotMap.get(item.property)}
              />
            ))}
          </div>
        </div>
      ))}

      {canSave && (
        <div className="wvaie-layout-save-strip" role="status">
          <span>布局意图尚未保存</span>
          <button className="wvaie-button wvaie-button-primary" onClick={handleSave} type="button">
            保存
          </button>
        </div>
      )}

      <details className="wvaie-layout-advanced">
        <summary>高级布局信息</summary>
        <div className="wvaie-layout-meta-grid">
          <div className="wvaie-layout-context-cell">
            <span>布局</span>
            <strong>{context.display}</strong>
          </div>
          <div className="wvaie-layout-context-cell">
            <span>位置</span>
            <strong>{context.childIndex + 1} / {context.siblingCount}</strong>
          </div>
          <div className="wvaie-layout-context-cell">
            <span>横轴</span>
            <strong>{context.justifyContent ?? "未设置"}</strong>
          </div>
          <div className="wvaie-layout-context-cell">
            <span>纵轴</span>
            <strong>{context.alignItems ?? "未设置"}</strong>
          </div>
        </div>
        <div className="wvaie-form-row">
          <div className="wvaie-form-field">
            <label htmlFor="wvaie-layout-alignment">对齐方式</label>
            <select
              className="wvaie-select"
              id="wvaie-layout-alignment"
              value={alignment}
              onChange={(event) => setAlignment(event.target.value as LayoutIntent["alignment"])}
            >
              {ALIGNMENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
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
      </details>
    </InspectorSection>
  );
}

function DirectionButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick(): void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`wvaie-layout-mode-button ${active ? "wvaie-layout-mode-active" : ""}`}
      onClick={onClick}
      type="button"
    >
      <span className="wvaie-layout-mode-icon" aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}

function SpacingCell({
  currentValue,
  icon,
  label,
  onChange,
  snapshot,
}: {
  currentValue: string;
  icon: ReactNode;
  label: string;
  onChange(next: string): void;
  snapshot: StylePropertySnapshot | undefined;
}) {
  const unit = snapshot?.unit ?? "px";
  const unitOptions = getLengthUnitOptions(snapshot?.unitOptions);

  return (
    <div className="wvaie-layout-spacing-cell">
      <div className="wvaie-layout-spacing-meta">
        <span className="wvaie-layout-spacing-icon" aria-hidden="true">{icon}</span>
        <span className="wvaie-layout-spacing-label">{label}</span>
      </div>
      <LayoutLengthControl label={label} onChange={onChange} unit={unit} unitOptions={unitOptions} value={currentValue} />
    </div>
  );
}

function VerticalLayoutIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M13 3L10.5 5.5L8 3" />
      <path d="M10.5 5.5V16" />
      <rect x="3" y="3" width="5" height="5" rx="1" />
      <rect x="3" y="12" width="5" height="5" rx="1" />
    </svg>
  );
}

function HorizontalLayoutIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M17 13L14.5 10.5L17 8" />
      <path d="M14.5 10.5H4" />
      <rect x="3" y="3" width="5" height="5" rx="1" />
      <rect x="12" y="3" width="5" height="5" rx="1" />
    </svg>
  );
}

function GapIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 5H16" />
      <path d="M7 10H13" />
      <path d="M4 15H16" />
    </svg>
  );
}

function SpacingSideIcon({ side }: { side: "top" | "right" | "bottom" | "left" }) {
  const guide = {
    top: <path d="M4 5H16" />,
    right: <path d="M15 4V16" />,
    bottom: <path d="M4 15H16" />,
    left: <path d="M5 4V16" />,
  }[side];
  const rect = {
    top: { x: 7.5, y: 9.5 },
    right: { x: 6, y: 7.5 },
    bottom: { x: 7.5, y: 5.5 },
    left: { x: 9, y: 7.5 },
  }[side];

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      {guide}
      <rect x={rect.x} y={rect.y} width="5" height="5" rx="1" />
    </svg>
  );
}

function LayoutLengthControl({
  label,
  onChange,
  unit,
  unitOptions,
  value,
}: {
  label: string;
  onChange(next: string): void;
  unit: StyleUnit;
  unitOptions: readonly StyleUnit[];
  value: string;
}) {
  const { numericText, unit: currentUnit } = splitLengthValue(value, unit);
  const displayUnit = unitOptions.includes(currentUnit) ? currentUnit : unitOptions[0] ?? unit;

  function handleValueChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    const trimmed = nextValue.trim();

    if (!trimmed) {
      onChange(`0${displayUnit}`);
      return;
    }

    onChange(normalizeLengthValue(nextValue, displayUnit));
  }

  function handleUnitChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextUnit = event.target.value as StyleUnit;
    onChange(convertLengthValue(value, nextUnit, displayUnit));
  }

  return (
    <div className="wvaie-style-length">
      <input
        aria-label={`${label}数值`}
        className="wvaie-style-length-input"
        inputMode="decimal"
        onChange={handleValueChange}
        type="text"
        value={numericText}
      />
      <select
        aria-label={`${label}单位`}
        className="wvaie-style-length-unit"
        onChange={handleUnitChange}
        value={displayUnit}
      >
        {unitOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
