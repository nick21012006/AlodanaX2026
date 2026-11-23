import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent


class Config:
    """Base configuration for Local Publish Mode."""
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me-use-a-long-random-value-minimum-32-chars")
    
    # Database
    db_url = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'instance' / 'alodanax.db'}")
    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Export path for static publishing
    EXPORT_PATH = os.getenv(
        "EXPORT_PATH",
        str(PROJECT_ROOT / "data" / "hackathon-domains.json")
    )
    
    # Session management
    SESSION_IDLE_MINUTES = int(os.getenv("SESSION_IDLE_MINUTES", "30"))
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=SESSION_IDLE_MINUTES)
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Strict"
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_NAME = "alodanax_session"
    
    # Security & Brute-force protection
    LOGIN_MAX_FAILURES = int(os.getenv("LOGIN_MAX_FAILURES", "5"))
    LOGIN_LOCK_MINUTES = int(os.getenv("LOGIN_LOCK_MINUTES", "15"))
    
    # CSRF
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = 86400  # 24 hours
    WTF_CSRF_HEADERS = ["X-CSRFToken", "X-CSRF-Token"]
    
    # Limiter
    RATELIMIT_ENABLED = True
    RATELIMIT_DEFAULT = ""
    RATELIMIT_STORAGE_URI = "memory://"

    @staticmethod
    def validate_host(host: str, env: str = "development") -> bool:
        """Enforce 127.0.0.1 binding in local publish mode."""
        if env.lower() != "production" and host not in ("127.0.0.1", "localhost"):
            raise ValueError(
                f"Local publish mode refuses non-local host '{host}'. Must bind to 127.0.0.1 only."
            )
        return True


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    TESTING = False
    SESSION_COOKIE_SECURE = False


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    TESTING = False
    SESSION_COOKIE_SECURE = True


class TestingConfig(Config):
    """Testing configuration."""
    DEBUG = False
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False
    RATELIMIT_ENABLED = False
    SESSION_COOKIE_SECURE = False
    EXPORT_PATH = str(BASE_DIR / "instance" / "test_data" / "hackathon-domains.json")


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}
