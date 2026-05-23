import type { MatchLevel } from "../shared/types";

const DEFAULT_LIMIT = 50;
const PLUGIN_DOM_PREFIXES = ["web-visual-ai-editor-"];

export type FindSimilarResult = {
  matchLevel: MatchLevel;
  primaryFeature: string;
  totalMatched: number;
  truncated: boolean;
  similar: HTMLElement[];
};

export type FindSimilarOptions = {
  limit?: number;
};

export function findSimilarElements(
  element: HTMLElement,
  root: ParentNode = document.body,
  options: FindSimilarOptions = {}
): FindSimilarResult {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const tag = element.tagName.toLowerCase();
  const classList = collectClasses(element);

  // Candidates of same tag, excluding plugin DOM.
  const allOfTag = Array.from(root.querySelectorAll<HTMLElement>(tag)).filter(
    (el) => !isInsidePluginDom(el)
  );

  // Tier 1: exact class set match
  if (classList.length > 0) {
    const exact = allOfTag.filter((el) => sameClassSet(collectClasses(el), classList));
    if (exact.length >= 2) {
      const result = applyLimit(exact, element, limit);
      const featureClasses = classList.length > 0 ? `.${classList.join(".")}` : "";
      return {
        matchLevel: "exact",
        primaryFeature: `${tag}${featureClasses}`,
        totalMatched: result.totalMatched,
        truncated: result.truncated,
        similar: result.similar,
      };
    }
  }

  // Tier 2: class-primary (any shared class)
  if (classList.length > 0) {
    const primary = pickPrimaryClass(classList);
    const sharedClass = allOfTag.filter((el) => collectClasses(el).includes(primary));
    if (sharedClass.length >= 2) {
      const result = applyLimit(sharedClass, element, limit);
      return {
        matchLevel: "class-primary",
        primaryFeature: `${tag}.${primary}`,
        totalMatched: result.totalMatched,
        truncated: result.truncated,
        similar: result.similar,
      };
    }
  }

  // Tier 3: tag-only under the same parent container.
  const parent = element.parentElement;
  if (parent) {
    const siblings = allOfTag.filter((el) => el.parentElement === parent);
    if (siblings.length >= 2) {
      const result = applyLimit(siblings, element, limit);
      return {
        matchLevel: "tag-only",
        primaryFeature: tag,
        totalMatched: result.totalMatched,
        truncated: result.truncated,
        similar: result.similar,
      };
    }
  }

  // No matches beyond self
  return {
    matchLevel: "tag-only",
    primaryFeature: tag,
    totalMatched: 1,
    truncated: false,
    similar: [],
  };
}

function applyLimit(
  candidates: HTMLElement[],
  source: HTMLElement,
  limit: number
): { totalMatched: number; truncated: boolean; similar: HTMLElement[] } {
  // Ensure source is included in totalMatched calculation
  const others = candidates.filter((el) => el !== source);
  const totalAvailable = others.length + 1; // +1 for source
  const truncated = totalAvailable > limit;
  const totalMatched = truncated ? limit : totalAvailable;
  const otherLimit = totalMatched - 1; // reserve 1 slot for source
  return {
    totalMatched,
    truncated,
    similar: others.slice(0, otherLimit),
  };
}

function collectClasses(element: HTMLElement): string[] {
  return Array.from(element.classList);
}

function sameClassSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  for (const cls of b) {
    if (!setA.has(cls)) return false;
  }
  return true;
}

function pickPrimaryClass(classes: string[]): string {
  // Pick the longest class name as the primary feature.
  // Stable: tie-broken by lexicographic order.
  return [...classes].sort((a, b) => {
    if (b.length !== a.length) return b.length - a.length;
    return a.localeCompare(b);
  })[0];
}

function isInsidePluginDom(element: HTMLElement): boolean {
  let cursor: HTMLElement | null = element;
  while (cursor) {
    if (cursor.id && PLUGIN_DOM_PREFIXES.some((prefix) => cursor!.id.startsWith(prefix))) {
      return true;
    }
    cursor = cursor.parentElement;
  }
  return false;
}
