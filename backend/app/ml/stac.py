"""STAC search + windowed COG band reads for Sentinel-2 L2A."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any

import numpy as np
import rasterio
from rasterio.enums import Resampling
from rasterio.warp import transform_bounds
from rasterio.windows import from_bounds

from app.config import settings


@dataclass(frozen=True)
class SceneBands:
    red: np.ndarray
    nir: np.ndarray
    scl: np.ndarray | None
    blue: np.ndarray | None = None
    green: np.ndarray | None = None
    transform: Any = None
    crs: Any = None


def site_bbox(lat: float, lon: float, *, km: float = 1.0) -> list[float]:
    """Approx ±km box in WGS84 [west, south, east, north]."""
    dlat = km / 111.0
    dlon = km / (111.0 * max(0.2, abs(np.cos(np.radians(lat)))))
    return [lon - dlon, lat - dlat, lon + dlon, lat + dlat]


def search_least_cloudy(bbox: list[float], around: date) -> dict[str, Any] | None:
    """Return the least-cloudy sentinel-2-l2a item assets dict, or None."""
    try:
        from pystac_client import Client
    except ImportError as exc:
        raise RuntimeError("pystac-client is not installed") from exc

    start = (around - timedelta(days=15)).isoformat()
    end = (around + timedelta(days=15)).isoformat()
    client = Client.open(settings.stac_url)
    search = client.search(
        collections=["sentinel-2-l2a"],
        bbox=bbox,
        datetime=f"{start}/{end}",
        query={"eo:cloud_cover": {"lt": settings.max_cloud_pct}},
        max_items=20,
    )
    items = list(search.items())
    if not items:
        return None
    items.sort(key=lambda it: float(it.properties.get("eo:cloud_cover", 100)))
    return items[0].assets


def _asset_href(assets: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        asset = assets.get(key)
        if asset is None:
            continue
        href = getattr(asset, "href", None) or (asset.get("href") if isinstance(asset, dict) else None)
        if href:
            return href
    return None


def read_windowed_bands(assets: dict[str, Any], bbox_wgs84: list[float]) -> SceneBands:
    """Read B04/B08/SCL (and B02/B03 when present) clipped to bbox."""
    red_href = _asset_href(assets, "red", "B04", "b04")
    nir_href = _asset_href(assets, "nir", "B08", "b08")
    if not red_href or not nir_href:
        raise FileNotFoundError("STAC item missing red/NIR assets")

    with rasterio.open(red_href) as src:
        left, bottom, right, top = transform_bounds("EPSG:4326", src.crs, *bbox_wgs84, densify_pts=21)
        window = from_bounds(left, bottom, right, top, transform=src.transform)
        red = src.read(1, window=window, boundless=True, fill_value=0).astype("float32")
        transform = src.window_transform(window)
        crs = src.crs

    with rasterio.open(nir_href) as src:
        left, bottom, right, top = transform_bounds("EPSG:4326", src.crs, *bbox_wgs84, densify_pts=21)
        window = from_bounds(left, bottom, right, top, transform=src.transform)
        nir = src.read(
            1,
            window=window,
            boundless=True,
            fill_value=0,
            out_shape=red.shape,
            resampling=Resampling.bilinear,
        ).astype("float32")

    scl = None
    scl_href = _asset_href(assets, "scl", "SCL", "BSC")
    if scl_href:
        with rasterio.open(scl_href) as src:
            left, bottom, right, top = transform_bounds("EPSG:4326", src.crs, *bbox_wgs84, densify_pts=21)
            window = from_bounds(left, bottom, right, top, transform=src.transform)
            scl = src.read(
                1,
                window=window,
                boundless=True,
                fill_value=0,
                out_shape=red.shape,
                resampling=Resampling.nearest,
            )

    blue = green = None
    blue_href = _asset_href(assets, "blue", "B02", "b02")
    green_href = _asset_href(assets, "green", "B03", "b03")
    if blue_href:
        with rasterio.open(blue_href) as src:
            left, bottom, right, top = transform_bounds("EPSG:4326", src.crs, *bbox_wgs84, densify_pts=21)
            window = from_bounds(left, bottom, right, top, transform=src.transform)
            blue = src.read(
                1,
                window=window,
                boundless=True,
                fill_value=0,
                out_shape=red.shape,
                resampling=Resampling.bilinear,
            ).astype("float32")
    if green_href:
        with rasterio.open(green_href) as src:
            left, bottom, right, top = transform_bounds("EPSG:4326", src.crs, *bbox_wgs84, densify_pts=21)
            window = from_bounds(left, bottom, right, top, transform=src.transform)
            green = src.read(
                1,
                window=window,
                boundless=True,
                fill_value=0,
                out_shape=red.shape,
                resampling=Resampling.bilinear,
            ).astype("float32")

    return SceneBands(red=red, nir=nir, scl=scl, blue=blue, green=green, transform=transform, crs=crs)


def load_scene_for_site(
    *,
    lat: float,
    lon: float,
    around: date,
) -> SceneBands:
    bbox = site_bbox(lat, lon)
    assets = search_least_cloudy(bbox, around)
    if assets is None:
        raise FileNotFoundError(f"No Sentinel-2 scene near {around.isoformat()} for AOI")
    return read_windowed_bands(assets, bbox)
