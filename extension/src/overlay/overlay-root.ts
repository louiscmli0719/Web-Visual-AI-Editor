export type OverlayController = {
  update(input: OverlayState): void;
  flash(rect: HighlightRect): void;
  highlightSimilar(rects: HighlightRect[]): void;
  destroy(): void;
};

export type LayoutDragStart = {
  pointerId: number;
  clientX: number;
  clientY: number;
};

export type HighlightRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LayoutGuideOverlay = {
  targetRect: HighlightRect | null;
  lineRect: HighlightRect | null;
  alignmentLines: HighlightRect[];
  label: string | null;
};

export type MeasurementOverlay = {
  size: { width: number; height: number } | null;
  pair: {
    a: HighlightRect;
    b: HighlightRect;
    horizontalDistance: number;
    verticalDistance: number;
  } | null;
};

export type CommentPinOverlay = {
  id: string;
  count: number;
  rect: HighlightRect;
};

export type OverlayState = {
  enabled: boolean;
  hoverRect: HighlightRect | null;
  selectedRect: HighlightRect | null;
  selectedElement: Element | null;
  measurement: MeasurementOverlay | null;
  layoutMode: boolean;
  layoutGuide: LayoutGuideOverlay | null;
  commentPins: CommentPinOverlay[];
};

const OVERLAY_HOST_ID = "web-visual-ai-editor-overlay-root";

export function createOverlayRoot(
  options: { onLayoutDragStart?(event: LayoutDragStart): void } = {}
): OverlayController {
  const existing = document.getElementById(OVERLAY_HOST_ID);

  if (existing) {
    existing.remove();
  }

  const host = document.createElement("div");
  host.id = OVERLAY_HOST_ID;
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const status = document.createElement("div");
  status.className = "wvaie-status";
  status.textContent = "Web Visual AI Editor";

  const hoverBox = document.createElement("div");
  hoverBox.className = "wvaie-box wvaie-box-hover";

  const selectedBox = document.createElement("div");
  selectedBox.className = "wvaie-box wvaie-box-selected";

  const layoutHandle = document.createElement("button");
  layoutHandle.className = "wvaie-layout-handle";
  layoutHandle.type = "button";
  layoutHandle.setAttribute("aria-label", "拖动调整布局位置");
  layoutHandle.innerHTML = `<span class="wvaie-layout-grip" aria-hidden="true"></span>`;

  const layoutGuideLayer = document.createElement("div");
  layoutGuideLayer.className = "wvaie-layout-guide-layer";

  const layoutTargetBox = document.createElement("div");
  layoutTargetBox.className = "wvaie-box wvaie-layout-target";

  const layoutGuideLine = document.createElement("div");
  layoutGuideLine.className = "wvaie-layout-guide-line";

  const layoutGuideLabel = document.createElement("div");
  layoutGuideLabel.className = "wvaie-layout-guide-label";

  const flashBox = document.createElement("div");
  flashBox.className = "wvaie-box wvaie-box-flash";

  const similarLayer = document.createElement("div");
  similarLayer.className = "wvaie-similar-layer";

  const commentPinLayer = document.createElement("div");
  commentPinLayer.className = "wvaie-comment-pin-layer";

  // V0.4 measurement layer
  const sizeLabel = document.createElement("div");
  sizeLabel.className = "wvaie-size-label";

  const pairBoxA = document.createElement("div");
  pairBoxA.className = "wvaie-box wvaie-box-pair-a";

  const pairBoxB = document.createElement("div");
  pairBoxB.className = "wvaie-box wvaie-box-pair-b";

  const measurementGuideLayer = document.createElement("div");
  measurementGuideLayer.className = "wvaie-measurement-guide-layer";

  const distanceHLine = document.createElement("div");
  distanceHLine.className = "wvaie-distance-line wvaie-distance-h";

  const distanceVLine = document.createElement("div");
  distanceVLine.className = "wvaie-distance-line wvaie-distance-v";

  const distanceHLabel = document.createElement("div");
  distanceHLabel.className = "wvaie-distance-label";

  const distanceVLabel = document.createElement("div");
  distanceVLabel.className = "wvaie-distance-label";

  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
      pointer-events: none;
      position: fixed;
      z-index: 2147483644;
    }

    .wvaie-box {
      box-sizing: border-box;
      position: fixed;
      top: 0;
      left: 0;
      display: none;
      pointer-events: none;
    }

    .wvaie-box-hover {
      border: 1px solid rgba(255, 45, 85, 0.82);
      background: rgba(255, 45, 85, 0.1);
    }

    .wvaie-box-selected {
      border: 2px solid #ff2d55;
      background: rgba(255, 45, 85, 0.14);
    }

    .wvaie-box-selected.wvaie-box-layout {
      border-color: #a855f7;
      background: rgba(217, 70, 239, 0.04);
      box-shadow:
        0 0 0 1px rgba(236, 72, 153, 0.76),
        0 0 28px rgba(217, 70, 239, 0.24);
    }

    .wvaie-layout-handle {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 2;
      display: none;
      align-items: center;
      justify-content: center;
      height: 20px;
      min-width: 0;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: transparent;
      cursor: grab;
      font: 700 12px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 5px 0;
      pointer-events: auto;
      touch-action: none;
      user-select: none;
      box-shadow: none;
    }

    .wvaie-layout-handle:active {
      cursor: grabbing;
    }

    .wvaie-layout-grip {
      width: 100%;
      height: 9px;
      border-radius: 999px;
      background: #ff00d4;
      box-shadow:
        0 0 0 1px rgba(255, 255, 255, 0.5),
        0 0 18px rgba(255, 0, 212, 0.72),
        0 8px 22px rgba(0, 0, 0, 0.36);
    }

    .wvaie-layout-target {
      border: 2px dashed rgba(236, 72, 153, 0.96);
      background: rgba(217, 70, 239, 0.07);
      box-shadow:
        inset 0 0 0 1px rgba(244, 114, 182, 0.28),
        0 0 24px rgba(217, 70, 239, 0.18);
    }

    .wvaie-layout-guide-layer,
    .wvaie-measurement-guide-layer {
      pointer-events: none;
    }

    .wvaie-layout-alignment-line,
    .wvaie-measurement-guide-line {
      position: fixed;
      top: 0;
      left: 0;
      display: block;
      pointer-events: none;
    }

    .wvaie-layout-alignment-line {
      opacity: 0.92;
      filter: drop-shadow(0 0 5px rgba(217, 70, 239, 0.66));
    }

    .wvaie-measurement-guide-line {
      opacity: 0.74;
      filter: drop-shadow(0 0 4px rgba(217, 70, 239, 0.45));
    }

    .wvaie-guide-v {
      background-image: repeating-linear-gradient(
        to bottom,
        rgba(217, 70, 239, 0.98) 0,
        rgba(217, 70, 239, 0.98) 3px,
        transparent 3px,
        transparent 8px
      );
    }

    .wvaie-guide-h {
      background-image: repeating-linear-gradient(
        to right,
        rgba(217, 70, 239, 0.98) 0,
        rgba(217, 70, 239, 0.98) 3px,
        transparent 3px,
        transparent 8px
      );
    }

    .wvaie-layout-guide-line {
      position: fixed;
      top: 0;
      left: 0;
      display: none;
      border-radius: 999px;
      background: transparent;
      pointer-events: none;
      box-shadow: 0 0 10px rgba(217, 70, 239, 0.52);
    }

    .wvaie-layout-guide-label {
      position: fixed;
      top: 0;
      left: 0;
      display: none;
      padding: 4px 8px;
      border: 1px solid rgba(244, 114, 182, 0.74);
      border-radius: 999px;
      background: rgba(21, 18, 24, 0.94);
      color: #ffe4ff;
      font: 700 12px/1.2 ui-monospace, Menlo, monospace;
      font-variant-numeric: tabular-nums;
      pointer-events: none;
      white-space: nowrap;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
    }

    .wvaie-box-flash {
      border: 2px solid #ff4d6d;
      background: rgba(255, 77, 109, 0.14);
      opacity: 0;
      transition: opacity 120ms ease-out;
    }

    .wvaie-similar-layer {
      opacity: 1;
      transition: opacity 600ms ease-out;
    }

    .wvaie-similar-box {
      border: 1px dashed #fb7185;
      background: rgba(251, 113, 133, 0.12);
    }

    .wvaie-comment-pin-layer {
      pointer-events: none;
    }

    .wvaie-comment-pin {
      position: fixed;
      top: 0;
      left: 0;
      display: grid;
      width: 34px;
      height: 34px;
      place-items: center;
      border: 2px solid rgba(255, 255, 255, 0.94);
      border-radius: 50%;
      background: #ec35c8;
      color: #fff;
      font: 800 15px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      pointer-events: none;
      box-shadow:
        0 0 0 2px rgba(217, 70, 239, 0.34),
        0 0 24px rgba(236, 53, 200, 0.54),
        0 10px 24px rgba(0, 0, 0, 0.28);
    }

    .wvaie-box-pair-a {
      border: 2px dashed rgba(236, 72, 153, 0.9);
      background: rgba(236, 72, 153, 0.08);
    }

    .wvaie-box-pair-b {
      border: 2px dashed rgba(168, 85, 247, 0.9);
      background: rgba(168, 85, 247, 0.08);
    }

    .wvaie-status {
      position: fixed;
      top: 16px;
      left: 16px;
      padding: 8px 12px;
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 10px;
      background: rgba(14, 14, 14, 0.9);
      color: rgba(226, 232, 240, 0.86);
      font: 12px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    .wvaie-size-label {
      position: fixed;
      top: 0;
      left: 0;
      display: none;
      padding: 4px 8px;
      border: 1px solid rgba(255, 45, 85, 0.48);
      border-radius: 6px;
      background: rgba(14, 14, 14, 0.9);
      color: #ffe4e6;
      font: 600 12px/1.4 ui-monospace, Menlo, monospace;
      pointer-events: none;
      white-space: nowrap;
      box-shadow: 0 10px 22px rgba(0, 0, 0, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    .wvaie-distance-line {
      position: fixed;
      top: 0;
      left: 0;
      display: none;
      background: transparent;
      pointer-events: none;
    }

    .wvaie-distance-h {
      height: 1px;
      background-image: repeating-linear-gradient(
        to right,
        rgba(217, 70, 239, 0.98) 0,
        rgba(217, 70, 239, 0.98) 4px,
        transparent 4px,
        transparent 9px
      );
    }

    .wvaie-distance-v {
      width: 1px;
      background-image: repeating-linear-gradient(
        to bottom,
        rgba(217, 70, 239, 0.98) 0,
        rgba(217, 70, 239, 0.98) 4px,
        transparent 4px,
        transparent 9px
      );
    }

    .wvaie-distance-label {
      position: fixed;
      top: 0;
      left: 0;
      display: none;
      padding: 2px 5px;
      border-radius: 4px;
      border: 1px solid rgba(217, 70, 239, 0.54);
      background: rgba(14, 14, 14, 0.9);
      color: #fce7ff;
      font: 600 11px/1.3 ui-monospace, Menlo, monospace;
      pointer-events: none;
      white-space: nowrap;
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.24);
    }

    @media (prefers-reduced-motion: reduce) {
      .wvaie-box-flash,
      .wvaie-similar-layer {
        transition: none;
      }
    }
  `;

  shadow.append(
    style,
    hoverBox,
    selectedBox,
    layoutGuideLayer,
    layoutTargetBox,
    layoutGuideLine,
    layoutGuideLabel,
    layoutHandle,
    flashBox,
    similarLayer,
    commentPinLayer,
    measurementGuideLayer,
    pairBoxA,
    pairBoxB,
    distanceHLine,
    distanceVLine,
    sizeLabel,
    distanceHLabel,
    distanceVLabel,
    status
  );

  let similarFadeTimer: number | null = null;
  let similarClearTimer: number | null = null;

  layoutHandle.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) {
      return;
    }

    layoutHandle.setPointerCapture?.(event.pointerId);
    options.onLayoutDragStart?.({
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY
    });
    event.preventDefault();
    event.stopPropagation();
  });

  function clearSimilarHighlight(): void {
    if (similarFadeTimer !== null) {
      window.clearTimeout(similarFadeTimer);
      similarFadeTimer = null;
    }
    if (similarClearTimer !== null) {
      window.clearTimeout(similarClearTimer);
      similarClearTimer = null;
    }
    similarLayer.replaceChildren();
    similarLayer.style.opacity = "1";
  }

  return {
    update(input) {
      status.hidden = !input.enabled;
      updateBox(hoverBox, input.hoverRect);
      selectedBox.classList.toggle("wvaie-box-layout", input.layoutMode && input.selectedRect !== null);
      updateBox(selectedBox, input.selectedRect);
      updateLayoutHandle(layoutHandle, input.selectedRect, input.layoutMode);
      updateLayoutGuide(layoutTargetBox, layoutGuideLine, layoutGuideLabel, layoutGuideLayer, input.layoutGuide);
      renderCommentPins(commentPinLayer, input.commentPins);

      // Measurement: size label
      if (input.measurement?.size && input.selectedRect && input.selectedElement) {
        const tagName = input.selectedElement.tagName.toLowerCase();
        sizeLabel.textContent = `<${tagName}> ${input.measurement.size.width} × ${input.measurement.size.height}`;
        positionSizeLabel(sizeLabel, input.selectedRect);
        sizeLabel.style.display = "block";
      } else {
        sizeLabel.style.display = "none";
      }

      // Measurement: pair distance lines
      if (input.measurement?.pair) {
        const { a, b, horizontalDistance, verticalDistance } = input.measurement.pair;

        updateBox(pairBoxA, a);
        updateBox(pairBoxB, b);
        renderMeasurementGuideLines(measurementGuideLayer, a, b);

        renderPairLines(
          distanceHLine,
          distanceVLine,
          distanceHLabel,
          distanceVLabel,
          a,
          b,
          horizontalDistance,
          verticalDistance
        );
      } else {
        pairBoxA.style.display = "none";
        pairBoxB.style.display = "none";
        measurementGuideLayer.replaceChildren();
        distanceHLine.style.display = "none";
        distanceVLine.style.display = "none";
        distanceHLabel.style.display = "none";
        distanceVLabel.style.display = "none";
      }
    },
    flash(rect) {
      updateBox(flashBox, rect);
      flashBox.style.opacity = "1";

      window.setTimeout(() => {
        flashBox.style.opacity = "0";
      }, 160);
    },
    highlightSimilar(rects) {
      clearSimilarHighlight();

      for (const rect of rects) {
        const box = document.createElement("div");
        box.className = "wvaie-box wvaie-similar-box";
        updateBox(box, rect);
        similarLayer.appendChild(box);
      }

      similarFadeTimer = window.setTimeout(() => {
        similarLayer.style.opacity = "0";
      }, 3000);
      similarClearTimer = window.setTimeout(() => {
        clearSimilarHighlight();
      }, 3600);
    },
    destroy() {
      clearSimilarHighlight();
      host.remove();
    }
  };
}

function renderCommentPins(layer: HTMLElement, pins: CommentPinOverlay[]): void {
  layer.replaceChildren();

  for (const pin of pins) {
    if (pin.rect.width <= 0 || pin.rect.height <= 0) {
      continue;
    }

    const bubble = document.createElement("div");
    bubble.className = "wvaie-comment-pin";
    bubble.textContent = String(Math.min(pin.count, 99));
    const x = clamp(pin.rect.x + pin.rect.width - 17, 4, window.innerWidth - 38);
    const y = clamp(pin.rect.y - 17, 4, window.innerHeight - 38);
    bubble.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    layer.appendChild(bubble);
  }
}

function updateBox(box: HTMLElement, rect: HighlightRect | null): void {
  if (!rect || rect.width <= 0 || rect.height <= 0) {
    box.style.display = "none";
    return;
  }

  box.style.display = "block";
  box.style.transform = `translate(${rect.x}px, ${rect.y}px)`;
  box.style.width = `${rect.width}px`;
  box.style.height = `${rect.height}px`;
}

function updateLayoutHandle(handle: HTMLElement, rect: HighlightRect | null, active: boolean): void {
  if (!active || !rect || rect.width <= 0 || rect.height <= 0) {
    handle.style.display = "none";
    return;
  }

  const maxWidth = Math.max(30, Math.min(180, rect.width - 12));
  const minWidth = Math.min(44, maxWidth);
  const width = clamp(rect.width * 0.58, minWidth, maxWidth);
  const x = clamp(rect.x + rect.width / 2 - width / 2, 6, window.innerWidth - width - 6);
  const y = clamp(rect.y + rect.height / 2 - 10, 6, window.innerHeight - 26);

  handle.style.display = "inline-flex";
  handle.style.width = `${Math.round(width)}px`;
  handle.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}

function updateLayoutGuide(
  targetBox: HTMLElement,
  guideLine: HTMLElement,
  guideLabel: HTMLElement,
  guideLayer: HTMLElement,
  guide: LayoutGuideOverlay | null
): void {
  updateBox(targetBox, guide?.targetRect ?? null);
  renderGuideLines(guideLayer, guide?.alignmentLines ?? [], "wvaie-layout-alignment-line");

  if (!guide?.lineRect) {
    guideLine.style.display = "none";
    guideLabel.style.display = "none";
    return;
  }

  updateBox(guideLine, guide.lineRect);
  guideLine.classList.toggle("wvaie-guide-v", guide.lineRect.height >= guide.lineRect.width);
  guideLine.classList.toggle("wvaie-guide-h", guide.lineRect.width > guide.lineRect.height);
  guideLabel.textContent = guide.label ?? "换位";
  guideLabel.style.display = "block";
  guideLabel.style.transform = `translate(${Math.round(guide.lineRect.x + guide.lineRect.width + 8)}px, ${Math.round(guide.lineRect.y + guide.lineRect.height / 2 - 11)}px)`;
}

function positionSizeLabel(label: HTMLElement, rect: HighlightRect): void {
  // Default: place at top-right outside the element
  const labelHeight = 20;
  let labelX = rect.x + rect.width;
  let labelY = rect.y - labelHeight - 2;

  // Mirror to below if above viewport
  if (labelY < 0) {
    labelY = rect.y + rect.height + 2;
  }

  // Use approximate text width to avoid measuring (8px per char)
  const text = label.textContent || "";
  const estimatedWidth = text.length * 8 + 12;

  // Mirror to left if exceeds viewport right
  if (labelX + estimatedWidth > window.innerWidth) {
    labelX = rect.x + rect.width - estimatedWidth;
  }

  // Ensure not negative
  labelX = Math.max(0, labelX);

  label.style.transform = `translate(${labelX}px, ${labelY}px)`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function renderGuideLines(layer: HTMLElement, rects: HighlightRect[], className: string): void {
  layer.replaceChildren();

  for (const rect of rects) {
    if (rect.width <= 0 || rect.height <= 0) {
      continue;
    }

    const line = document.createElement("div");
    const isVertical = rect.height >= rect.width;
    line.className = `${className} ${isVertical ? "wvaie-guide-v" : "wvaie-guide-h"}`;
    line.style.transform = `translate(${Math.round(rect.x)}px, ${Math.round(rect.y)}px)`;
    line.style.width = `${Math.max(1, Math.round(rect.width))}px`;
    line.style.height = `${Math.max(1, Math.round(rect.height))}px`;
    layer.appendChild(line);
  }
}

function renderMeasurementGuideLines(layer: HTMLElement, a: HighlightRect, b: HighlightRect): void {
  const verticals = uniqueGuideValues([
    a.x,
    a.x + a.width / 2,
    a.x + a.width,
    b.x,
    b.x + b.width / 2,
    b.x + b.width
  ], window.innerWidth);
  const horizontals = uniqueGuideValues([
    a.y,
    a.y + a.height / 2,
    a.y + a.height,
    b.y,
    b.y + b.height / 2,
    b.y + b.height
  ], window.innerHeight);

  renderGuideLines(
    layer,
    [
      ...verticals.map((x) => ({ x, y: 0, width: 1, height: window.innerHeight })),
      ...horizontals.map((y) => ({ x: 0, y, width: window.innerWidth, height: 1 }))
    ],
    "wvaie-measurement-guide-line"
  );
}

function uniqueGuideValues(values: number[], max: number): number[] {
  const result: number[] = [];

  for (const rawValue of values) {
    const value = Math.round(clamp(rawValue, 0, max));
    if (!result.some((existing) => Math.abs(existing - value) <= 1)) {
      result.push(value);
    }
  }

  return result;
}

function renderPairLines(
  hLine: HTMLElement,
  vLine: HTMLElement,
  hLabel: HTMLElement,
  vLabel: HTMLElement,
  a: HighlightRect,
  b: HighlightRect,
  horizontalDistance: number,
  verticalDistance: number
): void {
  // Horizontal line between right edge of left element and left edge of right element
  const leftRect = a.x < b.x ? a : b;
  const rightRect = a.x < b.x ? b : a;
  const leftRectRight = leftRect.x + leftRect.width;
  const horizontalY = (a.y + a.height / 2 + b.y + b.height / 2) / 2;

  if (horizontalDistance > 0) {
    hLine.style.display = "block";
    hLine.style.transform = `translate(${leftRectRight}px, ${horizontalY}px)`;
    hLine.style.width = `${rightRect.x - leftRectRight}px`;
    hLine.style.height = "1px";

    hLabel.style.display = "block";
    hLabel.textContent = `↔ ${horizontalDistance}`;
    hLabel.style.transform = `translate(${(leftRectRight + rightRect.x) / 2 - 20}px, ${horizontalY - 14}px)`;
  } else {
    hLine.style.display = "none";
    hLabel.style.display = "none";
  }

  // Vertical line between bottom of top element and top of bottom element
  const topRect = a.y < b.y ? a : b;
  const bottomRect = a.y < b.y ? b : a;
  const topRectBottom = topRect.y + topRect.height;
  const verticalX = (a.x + a.width / 2 + b.x + b.width / 2) / 2;

  if (verticalDistance > 0) {
    vLine.style.display = "block";
    vLine.style.transform = `translate(${verticalX}px, ${topRectBottom}px)`;
    vLine.style.width = "1px";
    vLine.style.height = `${bottomRect.y - topRectBottom}px`;

    vLabel.style.display = "block";
    vLabel.textContent = `↕ ${verticalDistance}`;
    vLabel.style.transform = `translate(${verticalX + 4}px, ${(topRectBottom + bottomRect.y) / 2 - 8}px)`;
  } else {
    vLine.style.display = "none";
    vLabel.style.display = "none";
  }
}
