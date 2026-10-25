# AI-MINING — complete setup guide

Step-by-step setup for local development and a free-tier cloud deploy (Supabase + Render + Vercel).

---

## 1. Prerequisites

| Tool | Version | Notes |
|------|---------|--------|
| Node.js | 20+ | Frontend |
| npm | 9+ | Comes with Node |
| Python | 3.12+ | Backend (3.12 recommended) |
| Git | any | |
| Supabase account | free | Postgres + PostGIS + Auth + Storage |
| (Optional) Render + Vercel accounts | free | API + frontend hosting |

Windows examples use PowerShell. On macOS/Linux, use `source .venv/bin/activate` instead of `.\.venv\Scripts\Activate.ps1`.

---

## 2. Clone and install frontend deps

```powershell
git clone <your-repo-url> AI-MINING
cd AI-MINING
npm install
copy .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

For a deployed API later, set this to `https://<your-render-app>.onrender.com/api/v1`.

Optional (when you add Supabase Auth in the UI):

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

**Never** put the Supabase **service_role** key in any `VITE_` variable — Vite embeds those into the browser bundle.

---

## 3. Supabase project

### 3.1 Create project

1. Go to [https://supabase.com](https://supabase.com) → New project.
2. Note the region and database password.

### 3.2 Enable PostGIS

SQL editor:

```sql
create extension if not exists postgis;
```

(`backend/sql/schema.sql` also runs this.)

### 3.3 Apply schema

1. Open **SQL Editor**.
2. Paste the full contents of [`backend/sql/schema.sql`](../backend/sql/schema.sql).
3. Run it once.

This creates `profile`, `mining_site`, `overlay_polygon`, `satellite_alert`, `monthly_change_point`, `analysis_job`, `telemetry_status`, indexes, and RLS policies.

### 3.4 Connection strings and keys

**Project Settings → Database**

- Prefer the **connection pooler** URI (port **6543**).
- For SQLAlchemy, use the `postgresql+psycopg://` scheme, e.g.:

```text
postgresql+psycopg://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

URL-encode special characters in the password.

**Project Settings → API**

| Secret | Where it goes |
|--------|----------------|
| Project URL | `SUPABASE_URL` (backend), optional `VITE_SUPABASE_URL` (frontend) |
| `anon` `public` key | Frontend only (`VITE_SUPABASE_ANON_KEY`) |
| `service_role` key | **Backend only** (`SUPABASE_SERVICE_ROLE_KEY`) — never Git, never `VITE_` |
| JWT secret | `SUPABASE_JWT_SECRET` (backend) — **Settings → API → JWT Settings** (legacy HS256 secret). If the project uses asymmetric JWT keys only, you must extend auth to JWKS (see PRD note). |

### 3.5 Storage bucket (analysis previews)

1. **Storage** → New bucket: name `imagery` (or match `STORAGE_BUCKET`).
2. Make it **public** if you want public image URLs in the UI (simplest for demo).
3. Backend uploads with the service_role key when analysis finishes.

### 3.6 Auth user + admin role

1. **Authentication** → Users → add a user (email/password), or sign up from the app once Auth is wired.
2. Confirm a row exists in `public.profile` (trigger or insert manually):

```sql
insert into public.profile (id, email, full_name, role)
values (
  '<auth-user-uuid>',
  'you@example.com',
  'Admin',
  'admin'
)
on conflict (id) do update set role = 'admin';
```

Write endpoints (`PATCH /alerts/.../dismiss`, `POST /alerts/reset`, `POST /analysis`) require a Bearer access token whose `profile.role` is `admin`.

---

## 4. Backend setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

### 4.1 Fill `backend/.env`

Minimum to serve read APIs and seed:

```env
SUPABASE_DB_URL=postgresql+psycopg://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
NDVI_DROP_THRESHOLD=0.3
MAX_CLOUD_PCT=20
STAC_URL=https://earth-search.aws.element84.com/v1
STORAGE_BUCKET=imagery
NDVI_RASTER_DIR=
CORS_ORIGINS=http://localhost:5173
```

| Variable | Required? | Notes |
|----------|-----------|--------|
| `SUPABASE_DB_URL` | Yes | Pooler URL, port 6543 |
| `SUPABASE_URL` | For Storage | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | For Storage uploads | Server only |
| `SUPABASE_JWT_SECRET` | For auth writes | HS256 shared secret |
| `NDVI_RASTER_DIR` | Demo without STAC | Folder of local GeoTIFFs |
| `CORS_ORIGINS` | Yes for browser | Comma-separated; add Vercel URL in prod |
| `NDVI_DROP_THRESHOLD` | Optional | Default `0.3` |
| `MAX_CLOUD_PCT` | Optional | STAC cloud filter |
| `STAC_URL` | Optional | Default Earth Search |
| `STORAGE_BUCKET` | Optional | Default `imagery` |

### 4.2 Seed data

Loads sites, polygons, alerts, history (`site-01`), and telemetry from `backend/app/seed/mock_data.json`:

```powershell
python -m app.seed.seed
```

Regenerate JSON from frontend mocks (optional):

```powershell
# from repo root, after adjusting the one-liner in app/seed/seed.py docstring if needed
```

### 4.3 Run API

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Swagger UI: http://localhost:8000/docs  
- Health: http://localhost:8000/api/v1/health → `{"status":"ok","db":"ok"}`

### 4.4 Run tests

```powershell
pytest -q
```

Tests use an in-memory SQLite DB and do not need Supabase.

---

## 5. Frontend setup

From repo root (with backend running):

```powershell
npm run dev
```

Open http://localhost:5173.

`src/services/api.ts` calls `VITE_API_URL`. On network/API errors it falls back to `src/data/mockData.ts` so the demo still works offline.

### 5.1 Admin token (writes + analysis)

After you obtain a Supabase access token (e.g. `supabase.auth.signInWithPassword`):

```ts
import { setApiAuthToken } from './services/api';
setApiAuthToken(session.access_token);
```

Without a token, dismiss/reset/analysis API calls fail and the UI keeps local/mock behaviour where implemented.

---

## 6. NDVI / analysis setup

### 6.1 Local GeoTIFF fallback (recommended for first demo)

1. Create a folder, e.g. `backend/rasters/`.
2. Add two **2-band** GeoTIFFs (band 1 = red/B04, band 2 = NIR/B08):

```text
backend/rasters/site-01_baseline.tif
backend/rasters/site-01_current.tif
```

3. Set in `backend/.env`:

```env
NDVI_RASTER_DIR=C:\Users\<you>\Downloads\AI-MINING\backend\rasters
```

Use an absolute path. The analysis job tries STAC first; if that fails, it uses these files.

4. Call (as admin):

```http
POST /api/v1/analysis
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "siteId": "site-01",
  "baselineDate": "2025-11-14",
  "currentImageDate": "2026-09-28"
}
```

5. Poll `GET /api/v1/analysis/{jobId}` until `status` is `DONE` or `FAILED`.

### 6.2 Live Sentinel-2 (STAC)

With network access, the backend searches Earth Search (`STAC_URL`) for `sentinel-2-l2a` near the site lat/lon (±15 days, cloud cover &lt; `MAX_CLOUD_PCT`), then window-reads COG bands. Tropical sites are often cloudy — precompute or use dry-season dates for demos.

### 6.3 BackgroundTasks caveat

Jobs run inside the web process. If Render restarts mid-job, the job can stick in `RUNNING`. On startup the API marks stale `QUEUED`/`RUNNING` jobs (older than ~30 minutes) as `FAILED`.

---

## 7. Deploy

### 7.1 Backend → Render (free web service)

1. New **Web Service** from this repo; root directory `backend` (or set start command accordingly).
2. Runtime: Python 3.
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add the same env vars as `backend/.env` (especially `SUPABASE_*`, `CORS_ORIGINS`).
6. Set `CORS_ORIGINS` to include `https://<your-app>.vercel.app` and local if needed.

Cold starts on free tier can take ~1 minute — hit `/api/v1/health` before a demo.

### 7.2 Frontend → Vercel

1. Import the repo; framework Vite; build `npm run build`; output `dist`.
2. Env: `VITE_API_URL=https://<render-host>/api/v1` (and optional Supabase anon vars).
3. Redeploy after changing `VITE_*` (they are build-time).

### 7.3 Supabase free tier

Paused projects after ~7 days idle will break the API. Open the dashboard and run a query the day before a demo.

---

## 8. Verify end-to-end checklist

- [ ] `schema.sql` applied; PostGIS enabled  
- [ ] `python -m app.seed.seed` succeeds  
- [ ] `GET /api/v1/health` → `db: ok`  
- [ ] `GET /api/v1/sites` returns seeded sites  
- [ ] Frontend on :5173 loads sites from API (Network tab)  
- [ ] Admin user `profile.role = 'admin'`  
- [ ] Dismiss alert persists after refresh  
- [ ] Analysis job completes with rasters or STAC  
- [ ] CORS allows the frontend origin  

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `SUPABASE_DB_URL is not set` | Missing `.env` | Copy `.env.example` → `.env` under `backend/` |
| DB connection errors | Wrong URI / password / SSL | Use pooler port 6543; encode password; check project not paused |
| CORS errors in browser | Origin not listed | Add UI origin to `CORS_ORIGINS` |
| 401 / 403 on dismiss or analysis | No/invalid token or not admin | Set JWT secret; Bearer token; `role='admin'` |
| Analysis `FAILED` “NDVI rasters not configured” | STAC failed and no local files | Set `NDVI_RASTER_DIR` + GeoTIFF pair |
| Analysis `FAILED` “too cloudy…” | SCL cloud fraction high | Pick other dates or raise `MAX_CLOUD_PCT` carefully |
| Frontend shows mock forever | Wrong `VITE_API_URL` or API down | Check URL includes `/api/v1`; open `/docs` |
| Images not updating after analysis | Storage not configured | Set `SUPABASE_URL` + service_role; create public `imagery` bucket |

---

## 10. Related docs

- [README.md](../README.md) — project overview  
- [PRD.md](../PRD.md) — product requirements, schema, pipeline detail  
- Live API docs — `/docs` when the server is running  
