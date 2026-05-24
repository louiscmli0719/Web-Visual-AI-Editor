import type { FontChange, FontPropertyName, StyleChange } from "./types";

export const FONT_PROPERTY_NAMES = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing"
] as const satisfies readonly FontPropertyName[];

const FONT_PROPERTY_NAME_SET = new Set<string>(FONT_PROPERTY_NAMES);

export function isFontPropertyName(property: string): property is FontPropertyName {
  return FONT_PROPERTY_NAME_SET.has(property);
}

export function deriveFontChanges(styleChanges: StyleChange[]): FontChange[] {
  return styleChanges
    .filter((change): change is StyleChange & { property: FontPropertyName } => isFontPropertyName(change.property))
    .map((change) => ({ ...change }));
}
