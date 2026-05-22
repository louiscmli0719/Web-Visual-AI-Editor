import type { HighlightRect } from "./overlay-root";

export function applyRectStyle(element: HTMLElement, rect: HighlightRect): void {
  element.style.transform = `translate(${rect.x}px, ${rect.y}px)`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
}
