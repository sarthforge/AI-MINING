from __future__ import annotations

from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, Float, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.alert import SatelliteAlert
    from app.models.history import MonthlyChangePoint
    from app.models.polygon import OverlayPolygon


class MiningSite(Base):
    __tablename__ = "mining_site"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    region: Mapped[str] = mapped_column(String, nullable=False)
    country: Mapped[str] = mapped_column(String, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    # location geography is a DB-generated column; not mapped
    formatted_coordinates: Mapped[str] = mapped_column(String, nullable=False)
    total_area_ha: Mapped[float] = mapped_column(nullable=False)
    new_excavation_ha: Mapped[float] = mapped_column(nullable=False)
    change_percentage: Mapped[float] = mapped_column(nullable=False)
    confidence_score: Mapped[float] = mapped_column(nullable=False)
    concession_status: Mapped[str] = mapped_column(String, nullable=False)
    alert_status: Mapped[str] = mapped_column(String, nullable=False)
    mineral_target: Mapped[str] = mapped_column(String, nullable=False)
    last_observation_date: Mapped[date] = mapped_column(Date, nullable=False)
    baseline_date: Mapped[date] = mapped_column(Date, nullable=False)
    ndvi_baseline: Mapped[float] = mapped_column(nullable=False)
    ndvi_current: Mapped[float] = mapped_column(nullable=False)
    sensor: Mapped[str] = mapped_column(String, nullable=False)
    resolution: Mapped[str] = mapped_column(String, nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    current_image_url: Mapped[str] = mapped_column(String, nullable=False)
    baseline_image_url: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    polygons: Mapped[list[OverlayPolygon]] = relationship(back_populates="site", cascade="all, delete-orphan")
    alerts: Mapped[list[SatelliteAlert]] = relationship(back_populates="site", cascade="all, delete-orphan")
    history: Mapped[list[MonthlyChangePoint]] = relationship(back_populates="site", cascade="all, delete-orphan")
