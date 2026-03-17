# Implementation Plan: Birth Probability Map

**Branch**: `001-birth-probability-map` | **Date**: 2026-03-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-birth-probability-map/spec.md`

## Summary

Build an interactive world heatmap showing where people are most likely
to be born, with historical time slider (1950–present), continent/country
granularity switching, and mobile-friendly touch interactions. Architecture
uses zero-build-step frontend (ES modules + CDN import maps), a Node.js
server with sql.js for SQLite queries, and Vercel serverless deployment.
Includes a data console (`/data/console`) for live SQL queries and CSV
export (`/data/download`).

## Technical Context

**Language/Version**: JavaScript (ES2024+, native ES modules)
**Primary Dependencies**:
- Frontend (CDN): Leaflet 1.9.x, Ramda 0.30.x, topojson-client 3.x, sql.js 1.8.x
- Server: sql.js (WASM SQLite), Node.js built-in HTTP
**Storage**: SQLite file (`data/births.db`) versioned in repository
**Testing**: Node.js built-in test runner (`node --test`)
**Target Platform**: Modern browsers (Chrome 89+, Firefox 108+, Safari 16.4+), Vercel serverless
**Project Type**: Web application (client + serverless API)
**Performance Goals**: Initial load < 3s, map interaction response < 500ms
**Constraints**: No build step, no npm for frontend, SQLite < 5MB, Vercel-compatible
**Scale/Scope**: ~15,000 data rows, ~200 countries, 75 years, single-page app + console page

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Clean Code & Functional Design | PASS | Functional core (pure Ramda transforms) + imperative shell (DOM/map mutations). Component-driven, single-responsibility modules. |
| II. Test-Driven Development | PASS | Node.js test runner, tests alongside source, TDD workflow. |
| III. Vercel-Ready Deployment | PASS with deviation | Deploys on Vercel using static files + API routes. No framework (Next.js etc.) — justified: static files + serverless functions are simpler and user-requested. |
| IV. Developer Experience First | PASS with deviation | `npm install && npm run dev` works. Plain JS instead of TypeScript — justified: user explicitly chose JS for no-build-step alignment. Linting via ESLint still enforced. |
| V. Literate Programming | PASS | `docs/` directory with MermaidJS architecture diagrams, companion `.md` per module, documentation updated with code. |

## Project Structure

### Documentation (this feature)

```text
specs/001-birth-probability-map/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # API endpoint contracts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
api/                        # Vercel serverless functions
├── births.js               # GET /api/births
├── years.js                # GET /api/years
└── query.js                # POST /api/query

data/
├── births.db               # SQLite database (versioned in repo)
└── download.js             # GET /data/download (Vercel function)

public/                     # Static frontend (no build)
├── index.html              # Entry point + import map declaration
├── console.html            # SQL console page (/data/console)
├── components/             # Pure UI components (ES modules)
│   ├── map-view.js         # Leaflet map + choropleth rendering
│   ├── time-slider.js      # Year selection slider control
│   ├── tooltip.js          # Region info tooltip
│   ├── legend.js           # Color scale legend
│   └── sql-console.js      # Interactive SQL query UI
├── core/                   # Pure functions (no side effects)
│   ├── probability.js      # Birth probability math
│   ├── colors.js           # Heatmap color scale (value → hex)
│   ├── regions.js          # Region data transforms
│   └── query.js            # SQL query construction helpers
├── shell/                  # Imperative glue (side effects)
│   ├── app.js              # Application wiring + initialization
│   ├── data-loader.js      # Fetch calls to /api/*
│   └── state.js            # Application state container
└── styles/
    └── main.css            # Responsive layout + map styles

scripts/
└── ingest.js               # Data ingestion: CSV → SQLite

docs/
├── index.md                # Documentation TOC
├── architecture.md         # System overview + MermaidJS diagrams
└── data-model.md           # Entity docs + ER diagram

server.js                   # Local dev server (plain Node.js HTTP)
vercel.json                 # Vercel routing configuration
package.json                # type: "module", server deps, scripts
```

**Structure Decision**: Flat structure with `public/` for static frontend
and `api/` for Vercel serverless functions. No monorepo, no framework.
The `public/components/` + `public/core/` + `public/shell/` split
enforces the functional core / imperative shell pattern at the file
system level.

## Complexity Tracking

> Constitution deviations justified by user requirements

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Plain JS instead of TypeScript | User explicitly chose JS; no build step means no TS compilation. JSDoc type annotations used instead. | TypeScript requires a build/transpile step which contradicts the zero-build constraint. |
| No framework (Next.js etc.) | Static files + serverless functions are sufficient. User wants minimal deps. | A framework adds build complexity, bundle size, and abstractions not needed for this app. |
| CDN deps instead of npm (frontend) | User explicitly wants no build step; import maps + CDN achieve reproducible deps. | npm + bundler contradicts the explicit user requirement for zero build tooling. |
