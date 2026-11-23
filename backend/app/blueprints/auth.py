from datetime import datetime, timezone, timedelta
from urllib.parse import urlparse, urljoin
from flask import (
    Blueprint, render_template, request, redirect, url_for,
    flash, session, current_app, jsonify
)
from flask_login import login_user, logout_user, login_required, current_user
from app.extensions import db, limiter
from app.models import Admin, AuditLog
from app.security import (
    verify_password, hash_password, dummy_verify,
    validate_password_strength, sanitize_text
)

auth_bp = Blueprint("auth", __name__, url_prefix="/admin")


def is_safe_url(target: str) -> bool:
    """Ensure redirect URL is strictly local and safe from open redirect attacks."""
    if not target:
        return False
    # Avoid protocol-relative URLs like //evil.com or /\evil.com
    if target.startswith("//") or target.startswith("/\\"):
        return False
    ref_url = urlparse(request.host_url)
    test_url = urlparse(urljoin(request.host_url, target))
    return test_url.scheme in ("http", "https") and ref_url.netloc == test_url.netloc


def log_audit(action: str, entity_type: str = None, entity_id: int = None, admin_id: int = None, ip: str = None):
    """Write an audit log entry."""
    try:
        resolved_admin_id = admin_id
        if resolved_admin_id is None and current_user and current_user.is_authenticated:
            resolved_admin_id = current_user.id

        client_ip = ip
        if client_ip is None and request:
            client_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
            if client_ip and "," in client_ip:
                client_ip = client_ip.split(",")[0].strip()

        log_entry = AuditLog(
            admin_id=resolved_admin_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            ip=client_ip
        )
        db.session.add(log_entry)
        db.session.commit()
    except Exception as e:
        current_app.logger.error(f"Failed to record audit log: {e}")
        db.session.rollback()


@auth_bp.route("/login", methods=["GET", "POST"])
@limiter.limit("5/minute", methods=["POST"])
def login():
    """Handle administrative login with rate limiting and brute-force lockout."""
    if current_user.is_authenticated:
        return redirect(url_for("admin.dashboard"))

    error_msg = None
    next_page = request.args.get("next", "")

    if request.method == "POST":
        username = request.form.get("username", "").strip().lower()
        password = request.form.get("password", "")
        next_page = request.form.get("next", "")

        generic_error = "Invalid username or password."

        admin = Admin.query.filter_by(username=username).first()

        if not admin:
            dummy_verify()
            log_audit(action="login_fail", entity_type="Admin", ip=request.remote_addr)
            error_msg = generic_error
        elif admin.is_locked():
            log_audit(action="login_locked", entity_type="Admin", entity_id=admin.id)
            error_msg = f"Account is temporarily locked. Please try again after {admin.locked_until.strftime('%H:%M UTC')}."
        elif not verify_password(admin.password_hash, password):
            max_fail = current_app.config.get("LOGIN_MAX_FAILURES", 5)
            lock_min = current_app.config.get("LOGIN_LOCK_MINUTES", 15)
            admin.record_login_failure(max_failures=max_fail, lock_minutes=lock_min)
            db.session.commit()
            log_audit(action="login_fail", entity_type="Admin", entity_id=admin.id)
            error_msg = generic_error
        else:
            # Successful login
            admin.record_login_success()
            db.session.commit()

            # Prevent session fixation: reset session and regenerate
            session.clear()
            session.permanent = True
            session["auth_time"] = datetime.now(timezone.utc).timestamp()

            login_user(admin)
            log_audit(action="login_ok", entity_type="Admin", entity_id=admin.id)

            target = next_page if is_safe_url(next_page) else url_for("admin.dashboard")
            return redirect(target)

    return render_template("admin/login.html", error_message=error_msg, next=next_page)


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    """Log out administrator, clear session, and audit event."""
    log_audit(action="logout", entity_type="Admin", entity_id=current_user.id)
    logout_user()
    session.clear()
    flash("You have been securely logged out.", "info")
    return redirect(url_for("auth.login"))


@auth_bp.route("/account", methods=["GET", "POST"])
@login_required
def account():
    """View admin account details and change password."""
    error_msg = None
    success_msg = None

    if request.method == "POST":
        current_password = request.form.get("current_password", "")
        new_password = request.form.get("new_password", "")
        confirm_password = request.form.get("confirm_password", "")

        if not verify_password(current_user.password_hash, current_password):
            error_msg = "Incorrect current password."
        elif new_password != confirm_password:
            error_msg = "New passwords do not match."
        else:
            valid, err = validate_password_strength(new_password, current_user.username)
            if not valid:
                error_msg = err
            else:
                current_user.password_hash = hash_password(new_password)
                db.session.commit()
                log_audit(action="password_change", entity_type="Admin", entity_id=current_user.id)
                success_msg = "Password updated successfully."

    return render_template(
        "admin/account.html",
        admin=current_user,
        error_message=error_msg,
        success_message=success_msg
    )
