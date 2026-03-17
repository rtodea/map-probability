/**
 * colors.js — Pure functions for heatmap color scale mapping.
 *
 * Uses a sequential blue→yellow→red palette for birth probability.
 * All functions are pure: value in, color string out.
 *
 * Public API:
 *   HEATMAP_STOPS              — ordered color stop array
 *   colorForValue(value, min, max) — interpolate hex color for a value
 *   scaleSteps(min, max, n)    — generate n evenly-spaced breakpoints
 *   legendRanges(min, max, n)  — array of { color, label } for legend
 */

/** Sequential heatmap palette (7 stops, blue → red). */
export const HEATMAP_STOPS = [
  '#313695', // deep blue (lowest)
  '#4575b4',
  '#74add1',
  '#fee090', // yellow (mid)
  '#f46d43',
  '#d73027',
  '#a50026', // deep red (highest)
];

export const NO_DATA_COLOR = '#cccccc';

/** Parse hex color to [r, g, b]. */
const hexToRgb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

/** Convert [r, g, b] to hex string. */
const rgbToHex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

/** Linearly interpolate between two RGB colors. */
const lerpColor = (c1, c2, t) =>
  c1.map((v, i) => v + (c2[i] - v) * t);

/**
 * Map a value to a hex color on the heatmap scale.
 * Values outside [min, max] are clamped.
 * Returns NO_DATA_COLOR for null/undefined/NaN.
 */
export const colorForValue = (value, min = 0, max = 1) => {
  if (value == null || Number.isNaN(value)) return NO_DATA_COLOR;

  const stops = HEATMAP_STOPS;
  const t = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const segment = t * (stops.length - 1);
  const i = Math.min(Math.floor(segment), stops.length - 2);
  const localT = segment - i;

  return rgbToHex(lerpColor(hexToRgb(stops[i]), hexToRgb(stops[i + 1]), localT));
};

/** Generate n evenly-spaced breakpoints between min and max. */
export const scaleSteps = (min, max, n = 7) => {
  const step = (max - min) / (n - 1);
  return Array.from({ length: n }, (_, i) => min + step * i);
};

/** Generate legend entries: [{ color, label }]. */
export const legendRanges = (min, max, n = 7) =>
  scaleSteps(min, max, n).map((value) => ({
    color: colorForValue(value, min, max),
    label: `${(value * 100).toFixed(1)}%`,
  }));
