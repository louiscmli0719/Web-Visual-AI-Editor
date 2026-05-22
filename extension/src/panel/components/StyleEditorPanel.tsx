import { FONT_WEIGHT_OPTIONS } from "../../content/style-inspector";
import type { StyleDraft, StylePropertyName, StylePropertySnapshot } from "../../shared/types";

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
  properties: StylePropertyName[];
};

const STYLE_GROUPS: StyleGroup[] = [
  { title: "颜色", properties: ["color", "backgroundColor"] },
  { title: "排版", properties: ["fontSize", "fontWeight", "lineHeight"] },
  { title: "内边距", properties: ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"] },
  { title: "外边距", properties: ["marginTop", "marginRight", "marginBottom", "marginLeft"] },
  { title: "边框与形状", properties: ["borderRadius", "borderWidth", "borderColor"] },
  { title: "阴影", properties: ["boxShadow"] }
];

export function StyleEditorPanel({ supported, snapshot, draft, hasSelection, onChange, onReset }: StyleEditorPanelProps) {
  if (!hasSelection) {
    return (
      <section className="wvaie-section">
        <h2>样式预览</h2>
        <p className="wvaie-empty">选中元素后可以临时修改基础样式。</p>
      </section>
    );
  }

  if (!supported || snapshot.length === 0) {
    return (
      <section className="wvaie-section">
        <h2>样式预览</h2>
        <p className="wvaie-empty">该元素暂不支持样式预览。</p>
      </section>
    );
  }

  const hasDraft = Object.values(draft).some((value) => typeof value === "string" && value.length > 0);
  const snapshotMap = new Map<StylePropertyName, StylePropertySnapshot>();
  snapshot.forEach((item) => snapshotMap.set(item.property, item));

  return (
    <section className="wvaie-section">
      <h2>样式预览</h2>
      <div className="wvaie-style-grid">
        {STYLE_GROUPS.map((group) => (
          <div className="wvaie-style-grid" key={group.title}>
            <p className="wvaie-style-group-title">{group.title}</p>
            {group.properties.map((property) => {
              const item = snapshotMap.get(property);

              if (!item) {
                return null;
              }

              return (
                <StyleControlRow
                  draftValue={draft[property]}
                  key={property}
                  onChange={onChange}
                  snapshot={item}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="wvaie-actions">
        <button className="wvaie-button" disabled={!hasDraft} onClick={onReset} type="button">
          重置当前预览
        </button>
      </div>
    </section>
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
          aria-label={`${snapshot.label} 取色器`}
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
        {FONT_WEIGHT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (snapshot.inputType === "number") {
    return (
      <input
        aria-label={snapshot.label}
        className="wvaie-style-input"
        onChange={(event) => onChange(snapshot.property, withUnit(event.target.value, snapshot.unit))}
        placeholder={`${snapshot.value}`}
        type="text"
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

  if (/^#([0-9a-fA-F]{6})$/.test(trimmed)) {
    return trimmed;
  }

  const rgb = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);

  if (rgb) {
    const [, r, g, b] = rgb;
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  return "#000000";
}

function toHex(value: string): string {
  const hex = Number(value).toString(16).padStart(2, "0");
  return hex.length === 2 ? hex : `0${hex}`;
}

function withUnit(value: string, unit?: "px"): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (!unit) {
    return trimmed;
  }

  if (trimmed.endsWith(unit)) {
    return trimmed;
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return `${trimmed}${unit}`;
  }

  return trimmed;
}
