from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.site import MiningSite


class MonthlyChangePoint(Base):
    __tablename__ = "monthly_change_point"
    __table_args__ = (UniqueConstraint("site_id", "obs_date"),)

    # Integer PK so SQLite tests get AUTOINCREMENT; Postgres schema.sql still uses bigint identity
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    site_id: Mapped[str] = mapped_column(ForeignKey("mining_site.id", ondelete="CASCADE"), nullable=False)
    month_label: Mapped[str] = mapped_column(String, nullable=False)
    obs_date: Mapped[date] = mapped_column(Date, nullable=False)
    permitted_cap_ha: Mapped[float] = mapped_column(nullable=False)
    total_excavation_ha: Mapped[float] = mapped_column(nullable=False)
    unauthorized_ha: Mapped[float] = mapped_column(nullable=False)
    vegetation_index_ndvi: Mapped[float] = mapped_column(nullable=False)
    turbidity_index: Mapped[float] = mapped_column(nullable=False)

    site: Mapped[MiningSite] = relationship(back_populates="history")
