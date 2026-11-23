import pytest
from app import create_app
from app.extensions import db
from app.models import Admin, Domain, ProblemStatement, AuditLog
from app.security import hash_password


@pytest.fixture
def app():
    """Create application configured for testing."""
    test_app = create_app("testing")
    with test_app.app_context():
        db.create_all()
        yield test_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """A test CLI runner for the app."""
    return app.test_cli_runner()


@pytest.fixture
def admin_user(app):
    """Create a standard admin user."""
    admin = Admin(
        username="testadmin",
        password_hash=hash_password("SuperSecretP@ssw0rd123!")
    )
    db.session.add(admin)
    db.session.commit()
    return admin
