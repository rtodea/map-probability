# Tasks: Birth Probability Map

**Input**: Design documents from `/specs/001-birth-probability-map/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Constitution mandates TDD (Principle II). Test tasks are included and MUST be written before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create project structure, configuration, and dev tooling

- [ ] T001 Initialize package.json with `"type": "module"`, name `map-probability`, and scripts (`dev`, `test`, `lint`, `ingest`) in package.json
- [ ] T002 Install server-side dependencies: sql.js in package.json
- [ ] T003 [P] Create vercel.json with routes for `/api/*`, `/data/download`, `/data/console` rewrites, and static `public/` serving in vercel.json
- [ ] T004 [P] Create public/index.html with import map declaring CDN URLs for ramda, leaflet, topojson-client, and sql.js; include Leaflet CSS; add `<div id="map">` and `<script type="module" src="./shell/app.js">` in public/index.html
- [ ] T005 [P] Create public/styles/main.css with full-viewport map layout, responsive breakpoints (375px–2560px), and CSS custom properties for heatmap colors in public/styles/main.css
- [ ] T006 [P] Create local development server that serves public/ as static files and routes /api/* and /data/* to handler modules in server.js
- [ ] T007 [P] Create ESLint config for ES2024+ with module rules (no build, no TS) in eslint.config.js

**Checkpoint**: `npm install && npm run dev` serves an empty page with import map loaded

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Data pipeline, SQLite database, core pure functions, and API endpoints that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Write test for data ingestion script: verify CSV parsing, M49-to-ISO normalization, probability computation, and SQLite output in scripts/ingest.test.js
- [ ] T009 Implement data ingestion script: download UN WPP CSV, parse country metadata + birth records, compute probabilities, write to data/births.db using sql.js in scripts/ingest.js
- [ ] T010 Run ingest script to produce initial data/births.db and commit the database file in data/births.db
- [ ] T011 [P] Write tests for probability calculation pure functions: probability from births, percentage formatting, global total computation in public/core/probability.test.js
- [ ] T012 [P] Write tests for color scale pure functions: value-to-hex mapping, scale generation, legend range computation in public/core/colors.test.js
- [ ] T013 [P] Write tests for region data transform functions: group by continent, filter by year, sort by probability, merge with geo data in public/core/regions.test.js
- [ ] T014 [P] Implement probability calculation pure functions using Ramda: `probabilityOf`, `percentFormat`, `globalTotal`, `withProbabilities` in public/core/probability.js
- [ ] T015 [P] Implement heatmap color scale pure functions using Ramda: `colorForValue` (sequential blue→red), `scaleSteps`, `legendRanges` in public/core/colors.js
- [ ] T016 [P] Implement region data transform functions using Ramda: `groupByContinent`, `filterByYear`, `sortByProbability`, `mergeWithGeo` in public/core/regions.js
- [ ] T017 [P] Write test for shared db-loader module: verify sql.js initialization, .db file loading, and query execution in api/lib/db.test.js
- [ ] T018 [P] Implement shared db-loader module: initialize sql.js, load data/births.db, export `query(sql, params)` helper in api/lib/db.js
- [ ] T019 Write test for GET /api/births endpoint: verify JSON response shape, year/level query params, default to latest year, 400 on invalid year in api/births.test.js
- [ ] T020 Implement GET /api/births endpoint: query birth_record via db-loader, return JSON per contract in api/births.js
- [ ] T021 [P] Write test for GET /api/years endpoint: verify min_year, max_year, count response in api/years.test.js
- [ ] T022 [P] Implement GET /api/years endpoint: query min/max year from birth_record in api/years.js
- [ ] T023 Implement data-loader shell module: fetch /api/births and /api/years, cache responses by year, expose `loadBirths(year, level)` and `loadYearRange()` in public/shell/data-loader.js
- [ ] T024 Implement application state container: hold current year, zoom level, granularity, selected region; expose subscribe/update pattern in public/shell/state.js

**Checkpoint**: Foundation ready — `npm test` passes, API endpoints return real data, core pure functions tested

---

## Phase 3: User Story 1 — View Current Birth Probability Heatmap (Priority: P1) MVP

**Goal**: Visitor sees an interactive world map color-coded by current birth probability with country/continent granularity switching and tooltips

**Independent Test**: Load the app → map renders with colored countries → hover shows tooltip → zoom out switches to continent view

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T025 [P] [US1] Write test for map-view component: verify Leaflet map initialization, choropleth layer creation from GeoJSON + probability data, style function applying correct colors in public/components/map-view.test.js
- [ ] T026 [P] [US1] Write test for tooltip component: verify tooltip content (name, probability %, births count), positioning, show/hide behavior in public/components/tooltip.test.js
- [ ] T027 [P] [US1] Write test for legend component: verify color scale rendering, label ranges, DOM structure in public/components/legend.test.js
- [ ] T028 [P] [US1] Write test for region data merging: verify TopoJSON → GeoJSON conversion, country-code matching with birth data, continent aggregation via merge in public/core/regions.test.js (extend T013)

### Implementation for User Story 1

- [ ] T029 [US1] Implement map-view component: initialize Leaflet map, load TopoJSON from CDN, convert to GeoJSON via topojson-client, render choropleth layer with `colorForValue` styling; expose `updateData(regions)` and `onRegionHover(callback)` in public/components/map-view.js
- [ ] T030 [US1] Implement tooltip component: create positioned overlay, render region name + probability % + birth count, show on hover/tap, hide on mouse leave in public/components/tooltip.js
- [ ] T031 [US1] Implement legend component: render vertical color scale with probability range labels using `legendRanges` from core/colors.js in public/components/legend.js
- [ ] T032 [US1] Implement zoom-level granularity switching in map-view: listen to Leaflet `zoomend` event, switch between continent (merged geometries) and country layers based on zoom threshold in public/components/map-view.js
- [ ] T033 [US1] Implement app shell wiring: on load, fetch current year data via data-loader, initialize map-view + tooltip + legend, wire state updates in public/shell/app.js
- [ ] T034 [US1] Add "Reset view" button: return map to default zoom + current year on click in public/shell/app.js

**Checkpoint**: User Story 1 fully functional — map shows current heatmap, tooltips work, continent/country switching works

---

## Phase 4: User Story 2 — Explore Historical Birth Probability (Priority: P2)

**Goal**: Visitor uses a time slider to explore birth probability across decades (1950–present)

**Independent Test**: Drag slider to 1980 → map colors update → tooltip shows 1980 data → slider shows year label

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T035 [P] [US2] Write test for time-slider component: verify range input (min/max from year range), year label display, change event emission, debounced updates in public/components/time-slider.test.js
- [ ] T036 [P] [US2] Write test for state transitions: verify year change triggers data reload and map update in public/shell/state.test.js

### Implementation for User Story 2

- [ ] T037 [US2] Implement time-slider component: create range input, fetch year range from /api/years, display current year label, emit `yearChange` events with debounce in public/components/time-slider.js
- [ ] T038 [US2] Wire time-slider into app shell: on yearChange, update state, fetch data for new year via data-loader, call map-view.updateData() in public/shell/app.js
- [ ] T039 [US2] Add smooth map color transitions: use CSS transition on choropleth fill-opacity or interpolate between color states during slider scrub in public/components/map-view.js
- [ ] T040 [US2] Update tooltip to reflect selected year data: bind tooltip content to current state year in public/components/tooltip.js
- [ ] T041 [US2] Update "Reset view" button to also reset year to current in public/shell/app.js

**Checkpoint**: User Stories 1 AND 2 both work — slider changes year, map updates smoothly, tooltips reflect selected year

---

## Phase 5: User Story 3 — Mobile-Friendly Exploration (Priority: P3)

**Goal**: Touch gestures work, layout adapts to small screens, all elements meet minimum touch targets

**Independent Test**: Open at 375px width → map fills viewport → pinch zoom works → tap tooltip is readable → rotation works

### Tests for User Story 3

- [ ] T042 [P] [US3] Write test for responsive layout: verify CSS breakpoints, slider repositioning at narrow widths, touch target sizes (≥44px), no overflow in public/styles/main.test.js

### Implementation for User Story 3

- [ ] T043 [US3] Add responsive CSS for mobile: reposition time-slider below map at ≤768px, enlarge touch targets to 44px minimum, constrain tooltip width to viewport in public/styles/main.css
- [ ] T044 [US3] Implement touch-friendly tooltip: tap to open, tap elsewhere to dismiss, prevent tooltip from extending off-screen on narrow viewports in public/components/tooltip.js
- [ ] T045 [US3] Verify Leaflet touch interactions: ensure pinch-to-zoom, swipe-to-pan, and tap work correctly; disable browser zoom on double-tap if conflicting in public/components/map-view.js
- [ ] T046 [US3] Handle orientation change: listen for `resize` / `orientationchange`, invalidate Leaflet map size, reflow slider position in public/shell/app.js

**Checkpoint**: All user stories independently functional on desktop and mobile

---

## Phase 6: Data Console & CSV Export

**Purpose**: Bonus features from plan — SQL console and CSV download endpoints

- [ ] T047 [P] Write test for POST /api/query endpoint: verify SELECT execution, column/row response shape, rejection of non-SELECT statements, 5s timeout in api/query.test.js
- [ ] T048 [P] Write test for GET /data/download endpoint: verify CSV output format, Content-Disposition header, year/level filtering in data/download.test.js
- [ ] T049 Implement POST /api/query endpoint: parse SQL from body, validate SELECT-only, execute via db-loader, return columns + rows + duration_ms in api/query.js
- [ ] T050 Implement GET /data/download endpoint: query birth data, format as CSV, set Content-Disposition header with filename in data/download.js
- [ ] T051 [P] Write test for sql-console component: verify textarea input, execute button, results table rendering, error display in public/components/sql-console.test.js
- [ ] T052 Implement sql-console component: textarea for SQL input, execute button, results rendered as HTML table, error display in public/components/sql-console.js
- [ ] T053 Create public/console.html with import map and sql-console component mount in public/console.html
- [ ] T054 [P] Implement query helper pure functions: SQL sanitization check (SELECT-only), result-to-table transform in public/core/query.js

**Checkpoint**: /data/console shows working SQL interface, /data/download returns CSV

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, testing sweep, performance, and deployment verification

- [ ] T055 [P] Create docs/architecture.md with MermaidJS system overview diagram (browser ↔ CDN ↔ server ↔ SQLite) in docs/architecture.md
- [ ] T056 [P] Create docs/data-model.md with MermaidJS ER diagram and entity descriptions (copy from spec data-model.md, expand with usage notes) in docs/data-model.md
- [ ] T057 [P] Create docs/index.md as documentation table of contents linking architecture.md, data-model.md, and quickstart in docs/index.md
- [ ] T058 [P] Add companion .md doc header blocks (≥10 lines) to each core module explaining purpose, public API, and design decisions in public/core/probability.js, public/core/colors.js, public/core/regions.js, public/core/query.js
- [ ] T059 Run full test suite, fix any failures, verify ≥80% coverage on core/ modules
- [ ] T060 Performance audit: verify initial load < 3s, map interaction < 500ms, slider update < 500ms; optimize if needed
- [ ] T061 Deploy to Vercel preview, verify all routes work (/api/births, /data/download, /data/console, /)
- [ ] T062 Run quickstart.md validation: fresh clone → npm install → npm run dev → verify working app

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2)
- **User Story 2 (Phase 4)**: Depends on User Story 1 (Phase 3) — extends map-view and app shell
- **User Story 3 (Phase 5)**: Depends on User Story 2 (Phase 4) — adapts existing components for mobile
- **Data Console (Phase 6)**: Depends on Foundational (Phase 2) only — can run in parallel with US1-US3
- **Polish (Phase 7)**: Depends on all previous phases

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Core functions before components
- Components before shell wiring
- Story complete before moving to next priority

### Parallel Opportunities

- T003, T004, T005, T006, T007 — all setup files, different files
- T011, T012, T013 — core function tests, different files
- T014, T015, T016 — core function implementations, different files
- T017, T019, T021 — API tests, different endpoints
- T025, T026, T027, T028 — US1 tests, different components
- T035, T036 — US2 tests, different concerns
- T047, T048 — data console tests, different endpoints
- T055, T056, T057, T058 — documentation, different files
- Phase 6 can run in parallel with Phases 3–5

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (data + API + core functions)
3. Complete Phase 3: User Story 1 (map + choropleth + tooltips)
4. **STOP and VALIDATE**: Load app, verify heatmap renders correctly
5. Deploy to Vercel preview

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. User Story 1 → Heatmap works → Deploy (MVP!)
3. User Story 2 → Time slider works → Deploy
4. User Story 3 → Mobile works → Deploy
5. Data Console → SQL console + CSV → Deploy
6. Polish → Docs + performance → Final deploy

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Tests MUST fail before implementing
- Commit after each task or logical group
- Constitution requires TDD — all test tasks are mandatory
- Frontend tests use Node.js test runner with jsdom or lightweight DOM mocking
