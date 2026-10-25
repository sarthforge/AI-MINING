from datetime import date
from typing import Literal

from app.schemas.common import CamelModel
from app.schemas.polygon import OverlayPolygonOut


class MiningSiteOut(CamelModel):
    id: str
    code: str
    name: str
    region: str
    country: str
    latitude: float
    longitude: float
    formatted_coordinates: str
    total_area_ha: float
    new_excavation_ha: float
    change_percentage: float
    confidence_score: float
    concession_status: Literal["Licensed", "Unlicensed", "Permit Expired", "Boundary Breach"]
    alert_status: Literal[
        "High Priority", "Investigation Required", "Normal Compliance", "Under Review"
    ]
    mineral_target: str
    last_observation_date: date
    baseline_date: date
    ndvi_baseline: float
    ndvi_current: float
    sensor: str
    resolution: str
    notes: str
    current_image_url: str
    baseline_image_url: str
    polygons: list[OverlayPolygonOut] | None = None
