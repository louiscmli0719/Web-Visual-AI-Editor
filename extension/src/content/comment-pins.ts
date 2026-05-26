import type { CommentPinOverlay, HighlightRect } from "../overlay/overlay-root";
import type { EditRecord } from "../shared/types";

export function buildCommentPinsFromRecords(
  records: EditRecord[],
  queryElement: (selector: string) => Element | null = (selector) => document.querySelector(selector)
): CommentPinOverlay[] {
  const grouped = new Map<string, { count: number; element: Element }>();
  let visibleCommentNumber = 0;

  for (const record of records) {
    if (!record.element || !record.comment.trim()) {
      continue;
    }

    visibleCommentNumber += 1;

    const existing = grouped.get(record.element.selector);
    if (existing) {
      existing.count = visibleCommentNumber;
      continue;
    }

    const element = queryElement(record.element.selector);
    if (!element) {
      continue;
    }

    grouped.set(record.element.selector, {
      count: visibleCommentNumber,
      element,
    });
  }

  return Array.from(grouped.entries()).map(([selector, item]) => ({
    id: selector,
    count: item.count,
    rect: rectFromElement(item.element),
  }));
}

function rectFromElement(element: Element): HighlightRect {
  const rect = element.getBoundingClientRect();

  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  };
}
