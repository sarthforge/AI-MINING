"""NDVI change detection (PRD §12) with numpy + rasterio."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import rasterio
from rasterio.features import sieve

from app.config import settings

PIXEL_HA = 0.01  # 10 m Sentinel-2 pixel
BARE_NDVI = 0.2
MIN_BLOB_PIXELS = 5
CLOUD_SCL = frozenset({3, 8, 9, 10})
MAX_CLOUD_FRAC = 0.4


def compute_ndvi(red: np.ndarray, nir: np.ndarray) -> np.ndarray:
    red_f = red.astype("float32")
    nir_f = nir.astype("float32")
    with np.errstate(divide="ignore", invalid="ignore"):
        return np.where((nir_f + red_f) == 0, np.nan, (nir_f - red_f) / (nir_f + red_f))


def _cloud_frac(scl: np.ndarray | None) -> float:
    if scl is None:
        return 0.0
    return float(np.isin(scl, list(CLOUD_SCL)).mean())


def apply_cloud_mask(ndvi: np.ndarray, scl: np.ndarray | None) -> np.ndarray:
    if scl is None:
        return ndvi
    out = ndvi.copy()
    out[np.isin(scl, list(CLOUD_SCL))] = np.nan
    return out


def change_mask(
    ndvi_baseline: np.ndarray,
    ndvi_current: np.ndarray,
    *,
    drop_threshold: float | None = None,
) -> np.ndarray:
    thr = settings.ndvi_drop_threshold if drop_threshold is None else drop_threshold
    drop = ndvi_baseline - ndvi_current
    raw = (drop > thr) & (ndvi_current < BARE_NDVI) & np.isfinite(drop)
    mask_u8 = raw.astype("uint8")
    if mask_u8.any():
        mask_u8 = sieve(mask_u8, size=MIN_BLOB_PIXELS)
    return mask_u8.astype(bool)


@dataclass(frozen=True)
class NdviChangeResult:
    ndvi_baseline: float
    ndvi_current: float
    detected_hectares: float
    confidence: float
    changed_pixels: int


def detect_change(
    red_b: np.ndarray,
    nir_b: np.ndarray,
    red_c: np.ndarray,
    nir_c: np.ndarray,
    *,
    scl_b: np.ndarray | None = None,
    scl_c: np.ndarray | None = None,
    drop_threshold: float | None = None,
) -> NdviChangeResult:
    if max(_cloud_frac(scl_b), _cloud_frac(scl_c)) > MAX_CLOUD_FRAC:
        raise ValueError("too cloudy, try other dates")

    nb = apply_cloud_mask(compute_ndvi(red_b, nir_b), scl_b)
    nc = apply_cloud_mask(compute_ndvi(red_c, nir_c), scl_c)
    mask = change_mask(nb, nc, drop_threshold=drop_threshold)
    changed = int(mask.sum())
    drop = nb - nc
    mean_drop = float(np.nanmean(drop[mask])) if changed else 0.0
    # heuristic: mean NDVI drop + blob size (labelled suspected in the UI)
    confidence = round(min(99.0, max(0.0, mean_drop * 80.0 + min(changed, 100) * 0.15)), 2)

    return NdviChangeResult(
        ndvi_baseline=round(float(np.nanmean(nb)), 3),
        ndvi_current=round(float(np.nanmean(nc)), 3),
        detected_hectares=round(changed * PIXEL_HA, 2),
        confidence=confidence,
        changed_pixels=changed,
    )


def read_red_nir(path: str | Path) -> tuple[np.ndarray, np.ndarray]:
    """Read a 2-band GeoTIFF: band 1 = red (B04), band 2 = NIR (B08)."""
    with rasterio.open(path) as src:
        if src.count < 2:
            raise ValueError(f"{path} needs at least 2 bands (red, nir)")
        return src.read(1), src.read(2)


def detect_change_from_geotiffs(
    baseline_path: str | Path,
    current_path: str | Path,
    *,
    drop_threshold: float | None = None,
) -> NdviChangeResult:
    red_b, nir_b = read_red_nir(baseline_path)
    red_c, nir_c = read_red_nir(current_path)
    return detect_change(red_b, nir_b, red_c, nir_c, drop_threshold=drop_threshold)
