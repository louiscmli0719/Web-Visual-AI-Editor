import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CommentEditor } from "./CommentEditor";
import { ElementInfoPanel } from "./ElementInfoPanel";
import { LayoutPanel } from "./LayoutPanel";
import { SimilarElementsPanel } from "./SimilarElementsPanel";
import { StyleEditorPanel } from "./StyleEditorPanel";
import type { ElementSnapshot, LayoutContext, StylePropertySnapshot } from "../../shared/types";

const element: ElementSnapshot = {
  tagName: "BUTTON",
  id: "hero-cta",
  className: "hero-button primary",
  selector: "main > section.hero > button.hero-button.primary",
  text: "立即开始",
  rect: {
    x: 433,
    y: 365,
    width: 1008,
    height: 37,
  },
};

const layoutContext: LayoutContext = {
  parentSelector: ".hero-actions",
  parentTagName: "DIV",
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  gap: {
    row: "20px",
    column: "24px",
  },
  childIndex: 0,
  siblingCount: 3,
};

const snapshot: StylePropertySnapshot[] = [
  { property: "fontFamily", label: "字体", value: "Helvetica", inputType: "text" },
  { property: "fontSize", label: "字号", value: "24px", inputType: "number", unit: "px", unitOptions: ["px", "pt"] },
  { property: "lineHeight", label: "行高", value: "32px", inputType: "number", unit: "px", unitOptions: ["px", "pt"] },
  { property: "fontWeight", label: "字重", value: "700", inputType: "select" },
  { property: "color", label: "文本颜色", value: "rgb(255, 255, 255)", inputType: "color" },
  { property: "borderRadius", label: "圆角", value: "16px", inputType: "number", unit: "px", unitOptions: ["px", "pt"] },
  { property: "backgroundColor", label: "背景色", value: "rgb(83, 93, 255)", inputType: "color" },
  { property: "borderWidth", label: "边框粗细", value: "1px", inputType: "number", unit: "px", unitOptions: ["px", "pt"] },
  { property: "borderColor", label: "边框颜色", value: "rgb(255, 255, 255)", inputType: "color" },
  {
    property: "boxShadow",
    label: "阴影",
    value: "rgba(15, 103, 248, 0.08) 0px 8px 24px 0px",
    inputType: "text",
  },
  { property: "paddingTop", label: "内边距 上", value: "20px", inputType: "number", unit: "px", unitOptions: ["px", "pt"] },
  { property: "paddingRight", label: "内边距 右", value: "0px", inputType: "number", unit: "px", unitOptions: ["px", "pt"] },
  { property: "paddingBottom", label: "内边距 下", value: "20px", inputType: "number", unit: "px", unitOptions: ["px", "pt"] },
  { property: "paddingLeft", label: "内边距 左", value: "0px", inputType: "number", unit: "px", unitOptions: ["px", "pt"] },
  { property: "marginTop", label: "外边距 上", value: "20px", inputType: "number", unit: "px", unitOptions: ["px", "pt"] },
  { property: "marginRight", label: "外边距 右", value: "0px", inputType: "number", unit: "px", unitOptions: ["px", "pt"] },
  { property: "marginBottom", label: "外边距 下", value: "20px", inputType: "number", unit: "px", unitOptions: ["px", "pt"] },
  { property: "marginLeft", label: "外边距 左", value: "0px", inputType: "number", unit: "px", unitOptions: ["px", "pt"] },
];

function renderIntoDocument(markup: string): HTMLElement {
  document.body.innerHTML = markup;
  return document.body;
}

describe("inspector panel structure", () => {
  it("renders the Figma-style auto layout block with spacing grids", () => {
    const body = renderIntoDocument(
      renderToStaticMarkup(
        <LayoutPanel
          context={layoutContext}
          hasSelection
          onSave={() => undefined}
          spacingDraft={{}}
          spacingSnapshot={snapshot}
          onStyleChange={() => undefined}
        />
      )
    );

    expect(body.textContent).toContain("自动布局");
    expect(body.textContent).toContain("内边距");
    expect(body.textContent).toContain("外边距");
    expect(body.querySelector(".wvaie-layout-direction-grid")).not.toBeNull();
    expect(body.querySelector(".wvaie-layout-overview-grid")).not.toBeNull();
    expect(body.querySelector(".wvaie-layout-preview-card")).not.toBeNull();
    expect(body.querySelector(".wvaie-layout-gap-card")).not.toBeNull();
    expect(body.querySelector(".wvaie-layout-advanced")).not.toBeNull();
    expect(body.querySelector(".wvaie-layout-save-strip")).toBeNull();
    expect(body.querySelector(".wvaie-layout-spacing-grid")).not.toBeNull();
    expect(body.querySelectorAll(".wvaie-layout-spacing-cell")).toHaveLength(8);
    expect(body.querySelectorAll(".wvaie-layout-mode-button svg")).toHaveLength(2);
    expect(body.querySelectorAll(".wvaie-layout-spacing-icon svg")).toHaveLength(8);
    expect(body.textContent).not.toContain("↧");
    expect(body.textContent).not.toContain("↦");
  });

  it("collapses auto layout controls when the parent layout cannot produce a useful action", () => {
    const body = renderIntoDocument(
      renderToStaticMarkup(
        <LayoutPanel
          context={{ ...layoutContext, display: "block", flexDirection: null, siblingCount: 1 }}
          hasSelection
          onSave={() => undefined}
          spacingDraft={{}}
          spacingSnapshot={snapshot}
          onStyleChange={() => undefined}
        />
      )
    );

    expect(body.textContent).toContain("避免产生无效记录");
    expect(body.querySelector(".wvaie-layout-panel-empty")).not.toBeNull();
    expect(body.querySelector(".wvaie-layout-direction-grid")).toBeNull();
    expect(body.querySelectorAll(".wvaie-layout-spacing-cell")).toHaveLength(0);
  });

  it("renders similar element targets inside a clipped list so long selectors cannot break card radius", () => {
    const primaryFeature = "button.ant-btn.ant-btn-primary.with-a-very-long-generated-class-name";
    const similar = Array.from({ length: 3 }, (_, index) => ({
      ...element,
      selector: `body:nth-child(2) > div:nth-child(2) > section:nth-child(${index + 1}) > div.semi-card-body > div.with-a-very-long-selector`,
    }));

    const body = renderIntoDocument(
      renderToStaticMarkup(
        <SimilarElementsPanel
          applyToSimilar
          matchLevel="exact"
          onHighlightAll={() => undefined}
          onHoverSimilar={() => undefined}
          onToggleApplyToSimilar={() => undefined}
          primaryFeature={primaryFeature}
          similar={similar}
          totalMatched={similar.length}
          truncated={false}
        />
      )
    );

    expect(body.querySelector(".wvaie-similar-list")).not.toBeNull();
    expect(body.querySelectorAll(".wvaie-similar-list li")).toHaveLength(3);
    expect(body.querySelectorAll(".wvaie-similar-target")).toHaveLength(3);
    expect(body.querySelector(".wvaie-similar-feature code")?.getAttribute("title")).toBe(primaryFeature);
    expect(body.querySelector(".wvaie-similar-target")?.getAttribute("title")).toBe(similar[0].selector);
  });

  it("renders the Figma-style style editor groups instead of the legacy details accordion", () => {
    const body = renderIntoDocument(
      renderToStaticMarkup(
        <StyleEditorPanel
          supported
          snapshot={snapshot}
          draft={{}}
          hasSelection
          onChange={() => undefined}
          onReset={() => undefined}
        />
      )
    );

    expect(body.textContent).toContain("字体/排版");
    expect(body.textContent).toContain("外观");
    expect(body.textContent).toContain("描边与效果");
    expect(body.querySelector(".wvaie-style-section-grid")).not.toBeNull();
    expect(body.querySelector(".wvaie-style-color-row")).not.toBeNull();
    expect(body.querySelectorAll(".wvaie-style-dual-grid")).toHaveLength(2);
    expect(body.querySelectorAll(".wvaie-style-dual-cell").length).toBeGreaterThanOrEqual(4);
    expect(body.querySelectorAll(".wvaie-style-icon svg").length).toBeGreaterThanOrEqual(8);
    expect(body.querySelector(".wvaie-style-font-trigger svg")).not.toBeNull();
    expect(body.querySelector(".wvaie-control-group")).toBeNull();
  });

  it("renders advanced info as two fixed text rows instead of a collapsible details block", () => {
    const body = renderIntoDocument(renderToStaticMarkup(<ElementInfoPanel element={element} />));

    expect(body.textContent).toContain("高级信息");
    expect(body.textContent).toContain("body");
    expect(body.querySelector(".wvaie-advanced-info-grid")).not.toBeNull();
    expect(body.querySelector("details")).toBeNull();
  });

  it("renders the element comment area with a single footer checkbox row and primary action", () => {
    const body = renderIntoDocument(
      renderToStaticMarkup(
        <CommentEditor
          disabled={false}
          hasStyleChanges={false}
          measurementsAvailable
          attachMeasurements
          similarAvailable={false}
          onSave={() => undefined}
          onToggleAttachMeasurements={() => undefined}
        />
      )
    );

    expect(body.textContent).toContain("元素评论");
    expect(body.textContent).toContain("附加测距数据");
    expect(body.textContent).toContain("保存记录");
    expect(body.querySelector(".wvaie-comment-shell")).not.toBeNull();
    expect(body.querySelector(".wvaie-comment-footer")).not.toBeNull();
    expect(body.querySelector(".wvaie-metadata-controls")).toBeNull();
  });
});
