/**
 * sql-console.js — Interactive SQL query UI component.
 *
 * Provides a textarea for SQL input, execute button,
 * and results table. Queries the /api/query endpoint.
 *
 * Public API:
 *   createSqlConsole(container) — mounts the console UI
 */

import { resultToTable, isSelectOnly } from '../core/query.js';

export const createSqlConsole = (container) => {
  container.innerHTML = `
    <div class="sql-console">
      <h2>Data Console</h2>
      <p class="hint">Query the birth probability database using SQL.
        Available tables: <code>country</code>, <code>continent</code>, <code>birth_record</code>.
        Views: <code>country_births</code>, <code>continent_births</code>.</p>
      <textarea id="sql-input" rows="4" placeholder="SELECT * FROM country_births WHERE year = 2020 ORDER BY probability DESC LIMIT 10"></textarea>
      <div class="console-actions">
        <button id="sql-run">Execute</button>
        <span id="sql-status"></span>
      </div>
      <div id="sql-results"></div>
    </div>
  `;

  const input = container.querySelector('#sql-input');
  const runBtn = container.querySelector('#sql-run');
  const status = container.querySelector('#sql-status');
  const results = container.querySelector('#sql-results');

  const execute = async () => {
    const sql = input.value.trim();
    if (!sql) return;

    if (!isSelectOnly(sql)) {
      status.textContent = 'Error: Only SELECT statements are allowed.';
      results.innerHTML = '';
      return;
    }

    status.textContent = 'Running...';
    results.innerHTML = '';

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      });

      const data = await res.json();

      if (!res.ok) {
        status.textContent = `Error: ${data.error}`;
        return;
      }

      status.textContent = `${data.row_count} rows in ${data.duration_ms}ms`;
      results.innerHTML = resultToTable(data.columns, data.rows);
    } catch (err) {
      status.textContent = `Error: ${err.message}`;
    }
  };

  runBtn.addEventListener('click', execute);
  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') execute();
  });
};
