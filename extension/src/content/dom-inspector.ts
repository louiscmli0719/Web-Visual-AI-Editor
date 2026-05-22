import type { ElementSnapshot } from "../shared/types";
import { buildElementSelector } from "./selector";

const MAX_TEXT_LENGTH = 240;

export function readElementSnapshot(element: Element): ElementSnapshot {
  const rect = element.getBoundingClientRect();
  const text = (element.textContent ?? "").trim().replace(/\s+/g, " ");

  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id || null,
    className: getClassName(element),
    selector: buildElementSelector(element),
    text: text.slice(0, MAX_TEXT_LENGTH),
    rect: {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    }
  };
}

function getClassName(element: Element): string | null {
  if (typeof element.className === "string") {
    return element.className || null;
  }

  return null;
}

