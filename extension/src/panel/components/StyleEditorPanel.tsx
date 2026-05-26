import { useState, type ChangeEvent, type ReactNode } from "react";
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

const FALLBACK_FONT_OPTIONS = [
  "system-ui, sans-serif",
  "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
  "\"SF Pro Display\", \"PingFang SC\", sans-serif",
  "\"PingFang SC\", \"Microsoft YaHei\", sans-serif",
  "\"Noto Sans SC\", sans-serif",
  "Georgia, serif",
  "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
];

type LocalFontData = {
  family: string;
};

type LocalFontWindow = Window & {
  queryLocalFonts?: () => Promise<LocalFontData[]>;
};

type StyleSectionItem =
  | { kind: "font"; title: string; properties: [StylePropertyName, StylePropertyName, StylePropertyName, StylePropertyName] }
  | { kind: "color"; title: string; property: StylePropertyName }
  | { kind: "corners"; title: string; property: StylePropertyName }
  | { kind: "single"; title: string; property: StylePropertyName };

const TYPOGRAPHY_ITEMS: StyleSectionItem[] = [
  { kind: "font", title: "字体/排版", properties: ["fontFamily", "fontSize", "lineHeight", "fontWeight"] },
  { kind: "single", title: "字间距", property: "letterSpacing" },
  { kind: "color", title: "文本颜色", property: "color" },
];

const APPEARANCE_ITEMS: StyleSectionItem[] = [
  { kind: "corners", title: "圆角", property: "borderRadius" },
  { kind: "color", title: "背景颜色", property: "backgroundColor" },
];

const EFFECT_ITEMS: StyleSectionItem[] = [
  { kind: "single", title: "描边粗细", property: "borderWidth" },
  { kind: "color", title: "描边颜色", property: "borderColor" },
  { kind: "single", title: "阴影", property: "boxShadow" },
];

export function StyleEditorPanel({ supported, snapshot, draft, hasSelection, onChange, onReset }: StyleEditorPanelProps) {
  if (!hasSelection) {
    return null;
  }

  if (!supported || snapshot.length === 0) {
    return (
      <InspectorSection as="section">
        <p className="wvaie-inline-empty">该元素暂不支持样式预览。</p>
      </InspectorSection>
    );
  }

  const snapshotMap = new Map<StylePropertyName, StylePropertySnapshot>();
  snapshot.forEach((item) => snapshotMap.set(item.property, item));

  const hasDraft = Object.values(draft).some((value) => typeof value === "string" && value.length > 0);

  return (
    <InspectorSection as="section" className="wvaie-style-editor">
      <StyleSection
        items={TYPOGRAPHY_ITEMS}
        snapshotMap={snapshotMap}
        draft={draft}
        onChange={onChange}
      />
      <StyleSection
        items={APPEARANCE_ITEMS}
        title="外观"
        snapshotMap={snapshotMap}
        draft={draft}
        onChange={onChange}
      />
      <StyleSection
        items={EFFECT_ITEMS}
        title="描边与效果"
        snapshotMap={snapshotMap}
        draft={draft}
        onChange={onChange}
      />
      {hasDraft && (
        <div className="wvaie-preview-banner" role="status">
          <span>临时预览尚未记录</span>
          <button className="wvaie-button" onClick={onReset} type="button">重置</button>
        </div>
      )}
    </InspectorSection>
  );
}

function StyleSection({
  draft,
  items,
  onChange,
  snapshotMap,
  title,
}: {
  draft: StyleDraft;
  items: StyleSectionItem[];
  onChange(property: StylePropertyName, value: string): void;
  snapshotMap: Map<StylePropertyName, StylePropertySnapshot>;
  title?: string;
}) {
  const sectionTitle = title ?? items[0]?.title ?? "";

  return (
    <section className="wvaie-style-section">
      <h2 className="wvaie-card-title">{sectionTitle}</h2>
      <div className="wvaie-style-section-grid">
        {items.map((item, index) => {
          if (item.kind === "font") {
            return (
              <FontGrid
                draft={draft}
                key={`${item.kind}-${index}`}
                onChange={onChange}
                properties={item.properties}
                snapshotMap={snapshotMap}
              />
            );
          }

          if (item.kind === "color") {
            const snapshot = snapshotMap.get(item.property);
            return snapshot ? (
              <ColorRow
                currentValue={draft[item.property] ?? snapshot.value}
                key={item.property}
                label={item.title}
                onChange={(next) => onChange(item.property, next)}
              />
            ) : null;
          }

          if (item.kind === "corners") {
            const snapshot = snapshotMap.get(item.property);
            return snapshot ? (
              <CornerGrid
                currentValue={draft[item.property] ?? snapshot.value}
                key={item.property}
                label={item.title}
                onChange={(next) => onChange(item.property, next)}
                snapshot={snapshot}
              />
            ) : null;
          }

          const snapshot = snapshotMap.get(item.property);
          return snapshot ? (
            <SingleRow
              currentValue={draft[item.property] ?? snapshot.value}
              key={item.property}
              label={item.title}
              onChange={(next) => onChange(item.property, next)}
              snapshot={snapshot}
            />
          ) : null;
        })}
      </div>
    </section>
  );
}

function FontGrid({
  draft,
  onChange,
  properties,
  snapshotMap,
}: {
  draft: StyleDraft;
  onChange(property: StylePropertyName, value: string): void;
  properties: [StylePropertyName, StylePropertyName, StylePropertyName, StylePropertyName];
  snapshotMap: Map<StylePropertyName, StylePropertySnapshot>;
}) {
  return (
    <div className="wvaie-style-dual-grid">
      {properties.map((property) => {
        const snapshot = snapshotMap.get(property);
        if (!snapshot) return null;

        return (
          <div className="wvaie-style-dual-cell" key={property}>
            <CompactControl
              currentValue={draft[property] ?? snapshot.value}
              icon={getStyleIcon(property)}
              onChange={(next) => onChange(property, next)}
              snapshot={snapshot}
            />
          </div>
        );
      })}
    </div>
  );
}

function ColorRow({
  currentValue,
  label,
  onChange,
}: {
  currentValue: string;
  label: string;
  onChange(next: string): void;
}) {
  return (
    <div className="wvaie-style-color-row">
      <div className="wvaie-style-row-title">{label}</div>
      <div className="wvaie-style-color-strip">
        <input
          aria-label={`${label}取色器`}
          className="wvaie-style-color-swatch"
          onChange={(event) => onChange(event.target.value)}
          type="color"
          value={toColorInputValue(currentValue)}
        />
        <input
          aria-label={label}
          className="wvaie-style-input wvaie-style-color-value"
          onChange={(event) => onChange(event.target.value)}
          type="text"
          value={currentValue}
        />
        <div className="wvaie-style-alpha-pill">100%</div>
      </div>
    </div>
  );
}

function CornerGrid({
  currentValue,
  label,
  onChange,
  snapshot,
}: {
  currentValue: string;
  label: string;
  onChange(next: string): void;
  snapshot: StylePropertySnapshot;
}) {
  return (
    <div className="wvaie-style-corner-row">
      <div className="wvaie-style-row-title">{label}</div>
      <div className="wvaie-style-dual-grid">
        {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((corner) => (
          <div className="wvaie-style-dual-cell" key={corner}>
            <CompactControl
              currentValue={currentValue}
              icon={<CornerIcon corner={corner} />}
              onChange={onChange}
              snapshot={snapshot}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SingleRow({
  currentValue,
  label,
  onChange,
  snapshot,
}: {
  currentValue: string;
  label: string;
  onChange(next: string): void;
  snapshot: StylePropertySnapshot;
}) {
  const rowClass = snapshot.property === "boxShadow" ? "wvaie-style-shadow-row" : "wvaie-style-single-row";

  return (
    <div className={rowClass}>
      <div className="wvaie-style-row-title">{label}</div>
      <CompactControl
        currentValue={currentValue}
        icon={getStyleIcon(snapshot.property)}
        onChange={onChange}
        snapshot={snapshot}
      />
    </div>
  );
}

function CompactControl({
  currentValue,
  icon,
  onChange,
  snapshot,
}: {
  currentValue: string;
  icon: ReactNode;
  onChange(next: string): void;
  snapshot: StylePropertySnapshot;
}) {
  if (snapshot.property === "fontFamily") {
    return (
      <div className="wvaie-style-compact-shell">
        <span className="wvaie-style-icon">{icon}</span>
        <FontFamilyControl value={currentValue} onChange={onChange} compact />
      </div>
    );
  }

  if (snapshot.inputType === "select") {
    return (
      <div className="wvaie-style-compact-shell">
        <span className="wvaie-style-icon">{icon}</span>
        <select
          aria-label={snapshot.label}
          className="wvaie-style-inline-select"
          onChange={(event) => onChange(event.target.value)}
          value={currentValue}
        >
          {FONT_WEIGHT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (snapshot.inputType === "number") {
    return (
      <div className="wvaie-style-compact-shell">
        <span className="wvaie-style-icon">{icon}</span>
        <InlineLengthControl
          label={snapshot.label}
          onChange={onChange}
          unit={snapshot.unit ?? "px"}
          unitOptions={getLengthUnitOptions(snapshot.unitOptions)}
          value={currentValue}
        />
      </div>
    );
  }

  if (snapshot.property === "boxShadow") {
    return (
      <textarea
        aria-label={snapshot.label}
        className="wvaie-textarea wvaie-style-shadow-textarea"
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        value={currentValue}
      />
    );
  }

  return (
    <div className="wvaie-style-compact-shell">
      <span className="wvaie-style-icon">{icon}</span>
      <input
        aria-label={snapshot.label}
        className="wvaie-style-inline-input"
        onChange={(event) => onChange(event.target.value)}
        type="text"
        value={currentValue}
      />
    </div>
  );
}

function FontFamilyControl({
  compact = false,
  onChange,
  value,
}: {
  compact?: boolean;
  onChange(next: string): void;
  value: string;
}) {
  const [fonts, setFonts] = useState<string[]>(FALLBACK_FONT_OPTIONS);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function loadLocalFonts(): Promise<void> {
    const queryLocalFonts = (window as LocalFontWindow).queryLocalFonts;

    if (!queryLocalFonts) {
      setStatus("当前浏览器或页面环境不支持读取本地字体，可继续手动输入字体栈。");
      return;
    }

    setLoading(true);
    setStatus("正在请求本地字体权限…");

    try {
      const localFonts = await queryLocalFonts();
      const families = Array.from(new Set(localFonts.map((font) => font.family).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      );

      if (families.length === 0) {
        setStatus("没有读取到本地字体，已保留默认字体选项。");
        return;
      }

      setFonts([...families, ...FALLBACK_FONT_OPTIONS]);
      setStatus(`已读取 ${families.length} 个本地字体族。`);
    } catch {
      setStatus("本地字体读取被取消或失败，可继续手动输入字体栈。");
    } finally {
      setLoading(false);
    }
  }

  const selectValue = fonts.includes(value) ? value : "";

  if (compact) {
    return (
      <div className="wvaie-style-font-compact">
        <select
          aria-label="字体选择"
          className="wvaie-style-inline-select"
          onChange={(event) => {
            if (event.target.value) {
              onChange(event.target.value);
            }
          }}
          value={selectValue}
        >
          <option value="">当前字体</option>
          {fonts.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
        <button className="wvaie-style-font-trigger" disabled={loading} onClick={loadLocalFonts} type="button">
          {loading ? "…" : <DownloadIcon />}
        </button>
        {status && <p className="wvaie-font-status" role="status">{status}</p>}
      </div>
    );
  }

  return (
    <div className="wvaie-font-family-control">
      <div className="wvaie-font-family-row">
        <select
          aria-label="字体选择"
          className="wvaie-style-select"
          onChange={(event) => {
            if (event.target.value) {
              onChange(event.target.value);
            }
          }}
          value={selectValue}
        >
          <option value="">当前 / 手动字体</option>
          {fonts.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
        <button className="wvaie-button wvaie-button-text" disabled={loading} onClick={loadLocalFonts} type="button">
          {loading ? "读取中" : "读取本地字体"}
        </button>
      </div>
      <input
        aria-label="字体栈"
        className="wvaie-style-input"
        onChange={(event) => onChange(event.target.value)}
        placeholder="例如 SF Pro Display, PingFang SC, sans-serif"
        type="text"
        value={value}
      />
      {status && <p className="wvaie-font-status" role="status">{status}</p>}
    </div>
  );
}

function InlineLengthControl({
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
    <div className="wvaie-style-inline-length">
      <input
        aria-label={`${label}数值`}
        className="wvaie-style-inline-input"
        inputMode="decimal"
        onChange={handleValueChange}
        type="text"
        value={numericText}
      />
      <select
        aria-label={`${label}单位`}
        className="wvaie-style-inline-unit"
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

function toColorInputValue(value: string): string {
  const trimmed = value.trim();
  if (/^#([0-9a-fA-F]{6})$/.test(trimmed)) return trimmed;
  const rgb = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return rgb ? `#${toHex(rgb[1])}${toHex(rgb[2])}${toHex(rgb[3])}` : "#000000";
}

function toHex(value: string): string {
  return Number(value).toString(16).padStart(2, "0");
}

function getStyleIcon(property: StylePropertyName): ReactNode {
  switch (property) {
    case "fontFamily":
      return <FontFamilyIcon />;
    case "fontSize":
      return <FontSizeIcon />;
    case "lineHeight":
      return <LineHeightIcon />;
    case "fontWeight":
      return <FontWeightIcon />;
    case "letterSpacing":
      return <LetterSpacingIcon />;
    case "borderWidth":
      return <StrokeWidthIcon />;
    case "boxShadow":
      return <ShadowIcon />;
    default:
      return <GenericStyleIcon />;
  }
}

function FontFamilyIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 5H16" />
      <path d="M7 15L10 5L13 15" />
      <path d="M8.25 11H11.75" />
    </svg>
  );
}

function FontSizeIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 6H14" />
      <path d="M9 6V16" />
      <path d="M15 10H18" />
      <path d="M16.5 10V16" />
    </svg>
  );
}

function LineHeightIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 5H15" />
      <path d="M5 10H15" />
      <path d="M5 15H15" />
      <path d="M2.75 5V15" />
    </svg>
  );
}

function FontWeightIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6 4H11.5C13.4 4 14.5 5.05 14.5 6.5C14.5 7.55 13.9 8.35 12.85 8.72" />
      <path d="M6 9H12.25C14.25 9 15.5 10.1 15.5 11.75C15.5 13.65 14.1 15 11.95 15H6V4" />
    </svg>
  );
}

function LetterSpacingIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6 5L3.5 15" />
      <path d="M6 5L8.5 15" />
      <path d="M4.5 11H7.5" />
      <path d="M12 5L9.5 15" />
      <path d="M12 5L14.5 15" />
      <path d="M10.5 11H13.5" />
      <path d="M2.5 17H17.5" />
    </svg>
  );
}

function StrokeWidthIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 5H16" />
      <path d="M4 10H16" />
      <path d="M4 15H16" />
    </svg>
  );
}

function ShadowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="4" y="4" width="9" height="9" rx="2" />
      <path d="M8 8H16V16H8Z" />
    </svg>
  );
}

function CornerIcon({ corner }: { corner: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const path = {
    "top-left": "M15 5H9C6.8 5 5 6.8 5 9V15",
    "top-right": "M5 5H11C13.2 5 15 6.8 15 9V15",
    "bottom-left": "M15 15H9C6.8 15 5 13.2 5 11V5",
    "bottom-right": "M5 15H11C13.2 15 15 13.2 15 11V5",
  }[corner];

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function GenericStyleIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 5H15V15H5Z" />
      <path d="M8 8H12V12H8Z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 4V13" />
      <path d="M6.5 9.5L10 13L13.5 9.5" />
      <path d="M5 16H15" />
    </svg>
  );
}
