def test_list_alerts(client):
    r = client.get("/api/v1/alerts")
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 1
    alert = body[0]
    assert alert["id"] == "alt-001"
    assert alert["siteId"] == "site-01"
    assert alert["siteName"] == "Rio Tapajós River Basin — Sector 7"
    assert alert["region"] == "Pará State"
    assert alert["severity"] == "critical"
    assert alert["detectedHectares"] == 2.4
    assert "timestamp" in alert
    assert alert["dismissed"] is False


def test_dismiss_alert(client):
    r = client.patch("/api/v1/alerts/alt-001/dismiss")
    assert r.status_code == 200
    assert r.json()["dismissed"] is True

    listed = client.get("/api/v1/alerts", params={"dismissed": True})
    assert listed.status_code == 200
    assert listed.json()[0]["id"] == "alt-001"


def test_dismiss_missing(client):
    r = client.patch("/api/v1/alerts/alt-missing/dismiss")
    assert r.status_code == 404
    assert r.json()["error"] == "NOT_FOUND"


def test_reset_alerts(client):
    client.patch("/api/v1/alerts/alt-001/dismiss")
    r = client.post("/api/v1/alerts/reset")
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 1
    assert body[0]["dismissed"] is False
