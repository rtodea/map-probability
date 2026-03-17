/**
 * data-loader.js — Imperative shell module for fetching data from API.
 *
 * Handles all fetch calls to /api/* endpoints.
 * Caches responses by (year, level) to avoid redundant requests.
 *
 * Public API:
 *   loadBirths(year, level) — fetch birth data for a year+level
 *   loadYearRange()         — fetch min/max available years
 *   clearCache()            — clear the response cache
 */

const cache = new Map();

const cacheKey = (year, level) => `${year}:${level}`;

/** Fetch birth data for a given year and level. */
export const loadBirths = async (year, level = 'country') => {
  const key = cacheKey(year, level);
  if (cache.has(key)) return cache.get(key);

  const params = new URLSearchParams({ year, level });
  const res = await fetch(`/api/births?${params}`);
  if (!res.ok) throw new Error(`Failed to load births: ${res.status}`);

  const data = await res.json();
  cache.set(key, data);
  return data;
};

/** Fetch the available year range from the API. */
export const loadYearRange = async () => {
  if (cache.has('yearRange')) return cache.get('yearRange');

  const res = await fetch('/api/years');
  if (!res.ok) throw new Error(`Failed to load year range: ${res.status}`);

  const data = await res.json();
  cache.set('yearRange', data);
  return data;
};

/** Clear all cached responses. */
export const clearCache = () => cache.clear();
