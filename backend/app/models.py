from datetime import datetime, timezone
import re
from flask_login import UserMixin
from sqlalchemy import CheckConstraint
from app.extensions import db, login_manager


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Admin(db.Model, UserMixin):
    """Admin user model for authenticated dashboard access."""
    __tablename__ = "admins"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(32), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    failed_logins = db.Column(db.Integer, default=0, nullable=False)
    locked_until = db.Column(db.DateTime, nullable=True)
    last_login_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        CheckConstraint("length(username) >= 3 AND length(username) <= 32", name="chk_admin_username_len"),
    )

    def is_locked(self) -> bool:
        """Check if admin account is currently locked due to failed attempts."""
        if not self.locked_until:
            return False
        return self.locked_until > utc_now()

    def record_login_success(self):
        """Reset failed logins and record login timestamp."""
        self.failed_logins = 0
        self.locked_until = None
        self.last_login_at = utc_now()

    def record_login_failure(self, max_failures: int = 5, lock_minutes: int = 15):
        """Increment failed attempts and apply lockout if threshold reached."""
        self.failed_logins += 1
        if self.failed_logins >= max_failures:
            from datetime import timedelta
            self.locked_until = utc_now() + timedelta(minutes=lock_minutes)


@login_manager.user_loader
def load_user(user_id):
    """Flask-Login user loader."""
    try:
        return db.session.get(Admin, int(user_id))
    except (ValueError, TypeError):
        return None


class Domain(db.Model):
    """Hackathon track/domain model."""
    __tablename__ = "domains"

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(140), unique=True, nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    short_description = db.Column(db.String(300), nullable=False)
    sort_order = db.Column(db.Integer, default=0, nullable=False, index=True)
    is_published = db.Column(db.Boolean, default=False, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)
    updated_at = db.Column(db.DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    problem_statements = db.relationship(
        "ProblemStatement",
        backref=db.backref("domain", lazy=True),
        cascade="all, delete-orphan",
        order_by="ProblemStatement.sort_order.asc()",
        lazy="select"
    )

    __table_args__ = (
        CheckConstraint("length(name) <= 120", name="chk_domain_name_len"),
        CheckConstraint("length(short_description) <= 300", name="chk_domain_desc_len"),
    )

    @property
    def tag(self) -> str:
        """Computed tag matching frontend contract: 'DOMAIN 01', 'DOMAIN 02', etc."""
        return f"DOMAIN {self.sort_order:02d}" if self.sort_order > 0 else "DOMAIN 01"

    @staticmethod
    def generate_slug(name: str) -> str:
        """Generate a URL-safe slug from a domain name."""
        clean = re.sub(r"[^\w\s-]", "", name).strip().lower()
        slug = re.sub(r"[-\s]+", "-", clean)
        return slug or "domain"


class ProblemStatement(db.Model):
    """Problem Statement model belonging to a Hackathon Domain."""
    __tablename__ = "problem_statements"

    id = db.Column(db.Integer, primary_key=True)
    domain_id = db.Column(
        db.Integer,
        db.ForeignKey("domains.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    code = db.Column(db.String(16), unique=True, nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    difficulty = db.Column(db.String(16), nullable=False)  # EASY, MEDIUM, HARD, EXTREME
    description = db.Column(db.String(1500), nullable=False)
    expected_outcome = db.Column(db.String(800), nullable=False)
    sort_order = db.Column(db.Integer, default=0, nullable=False, index=True)
    is_published = db.Column(db.Boolean, default=False, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)
    updated_at = db.Column(db.DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    __table_args__ = (
        CheckConstraint("difficulty IN ('EASY', 'MEDIUM', 'HARD', 'EXTREME')", name="chk_ps_difficulty"),
        CheckConstraint("length(code) <= 16", name="chk_ps_code_len"),
        CheckConstraint("length(title) <= 150", name="chk_ps_title_len"),
        CheckConstraint("length(description) <= 1500", name="chk_ps_desc_len"),
        CheckConstraint("length(expected_outcome) <= 800", name="chk_ps_outcome_len"),
    )


class ExportState(db.Model):
    """Singleton model tracking the export status of data/hackathon-domains.json."""
    __tablename__ = "export_states"

    id = db.Column(db.Integer, primary_key=True)
    last_exported_hash = db.Column(db.String(64), nullable=True)
    last_exported_at = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, default=utc_now, onupdate=utc_now, nullable=False)


class AuditLog(db.Model):
    """Audit log tracking administrative actions."""
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(
        db.Integer,
        db.ForeignKey("admins.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    action = db.Column(db.String(64), nullable=False, index=True)
    entity_type = db.Column(db.String(32), nullable=True)
    entity_id = db.Column(db.Integer, nullable=True)
    ip = db.Column(db.String(45), nullable=True)
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False, index=True)

    admin = db.relationship("Admin", backref=db.backref("audit_logs", lazy=True))
