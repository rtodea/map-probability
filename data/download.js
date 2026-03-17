import { runQuery } from '../api/lib/db.js';

export default async function handler(_req, res, { url }) {
  const year = url.searchParams.get('year');
  const level = url.searchParams.get('level') || 'country';

  try {
    let sql;
    let params = [];

    if (level === 'continent') {
      sql = `
        SELECT ct.code as region_code, ct.name as region_name, ct.code as continent,
               b.year, SUM(b.births) as births,
               SUM(b.births) * 1.0 / (SELECT SUM(births) FROM birth_record WHERE year = b.year) as probability,
               NULL as birth_rate
        FROM birth_record b
        JOIN country c ON b.region_code = c.iso_alpha3
        JOIN continent ct ON c.continent_code = ct.code
        ${year ? 'WHERE b.year = ?' : ''}
        GROUP BY ct.code, b.year
        ORDER BY b.year, probability DESC
      `;
      if (year) params.push(parseInt(year, 10));
    } else {
      sql = `
        SELECT c.iso_alpha3 as region_code, c.name as region_name,
               c.continent_code as continent, b.year, b.births,
               b.probability, b.birth_rate
        FROM birth_record b
        JOIN country c ON b.region_code = c.iso_alpha3
        ${year ? 'WHERE b.year = ?' : ''}
        ORDER BY b.year, b.probability DESC
      `;
      if (year) params.push(parseInt(year, 10));
    }

    const result = await runQuery(sql, params);

    // Build CSV
    const header = result.columns.join(',');
    const rows = result.rows.map((row) => row.join(',')).join('\n');
    const csv = `${header}\n${rows}`;

    const filename = year
      ? `births-${year}-${level}.csv`
      : `births-all-${level}.csv`;

    res.writeHead(200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=86400',
    });
    res.end(csv);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
