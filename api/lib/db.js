/**
 * db.js — Shared database loader for API routes.
 *
 * Initializes sql.js (WASM SQLite), loads data/births.db,
 * and exports a query helper. Used by all /api/* handlers.
 *
 * Public API:
 *   getDb(dbPath)       — returns initialized SQL.Database instance
 *   query(db, sql, params) — execute SQL, return { columns, rows }
 */

import initSqlJs from 'sql.js';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DEFAULT_DB_PATH = join(__dirname, '..', '..', 'data', 'births.db');

// Locate sql-wasm.wasm via require.resolve so it works on both
// local dev and Vercel serverless (where node_modules layout differs).
const require = createRequire(import.meta.url);
const WASM_PATH = join(dirname(require.resolve('sql.js')), 'sql-wasm.wasm');

let cachedDb = null;

/** Load and return a sql.js Database instance. */
export const getDb = async (dbPath = DEFAULT_DB_PATH) => {
  if (cachedDb) return cachedDb;

  const wasmBinary = await readFile(WASM_PATH);
  const SQL = await initSqlJs({ wasmBinary });
  const buffer = await readFile(dbPath);
  cachedDb = new SQL.Database(buffer);
  return cachedDb;
};

/** Execute a SQL query and return structured results. */
export const query = (db, sql, params = []) => {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);

  const columns = stmt.getColumnNames();
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.get());
  }
  stmt.free();

  return { columns, rows, row_count: rows.length };
};

/** Convenience: get db + run query in one call. */
export const runQuery = async (sql, params = [], dbPath) => {
  const db = await getDb(dbPath);
  return query(db, sql, params);
};
