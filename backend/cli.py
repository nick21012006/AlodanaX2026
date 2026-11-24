import getpass
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
import click
from flask import current_app
from app.extensions import db
from app.models import Admin, Domain, ProblemStatement, AuditLog
from app.security import hash_password, validate_password_strength

USERNAME_PATTERN = re.compile(r"^[a-z0-9_.-]{3,32}$")


def register_cli_commands(app):
    """Register custom CLI commands for the Flask application."""

    @app.cli.command("create-admin")
    @click.option("--username", "-u", default=None, help="Admin username (3-32 chars, a-z 0-9 . _ -)")
    @click.option("--password", "-p", default=None, help="Admin password (min 12 chars)")
    def create_admin_command(username, password):
        """Create a new administrative user via secure CLI prompt or flags."""
        click.echo("=== ALODANAX: Create Administrative Account ===")
        if not username:
            username = click.prompt("Username (3-32 chars, a-z 0-9 . _ -)", type=str).strip().lower()
        else:
            username = username.strip().lower()

        if not USERNAME_PATTERN.match(username):
            click.secho(
                "Error: Username must be 3-32 characters and only contain lowercase letters, numbers, '.', '_', or '-'.",
                fg="red"
            )
            return

        existing = Admin.query.filter_by(username=username).first()
        if existing:
            click.secho(f"Error: Admin user '{username}' already exists.", fg="red")
            return

        if not password:
            password = getpass.getpass("Password (min 12 chars): ")
            confirm = getpass.getpass("Confirm Password: ")
            if password != confirm:
                click.secho("Error: Passwords do not match.", fg="red")
                return

        valid, error_msg = validate_password_strength(password, username)
        if not valid:
            click.secho(f"Error: {error_msg}", fg="red")
            return

        pwd_hash = hash_password(password)
        admin = Admin(username=username, password_hash=pwd_hash)
        db.session.add(admin)
        db.session.commit()

        log = AuditLog(admin_id=admin.id, action="admin_create", entity_type="Admin", entity_id=admin.id, ip="CLI")
        db.session.add(log)
        db.session.commit()

        click.secho(f"Success: Admin '{username}' created successfully.", fg="green")

    @app.cli.command("init-admin")
    def init_admin_command():
        """Ensure an initial administrator exists if ADMIN_USERNAME and ADMIN_PASSWORD are set."""
        import os
        admin_user = os.getenv("ADMIN_USERNAME")
        admin_pass = os.getenv("ADMIN_PASSWORD")
        if not admin_user or not admin_pass:
            return

        username = admin_user.strip().lower()
        if not USERNAME_PATTERN.match(username):
            click.secho("init-admin: Invalid ADMIN_USERNAME format.", fg="red")
            return

        valid, error_msg = validate_password_strength(admin_pass, username)
        if not valid:
            click.secho(f"init-admin: {error_msg}", fg="red")
            return

        pwd_hash = hash_password(admin_pass)
        existing = Admin.query.filter_by(username=username).first()
        if existing:
            existing.password_hash = pwd_hash
            existing.failed_logins = 0
            existing.locked_until = None
            db.session.commit()
            click.secho(f"init-admin: Synchronized credentials for admin '{username}'.", fg="green")
            return

        admin = Admin(username=username, password_hash=pwd_hash)
        db.session.add(admin)
        db.session.commit()

        log = AuditLog(admin_id=admin.id, action="admin_init_env", entity_type="Admin", entity_id=admin.id, ip="SYSTEM")
        db.session.add(log)
        db.session.commit()
        click.secho(f"init-admin: Created initial admin '{username}'.", fg="green")

    @app.cli.command("reset-password")
    def reset_password_command():
        """Reset an existing administrator's password via secure CLI prompt."""
        click.echo("=== ALODANAX: Reset Admin Password ===")
        username = click.prompt("Username", type=str).strip().lower()

        admin = Admin.query.filter_by(username=username).first()
        if not admin:
            click.secho(f"Error: Admin user '{username}' not found.", fg="red")
            return

        password = getpass.getpass("New Password (min 12 chars): ")
        valid, error_msg = validate_password_strength(password, username)
        if not valid:
            click.secho(f"Error: {error_msg}", fg="red")
            return

        confirm = getpass.getpass("Confirm New Password: ")
        if password != confirm:
            click.secho("Error: Passwords do not match.", fg="red")
            return

        admin.password_hash = hash_password(password)
        admin.failed_logins = 0
        admin.locked_until = None
        db.session.commit()

        log = AuditLog(admin_id=admin.id, action="password_reset_cli", entity_type="Admin", entity_id=admin.id, ip="CLI")
        db.session.add(log)
        db.session.commit()

        click.secho(f"Success: Password reset for admin '{username}'.", fg="green")

    @app.cli.command("seed-demo")
    def seed_demo_command():
        """Seed initial hackathon domains and statements as unpublished drafts (dev only)."""
        env_val = current_app.config.get("FLASK_ENV", "").lower()
        if env_val == "production":
            click.secho("Error: Cannot run seed-demo in production!", fg="red")
            return

        click.echo("Seeding demo hackathon domains and problem statements (unpublished drafts)...")

        demo_domains = [
            {
                "slug": "ai-data-science",
                "name": "AI and Data Science",
                "short_description": "Develop machine learning models, neural pipelines, predictive analytics, and intelligent automation systems solving real-world challenges.",
                "sort_order": 1,
                "is_published": True,
                "problemStatements": [
                    {
                        "code": "PS-01",
                        "title": "Digital Twin Workflow Preservation System",
                        "difficulty": "HARD",
                        "description": "Skilled workers and specialists possess valuable skills and techniques that standard manuals fail to capture. When such experts retire, or become unavailable, their unique workflows become hard to replicate or preserve.",
                        "expected_outcome": "Develop a Digital Twin – a system that learns a person's method of performing a specific task by observing demonstrations and creates an interactive digital representation of that workflow.",
                        "sort_order": 1,
                        "is_published": True
                    },
                    {
                        "code": "PS-02",
                        "title": "AI-Driven Food Demand Forecasting System",
                        "difficulty": "MEDIUM",
                        "description": "Restaurants and canteens struggle daily to estimate exact meal quantities, relying heavily on guesswork. Over-preparing leads to massive food waste and financial loss, while under-preparing causes shortages.",
                        "expected_outcome": "Develop an AI-driven forecasting system for restaurants, college canteens or hostels that predicts daily food demand using historical consumption patterns and helps reduce food wastage.",
                        "sort_order": 2,
                        "is_published": True
                    }
                ]
            },
            {
                "slug": "sustainable-infrastructure",
                "name": "Sustainable Infrastructure and Development",
                "short_description": "Build resilient, eco-friendly technological solutions, smart city/campus resource optimizers, green compute pipelines, and sustainable development tools.",
                "sort_order": 2,
                "is_published": True,
                "problemStatements": [
                    {
                        "code": "PS-03",
                        "title": "Predictive Urban Waterlogging Risk Mapping",
                        "difficulty": "HARD",
                        "description": "Sudden monsoon waterlogging in cities like Mumbai paralyzes commuter routes and emergency services.",
                        "expected_outcome": "Combine historical rainfall/elevation data with live weather APIs to design a predictive model that identifies waterlogging risk zones on an interactive map.",
                        "sort_order": 1,
                        "is_published": True
                    },
                    {
                        "code": "PS-04",
                        "title": "Satellite Heat Island & Urban Afforestation Optimizer",
                        "difficulty": "MEDIUM",
                        "description": "Rapid concretization in cities increases surface temperatures, harming public health and raising cooling energy demand.",
                        "expected_outcome": "Analyse satellite imagery (NDVI vegetation index) alongside local temperature data to highlight high-heat localities and suggest priority plantation zones.",
                        "sort_order": 2,
                        "is_published": True
                    }
                ]
            },
            {
                "slug": "cyber-security-iot",
                "name": "Cyber Security and IoT",
                "short_description": "Architect secure embedded hardware systems, threat detection mechanisms, cryptographic validation protocols, and IoT network security solutions.",
                "sort_order": 3,
                "is_published": True,
                "problemStatements": [
                    {
                        "code": "PS-05",
                        "title": "Edge Vision Crowd Anomaly & Panic Detection System",
                        "difficulty": "HARD",
                        "description": "Managing crowds in busy public spaces like transit hubs, stadiums, malls, and festivals is a major safety challenge where sudden panic results in critical and fatal incidents.",
                        "expected_outcome": "Develop an intelligent monitoring system using computer vision and edge computing (via cameras or IR/ToF sensors) that estimates crowd density, identifies unusual movement patterns and detects potential overcrowding in public spaces.",
                        "sort_order": 1,
                        "is_published": True
                    },
                    {
                        "code": "PS-06",
                        "title": "Synthetic Media & Forensic KYC Document Fraud Detection",
                        "difficulty": "HARD",
                        "description": "Digital public onboarding portals face growing identity fraud using AI-generated deepfake IDs, manipulated photos, and tampered document metadata designed to bypass automated KYC pipelines.",
                        "expected_outcome": "Develop an automated forensic verification prototype that ingests submitted digital credentials, detects visual and metadata-level synthetic alterations, and generates an interpretable fraud risk report.",
                        "sort_order": 2,
                        "is_published": True
                    }
                ]
            }
        ]

        domains_added = 0
        statements_added = 0

        for d_data in demo_domains:
            existing_d = Domain.query.filter_by(slug=d_data["slug"]).first()
            if not existing_d:
                existing_d = Domain(
                    slug=d_data["slug"],
                    name=d_data["name"],
                    short_description=d_data["short_description"],
                    sort_order=d_data["sort_order"],
                    is_published=d_data["is_published"]
                )
                db.session.add(existing_d)
                db.session.flush()
                domains_added += 1

            for ps_data in d_data["problemStatements"]:
                existing_ps = ProblemStatement.query.filter_by(code=ps_data["code"]).first()
                if not existing_ps:
                    new_ps = ProblemStatement(
                        domain_id=existing_d.id,
                        code=ps_data["code"],
                        title=ps_data["title"],
                        difficulty=ps_data["difficulty"],
                        description=ps_data["description"],
                        expected_outcome=ps_data["expected_outcome"],
                        sort_order=ps_data["sort_order"],
                        is_published=ps_data["is_published"]
                    )
                    db.session.add(new_ps)
                    statements_added += 1

        db.session.commit()
        click.secho(
            f"Seed complete: {domains_added} domains added, {statements_added} problem statements added (all unpublished drafts). "
            f"Initial export will produce an empty domains list until items are published.",
            fg="green"
        )

    @app.cli.command("export")
    def export_command():
        """Atomically export published hackathon domains to data/hackathon-domains.json."""
        from app.services.export_service import export_to_file
        try:
            success, export_path, payload = export_to_file(user_id=None, ip="CLI")
            count = len(payload.get("domains", []))
            click.secho(f"Export complete: {count} published domain(s) written to {export_path}.", fg="green")
            click.echo(
                "Done. Now upload data/hackathon-domains.json to your website (or commit and push it). "
                "The site updates when that file is live."
            )
        except Exception as e:
            click.secho(f"Error during export: {e}", fg="red")

    @app.cli.command("backup-db")
    def backup_db_command():
        """Back up SQLite database to backend/backups/alodanax-YYYYMMDD-HHMM.db."""
        db_uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
        if not db_uri.startswith("sqlite:///"):
            click.secho("Error: backup-db currently supports SQLite databases only.", fg="red")
            return

        db_path_str = db_uri.replace("sqlite:///", "")
        db_path = Path(db_path_str).resolve()
        if not db_path.exists():
            click.secho(f"Error: Database file not found at {db_path}", fg="red")
            return

        backup_dir = Path(current_app.root_path).parent / "backups"
        backup_dir.mkdir(parents=True, exist_ok=True)

        now_str = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M")
        backup_filename = f"alodanax-{now_str}.db"
        backup_path = backup_dir / backup_filename

        shutil.copy2(db_path, backup_path)
        click.secho(f"Success: Database backed up to {backup_path}", fg="green")
