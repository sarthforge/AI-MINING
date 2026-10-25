from app.auth import current_user, require_admin
from app.errors import AppError
from app.main import app
from app.models import Profile


def test_auth_me(client, admin_user):
    app.dependency_overrides[current_user] = lambda: admin_user
    try:
        r = client.get("/api/v1/auth/me")
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == "admin@test.local"
        assert body["role"] == "admin"
        assert "id" in body
    finally:
        app.dependency_overrides.pop(current_user, None)


def test_write_forbidden_for_viewer(client, admin_user: Profile):
    def _deny() -> Profile:
        raise AppError(403, "FORBIDDEN", "Admin only")

    app.dependency_overrides[require_admin] = _deny
    try:
        r = client.patch("/api/v1/alerts/alt-001/dismiss")
        assert r.status_code == 403
        assert r.json()["error"] == "FORBIDDEN"
    finally:
        app.dependency_overrides[require_admin] = lambda: admin_user
