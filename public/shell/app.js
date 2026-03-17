/**
 * app.js — Main application shell (imperative glue).
 *
 * Initializes all components, wires state, and handles user interactions.
 * This is the only file that performs side effects and DOM mutations.
 */

import { createMapView } from '../components/map-view.js';
import { createTooltip } from '../components/tooltip.js';
import { createLegend } from '../components/legend.js';
import { createTimeSlider } from '../components/time-slider.js';
import { loadBirths, loadYearRange } from './data-loader.js';
import { createState } from './state.js';

const state = createState({
  year: null,
  level: 'country',
  selectedRegion: null,
});

const init = async () => {
  try {
    // Initialize components
    const mapContainer = document.getElementById('map');
    const sliderContainer = document.getElementById('slider-container');
    const legendContainer = document.getElementById('legend-container');
    const resetBtn = document.getElementById('reset-btn');

    const mapView = await createMapView(mapContainer);
    const tooltip = createTooltip(mapContainer);
    const legend = createLegend(legendContainer);
    const slider = createTimeSlider(sliderContainer);

    // Load year range and set up slider
    const yearRange = await loadYearRange();
    const currentYear = yearRange.max_year;
    slider.init(yearRange.min_year, yearRange.max_year, currentYear);
    state.set('year', currentYear);

    // Build country→continent map from initial data
    const continentMap = {};

    const updateMap = async (year) => {
      const data = await loadBirths(year, 'country');
      const regions = data.regions || [];

      // Build continent map from response
      for (const r of regions) {
        if (r.continent) continentMap[r.code] = r.continent;
      }

      mapView.updateData(regions, continentMap);

      // Update legend range
      const maxProb = Math.max(...regions.map((r) => r.probability || 0), 0.01);
      legend.update(0, maxProb);
    };

    // Wire hover → tooltip
    mapView.onRegionHover((data, event) => {
      if (data) {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          tooltip.showAndDismiss(data, event);
        } else {
          tooltip.show(data, event);
        }
      } else {
        tooltip.hide();
      }
    });

    // Wire slider → state → map
    slider.onYearChange((year) => {
      state.set('year', year);
    });

    state.subscribe(async (key, value) => {
      if (key === 'year') {
        await updateMap(value);
      }
    });

    // Wire reset button
    resetBtn.addEventListener('click', () => {
      mapView.resetView();
      slider.setYear(currentYear);
      state.set('year', currentYear);
    });

    // Handle orientation change
    window.addEventListener('resize', () => {
      mapView.getMap().invalidateSize();
    });

    // Initial load
    await updateMap(currentYear);

    console.log('Birth Probability Map initialized');
  } catch (err) {
    console.error('Failed to initialize app:', err);
    document.body.innerHTML = `
      <div style="padding:40px;text-align:center;font-family:sans-serif">
        <h2>Failed to load</h2>
        <p>${err.message}</p>
        <p>Make sure the dev server is running: <code>npm run dev</code></p>
      </div>
    `;
  }
};

init();
