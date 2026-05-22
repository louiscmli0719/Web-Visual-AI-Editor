import { describe, expect, it } from "vitest";
import { createStylePreviewManager } from "./style-preview";

function mountElement(tag: string, inlineStyle = ""): HTMLElement {
  const element = document.createElement(tag);

  if (inlineStyle) {
    element.setAttribute("style", inlineStyle);
  }

  document.body.appendChild(element);
  return element;
}

describe("style-preview", () => {
  it("applies inline preview values and reports ok", () => {
    const manager = createStylePreviewManager();
    const button = mountElement("button");

    const result = manager.apply(button, "backgroundColor", "#006be6");

    expect(result).toEqual({ ok: true });
    expect(button.style.backgroundColor).toBe("rgb(0, 107, 230)");
  });

  it("restores the original inline style when reset is called", () => {
    const manager = createStylePreviewManager();
    const card = mountElement("div", "background-color: rgb(255, 255, 255);");

    manager.apply(card, "backgroundColor", "#000000");
    expect(card.style.backgroundColor).toBe("rgb(0, 0, 0)");

    manager.reset(card);

    expect(card.style.backgroundColor).toBe("rgb(255, 255, 255)");
  });

  it("clears inline style when there was no original inline value", () => {
    const manager = createStylePreviewManager();
    const card = mountElement("div");

    manager.apply(card, "color", "#ff0000");
    expect(card.style.color).toBe("rgb(255, 0, 0)");

    manager.reset(card);

    expect(card.style.color).toBe("");
  });

  it("resetAll restores every touched element", () => {
    const manager = createStylePreviewManager();
    const card = mountElement("div", "background-color: rgb(255, 255, 255);");
    const button = mountElement("button");

    manager.apply(card, "backgroundColor", "#000000");
    manager.apply(button, "color", "#ffffff");

    manager.resetAll();

    expect(card.style.backgroundColor).toBe("rgb(255, 255, 255)");
    expect(button.style.color).toBe("");
  });

  it("rejects non-HTMLElement targets", () => {
    const manager = createStylePreviewManager();
    const text = document.createTextNode("hello");

    const result = manager.apply(text as unknown as Element, "color", "#000");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/不支持/);
    }
  });

  it("ignores reset for elements that were never previewed", () => {
    const manager = createStylePreviewManager();
    const card = mountElement("div", "color: rgb(10, 10, 10);");

    manager.reset(card);

    expect(card.style.color).toBe("rgb(10, 10, 10)");
  });
});
