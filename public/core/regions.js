/**
 * regions.js — Pure functions for region data transformations.
 *
 * Transforms birth data records and GeoJSON features for map rendering.
 * All functions are pure.
 *
 * Public API:
 *   filterByYear(records, year)       — filter records to a single year
 *   sortByProbability(records)        — sort descending by probability
 *   groupByContinent(records)         — group into { continent: [...] }
 *   mergeWithGeo(features, dataMap)   — attach birth data to GeoJSON features
 *   aggregateContinents(records, continentMap) — sum births per continent
 */

/** Filter records to a single year. */
export const filterByYear = (records, year) =>
  records.filter((r) => r.year === year);

/** Sort records by probability descending. */
export const sortByProbability = (records) =>
  [...records].sort((a, b) => (b.probability || 0) - (a.probability || 0));

/**
 * Group records by continent code.
 * Returns { "AS": [...], "AF": [...], ... }
 */
export const groupByContinent = (records) =>
  records.reduce((groups, record) => {
    const key = record.continent || record.continent_code || 'UNKNOWN';
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
    return groups;
  }, {});

/**
 * Merge birth data into GeoJSON features.
 * dataMap: { countryCode: { probability, births, ... } }
 * Returns new features array with .properties enriched.
 */
export const mergeWithGeo = (features, dataMap) =>
  features.map((feature) => {
    const code = feature.properties?.iso_a3 || feature.id;
    const data = dataMap[code] || null;
    return {
      ...feature,
      properties: {
        ...feature.properties,
        code,
        ...(data || { probability: null, births: null }),
      },
    };
  });

/**
 * Aggregate country records into continent-level summaries.
 * continentMap: { countryCode: continentCode }
 * Returns array of { code, name, births, probability }.
 */
export const aggregateContinents = (records, continentMap) => {
  const totals = {};
  let globalBirths = 0;

  for (const r of records) {
    const continent = continentMap[r.code] || r.continent || 'UNKNOWN';
    if (!totals[continent]) totals[continent] = { code: continent, births: 0 };
    totals[continent].births += r.births || 0;
    globalBirths += r.births || 0;
  }

  return Object.values(totals).map((c) => ({
    ...c,
    probability: globalBirths === 0 ? 0 : c.births / globalBirths,
  }));
};
