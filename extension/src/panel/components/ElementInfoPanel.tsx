import type { ElementSnapshot } from "../../shared/types";

type ElementInfoPanelProps = {
  element: ElementSnapshot | null;
};

export function ElementInfoPanel({ element }: ElementInfoPanelProps) {
  if (!element) {
    return (
      <section className="wvaie-section">
        <h2>选中元素</h2>
        <p className="wvaie-empty">尚未选中元素。进入编辑模式后，点击页面上的任意普通元素。</p>
      </section>
    );
  }

  return (
    <section className="wvaie-section">
      <h2>选中元素</h2>
      <dl>
        <dt>Tag</dt>
        <dd>{element.tagName}</dd>
        <dt>ID</dt>
        <dd>{element.id || "-"}</dd>
        <dt>Class</dt>
        <dd>{element.className || "-"}</dd>
        <dt>Selector</dt>
        <dd className="wvaie-code">{element.selector}</dd>
        <dt>Text</dt>
        <dd>{element.text || "空"}</dd>
        <dt>Size</dt>
        <dd>
          {element.rect.width} x {element.rect.height}
        </dd>
        <dt>Position</dt>
        <dd>
          x={element.rect.x}, y={element.rect.y}
        </dd>
      </dl>
    </section>
  );
}
