from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import MiningSite, SatelliteAlert
from app.schemas.kpi import DashboardKpisOut


def get_kpis(db: Session) -> DashboardKpisOut:
    total_sites = db.scalar(select(func.count()).select_from(MiningSite)) or 0
    active_alerts = db.scalar(
        select(func.count()).select_from(SatelliteAlert).where(SatelliteAlert.dismissed.is_(False))
    ) or 0
    critical_alerts = db.scalar(
        select(func.count())
        .select_from(SatelliteAlert)
        .where(SatelliteAlert.dismissed.is_(False), SatelliteAlert.severity == "critical")
    ) or 0
    total_new = db.scalar(select(func.coalesce(func.sum(MiningSite.new_excavation_ha), 0.0))) or 0.0
    avg_conf = db.scalar(select(func.coalesce(func.avg(MiningSite.confidence_score), 0.0))) or 0.0
    breaches = db.scalar(
        select(func.count())
        .select_from(MiningSite)
        .where(MiningSite.concession_status == "Boundary Breach")
    ) or 0
    avg_drop = db.scalar(
        select(
            func.coalesce(func.avg(MiningSite.ndvi_baseline - MiningSite.ndvi_current), 0.0)
        )
    ) or 0.0

    return DashboardKpisOut(
        total_sites=int(total_sites),
        active_alerts=int(active_alerts),
        critical_alerts=int(critical_alerts),
        total_new_excavation_ha=round(float(total_new), 2),
        average_confidence=round(float(avg_conf), 1),
        boundary_breaches=int(breaches),
        average_ndvi_drop=round(float(avg_drop), 2),
    )
