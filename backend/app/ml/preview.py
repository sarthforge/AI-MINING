"""True-colour PNG stretch + optional Supabase Storage upload."""

from __future__ import annotations

import io
from typing import Any

import numpy as np

from app.config import settings


def _stretch(band: np.ndarray) -> np.ndarray:
    finite = band[np.isfinite(band)]
    if finite.size == 0:
        return np.zeros(band.shape, dtype=np.uint8)
    lo, hi = np.percentile(finite, (2, 98))
    if hi <= lo:
        hi = lo + 1
    clipped = np.clip((band - lo) / (hi - lo), 0, 1)
    return (clipped * 255).astype(np.uint8)


def render_true_color_png(
    red: np.ndarray,
    green: np.ndarray | None,
    blue: np.ndarray | None,
) -> bytes:
    from PIL import Image

    g = green if green is not None else red
    b = blue if blue is not None else red
    rgb = np.dstack([_stretch(red), _stretch(g), _stretch(b)])
    img = Image.fromarray(rgb, mode="RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def upload_preview(png_bytes: bytes, object_path: str) -> str | None:
    """Upload PNG to Supabase Storage; return public URL or None if not configured."""
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None
    try:
        from supabase import create_client
    except ImportError:
        return None

    client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    bucket = settings.storage_bucket
    client.storage.from_(bucket).upload(
        object_path,
        png_bytes,
        file_options={"content-type": "image/png", "upsert": "true"},
    )
    return client.storage.from_(bucket).get_public_url(object_path)
