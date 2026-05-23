import { describe, expect, it } from "vitest";
import { convertLengthValue, normalizeLengthValue, splitLengthValue } from "./style-length";

describe("style-length", () => {
  it("splits length values into numeric text and unit", () => {
    expect(splitLengthValue("12px", "px")).toEqual({ numericText: "12", unit: "px", isNumeric: true });
    expect(splitLengthValue("9pt", "px")).toEqual({ numericText: "9", unit: "pt", isNumeric: true });
  });

  it("normalizes empty input to zero in the active unit", () => {
    expect(normalizeLengthValue("   ", "px")).toBe("0px");
  });

  it("converts between px and pt", () => {
    expect(convertLengthValue("12px", "pt", "px")).toBe("9pt");
    expect(convertLengthValue("9pt", "px", "pt")).toBe("12px");
  });
});
