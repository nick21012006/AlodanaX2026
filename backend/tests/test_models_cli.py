import pytest
from pathlib import Path
from sqlalchemy.exc import IntegrityError
from app.extensions import db
from app.models import Admin, Domain, ProblemStatement, AuditLog
from app.security import verify_password, hash_password


def test_admin_model(app):
    """Test Admin model creation, constraints and methods."""
    with app.app_context():
        admin = Admin(
            username="validadmin",
            password_hash=hash_password("ComplexSecretP@ss123!")
        )
        db.session.add(admin)
        db.session.commit()

        assert admin.id is not None
        assert admin.failed_logins == 0
        assert not admin.is_locked()

        admin.record_login_failure(max_failures=5, lock_minutes=15)
        assert admin.failed_logins == 1
        assert not admin.is_locked()

        for _ in range(4):
            admin.record_login_failure(max_failures=5, lock_minutes=15)
        assert admin.failed_logins == 5
        assert admin.is_locked()

        admin.record_login_success()
        assert admin.failed_logins == 0
        assert not admin.is_locked()
        assert admin.last_login_at is not None


def test_domain_and_cascade_delete(app):
    """Test Domain model, computed tag, and cascade deletion of statements."""
    with app.app_context():
        domain = Domain(
            slug="test-domain",
            name="Test Domain",
            short_description="Description for testing domain",
            sort_order=1,
            is_published=True
        )
        db.session.add(domain)
        db.session.commit()

        assert domain.tag == "DOMAIN 01"

        ps = ProblemStatement(
            domain_id=domain.id,
            code="PS-01",
            title="Problem Title",
            difficulty="HARD",
            description="Problem description text",
            expected_outcome="Expected outcome text",
            sort_order=1,
            is_published=True
        )
        db.session.add(ps)
        db.session.commit()

        assert ps.id is not None
        assert len(domain.problem_statements) == 1

        # Delete domain -> check cascade
        db.session.delete(domain)
        db.session.commit()

        assert ProblemStatement.query.filter_by(code="PS-01").first() is None


def test_cli_create_admin(runner, app):
    """Test creating an admin via CLI runner."""
    result = runner.invoke(
        args=["create-admin"],
        input="newadmin\nValidPassw0rd123!\nValidPassw0rd123!\n"
    )
    assert result.exit_code == 0
    assert "Success: Admin 'newadmin' created successfully." in result.output

    with app.app_context():
        admin = Admin.query.filter_by(username="newadmin").first()
        assert admin is not None
        assert verify_password(admin.password_hash, "ValidPassw0rd123!")


def test_cli_create_admin_validation(runner, app):
    """Test create-admin CLI validates username and password strength."""
    # Invalid username format
    result = runner.invoke(args=["create-admin"], input="AB\n")
    assert "Error: Username must be 3-32 characters" in result.output

    # Password too short
    result2 = runner.invoke(
        args=["create-admin"],
        input="validuser\nshort\n"
    )
    assert "Error: Password must be at least 12 characters" in result2.output


def test_cli_reset_password(runner, app, admin_user):
    """Test resetting an admin password via CLI."""
    result = runner.invoke(
        args=["reset-password"],
        input="testadmin\nBrandNewSecretP@ss123!\nBrandNewSecretP@ss123!\n"
    )
    assert result.exit_code == 0
    assert "Success: Password reset for admin 'testadmin'." in result.output

    with app.app_context():
        admin = Admin.query.filter_by(username="testadmin").first()
        assert verify_password(admin.password_hash, "BrandNewSecretP@ss123!")


def test_cli_seed_demo(runner, app):
    """Test seeding demo data via CLI."""
    result = runner.invoke(args=["seed-demo"])
    assert result.exit_code == 0
    assert "Seed complete: 3 domains added, 6 problem statements added (all unpublished drafts)." in result.output

    with app.app_context():
        assert Domain.query.count() == 3
        assert ProblemStatement.query.count() == 6
        # Confirm they are unpublished drafts
        for d in Domain.query.all():
            assert d.is_published is False
        for ps in ProblemStatement.query.all():
            assert ps.is_published is False

    # Idempotent check
    result2 = runner.invoke(args=["seed-demo"])
    assert result2.exit_code == 0
    assert "Seed complete: 0 domains added, 0 problem statements added (all unpublished drafts)." in result2.output


def test_cli_export(runner, app, tmp_path):
    """Test CLI export command."""
    export_file = tmp_path / "data" / "hackathon-domains.json"

    with app.app_context():
        app.config["EXPORT_PATH"] = export_file

        d = Domain(
            slug="domain-cli",
            name="CLI Test Track",
            short_description="Track description",
            sort_order=1,
            is_published=True
        )
        db.session.add(d)
        db.session.commit()

        ps = ProblemStatement(
            domain_id=d.id,
            code="PS-CLI",
            title="CLI PS",
            difficulty="HARD",
            description="CLI description",
            expected_outcome="CLI outcome",
            sort_order=1,
            is_published=True
        )
        db.session.add(ps)
        db.session.commit()

    result = runner.invoke(args=["export"])
    assert result.exit_code == 0
    assert "Export complete: 1 published domain(s) written to" in result.output
    assert "Done. Now upload data/hackathon-domains.json to your website" in result.output


def test_cli_backup_db(runner, app, tmp_path):
    """Test CLI backup-db command creates a backup copy."""
    db_file = tmp_path / "test_alodanax.db"
    db_file.write_text("sample db binary data", encoding="utf-8")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_file}"
    result = runner.invoke(args=["backup-db"])
    assert result.exit_code == 0
    assert "Success: Database backed up to" in result.output
