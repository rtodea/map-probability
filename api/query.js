import { getDb, query } from './lib/db.js';

const FORBIDDEN_PREFIXES = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'PRAGMA',
  'ATTACH', 'DETACH', 'REINDEX', 'VACUUM',
];

const json = (res, status, data) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  res.statusCode = status;
  res.end(JSON.stringify(data));
};

const readBody = (req) =>
  new Promise((resolve) => {
    // Vercel may pre-parse the body
    if (req.body !== undefined) return resolve(JSON.stringify(req.body));
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
  });

export default async function handler(req, res) {
  const raw = await readBody(req);

  if (!raw) {
    return json(res, 400, { error: 'Request body is required.' });
  }

  let sql;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    sql = parsed.sql;
  } catch {
    return json(res, 400, { error: 'Invalid JSON body.' });
  }

  if (!sql || typeof sql !== 'string') {
    return json(res, 400, { error: 'Missing "sql" field in request body.' });
  }

  const trimmed = sql.trim().toUpperCase();
  const isForbidden = FORBIDDEN_PREFIXES.some((prefix) =>
    trimmed.startsWith(prefix)
  );

  if (isForbidden) {
    return json(res, 400, { error: 'Only SELECT statements are allowed.' });
  }

  try {
    const db = await getDb();
    const start = performance.now();
    const result = query(db, sql);
    const duration_ms = Math.round(performance.now() - start);

    return json(res, 200, {
      columns: result.columns,
      rows: result.rows,
      row_count: result.row_count,
      duration_ms,
    });
  } catch (err) {
    return json(res, 400, { error: err.message });
  }
}
