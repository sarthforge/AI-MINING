"""Enqueue and run NDVI analysis jobs (FastAPI BackgroundTasks, not Celery)."""

from __future__ import annotations

from datetime import date, datetime, timezone
from pathlib import Path
from uuid import UUID

import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app import db as db_module
from app.config import settings
from app.errors import AppError
from app.ml import preview as preview_ml
from app.ml import stac as stac_ml
from app.ml import vectorize as vectorize_ml
from app.models import AnalysisJob, MiningSite, MonthlyChangePoint, OverlayPolygon, SatelliteAlert
from app.schemas.job import AnalysisJobOut
from app.services import alert_rules, ndvi as ndvi_service
from app.services.ndvi import NdviChangeResult
from app.services.site_service import get_site


def _job_out(job: AnalysisJob) -> AnalysisJobOut:
    return AnalysisJobOut(
        job_id=job.id,
        site_id=job.site_id,
        status=job.job_status,  # type: ignore[arg-type]
        progress=job.progress,
        error=job.error_message,
        result=job.result_json,
    )


def resolve_raster_paths(site_id: str) -> tuple[Path, Path]:
    root = Path(settings.ndvi_raster_dir) if settings.ndvi_raster_dir else None
    if root is None or not root.is_dir():
        raise FileNotFoundError("NDVI rasters not configured (set NDVI_RASTER_DIR)")
    baseline = root / f"{site_id}_baseline.tif"
    current = root / f"{site_id}_current.tif"
    if not baseline.is_file() or not current.is_file():
        raise FileNotFoundError(f"Missing rasters for {site_id} in {root}")
    return baseline, current


def enqueue(
    db: Session,
    *,
    site_id: str,
    baseline_date: date,
    current_image_date: date,
    created_by: UUID | None = None,
) -> AnalysisJobOut:
    if db.get(MiningSite, site_id) is None:
        raise AppError(404, "NOT_FOUND", f"Site {site_id} not found")

    active = db.scalars(
        select(AnalysisJob).where(
            AnalysisJob.site_id == site_id,
            AnalysisJob.job_status.in_(("QUEUED", "RUNNING")),
        )
    ).first()
    if active is not None:
        raise AppError(409, "CONFLICT", f"Job already running for site {site_id}")

    job = AnalysisJob(
        site_id=site_id,
        job_status="QUEUED",
        baseline_date=baseline_date,
        current_image_date=current_image_date,
        progress=0,
        created_by=created_by,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _job_out(job)


def get_job(db: Session, job_id: UUID) -> AnalysisJobOut:
    job = db.get(AnalysisJob, job_id)
    if job is None:
        raise AppError(404, "NOT_FOUND", f"Job {job_id} not found")
    return _job_out(job)


def _load_pair(site: MiningSite, baseline_date: date, current_date: date):
    """Prefer STAC; fall back to NDVI_RASTER_DIR GeoTIFFs."""
    try:
        baseline = stac_ml.load_scene_for_site(
            lat=site.latitude, lon=site.longitude, around=baseline_date
        )
        current = stac_ml.load_scene_for_site(
            lat=site.latitude, lon=site.longitude, around=current_date
        )
        return baseline, current
    except Exception:
        baseline_path, current_path = resolve_raster_paths(site.id)
        red_b, nir_b = ndvi_service.read_red_nir(baseline_path)
        red_c, nir_c = ndvi_service.read_red_nir(current_path)
        # identity-ish transform for SVG mapping (pixel space)
        from affine import Affine

        transform = Affine.translation(site.longitude - 0.01, site.latitude + 0.01) @ Affine.scale(
            0.0001, -0.0001
        )
        baseline = stac_ml.SceneBands(red=red_b, nir=nir_b, scl=None, transform=transform, crs="EPSG:4326")
        current = stac_ml.SceneBands(red=red_c, nir=nir_c, scl=None, transform=transform, crs="EPSG:4326")
        return baseline, current


def _save_alerts(
    db: Session,
    site: MiningSite,
    result: NdviChangeResult,
    *,
    outside_ha: float,
    riparian: bool,
) -> None:
    now = datetime.now(timezone.utc)
    stamp = now.strftime("%Y%m%d%H%M%S")
    if outside_ha >= alert_rules.ALERT_HA_THRESHOLD:
        db.add(
            SatelliteAlert(
                id=f"alt-ndvi-{site.id}-{stamp}",
                site_id=site.id,
                title="Boundary breach detected",
                description=(
                    f"Suspected excavation of {outside_ha:.2f} ha outside licence "
                    f"(NDVI {result.ndvi_baseline:.2f} → {result.ndvi_current:.2f})."
                ),
                severity="critical",
                detected_hectares=outside_ha,
                confidence=result.confidence,
                detected_at=now,
                coordinates=site.formatted_coordinates,
                category="Boundary Breach",
                dismissed=False,
            )
        )
        site.concession_status = "Boundary Breach"
        site.alert_status = "High Priority"
    if riparian:
        db.add(
            SatelliteAlert(
                id=f"alt-rip-{site.id}-{stamp}",
                site_id=site.id,
                title="Riparian buffer encroachment",
                description="Suspected disturbance intersects a water / riparian overlay.",
                severity="warning",
                detected_hectares=result.detected_hectares,
                confidence=result.confidence,
                detected_at=now,
                coordinates=site.formatted_coordinates,
                category="Riparian Buffer Encroachment",
                dismissed=False,
            )
        )


def apply_result(
    db: Session,
    site: MiningSite,
    result: NdviChangeResult,
    *,
    obs_date: date,
    change_mask: np.ndarray | None = None,
    transform=None,
    baseline_scene: stac_ml.SceneBands | None = None,
    current_scene: stac_ml.SceneBands | None = None,
) -> None:
    site.ndvi_baseline = result.ndvi_baseline
    site.ndvi_current = result.ndvi_current
    site.new_excavation_ha = result.detected_hectares
    if site.total_area_ha:
        site.change_percentage = round(result.detected_hectares / site.total_area_ha * 100, 2)
    site.confidence_score = result.confidence
    site.last_observation_date = obs_date

    detected_wkt = None
    if change_mask is not None and transform is not None and change_mask.any():
        polys = vectorize_ml.mask_to_polygons(change_mask, transform)
        # replace prior suspected polys for this site
        for old in list(site.polygons):
            if old.poly_type == "suspected":
                db.delete(old)
        for i, poly in enumerate(polys):
            detected_wkt = detected_wkt or poly.wkt
            db.add(
                OverlayPolygon(
                    id=f"{site.id}:poly-ndvi-{i}",
                    site_id=site.id,
                    title=f"Suspected excavation zone {i + 1}",
                    poly_type="suspected",
                    area_ha=poly.area_ha or result.detected_hectares,
                    color="rgba(239, 68, 68, 0.35)",
                    stroke_color="#ef4444",
                    label=f"ALERT: {poly.area_ha or result.detected_hectares} ha Suspected",
                    points=poly.svg_points,
                    geom=poly.wkt,
                    description="NDVI change detection (suspected).",
                )
            )

    outside_ha = alert_rules.hectares_outside_concession(
        db, site.id, detected_wkt, result.detected_hectares
    )
    riparian = alert_rules.meets_water_polygon(db, site.id, detected_wkt)
    _save_alerts(db, site, result, outside_ha=outside_ha, riparian=riparian)

    month_label = obs_date.strftime("%b %y")
    existing = db.scalars(
        select(MonthlyChangePoint).where(
            MonthlyChangePoint.site_id == site.id,
            MonthlyChangePoint.obs_date == obs_date,
        )
    ).first()
    if existing is None:
        db.add(
            MonthlyChangePoint(
                site_id=site.id,
                month_label=month_label,
                obs_date=obs_date,
                permitted_cap_ha=16.0,
                total_excavation_ha=site.total_area_ha,
                unauthorized_ha=outside_ha,
                vegetation_index_ndvi=result.ndvi_current,
                turbidity_index=0,
            )
        )
    else:
        existing.vegetation_index_ndvi = result.ndvi_current
        existing.unauthorized_ha = outside_ha
        existing.total_excavation_ha = site.total_area_ha

    if baseline_scene is not None and current_scene is not None:
        try:
            b_png = preview_ml.render_true_color_png(
                baseline_scene.red, baseline_scene.green, baseline_scene.blue
            )
            c_png = preview_ml.render_true_color_png(
                current_scene.red, current_scene.green, current_scene.blue
            )
            b_url = preview_ml.upload_preview(b_png, f"{site.id}/baseline.png")
            c_url = preview_ml.upload_preview(c_png, f"{site.id}/current.png")
            if b_url:
                site.baseline_image_url = b_url
            if c_url:
                site.current_image_url = c_url
        except Exception:
            pass  # previews are best-effort


def run_analysis(job_id: str) -> None:
    if db_module.SessionLocal is None:
        raise RuntimeError("SUPABASE_DB_URL is not set")
    db = db_module.SessionLocal()
    try:
        job = db.get(AnalysisJob, UUID(job_id))
        if job is None:
            return
        job.job_status = "RUNNING"
        job.progress = 10
        db.commit()

        site = db.scalars(
            select(MiningSite)
            .options(selectinload(MiningSite.polygons))
            .where(MiningSite.id == job.site_id)
        ).first()
        if site is None:
            raise RuntimeError(f"Site {job.site_id} missing")

        baseline, current = _load_pair(site, job.baseline_date, job.current_image_date)
        job.progress = 40
        db.commit()

        result = ndvi_service.detect_change(
            baseline.red,
            baseline.nir,
            current.red,
            current.nir,
            scl_b=baseline.scl,
            scl_c=current.scl,
        )
        nb = ndvi_service.apply_cloud_mask(
            ndvi_service.compute_ndvi(baseline.red, baseline.nir), baseline.scl
        )
        nc = ndvi_service.apply_cloud_mask(
            ndvi_service.compute_ndvi(current.red, current.nir), current.scl
        )
        mask = ndvi_service.change_mask(nb, nc)
        job.progress = 80
        db.commit()

        apply_result(
            db,
            site,
            result,
            obs_date=job.current_image_date,
            change_mask=mask,
            transform=current.transform,
            baseline_scene=baseline,
            current_scene=current,
        )
        job.job_status = "DONE"
        job.progress = 100
        job.result_json = get_site(db, site.id).model_dump(by_alias=True, mode="json")
        job.finished_at = datetime.now(timezone.utc)
        job.error_message = None
        db.commit()
    except Exception as exc:  # noqa: BLE001 — persist failure on the job row
        db.rollback()
        job = db.get(AnalysisJob, UUID(job_id))
        if job is not None:
            job.job_status = "FAILED"
            job.error_message = str(exc)
            job.finished_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()
