from datetime import date

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.errors import AppError
from app.models import MiningSite, MonthlyChangePoint, OverlayPolygon
from app.schemas import MiningSiteOut, MonthlyChangePointOut, OverlayPolygonOut


def _poly_out(site_id: str, poly: OverlayPolygon) -> OverlayPolygonOut:
    prefix = f"{site_id}:"
    public_id = poly.id.removeprefix(prefix) if poly.id.startswith(prefix) else poly.id
    return OverlayPolygonOut.model_validate(
        {
            "id": public_id,
            "title": poly.title,
            "poly_type": poly.poly_type,
            "area_ha": poly.area_ha,
            "color": poly.color,
            "stroke_color": poly.stroke_color,
            "label": poly.label,
            "points": poly.points,
            "description": poly.description,
        }
    )


def _site_out(site: MiningSite, *, with_polygons: bool) -> MiningSiteOut:
    data = MiningSiteOut.model_validate(site).model_dump()
    if with_polygons:
        data["polygons"] = [_poly_out(site.id, p) for p in site.polygons]
    else:
        data["polygons"] = None
    return MiningSiteOut.model_validate(data)


def list_sites(
    db: Session,
    *,
    country: str | None = None,
    alert_status: str | None = None,
    q: str | None = None,
) -> list[MiningSiteOut]:
    stmt = select(MiningSite).options(selectinload(MiningSite.polygons)).order_by(MiningSite.id)
    if country:
        stmt = stmt.where(MiningSite.country == country)
    if alert_status:
        stmt = stmt.where(MiningSite.alert_status == alert_status)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                MiningSite.name.ilike(like),
                MiningSite.code.ilike(like),
                MiningSite.region.ilike(like),
            )
        )
    return [_site_out(s, with_polygons=True) for s in db.scalars(stmt).all()]


def get_site(db: Session, site_id: str) -> MiningSiteOut:
    site = db.scalars(
        select(MiningSite).options(selectinload(MiningSite.polygons)).where(MiningSite.id == site_id)
    ).first()
    if site is None:
        raise AppError(404, "NOT_FOUND", f"Site {site_id} not found")
    return _site_out(site, with_polygons=True)


def list_polygons(db: Session, site_id: str) -> list[OverlayPolygonOut]:
    if db.get(MiningSite, site_id) is None:
        raise AppError(404, "NOT_FOUND", f"Site {site_id} not found")
    rows = db.scalars(
        select(OverlayPolygon).where(OverlayPolygon.site_id == site_id).order_by(OverlayPolygon.id)
    ).all()
    return [_poly_out(site_id, p) for p in rows]


def list_history(
    db: Session,
    site_id: str,
    *,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[MonthlyChangePointOut]:
    if db.get(MiningSite, site_id) is None:
        raise AppError(404, "NOT_FOUND", f"Site {site_id} not found")
    stmt = (
        select(MonthlyChangePoint)
        .where(MonthlyChangePoint.site_id == site_id)
        .order_by(MonthlyChangePoint.obs_date)
    )
    if date_from is not None:
        stmt = stmt.where(MonthlyChangePoint.obs_date >= date_from)
    if date_to is not None:
        stmt = stmt.where(MonthlyChangePoint.obs_date <= date_to)
    return [MonthlyChangePointOut.model_validate(r) for r in db.scalars(stmt).all()]
