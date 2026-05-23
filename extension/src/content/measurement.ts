type RectLike = {
  x?: number;
  y?: number;
  width: number;
  height: number;
};

type Viewport = {
  width: number;
  height: number;
};

export function readSize(rect: { width: number; height: number }): { width: number; height: number } {
  return {
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

export function readViewportDistances(
  rect: { x: number; y: number; width: number; height: number },
  viewport: Viewport
): { top: number; right: number; bottom: number; left: number } {
  return {
    top: Math.round(rect.y),
    right: Math.round(viewport.width - (rect.x + rect.width)),
    bottom: Math.round(viewport.height - (rect.y + rect.height)),
    left: Math.round(rect.x),
  };
}

export function readParentDistances(
  child: { x: number; y: number; width: number; height: number },
  parent: { x: number; y: number; width: number; height: number }
): { top: number; right: number; bottom: number; left: number } | null {
  if (parent.width <= 0 || parent.height <= 0) {
    return null;
  }

  return {
    top: Math.round(child.y - parent.y),
    right: Math.round(parent.x + parent.width - (child.x + child.width)),
    bottom: Math.round(parent.y + parent.height - (child.y + child.height)),
    left: Math.round(child.x - parent.x),
  };
}

export function computePairMeasurement(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): { horizontalDistance: number; verticalDistance: number; centerDistance: number } {
  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;

  // Horizontal gap: only meaningful when elements don't overlap horizontally.
  // Nested or overlapping elements report 0 (no gap between them).
  let horizontalDistance = 0;
  if (aRight <= b.x) {
    horizontalDistance = b.x - aRight;
  } else if (bRight <= a.x) {
    horizontalDistance = a.x - bRight;
  }

  // Vertical gap: same logic for vertical direction.
  let verticalDistance = 0;
  if (aBottom <= b.y) {
    verticalDistance = b.y - aBottom;
  } else if (bBottom <= a.y) {
    verticalDistance = a.y - bBottom;
  }

  // Center distance: Euclidean distance between center points
  const centerA = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
  const centerB = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  const dx = centerB.x - centerA.x;
  const dy = centerB.y - centerA.y;
  const centerDistance = Math.sqrt(dx * dx + dy * dy);

  return {
    horizontalDistance: Math.round(horizontalDistance),
    verticalDistance: Math.round(verticalDistance),
    centerDistance: Math.round(centerDistance),
  };
}
