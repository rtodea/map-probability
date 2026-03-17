import { runQuery } from './lib/db.js';

const json = (res, status, data) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.statusCode = status;
  res.end(JSON.stringify(data));
};

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const year = url.searchParams.get('year');
  const level = url.searchParams.get('level') || 'country';

  if (level !== 'country' && level !== 'continent') {
    return json(res, 400, { error: 'Level must be "country" or "continent".' });
  }

  try {
    const yearRange = await runQuery(
      'SELECT MIN(year) as min_year, MAX(year) as max_year FROM birth_record'
    );
    const minYear = yearRange.rows[0][0];
    const maxYear = yearRange.rows[0][1];

    const selectedYear = year ? parseInt(year, 10) : maxYear;

    if (Number.isNaN(selectedYear) || selectedYear < minYear || selectedYear > maxYear) {
      return json(res, 400, {
        error: `Invalid year. Must be between ${minYear} and ${maxYear}.`,
      });
    }

    let sql;
    if (level === 'continent') {
      sql = `
        SELECT
          ct.code, ct.name, ct.code as continent,
          SUM(b.births) as births,
          SUM(b.births) * 1.0 / (SELECT SUM(births) FROM birth_record WHERE year = ?) as probability,
          NULL as birth_rate
        FROM birth_record b
        JOIN country c ON b.region_code = c.iso_alpha3
        JOIN continent ct ON c.continent_code = ct.code
        WHERE b.year = ?
        GROUP BY ct.code
        ORDER BY probability DESC
      `;
    } else {
      sql = `
        SELECT
          c.iso_alpha3 as code, c.name, c.continent_code as continent,
          b.births, b.probability, b.birth_rate
        FROM birth_record b
        JOIN country c ON b.region_code = c.iso_alpha3
        WHERE b.year = ?
        ORDER BY b.probability DESC
      `;
    }

    const params = level === 'continent' ? [selectedYear, selectedYear] : [selectedYear];
    const result = await runQuery(sql, params);

    const totalResult = await runQuery(
      'SELECT SUM(births) FROM birth_record WHERE year = ?',
      [selectedYear]
    );

    const regions = result.rows.map((row) => {
      const obj = {};
      result.columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });

    return json(res, 200, {
      year: selectedYear,
      level,
      total_births: totalResult.rows[0][0],
      regions,
    });
  } catch (err) {
    return json(res, 500, { error: err.message });
  }
}
