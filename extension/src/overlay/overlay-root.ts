export type OverlayController = {
  update(input: OverlayState): void;
  flash(rect: HighlightRect): void;
  destroy(): void;
};

export type HighlightRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OverlayState = {
  enabled: boolean;
  hoverRect: HighlightRect | null;
  selectedRect: HighlightRect | null;
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
  status.textContent = "编辑模式";

  const hoverBox = document.createElement("div");
  hoverBox.className = "wvaie-box wvaie-box-hover";

  const selectedBox = document.createElement("div");
  selectedBox.className = "wvaie-box wvaie-box-selected";

  const flashBox = document.createElement("div");
  flashBox.className = "wvaie-box wvaie-box-flash";

  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
      pointer-events: none;
      position: fixed;
      z-index: 2147483647;
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
      border: 1px solid #38bdf8;
      background: rgba(56, 189, 248, 0.08);
    }

    .wvaie-box-selected {
      border: 2px solid #006be6;
      background: rgba(0, 107, 230, 0.08);
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);
    }

    .wvaie-box-flash {
      border: 2px solid #f97316;
      background: rgba(249, 115, 22, 0.1);
      opacity: 0;
      transition: opacity 120ms ease-out;
    }

    .wvaie-status {
      position: fixed;
      top: 16px;
      left: 16px;
      padding: 8px 10px;
      border: 1px solid rgba(0, 107, 230, 0.35);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.96);
      color: #0f172a;
      font: 12px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
    }
  `;

  shadow.append(style, hoverBox, selectedBox, flashBox, status);

  return {
    update(input) {
      status.hidden = !input.enabled;
      updateBox(hoverBox, input.hoverRect);
      updateBox(selectedBox, input.selectedRect);
    },
    flash(rect) {
      updateBox(flashBox, rect);
      flashBox.style.opacity = "1";

      window.setTimeout(() => {
        flashBox.style.opacity = "0";
      }, 160);
    },
    destroy() {
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
