# Darukae — Geospatial project & site analytics

Administrator platform for creating renewable-energy projects, drawing site boundaries on a map, and reviewing performance analytics over time.

## User stories covered

| Story                                   | Implementation                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| Create a project and add multiple sites | **Projects** dashboard + **Project detail** with Mapbox Draw polygon capture |
| View all projects and sites on a map    | **Interactive map** (`/map`) with GeoJSON layers from the database           |
| Click a site for analytics over time    | Map click → inspector → **Site analytics** with Chart.js time series         |

## Tech stack

- **Frontend:** React (Vite), Mapbox GL JS + Mapbox Draw, Chart.js
- **Backend:** FastAPI, SQLAlchemy, GeoAlchemy2, JWT (python-jose + bcrypt)
- **Database:** PostgreSQL **`DarukaDB`** + PostGIS locally; SQLite optional for dev without PostGIS
- **Quality:** Husky + lint-staged (Prettier, ESLint, Ruff), GitHub Actions CI — see [docs/CODE_QUALITY.md](docs/CODE_QUALITY.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Deploy:** GitHub Actions → [Render](https://render.com) (API) + [Vercel](https://vercel.com) (SPA)

## Mock dataset (why this choice)

**Full documentation:** **[docs/DATASET.md](docs/DATASET.md)** — geographic sites, synthetic 90-day metrics, alternatives considered (SCADA, OSM-only, NASA POWER, CSV plant lists), and how to replace mocks in production.

Summary:

- **Source code:** `backend/app/seed.py` (`SITES` + `_seed_metrics`).
- **Geography:** Four mock solar/wind polygons in India (two portfolios), WGS84 GeoJSON → PostGIS.
- **Analytics:** Deterministic sine/noise generator for energy, availability, capacity factor, irradiance — no licensed external dataset.
- **Reason:** License-safe, instant demo on deploy, and aligned with polygon + time-series user stories.

Demo login (first boot): `admin@darukae.dev` / `admin1234`.

## Local development

Use **Python + Node** on your machine (see `.vscode/tasks.json` in VS Code).

### Prerequisites

- Node.js 20+
- Python 3.12+
- Optional: [Mapbox public token](https://account.mapbox.com/) in `frontend/.env` (maps work without it via MapLibre/OSM)

### 1. Environment

Default database: **PostgreSQL `DarukaDB`** — see **[docs/DATABASE.md](docs/DATABASE.md)** for `CREATE DATABASE`, PostGIS, and `DATABASE_URL`.

```bash
copy backend\.env.example backend\.env
# Edit DATABASE_URL if your Postgres user/password differ from postgres:postgres
copy frontend\.env.example frontend\.env
```

SQLite is still supported by setting `DATABASE_URL=sqlite:///./darukae_dev.db` in `backend/.env` (no PostGIS).

### 2. Install and run

**Terminal 1 — API:**

```bash
pip install -r backend/requirements.txt
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — UI:**

```bash
npm install
npm install --prefix frontend
npm run dev --prefix frontend
```

Open http://127.0.0.1:5173 — Vite proxies `/api` to the API.  
API docs: http://127.0.0.1:8000/docs

### 3. Code quality (required)

Root install enables **Husky** pre-commit hooks (crucial for submission):

```bash
git init
npm install
npm install --prefix frontend
```

On every commit, **lint-staged** runs Prettier, ESLint, and Ruff (see root `package.json`). CI runs the same checks on every push/PR.

Manual checks:

```bash
npm run quality
npm run test:backend
npm run build --prefix frontend
```

## CI/CD and public deployment

Pipeline reference: **[docs/CICD.md](docs/CICD.md)** · secrets & hosting: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**

| Stage                                   | What runs                                                  |
| --------------------------------------- | ---------------------------------------------------------- |
| Pre-commit                              | Husky → lint-staged (format + lint)                        |
| CI (`.github/workflows/ci.yml`)         | `npm run quality`, pytest (PostGIS), Vite build — push/PR  |
| Deploy (`.github/workflows/deploy.yml`) | Render + Vercel — **after CI passes on `main`**, or manual |

After configuring GitHub secrets (`RENDER_DEPLOY_HOOK_URL`, `VERCEL_*`, `VITE_API_URL`, `VITE_MAPBOX_TOKEN`), a successful CI run on `main` triggers deploy:

- **API** — public Render URL (`/api/health`, `/docs`)
- **Web app** — public Vercel URL (set `VITE_API_URL` to the Render API)

## Deployment (manual reference)

### API on Render

1. Create a PostgreSQL instance and enable PostGIS: `CREATE EXTENSION IF NOT EXISTS postgis;`
2. Deploy from this repo using `render.yaml` (Render **Python** web service in `backend/`).
3. Set `CORS_ORIGINS` to your Vercel URL (e.g. `https://your-app.vercel.app`).
4. Optional: add `RENDER_DEPLOY_HOOK_URL` to GitHub secrets for auto-deploy on `main`.

### Frontend on Vercel

1. Set root directory to `frontend`.
2. Set environment variable `VITE_API_URL` to your Render API URL (no trailing slash).
3. Build command: `npm run build`; output: `dist`.

## API overview

| Method | Path                        | Description                        |
| ------ | --------------------------- | ---------------------------------- |
| POST   | `/api/auth/register`        | Register administrator             |
| POST   | `/api/auth/login`           | JWT login                          |
| GET    | `/api/projects`             | List projects                      |
| POST   | `/api/projects`             | Create project                     |
| POST   | `/api/projects/{id}/sites`  | Create site (GeoJSON Polygon body) |
| GET    | `/api/sites/geojson`        | FeatureCollection for map          |
| GET    | `/api/sites/{id}/analytics` | Summary + time series              |

## Project layout

```
backend/          FastAPI app, PostGIS models, seed data, tests
frontend/         React SPA (map, dashboard, charts)
.github/workflows/  CI + Deploy (GitHub Actions) — see docs/CICD.md
docs/               CICD.md, CODE_QUALITY.md, DATASET.md, DEPLOYMENT.md
.husky/             pre-commit → lint-staged
render.yaml         Render blueprint (Python API + Postgres)
```


