# Research: Birth Probability Map

**Date**: 2026-03-17
**Feature**: 001-birth-probability-map

## R1: No-Build-Step Dependency Management

**Decision**: Use browser-native import maps with jsdelivr CDN

**Rationale**: Import maps (`<script type="importmap">`) are Baseline
Widely Available since March 2023 (Chrome 89+, Firefox 108+,
Safari 16.4+). They allow bare specifier imports (`import R from "ramda"`)
mapped to CDN URLs — no bundler, no npm install for the frontend.

**Alternatives considered**:
- esm.sh: Excellent auto-transpiling but less established CDN backbone.
  Used as fallback.
- unpkg.com: Good but slower edge network than jsdelivr.
- Skypack: Transitioning to archived mode — avoided.
- npm + bundler (Vite/esbuild): User explicitly rejected build steps.

**Implementation pattern**:
```html
<script type="importmap">
{
  "imports": {
    "ramda": "https://cdn.jsdelivr.net/npm/ramda@0.30.1/dist/ramda.esm.mjs",
    "leaflet": "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet-src.esm.js",
    "topojson-client": "https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/+esm"
  }
}
</script>
```

**Constraint**: Import map MUST be declared before any `<script type="module">`.

---

## R2: SQLite on Vercel

**Decision**: Use sql.js (WASM-based SQLite) for both server and client

**Rationale**: better-sqlite3 is a native C++ addon that cannot compile
in Vercel's Lambda environment. sql.js is pure JavaScript/WASM and runs
anywhere — Node.js serverless functions, Edge Runtime, and the browser.

**Architecture implications**:
- The SQLite `.db` file is versioned in the repo and bundled with
  the Vercel deployment.
- Server-side: Vercel API routes load the `.db` file read-only via
  sql.js. The file is available at deploy time as a static asset.
- Client-side `/data/console`: sql.js loads the same database via
  fetch, enabling in-browser SQL queries.
- CSV export (`/data/download`): Server-side API route queries the
  database and streams CSV.

**Alternatives considered**:
- better-sqlite3: Does not work on Vercel (native addon).
- Turso/D1: External hosted SQLite — adds infrastructure dependency,
  user wants data versioned in repo.
- PostgreSQL: Overkill for read-only reference data.
- Static JSON files: Cannot support SQL console feature.

**Data update workflow**:
1. Run a local Node.js script to fetch latest data from sources.
2. Script writes to `data/births.db` (SQLite file in repo).
3. Commit and push — Vercel deploys with updated data.

---

## R3: Birth Rate Data Sources

**Decision**: UN World Population Prospects (WPP) as primary source

**Rationale**: Most authoritative source for country-level annual birth
estimates. Covers all UN member states from 1950 to present. Provides
absolute birth counts (not just rates).

**Primary source — UN WPP**:
- URL: https://population.un.org/wpp/
- Format: CSV download
- Fields: Country code (M49), country name, year, births (thousands)
- Coverage: 1950–2024 (with 2024 revision)
- Strengths: Official, comprehensive, annual granularity

**Secondary source — Our World in Data (OWID)**:
- URL: https://github.com/owid/datasets/
- Format: CSV via GitHub
- Used for: Gap-filling and cross-validation

**Country-to-continent mapping**:
- UN M49 standard (https://unstats.un.org/unsd/methodology/m49/)
- Also available in Natural Earth country data

**Data ingestion**:
- Local Node.js script downloads CSV, transforms, loads into SQLite
- Schema normalizes M49 codes to ISO 3166-1 alpha-3

---

## R4: Map Boundary Data

**Decision**: TopoJSON from world-atlas package via CDN

**Rationale**: TopoJSON is 3–5x smaller than equivalent GeoJSON.
The world-atlas `countries-110m.json` is ~150KB — well under the 1MB
target. Converted to GeoJSON client-side using topojson-client.

**File sizes**:
| Resolution | Format    | Size       |
|------------|-----------|------------|
| 110m       | TopoJSON  | ~150 KB    |
| 50m        | TopoJSON  | ~250 KB    |
| 110m       | GeoJSON   | ~300 KB    |
| 50m        | GeoJSON   | ~700 KB    |

**CDN URLs**:
- Countries: `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json`
- Higher detail: `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json`

**Continent boundaries**: Derived by merging country geometries per
continent using topojson-client's `merge` function. No separate file
needed.

**Alternatives considered**:
- Natural Earth GeoJSON (50m): 700KB — heavier but more detail.
- GitHub geo-countries: 1.5MB — too large for CDN load.
- Pre-built continent GeoJSON: Not widely available at quality we need.

---

## R5: Functional Programming Library

**Decision**: Ramda.js via CDN ESM import

**Rationale**: User specifically requested Ramda or equivalent. Ramda
provides immutable, auto-curried, data-last functions that align with
the "functional core, imperative shell" constitution principle.

**CDN URL**: `https://cdn.jsdelivr.net/npm/ramda@0.30.1/dist/ramda.esm.mjs`

**Usage pattern**: Pure data transformation functions (probability
calculation, color mapping, data filtering) written with Ramda
composition. DOM/map mutations isolated to thin imperative shell.

---

## R6: Slippy Map Library

**Decision**: Leaflet.js via CDN ESM import

**Rationale**: Lightweight (~40KB gzipped), well-documented, ESM-
compatible, and the de facto standard for slippy maps. Supports
choropleth layers, tooltips, zoom events, and touch gestures natively.

**CDN URLs**:
- JS: `https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet-src.esm.js`
- CSS: `https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css`

**Tile provider**: OpenStreetMap tiles (free, no API key).

---

## R7: Server Architecture

**Decision**: Node.js with native ES modules + Vercel API routes

**Rationale**: User wants client/server split for SQL console and CSV
download. Vercel's `/api` directory convention supports serverless
functions with Node.js runtime. Using `"type": "module"` in
package.json enables native ES modules server-side — no build step.

**Routes**:
- `GET /` — serves the main HTML page (static)
- `GET /api/births?year=2020&level=country` — returns JSON birth data
- `GET /data/download?year=2020&format=csv` — streams CSV export
- `GET /data/console` — serves the SQL console UI page
- `POST /api/query` — executes read-only SQL and returns JSON results

**Local development**: Plain Node.js HTTP server (no framework).
Vercel CLI (`vercel dev`) for local preview-deploy parity.

---

## R8: Constitution Deviations

Three constitution principles conflict with user requirements:

| Constitution Rule | User Requirement | Resolution |
|-------------------|-----------------|------------|
| TypeScript strict mode | Plain JavaScript (latest) | Override: user explicitly chose JS for simplicity and no-build-step alignment |
| npm install + build step | CDN imports, no build | Override: import maps + CDN achieve same goal (reproducible deps) without build tooling |
| Vercel-compatible framework (Next.js etc.) | Minimal/no framework | Override: Vercel API routes work without a framework; static files + serverless functions suffice |

These are tracked in the plan's Complexity Tracking section.
