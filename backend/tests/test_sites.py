def test_list_sites(client):
    r = client.get("/api/v1/sites")
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 2
    assert body[0]["id"] == "site-01"
    assert "formattedCoordinates" in body[0]
    assert isinstance(body[0]["polygons"], list)
    assert body[0]["polygons"][0]["type"] == "suspected"


def test_get_site(client):
    r = client.get("/api/v1/sites/site-01")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == "site-01"
    assert body["code"] == "AOI-04"
    assert body["newExcavationHa"] == 2.4
    assert len(body["polygons"]) == 2


def test_get_site_not_found(client):
    r = client.get("/api/v1/sites/site-99")
    assert r.status_code == 404
    body = r.json()
    assert body["error"] == "NOT_FOUND"
    assert body["path"] == "/api/v1/sites/site-99"


def test_list_site_polygons(client):
    r = client.get("/api/v1/sites/site-01/polygons")
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 2
    assert body[0]["id"] == "poly-concession" or body[0]["id"] == "poly-unauthorized"
    assert "strokeColor" in body[0]
    assert "areaHa" in body[0]


def test_list_site_history(client):
    r = client.get("/api/v1/sites/site-01/history")
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 2
    assert body[0]["month"] == "Jan 26"
    assert body[0]["date"] == "2026-01-15"
    assert body[0]["vegetationIndexNDVI"] == 0.74
