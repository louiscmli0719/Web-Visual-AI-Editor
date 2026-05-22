import { describe, expect, it } from "vitest";
import { buildElementSelector } from "./selector";

describe("buildElementSelector", () => {
  it("prefers stable id selectors", () => {
    document.body.innerHTML = `<main><button id="save-button">Save</button></main>`;

    const button = document.querySelector("button");

    expect(button).not.toBeNull();
    expect(buildElementSelector(button!)).toBe("#save-button");
  });

  it("uses stable attributes before DOM path selectors", () => {
    document.body.innerHTML = `<main><button data-testid="primary-action">Save</button></main>`;

    const button = document.querySelector("button");

    expect(button).not.toBeNull();
    expect(buildElementSelector(button!)).toBe('button[data-testid="primary-action"]');
  });

  it("falls back to a DOM path when no stable selector exists", () => {
    document.body.innerHTML = `<main><section><button>Cancel</button><button>Save</button></section></main>`;

    const button = document.querySelectorAll("button")[1];

    expect(buildElementSelector(button)).toBe("body:nth-child(2) > main:nth-child(1) > section:nth-child(1) > button:nth-child(2)");
  });
});

