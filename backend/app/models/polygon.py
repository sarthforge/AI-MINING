from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.site import MiningSite


class OverlayPolygon(Base):
    __tablename__ = "overlay_polygon"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    site_id: Mapped[str] = mapped_column(ForeignKey("mining_site.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    poly_type: Mapped[str] = mapped_column(String, nullable=False)
    area_ha: Mapped[float] = mapped_column(nullable=False)
    color: Mapped[str] = mapped_column(String, nullable=False)
    stroke_color: Mapped[str] = mapped_column(String, nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    points: Mapped[str] = mapped_column(Text, nullable=False)
    # shortcut: Text until NDVI writes WKT/EWKB; schema.sql still has geometry(Polygon,4326)
    geom: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")

    site: Mapped[MiningSite] = relationship(back_populates="polygons")
