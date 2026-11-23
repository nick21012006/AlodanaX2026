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
    def create_admin_command():
        """Create a new administrative user via secure CLI prompt."""
        click.echo("=== ALODANAX: Create Administrative Account ===")
        username = click.prompt("Username (3-32 chars, a-z 0-9 . _ -)", type=str).strip().lower()

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

        password = getpass.getpass("Password (min 12 chars): ")
        valid, error_msg = validate_password_strength(password, username)
        if not valid:
            click.secho(f"Error: {error_msg}", fg="red")
            return

        confirm = getpass.getpass("Confirm Password: ")
        if password != confirm:
            click.secho("Error: Passwords do not match.", fg="red")
            return

        pwd_hash = hash_password(password)
        admin = Admin(username=username, password_hash=pwd_hash)
        db.session.add(admin)
        db.session.commit()

        log = AuditLog(admin_id=admin.id, action="admin_create", entity_type="Admin", entity_id=admin.id, ip="CLI")
        db.session.add(log)
        db.session.commit()

        click.secho(f"Success: Admin '{username}' created successfully.", fg="green")

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
                "slug": "domain-1",
                "name": "[DOMAIN 1: AI & AUTONOMOUS SYSTEMS]",
                "short_description": "[EMBEDDED INTELLIGENCE, NEURAL PIPELINES, AND PREDICTIVE DECISION ENGINES]",
                "sort_order": 1,
                "is_published": False,
                "problemStatements": [
                    {
                        "code": "PS-01",
                        "title": "[PROBLEM STATEMENT 01 TITLE]",
                        "difficulty": "HARD",
                        "description": "[ARCHITECT A RESILIENT, REAL-TIME SYSTEM SOLVING COMPLEX LOGISTICAL OR SENSORY BOTTLENECKS UNDER SUB-OPTIMAL NETWORK CONDITIONS.]",
                        "expected_outcome": "[A FUNCTIONING HIGH-THROUGHPUT PROTOTYPE WITH DOCUMENTED INFERENCE BENCHMARKS, LOCAL REPOSITORY, AND DEPLOYED DEMO INTERFACE.]",
                        "sort_order": 1,
                        "is_published": False
                    },
                    {
                        "code": "PS-02",
                        "title": "[PROBLEM STATEMENT 02 TITLE]",
                        "difficulty": "EXTREME",
                        "description": "[IMPLEMENT AN AUTONOMOUS PIPELINE CAPABLE OF AUTOMATED ANOMALY DETECTION AND ADAPTIVE MITIGATION IN DISTRIBUTED STREAM DATA.]",
                        "expected_outcome": "[AN OPEN-SOURCE SERVICE WITH LIVE SIMULATION HARNESS, TELEMETRY DASHBOARD, AND REPRODUCIBLE EVALUATION METRICS.]",
                        "sort_order": 2,
                        "is_published": False
                    }
                ]
            },
            {
                "slug": "domain-2",
                "name": "[DOMAIN 2: CLOUD INFRASTRUCTURE & DECENTRALIZED SYSTEMS]",
                "short_description": "[FAULT-TOLERANT ARCHITECTURES, HIGH-CONCURRENCY MICROSERVICES, AND CRYPTOGRAPHIC REGISTRIES]",
                "sort_order": 2,
                "is_published": False,
                "problemStatements": [
                    {
                        "code": "PS-03",
                        "title": "[PROBLEM STATEMENT 03 TITLE]",
                        "difficulty": "MEDIUM",
                        "description": "[BUILD A LOW-LATENCY VERIFIABLE DATA REGISTRY DELIVERING HIGH THROUGHPUT WITHOUT SINGLE POINTS OF FAILURE.]",
                        "expected_outcome": "[DEPLOYED SMART CONTRACTS OR CONSENSUS NODES WITH INTERACTIVE VERIFIER WEB APP AND BENCHMARK REPORT.]",
                        "sort_order": 1,
                        "is_published": False
                    },
                    {
                        "code": "PS-04",
                        "title": "[PROBLEM STATEMENT 04 TITLE]",
                        "difficulty": "HARD",
                        "description": "[DESIGN A SELF-HEALING SERVICE MESH WITH AUTONOMOUS FAILOVER PROTOCOLS FOR CLOUD-NATIVE DEPLOYMENTS.]",
                        "expected_outcome": "[CONTAINERIZED DAEMON WITH COMPREHENSIVE CHAOS TESTING SUITE AND CONFIGURABLE ROUTING RULES.]",
                        "sort_order": 2,
                        "is_published": False
                    }
                ]
            },
            {
                "slug": "domain-3",
                "name": "[DOMAIN 3: SMART CAMPUS & OPEN INNOVATION]",
                "short_description": "[SUSTAINABLE CAMPUS INFRASTRUCTURE, DIGITAL ACCESSIBILITY, AND CITIZEN TECH TOOLS]",
                "sort_order": 3,
                "is_published": False,
                "problemStatements": [
                    {
                        "code": "PS-05",
                        "title": "[PROBLEM STATEMENT 05 TITLE]",
                        "difficulty": "MEDIUM",
                        "description": "[CREATE AN ACCESSIBLE CAMPUS RESOURCE ORCHESTRATOR OPTIMIZING PHYSICAL SPACES AND UTILITY CONSUMPTION.]",
                        "expected_outcome": "[RESPONSIVE CROSS-PLATFORM APPLICATION WITH ROLE-BASED ACCESS CONTROL AND REAL-TIME TELEMETRY CHARTS.]",
                        "sort_order": 1,
                        "is_published": False
                    },
                    {
                        "code": "PS-06",
                        "title": "[PROBLEM STATEMENT 06 TITLE]",
                        "difficulty": "HARD",
                        "description": "[DEVELOP AN ASSISTIVE WAYFINDING AND SAFETY SYSTEM FOR DIVERSE CAMPUS ENVIRONMENTS WITHOUT REQUIRING SPECIALIZED BEACONS.]",
                        "expected_outcome": "[ACCESSIBLE MOBILE/WEB CLIENT WITH SPATIAL GUIDANCE, WCAG AAA CONTRAST COMPLIANCE, AND VOICE PROMPTS.]",
                        "sort_order": 2,
                        "is_published": False
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
