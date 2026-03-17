/**
 * time-slider.js — Year selection slider component.
 *
 * Creates a range input for selecting a year between min and max,
 * displays the current year label, and emits change events.
 *
 * Public API:
 *   createTimeSlider(container) — returns slider controller
 *   controller.init(minYear, maxYear, currentYear) — set up range
 *   controller.onYearChange(callback) — register change listener
 *   controller.setYear(year) — programmatically set the year
 *   controller.getYear() — get current year
 */

export const createTimeSlider = (container) => {
  const label = document.createElement('span');
  label.className = 'year-label';

  const input = document.createElement('input');
  input.type = 'range';
  input.step = '1';

  container.appendChild(input);
  container.appendChild(label);

  let changeCallback = null;
  let debounceTimer = null;

  const emitChange = (year) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (changeCallback) changeCallback(year);
    }, 80);
  };

  input.addEventListener('input', () => {
    const year = parseInt(input.value, 10);
    label.textContent = year;
    emitChange(year);
  });

  return {
    init: (minYear, maxYear, currentYear) => {
      input.min = String(minYear);
      input.max = String(maxYear);
      input.value = String(currentYear);
      label.textContent = currentYear;
    },

    onYearChange: (callback) => {
      changeCallback = callback;
    },

    setYear: (year) => {
      input.value = String(year);
      label.textContent = year;
    },

    getYear: () => parseInt(input.value, 10),
  };
};
