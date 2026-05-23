import type { StyleUnit } from "../../shared/types";
import { LENGTH_UNIT_OPTIONS } from "../../shared/style-units";

const LENGTH_PATTERN = /^\s*(-?(?:\d+\.?\d*|\.\d+))(px|pt)?\s*$/i;

const UNIT_TO_PX: Record<StyleUnit, number> = {
  px: 1,
  pt: 96 / 72,
};

export function getLengthUnitOptions(options?: readonly StyleUnit[]): readonly StyleUnit[] {
  return options && options.length > 0 ? options : LENGTH_UNIT_OPTIONS;
}

export function splitLengthValue(value: string, fallbackUnit: StyleUnit): { numericText: string; unit: StyleUnit; isNumeric: boolean } {
  const parsed = parseLengthValue(value, fallbackUnit);

  if (!parsed) {
    return {
      numericText: value,
      unit: fallbackUnit,
      isNumeric: false,
    };
  }

  return {
    numericText: formatLengthNumber(parsed.number),
    unit: parsed.unit,
    isNumeric: true,
  };
}

export function parseLengthValue(value: string, fallbackUnit: StyleUnit): { number: number; unit: StyleUnit } | null {
  const match = value.trim().match(LENGTH_PATTERN);

  if (!match) {
    return null;
  }

  return {
    number: Number(match[1]),
    unit: (match[2]?.toLowerCase() as StyleUnit | undefined) ?? fallbackUnit,
  };
}

export function normalizeLengthValue(rawValue: string, unit: StyleUnit): string {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return `0${unit}`;
  }

  const parsed = parseLengthValue(trimmed, unit);
  if (!parsed) {
    return rawValue;
  }

  return `${formatLengthNumber(parsed.number)}${parsed.unit}`;
}

export function convertLengthValue(rawValue: string, nextUnit: StyleUnit, fallbackUnit: StyleUnit): string {
  const parsed = parseLengthValue(rawValue, fallbackUnit);

  if (!parsed) {
    return `0${nextUnit}`;
  }

  const pxValue = parsed.number * UNIT_TO_PX[parsed.unit];
  const nextValue = pxValue / UNIT_TO_PX[nextUnit];

  return `${formatLengthNumber(nextValue)}${nextUnit}`;
}

function formatLengthNumber(value: number): string {
  const rounded = Math.round(value * 10000) / 10000;

  if (Object.is(rounded, -0)) {
    return "0";
  }

  return rounded.toString().replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}
