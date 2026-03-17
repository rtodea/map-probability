/**
 * tooltip.js — Region info tooltip component.
 *
 * Shows region name, birth probability %, and birth count
 * on hover (desktop) or tap (mobile). Pure DOM component.
 *
 * Public API:
 *   createTooltip(container) — returns tooltip controller
 *   controller.show(data, event) — display tooltip near cursor
 *   controller.hide() — hide tooltip
 */

import { percentFormat } from '../core/probability.js';

const formatBirths = (n) => {
  if (n == null) return 'N/A';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

export const createTooltip = (container) => {
  const el = document.createElement('div');
  el.className = 'tooltip-content';
  el.style.cssText = `
    position: absolute;
    display: none;
    pointer-events: none;
    background: rgba(255,255,255,0.95);
    padding: 8px 12px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    z-index: 2000;
    max-width: 220px;
    font-size: 13px;
    line-height: 1.4;
  `;
  container.appendChild(el);

  let dismissTimeout = null;

  return {
    show: (data, event) => {
      if (!data) return;
      clearTimeout(dismissTimeout);

      const prob = data.probability != null
        ? percentFormat(data.probability)
        : 'No data';
      const births = formatBirths(data.births);

      el.innerHTML = `
        <div class="name">${data.name}</div>
        <div class="stat">Probability: <strong>${prob}</strong></div>
        <div class="stat">Births: <strong>${births}</strong></div>
      `;

      // Position near event
      const mapRect = container.getBoundingClientRect();
      let x = (event?.originalEvent?.clientX || event?.clientX || 0) - mapRect.left + 12;
      let y = (event?.originalEvent?.clientY || event?.clientY || 0) - mapRect.top - 10;

      // Keep within viewport
      const elRect = el.getBoundingClientRect();
      if (x + 220 > mapRect.width) x = x - 240;
      if (y + 80 > mapRect.height) y = y - 80;
      if (x < 0) x = 8;
      if (y < 0) y = 8;

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.display = 'block';
    },

    hide: () => {
      dismissTimeout = setTimeout(() => {
        el.style.display = 'none';
      }, 100);
    },

    /** Show tooltip and auto-dismiss after delay (for mobile taps). */
    showAndDismiss: (data, event, delayMs = 3000) => {
      if (!data) {
        el.style.display = 'none';
        return;
      }
      // Reuse show logic
      const prob = data.probability != null
        ? percentFormat(data.probability)
        : 'No data';
      const births = formatBirths(data.births);

      el.innerHTML = `
        <div class="name">${data.name}</div>
        <div class="stat">Probability: <strong>${prob}</strong></div>
        <div class="stat">Births: <strong>${births}</strong></div>
      `;
      el.style.left = '50%';
      el.style.top = '12px';
      el.style.transform = 'translateX(-50%)';
      el.style.display = 'block';
      el.style.pointerEvents = 'auto';

      clearTimeout(dismissTimeout);
      dismissTimeout = setTimeout(() => {
        el.style.display = 'none';
        el.style.pointerEvents = 'none';
        el.style.transform = '';
      }, delayMs);
    },
  };
};
