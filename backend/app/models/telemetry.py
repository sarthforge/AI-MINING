from __future__ import annotations

from sqlalchemy import SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class TelemetryStatus(Base):
    __tablename__ = "telemetry_status"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True, default=1)
    constellation: Mapped[str | None] = mapped_column(String, nullable=True)
    orbit_mode: Mapped[str | None] = mapped_column(String, nullable=True)
    last_pass_utc: Mapped[str | None] = mapped_column(String, nullable=True)
    next_pass_eta: Mapped[str | None] = mapped_column(String, nullable=True)
    cloud_coverage: Mapped[str | None] = mapped_column(String, nullable=True)
    sun_azimuth: Mapped[str | None] = mapped_column(String, nullable=True)
    sensor_bands: Mapped[str | None] = mapped_column(String, nullable=True)
    ground_sampling_distance: Mapped[str | None] = mapped_column(String, nullable=True)
    cadastre_sync: Mapped[str | None] = mapped_column(String, nullable=True)
