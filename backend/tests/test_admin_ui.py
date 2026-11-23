import pytest
from app.models import Domain, ProblemStatement
from app.extensions import db


@pytest.fixture
def auth_client(client, admin_user):
    """Client logged in as admin_user."""
    client.post("/admin/login", data={
        "username": "testadmin",
        "password": "SuperSecretP@ssw0rd123!"
    })
    return client


@pytest.fixture
def sample_domain(app):
    """Create a sample domain with one problem statement."""
    d = Domain(
        slug="ui-test-domain",
        name="UI Test Domain",
        short_description="Short description for UI testing",
        sort_order=1,
        is_published=True
    )
    db.session.add(d)
    db.session.commit()

    ps = ProblemStatement(
        domain_id=d.id,
        code="PS-99",
        title="Test PS Title",
        difficulty="HARD",
        description="Detailed description for testing preview",
        expected_outcome="Functional prototype benchmark",
        sort_order=1,
        is_published=True
    )
    db.session.add(ps)
    db.session.commit()
    return d


def test_dashboard_ui_renders(auth_client, sample_domain):
    """Test dashboard renders with stats and domain listings."""
    res = auth_client.get("/admin/")
    assert res.status_code == 200
    assert b"OPERATIONAL DASHBOARD" in res.data
    assert b"TOTAL DOMAINS" in res.data
    assert b"UI Test Domain" in res.data


def test_domains_list_ui_renders(auth_client, sample_domain):
    """Test domains manager page renders table with up/down buttons and toggles."""
    res = auth_client.get("/admin/domains")
    assert res.status_code == 200
    assert b"HACKATHON DOMAINS &amp; TRACKS" in res.data
    assert b"UI Test Domain" in res.data
    assert b"domain-move-btn" in res.data
    assert b"domain-toggle-publish-btn" in res.data


def test_domain_create_ui_renders(auth_client):
    """Test new domain form renders with inputs and counters."""
    res = auth_client.get("/admin/domains/new")
    assert res.status_code == 200
    assert b"CREATE NEW HACKATHON DOMAIN" in res.data
    assert b"domain-name" in res.data
    assert b"domain-desc" in res.data


def test_domain_edit_ui_renders(auth_client, sample_domain):
    """Test domain edit form renders with domain fields and statements list."""
    res = auth_client.get(f"/admin/domains/{sample_domain.id}/edit")
    assert res.status_code == 200
    assert b"EDIT DOMAIN: UI Test Domain" in res.data
    assert b"PS-99" in res.data
    assert b"PROBLEM STATEMENTS (" in res.data


def test_statement_create_ui_renders(auth_client, sample_domain):
    """Test statement form renders with live preview and auto-suggest button."""
    res = auth_client.get(f"/admin/domains/{sample_domain.id}/statements/new")
    assert res.status_code == 200
    assert b"CREATE PROBLEM STATEMENT" in res.data
    assert b"LIVE PUBLIC PREVIEW" in res.data
    assert b"btn-suggest-code" in res.data
    assert b"problem-statement-card" in res.data


def test_statement_edit_ui_renders(auth_client, sample_domain):
    """Test statement edit form renders existing statement data."""
    ps = sample_domain.problem_statements[0]
    res = auth_client.get(f"/admin/statements/{ps.id}/edit")
    assert res.status_code == 200
    assert b"EDIT PROBLEM STATEMENT: PS-99" in res.data
    assert b"PS-99" in res.data
    assert b"Test PS Title" in res.data


def test_404_page_renders(auth_client):
    """Test 404 error page renders styled ALODANAX error view."""
    res = auth_client.get("/admin/nonexistent-route-404")
    assert res.status_code == 404
    assert b"RESOURCE NOT FOUND" in res.data
    assert b"RETURN TO DASHBOARD" in res.data
