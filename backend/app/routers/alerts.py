from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.db import get_db
from app.models import Profile
from app.schemas import SatelliteAlertOut
from app.services import alert_service

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[SatelliteAlertOut], response_model_by_alias=True)
def get_alerts(
    site_id: str | None = Query(None, alias="siteId"),
    severity: str | None = None,
    dismissed: bool | None = None,
    db: Session = Depends(get_db),
) -> list[SatelliteAlertOut]:
    return alert_service.list_alerts(db, site_id=site_id, severity=severity, dismissed=dismissed)


@router.patch("/{alert_id}/dismiss", response_model=SatelliteAlertOut, response_model_by_alias=True)
def dismiss_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    user: Profile = Depends(require_admin),
) -> SatelliteAlertOut:
    return alert_service.dismiss(db, alert_id, user)


@router.post("/reset", response_model=list[SatelliteAlertOut], response_model_by_alias=True)
def reset_alerts(
    db: Session = Depends(get_db),
    _user: Profile = Depends(require_admin),
) -> list[SatelliteAlertOut]:
    return alert_service.reset_all(db)
