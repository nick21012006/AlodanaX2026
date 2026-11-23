import json
from pathlib import Path
import pytest
from app.extensions import db
from app.models import Domain, ProblemStatement, ExportState, AuditLog
from app.services.export_service import (
    build_export_payload,
    serialize_export_payload,
    compute_payload_hash,
    export_to_file,
    get_export_status
)


@pytest.fixture
def auth_client(client, admin_user):
    """Client logged in as admin_user."""
    client.post("/admin/login", data={
        "username": "testadmin",
        "password": "SuperSecretP@ssw0rd123!"
    })
    return client


def test_build_export_payload_filters_and_shapes(app):
    """Verify export payload only includes published domains with published statements."""
    with app.app_context():
        # 1. Published domain with 1 published statement & 1 unpublished statement
        d1 = Domain(
            slug="ai-track",
            name="AI & Autonomous Systems",
            short_description="Autonomous models and pipelines",
            sort_order=1,
            is_published=True
        )
        db.session.add(d1)
        db.session.commit()

        ps1 = ProblemStatement(
            domain_id=d1.id,
            code="PS-01",
            title="Edge Vision Inference",
            difficulty="HARD",
            description="Build real-time edge inference model",
            expected_outcome="Running containerized edge daemon",
            sort_order=1,
            is_published=True
        )
        ps2 = ProblemStatement(
            domain_id=d1.id,
            code="PS-02",
            title="Unpublished Model Statement",
            difficulty="MEDIUM",
            description="Draft statement",
            expected_outcome="Draft outcome",
            sort_order=2,
            is_published=False
        )
        db.session.add_all([ps1, ps2])

        # 2. Published domain with ZERO published statements (must be omitted)
        d2 = Domain(
            slug="cloud-track",
            name="Cloud Systems",
            short_description="Cloud native computing",
            sort_order=2,
            is_published=True
        )
        db.session.add(d2)
        db.session.commit()

        ps3 = ProblemStatement(
            domain_id=d2.id,
            code="PS-03",
            title="Unpublished Cloud PS",
            difficulty="MEDIUM",
            description="Draft statement",
            expected_outcome="Draft outcome",
            sort_order=1,
            is_published=False
        )
        db.session.add(ps3)

        # 3. Unpublished domain with published statement (must be omitted)
        d3 = Domain(
            slug="draft-track",
            name="Draft Track",
            short_description="Draft description",
            sort_order=3,
            is_published=False
        )
        db.session.add(d3)
        db.session.commit()

        ps4 = ProblemStatement(
            domain_id=d3.id,
            code="PS-04",
            title="Published PS in Draft Domain",
            difficulty="EASY",
            description="Description",
            expected_outcome="Outcome",
            sort_order=1,
            is_published=True
        )
        db.session.add(ps4)
        db.session.commit()

        payload = build_export_payload()

        assert payload["schemaVersion"] == 1
        assert "updatedAt" in payload
        assert len(payload["domains"]) == 1

        exported_d = payload["domains"][0]
        assert exported_d["slug"] == "ai-track"
        assert exported_d["name"] == "AI & Autonomous Systems"
        assert exported_d["tag"] == "DOMAIN 01"
        assert exported_d["shortDescription"] == "Autonomous models and pipelines"
        assert len(exported_d["problemStatements"]) == 1

        exported_ps = exported_d["problemStatements"][0]
        assert exported_ps["id"] == "PS-01"
        assert exported_ps["title"] == "Edge Vision Inference"
        assert exported_ps["difficulty"] == "HARD"
        assert exported_ps["description"] == "Build real-time edge inference model"
        assert exported_ps["expectedOutcome"] == "Running containerized edge daemon"


def test_serialize_export_payload():
    """Verify serialization formatting: 2-space indentation and trailing newline."""
    data = {
        "schemaVersion": 1,
        "updatedAt": "2026-11-20T10:00:00Z",
        "domains": []
    }
    serialized = serialize_export_payload(data)
    assert serialized.endswith("\n")
    assert '  "schemaVersion": 1' in serialized


def test_export_to_file_and_state(app, tmp_path):
    """Verify atomic write to file, export state update, and audit log."""
    export_file = tmp_path / "data" / "hackathon-domains.json"

    with app.app_context():
        app.config["EXPORT_PATH"] = export_file

        d = Domain(
            slug="domain-test",
            name="Testing Track",
            short_description="Track for export testing",
            sort_order=1,
            is_published=True
        )
        db.session.add(d)
        db.session.commit()

        ps = ProblemStatement(
            domain_id=d.id,
            code="PS-10",
            title="Sample PS",
            difficulty="MEDIUM",
            description="Sample description",
            expected_outcome="Sample outcome",
            sort_order=1,
            is_published=True
        )
        db.session.add(ps)
        db.session.commit()

        # Check export status before export
        status_before = get_export_status()
        assert status_before["has_pending_changes"] is True

        # Perform export
        success, out_path, payload = export_to_file(user_id=1, ip="127.0.0.1")
        assert success is True
        assert export_file.exists()

        # Read content from written file
        content = export_file.read_text(encoding="utf-8")
        parsed = json.loads(content)
        assert parsed["schemaVersion"] == 1
        assert len(parsed["domains"]) == 1

        # Check export status after export
        status_after = get_export_status()
        assert status_after["has_pending_changes"] is False
        assert status_after["last_exported_at"] is not None

        # Verify audit log
        log = AuditLog.query.filter(AuditLog.action.in_(["export", "export_json"])).first()
        assert log is not None


def test_export_api_and_download(auth_client, app, tmp_path):
    """Verify POST /api/admin/export and GET /admin/export/download."""
    export_file = tmp_path / "data" / "hackathon-domains.json"

    with app.app_context():
        app.config["EXPORT_PATH"] = export_file

        d = Domain(
            slug="domain-api",
            name="API Test Track",
            short_description="Track for API export testing",
            sort_order=1,
            is_published=True
        )
        db.session.add(d)
        db.session.commit()

        ps = ProblemStatement(
            domain_id=d.id,
            code="PS-88",
            title="API PS",
            difficulty="HARD",
            description="API PS description",
            expected_outcome="API PS outcome",
            sort_order=1,
            is_published=True
        )
        db.session.add(ps)
        db.session.commit()

    # 1. Trigger export via POST /api/admin/export
    res_post = auth_client.post("/api/admin/export")
    assert res_post.status_code == 200
    json_post = res_post.get_json()
    assert json_post["success"] is True
    assert json_post["domain_count"] == 1
    assert "data/hackathon-domains.json" in json_post["message"]

    # 2. Check status via GET /api/admin/export/status
    res_status = auth_client.get("/api/admin/export/status")
    assert res_status.status_code == 200
    json_status = res_status.get_json()
    assert json_status["status"]["has_pending_changes"] is False

    # 3. Download via GET /admin/export/download
    res_down = auth_client.get("/admin/export/download")
    assert res_down.status_code == 200
    assert "attachment" in res_down.headers.get("Content-Disposition", "")
    assert "application/json" in res_down.headers.get("Content-Type", "")
    downloaded_json = json.loads(res_down.data.decode("utf-8"))
    assert downloaded_json["schemaVersion"] == 1
    assert len(downloaded_json["domains"]) == 1
