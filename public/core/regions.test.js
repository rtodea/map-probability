import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterByYear,
  sortByProbability,
  groupByContinent,
  mergeWithGeo,
  aggregateContinents,
} from './regions.js';

describe('filterByYear', () => {
  const records = [
    { code: 'A', year: 2020, births: 100 },
    { code: 'B', year: 2020, births: 200 },
    { code: 'A', year: 2019, births: 90 },
  ];

  it('returns only records for the given year', () => {
    const result = filterByYear(records, 2020);
    assert.equal(result.length, 2);
    result.forEach((r) => assert.equal(r.year, 2020));
  });

  it('returns empty for non-existent year', () => {
    assert.deepEqual(filterByYear(records, 1900), []);
  });
});

describe('sortByProbability', () => {
  it('sorts descending by probability', () => {
    const records = [
      { code: 'A', probability: 0.1 },
      { code: 'B', probability: 0.5 },
      { code: 'C', probability: 0.3 },
    ];
    const result = sortByProbability(records);
    assert.equal(result[0].code, 'B');
    assert.equal(result[1].code, 'C');
    assert.equal(result[2].code, 'A');
  });

  it('does not mutate the original', () => {
    const records = [{ code: 'A', probability: 0.1 }, { code: 'B', probability: 0.9 }];
    sortByProbability(records);
    assert.equal(records[0].code, 'A');
  });
});

describe('groupByContinent', () => {
  it('groups records by continent code', () => {
    const records = [
      { code: 'IND', continent: 'AS' },
      { code: 'CHN', continent: 'AS' },
      { code: 'NGA', continent: 'AF' },
    ];
    const groups = groupByContinent(records);
    assert.equal(groups['AS'].length, 2);
    assert.equal(groups['AF'].length, 1);
  });
});

describe('mergeWithGeo', () => {
  it('attaches birth data to GeoJSON features', () => {
    const features = [
      { id: 'IND', properties: { name: 'India' } },
      { id: 'USA', properties: { name: 'United States' } },
    ];
    const dataMap = {
      IND: { probability: 0.17, births: 24000000 },
    };
    const result = mergeWithGeo(features, dataMap);
    assert.equal(result[0].properties.probability, 0.17);
    assert.equal(result[0].properties.births, 24000000);
    assert.equal(result[1].properties.probability, null);
  });
});

describe('aggregateContinents', () => {
  it('sums births per continent and computes probability', () => {
    const records = [
      { code: 'IND', births: 300 },
      { code: 'CHN', births: 200 },
      { code: 'NGA', births: 500 },
    ];
    const continentMap = { IND: 'AS', CHN: 'AS', NGA: 'AF' };
    const result = aggregateContinents(records, continentMap);

    const asia = result.find((c) => c.code === 'AS');
    const africa = result.find((c) => c.code === 'AF');
    assert.equal(asia.births, 500);
    assert.equal(africa.births, 500);
    assert.equal(asia.probability, 0.5);
  });
});
