"""Assert API schema JSON keys match src/types/index.ts field names."""

from datetime import date, datetime, timezone

from app.schemas import MiningSiteOut, MonthlyChangePointOut, OverlayPolygonOut, SatelliteAlertOut

MINING_SITE_KEYS = {
    "id",
    "code",
    "name",
    "region",
    "country",
    "latitude",
    "longitude",
    "formattedCoordinates",
    "totalAreaHa",
    "newExcavationHa",
    "changePercentage",
    "confidenceScore",
    "concessionStatus",
    "alertStatus",
    "mineralTarget",
    "lastObservationDate",
    "baselineDate",
    "ndviBaseline",
    "ndviCurrent",
    "sensor",
    "resolution",
    "notes",
    "currentImageUrl",
    "baselineImageUrl",
    "polygons",
}

OVERLAY_KEYS = {
    "id",
    "title",
    "type",
    "areaHa",
    "color",
    "strokeColor",
    "label",
    "points",
    "description",
}

ALERT_KEYS = {
    "id",
    "siteId",
    "siteName",
    "region",
    "title",
    "description",
    "severity",
    "detectedHectares",
    "confidence",
    "timestamp",
    "coordinates",
    "category",
    "dismissed",
}

HISTORY_KEYS = {
    "month",
    "date",
    "permittedCapHa",
    "totalExcavationHa",
    "unauthorizedHa",
    "vegetationIndexNDVI",
    "turbidityIndex",
}


def test_mining_site_camel_case_keys():
    site = MiningSiteOut(
        id="site-01",
        code="AOI-04",
        name="Test",
        region="Pará",
        country="Brazil",
        latitude=-4.3,
        longitude=-53.7,
        formatted_coordinates="x",
        total_area_ha=1.0,
        new_excavation_ha=0.1,
        change_percentage=1.0,
        confidence_score=90.0,
        concession_status="Licensed",
        alert_status="Normal Compliance",
        mineral_target="Gold",
        last_observation_date=date(2026, 9, 28),
        baseline_date=date(2025, 11, 14),
        ndvi_baseline=0.7,
        ndvi_current=0.3,
        sensor="S2",
        resolution="10m",
        notes="",
        current_image_url="/a.jpg",
        baseline_image_url="/b.jpg",
        polygons=[],
    )
    assert set(site.model_dump(by_alias=True)) == MINING_SITE_KEYS


def test_overlay_polygon_type_alias():
    poly = OverlayPolygonOut.model_validate(
        {
            "id": "poly-1",
            "title": "t",
            "poly_type": "suspected",
            "area_ha": 1.0,
            "color": "c",
            "stroke_color": "#fff",
            "label": "l",
            "points": "0,0 1,1",
            "description": "",
        }
    )
    assert set(poly.model_dump(by_alias=True)) == OVERLAY_KEYS
    assert poly.model_dump(by_alias=True)["type"] == "suspected"


def test_alert_timestamp_alias():
    alert = SatelliteAlertOut.model_validate(
        {
            "id": "alt-001",
            "site_id": "site-01",
            "site_name": "Test",
            "region": "Pará",
            "title": "t",
            "description": "d",
            "severity": "critical",
            "detected_hectares": 2.4,
            "confidence": 94.2,
            "detected_at": datetime(2026, 9, 28, 14, 22, tzinfo=timezone.utc),
            "coordinates": "x",
            "category": "Boundary Breach",
            "dismissed": False,
        }
    )
    dumped = alert.model_dump(by_alias=True)
    assert set(dumped) == ALERT_KEYS
    assert "timestamp" in dumped
    assert "detected_at" not in dumped


def test_history_ndvi_alias():
    point = MonthlyChangePointOut.model_validate(
        {
            "month_label": "Jan 26",
            "obs_date": "2026-01-15",
            "permitted_cap_ha": 16.0,
            "total_excavation_ha": 14.8,
            "unauthorized_ha": 0.0,
            "vegetation_index_ndvi": 0.74,
            "turbidity_index": 12,
        }
    )
    dumped = point.model_dump(by_alias=True)
    assert set(dumped) == HISTORY_KEYS
    assert dumped["vegetationIndexNDVI"] == 0.74
