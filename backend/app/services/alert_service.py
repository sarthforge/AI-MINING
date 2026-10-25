from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.errors import AppError
from app.models import Profile, SatelliteAlert
from app.schemas import SatelliteAlertOut


def _alert_out(row: SatelliteAlert) -> SatelliteAlertOut:
    return SatelliteAlertOut.model_validate(
        {
            "id": row.id,
            "site_id": row.site_id,
            "site_name": row.site.name,
            "region": row.site.region,
            "title": row.title,
            "description": row.description,
            "severity": row.severity,
            "detected_hectares": row.detected_hectares,
            "confidence": row.confidence,
            "detected_at": row.detected_at,
            "coordinates": row.coordinates,
            "category": row.category,
            "dismissed": row.dismissed,
        }
    )


def list_alerts(
    db: Session,
    *,
    site_id: str | None = None,
    severity: str | None = None,
    dismissed: bool | None = None,
) -> list[SatelliteAlertOut]:
    stmt = (
        select(SatelliteAlert)
        .options(selectinload(SatelliteAlert.site))
        .order_by(SatelliteAlert.detected_at.desc())
    )
    if site_id is not None:
        stmt = stmt.where(SatelliteAlert.site_id == site_id)
    if severity is not None:
        stmt = stmt.where(SatelliteAlert.severity == severity)
    if dismissed is not None:
        stmt = stmt.where(SatelliteAlert.dismissed.is_(dismissed))
    return [_alert_out(row) for row in db.scalars(stmt).all()]


def dismiss(db: Session, alert_id: str, user: Profile) -> SatelliteAlertOut:
    row = db.scalars(
        select(SatelliteAlert)
        .options(selectinload(SatelliteAlert.site))
        .where(SatelliteAlert.id == alert_id)
    ).first()
    if row is None:
        raise AppError(404, "NOT_FOUND", f"Alert {alert_id} not found")
    row.dismissed = True
    row.dismissed_by = user.id
    row.dismissed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    # refresh may drop relationship; reload with site
    row = db.scalars(
        select(SatelliteAlert)
        .options(selectinload(SatelliteAlert.site))
        .where(SatelliteAlert.id == alert_id)
    ).one()
    return _alert_out(row)


def reset_all(db: Session) -> list[SatelliteAlertOut]:
    rows = db.scalars(select(SatelliteAlert)).all()
    for row in rows:
        row.dismissed = False
        row.dismissed_by = None
        row.dismissed_at = None
    db.commit()
    return list_alerts(db)
