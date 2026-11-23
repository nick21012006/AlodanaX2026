import pytest
from flask import session
from app.models import Admin, AuditLog
from app.extensions import db
from app.security import verify_password


def test_login_page_renders(client):
    """Test GET /admin/login returns 200 with login form."""
    res = client.get("/admin/login")
    assert res.status_code == 200
    assert b"ALODANAX ADMIN" in res.data
    assert b"AUTHENTICATE" in res.data


def test_login_success(client, admin_user):
    """Test valid admin credentials log in and redirect."""
    res = client.post("/admin/login", data={
        "username": "testadmin",
        "password": "SuperSecretP@ssw0rd123!"
    }, follow_redirects=False)

    assert res.status_code == 302
    assert res.location == "/admin/"

    # Check audit log
    log = AuditLog.query.filter_by(action="login_ok", admin_id=admin_user.id).first()
    assert log is not None


def test_login_invalid_credentials_generic_message(client, admin_user):
    """Test wrong password and nonexistent user return identical generic error."""
    # Unknown user
    res1 = client.post("/admin/login", data={
        "username": "nonexistent_admin",
        "password": "SuperSecretP@ssw0rd123!"
    })
    assert res1.status_code == 200
    assert b"Invalid username or password." in res1.data

    # Wrong password for existing user
    res2 = client.post("/admin/login", data={
        "username": "testadmin",
        "password": "WrongPassword123!"
    })
    assert res2.status_code == 200
    assert b"Invalid username or password." in res2.data


def test_login_account_lockout(client, app, admin_user):
    """Test 5 consecutive failed logins locks the account."""
    for i in range(5):
        res = client.post("/admin/login", data={
            "username": "testadmin",
            "password": "IncorrectPassword123!"
        })
        assert res.status_code == 200

    # 6th attempt should report account locked
    res_locked = client.post("/admin/login", data={
        "username": "testadmin",
        "password": "SuperSecretP@ssw0rd123!"
    })
    assert res_locked.status_code == 200
    assert b"Account is temporarily locked" in res_locked.data


def test_logout(client, admin_user):
    """Test logout clears session and redirects to login."""
    # Log in first
    client.post("/admin/login", data={
        "username": "testadmin",
        "password": "SuperSecretP@ssw0rd123!"
    })

    # Logout
    res = client.post("/admin/logout", follow_redirects=True)
    assert res.status_code == 200
    assert b"You have been securely logged out." in res.data


def test_account_password_change(client, admin_user, app):
    """Test changing password from account page."""
    # Log in
    client.post("/admin/login", data={
        "username": "testadmin",
        "password": "SuperSecretP@ssw0rd123!"
    })

    # Change password
    res = client.post("/admin/account", data={
        "current_password": "SuperSecretP@ssw0rd123!",
        "new_password": "BrandNewSuperSecretP@ss123!",
        "confirm_password": "BrandNewSuperSecretP@ss123!"
    })
    assert res.status_code == 200
    assert b"Password updated successfully." in res.data

    with app.app_context():
        updated = db.session.get(Admin, admin_user.id)
        assert verify_password(updated.password_hash, "BrandNewSuperSecretP@ss123!")


def test_security_headers(client):
    """Test security headers on response."""
    res = client.get("/admin/login")
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("Referrer-Policy") == "same-origin"
    assert "default-src 'self'" in res.headers.get("Content-Security-Policy", "")
    assert "no-store" in res.headers.get("Cache-Control", "")


def test_unauthenticated_redirect(client):
    """Test unauthenticated access to admin routes redirects to login."""
    res = client.get("/admin/account", follow_redirects=False)
    assert res.status_code == 302
    assert "/admin/login" in res.location
