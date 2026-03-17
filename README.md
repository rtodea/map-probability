# Birth Probability Map

Interactive world heatmap showing where people are most likely to be born, with historical time slider (1950–present), continent/country granularity switching, and mobile-friendly touch interactions.

## Quick Start

### Option 1: Docker (recommended)

```bash
docker compose up --build
# Open http://localhost:3000
```

### Option 2: Docker without Compose

```bash
docker build -t map-probability .
docker run -p 3000:3000 map-probability
# Open http://localhost:3000
```

### Option 3: Node.js

```bash
npm install
npm run ingest   # downloads birth data → data/births.db (only needed once)
npm run dev      # starts dev server at http://localhost:3000
```

### Option 4: Vercel CLI

```bash
npm install
vercel dev       # starts Vercel dev server with serverless function emulation
```

## Available Routes

| Route | Description |
|-------|-------------|
| `/` | Main heatmap application |
| `/data/console` | SQL console for querying the database |
| `/data/download` | CSV export (add `?year=2020&level=country`) |
| `/api/births` | JSON birth data (add `?year=2020&level=country`) |
| `/api/years` | Available year range |
| `/api/query` | POST SQL queries (SELECT only) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm test` | Run test suite (31 tests) |
| `npm run lint` | Lint all JS files |
| `npm run ingest` | Re-download birth data into SQLite |

## Architecture

```
public/            Static frontend (ES modules, no build step)
├── core/          Pure functions (probability, colors, regions)
├── components/    UI components (map, slider, tooltip, legend)
└── shell/         Imperative glue (app wiring, state, data loading)

api/               Vercel serverless functions (also used by local server)
data/              SQLite database (versioned in repo)
scripts/           Data ingestion tooling
docs/              Architecture docs with MermaidJS diagrams
```

Frontend dependencies load from CDN via browser-native import maps — no bundler, no build step.

## Tech Stack

- **Frontend**: Vanilla JS (ES2024+), Leaflet, Ramda — loaded via CDN import maps
- **Backend**: Node.js, sql.js (WASM SQLite)
- **Data**: SQLite database versioned in repo (~256 KB)
- **Deploy**: Vercel (serverless) or Docker
