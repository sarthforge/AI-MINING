def test_get_telemetry(client):
    r = client.get("/api/v1/telemetry")
    assert r.status_code == 200
    body = r.json()
    assert body["constellation"].startswith("Copernicus")
    assert body["nextPassETA"].startswith("2h 41m")
    assert "cloudCoverage" in body
    assert "cadastreSync" in body
