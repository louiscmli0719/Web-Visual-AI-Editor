import { describe, expect, it, beforeEach } from "vitest";
import { readLayoutContext } from "./layout-inspector";

describe("readLayoutContext", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("reads flex parent layout context for the selected element", () => {
    document.body.innerHTML = `
      <div id="actions" style="display:flex; flex-direction:row; justify-content:center; align-items:flex-start; gap:16px 24px;">
        <button id="a">A</button>
        <button id="b">B</button>
      </div>
    `;

    const target = document.getElementById("b") as HTMLElement;
    const context = readLayoutContext(target);

    expect(context).toMatchObject({
      parentSelector: "#actions",
      parentTagName: "div",
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "flex-start",
      childIndex: 1,
      siblingCount: 2
    });
  });

  it("returns block context with null flex alignment fields", () => {
    document.body.innerHTML = `
      <section id="content">
        <p id="copy">Copy</p>
      </section>
    `;

    const target = document.getElementById("copy") as HTMLElement;
    const context = readLayoutContext(target);

    expect(context?.display).toBe("block");
    expect(context?.flexDirection).toBe(null);
    expect(context?.justifyContent).toBe(null);
    expect(context?.alignItems).toBe(null);
  });
});
