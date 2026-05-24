import type { LayoutContext, LayoutDisplay } from "../shared/types";
import { buildElementSelector } from "./selector";

const DISPLAY_VALUES = ["flex", "inline-flex", "grid", "inline-grid", "block", "inline"] as const;

export function readLayoutContext(element: HTMLElement): LayoutContext | null {
  const parent = element.parentElement;

  if (!parent) {
    return null;
  }

  const style = window.getComputedStyle(parent);
  const display = normalizeDisplay(style.display);
  const siblings = Array.from(parent.children).filter((child) => child instanceof HTMLElement);
  const childIndex = Math.max(0, siblings.indexOf(element));

  return {
    parentSelector: buildElementSelector(parent),
    parentTagName: parent.tagName.toLowerCase(),
    display,
    flexDirection: display === "flex" || display === "inline-flex" ? style.flexDirection : null,
    justifyContent: display === "flex" || display === "inline-flex" || display === "grid" || display === "inline-grid"
      ? style.justifyContent
      : null,
    alignItems: display === "flex" || display === "inline-flex" || display === "grid" || display === "inline-grid"
      ? style.alignItems
      : null,
    gap: {
      row: style.rowGap,
      column: style.columnGap
    },
    childIndex,
    siblingCount: siblings.length
  };
}

function normalizeDisplay(value: string): LayoutDisplay {
  return (DISPLAY_VALUES as readonly string[]).includes(value) ? (value as LayoutDisplay) : "other";
}
