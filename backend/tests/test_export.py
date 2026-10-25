def test_export_sites_csv(client):
    r = client.get("/api/v1/export/sites.csv")
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]
    text = r.text
    assert "site-01" in text
    assert "AOI-04" in text
    assert "totalAreaHa" in text.splitlines()[0]
