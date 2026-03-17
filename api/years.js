import { runQuery } from './lib/db.js';

export default async function handler(req, res) {
  try {
    const result = await runQuery(
      'SELECT MIN(year) as min_year, MAX(year) as max_year, COUNT(DISTINCT year) as count FROM birth_record'
    );

    const [minYear, maxYear, count] = result.rows[0];

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.statusCode = 200;
    res.end(JSON.stringify({ min_year: minYear, max_year: maxYear, count }));
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  }
}
