# STATE.md — ALODANAX Project State

> **Updated:** 2026-11-21T18:40:00Z
> **Milestone:** ALODANAX Admin Panel — Part 1B: Local Publish Mode
> **Current Phase:** Phase 1B Complete
> **Status:** Completed & Empirically Verified

---

## Current Position

- **Phase:** All Phases (1B.1 - 1B.6) Complete
- **Status:** Complete
- **Last Action:** Verified 100% test pass rate (39/39 passing), verified CLI export and backup-db commands, generated `backend/ADMIN_GUIDE.md`, created `data/hackathon-domains.json`, and ran typography audits.

---

## Empirical Verification Summary

1. **Pytest Test Suite:**
   - Command: `pytest -c pytest.ini tests -v`
   - Result: 39 passed in 7.51s (100% pass rate)
   - Covered:
     - `test_export.py`: Payload schema, filtering published domains with published statements, atomic write, pending changes status, export download, API trigger.
     - `test_local_mode.py`: Host binding rejection (non-local IPs rejected), no public API routes (404), no CORS headers, local session cookie settings.
     - `test_frontend_integration.py`: `hackathon.html` relative data fetch, 5s AbortController timeout, `cache: 'no-cache'`, `isValidPayload`, silent inline fallback, empty state copy, intact shared blocks.
     - `test_models_cli.py`: Admin model lockout/auth, Domain cascade delete, CLI create-admin, reset-password, seed-demo, export, and backup-db.
     - `test_admin_api.py`: Domain CRUD, validation against HTML/length, statement auto-suggest, reordering, duplicate codes, publishing.
     - `test_admin_ui.py`: Dashboard, domains list, domain form, statement form with live preview, 404 page.
     - `test_auth.py`: Login, lockout, logout, password change, security headers.

2. **CLI Verification:**
   - `flask --app wsgi export`: Successfully exported 0 published domains to `data/hackathon-domains.json` with prompt to upload/commit.
   - `flask --app wsgi backup-db`: Successfully backed up SQLite database to `backend/backups/alodanax-20261121-1838.db`.

3. **Audits:**
   - `node tools/audit-typography.mjs`: Completed cleanly across all existing pages without errors.

---

## Active Decisions & Architectural Invariants

| Decision | Choice | Rationale | Affects |
|----------|--------|-----------|---------|
| Architecture Scope | Hackathon Tracks Only | Prompt Part 1B scope strictly limits admin to Hackathon domains + statements | Whole backend |
| Distribution Model | Local Static JSON Export | Admin generates `data/hackathon-domains.json`; public site reads it statically with no live backend | `export_service.py`, `hackathon.html` |
| Local-Only Binding | `127.0.0.1` strictly | Backend runs only on local machine; never binds to `0.0.0.0` | `wsgi.py`, `config.py` |
| Pending Changes | SHA-256 Hash Tracking | Deterministic comparison between current DB published state and last export hash | `export_service.py`, `dashboard.html` |
| Atomic File Write | Tempfile + atomic rename | Ensures no half-written JSON files can ever be read by the frontend | `export_service.py` |
| Frontend Fallback | Inline `HACKATHON_DATA.domains` | 5-second timeout with silent fallback ensures festival site never displays broken UI | `hackathon.html` |
| Empty State | "Problem statements will be announced soon." | Shown when export JSON is valid but contains zero published domains | `hackathon.html` |
