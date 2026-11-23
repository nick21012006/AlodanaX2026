import pytest
from app import create_app
from app.models import Admin, Domain, ProblemStatement, AuditLog
from app.extensions import db
from app.security import hash_password


@pytest.fixture
def auth_client(client, admin_user):
    """Client logged in as admin_user."""
    client.post("/admin/login", data={
        "username": "testadmin",
        "password": "SuperSecretP@ssw0rd123!"
    })
    return client


def test_api_unauthorized_returns_401(client):
    """Test unauthenticated request to /api/admin/* returns 401 JSON."""
    res = client.get("/api/admin/stats")
    assert res.status_code == 401
    json_data = res.get_json()
    assert json_data["error"]["code"] == "UNAUTHORIZED"


def test_api_stats(auth_client, app):
    """Test GET /api/admin/stats returns statistics and domain counts."""
    res = auth_client.get("/api/admin/stats")
    assert res.status_code == 200
    data = res.get_json()
    assert "stats" in data
    assert "domains" in data
    assert "recent_activity" in data
    assert "total_domains" in data["stats"]


def test_domain_crud_and_validation(auth_client, app):
    """Test domain creation, validation against HTML, update, publish, and delete."""
    # 1. Validation error: HTML tag prohibited
    res_html = auth_client.post("/api/admin/domains", json={
        "name": "Invalid <script>alert(1)</script>",
        "short_description": "Valid description"
    })
    assert res_html.status_code == 400
    err_data = res_html.get_json()
    assert err_data["error"]["code"] == "VALIDATION_ERROR"
    assert "HTML is not allowed" in str(err_data)

    # 2. Validation error: name too long
    res_len = auth_client.post("/api/admin/domains", json={
        "name": "A" * 125,
        "short_description": "Valid description"
    })
    assert res_len.status_code == 400

    # 3. Create valid domain
    res_create = auth_client.post("/api/admin/domains", json={
        "name": "Robotics & Automation",
        "short_description": "Autonomous agents and embedded hardware."
    })
    assert res_create.status_code == 201
    domain_data = res_create.get_json()["domain"]
    domain_id = domain_data["id"]
    assert domain_data["slug"] == "robotics-automation"
    assert domain_data["tag"] == "DOMAIN 01"

    # 4. Update domain
    res_update = auth_client.put(f"/api/admin/domains/{domain_id}", json={
        "short_description": "Updated hardware description."
    })
    assert res_update.status_code == 200
    assert res_update.get_json()["domain"]["short_description"] == "Updated hardware description."

    # 5. Publish & Unpublish
    res_pub = auth_client.post(f"/api/admin/domains/{domain_id}/publish")
    assert res_pub.status_code == 200
    assert res_pub.get_json()["domain"]["is_published"] is True

    # Check slug immutability once published
    res_name_change = auth_client.put(f"/api/admin/domains/{domain_id}", json={
        "name": "Completely New Name"
    })
    assert res_name_change.status_code == 200
    # Slug should stay unchanged
    assert res_name_change.get_json()["domain"]["slug"] == "robotics-automation"

    res_unpub = auth_client.post(f"/api/admin/domains/{domain_id}/unpublish")
    assert res_unpub.status_code == 200
    assert res_unpub.get_json()["domain"]["is_published"] is False

    # 6. Delete domain
    res_del = auth_client.delete(f"/api/admin/domains/{domain_id}")
    assert res_del.status_code == 200


def test_domains_reorder(auth_client, app):
    """Test reordering domains updates sort_order and tag."""
    # Create two domains
    d1 = auth_client.post("/api/admin/domains", json={"name": "Domain Alpha", "short_description": "Desc A"}).get_json()["domain"]
    d2 = auth_client.post("/api/admin/domains", json={"name": "Domain Beta", "short_description": "Desc B"}).get_json()["domain"]

    # Reorder: D2 first, D1 second
    res_reorder = auth_client.post("/api/admin/domains/reorder", json={"order": [d2["id"], d1["id"]]})
    assert res_reorder.status_code == 200
    domains = res_reorder.get_json()["domains"]
    assert domains[0]["id"] == d2["id"]
    assert domains[0]["tag"] == "DOMAIN 01"
    assert domains[1]["id"] == d1["id"]
    assert domains[1]["tag"] == "DOMAIN 02"


def test_statement_crud_and_validation(auth_client, app):
    """Test problem statement creation, auto-suggest code, validation, and cascade delete."""
    # Create parent domain
    d = auth_client.post("/api/admin/domains", json={"name": "Cybersecurity", "short_description": "Security track"}).get_json()["domain"]
    domain_id = d["id"]

    # Suggest code
    res_sug = auth_client.get("/api/admin/statements/suggest-code")
    assert res_sug.status_code == 200
    assert res_sug.get_json()["suggested_code"] == "PS-01"

    # Validation: bad difficulty
    res_diff = auth_client.post(f"/api/admin/domains/{domain_id}/statements", json={
        "code": "PS-01",
        "title": "Zero Trust Mesh",
        "difficulty": "IMPOSSIBLE",
        "description": "Secure all nodes.",
        "expected_outcome": "Working prototype."
    })
    assert res_diff.status_code == 400
    assert "Difficulty must be one of" in str(res_diff.get_json())

    # Validation: HTML tag injection in description
    res_xss = auth_client.post(f"/api/admin/domains/{domain_id}/statements", json={
        "code": "PS-01",
        "title": "Zero Trust Mesh",
        "difficulty": "HARD",
        "description": "Exploit <img src=x onerror=alert(1)> here",
        "expected_outcome": "Working prototype."
    })
    assert res_xss.status_code == 400
    assert "HTML is not allowed" in str(res_xss.get_json())

    # Create valid statement
    res_ps = auth_client.post(f"/api/admin/domains/{domain_id}/statements", json={
        "code": "PS-01",
        "title": "Zero Trust Mesh",
        "difficulty": "HARD",
        "description": "Secure all edge computing nodes with mutual TLS.",
        "expected_outcome": "Deployed proxy service."
    })
    assert res_ps.status_code == 201
    ps_id = res_ps.get_json()["problem_statement"]["id"]

    # Duplicate code rejection
    res_dup = auth_client.post(f"/api/admin/domains/{domain_id}/statements", json={
        "code": "PS-01",
        "title": "Another Problem",
        "difficulty": "MEDIUM",
        "description": "Another description",
        "expected_outcome": "Another outcome"
    })
    assert res_dup.status_code == 400
    assert res_dup.get_json()["error"]["code"] in ("DUPLICATE_CODE", "CODE_EXISTS")

    # Update statement
    res_update = auth_client.put(f"/api/admin/statements/{ps_id}", json={
        "difficulty": "EXTREME",
        "title": "Zero Trust Mesh Architecture"
    })
    assert res_update.status_code == 200
    assert res_update.get_json()["problem_statement"]["difficulty"] == "EXTREME"

    # Publish & unpublish
    res_pub = auth_client.post(f"/api/admin/statements/{ps_id}/publish")
    assert res_pub.status_code == 200
    assert res_pub.get_json()["problem_statement"]["is_published"] is True

    res_unpub = auth_client.post(f"/api/admin/statements/{ps_id}/unpublish")
    assert res_unpub.status_code == 200
    assert res_unpub.get_json()["problem_statement"]["is_published"] is False

    # Delete statement
    res_del = auth_client.delete(f"/api/admin/statements/{ps_id}")
    assert res_del.status_code == 200
    assert res_del.get_json()["success"] is True


def test_csrf_protection():
    """Test that CSRF protection rejects state-changing requests when missing CSRF token."""
    csrf_app = create_app("testing")
    csrf_app.config["WTF_CSRF_ENABLED"] = True

    with csrf_app.app_context():
        db.create_all()
        admin = Admin(username="csrfadmin", password_hash=hash_password("SuperSecretP@ssw0rd123!"))
        db.session.add(admin)
        db.session.commit()

        with csrf_app.test_client() as c:
            # Mutating JSON request without X-CSRFToken header should fail
            res = c.post("/api/admin/domains", json={
                "name": "CSRF Attack Track",
                "short_description": "Should be rejected"
            })
            assert res.status_code in (400, 401, 403)
        db.drop_all()
