/**
 * map-view.js — Leaflet map component with choropleth layer.
 *
 * Initializes a Leaflet slippy map, loads TopoJSON world boundaries,
 * and renders a choropleth layer colored by birth probability.
 * Supports zoom-based granularity switching (continent ↔ country).
 *
 * Public API:
 *   createMapView(container) — initialize map, returns controller
 *   controller.updateData(regions, level) — re-color the map
 *   controller.onRegionHover(callback) — register hover listener
 *   controller.resetView() — return to default position
 */

import L from 'leaflet';
import * as topojson from 'topojson-client';
import { colorForValue, NO_DATA_COLOR } from '../core/colors.js';
import { mergeWithGeo, aggregateContinents } from '../core/regions.js';
import { numericToAlpha3 } from '../core/iso-codes.js';

const TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 2;
const CONTINENT_ZOOM_THRESHOLD = 4;

export const createMapView = async (container) => {
  const map = L.map(container, {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    minZoom: 2,
    maxZoom: 8,
    worldCopyJump: true,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  // Load world TopoJSON
  const response = await fetch(TOPO_URL);
  const worldTopo = await response.json();
  const allCountries = topojson.feature(worldTopo, worldTopo.objects.countries);
  // Filter out Antarctica (numeric ID 10) — it has no birth data and renders as horizontal bands
  const countriesGeo = {
    ...allCountries,
    features: allCountries.features.filter((f) => String(f.id) !== '10'),
  };

  // Build continent geometries by merging countries
  // We'll need the country→continent map from the data
  // continent features built dynamically in updateData

  let countryLayer = null;
  let continentLayer = null;
  let currentData = null;
  let currentLevel = 'country';
  let hoverCallback = null;
  let continentMap = {}; // code → continent code

  const styleFeature = (feature) => {
    const prob = feature.properties?.probability;
    const maxProb = currentData?.maxProbability || 0.2;
    return {
      fillColor: prob !== null && prob !== undefined ? colorForValue(prob, 0, maxProb) : NO_DATA_COLOR,
      weight: 1,
      opacity: 0.7,
      color: '#ffffff',
      fillOpacity: 0.8,
    };
  };

  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: (e) => {
        e.target.setStyle({ weight: 2, color: '#333' });
        e.target.bringToFront();
        if (hoverCallback) {
          hoverCallback({
            name: feature.properties.name || feature.properties.code || 'Unknown',
            probability: feature.properties.probability,
            births: feature.properties.births,
            code: feature.properties.code,
          }, e);
        }
      },
      mouseout: (e) => {
        const activeLayer = currentLevel === 'continent' ? continentLayer : countryLayer;
        if (activeLayer) activeLayer.resetStyle(e.target);
        if (hoverCallback) hoverCallback(null, e);
      },
      click: (e) => {
        if (hoverCallback) {
          hoverCallback({
            name: feature.properties.name || feature.properties.code || 'Unknown',
            probability: feature.properties.probability,
            births: feature.properties.births,
            code: feature.properties.code,
          }, e);
        }
      },
    });
  };

  const renderLayer = (features, dataMap) => {
    const maxProb = Math.max(...Object.values(dataMap).map((d) => d.probability || 0), 0.01);
    currentData = { maxProbability: maxProb };

    const enriched = mergeWithGeo(features, dataMap, numericToAlpha3);

    const geoLayer = L.geoJSON({ type: 'FeatureCollection', features: enriched }, {
      style: styleFeature,
      onEachFeature,
    });

    return geoLayer;
  };

  const updateVisibleLayer = () => {
    const zoom = map.getZoom();
    const shouldShowContinents = zoom < CONTINENT_ZOOM_THRESHOLD;

    if (shouldShowContinents && currentLevel !== 'continent' && continentLayer) {
      if (countryLayer) map.removeLayer(countryLayer);
      continentLayer.addTo(map);
      currentLevel = 'continent';
    } else if (!shouldShowContinents && currentLevel !== 'country' && countryLayer) {
      if (continentLayer) map.removeLayer(continentLayer);
      countryLayer.addTo(map);
      currentLevel = 'country';
    }
  };

  map.on('zoomend', updateVisibleLayer);

  return {
    updateData: (regions, cMap = {}) => {
      continentMap = cMap;

      // Build country data map
      const countryDataMap = {};
      for (const r of regions) {
        countryDataMap[r.code] = r;
      }

      // Remove old layers
      if (countryLayer) map.removeLayer(countryLayer);
      if (continentLayer) map.removeLayer(continentLayer);

      // Country layer
      countryLayer = renderLayer(countriesGeo.features, countryDataMap);

      // Continent layer — color individual country features by their continent's probability
      const continentData = aggregateContinents(regions, continentMap);
      const continentDataMap = {};
      for (const c of continentData) {
        continentDataMap[c.code] = c;
      }

      // Build a per-country map that carries continent-level data
      const countryContinentDataMap = {};
      for (const feat of countriesGeo.features) {
        const rawId = String(feat.id).padStart(3, '0');
        const code = feat.properties?.iso_a3 || numericToAlpha3.get(rawId) || feat.id;
        const cont = continentMap[code] || 'UNKNOWN';
        const cData = continentDataMap[cont];
        if (cData) {
          countryContinentDataMap[code] = { ...cData, code };
        }
      }

      continentLayer = renderLayer(countriesGeo.features, countryContinentDataMap);

      // Show appropriate layer
      currentLevel = map.getZoom() < CONTINENT_ZOOM_THRESHOLD ? 'continent' : 'country';
      if (currentLevel === 'continent') {
        continentLayer.addTo(map);
      } else {
        countryLayer.addTo(map);
      }
    },

    onRegionHover: (callback) => {
      hoverCallback = callback;
    },

    resetView: () => {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    },

    getMap: () => map,
  };
};
