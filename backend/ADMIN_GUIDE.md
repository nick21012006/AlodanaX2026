# ALODANAX Admin Panel — Operator Guide (Local Publish Mode)

Welcome to the **ALODANAX Admin Panel**. This tool allows the TechFest hackathon team to manage hackathon tracks, domains, and problem statements directly from a secure local web interface on your own computer.

> **Note on Architecture:**
> The public ALODANAX website is 100% static. The admin panel runs locally on your machine (`127.0.0.1`), where you draft, edit, and publish problem statements. When you click **"PUBLISH TO WEBSITE"**, the panel exports a single clean JSON file: `data/hackathon-domains.json`. You simply upload or commit that file to your static hosting provider (e.g., GitHub Pages, Netlify, Vercel), and the public website updates instantly.

---

## 1. Prerequisites & First-Time Setup

You only need **Python 3.10+** installed on your system.

### Step 1: Open Terminal in the `backend/` Folder
```bash
cd backend
```

### Step 2: Set Up Virtual Environment & Dependencies
On Windows (PowerShell / Command Prompt):
```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

On macOS / Linux:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Step 3: Create Your First Admin User
Run the interactive CLI command:
```bash
flask --app wsgi create-admin
```
You will be prompted to choose a username (3–32 characters, alphanumeric with underscores/hyphens) and a strong password (minimum 12 characters, at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 symbol).

### Step 4 (Optional): Seed Demo Content
To populate standard placeholder tracks:
```bash
flask --app wsgi seed-demo
```
> **Important Note:** Demo items are created as **unpublished drafts**. They will not appear on the public website until you explicitly toggle them to "Published".

---

## 2. Starting the Admin Panel

Start the local server bound strictly to your local machine:

```powershell
flask --app wsgi run --host 127.0.0.1 --port 5000
```

- **Admin URL:** [http://127.0.0.1:5000/admin/](http://127.0.0.1:5000/admin/)
- **Stealth Link:** A subtle anchor `⌁` is also present in the website footer next to the copyright notice.

> 🔒 **Security Notice:** The admin server is strictly configured to bind to `127.0.0.1` (localhost only). It refuses to bind to `0.0.0.0` or local network addresses, preventing any external or unauthorized network access.

---

## 3. Managing Hackathon Domains & Problem Statements

### Domains (Tracks)
1. Navigate to **Domains** in the top navigation bar.
2. Click **+ CREATE DOMAIN** to add a new domain track.
3. Enter the Track Name (e.g., `AI & Autonomous Systems`) and a Short Description.
4. Use the **▲ / ▼** buttons to reorder tracks. The domain tags (`DOMAIN 01`, `DOMAIN 02`, etc.) automatically update to reflect their exact position.
5. Use the **Draft / Published** toggle switch to control visibility.

### Problem Statements
1. In the **Domains** list, click **Manage Statements** on any domain track.
2. Click **+ ADD PROBLEM STATEMENT**.
3. Fields required:
   - **Code:** e.g., `PS-01`, `PS-02` (click the **Suggest Next Code** button to automatically pick the next sequential code).
   - **Difficulty:** Choose `EASY`, `MEDIUM`, `HARD`, or `EXTREME`.
   - **Title:** Descriptive title of the challenge.
   - **Description:** Clear problem context and requirements (supports multi-line formatting).
   - **Expected Outcome:** Deliverables, benchmarks, and prototype criteria.
4. Use the **Live Public Preview** pane on the right side of the screen to preview exactly how the card will look to contestants on the website before saving.
5. Set the statement status to **Published** when ready for public announcement.

---

## 4. Publishing Changes to the Website

Changes made in the admin panel are stored in your local SQLite database until you publish them.

### Pending Changes Indicator
Whenever you add, modify, reorder, or toggle domains/statements:
- The admin dashboard displays an amber warning banner: **"YOU HAVE UNPUBLISHED CHANGES"**.
- This indicates that your local database has updates that have not yet been exported to the static website file.

### Step 1: Export the Website File
You can export the file using either method:
- **From the UI:** On the Dashboard or Domains page, click the blue **"PUBLISH TO WEBSITE"** button.
- **Or from the CLI:**
  ```bash
  flask --app wsgi export
  ```

This atomically generates/updates:
```
data/hackathon-domains.json
```
at the project root.

> **Publishing Rules:**
> - Only **Published** domains and **Published** problem statements are included.
> - Any domain that has **zero** published problem statements is automatically excluded from the export.
> - If all domains are in draft, the export file will contain `domains: []`. The public website will automatically display: *"Problem statements will be announced soon."*

### Step 2: Push or Upload to Your Static Host
Once `data/hackathon-domains.json` is exported:
- **Git workflow:**
  ```bash
  git add data/hackathon-domains.json
  git commit -m "Update hackathon problem statements"
  git push
  ```
- **FTP / Hosting panel:** Simply upload `data/hackathon-domains.json` into the `data/` folder on your web server.

As soon as the file is live on your website, anyone visiting `hackathon.html` will instantly see the updated tracks and problem statements.

---

## 5. Maintenance & Utilities

### Backing Up the Database
To create a timestamped backup of your SQLite database:
```bash
flask --app wsgi backup-db
```
The backup file will be saved in `backend/backups/alodanax-YYYYMMDD-HHMM.db`.

### Resetting an Admin Password
If you forget an admin password:
```bash
flask --app wsgi reset-password
```
Follow the interactive prompts to select the username and set a new password.

### Downloading the Exported JSON Directly
If you need a local copy of the published JSON without navigating file directories:
- Go to `http://127.0.0.1:5000/admin/export/download` while logged in to instantly trigger a browser download of `hackathon-domains.json`.

---

## 6. Quick Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| Public site still shows old problem statements | Browser cache or `data/` file not updated on host | Hard refresh browser (`Ctrl+F5` / `Cmd+Shift+R`). Verify `data/hackathon-domains.json` was pushed/uploaded. |
| Exported JSON has empty `domains: []` | Items are drafts | In the admin panel, make sure both the Domain and its Problem Statements are set to **Published** before clicking "Publish to website". |
| Cannot access `http://localhost:5000/admin/` | Local server not running | Open terminal in `backend/` and run `flask --app wsgi run --host 127.0.0.1 --port 5000`. |
| Account locked for 15 minutes | 5 consecutive failed login attempts | Wait 15 minutes or reset password via `flask --app wsgi reset-password`. |
