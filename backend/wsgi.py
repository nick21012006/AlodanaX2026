import os
import sys
from pathlib import Path

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv

# Load .env from backend folder if present, or workspace root
env_path = backend_dir / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv(backend_dir.parent / ".env")

from app import create_app
from app.config import Config
from cli import register_cli_commands

app = create_app()
register_cli_commands(app)

if __name__ == "__main__":
    host = os.getenv("FLASK_RUN_HOST", "127.0.0.1")
    port = int(os.getenv("FLASK_RUN_PORT", "5000"))
    Config.validate_host(host, os.getenv("FLASK_ENV", "development"))
    app.run(host=host, port=port)
