# AI-MINING (TerraWatch)

Satellite-based **illegal / out-of-licence mining** detection dashboard.

A React 19 + TypeScript frontend shows monitored sites, orthomosaic overlays, NDVI change charts, and alerts. A FastAPI backend stores that data in **Supabase Postgres + PostGIS**, serves the same JSON shapes as `src/types/index.ts`, and runs **NDVI change detection** on Sentinel-2 (or local GeoTIFF pairs) via FastAPI `BackgroundTasks`.

| Layer | Stack |
|-------|--------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Recharts |
| Backend | FastAPI, Pydantic v2, SQLAlchemy 2, rasterio, numpy |
| Data | Supabase (Postgres + PostGIS, Auth, Storage) |
| Deploy (target) | Vercel (UI) + Render (API) + Supabase free tier |

Product / API contract: [PRD.md](PRD.md)  
**Full local + cloud setup:** [docs/SETUP.md](docs/SETUP.md)

---

## Features

- Sites, polygons, history, alerts, KPIs, telemetry from the API (mock data as offline fallback)
- Alert dismiss / reset (admin JWT)
- CSV export of sites
- `POST /analysis` → background NDVI job → poll status; updates site, polygons, history, alerts
- STAC Sentinel-2 fetch when available; local 2-band GeoTIFFs via `NDVI_RASTER_DIR` as fallback

---

## Repository layout

```text
AI-MINING/
├── src/                    # React dashboard
│   ├── components/
│   ├── services/api.ts     # API client + mock fallbacks
│   ├── data/mockData.ts    # Offline / demo fallback only
│   └── types/
├── backend/
│   ├── app/                # FastAPI app (routers, services, ml/, models)
│   ├── sql/schema.sql      # Supabase DDL (PostGIS + tables + RLS)
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── docs/SETUP.md           # Complete setup guide
├── PRD.md
└── .env.example            # Frontend VITE_* vars
```

---

## Quick start (local)

Prerequisites: **Node 20+**, **Python 3.12+**, a **Supabase** project with PostGIS.

### 1. Database

1. Create a Supabase project.
2. Enable the **PostGIS** extension.
3. Run [`backend/sql/schema.sql`](backend/sql/schema.sql) in the SQL editor.

### 2. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Edit .env — at least SUPABASE_DB_URL (pooler, port 6543)
python -m app.seed.seed
uvicorn app.main:app --reload --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)  
Health: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### 3. Frontend

```powershell
cd ..
copy .env.example .env
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The UI calls `VITE_API_URL` (default `http://localhost:8000/api/v1`) and falls back to `mockData.ts` if the API is down.

For admin writes (dismiss, reset, run analysis), configure JWT and call `setApiAuthToken` after login — see [docs/SETUP.md](docs/SETUP.md).

### 4. Tests

```powershell
cd backend
.\.venv\Scripts\pytest.exe -q
```

---

## API overview

Base path: `/api/v1` (camelCase JSON).

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | public |
| GET | `/auth/me` | logged-in |
| GET | `/sites`, `/sites/{id}`, `/sites/{id}/polygons`, `/sites/{id}/history` | public |
| GET | `/alerts` | public |
| PATCH | `/alerts/{id}/dismiss` | admin |
| POST | `/alerts/reset` | admin |
| GET | `/dashboard/kpis` | public |
| GET | `/telemetry` | public |
| POST | `/analysis` | admin |
| GET | `/analysis/{jobId}` | public |
| GET | `/export/sites.csv` | public |

Interactive OpenAPI: `/docs`.

---

## Environment (summary)

**Frontend** (`.env` at repo root):

```env
VITE_API_URL=http://localhost:8000/api/v1
```

**Backend** (`backend/.env`) — never commit; never put `SUPABASE_SERVICE_ROLE_KEY` in any `VITE_*` variable:

| Variable | Purpose |
|----------|---------|
| `SUPABASE_DB_URL` | Postgres pooler URL (`postgresql+psycopg://…:6543/postgres`) |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Storage uploads (server only) |
| `SUPABASE_JWT_SECRET` | Verify user access tokens |
| `NDVI_RASTER_DIR` | Optional local GeoTIFF fallback |
| `CORS_ORIGINS` | Comma-separated origins |

Full list and deploy steps: [docs/SETUP.md](docs/SETUP.md).

---

## NDVI analysis (short)

1. Admin `POST /analysis` with `{ siteId, baselineDate, currentImageDate }`.
2. Job runs in-process (`BackgroundTasks`): STAC Sentinel-2 L2A → NDVI drop + bare-soil mask → polygons → licence check → optional Storage previews.
3. If STAC fails, the job uses `{siteId}_baseline.tif` / `{siteId}_current.tif` under `NDVI_RASTER_DIR` (2 bands: red, NIR).
4. Poll `GET /analysis/{jobId}` until `DONE` or `FAILED`.

Results are **suspected** detections, not legal proof.

---

## Scripts

| Command | Where | What |
|---------|--------|------|
| `npm run dev` | root | Vite dev server |
| `npm run build` | root | Production frontend build |
| `uvicorn app.main:app --reload --port 8000` | `backend/` | API |
| `python -m app.seed.seed` | `backend/` | Seed from `mock_data.json` |
| `pytest -q` | `backend/` | Backend tests |

---

## License / honesty

Demo and research use. Satellite change detection can false-positive (harvest, season, floods). Keep the in-app disclaimer; treat alerts as triage signals for field verification.
