from datetime import datetime
from typing import Literal

from pydantic import AliasChoices, Field

from app.schemas.common import CamelModel


class SatelliteAlertOut(CamelModel):
    id: str
    site_id: str
    site_name: str
    region: str
    title: str
    description: str
    severity: Literal["critical", "warning", "info", "compliant"]
    detected_hectares: float
    confidence: float
    timestamp: datetime = Field(validation_alias=AliasChoices("detected_at", "timestamp"))
    coordinates: str
    category: Literal[
        "Boundary Breach",
        "Riparian Buffer Encroachment",
        "Unregistered Pit Expansion",
        "Tailings Plume",
    ]
    dismissed: bool
