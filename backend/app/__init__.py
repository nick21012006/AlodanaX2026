import os
from datetime import datetime, timezone
from pathlib import Path
from flask import Flask, jsonify, render_template, request, session, redirect, url_for
from app.config import config_by_name, Config
from app.extensions import db, migrate, login_manager, csrf, limiter


def create_app(config_name=None):
    """Application factory for ALODANAX local publish backend."""
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "development").lower()
        if config_name not in config_by_name:
            config_name = "development"

    app = Flask(
        __name__,
        instance_relative_config=True,
        template_folder="templates",
        static_folder="static"
    )

    # Load configuration
    cfg = config_by_name.get(config_name, Config)
    app.config.from_object(cfg)

    # In production, enforce strong SECRET_KEY
    if config_name == "production":
        secret = app.config.get("SECRET_KEY", "")
        if not secret or "change-me" in secret or len(secret) < 32:
            raise RuntimeError(
                "CRITICAL SECURITY ERROR: Strong SECRET_KEY must be set in production! Refusing to start."
            )

    # Ensure instance directory exists
    instance_path = Path(app.instance_path)
    instance_path.mkdir(parents=True, exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    csrf.init_app(app)
    limiter.init_app(app)

    @login_manager.unauthorized_handler
    def unauthorized_callback():
        if request.path.startswith("/api/") or request.is_json or request.headers.get("Accept") == "application/json":
            return jsonify({
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Authentication required.",
                    "fields": {}
                }
            }), 401
        return redirect(url_for("auth.login", next=request.path))

    # Register blueprints
    from app.blueprints.auth import auth_bp
    from app.blueprints.admin import admin_bp, admin_api_bp
    from cli import register_cli_commands

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(admin_api_bp)

    # Register CLI commands
    register_cli_commands(app)

    # Security Headers Hook
    @app.after_request
    def apply_security_headers(response):
        # Universal security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "same-origin"

        # Content-Security-Policy (Allow self and Google Fonts Orbitron/Outfit)
        csp = (
            "default-src 'self'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' blob: data:; "
            "script-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self';"
        )
        response.headers["Content-Security-Policy"] = csp

        # Cache-Control: no-store for all admin routes
        if request.path.startswith("/admin") or request.path.startswith("/api/admin"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"

        return response

    # Session absolute expiration and idle check
    @app.before_request
    def check_session_timeout():
        if not session.get("_user_id"):
            return

        now_ts = datetime.now(timezone.utc).timestamp()
        
        # Absolute timeout: 8 hours (28800 seconds)
        login_ts = session.get("auth_time")
        if login_ts and (now_ts - login_ts > 28800):
            session.clear()
            return redirect(url_for("auth.login", timeout="absolute"))

        # Idle timeout: 30 minutes (or configured SESSION_IDLE_MINUTES)
        last_activity = session.get("last_activity")
        idle_limit = app.config.get("SESSION_IDLE_MINUTES", 30) * 60
        if last_activity and (now_ts - last_activity > idle_limit):
            session.clear()
            return redirect(url_for("auth.login", timeout="idle"))

        session["last_activity"] = now_ts

    # Standard error handlers
    @app.errorhandler(400)
    def bad_request(e):
        if request.path.startswith("/api/") or request.is_json:
            return jsonify({
                "error": {
                    "code": "BAD_REQUEST",
                    "message": "Bad request format or payload.",
                    "fields": {}
                }
            }), 400
        return render_template("admin/404.html", message="Bad request."), 400

    @app.errorhandler(403)
    def forbidden(e):
        if request.path.startswith("/api/") or request.is_json:
            return jsonify({
                "error": {
                    "code": "FORBIDDEN",
                    "message": "Access forbidden.",
                    "fields": {}
                }
            }), 403
        return render_template("admin/404.html", message="Access forbidden."), 403

    @app.errorhandler(404)
    def not_found(e):
        if request.path.startswith("/api/") or request.is_json:
            return jsonify({
                "error": {
                    "code": "NOT_FOUND",
                    "message": "The requested resource was not found.",
                    "fields": {}
                }
            }), 404
        return render_template("admin/404.html"), 404

    @app.errorhandler(429)
    def ratelimit_exceeded(e):
        return jsonify({
            "error": {
                "code": "RATE_LIMIT_EXCEEDED",
                "message": "Too many requests. Please slow down and try again.",
                "fields": {}
            }
        }), 429

    @app.errorhandler(500)
    def internal_error(e):
        db.session.rollback()
        if request.path.startswith("/api/") or request.is_json:
            return jsonify({
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An internal server error occurred.",
                    "fields": {}
                }
            }), 500
        return render_template("admin/500.html"), 500

    return app
