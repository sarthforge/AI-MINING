from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import MiningSiteOut, MonthlyChangePointOut, OverlayPolygonOut
from app.services import site_service

router = APIRouter(prefix="/sites", tags=["sites"])


@router.get("", response_model=list[MiningSiteOut], response_model_by_alias=True)
def get_sites(
    country: str | None = None,
    alert_status: str | None = Query(None, alias="alertStatus"),
    q: str | None = None,
    db: Session = Depends(get_db),
) -> list[MiningSiteOut]:
    return site_service.list_sites(db, country=country, alert_status=alert_status, q=q)


@router.get("/{site_id}", response_model=MiningSiteOut, response_model_by_alias=True)
def get_site(site_id: str, db: Session = Depends(get_db)) -> MiningSiteOut:
    return site_service.get_site(db, site_id)


@router.get(
    "/{site_id}/polygons",
    response_model=list[OverlayPolygonOut],
    response_model_by_alias=True,
)
def get_site_polygons(site_id: str, db: Session = Depends(get_db)) -> list[OverlayPolygonOut]:
    return site_service.list_polygons(db, site_id)


@router.get(
    "/{site_id}/history",
    response_model=list[MonthlyChangePointOut],
    response_model_by_alias=True,
)
def get_site_history(
    site_id: str,
    date_from: date | None = Query(None, alias="from"),
    date_to: date | None = Query(None, alias="to"),
    db: Session = Depends(get_db),
) -> list[MonthlyChangePointOut]:
    return site_service.list_history(db, site_id, date_from=date_from, date_to=date_to)
