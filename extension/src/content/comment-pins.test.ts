import { describe, expect, it } from "vitest";
import { buildCommentPinsFromRecords } from "./comment-pins";
import type { EditRecord, ElementSnapshot, RecordMetadata } from "../shared/types";

const metadata: RecordMetadata = {
  category: "visual",
  priority: "medium",
  status: "open",
  interactionState: null,
  scope: "element",
};

function makeElement(selector: string, x: number): ElementSnapshot {
  return {
    tagName: "DIV",
    id: null,
    className: null,
    selector,
    text: "",
    rect: {
      x,
      y: 20,
      width: 80,
      height: 24,
    },
  };
}

function makeRecord(selector: string, index: number, comment = `评论 ${index}`): EditRecord {
  return {
    id: `record-${index}`,
    element: makeElement(selector, index * 100),
    comment,
    ...metadata,
    createdAt: `2026-05-26T00:00:0${index}.000Z`,
    updatedAt: `2026-05-26T00:00:0${index}.000Z`,
    styleChanges: [],
    measurements: null,
    sharedGroup: null,
  };
}

function createElement(rect: DOMRect): Element {
  return {
    getBoundingClientRect: () => rect,
  } as Element;
}

describe("comment pins", () => {
  it("numbers visible comment pins by global record order instead of resetting per element", () => {
    const elements = new Map<string, Element>([
      ["#first", createElement(new DOMRect(10, 20, 80, 24))],
      ["#second", createElement(new DOMRect(20, 30, 80, 24))],
      ["#third", createElement(new DOMRect(30, 40, 80, 24))],
    ]);

    const pins = buildCommentPinsFromRecords(
      [makeRecord("#first", 1), makeRecord("#second", 2), makeRecord("#third", 3)],
      (selector) => elements.get(selector) ?? null
    );

    expect(pins.map((pin) => pin.count)).toEqual([1, 2, 3]);
  });

  it("keeps the latest global number when multiple records target the same element", () => {
    const elements = new Map<string, Element>([
      ["#first", createElement(new DOMRect(10, 20, 80, 24))],
      ["#second", createElement(new DOMRect(20, 30, 80, 24))],
    ]);

    const pins = buildCommentPinsFromRecords(
      [makeRecord("#first", 1), makeRecord("#second", 2), makeRecord("#first", 3)],
      (selector) => elements.get(selector) ?? null
    );

    expect(pins).toHaveLength(2);
    expect(pins.map((pin) => [pin.id, pin.count])).toEqual([
      ["#first", 3],
      ["#second", 2],
    ]);
  });
});
