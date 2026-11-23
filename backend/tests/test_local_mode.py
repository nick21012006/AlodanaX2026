import pytest
from app.config import Config


def test_host_binding_validation():
    """Verify that binding to non-local IP addresses is strictly rejected."""
    # Local loopbacks are allowed
    assert Config.validate_host("127.0.0.1", "development") is True
    assert Config.validate_host("localhost", "development") is True

    # Non-local hosts raise ValueError in development/local mode
    with pytest.raises(ValueError) as exc1:
        Config.validate_host("0.0.0.0", "development")
    assert "refuses non-local host '0.0.0.0'" in str(exc1.value)

    with pytest.raises(ValueError) as exc2:
        Config.validate_host("192.168.1.50", "development")
    assert "refuses non-local host '192.168.1.50'" in str(exc2.value)


def test_no_public_api_routes(client):
    """Verify that public API endpoints have been completely removed."""
    res_hackathon = client.get("/api/public/hackathon")
    assert res_hackathon.status_code == 404

    res_team = client.get("/api/public/team")
    assert res_team.status_code == 404

    res_media = client.get("/media/team/some-photo.webp")
    assert res_media.status_code == 404


def test_cors_disabled(client):
    """Verify that CORS response headers are not present."""
    res = client.get("/admin/login")
    assert "Access-Control-Allow-Origin" not in res.headers
    assert "Access-Control-Allow-Methods" not in res.headers


def test_session_cookie_settings(app):
    """Verify session cookie security settings in local development/test mode."""
    assert app.config["SESSION_COOKIE_SECURE"] is False
    assert app.config["SESSION_COOKIE_HTTPONLY"] is True
    assert app.config["SESSION_COOKIE_SAMESITE"] in ("Strict", "Lax")
