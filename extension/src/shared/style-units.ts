import type { StyleUnit } from "./types";

export const STYLE_LENGTH_UNITS = ["px", "pt"] as const satisfies readonly StyleUnit[];
export const LENGTH_UNIT_OPTIONS = STYLE_LENGTH_UNITS;

export function isStyleUnit(value: unknown): value is StyleUnit {
  return typeof value === "string" && (STYLE_LENGTH_UNITS as readonly string[]).includes(value);
}

export function readStyleUnit(value: string, fallback: StyleUnit): StyleUnit {
  const matchedUnit = value.trim().match(/(px|pt)$/i)?.[1]?.toLowerCase();

  return isStyleUnit(matchedUnit) ? matchedUnit : fallback;
}
