import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  globalTotal,
  probabilityOf,
  withProbabilities,
  percentFormat,
  topN,
} from './probability.js';

describe('globalTotal', () => {
  it('sums births across records', () => {
    const records = [{ births: 100 }, { births: 200 }, { births: 300 }];
    assert.equal(globalTotal(records), 600);
  });

  it('returns 0 for empty array', () => {
    assert.equal(globalTotal([]), 0);
  });

  it('treats missing births as 0', () => {
    const records = [{ births: 100 }, {}, { births: 50 }];
    assert.equal(globalTotal(records), 150);
  });
});

describe('probabilityOf', () => {
  it('computes births / total', () => {
    assert.equal(probabilityOf(25, 100), 0.25);
  });

  it('returns 0 when total is 0', () => {
    assert.equal(probabilityOf(10, 0), 0);
  });
});

describe('withProbabilities', () => {
  it('enriches records with probability field', () => {
    const records = [
      { code: 'A', births: 300 },
      { code: 'B', births: 700 },
    ];
    const result = withProbabilities(records);
    assert.equal(result[0].probability, 0.3);
    assert.equal(result[1].probability, 0.7);
    assert.equal(result[0].code, 'A');
  });

  it('handles empty array', () => {
    assert.deepEqual(withProbabilities([]), []);
  });
});

describe('percentFormat', () => {
  it('formats probability as percentage', () => {
    assert.equal(percentFormat(0.1735), '17.3%');
  });

  it('supports custom decimals', () => {
    assert.equal(percentFormat(0.1735, 2), '17.35%');
  });

  it('formats zero', () => {
    assert.equal(percentFormat(0), '0.0%');
  });
});

describe('topN', () => {
  it('returns top N by probability', () => {
    const records = [
      { code: 'A', probability: 0.1 },
      { code: 'B', probability: 0.5 },
      { code: 'C', probability: 0.3 },
    ];
    const result = topN(records, 2);
    assert.equal(result.length, 2);
    assert.equal(result[0].code, 'B');
    assert.equal(result[1].code, 'C');
  });

  it('does not mutate original array', () => {
    const records = [
      { code: 'A', probability: 0.1 },
      { code: 'B', probability: 0.5 },
    ];
    topN(records, 1);
    assert.equal(records[0].code, 'A');
  });
});
