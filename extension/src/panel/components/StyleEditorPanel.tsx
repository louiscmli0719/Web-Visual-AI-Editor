import type { ChangeEvent } from "react";
import { FONT_WEIGHT_OPTIONS } from "../../content/style-inspector";
import type { StyleDraft, StylePropertyName, StylePropertySnapshot, StyleUnit } from "../../shared/types";
import { InspectorSection } from "./InspectorSection";
import { convertLengthValue, getLengthUnitOptions, normalizeLengthValue, splitLengthValue } from "./style-length";

type StyleEditorPanelProps = {
  supported: boolean;
  snapshot: StylePropertySnapshot[];
  draft: StyleDraft;
  hasSelection: boolean;
  onChange(property: StylePropertyName, value: string): void;
  onReset(): void;
};

type StyleGroup = {
  title: string;
  open: boolean;
  properties: StylePropertyName[];
};

const STYLE_GROUPS: StyleGroup[] = [
  { title: "外观", open: true, properties: ["color", "backgroundColor", "borderRadius"] },
  { title: "排版", open: true, properties: ["fontSize", "fontWeight", "lineHeight"] },
  { title: "间距", open: false, properties: ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "marginTop", "marginRight", "marginBottom", "marginLeft"] },
  { title: "描边与效果", open: false, properties: ["borderWidth", "borderColor", "boxShadow"] },
];

export function StyleEditorPanel({ supported, snapshot, draft, hasSelection, onChange, onReset }: StyleEditorPanelProps) {
  if (!hasSelection) {
    return null;
  }

  if (!supported || snapshot.length === 0) {
    return <InspectorSection as="section"><p className="wvaie-inline-empty">该元素暂不支持样式预览。</p></InspectorSection>;
  }

  const hasDraft = Object.values(draft).some((value) => typeof value === "string" && value.length > 0);
  const snapshotMap = new Map<StylePropertyName, StylePropertySnapshot>();
  snapshot.forEach((item) => snapshotMap.set(item.property, item));

  return (
    <InspectorSection as="section" className="wvaie-style-editor">
      <h2 className="wvaie-card-title">样式编辑</h2>
      {STYLE_GROUPS.map((group) => (
        <details className="wvaie-control-group" key={group.title} open={group.open}>
          <summary>{group.title}</summary>
          <div className="wvaie-style-grid">
            {group.properties.map((property) => {
              const item = snapshotMap.get(property);
              return item ? (
                <StyleControlRow
                  draftValue={draft[property]}
                  key={property}
                  onChange={onChange}
                  snapshot={item}
                />
              ) : null;
            })}
          </div>
        </details>
      ))}
      {hasDraft && (
        <div className="wvaie-preview-banner" role="status">
          <span>临时预览尚未记录</span>
          <button className="wvaie-button" onClick={onReset} type="button">重置</button>
        </div>
      )}
    </InspectorSection>
  );
}

type StyleControlRowProps = {
  snapshot: StylePropertySnapshot;
  draftValue: string | undefined;
  onChange(property: StylePropertyName, value: string): void;
};

function StyleControlRow({ snapshot, draftValue, onChange }: StyleControlRowProps) {
  const currentValue = draftValue ?? snapshot.value;
  const isChanged = typeof draftValue === "string" && draftValue.length > 0 && draftValue !== snapshot.value;

  return (
    <div className="wvaie-style-row">
      <label className={isChanged ? "wvaie-style-changed" : undefined}>{snapshot.label}</label>
      {renderControl(snapshot, currentValue, onChange)}
    </div>
  );
}

function renderControl(
  snapshot: StylePropertySnapshot,
  value: string,
  onChange: (property: StylePropertyName, next: string) => void
) {
  if (snapshot.inputType === "color") {
    return (
      <div className="wvaie-style-color">
        <input
          aria-label={`${snapshot.label}取色器`}
          onChange={(event) => onChange(snapshot.property, event.target.value)}
          type="color"
          value={toColorInputValue(value)}
        />
        <input
          aria-label={snapshot.label}
          className="wvaie-style-input"
          onChange={(event) => onChange(snapshot.property, event.target.value)}
          type="text"
          value={value}
        />
      </div>
    );
  }

  if (snapshot.inputType === "select") {
    return (
      <select
        aria-label={snapshot.label}
        className="wvaie-style-select"
        onChange={(event) => onChange(snapshot.property, event.target.value)}
        value={value}
      >
        {FONT_WEIGHT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }

  if (snapshot.inputType === "number") {
    return (
      <LengthControl
        label={snapshot.label}
        onChange={(next) => onChange(snapshot.property, next)}
        unit={snapshot.unit ?? "px"}
        unitOptions={getLengthUnitOptions(snapshot.unitOptions)}
        value={value}
      />
    );
  }

  return (
    <input
      aria-label={snapshot.label}
      className="wvaie-style-input"
      onChange={(event) => onChange(snapshot.property, event.target.value)}
      type="text"
      value={value}
    />
  );
}

function toColorInputValue(value: string): string {
  const trimmed = value.trim();
  if (/^#([0-9a-fA-F]{6})$/.test(trimmed)) return trimmed;
  const rgb = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return rgb ? `#${toHex(rgb[1])}${toHex(rgb[2])}${toHex(rgb[3])}` : "#000000";
}

function toHex(value: string): string {
  return Number(value).toString(16).padStart(2, "0");
}

function LengthControl({
  label,
  value,
  unit,
  unitOptions,
  onChange,
}: {
  label: string;
  value: string;
  unit: StyleUnit;
  unitOptions: readonly StyleUnit[];
  onChange(next: string): void;
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
