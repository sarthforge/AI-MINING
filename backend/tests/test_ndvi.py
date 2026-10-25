"""NDVI maths + analysis endpoint with a tiny fake GeoTIFF pair."""

from pathlib import Path

import numpy as np
import rasterio
from rasterio.transform import from_origin
from sqlalchemy import select

from app.models import SatelliteAlert
from app.services import analysis_service, ndvi


def _write_pair(dir_path: Path, site_id: str) -> Path:
    """Vegetated baseline → bare patch in current (8×8, 10 m pixels)."""
    h = w = 8
    # baseline: high NIR, low red → NDVI ~ 0.7
    red_b = np.full((h, w), 1000, dtype=np.float32)
    nir_b = np.full((h, w), 5000, dtype=np.float32)
    # current: centre 4×4 becomes bare (low NIR) → NDVI ~ 0.0, drop ~ 0.7
    red_c = red_b.copy()
    nir_c = nir_b.copy()
    nir_c[2:6, 2:6] = 1000

    transform = from_origin(-53.74, -4.30, 10, 10)
    profile = {
        "driver": "GTiff",
        "height": h,
        "width": w,
        "count": 2,
        "dtype": "float32",
        "crs": "EPSG:4326",
        "transform": transform,
    }
    baseline = dir_path / f"{site_id}_baseline.tif"
    current = dir_path / f"{site_id}_current.tif"
    with rasterio.open(baseline, "w", **profile) as dst:
        dst.write(red_b, 1)
        dst.write(nir_b, 2)
    with rasterio.open(current, "w", **profile) as dst:
        dst.write(red_c, 1)
        dst.write(nir_c, 2)
    return dir_path


def test_compute_ndvi_zero_safe():
    red = np.array([[0.0, 1.0]], dtype=np.float32)
    nir = np.array([[0.0, 3.0]], dtype=np.float32)
    out = ndvi.compute_ndvi(red, nir)
    assert np.isnan(out[0, 0])
    assert abs(out[0, 1] - 0.5) < 1e-5


def test_detect_change_from_fake_geotiff(tmp_path: Path):
    root = _write_pair(tmp_path, "site-01")
    result = ndvi.detect_change_from_geotiffs(
        root / "site-01_baseline.tif",
        root / "site-01_current.tif",
    )
    assert result.changed_pixels == 16  # 4×4 bare patch
    assert result.detected_hectares == 0.16  # 16 * 0.01 ha
    assert result.ndvi_baseline > 0.5
    assert result.ndvi_current < result.ndvi_baseline
    assert result.confidence > 0


def test_post_analysis_saves_alert(client, db, tmp_path: Path, monkeypatch):
    root = _write_pair(tmp_path, "site-01")
    monkeypatch.setattr(analysis_service.settings, "ndvi_raster_dir", str(root))
    # ensure BackgroundTasks see the same SessionLocal as the client fixture
    assert analysis_service.db_module.SessionLocal is not None

    before = len(db.scalars(select(SatelliteAlert)).all())
    r = client.post(
        "/api/v1/analysis",
        json={
            "siteId": "site-01",
            "baselineDate": "2025-11-14",
            "currentImageDate": "2026-09-28",
        },
    )
    assert r.status_code == 202
    body = r.json()
    assert body["siteId"] == "site-01"
    assert body["status"] in ("QUEUED", "RUNNING", "DONE", "FAILED")
    job_id = body["jobId"]

    polled = client.get(f"/api/v1/analysis/{job_id}")
    assert polled.status_code == 200
    done = polled.json()
    assert done["status"] == "DONE"
    assert done["progress"] == 100
    assert done["error"] is None
    assert done["result"] is not None
    assert done["result"]["ndviCurrent"] < done["result"]["ndviBaseline"]

    db.expire_all()
    alerts = db.scalars(select(SatelliteAlert).order_by(SatelliteAlert.id)).all()
    assert len(alerts) == before + 1
    created = alerts[-1]
    assert created.site_id == "site-01"
    assert created.category == "Boundary Breach"
    assert created.severity == "critical"
    assert created.detected_hectares == 0.16
