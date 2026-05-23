import { describe, expect, it } from "vitest";
import { readStyleSnapshot, STYLE_PROPERTY_DEFINITIONS } from "./style-inspector";
import { LENGTH_UNIT_OPTIONS } from "../shared/style-units";

function renderElement(html: string, style: string): HTMLElement {
  document.body.innerHTML = `<div data-host>${html}</div>`;
  const host = document.body.querySelector<HTMLElement>("[data-host]");

  if (!host) {
    throw new Error("Failed to mount test host");
  }

  const target = host.firstElementChild as HTMLElement;
  target.setAttribute("style", style);
  return target;
}

describe("style-inspector", () => {
  it("returns one snapshot per supported whitelist property in a stable order", () => {
    const target = renderElement(`<button>提交</button>`, "");

    const snapshot = readStyleSnapshot(target);

    expect(snapshot).toHaveLength(STYLE_PROPERTY_DEFINITIONS.length);
    expect(snapshot.map((item) => item.property)).toEqual(
      STYLE_PROPERTY_DEFINITIONS.map((definition) => definition.property)
    );
  });

  it("reads computed values for color, fontSize, fontWeight, and borderRadius", () => {
    const target = renderElement(
      `<button>Save</button>`,
      "color: rgb(255, 0, 0); font-size: 18px; font-weight: 600; border-radius: 8px;"
    );

    const snapshot = readStyleSnapshot(target);

    expect(snapshot).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: "color", label: "文本颜色", value: "rgb(255, 0, 0)", inputType: "color" }),
        expect.objectContaining({ property: "fontSize", label: "字号", inputType: "number", unit: "px", unitOptions: LENGTH_UNIT_OPTIONS }),
        expect.objectContaining({ property: "fontWeight", label: "字重", inputType: "select" }),
        expect.objectContaining({ property: "borderRadius", label: "圆角", inputType: "number", unit: "px", unitOptions: LENGTH_UNIT_OPTIONS })
      ])
    );

    const fontSize = snapshot.find((item) => item.property === "fontSize");
    expect(fontSize?.value).toBe("18px");
  });

  it("returns an empty list for non-HTMLElement nodes", () => {
    const fragment = document.createDocumentFragment();
    const text = document.createTextNode("hello");
    fragment.appendChild(text);

    expect(readStyleSnapshot(text as unknown as Element)).toEqual([]);
  });

  it("returns boxShadow as a text input", () => {
    const target = renderElement(`<div>card</div>`, "box-shadow: 0 2px 6px rgba(0,0,0,0.2);");
    const snapshot = readStyleSnapshot(target);
    const boxShadow = snapshot.find((item) => item.property === "boxShadow");

    expect(boxShadow?.inputType).toBe("text");
    expect(boxShadow?.value.length).toBeGreaterThan(0);
  });
});
