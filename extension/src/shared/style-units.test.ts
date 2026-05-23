import { describe, expect, it } from "vitest";
import { readStyleUnit } from "./style-units";

describe("readStyleUnit", () => {
  it("returns the actual supported suffix from a style value", () => {
    expect(readStyleUnit("12px", "pt")).toBe("px");
    expect(readStyleUnit("9PT", "px")).toBe("pt");
  });

  it("uses the property default when no supported suffix exists", () => {
    expect(readStyleUnit("normal", "px")).toBe("px");
  });
});
