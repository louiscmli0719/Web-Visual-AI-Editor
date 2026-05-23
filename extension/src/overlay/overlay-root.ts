export type OverlayController = {
  update(input: OverlayState): void;
  flash(rect: HighlightRect): void;
  highlightSimilar(rects: HighlightRect[]): void;
  destroy(): void;
};

export type HighlightRect = {
  x: number;
  y: number;
  width: number;
  height: number;
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

export type OverlayState = {
  enabled: boolean;
  hoverRect: HighlightRect | null;
  selectedRect: HighlightRect | null;
  selectedElement: Element | null;
  measurement: MeasurementOverlay | null;
};

const OVERLAY_HOST_ID = "web-visual-ai-editor-overlay-root";

export function createOverlayRoot(): OverlayController {
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

  const flashBox = document.createElement("div");
  flashBox.className = "wvaie-box wvaie-box-flash";

  const similarLayer = document.createElement("div");
  similarLayer.className = "wvaie-similar-layer";

  // V0.4 measurement layer
  const sizeLabel = document.createElement("div");
  sizeLabel.className = "wvaie-size-label";

  const pairBoxA = document.createElement("div");
  pairBoxA.className = "wvaie-box wvaie-box-pair-a";

  const pairBoxB = document.createElement("div");
  pairBoxB.className = "wvaie-box wvaie-box-pair-b";

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

    .wvaie-box-pair-a {
      border: 2px dashed #ff2d55;
      background: rgba(255, 45, 85, 0.1);
    }

    .wvaie-box-pair-b {
      border: 2px dashed #f97316;
      background: rgba(249, 115, 22, 0.1);
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
      background: #ef4444;
      pointer-events: none;
    }

    .wvaie-distance-h {
      height: 1px;
    }

    .wvaie-distance-v {
      width: 1px;
    }

    .wvaie-distance-label {
      position: fixed;
      top: 0;
      left: 0;
      display: none;
      padding: 2px 5px;
      border-radius: 4px;
      border: 1px solid rgba(255, 45, 85, 0.46);
      background: rgba(14, 14, 14, 0.9);
      color: #ffe4e6;
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
    flashBox,
    similarLayer,
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
      updateBox(selectedBox, input.selectedRect);

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
