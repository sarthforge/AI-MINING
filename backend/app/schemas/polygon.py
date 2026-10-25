from typing import Literal

from pydantic import AliasChoices, Field

from app.schemas.common import CamelModel


class OverlayPolygonOut(CamelModel):
    id: str
    title: str
    type: Literal["suspected", "concession", "pit", "water", "road"] = Field(
        validation_alias=AliasChoices("poly_type", "type"),
    )
    area_ha: float
    color: str
    stroke_color: str
    label: str
    points: str
    description: str
