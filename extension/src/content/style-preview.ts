import type { StylePropertyName } from "../shared/types";

export type StylePreviewResult = { ok: true } | { ok: false; reason: string };

export type StylePreviewManager = {
  apply(element: Element, property: StylePropertyName, value: string): StylePreviewResult;
  reset(element: Element): void;
  resetAll(): void;
};

export function createStylePreviewManager(): StylePreviewManager {
  const originals = new WeakMap<HTMLElement, Map<StylePropertyName, string>>();
  const touched = new Set<HTMLElement>();

  function ensureOriginal(element: HTMLElement, property: StylePropertyName): void {
    let map = originals.get(element);

    if (!map) {
      map = new Map();
      originals.set(element, map);
    }

    if (!map.has(property)) {
      map.set(property, element.style[property as keyof CSSStyleDeclaration] as string);
    }
  }

  return {
    apply(element, property, value) {
      if (!(element instanceof HTMLElement)) {
        return { ok: false, reason: "该元素暂不支持样式预览" };
      }

      ensureOriginal(element, property);
      try {
        (element.style as unknown as Record<string, string>)[property] = value;
      } catch {
        return { ok: false, reason: "样式值无法应用" };
      }

      touched.add(element);
      return { ok: true };
    },
    reset(element) {
      if (!(element instanceof HTMLElement)) {
        return;
      }

      const map = originals.get(element);

      if (!map) {
        return;
      }

      for (const [property, originalValue] of map) {
        (element.style as unknown as Record<string, string>)[property] = originalValue ?? "";
      }

      originals.delete(element);
      touched.delete(element);
    },
    resetAll() {
      for (const element of touched) {
        const map = originals.get(element);

        if (!map) {
          continue;
        }

        for (const [property, originalValue] of map) {
          (element.style as unknown as Record<string, string>)[property] = originalValue ?? "";
        }

        originals.delete(element);
      }

      touched.clear();
    }
  };
}
