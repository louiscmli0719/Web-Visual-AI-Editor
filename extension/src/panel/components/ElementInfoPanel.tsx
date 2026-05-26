import type { ElementSnapshot } from "../../shared/types";
import { InspectorSection } from "./InspectorSection";

type ElementInfoPanelProps = {
  element: ElementSnapshot | null;
};

export function ElementInfoPanel({ element }: ElementInfoPanelProps) {
  if (!element) {
    return (
      <InspectorSection as="section" className="wvaie-empty-state">
        <p>已选中元素，可以添加评论或编辑样式。</p>
      </InspectorSection>
    );
  }

  const width = Math.round(element.rect.width);
  const height = Math.round(element.rect.height);
  const x = Math.round(element.rect.x);
  const y = Math.round(element.rect.y);
  const selectorDetail = buildSelectorDetail(element.selector, element.tagName.toLowerCase());
  const summaryText = element.text.trim() || selectorDetail;

  return (
    <InspectorSection as="section" className="wvaie-element-summary">
      <div className="wvaie-element-head">
        <div className="wvaie-element-tag">{element.tagName.toLowerCase()}</div>
        <span className="wvaie-element-dimensions">{width} × {height} px</span>
      </div>
      {element.className && <p className="wvaie-element-path">.{element.className.split(" ").join(".")}</p>}
      {element.id && <p className="wvaie-element-path">#{element.id}</p>}

      <div className="wvaie-style-section">
        <h2 className="wvaie-card-title">位置与尺寸</h2>
        <div className="wvaie-style-section-grid">
          <div className="wvaie-style-dual-grid">
            <Value label="X" value={x} />
            <Value label="Y" value={y} />
            <Value label="W" value={width} />
            <Value label="H" value={height} />
          </div>
        </div>
      </div>

      <div className="wvaie-style-section">
        <h2 className="wvaie-card-title">高级信息</h2>
        <div className="wvaie-advanced-info-grid">
          <div className="wvaie-advanced-info-cell">
            <span className="wvaie-style-row-title">说明</span>
            <p className="wvaie-advanced-info-text">{summaryText}</p>
          </div>
          <div className="wvaie-advanced-info-cell">
            <span className="wvaie-style-row-title">Selector</span>
            <p className="wvaie-advanced-info-text">{selectorDetail}</p>
          </div>
        </div>
      </div>
    </InspectorSection>
  );
}

function Value({ label, value }: { label: string; value: number }) {
  return (
    <div className="wvaie-style-dual-cell">
      <div className="wvaie-style-compact-shell">
        <span className="wvaie-style-icon">{label}</span>
        <strong className="wvaie-style-inline-value">{value}</strong>
      </div>
    </div>
  );
}

function buildSelectorDetail(selector: string, tagName: string): string {
  if (selector.includes("body")) {
    return selector;
  }

  return `body > ${selector || tagName}`;
}
