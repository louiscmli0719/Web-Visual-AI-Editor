import type { StyleInputType, StylePropertyName, StylePropertySnapshot } from "../shared/types";
import { LENGTH_UNIT_OPTIONS } from "../shared/style-units";

type StylePropertyDefinition = {
  property: StylePropertyName;
  label: string;
  inputType: StyleInputType;
  unit?: "px" | "pt";
  unitOptions?: StylePropertySnapshot["unitOptions"];
};

export const STYLE_PROPERTY_DEFINITIONS: StylePropertyDefinition[] = [
  { property: "color", label: "文本颜色", inputType: "color" },
  { property: "backgroundColor", label: "背景色", inputType: "color" },
  { property: "fontFamily", label: "字体", inputType: "text" },
  { property: "fontSize", label: "字号", inputType: "number", unit: "px", unitOptions: [...LENGTH_UNIT_OPTIONS] },
  { property: "fontWeight", label: "字重", inputType: "select" },
  { property: "lineHeight", label: "行高", inputType: "number", unit: "px", unitOptions: [...LENGTH_UNIT_OPTIONS] },
  { property: "letterSpacing", label: "字间距", inputType: "text" },
  { property: "paddingTop", label: "内边距 上", inputType: "number", unit: "px", unitOptions: [...LENGTH_UNIT_OPTIONS] },
  { property: "paddingRight", label: "内边距 右", inputType: "number", unit: "px", unitOptions: [...LENGTH_UNIT_OPTIONS] },
  { property: "paddingBottom", label: "内边距 下", inputType: "number", unit: "px", unitOptions: [...LENGTH_UNIT_OPTIONS] },
  { property: "paddingLeft", label: "内边距 左", inputType: "number", unit: "px", unitOptions: [...LENGTH_UNIT_OPTIONS] },
  { property: "marginTop", label: "外边距 上", inputType: "number", unit: "px", unitOptions: [...LENGTH_UNIT_OPTIONS] },
  { property: "marginRight", label: "外边距 右", inputType: "number", unit: "px", unitOptions: [...LENGTH_UNIT_OPTIONS] },
  { property: "marginBottom", label: "外边距 下", inputType: "number", unit: "px", unitOptions: [...LENGTH_UNIT_OPTIONS] },
  { property: "marginLeft", label: "外边距 左", inputType: "number", unit: "px", unitOptions: [...LENGTH_UNIT_OPTIONS] },
  { property: "borderRadius", label: "圆角", inputType: "number", unit: "px", unitOptions: [...LENGTH_UNIT_OPTIONS] },
  { property: "borderWidth", label: "边框粗细", inputType: "number", unit: "px", unitOptions: [...LENGTH_UNIT_OPTIONS] },
  { property: "borderColor", label: "边框颜色", inputType: "color" },
  { property: "boxShadow", label: "阴影", inputType: "text" }
];

export const FONT_WEIGHT_OPTIONS = ["400", "500", "600", "700"] as const;

export function readStyleSnapshot(element: Element): StylePropertySnapshot[] {
  if (!(element instanceof HTMLElement)) {
    return [];
  }

  const style = window.getComputedStyle(element);

  return STYLE_PROPERTY_DEFINITIONS.map((definition) => ({
    property: definition.property,
    label: definition.label,
    inputType: definition.inputType,
    unit: definition.unit,
    unitOptions: definition.unitOptions,
    value: readComputedValue(style, definition.property)
  }));
}

function readComputedValue(style: CSSStyleDeclaration, property: StylePropertyName): string {
  const value = style[property as keyof CSSStyleDeclaration];

  return typeof value === "string" ? value : "";
}
