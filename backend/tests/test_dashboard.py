def test_dashboard_kpis(client):
    r = client.get("/api/v1/dashboard/kpis")
    assert r.status_code == 200
    body = r.json()
    assert body["totalSites"] == 2
    assert body["activeAlerts"] == 1
    assert body["criticalAlerts"] == 1
    assert body["totalNewExcavationHa"] == 2.7
    assert body["boundaryBreaches"] == 1
    assert "averageConfidence" in body
    assert "averageNdviDrop" in body
