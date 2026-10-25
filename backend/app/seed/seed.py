"""Upsert mock dashboard data into Supabase Postgres.

Source: src/data/mockData.ts → backend/app/seed/mock_data.json
Regenerate JSON: npx --yes tsx -e "import {MONITORED_SITES,SIMULATED_ALERTS,HISTORICAL_CHANGE_DATA,SATELLITE_TELEMETRY} from './src/data/mockData.ts'; import fs from 'fs'; fs.writeFileSync('backend/app/seed/mock_data.json', JSON.stringify({sites:MONITORED_SITES,alerts:SIMULATED_ALERTS,history:HISTORICAL_CHANGE_DATA,telemetry:SATELLITE_TELEMETRY},null,2))"

Run from backend/:  python -m app.seed.seed
Requires SUPABASE_DB_URL in backend/.env and schema.sql already applied.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import delete, text
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import MiningSite, MonthlyChangePoint, OverlayPolygon, SatelliteAlert
from app.schemas import MiningSiteOut, MonthlyChangePointOut, OverlayPolygonOut, SatelliteAlertOut

MOCK_PATH = Path(__file__).with_name("mock_data.json")
HISTORY_SITE_ID = "site-01"


def _parse_alert_ts(value: str | datetime) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    raw = value.strip()
    if raw.endswith("UTC"):
        return datetime.strptime(raw.removesuffix("UTC").strip(), "%Y-%m-%d %H:%M").replace(
            tzinfo=timezone.utc
        )
    return datetime.fromisoformat(raw.replace("Z", "+00:00"))


def _upsert_site(db: Session, raw: dict) -> None:
    polys_raw = raw.get("polygons") or []
    site_in = MiningSiteOut.model_validate({**raw, "polygons": None})
    fields = site_in.model_dump(exclude={"polygons"})
    site = db.get(MiningSite, fields["id"])
    if site is None:
        site = MiningSite(**fields)
        db.add(site)
    else:
        for key, value in fields.items():
            setattr(site, key, value)

    db.execute(delete(OverlayPolygon).where(OverlayPolygon.site_id == fields["id"]))
    for poly in polys_raw:
        poly_in = OverlayPolygonOut.model_validate(poly)
        dumped = poly_in.model_dump()
        # shortcut: mock reuses poly ids across sites; prefix for PK uniqueness
        db.add(
            OverlayPolygon(
                id=f"{fields['id']}:{dumped['id']}",
                site_id=fields["id"],
                title=dumped["title"],
                poly_type=dumped["type"],
                area_ha=dumped["area_ha"],
                color=dumped["color"],
                stroke_color=dumped["stroke_color"],
                label=dumped["label"],
                points=dumped["points"],
                description=dumped["description"],
                geom=None,
            )
        )


def _upsert_alert(db: Session, raw: dict) -> None:
    alert_in = SatelliteAlertOut.model_validate({**raw, "timestamp": _parse_alert_ts(raw["timestamp"])})
    site = db.get(MiningSite, alert_in.site_id)
    if site is None:
        raise RuntimeError(f"Alert {alert_in.id} references missing site {alert_in.site_id}")

    row = db.get(SatelliteAlert, alert_in.id)
    values = {
        "site_id": alert_in.site_id,
        "title": alert_in.title,
        "description": alert_in.description,
        "severity": alert_in.severity,
        "detected_hectares": alert_in.detected_hectares,
        "confidence": alert_in.confidence,
        "detected_at": alert_in.timestamp,
        "coordinates": alert_in.coordinates,
        "category": alert_in.category,
        "dismissed": alert_in.dismissed,
    }
    if row is None:
        db.add(SatelliteAlert(id=alert_in.id, **values))
    else:
        for key, value in values.items():
            setattr(row, key, value)


def _replace_history(db: Session, rows: list[dict]) -> None:
    db.execute(delete(MonthlyChangePoint).where(MonthlyChangePoint.site_id == HISTORY_SITE_ID))
    for raw in rows:
        point = MonthlyChangePointOut.model_validate(raw)
        db.add(
            MonthlyChangePoint(
                site_id=HISTORY_SITE_ID,
                month_label=point.month,
                obs_date=point.date,
                permitted_cap_ha=point.permitted_cap_ha,
                total_excavation_ha=point.total_excavation_ha,
                unauthorized_ha=point.unauthorized_ha,
                vegetation_index_ndvi=point.vegetation_index_ndvi,
                turbidity_index=point.turbidity_index,
            )
        )


def _upsert_telemetry(db: Session, raw: dict) -> None:
    db.execute(
        text(
            """
            insert into telemetry_status (
              id, constellation, orbit_mode, last_pass_utc, next_pass_eta,
              cloud_coverage, sun_azimuth, sensor_bands,
              ground_sampling_distance, cadastre_sync
            ) values (
              1, :constellation, :orbitMode, :lastPassUTC, :nextPassETA,
              :cloudCoverage, :sunAzimuth, :sensorBands,
              :groundSamplingDistance, :cadastreSync
            )
            on conflict (id) do update set
              constellation = excluded.constellation,
              orbit_mode = excluded.orbit_mode,
              last_pass_utc = excluded.last_pass_utc,
              next_pass_eta = excluded.next_pass_eta,
              cloud_coverage = excluded.cloud_coverage,
              sun_azimuth = excluded.sun_azimuth,
              sensor_bands = excluded.sensor_bands,
              ground_sampling_distance = excluded.ground_sampling_distance,
              cadastre_sync = excluded.cadastre_sync
            """
        ),
        raw,
    )


def run(db: Session) -> None:
    data = json.loads(MOCK_PATH.read_text(encoding="utf-8"))
    for site in data["sites"]:
        _upsert_site(db, site)
    db.flush()
    for alert in data["alerts"]:
        _upsert_alert(db, alert)
    _replace_history(db, data["history"])
    _upsert_telemetry(db, data["telemetry"])
    db.commit()


def main() -> None:
    if SessionLocal is None:
        print("SUPABASE_DB_URL is not set in backend/.env", file=sys.stderr)
        sys.exit(1)
    if not MOCK_PATH.exists():
        print(f"Missing {MOCK_PATH}; regenerate from mockData.ts", file=sys.stderr)
        sys.exit(1)
    with SessionLocal() as db:
        run(db)
    print(f"Seeded from {MOCK_PATH.name}")


if __name__ == "__main__":
    main()
