import re
from marshmallow import Schema, fields, validate, validates, ValidationError, pre_load, EXCLUDE
from app.security import contains_html_or_script, sanitize_text

CODE_REGEX = re.compile(r"^[A-Z]{1,4}-\d{1,3}$")


def validate_no_html(value: str):
    """Ensure string does not contain HTML tags or script blocks."""
    if value and contains_html_or_script(value):
        raise ValidationError("HTML is not allowed in content.")


class SanitizedString(fields.String):
    """String field that strips control characters and trims excess whitespace."""
    def __init__(self, allow_newlines=False, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.allow_newlines = allow_newlines

    def _deserialize(self, value, attr, data, **kwargs):
        deserialized = super()._deserialize(value, attr, data, **kwargs)
        if deserialized is not None:
            return sanitize_text(deserialized, allow_newlines=self.allow_newlines)
        return deserialized


class DomainSchema(Schema):
    """Marshmallow schema for Domain validation and serialization."""
    id = fields.Int(dump_only=True)
    slug = fields.Str(dump_only=True)
    name = SanitizedString(
        allow_newlines=False,
        required=True,
        validate=[
            validate.Length(min=1, max=120, error="Domain name must be between 1 and 120 characters."),
            validate_no_html
        ]
    )
    short_description = SanitizedString(
        allow_newlines=False,
        required=True,
        validate=[
            validate.Length(min=1, max=300, error="Short description must be between 1 and 300 characters."),
            validate_no_html
        ]
    )
    sort_order = fields.Int(load_default=0)
    is_published = fields.Bool(load_default=False)
    tag = fields.Str(dump_only=True)
    statement_count = fields.Method("get_statement_count", dump_only=True)
    published_statement_count = fields.Method("get_published_statement_count", dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    def get_statement_count(self, obj):
        return len(obj.problem_statements) if hasattr(obj, "problem_statements") else 0

    def get_published_statement_count(self, obj):
        if not hasattr(obj, "problem_statements"):
            return 0
        return sum(1 for ps in obj.problem_statements if ps.is_published)


class ProblemStatementSchema(Schema):
    """Marshmallow schema for Problem Statement validation and serialization."""
    id = fields.Int(dump_only=True)
    domain_id = fields.Int(dump_only=True)
    code = SanitizedString(
        allow_newlines=False,
        required=True,
        validate=[
            validate.Length(min=2, max=16),
            validate.Regexp(CODE_REGEX, error="Code must match pattern like 'PS-01' (1-4 uppercase letters, hyphen, 1-3 digits)."),
            validate_no_html
        ]
    )
    title = SanitizedString(
        allow_newlines=False,
        required=True,
        validate=[
            validate.Length(min=1, max=150, error="Title must be between 1 and 150 characters."),
            validate_no_html
        ]
    )
    difficulty = fields.Str(
        required=True,
        validate=validate.OneOf(
            ["EASY", "MEDIUM", "HARD", "EXTREME"],
            error="Difficulty must be one of: EASY, MEDIUM, HARD, EXTREME."
        )
    )
    description = SanitizedString(
        allow_newlines=True,
        required=True,
        validate=[
            validate.Length(min=1, max=1500, error="Description must be between 1 and 1500 characters."),
            validate_no_html
        ]
    )
    expected_outcome = SanitizedString(
        allow_newlines=True,
        required=True,
        validate=[
            validate.Length(min=1, max=800, error="Expected outcome must be between 1 and 800 characters."),
            validate_no_html
        ]
    )
    sort_order = fields.Int(load_default=0)
    is_published = fields.Bool(load_default=False)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


domain_schema = DomainSchema()
domains_schema = DomainSchema(many=True)
problem_statement_schema = ProblemStatementSchema()
problem_statements_schema = ProblemStatementSchema(many=True)
