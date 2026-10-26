# TerraWatch AI — Autonomous Satellite Mining Intelligence

> Autonomous multi-temporal satellite surveillance platform for detecting, measuring, and enforcing against illegal and out-of-boundary mining operations.

---

## Executive Summary

Illegal mining (sand dredging, open-cast over-extraction, and forest reserve encroachment) accounts for over **Rs. 50,000+ Crores** in lost state revenue and critical ecological devastation annually. 

**TerraWatch AI** combines **Sentinel-2 multi-spectral optical imagery**, **Sentinel-1 Synthetic Aperture Radar (SAR)**, and **Govt Cadastral Vector GIS** to differentiate between legitimate licensed mining and unauthorized encroachment with zero manual fieldwork delay.

---

## Key Standout Capabilities

### 1. Statutory Cadastre & Boundary Verification (Legal vs. Illegal)
* Automates a spatial polygon intersection between the detected earthmoving disturbance mask and registered statutory concession shapefiles.
* **Green Compliance:** 100% within registered lease boundaries (0.0 ha breach).
* **Red Breach AOI:** Flags unauthorized spatial spillover beyond cadastral pillars (e.g., `+2.4 ha beyond cadastre`).

### 2. 1-Click Official Govt Notice / FIR Generator (PDF)
* Generates a formal **Directorate General of Mines Safety (DGMS)** Form VIII-B statutory inspection order.
* Includes geodetic coordinates, satellite orbit timestamp, NDVI vegetation loss metrics, and **statutory compound penalty calculation in Rs. Crores** (under Section 21 of the MMDR Act).
* Features a dedicated `@media print` stylesheet for pixel-perfect standard A4 PDF export.

### 3. Custom Satellite Image Upload & Live AI Scanner
* Enables evaluators to drop any high-resolution aerial or drone GeoTIFF/JPG/PNG or test with realistic mining benchmarks.
* Visualizes real-time Ground Sampling Distance (GSD) calibration, differential NDVI calculation, and bare soil anomaly segmentation.
* Allows one-click **"Load Into Live Dashboard"** to inspect custom areas across all widgets.

### 4. Automated Drone Patrol Dispatch & Webhook Telemetry
* Instant UAV enforcement trigger deploying autonomous fixed-wing patrol units.
* Floating tactical HUD tracking flight intercept vector, real-time countdown ETA, and encrypted webhooks transmitted to District Authorities.

---

## Architecture & Tech Stack

```text
AI-MINING/
├── src/                          # React 19 + TypeScript Dashboard
│   ├── components/               # Modular GIS & telemetry components
│   │   ├── SatelliteViewer.tsx   # Interactive ortho viewer & cadastre HUD
│   │   ├── GovtNoticeModal.tsx   # Official DGMS Form VIII-B PDF order
│   │   ├── CustomScanModal.tsx   # Drag-and-drop raster AI inference
│   │   ├── DispatchToast.tsx     # Live UAV enforcement mission HUD
│   │   ├── BeforeAfterSlider.tsx # Multi-temporal visual comparator
│   │   └── ChangeTrackingChart.tsx # Historical excavation & NDVI analytics
│   ├── services/api.ts           # FastAPI client with offline fallback seeds
│   └── data/mockData.ts          # Offline fallback seeds (Zero-crash guarantee)
├── backend/                      # Python FastAPI Architecture
│   ├── app/                      # Routers, schemas, services, and ML pipeline
│   │   ├── main.py               # API Gateway & CORS middleware
│   │   ├── routers/              # /sites, /alerts, /dashboard, /analysis
│   │   └── services/             # Spatial geometry & background workers
│   ├── sql/schema.sql            # Supabase PostGIS spatial database schema
│   ├── requirements.txt          # Python dependencies (FastAPI, rasterio, shapely)
│   └── .env.example              # Backend environment template
```

| Layer | Stack |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, Lucide Icons, Recharts |
| **Backend** | Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2, Shapely, Rasterio |
| **Database** | Supabase Cloud (PostgreSQL with PostGIS extension) |
| **Imagery** | Sentinel-2 MSI (Level-2A BOA), Landsat-9, AWS Earth Search STAC API |

---

## Quick Start Guide (Local Setup)

### Prerequisites
* **Node.js** (v20+) & **npm**
* **Python** (v3.12+)

---

### Step 1: Backend Setup (FastAPI + Supabase)

1. Open terminal and navigate to the backend directory:
   ```powershell
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   ```

3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Configure environment:
   * Create a `.env` file in `backend/`:
     ```env
     SUPABASE_DB_URL=postgresql+psycopg://<user>:<password>@<host>:5432/postgres
     SUPABASE_URL=https://<project-ref>.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
     SUPABASE_JWT_SECRET=<jwt-secret>
     NDVI_DROP_THRESHOLD=0.3
     MAX_CLOUD_PCT=20
     CORS_ORIGINS=http://localhost:5173
     ```

5. Launch the FastAPI backend server:
   ```powershell
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

* **Interactive OpenAPI Swagger Docs:** http://localhost:8000/docs
* **API Health Check:** http://localhost:8000/api/v1/health

---

### Step 2: Frontend Setup (React + Vite)

1. Open a new terminal at the project root directory:
   ```powershell
   cd ..
   ```

2. Configure environment:
   * Create a `.env` file in the project root:
     ```env
     VITE_API_URL=http://localhost:8000/api/v1
     ```

3. Install packages and launch the dev server:
   ```powershell
   npm install
   npm run dev
   ```

4. Open the application in your browser:
   http://localhost:5173

---

## Core API Endpoints

All endpoints use camelCase JSON formatting under the `/api/v1` base route:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service & Supabase PostgreSQL health check |
| `GET` | `/api/v1/sites` | List all monitored Area of Interest (AOIs) and cadastres |
| `GET` | `/api/v1/sites/{id}/history` | Multi-temporal historical excavation and NDVI records |
| `GET` | `/api/v1/alerts` | Active high-priority encroachment alerts |
| `PATCH` | `/api/v1/alerts/{id}/dismiss` | Dismiss an alert |
| `POST` | `/api/v1/alerts/reset` | Restore demo simulated alerts |
| `GET` | `/api/v1/dashboard/kpis` | Real-time aggregate KPI metrics |
| `GET` | `/api/v1/telemetry` | Satellite constellation orbital pass tracking |
| `POST` | `/api/v1/analysis` | Trigger asynchronous background neural NDVI scan |
| `GET` | `/api/v1/export/sites.csv` | Download complete cadastral CSV audit log |

---

## Offline Resiliency & Fallback Guarantee

During high-stakes competitions or expo venues with poor Wi-Fi connectivity, the application features an **autonomous zero-crash fallback engine**. If the backend connection drops, the frontend automatically falls back to curated local simulation seeds (`src/data/mockData.ts`), ensuring smooth interactive presentations without freezing.

---

## Legal & Regulatory Compliance

* **Statutory Reference:** Formulated in alignment with Section 21 of the Mines and Minerals (Development and Regulation) Act (MMDR) and Directorate General of Mines Safety (DGMS) geospatial guidelines.
* **Disclaimer:** Autonomous satellite anomaly detection serves as an intelligence and triage tool for physical inspection demarcation.
