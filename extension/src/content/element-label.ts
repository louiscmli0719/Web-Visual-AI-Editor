/**
 * Element Label Overlay
 * Displays a floating label above selected elements showing tag name and dimensions
 */

const LABEL_CLASS = "wvaie-element-label";
const LABEL_OFFSET_Y = 8; // pixels above the element

export type ElementLabelController = {
  show(element: Element): void;
  hide(): void;
  destroy(): void;
};

export function createElementLabel(): ElementLabelController {
  let labelElement: HTMLDivElement | null = null;
  let currentTarget: Element | null = null;
  let resizeObserver: ResizeObserver | null = null;

  function createLabelElement(): HTMLDivElement {
    const label = document.createElement("div");
    label.className = LABEL_CLASS;

    const style = document.createElement("style");
    style.textContent = `
      .${LABEL_CLASS} {
        position: fixed;
        z-index: 2147483646;
        padding: 4px 8px;
        background: rgba(14, 14, 14, 0.9);
        border: 1px solid rgba(255, 45, 85, 0.48);
        border-radius: 6px;
        color: #ffe4e6;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.4;
        white-space: nowrap;
        pointer-events: none;
        box-shadow: 0 10px 22px rgba(0, 0, 0, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        transform: translateY(-100%);
        transition: opacity 150ms ease, transform 150ms ease;
      }

      .${LABEL_CLASS}[data-hidden="true"] {
        opacity: 0;
        pointer-events: none;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(label);

    return label;
  }

  function updatePosition(element: Element): void {
    if (!labelElement) return;

    const rect = element.getBoundingClientRect();
    const labelRect = labelElement.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - labelRect.width / 2;
    let top = rect.top - labelRect.height - LABEL_OFFSET_Y;

    // Keep label within viewport horizontally
    const viewportWidth = window.innerWidth;
    if (left < 4) {
      left = 4;
    } else if (left + labelRect.width > viewportWidth - 4) {
      left = viewportWidth - labelRect.width - 4;
    }

    // If label would be above viewport, show below element instead
    if (top < 4) {
      top = rect.bottom + LABEL_OFFSET_Y;
    }

    labelElement.style.left = `${left}px`;
    labelElement.style.top = `${top}px`;
  }

  function show(element: Element): void {
    if (currentTarget === element && labelElement) {
      return;
    }

    hide();

    currentTarget = element;
    labelElement = createLabelElement();

    const tagName = element.tagName.toLowerCase();
    const rect = element.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);

    labelElement.textContent = `<${tagName}> ${width} × ${height}`;
    labelElement.setAttribute("data-hidden", "false");

    updatePosition(element);

    // Update position on scroll and resize
    const updateHandler = () => updatePosition(element);
    window.addEventListener("scroll", updateHandler, { passive: true, capture: true });
    window.addEventListener("resize", updateHandler, { passive: true });

    // Observe element size changes
    resizeObserver = new ResizeObserver(() => {
      if (labelElement && currentTarget) {
        const rect = currentTarget.getBoundingClientRect();
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        const tagName = currentTarget.tagName.toLowerCase();
        labelElement.textContent = `<${tagName}> ${width} × ${height}`;
        updatePosition(currentTarget);
      }
    });
    resizeObserver.observe(element);

    // Store cleanup
    (labelElement as any).__cleanup = () => {
      window.removeEventListener("scroll", updateHandler, { capture: true });
      window.removeEventListener("resize", updateHandler);
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
    };
  }

  function hide(): void {
    if (labelElement) {
      const cleanup = (labelElement as any).__cleanup;
      if (cleanup) cleanup();
      labelElement.remove();
      labelElement = null;
    }
    currentTarget = null;
  }

  function destroy(): void {
    hide();
  }

  return { show, hide, destroy };
}
