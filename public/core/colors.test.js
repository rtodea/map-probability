import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  colorForValue,
  scaleSteps,
  legendRanges,
  HEATMAP_STOPS,
  NO_DATA_COLOR,
} from './colors.js';

describe('colorForValue', () => {
  it('returns first stop color for min value', () => {
    assert.equal(colorForValue(0, 0, 1), HEATMAP_STOPS[0]);
  });

  it('returns last stop color for max value', () => {
    assert.equal(colorForValue(1, 0, 1), HEATMAP_STOPS[HEATMAP_STOPS.length - 1]);
  });

  it('returns a hex color string for mid values', () => {
    const color = colorForValue(0.5, 0, 1);
    assert.match(color, /^#[0-9a-f]{6}$/);
  });

  it('clamps values below min', () => {
    assert.equal(colorForValue(-1, 0, 1), HEATMAP_STOPS[0]);
  });

  it('clamps values above max', () => {
    assert.equal(colorForValue(2, 0, 1), HEATMAP_STOPS[HEATMAP_STOPS.length - 1]);
  });

  it('returns NO_DATA_COLOR for null', () => {
    assert.equal(colorForValue(null), NO_DATA_COLOR);
  });

  it('returns NO_DATA_COLOR for NaN', () => {
    assert.equal(colorForValue(NaN), NO_DATA_COLOR);
  });
});

describe('scaleSteps', () => {
  it('generates correct number of steps', () => {
    const steps = scaleSteps(0, 1, 5);
    assert.equal(steps.length, 5);
  });

  it('starts at min and ends at max', () => {
    const steps = scaleSteps(0, 1, 5);
    assert.equal(steps[0], 0);
    assert.equal(steps[4], 1);
  });

  it('steps are evenly spaced', () => {
    const steps = scaleSteps(0, 1, 5);
    const diffs = steps.slice(1).map((v, i) => v - steps[i]);
    diffs.forEach((d) => assert.ok(Math.abs(d - 0.25) < 1e-10));
  });
});

describe('legendRanges', () => {
  it('returns array of { color, label } objects', () => {
    const ranges = legendRanges(0, 0.3, 4);
    assert.equal(ranges.length, 4);
    ranges.forEach((r) => {
      assert.ok(r.color.startsWith('#'));
      assert.ok(r.label.endsWith('%'));
    });
  });

  it('first label corresponds to min', () => {
    const ranges = legendRanges(0, 1, 3);
    assert.equal(ranges[0].label, '0.0%');
  });
});
