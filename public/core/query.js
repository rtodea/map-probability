/**
 * query.js — Pure functions for SQL query helpers.
 *
 * Public API:
 *   isSelectOnly(sql) — returns true if SQL is a SELECT statement
 *   resultToTable(columns, rows) — transform query result to HTML table string
 */

const FORBIDDEN_PREFIXES = [
  'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE',
  'PRAGMA', 'ATTACH', 'DETACH', 'REINDEX', 'VACUUM',
];

/** Check if a SQL string is a read-only SELECT statement. */
export const isSelectOnly = (sql) => {
  const trimmed = (sql || '').trim().toUpperCase();
  return !FORBIDDEN_PREFIXES.some((p) => trimmed.startsWith(p));
};

/** Convert query result columns+rows to an HTML table string. */
export const resultToTable = (columns, rows) => {
  if (!columns || columns.length === 0) return '<p>No results</p>';

  const header = columns.map((c) => `<th>${esc(c)}</th>`).join('');
  const body = rows
    .map((row) =>
      '<tr>' + row.map((cell) => `<td>${esc(String(cell ?? 'NULL'))}</td>`).join('') + '</tr>'
    )
    .join('');

  return `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
