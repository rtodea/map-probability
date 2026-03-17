import { runQuery } from './lib/db.js';

export default async function handler(_req, res) {
  try {
    const result = await runQuery(
      'SELECT MIN(year) as min_year, MAX(year) as max_year, COUNT(DISTINCT year) as count FROM birth_record'
    );

    const [minYear, maxYear, count] = result.rows[0];

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    });
    res.end(JSON.stringify({ min_year: minYear, max_year: maxYear, count }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
