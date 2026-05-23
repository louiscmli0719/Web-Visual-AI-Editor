import { describe, it, expect } from 'vitest';
import {
  readSize,
  readViewportDistances,
  readParentDistances,
  computePairMeasurement,
} from './measurement';

describe('measurement', () => {
  describe('readSize', () => {
    it('rounds width and height to integers', () => {
      expect(readSize({ width: 100.4, height: 50.6 })).toEqual({ width: 100, height: 51 });
    });

    it('handles zero size', () => {
      expect(readSize({ width: 0, height: 0 })).toEqual({ width: 0, height: 0 });
    });
  });

  describe('readViewportDistances', () => {
    it('computes distances to viewport edges', () => {
      const rect = { x: 100, y: 200, width: 300, height: 150 };
      const viewport = { width: 1440, height: 900 };

      expect(readViewportDistances(rect, viewport)).toEqual({
        top: 200,
        right: 1040, // 1440 - (100 + 300)
        bottom: 550, // 900 - (200 + 150)
        left: 100,
      });
    });

    it('returns negative values when element is outside viewport', () => {
      const rect = { x: -20, y: -10, width: 100, height: 50 };
      const viewport = { width: 1440, height: 900 };

      expect(readViewportDistances(rect, viewport)).toEqual({
        top: -10,
        right: 1360, // 1440 - (-20 + 100)
        bottom: 860, // 900 - (-10 + 50)
        left: -20,
      });
    });

    it('rounds all values', () => {
      const rect = { x: 100.7, y: 200.3, width: 300.4, height: 150.6 };
      const viewport = { width: 1440, height: 900 };

      const result = readViewportDistances(rect, viewport);

      expect(Number.isInteger(result.top)).toBe(true);
      expect(Number.isInteger(result.right)).toBe(true);
      expect(Number.isInteger(result.bottom)).toBe(true);
      expect(Number.isInteger(result.left)).toBe(true);
    });
  });

  describe('readParentDistances', () => {
    it('computes distances from child to parent edges', () => {
      const child = { x: 110, y: 210, width: 80, height: 40 };
      const parent = { x: 100, y: 200, width: 300, height: 150 };

      expect(readParentDistances(child, parent)).toEqual({
        top: 10, // 210 - 200
        right: 210, // (100 + 300) - (110 + 80)
        bottom: 100, // (200 + 150) - (210 + 40)
        left: 10, // 110 - 100
      });
    });

    it('returns null when parent has zero size', () => {
      const child = { x: 110, y: 210, width: 80, height: 40 };
      const parent = { x: 100, y: 200, width: 0, height: 0 };

      expect(readParentDistances(child, parent)).toBeNull();
    });

    it('rounds all values', () => {
      const child = { x: 110.5, y: 210.5, width: 80, height: 40 };
      const parent = { x: 100, y: 200, width: 300, height: 150 };

      const result = readParentDistances(child, parent);

      expect(result).not.toBeNull();
      if (result) {
        expect(Number.isInteger(result.top)).toBe(true);
        expect(Number.isInteger(result.right)).toBe(true);
        expect(Number.isInteger(result.bottom)).toBe(true);
        expect(Number.isInteger(result.left)).toBe(true);
      }
    });
  });

  describe('computePairMeasurement', () => {
    it('computes horizontal, vertical and center distances for non-overlapping elements', () => {
      // A: (0, 0) - (100, 50), B: (200, 100) - (300, 200)
      const a = { x: 0, y: 0, width: 100, height: 50 };
      const b = { x: 200, y: 100, width: 100, height: 100 };

      const result = computePairMeasurement(a, b);

      // Horizontal: from A's right (100) to B's left (200) = 100
      expect(result.horizontalDistance).toBe(100);
      // Vertical: from A's bottom (50) to B's top (100) = 50
      expect(result.verticalDistance).toBe(50);
      // Center A: (50, 25), Center B: (250, 150)
      // Distance: sqrt((250-50)^2 + (150-25)^2) = sqrt(40000 + 15625) = sqrt(55625) ≈ 235.85
      expect(result.centerDistance).toBe(236);
    });

    it('takes absolute value when elements overlap', () => {
      const a = { x: 50, y: 50, width: 100, height: 50 };
      const b = { x: 100, y: 60, width: 50, height: 30 };

      const result = computePairMeasurement(a, b);

      // Elements overlap: horizontal and vertical distances should be 0 (no gap)
      expect(result.horizontalDistance).toBe(0);
      expect(result.verticalDistance).toBe(0);
    });

    it('returns zero distances for nested elements', () => {
      // Child fully inside parent
      const parent = { x: 0, y: 0, width: 500, height: 300 };
      const child = { x: 50, y: 50, width: 100, height: 50 };

      const result = computePairMeasurement(child, parent);

      expect(result.horizontalDistance).toBe(0);
      expect(result.verticalDistance).toBe(0);
      expect(result.centerDistance).toBeGreaterThan(0); // centers still differ
    });

    it('reports horizontal gap but zero vertical when elements share y-range', () => {
      // A on the left, B on the right, same y range -> only horizontal gap
      const a = { x: 0, y: 100, width: 100, height: 50 };
      const b = { x: 200, y: 110, width: 100, height: 30 };

      const result = computePairMeasurement(a, b);

      expect(result.horizontalDistance).toBe(100);
      expect(result.verticalDistance).toBe(0); // vertical ranges overlap
    });

    it('works when B is left of A and above A', () => {
      const a = { x: 200, y: 200, width: 100, height: 50 };
      const b = { x: 0, y: 0, width: 100, height: 50 };

      const result = computePairMeasurement(a, b);

      // Horizontal: from B's right (100) to A's left (200) = 100
      expect(result.horizontalDistance).toBe(100);
      // Vertical: from B's bottom (50) to A's top (200) = 150
      expect(result.verticalDistance).toBe(150);
    });

    it('rounds all values', () => {
      const a = { x: 0.3, y: 0.7, width: 100.4, height: 50.6 };
      const b = { x: 200.5, y: 100.3, width: 100, height: 100 };

      const result = computePairMeasurement(a, b);

      expect(Number.isInteger(result.horizontalDistance)).toBe(true);
      expect(Number.isInteger(result.verticalDistance)).toBe(true);
      expect(Number.isInteger(result.centerDistance)).toBe(true);
    });
  });
});
