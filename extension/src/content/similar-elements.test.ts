import { describe, it, expect, beforeEach } from "vitest";
import { findSimilarElements } from "./similar-elements";

function setBody(html: string): void {
  document.body.innerHTML = html;
}

describe("similar-elements", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("exact match (tag + complete class set)", () => {
    it("matches elements with identical tag and class set", () => {
      setBody(`
        <button class="btn primary">A</button>
        <button class="primary btn">B</button>
        <button class="btn primary">C</button>
      `);

      const a = document.body.querySelector("button")!;
      const result = findSimilarElements(a as HTMLElement, document.body);

      expect(result.matchLevel).toBe("exact");
      expect(result.totalMatched).toBe(3);
      expect(result.similar).toHaveLength(2);
      expect(result.truncated).toBe(false);
    });

    it("returns just self when only one element matches exactly", () => {
      setBody(`
        <button class="btn primary">A</button>
        <button class="btn secondary">B</button>
      `);

      const a = document.body.querySelector("button.primary")!;
      const result = findSimilarElements(a as HTMLElement, document.body);

      // Falls through to class-primary or tag-only
      expect(result.totalMatched).toBeGreaterThanOrEqual(1);
    });
  });

  describe("class-primary match", () => {
    it("matches elements sharing the primary class", () => {
      setBody(`
        <button class="btn primary">A</button>
        <button class="primary lg">B</button>
        <button class="primary outline">C</button>
      `);

      const a = document.body.querySelector("button")!;
      const result = findSimilarElements(a as HTMLElement, document.body);

      // No 2 elements have identical class sets, so exact fails (totalMatched=1).
      // Fall through to class-primary.
      expect(result.matchLevel).toBe("class-primary");
      expect(result.totalMatched).toBe(3);
      expect(result.primaryFeature).toContain("primary");
    });
  });

  describe("tag-only match", () => {
    it("matches elements without class under the same parent container", () => {
      setBody(`
        <ul>
          <li>A</li>
          <li>B</li>
          <li>C</li>
        </ul>
      `);

      const a = document.body.querySelector("li")!;
      const result = findSimilarElements(a as HTMLElement, document.body);

      expect(result.matchLevel).toBe("tag-only");
      expect(result.totalMatched).toBe(3);
      expect(result.primaryFeature).toBe("li");
    });

    it("does not match same-tag elements from another parent container", () => {
      setBody(`
        <ul id="first"><li>A</li><li>B</li></ul>
        <ul id="second"><li>C</li><li>D</li></ul>
      `);

      const a = document.querySelector("#first li") as HTMLElement;
      const result = findSimilarElements(a, document.body);

      expect(result.totalMatched).toBe(2);
      expect(result.similar[0].textContent).toBe("B");
    });

    it("returns self only when no matching siblings", () => {
      setBody(`<div><p>Only one</p></div>`);

      const p = document.body.querySelector("p")!;
      const result = findSimilarElements(p as HTMLElement, document.body);

      expect(result.totalMatched).toBe(1);
      expect(result.similar).toHaveLength(0);
    });
  });

  describe("truncation", () => {
    it("caps results at 50 and reports truncated=true", () => {
      const items = Array.from({ length: 60 }, (_, i) => `<button class="btn primary">${i}</button>`).join("");
      setBody(items);

      const a = document.body.querySelector("button")!;
      const result = findSimilarElements(a as HTMLElement, document.body);

      expect(result.totalMatched).toBe(50);
      expect(result.similar).toHaveLength(49);
      expect(result.truncated).toBe(true);
    });
  });

  describe("plugin DOM exclusion", () => {
    it("excludes elements inside wvaie-* containers", () => {
      setBody(`
        <div id="web-visual-ai-editor-panel-root">
          <button class="btn primary">In plugin</button>
        </div>
        <button class="btn primary">A</button>
        <button class="btn primary">B</button>
      `);

      const a = document.querySelectorAll("button.primary")[1] as HTMLElement;
      const result = findSimilarElements(a, document.body);

      // Should find A and B (not the one inside the plugin root).
      expect(result.totalMatched).toBe(2);
      expect(result.similar).toHaveLength(1);
    });
  });

  describe("custom limit", () => {
    it("respects custom limit option", () => {
      const items = Array.from({ length: 10 }, () => `<button class="btn primary"></button>`).join("");
      setBody(items);

      const a = document.body.querySelector("button")!;
      const result = findSimilarElements(a as HTMLElement, document.body, { limit: 5 });

      expect(result.totalMatched).toBe(5);
      expect(result.truncated).toBe(true);
    });
  });
});
