import re
from datetime import datetime, timezone
from flask import Blueprint, render_template, request, jsonify, abort, current_app, redirect, url_for
from flask_login import login_required, current_user
from marshmallow import ValidationError
from app.extensions import db, limiter
from app.models import Domain, ProblemStatement, AuditLog, ExportState
from app.schemas import (
    domain_schema, domains_schema,
    problem_statement_schema, problem_statements_schema
)
from app.services.export_service import (
    export_to_file, get_export_status, build_export_payload, serialize_export_payload
)
from app.blueprints.auth import log_audit

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")
admin_api_bp = Blueprint("admin_api", __name__, url_prefix="/api/admin")


@admin_bp.app_context_processor
def inject_export_status():
    """Make export_status available across all admin templates."""
    if current_user.is_authenticated:
        return {"export_status": get_export_status()}
    return {}


def api_error(code: str, message: str, fields: dict = None, status_code: int = 400):
    """Generate uniform error response dictionary."""
    return jsonify({
        "error": {
            "code": code,
            "message": message,
            "fields": fields or {}
        }
    }), status_code


# ==============================================================================
# HTML TEMPLATE ROUTES
# ==============================================================================

@admin_bp.route("/")
@login_required
def dashboard():
    total_domains = Domain.query.count()
    published_domains = Domain.query.filter_by(is_published=True).count()
    total_statements = ProblemStatement.query.count()
    published_statements = ProblemStatement.query.filter_by(is_published=True).count()
    draft_statements = total_statements - published_statements

    latest_d = db.session.query(db.func.max(Domain.updated_at)).scalar()
    latest_ps = db.session.query(db.func.max(ProblemStatement.updated_at)).scalar()
    last_updated = max(filter(None, [latest_d, latest_ps]), default=None)

    domains = Domain.query.order_by(Domain.sort_order.asc(), Domain.id.asc()).all()
    recent_logs = (
        AuditLog.query
        .order_by(AuditLog.created_at.desc())
        .limit(10)
        .all()
    )

    export_status_data = get_export_status()

    return render_template(
        "admin/dashboard.html",
        stats={
            "total_domains": total_domains,
            "published_domains": published_domains,
            "total_statements": total_statements,
            "published_statements": published_statements,
            "draft_statements": draft_statements,
            "last_updated": last_updated
        },
        domains=domains,
        recent_activity=recent_logs,
        export_status=export_status_data
    )


@admin_bp.route("/domains")
@login_required
def domains_list():
    domains = Domain.query.order_by(Domain.sort_order.asc(), Domain.id.asc()).all()
    export_status_data = get_export_status()
    return render_template("admin/domains.html", domains=domains, export_status=export_status_data)


@admin_bp.route("/domains/new", methods=["GET", "POST"])
@login_required
def domain_new():
    return render_template("admin/domain_form.html", mode="create", domain=None)


@admin_bp.route("/domains/<int:domain_id>/edit", methods=["GET", "POST"])
@login_required
def domain_edit(domain_id):
    domain = db.session.get(Domain, domain_id)
    if not domain:
        abort(404)
    return render_template("admin/domain_form.html", mode="edit", domain=domain)


@admin_bp.route("/domains/<int:domain_id>/statements/new", methods=["GET", "POST"])
@login_required
def ps_new(domain_id):
    domain = db.session.get(Domain, domain_id)
    if not domain:
        abort(404)
    all_domains = Domain.query.order_by(Domain.sort_order.asc()).all()
    return render_template("admin/ps_form.html", mode="create", domain=domain, ps=None, all_domains=all_domains)


@admin_bp.route("/statements/<int:ps_id>/edit", methods=["GET", "POST"])
@login_required
def ps_edit(ps_id):
    ps = db.session.get(ProblemStatement, ps_id)
    if not ps:
        abort(404)
    all_domains = Domain.query.order_by(Domain.sort_order.asc()).all()
    return render_template("admin/ps_form.html", mode="edit", domain=ps.domain, ps=ps, all_domains=all_domains)


@admin_bp.route("/export/download")
@login_required
def export_download():
    """Download the generated hackathon-domains.json file as an attachment."""
    payload = build_export_payload()
    content_str = serialize_export_payload(payload)
    return current_app.response_class(
        content_str,
        mimetype="application/json",
        headers={"Content-Disposition": "attachment; filename=hackathon-domains.json"}
    )


# ==============================================================================
# REST API ROUTES — STATS & OVERVIEW
# ==============================================================================

@admin_api_bp.route("/stats", methods=["GET"])
@login_required
def get_stats():
    """Retrieve operational dashboard statistics and activity."""
    total_domains = Domain.query.count()
    published_domains = Domain.query.filter_by(is_published=True).count()
    total_statements = ProblemStatement.query.count()
    published_statements = ProblemStatement.query.filter_by(is_published=True).count()
    draft_statements = total_statements - published_statements

    latest_d = db.session.query(db.func.max(Domain.updated_at)).scalar()
    latest_ps = db.session.query(db.func.max(ProblemStatement.updated_at)).scalar()
    last_updated = max(filter(None, [latest_d, latest_ps]), default=None)

    domains = Domain.query.order_by(Domain.sort_order.asc(), Domain.id.asc()).all()
    domains_data = []
    for d in domains:
        pub_count = sum(1 for ps in d.problem_statements if ps.is_published)
        domains_data.append({
            "id": d.id,
            "name": d.name,
            "slug": d.slug,
            "tag": d.tag,
            "sort_order": d.sort_order,
            "is_published": d.is_published,
            "total_statements": len(d.problem_statements),
            "published_statements": pub_count
        })

    recent_logs = (
        AuditLog.query
        .order_by(AuditLog.created_at.desc())
        .limit(10)
        .all()
    )
    activity_data = [
        {
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "admin_username": log.admin.username if log.admin else "System/CLI",
            "ip": log.ip,
            "created_at": log.created_at.isoformat() + "Z"
        }
        for log in recent_logs
    ]

    return jsonify({
        "stats": {
            "total_domains": total_domains,
            "published_domains": published_domains,
            "total_statements": total_statements,
            "published_statements": published_statements,
            "draft_statements": draft_statements,
            "last_updated": last_updated.isoformat() + "Z" if last_updated else None
        },
        "domains": domains_data,
        "recent_activity": activity_data,
        "export_status": get_export_status()
    })


# ==============================================================================
# REST API ROUTES — DOMAINS CRUD & ORDERING
# ==============================================================================

@admin_api_bp.route("/domains", methods=["GET"])
@login_required
def list_domains():
    domains = Domain.query.order_by(Domain.sort_order.asc(), Domain.id.asc()).all()
    return jsonify({"domains": domains_schema.dump(domains)})


@admin_api_bp.route("/domains", methods=["POST"])
@login_required
def create_domain():
    data = request.get_json(silent=True) or {}
    try:
        validated = domain_schema.load(data)
    except ValidationError as err:
        return api_error("VALIDATION_ERROR", "Validation failed for domain.", fields=err.messages)

    name = validated["name"]
    base_slug = Domain.generate_slug(name)
    slug = base_slug
    counter = 1
    while Domain.query.filter_by(slug=slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    max_order = db.session.query(db.func.max(Domain.sort_order)).scalar() or 0
    sort_order = validated.get("sort_order") or (max_order + 1)

    domain = Domain(
        name=name,
        slug=slug,
        short_description=validated["short_description"],
        sort_order=sort_order,
        is_published=validated.get("is_published", False)
    )
    db.session.add(domain)
    db.session.commit()

    log_audit("domain_create", entity_type="Domain", entity_id=domain.id)
    return jsonify({"domain": domain_schema.dump(domain)}), 201


@admin_api_bp.route("/domains/<int:domain_id>", methods=["GET"])
@login_required
def get_domain(domain_id):
    domain = db.session.get(Domain, domain_id)
    if not domain:
        abort(404)
    dumped = domain_schema.dump(domain)
    dumped["problem_statements"] = problem_statements_schema.dump(domain.problem_statements)
    return jsonify({"domain": dumped})


@admin_api_bp.route("/domains/<int:domain_id>", methods=["PUT"])
@login_required
def update_domain(domain_id):
    domain = db.session.get(Domain, domain_id)
    if not domain:
        abort(404)

    data = request.get_json(silent=True) or {}
    try:
        validated = domain_schema.load(data, partial=True)
    except ValidationError as err:
        return api_error("VALIDATION_ERROR", "Validation failed for domain.", fields=err.messages)

    if "name" in validated:
        new_name = validated["name"]
        domain.name = new_name
        if not domain.is_published:
            base_slug = Domain.generate_slug(new_name)
            slug = base_slug
            counter = 1
            while Domain.query.filter(Domain.slug == slug, Domain.id != domain.id).first():
                slug = f"{base_slug}-{counter}"
                counter += 1
            domain.slug = slug

    if "short_description" in validated:
        domain.short_description = validated["short_description"]
    if "sort_order" in validated:
        domain.sort_order = validated["sort_order"]
    if "is_published" in validated:
        domain.is_published = validated["is_published"]

    db.session.commit()
    log_audit("domain_update", entity_type="Domain", entity_id=domain.id)
    return jsonify({"domain": domain_schema.dump(domain)})


@admin_api_bp.route("/domains/<int:domain_id>", methods=["DELETE"])
@login_required
def delete_domain(domain_id):
    domain = db.session.get(Domain, domain_id)
    if not domain:
        abort(404)

    db.session.delete(domain)
    db.session.commit()
    log_audit("domain_delete", entity_type="Domain", entity_id=domain_id)
    return jsonify({
        "success": True,
        "message": f"Domain {domain_id} and its associated statements deleted."
    })


@admin_api_bp.route("/domains/<int:domain_id>/publish", methods=["POST"])
@login_required
def publish_domain(domain_id):
    domain = db.session.get(Domain, domain_id)
    if not domain:
        abort(404)

    domain.is_published = True
    db.session.commit()
    log_audit("domain_publish", entity_type="Domain", entity_id=domain.id)
    return jsonify({"domain": domain_schema.dump(domain)})


@admin_api_bp.route("/domains/<int:domain_id>/unpublish", methods=["POST"])
@login_required
def unpublish_domain(domain_id):
    domain = db.session.get(Domain, domain_id)
    if not domain:
        abort(404)

    domain.is_published = False
    db.session.commit()
    log_audit("domain_unpublish", entity_type="Domain", entity_id=domain.id)
    return jsonify({"domain": domain_schema.dump(domain)})


@admin_api_bp.route("/domains/reorder", methods=["POST"])
@login_required
def reorder_domains():
    payload = request.get_json(silent=True) or {}
    order = payload.get("order")

    if not isinstance(order, list) or not order:
        return api_error("INVALID_ORDER", "Payload must contain an array of domain IDs.")

    for idx, domain_id in enumerate(order, start=1):
        d = db.session.get(Domain, domain_id)
        if d:
            d.sort_order = idx

    db.session.commit()
    log_audit("domains_reorder", entity_type="Domain")

    domains = Domain.query.order_by(Domain.sort_order.asc(), Domain.id.asc()).all()
    return jsonify({"domains": domains_schema.dump(domains)})


# ==============================================================================
# REST API ROUTES — PROBLEM STATEMENTS CRUD & ORDERING
# ==============================================================================

@admin_api_bp.route("/statements/suggest-code", methods=["GET"])
@login_required
def suggest_code():
    domain_id = request.args.get("domain_id", type=int)
    prefix = "PS"

    existing_codes = [
        row[0] for row in db.session.query(ProblemStatement.code).all()
        if row[0]
    ]

    highest = 0
    for c in existing_codes:
        m = re.match(r"^[A-Z]{1,4}-(\d+)$", c)
        if m:
            highest = max(highest, int(m.group(1)))

    suggested = f"{prefix}-{highest + 1:02d}"
    return jsonify({"suggested_code": suggested})


@admin_api_bp.route("/domains/<int:domain_id>/statements", methods=["GET"])
@login_required
def list_statements(domain_id):
    domain = db.session.get(Domain, domain_id)
    if not domain:
        abort(404)

    statements = (
        ProblemStatement.query
        .filter_by(domain_id=domain.id)
        .order_by(ProblemStatement.sort_order.asc(), ProblemStatement.id.asc())
        .all()
    )
    return jsonify({"problem_statements": problem_statements_schema.dump(statements)})


@admin_api_bp.route("/domains/<int:domain_id>/statements", methods=["POST"])
@login_required
def create_statement(domain_id):
    domain = db.session.get(Domain, domain_id)
    if not domain:
        abort(404)

    data = request.get_json(silent=True) or {}
    try:
        validated = problem_statement_schema.load(data)
    except ValidationError as err:
        return api_error("VALIDATION_ERROR", "Validation failed for problem statement.", fields=err.messages)

    code = validated["code"]
    existing = ProblemStatement.query.filter_by(code=code).first()
    if existing:
        return api_error("CODE_EXISTS", f"Problem statement with code '{code}' already exists.", fields={"code": ["Code must be globally unique."]})

    max_order = (
        db.session.query(db.func.max(ProblemStatement.sort_order))
        .filter_by(domain_id=domain.id)
        .scalar() or 0
    )
    sort_order = validated.get("sort_order") or (max_order + 1)

    statement = ProblemStatement(
        domain_id=domain.id,
        code=code,
        title=validated["title"],
        difficulty=validated["difficulty"],
        description=validated["description"],
        expected_outcome=validated["expected_outcome"],
        sort_order=sort_order,
        is_published=validated.get("is_published", False)
    )
    db.session.add(statement)
    db.session.commit()

    log_audit("statement_create", entity_type="ProblemStatement", entity_id=statement.id)
    return jsonify({"problem_statement": problem_statement_schema.dump(statement)}), 201


@admin_api_bp.route("/statements/<int:ps_id>", methods=["GET"])
@login_required
def get_statement(ps_id):
    statement = db.session.get(ProblemStatement, ps_id)
    if not statement:
        abort(404)
    return jsonify({"problem_statement": problem_statement_schema.dump(statement)})


@admin_api_bp.route("/statements/<int:ps_id>", methods=["PUT"])
@login_required
def update_statement(ps_id):
    statement = db.session.get(ProblemStatement, ps_id)
    if not statement:
        abort(404)

    data = request.get_json(silent=True) or {}
    try:
        validated = problem_statement_schema.load(data, partial=True)
    except ValidationError as err:
        return api_error("VALIDATION_ERROR", "Validation failed for problem statement.", fields=err.messages)

    if "code" in validated:
        new_code = validated["code"]
        existing = ProblemStatement.query.filter(ProblemStatement.code == new_code, ProblemStatement.id != statement.id).first()
        if existing:
            return api_error("CODE_EXISTS", f"Problem statement with code '{new_code}' already exists.", fields={"code": ["Code must be globally unique."]})
        statement.code = new_code

    if "title" in validated:
        statement.title = validated["title"]
    if "difficulty" in validated:
        statement.difficulty = validated["difficulty"]
    if "description" in validated:
        statement.description = validated["description"]
    if "expected_outcome" in validated:
        statement.expected_outcome = validated["expected_outcome"]
    if "sort_order" in validated:
        statement.sort_order = validated["sort_order"]
    if "is_published" in validated:
        statement.is_published = validated["is_published"]
    if "domain_id" in data and data["domain_id"] != statement.domain_id:
        target_domain = db.session.get(Domain, data["domain_id"])
        if target_domain:
            statement.domain_id = target_domain.id

    db.session.commit()
    log_audit("statement_update", entity_type="ProblemStatement", entity_id=statement.id)
    return jsonify({"problem_statement": problem_statement_schema.dump(statement)})


@admin_api_bp.route("/statements/<int:ps_id>", methods=["DELETE"])
@login_required
def delete_statement(ps_id):
    statement = db.session.get(ProblemStatement, ps_id)
    if not statement:
        abort(404)

    db.session.delete(statement)
    db.session.commit()
    log_audit("statement_delete", entity_type="ProblemStatement", entity_id=ps_id)
    return jsonify({"success": True, "message": f"Statement {ps_id} deleted."})


@admin_api_bp.route("/statements/<int:ps_id>/publish", methods=["POST"])
@login_required
def publish_statement(ps_id):
    statement = db.session.get(ProblemStatement, ps_id)
    if not statement:
        abort(404)

    statement.is_published = True
    db.session.commit()
    log_audit("statement_publish", entity_type="ProblemStatement", entity_id=statement.id)
    return jsonify({"problem_statement": problem_statement_schema.dump(statement)})


@admin_api_bp.route("/statements/<int:ps_id>/unpublish", methods=["POST"])
@login_required
def unpublish_statement(ps_id):
    statement = db.session.get(ProblemStatement, ps_id)
    if not statement:
        abort(404)

    statement.is_published = False
    db.session.commit()
    log_audit("statement_unpublish", entity_type="ProblemStatement", entity_id=statement.id)
    return jsonify({"problem_statement": problem_statement_schema.dump(statement)})


@admin_api_bp.route("/domains/<int:domain_id>/statements/reorder", methods=["POST"])
@login_required
def reorder_statements(domain_id):
    domain = db.session.get(Domain, domain_id)
    if not domain:
        abort(404)
    payload = request.get_json(silent=True) or {}
    order = payload.get("order")

    if not isinstance(order, list) or not order:
        return api_error("INVALID_ORDER", "Payload must contain an array of statement IDs.")

    for idx, ps_id in enumerate(order, start=1):
        ps = ProblemStatement.query.filter_by(id=ps_id, domain_id=domain.id).first()
        if ps:
            ps.sort_order = idx

    db.session.commit()
    log_audit("statements_reorder", entity_type="ProblemStatement", entity_id=domain.id)

    statements = (
        ProblemStatement.query
        .filter_by(domain_id=domain.id)
        .order_by(ProblemStatement.sort_order.asc(), ProblemStatement.id.asc())
        .all()
    )
    return jsonify({"problem_statements": problem_statements_schema.dump(statements)})


# ==============================================================================
# REST API ROUTES — EXPORT & PUBLISH TO STATIC WEBSITE
# ==============================================================================

@admin_api_bp.route("/export", methods=["POST"])
@login_required
def export_website():
    """
    Atomically export published domains and problem statements to data/hackathon-domains.json.
    """
    try:
        success, export_path, payload = export_to_file(
            user_id=current_user.id,
            ip=request.remote_addr or "127.0.0.1"
        )
        status_data = get_export_status()
        return jsonify({
            "success": True,
            "message": "Done. Now upload data/hackathon-domains.json to your website (or commit and push it). The site updates when that file is live.",
            "export_path": export_path,
            "domain_count": len(payload.get("domains", [])),
            "status": status_data
        })
    except Exception as e:
        return api_error("EXPORT_FAILED", f"Export failed: {str(e)}", status_code=500)


@admin_api_bp.route("/export/status", methods=["GET"])
@login_required
def export_status_api():
    """Get current export status and pending changes."""
    return jsonify({"status": get_export_status()})
