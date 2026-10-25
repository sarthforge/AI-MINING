import numpy as np
from affine import Affine

from app.ml.vectorize import mask_to_polygons, pixel_hectares


def test_pixel_hectares():
    assert pixel_hectares(16) == 0.16


def test_mask_to_polygons_tiny():
    mask = np.zeros((8, 8), dtype=bool)
    mask[2:6, 2:6] = True
    transform = Affine.translation(-53.74, -4.30) @ Affine.scale(0.0001, -0.0001)
    polys = mask_to_polygons(mask, transform)
    assert len(polys) >= 1
    assert polys[0].svg_points
    assert " " in polys[0].svg_points or "," in polys[0].svg_points
