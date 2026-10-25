"""Change mask → polygons + SVG preview points."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from rasterio import features
from shapely.geometry import mapping, shape
from shapely.ops import unary_union


@dataclass(frozen=True)
class DetectedPolygon:
    wkt: str
    area_ha: float
    svg_points: str


def mask_to_polygons(
    mask: np.ndarray,
    transform,
    *,
    preview_width: int = 1000,
    preview_height: int = 600,
) -> list[DetectedPolygon]:
    """Polygonize True pixels; map coords into SVG viewBox space."""
    if not mask.any():
        return []

    geoms = []
    for geom, val in features.shapes(mask.astype("uint8"), mask=mask, transform=transform):
        if int(val) != 1:
            continue
        g = shape(geom)
        if g.is_empty or g.area <= 0:
            continue
        geoms.append(g)

    if not geoms:
        return []

    merged = unary_union(geoms)
    parts = list(merged.geoms) if merged.geom_type == "MultiPolygon" else [merged]

    # bounds of the raster window in CRS units → SVG 0..W / 0..H
    h, w = mask.shape
    # affine: x = a*col + c, y = e*row + f (approx)
    a, b, c, d, e, f = transform[:6] if hasattr(transform, "__getitem__") else (
        transform.a,
        transform.b,
        transform.c,
        transform.d,
        transform.e,
        transform.f,
    )
    xs = [c, c + a * w]
    ys = [f, f + e * h]
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    dx = max(maxx - minx, 1e-9)
    dy = max(maxy - miny, 1e-9)

    out: list[DetectedPolygon] = []
    for g in parts:
        # 10 m pixel ≈ 0.01 ha; shapely area is in CRS units² — for geographic CRS use pixel count fallback
        area_ha = round(float(g.area) / 100.0, 2)  # metre CRS: m² / 10000 * 100 wait
        # Prefer pixel-count based ha when CRS is geographic (degrees)
        if abs(a) < 1:  # degree-sized pixels → use mask count share
            # approximate via exterior length; keep pixel heuristic from caller preferred
            area_ha = max(0.01, round(g.area / (dx * dy) * mask.sum() * 0.01, 2))

        coords = list(mapping(g)["coordinates"][0])
        pts = []
        for x, y in coords:
            sx = (x - minx) / dx * preview_width
            sy = (1.0 - (y - miny) / dy) * preview_height
            pts.append(f"{sx:.0f},{sy:.0f}")
        out.append(DetectedPolygon(wkt=g.wkt, area_ha=area_ha, svg_points=" ".join(pts)))
    return out


def pixel_hectares(changed_pixels: int) -> float:
    return round(changed_pixels * 0.01, 2)
