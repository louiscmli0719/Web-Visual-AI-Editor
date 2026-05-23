import type { ElementSnapshot } from "../../shared/types";
import { InspectorSection } from "./InspectorSection";

type ElementInfoPanelProps = {
  element: ElementSnapshot | null;
};

export function ElementInfoPanel({ element }: ElementInfoPanelProps) {
  if (!element) {
    return (
      <InspectorSection as="section" className="wvaie-empty-state">
        <h2>选择页面元素</h2>
        <p>点击工具栏中的“选择”，然后点击网页中的按钮、文本或容器。</p>
      </InspectorSection>
    );
  }

  const width = Math.round(element.rect.width);
  const height = Math.round(element.rect.height);
  const x = Math.round(element.rect.x);
  const y = Math.round(element.rect.y);

  return (
    <InspectorSection as="section" className="wvaie-element-summary">
      <div className="wvaie-element-head">
        <div className="wvaie-element-tag">{element.tagName.toLowerCase()}</div>
        <span className="wvaie-element-dimensions">{width} × {height} px</span>
      </div>
      {element.className && <p className="wvaie-element-path">.{element.className.split(" ").join(".")}</p>}
      {element.id && <p className="wvaie-element-path">#{element.id}</p>}
      <div className="wvaie-property-section">
        <h2>位置与尺寸</h2>
        <div className="wvaie-value-grid">
          <Value label="X" value={x} />
          <Value label="Y" value={y} />
          <Value label="W" value={width} />
          <Value label="H" value={height} />
        </div>
      </div>
      <details className="wvaie-property-details">
        <summary>高级信息</summary>
        {element.text && <p className="wvaie-element-text">{element.text}</p>}
        <p className="wvaie-element-selector">{element.selector}</p>
      </details>
    </InspectorSection>
  );
}

function Value({ label, value }: { label: string; value: number }) {
  return (
    <div className="wvaie-value-cell">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
