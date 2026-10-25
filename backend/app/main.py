from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.errors import AppError, app_error_handler
from app.routers import alerts, analysis, auth, dashboard, export, sites, telemetry
from app.services import job_cleanup


@asynccontextmanager
async def lifespan(_app: FastAPI):
    job_cleanup.fail_stale_jobs()
    yield


app = FastAPI(title="AI-MINING API", lifespan=lifespan)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)

api = "/api/v1"
app.include_router(sites.router, prefix=api)
app.include_router(alerts.router, prefix=api)
app.include_router(dashboard.router, prefix=api)
app.include_router(analysis.router, prefix=api)
app.include_router(telemetry.router, prefix=api)
app.include_router(export.router, prefix=api)
app.include_router(auth.router, prefix=api)


@app.get(f"{api}/health")
def health():
    from sqlalchemy import text

    from app import db as db_module

    db_status = "error"
    if db_module.SessionLocal is not None:
        session = db_module.SessionLocal()
        try:
            session.execute(text("SELECT 1"))
            db_status = "ok"
        except Exception:  # noqa: BLE001
            db_status = "error"
        finally:
            session.close()
    return {"status": "ok" if db_status == "ok" else "degraded", "db": db_status}
