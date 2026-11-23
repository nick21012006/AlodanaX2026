# ALODANAX — Admin Panel & Flask Backend

The administrative management system and REST API for ALODANAX Hackathon tracks and Team Directory Profile Cards.

Built with Python 3.11+, Flask 3, Flask-SQLAlchemy, Marshmallow, Pillow, and Argon2id password hashing. Feeds both `hackathon.html` and `team.html` with real-time published data while providing zero-downtime offline fallbacks.

---

## 1. System Architecture

- **Application Pattern**: Application Factory (`create_app`) with Blueprints:
  - `public`: `GET /api/public/hackathon/domains` and `GET /api/public/team` (read-only, cached with deterministic ETags, CORS enabled)
  - `media`: `GET /media/team/<filename>` (strict regex-validated photo serving with immutable cache)
  - `auth`: `/admin/login`, `/admin/logout`, `/admin/account` (Argon2id, lockout, session security)
  - `admin`: `/admin/*` (Jinja2 UI views) and `/api/admin/*` (JSON REST API with Marshmallow validation)
- **Database & ORM**: SQLite via Flask-SQLAlchemy, schema migrations via Flask-Migrate (Alembic). Portable to PostgreSQL by changing `DATABASE_URL`.
- **Security Invariants**:
  - Passwords hashed using Argon2id (`argon2-cffi`), verified with constant-time dummy checking to prevent timing attacks.
  - Brute-force lockout: 5 consecutive failed logins lock account for 15 minutes.
  - Rate limiting via Flask-Limiter: 5/min on login, 30/hour on photo uploads, 120/min on public API.
  - CSRF protection: Flask-WTF `CSRFProtect` on all mutating routes with `X-CSRFToken` support.
  - Strict Content-Security-Policy (CSP), `img-src 'self' blob: data:;`, nosniff, DENY framing, same-origin referrers, and `no-store` cache on admin pages.
  - Strict HTML rejection: Content containing `<script` or `<[a-zA-Z]` is rejected server-side (HTTP 400).
- **Photo Upload Security (Single Exception)**:
  - Allowed formats: JPEG, PNG, WebP only. Strictly decoded via Pillow (never trusts extension or MIME).
  - Decompression bomb defense (`Image.MAX_IMAGE_PIXELS = 40_000_000`).
  - Minimum dimensions 400x400; max file size 5 MB.
  - Automatic EXIF orientation (`exif_transpose`), 1:1 center-crop, all metadata stripped (EXIF/GPS/ICC/comments), converted to 800x800 WebP (quality 85) + 400x400 thumbnail.
  - Saved under random UUIDv4 filename (client filename never used).
  - Old photos automatically cleaned up on replacement or member deletion.
- **Frontend Integration**:
  - `hackathon.html` and `team.html` fetch public APIs with a 3-second `AbortController` timeout.
  - Automatically falls back to inline `HACKATHON_DATA.domains` and `TEAM_DATA` if the backend is offline.
  - All dynamic values injected into the DOM are sanitized with `escapeHtml()`.
  - In `team.html`, inline `onerror` attribute has been completely removed to close script-injection risks and replaced with `addEventListener('error', ...)`.

---

## 2. Prerequisites

- Python 3.11+
- Node.js (for running the public TechFest frontend server on port 3000)

---

## 3. Installation & Setup

### Step 1: Create and Activate Virtual Environment

From the repository root:

```bash
# Windows (PowerShell)
python -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv backend/.venv
source backend/.venv/bin/activate
```

### Step 2: Install Python Dependencies

```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables

Copy the provided example environment template:

```bash
cp .env.example .env
```

Review or edit `backend/.env`:

```ini
FLASK_ENV=development
SECRET_KEY=change-me-use-a-long-random-value-minimum-32-chars
DATABASE_URL=sqlite:///instance/alodanax.db
PUBLIC_ORIGINS=http://localhost:3000
PUBLIC_SITE_URL=http://localhost:3000
SESSION_IDLE_MINUTES=30
LOGIN_MAX_FAILURES=5
LOGIN_LOCK_MINUTES=15
```

---

## 4. Database Setup & CLI Commands

All commands are run from the `backend/` directory with the virtual environment activated.

### Run Database Migrations

```bash
flask --app wsgi db upgrade
```

### Create the First Administrator Account

Admin accounts cannot be registered via the web interface. Use the interactive CLI:

```bash
flask --app wsgi create-admin
```

Prompts will ask for:
- **Username**: 3–32 characters (`a-z`, `0-9`, `.`, `_`, `-`)
- **Password**: Minimum 12 characters (masked input via `getpass`, never echoed or stored in plaintext)
- **Confirm Password**

### Reset an Administrator Password

If credentials need to be reset:

```bash
flask --app wsgi reset-password
```

### Seed Initial Hackathon Demo Data (Development Only)

Populates the 3 canonical domains and 6 problem statements from the static frontend as unpublished drafts:

```bash
flask --app wsgi seed-demo
```

*Note: `seed-demo` is idempotent and automatically refuses execution when `FLASK_ENV=production`.*

---

## 5. Running the Application

### Start the Flask Backend (Port 5000)

From `backend/`:

```bash
flask --app wsgi run --port 5000
```

- Admin Dashboard: [http://localhost:5000/admin/](http://localhost:5000/admin/)
- Admin Team Directory: [http://localhost:5000/admin/team](http://localhost:5000/admin/team)
- Public Hackathon API: [http://localhost:5000/api/public/hackathon/domains](http://localhost:5000/api/public/hackathon/domains)
- Public Team API: [http://localhost:5000/api/public/team](http://localhost:5000/api/public/team)

### Start the Public Website Server (Port 3000)

From the project root:

```bash
node server.js
```

- Public Site: [http://localhost:3000/](http://localhost:3000/)
- Hackathon Track Page: [http://localhost:3000/hackathon.html](http://localhost:3000/hackathon.html)
- Team Directory Page: [http://localhost:3000/team.html](http://localhost:3000/team.html)

---

## 6. Running the Test Suite

Run the full pytest suite from `backend/`:

```bash
pytest -v
```

The test suite (54 comprehensive tests) covers:
- Database models, constraints, cascade deletions, and RESTRICT foreign keys
- Administrative CLI commands (`create-admin`, `reset-password`, `seed-demo`)
- Authentication, session lifecycle, lockout, rate limiting, and security headers
- Admin REST API CRUD, publishing logic, reordering, and CSRF protection
- Public API response formatting, filtering, caching, and conditional ETags
- Image upload pipeline, Pillow security validations (SVG/GIF/polyglot rejection, decompression bomb defense, EXIF stripping, 800x800 & 400x400 WebP generation)
- Secure `/media/team/<filename>` route regex validation and cache headers
- Frontend integrations (`hackathon.html` and `team.html`), 3-second offline fallback, XSS sanitization, and `onerror` elimination

---

## 7. Production Deployment Checklist

1. **Production Flag**: Set `FLASK_ENV=production` in `.env`.
2. **Secret Key**: Generate a high-entropy `SECRET_KEY` (e.g. `python -c "import secrets; print(secrets.token_hex(32))"`). The application will refuse to start in production if the key is default or under 32 characters.
3. **HTTPS / TLS**: Terminate SSL at your reverse proxy (Nginx, Caddy, or Cloudflare). Session cookies are configured with `Secure=True` in production.
4. **WSGI Server**: Run Flask using Gunicorn with production workers:
   ```bash
   gunicorn -w 4 -b 127.0.0.1:5000 "wsgi:app"
   ```
5. **Reverse Proxy Configuration (Nginx)**:
   ```nginx
   server {
       listen 443 ssl http2;
       server_name techfest.college.edu;

       location /api/ {
           proxy_pass http://127.0.0.1:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       location /media/ {
           proxy_pass http://127.0.0.1:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       location /admin/ {
           proxy_pass http://127.0.0.1:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       location / {
           root /var/www/alodanax;
           try_files $uri $uri/ =404;
       }
   }
   ```
6. **Same-Origin API Base**: When deployed behind a single domain reverse proxy, set `API_BASE = ''` in both `hackathon.html` and `team.html`.
7. **Database & Uploads Persistence**:
   > **IMPORTANT PRODUCTION NOTE:**
   > Uploaded member photos live on disk inside `instance/uploads/team/`. You **must back up `instance/uploads/` together with the database (`alodanax.db`)**.
   > If deploying on an ephemeral-filesystem host (such as Heroku, AWS ECS, or standard Kubernetes pods without persistent volumes), mount a persistent storage volume (EFS / PVC) to `instance/uploads/` or configure an S3-compatible object storage service.
