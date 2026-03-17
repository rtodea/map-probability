/**
 * probability.js — Pure functions for birth probability calculations.
 *
 * All functions are pure: no side effects, no DOM access, no fetch calls.
 * Input: arrays/objects of birth data. Output: transformed data.
 *
 * Public API:
 *   globalTotal(records)        — sum all births for a set of records
 *   probabilityOf(births, total) — single region probability (0–1)
 *   withProbabilities(records)  — enrich records with .probability field
 *   percentFormat(p, decimals)  — format 0.1735 → "17.4%"
 *   topN(records, n)            — top N regions by probability
 */

/** Sum births across all records. */
export const globalTotal = (records) =>
  records.reduce((sum, r) => sum + (r.births || 0), 0);

/** Compute probability for a single region. */
export const probabilityOf = (births, total) =>
  total === 0 ? 0 : births / total;

/** Enrich each record with a .probability field. */
export const withProbabilities = (records) => {
  const total = globalTotal(records);
  return records.map((r) => ({
    ...r,
    probability: probabilityOf(r.births || 0, total),
  }));
};

/** Format a probability (0–1) as a percentage string. */
export const percentFormat = (p, decimals = 1) =>
  `${(p * 100).toFixed(decimals)}%`;

/** Return top N records sorted by probability descending. */
export const topN = (records, n = 10) =>
  [...records]
    .sort((a, b) => (b.probability || 0) - (a.probability || 0))
    .slice(0, n);
