"""Mark abandoned BackgroundTasks jobs FAILED after Render restarts."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import update

from app import db as db_module
from app.models import AnalysisJob

STALE_AFTER = timedelta(minutes=30)


def fail_stale_jobs() -> int:
    if db_module.SessionLocal is None:
        return 0
    cutoff = datetime.now(timezone.utc) - STALE_AFTER
    db = db_module.SessionLocal()
    try:
        result = db.execute(
            update(AnalysisJob)
            .where(
                AnalysisJob.job_status.in_(("QUEUED", "RUNNING")),
                AnalysisJob.created_at < cutoff,
            )
            .values(
                job_status="FAILED",
                error_message="Job abandoned (server restart or timeout)",
                finished_at=datetime.now(timezone.utc),
            )
        )
        db.commit()
        return int(result.rowcount or 0)
    except Exception:  # noqa: BLE001 — startup must not crash without DB
        db.rollback()
        return 0
    finally:
        db.close()
