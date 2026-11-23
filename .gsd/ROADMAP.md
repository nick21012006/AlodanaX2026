# ROADMAP.md — ALODANAX Admin Panel (Part 1B: Local Publish Mode)

> **Status:** Complete
> **Target:** Local Publish Mode for Hackathon Tracks (Domains + Problem Statements)

---

## Phases Overview

| Phase | Description | Status |
|---|---|---|
| **Phase 1B.1** | Scope Realignment: Update SPEC.md, ROADMAP.md, STATE.md; strip team module, photo uploads, public API, and CORS. |  Completed |
| **Phase 1B.2** | Export Service & Pending Changes: Implement `export_service.py`, `ExportState` model, atomic write to `data/hackathon-domains.json`, and CLI `export` + `backup-db`. |  Completed |
| **Phase 1B.3** | Admin UI & Endpoints: Add "PUBLISH TO WEBSITE" card, "Download JSON" route, pending-changes banner across UI, and remove team UI. |  Completed |
| **Phase 1B.4** | `hackathon.html` Controller Update: Update fetch to relative `data/hackathon-domains.json` with 5s timeout, shape validation, inline fallback, and friendly empty state. |  Completed |
| **Phase 1B.5** | Test Suite & Verification: Test export shape/order/filtering/atomic write, no CORS/no public API, pending changes indicator, frontend integration/fallback/empty state, and auth security. |  Completed |
| **Phase 1B.6** | Deliverable `backend/ADMIN_GUIDE.md`: Author beginner-friendly guide covering setup, admin creation, running, publishing, backups, and password reset. |  Completed |
