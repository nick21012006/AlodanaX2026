from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent


def test_hackathon_html_integration_script():
    """Verify hackathon.html fetches relative data/hackathon-domains.json with AbortController, escapeHtml, and fallback."""
    hackathon_path = ROOT_DIR / "hackathon.html"
    assert hackathon_path.exists(), "hackathon.html must exist"

    content = hackathon_path.read_text(encoding="utf-8")

    # 1. No hardcoded backend URL / API_BASE
    assert "const API_BASE = 'http://localhost:5000';" not in content
    assert "data/hackathon-domains.json" in content

    # 2. AbortController with 5s timeout and cache: 'no-cache'
    assert "AbortController" in content
    assert "cache: 'no-cache'" in content
    assert "timeoutId = setTimeout(() => controller.abort(), 5000);" in content

    # 3. Payload validation
    assert "function isValidPayload" in content
    assert "schemaVersion" in content

    # 4. escapeHtml function present and defined
    assert "function escapeHtml(str)" in content
    assert ".replace(/&/g, '&amp;')" in content
    assert ".replace(/</g, '&lt;')" in content
    assert ".replace(/>/g, '&gt;')" in content

    # 5. Fallback to inline domains on error or invalid payload
    assert "HACKATHON_DATA.domains" in content

    # 6. Empty state message when valid payload has 0 published domains
    assert "Problem statements will be announced soon." in content

    # 7. CSS white-space: pre-line on problem statement description and outcome
    assert "white-space: pre-line" in content

    # 8. Deep linking fallback
    assert "slugToSelect" in content or "currentData.domains[0].slug" in content


def test_shared_blocks_untouched():
    """Verify shared sections remain intact in hackathon.html."""
    hackathon_path = ROOT_DIR / "hackathon.html"
    content = hackathon_path.read_text(encoding="utf-8")

    assert "/* ==== SHARED BASE CSS ==== */" in content
    assert "<!-- Shared Utilities -->" in content
