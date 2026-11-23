import os
import json
import hashlib
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from flask import current_app
from app.extensions import db
from app.models import Domain, ProblemStatement, ExportState, AuditLog, utc_now


def build_export_payload() -> dict:
    """
    Build the export JSON dictionary containing ONLY published domains and problem statements.
    - Omit domains with zero published statements.
    - Order domains and problem statements by sort_order ascending.
    """
    published_domains = (
        Domain.query
        .filter_by(is_published=True)
        .order_by(Domain.sort_order.asc(), Domain.id.asc())
        .all()
    )

    domains_payload = []
    latest_timestamps = []

    for d in published_domains:
        published_statements = (
            ProblemStatement.query
            .filter_by(domain_id=d.id, is_published=True)
            .order_by(ProblemStatement.sort_order.asc(), ProblemStatement.id.asc())
            .all()
        )

        # Omit domains with no published statements
        if not published_statements:
            continue

        if d.updated_at:
            latest_timestamps.append(d.updated_at)

        statements_payload = []
        for ps in published_statements:
            if ps.updated_at:
                latest_timestamps.append(ps.updated_at)

            statements_payload.append({
                "id": ps.code,
                "title": ps.title,
                "difficulty": ps.difficulty,
                "description": ps.description,
                "expectedOutcome": ps.expected_outcome
            })

        domains_payload.append({
            "slug": d.slug,
            "name": d.name,
            "tag": d.tag,
            "shortDescription": d.short_description,
            "problemStatements": statements_payload
        })

    if latest_timestamps:
        max_dt = max(latest_timestamps)
        updated_at_str = max_dt.isoformat() + "Z"
    else:
        # Deterministic default when empty so hashing is stable
        updated_at_str = "2026-01-01T00:00:00Z"

    return {
        "schemaVersion": 1,
        "updatedAt": updated_at_str,
        "domains": domains_payload
    }


def serialize_export_payload(payload: dict) -> str:
    """Pretty-print payload with 2 spaces indentation and trailing newline."""
    return json.dumps(payload, indent=2, ensure_ascii=False) + "\n"


def compute_payload_hash(payload_str: str) -> str:
    """Compute SHA-256 hash of payload string."""
    return hashlib.sha256(payload_str.encode("utf-8")).hexdigest()


def export_to_file(user_id=None, ip="127.0.0.1") -> tuple[bool, str, dict]:
    """
    Atomically export published data to data/hackathon-domains.json.
    - Writes to a temp file in the target folder, flushes/syncs, then renames.
    - Updates ExportState model with content hash and timestamp.
    - Logs audit record.
    Returns (success, export_path, payload).
    """
    payload = build_export_payload()
    content_str = serialize_export_payload(payload)
    content_hash = compute_payload_hash(content_str)

    export_path_str = current_app.config.get("EXPORT_PATH")
    export_path = Path(export_path_str).resolve()
    target_dir = export_path.parent
    target_dir.mkdir(parents=True, exist_ok=True)

    # Atomic write via NamedTemporaryFile in the same directory
    temp_file = tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        dir=target_dir,
        delete=False
    )
    temp_path = Path(temp_file.name)
    try:
        temp_file.write(content_str)
        temp_file.flush()
        os.fsync(temp_file.fileno())
        temp_file.close()

        # Atomic replacement
        os.replace(temp_path, export_path)
    except Exception as e:
        if temp_path.exists():
            try:
                temp_path.unlink()
            except OSError:
                pass
        raise e

    # Update or create singleton ExportState
    state = db.session.get(ExportState, 1)
    if not state:
        state = ExportState(id=1)
        db.session.add(state)

    state.last_exported_hash = content_hash
    state.last_exported_at = utc_now()
    db.session.commit()

    # Log export in AuditLog
    log = AuditLog(
        admin_id=user_id,
        action="export",
        entity_type="Export",
        entity_id=1,
        ip=ip
    )
    db.session.add(log)
    db.session.commit()

    return True, str(export_path), payload


def get_export_status() -> dict:
    """
    Determine if the static export file is up to date or has pending unpublished changes.
    """
    payload = build_export_payload()
    current_content = serialize_export_payload(payload)
    current_hash = compute_payload_hash(current_content)

    export_path_str = current_app.config.get("EXPORT_PATH")
    export_path = Path(export_path_str).resolve()

    state = db.session.get(ExportState, 1)
    file_exists = export_path.exists()

    disk_hash = None
    if file_exists:
        try:
            with open(export_path, "r", encoding="utf-8") as f:
                disk_hash = compute_payload_hash(f.read())
        except Exception:
            disk_hash = None

    # Up to date only if file exists, disk matches current hash, and state matches current hash
    is_up_to_date = (
        file_exists and
        disk_hash == current_hash and
        state is not None and
        state.last_exported_hash == current_hash
    )

    last_exported_at = state.last_exported_at if state else None

    return {
        "is_up_to_date": is_up_to_date,
        "pending_changes": not is_up_to_date,
        "has_pending_changes": not is_up_to_date,
        "last_exported_at": last_exported_at,
        "last_exported_at_iso": last_exported_at.strftime("%Y-%m-%d %H:%M:%S UTC") if last_exported_at else None,
        "export_path": str(export_path),
        "published_domains_count": len(payload["domains"]),
        "domain_count": len(payload["domains"]),
        "file_exists": file_exists
    }
