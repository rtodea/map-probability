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
      <p class="hint">Query the birth probability database using SQL. Press <strong>Ctrl+Enter</strong> or click <strong>Execute</strong> to run.</p>
      <details class="schema-help" open>
        <summary><strong>Tables &amp; Examples</strong></summary>
        <div class="schema-tables">
          <div><code>birth_record</code> — region_code, year, births, probability, birth_rate</div>
          <div><code>country</code> — iso_alpha3, iso_alpha2, name, continent_code</div>
          <div><code>continent</code> — code, name</div>
        </div>
        <div class="examples">
          <button class="example-btn" data-sql="SELECT c.name, b.births, b.probability&#10;FROM birth_record b&#10;JOIN country c ON b.region_code = c.iso_alpha3&#10;WHERE b.year = 2024&#10;ORDER BY b.probability DESC&#10;LIMIT 10">Top 10 countries (2024)</button>
          <button class="example-btn" data-sql="SELECT ct.name, SUM(b.births) as total_births,&#10;  ROUND(SUM(b.births) * 100.0 / (SELECT SUM(births) FROM birth_record WHERE year = 2024), 1) as pct&#10;FROM birth_record b&#10;JOIN country c ON b.region_code = c.iso_alpha3&#10;JOIN continent ct ON c.continent_code = ct.code&#10;WHERE b.year = 2024&#10;GROUP BY ct.code ORDER BY pct DESC">Births by continent (2024)</button>
          <button class="example-btn" data-sql="SELECT b.year, SUM(b.births) as world_births&#10;FROM birth_record b&#10;GROUP BY b.year&#10;ORDER BY b.year">World births by year</button>
          <button class="example-btn" data-sql="SELECT c.name, b.births as births_1950, b2.births as births_2024,&#10;  ROUND((b2.births - b.births) * 100.0 / b.births, 1) as pct_change&#10;FROM birth_record b&#10;JOIN birth_record b2 ON b.region_code = b2.region_code AND b2.year = 2024&#10;JOIN country c ON b.region_code = c.iso_alpha3&#10;WHERE b.year = 1950&#10;ORDER BY pct_change DESC LIMIT 10">Fastest growing (1950 vs 2024)</button>
        </div>
      </details>
      <textarea id="sql-input" rows="5" placeholder="SELECT * FROM birth_record WHERE year = 2020 ORDER BY probability DESC LIMIT 10"></textarea>
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

  // Wire example buttons
  for (const btn of container.querySelectorAll('.example-btn')) {
    btn.addEventListener('click', () => {
      input.value = btn.dataset.sql;
      execute();
    });
  }
};
