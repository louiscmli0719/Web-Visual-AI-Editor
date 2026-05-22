export function buildElementSelector(element: Element): string {
  if (element.id) {
    return `#${cssEscape(element.id)}`;
  }

  const stableAttributeSelector = buildStableAttributeSelector(element);

  if (stableAttributeSelector) {
    return stableAttributeSelector;
  }

  return buildDomPathSelector(element);
}

function buildStableAttributeSelector(element: Element): string | null {
  const attributes = ["data-testid", "data-cy", "aria-label"];

  for (const attribute of attributes) {
    const value = element.getAttribute(attribute);

    if (value) {
      return `${element.tagName.toLowerCase()}[${attribute}="${cssString(value)}"]`;
    }
  }

  return null;
}

function buildDomPathSelector(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.documentElement) {
    const tagName = current.tagName.toLowerCase();
    const parent: Element | null = current.parentElement;

    if (!parent) {
      parts.unshift(tagName);
      break;
    }

    const index = Array.from(parent.children).indexOf(current) + 1;
    parts.unshift(`${tagName}:nth-child(${index})`);
    current = parent;
  }

  return parts.join(" > ");
}

function cssEscape(value: string): string {
  return globalThis.CSS?.escape ? globalThis.CSS.escape(value) : value.replace(/"/g, '\\"');
}

function cssString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
