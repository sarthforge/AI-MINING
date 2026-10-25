from collections.abc import Generator
from datetime import date, datetime, timezone
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401 — register all tables
from app.auth import require_admin
from app.db import Base, get_db
from app.main import app
from app.models import MiningSite, MonthlyChangePoint, OverlayPolygon, Profile, SatelliteAlert
from app.models.telemetry import TelemetryStatus


@pytest.fixture()
def admin_user() -> Profile:
    return Profile(
        id=uuid4(),
        email="admin@test.local",
        full_name="Test Admin",
        role="admin",
    )


@pytest.fixture()
def db(admin_user: Profile) -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = SessionLocal()

    session.add(admin_user)
    site = MiningSite(
        id="site-01",
        code="AOI-04",
        name="Rio Tapajós River Basin — Sector 7",
        region="Pará State",
        country="Brazil",
        latitude=-4.3056,
        longitude=-53.7364,
        formatted_coordinates="04°18'20\" S, 53°44'11\" W",
        total_area_ha=18.6,
        new_excavation_ha=2.4,
        change_percentage=24.8,
        confidence_score=94.2,
        concession_status="Boundary Breach",
        alert_status="High Priority",
        mineral_target="Alluvial Gold & Aggregate",
        last_observation_date=date(2026, 9, 28),
        baseline_date=date(2025, 11, 14),
        ndvi_baseline=0.78,
        ndvi_current=0.29,
        sensor="Sentinel-2 MSI",
        resolution="10m",
        notes="test",
        current_image_url="/satellite_current.jpg",
        baseline_image_url="/satellite_baseline.jpg",
    )
    site2 = MiningSite(
        id="site-06",
        code="AOI-02",
        name="Atacama Salar Lithium Edge Quad 4",
        region="Antofagasta",
        country="Chile",
        latitude=-23.86,
        longitude=-68.23,
        formatted_coordinates="x",
        total_area_ha=88.2,
        new_excavation_ha=0.3,
        change_percentage=1.1,
        confidence_score=91.0,
        concession_status="Licensed",
        alert_status="Normal Compliance",
        mineral_target="Lithium",
        last_observation_date=date(2026, 9, 28),
        baseline_date=date(2026, 1, 1),
        ndvi_baseline=0.12,
        ndvi_current=0.11,
        sensor="Landsat-9",
        resolution="30m",
        notes="",
        current_image_url="/site_atacama.jpg",
        baseline_image_url="/satellite_baseline.jpg",
    )
    session.add_all([site, site2])
    session.add_all(
        [
            OverlayPolygon(
                id="site-01:poly-unauthorized",
                site_id="site-01",
                title="Zone Alpha",
                poly_type="suspected",
                area_ha=2.4,
                color="rgba(239, 68, 68, 0.35)",
                stroke_color="#ef4444",
                label="ALERT",
                points="200,320 320,290",
                description="breach",
            ),
            OverlayPolygon(
                id="site-01:poly-concession",
                site_id="site-01",
                title="Concession",
                poly_type="concession",
                area_ha=16.0,
                color="rgba(16, 185, 129, 0.12)",
                stroke_color="#10b981",
                label="Lease",
                points="120,240 680,210",
                description="ok",
            ),
            SatelliteAlert(
                id="alt-001",
                site_id="site-01",
                title="Boundary breach detected",
                description="Outside cadastre.",
                severity="critical",
                detected_hectares=2.4,
                confidence=94.2,
                detected_at=datetime(2026, 9, 28, 14, 22, 4, tzinfo=timezone.utc),
                coordinates="04°18'20\" S, 53°44'11\" W",
                category="Boundary Breach",
                dismissed=False,
            ),
            MonthlyChangePoint(
                site_id="site-01",
                month_label="Jan 26",
                obs_date=date(2026, 1, 15),
                permitted_cap_ha=16.0,
                total_excavation_ha=14.8,
                unauthorized_ha=0.0,
                vegetation_index_ndvi=0.74,
                turbidity_index=12,
            ),
            MonthlyChangePoint(
                site_id="site-01",
                month_label="Feb 26",
                obs_date=date(2026, 2, 15),
                permitted_cap_ha=16.0,
                total_excavation_ha=15.1,
                unauthorized_ha=0.1,
                vegetation_index_ndvi=0.71,
                turbidity_index=15,
            ),
            TelemetryStatus(
                id=1,
                constellation="Copernicus Sentinel-2 & WorldView-3 Sync",
                orbit_mode="Sun-synchronous, 786 km Altitude",
                last_pass_utc="2026-09-28 14:22:04",
                next_pass_eta="2h 41m (Sentinel-2B Pass #48)",
                cloud_coverage="4.2% (Clear Optical Quality)",
                sun_azimuth="128.4°",
                sensor_bands="B02 (Blue), B03 (Green), B04 (Red), B08 (NIR), B11 (SWIR)",
                ground_sampling_distance="10m Native / 0.3m Sharpened",
                cadastre_sync="ANM Federal Database 2026 Q3 (Verified)",
            ),
        ]
    )
    session.commit()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)
        engine.dispose()


@pytest.fixture()
def client(
    db: Session,
    admin_user: Profile,
    monkeypatch: pytest.MonkeyPatch,
) -> Generator[TestClient, None, None]:
    TestSession = sessionmaker(bind=db.get_bind(), autoflush=False, autocommit=False)
    monkeypatch.setattr("app.db.SessionLocal", TestSession)

    def _override_db() -> Generator[Session, None, None]:
        yield db

    def _override_admin() -> Profile:
        return admin_user

    app.dependency_overrides[get_db] = _override_db
    app.dependency_overrides[require_admin] = _override_admin
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
