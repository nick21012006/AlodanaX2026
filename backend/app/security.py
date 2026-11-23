import re
from argon2 import PasswordHasher, Type
from argon2.exceptions import VerifyMismatchError, InvalidHashError

# Argon2id password hasher configuration
_hasher = PasswordHasher(
    time_cost=2,
    memory_cost=65536,  # 64 MiB
    parallelism=1,
    hash_len=32,
    type=Type.ID
)

# Pre-computed dummy hash to equalize timing when a username does not exist
_DUMMY_HASH = _hasher.hash("alodanax-dummy-timing-hash-string-value-2026")

# Common weak passwords list to reject
COMMON_PASSWORDS = {
    "password", "123456789012", "admin12345678", "qwertyuiop12",
    "password12345", "welcome12345", "administrator", "alodanax1234",
    "letmein12345", "changeme1234", "techfest2026", "collegefest12"
}

HTML_PROHIBITED_REGEX = re.compile(r"<\s*script|<\s*[a-zA-Z]", re.IGNORECASE)
CONTROL_CHARS_REGEX = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")
MULTI_NEWLINES_REGEX = re.compile(r"\n\s*\n\s*\n+")


def hash_password(password: str) -> str:
    """Hash a password using Argon2id."""
    return _hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    """Verify a password against an Argon2id hash."""
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def needs_rehash(password_hash: str) -> bool:
    """Check if hash needs to be upgraded to newer parameters."""
    try:
        return _hasher.check_needs_rehash(password_hash)
    except Exception:
        return True


def dummy_verify():
    """Perform constant-time dummy verification for unknown users."""
    try:
        _hasher.verify(_DUMMY_HASH, "dummy-password-check")
    except Exception:
        pass


def validate_password_strength(password: str, username: str = None) -> tuple[bool, str | None]:
    """Validate password against security policy: >=12 chars, not common, not equal to username."""
    if not password or len(password) < 12:
        return False, "Password must be at least 12 characters in length."

    if username and password.strip().lower() == username.strip().lower():
        return False, "Password cannot be identical to the username."

    if password.strip().lower() in COMMON_PASSWORDS:
        return False, "Password is too common or easily guessable."

    return True, None


def sanitize_text(text: str, allow_newlines: bool = True) -> str:
    """
    Sanitize text input:
    - strip control characters
    - trim whitespace
    - collapse >2 blank lines to 2 blank lines
    """
    if text is None:
        return ""
    
    # Remove ASCII control characters
    cleaned = CONTROL_CHARS_REGEX.sub("", text)
    
    if not allow_newlines:
        cleaned = " ".join(cleaned.split())
    else:
        # Standardize line endings
        cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")
        # Collapse >2 consecutive blank lines
        cleaned = MULTI_NEWLINES_REGEX.sub("\n\n", cleaned)
        cleaned = cleaned.strip()

    return cleaned


def contains_html_or_script(text: str) -> bool:
    """Check if string contains <script or < followed by an alphabetic character."""
    if not text:
        return False
    return bool(HTML_PROHIBITED_REGEX.search(text))
