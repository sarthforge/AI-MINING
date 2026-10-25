"""Licence / riparian checks for detected excavation (FR8)."""

from __future__ import annotations

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.models import OverlayPolygon

ALERT_HA_THRESHOLD = 0.1


def hectares_outside_concession(
    db: Session, site_id: str, detected_wkt: str | None, detected_ha: float
) -> float:
    """PostGIS ST_Difference area in hectares; SQLite falls back to full detected_ha."""
    if detected_ha <= 0:
        return 0.0
    if db.bind is not None and db.bind.dialect.name == "sqlite":
        # shortcut: no PostGIS in tests; treat all detected ha as outside licence
        return detected_ha
    if not detected_wkt:
        return detected_ha
    try:
        row = db.execute(
            text(
                """
                select coalesce(
                  st_area(
                    st_difference(
                      st_setsrid(st_geomfromtext(:wkt), 4326),
                      coalesce(
                        (select geom from overlay_polygon
                         where site_id = :site_id and poly_type = 'concession' and geom is not null
                         limit 1),
                        st_setsrid(st_geomfromtext(:wkt), 4326)
                      )
                    )::geography
                  ) / 10000.0,
                  0.0
                ) as ha
                """
            ),
            {"wkt": detected_wkt, "site_id": site_id},
        ).one()
        return float(row.ha or 0.0)
    except Exception:  # noqa: BLE001
        return detected_ha


def meets_water_polygon(db: Session, site_id: str, detected_wkt: str | None) -> bool:
    if not detected_wkt:
        return False
    if db.bind is not None and db.bind.dialect.name == "sqlite":
        water = db.scalars(
            select(OverlayPolygon).where(
                OverlayPolygon.site_id == site_id,
                OverlayPolygon.poly_type == "water",
            )
        ).first()
        return water is not None
    try:
        row = db.execute(
            text(
                """
                select exists(
                  select 1 from overlay_polygon
                  where site_id = :site_id and poly_type = 'water' and geom is not null
                    and st_intersects(geom, st_setsrid(st_geomfromtext(:wkt), 4326))
                ) as hit
                """
            ),
            {"site_id": site_id, "wkt": detected_wkt},
        ).one()
        return bool(row.hit)
    except Exception:  # noqa: BLE001
        return False
