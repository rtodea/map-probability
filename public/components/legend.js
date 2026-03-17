/**
 * legend.js — Color scale legend component.
 *
 * Renders a vertical legend showing the heatmap color scale
 * with corresponding probability range labels.
 *
 * Public API:
 *   createLegend(container) — returns legend controller
 *   controller.update(min, max) — re-render with new range
 */

import { legendRanges, NO_DATA_COLOR } from '../core/colors.js';

export const createLegend = (container) => {
  const el = document.createElement('div');
  el.className = 'legend-scale';
  container.appendChild(el);

  const render = (min, max) => {
    const ranges = legendRanges(min, max, 7).reverse(); // high → low

    el.innerHTML = '<div style="font-weight:600;margin-bottom:4px">Birth probability</div>' +
      ranges.map((r) => `
        <div class="legend-item">
          <span class="legend-color" style="background:${r.color}"></span>
          <span>${r.label}</span>
        </div>
      `).join('') +
      `<div class="legend-item" style="margin-top:4px">
        <span class="legend-color" style="background:${NO_DATA_COLOR}"></span>
        <span>No data</span>
      </div>`;
  };

  // Initial render with default range
  render(0, 0.2);

  return {
    update: (min, max) => render(min, max),
  };
};
