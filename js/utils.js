/**
 * ALODANAX TechFest - Core Utilities & Validation Suite
 * Handles placeholder detection, Google Form validation, safe link formatting,
 * image error fallbacks, and the ?audit=1 diagnostic engine.
 */

(function (window) {
  'use strict';

  /**
   * Check if a value is undefined, empty, or a bracketed placeholder like "[TBA]" or "[NAME]".
   * @param {*} val
   * @returns {boolean}
   */
  function isPlaceholder(val) {
    if (val === null || val === undefined) return true;
    if (typeof val !== 'string') return false;
    const trimmed = val.trim();
    if (trimmed === '') return true;
    return trimmed.startsWith('[') || trimmed.includes('[') && trimmed.includes(']');
  }

  /**
   * Safe text renderer: Returns subtle TBA badge if value is placeholder or empty.
   * @param {string} val
   * @param {string} fallbackLabel
   * @param {boolean} returnHtml
   * @returns {string}
   */
  function formatSafeText(val, fallbackLabel = 'TBA', returnHtml = true) {
    if (isPlaceholder(val)) {
      return returnHtml ? `<span class="badge-tba" aria-label="To be announced">${fallbackLabel}</span>` : fallbackLabel;
    }
    return val;
  }

  /**
   * Safe link generator: returns null if value is a placeholder.
   * Otherwise returns tel:, mailto:, or valid url.
   * @param {'tel'|'mailto'|'url'} type
   * @param {string} val
   * @returns {string|null}
   */
  function formatSafeLink(type, val) {
    if (isPlaceholder(val)) return null;
    const clean = val.trim();
    if (type === 'tel') return `tel:${clean.replace(/[^\d+]/g, '')}`;
    if (type === 'mailto') return `mailto:${clean}`;
    if (type === 'url') return clean.startsWith('http') ? clean : `https://${clean}`;
    return clean;
  }

  /**
   * Validates per-event Google Form URL according to strict festival requirements.
   * URL must:
   * 1. Start with https://
   * 2. Host must be docs.google.com (path /forms), forms.gle, or www.google.com (path /forms)
   * 3. Not be empty or start with "["
   *
   * @param {object} event
   * @returns {string|null} - Returns valid URL string or null if invalid/placeholder
   */
  function getEventRegistrationUrl(event) {
    if (!event || !event.registrationUrl) return null;
    const urlStr = event.registrationUrl.trim();
    if (isPlaceholder(urlStr)) return null;

    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol !== 'https:') return null;

      const host = parsed.hostname.toLowerCase();
      const path = parsed.pathname.toLowerCase();

      if (host === 'forms.gle') return urlStr;
      if ((host === 'docs.google.com' || host === 'www.google.com') && path.startsWith('/forms')) {
        return urlStr;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Renders registration CTA: active Google Form link or disabled "Registration Opening Soon" button.
   * @param {object} event
   * @param {object} options
   * @returns {string} HTML string
   */
  function renderRegistrationButton(event, options = {}) {
    const validUrl = getEventRegistrationUrl(event);
    const extraClass = options.className || 'btn-cta';
    const btnText = options.text || 'REGISTER NOW';

    if (validUrl) {
      return `<a href="${validUrl}" target="_blank" rel="noopener noreferrer" class="${extraClass} btn-primary-neon" aria-label="Register for ${event.name || 'Event'} via official Google Form">
        <span>${btnText}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="7" y1="17" x2="17" y2="7"></line>
          <polyline points="7 7 17 7 17 17"></polyline>
        </svg>
      </a>`;
    }

    return `<button type="button" class="${extraClass} btn-disabled" aria-disabled="true" tabindex="-1" title="Registration link is being finalized">
      <span class="disabled-status-dot" aria-hidden="true"></span>
      <span>Registration Opening Soon</span>
    </button>`;
  }

  /**
   * Verifies that no two different events share the exact same registration URL.
   * Logs console.error if duplicate URLs are found.
   * @param {Array} eventsList
   */
  function verifyUniqueRegistrationUrls(eventsList) {
    if (!Array.isArray(eventsList)) return;
    const seen = new Map();

    eventsList.forEach(ev => {
      const url = getEventRegistrationUrl(ev);
      if (url) {
        if (seen.has(url)) {
          console.error(
            `[ALODANAX REGISTRATION SECURITY]: Duplicate Google Form URL detected!\n` +
            `Event "${ev.name}" shares registration link with "${seen.get(url)}":\n${url}`
          );
        } else {
          seen.set(url, ev.name);
        }
      }
    });
  }

  /**
   * Designed SVG silhouette & initial fallback generator.
   * Produces an inline SVG data-uri with dark styling, electric blue hairline, and typography.
   * @param {'event'|'profile'|'team'|'logo'} type
   * @param {string} label
   * @returns {string}
   */
  function createFallbackSvg(type, label = 'ALODANAX') {
    const safeLabel = (label || 'AX').replace(/[<>&"]/g, '');
    let w = 800, h = 500, ratio = '16:10'; // Default event
    let iconSvg = '';

    if (type === 'profile') {
      w = 400; h = 500; ratio = '4:5';
      iconSvg = `
        <circle cx="200" cy="180" r="50" fill="#0E131F" stroke="#0A84FF" stroke-width="2"/>
        <path d="M120 310 C120 250, 280 250, 280 310 Z" fill="#0E131F" stroke="#0A84FF" stroke-width="2"/>
      `;
    } else if (type === 'team') {
      w = 400; h = 400; ratio = '1:1';
      iconSvg = `
        <circle cx="200" cy="150" r="45" fill="#0E131F" stroke="#0A84FF" stroke-width="2"/>
        <path d="M130 260 C130 210, 270 210, 270 260 Z" fill="#0E131F" stroke="#0A84FF" stroke-width="2"/>
      `;
    } else if (type === 'logo') {
      w = 300; h = 100; ratio = '3:1';
      iconSvg = `<polygon points="30,20 50,50 30,80" fill="none" stroke="#FF1744" stroke-width="3"/>`;
    } else {
      // Event default
      iconSvg = `
        <rect x="360" y="210" width="80" height="80" fill="#0B0D14" stroke="#0A84FF" stroke-width="2" transform="rotate(45 400 250)"/>
        <polyline points="390,250 400,240 410,250" fill="none" stroke="#FF1744" stroke-width="3"/>
      `;
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#05060A"/>
            <stop offset="50%" stop-color="#0B0D14"/>
            <stop offset="100%" stop-color="#020305"/>
          </linearGradient>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(10,132,255,0.06)" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgGrad)"/>
        <rect width="100%" height="100%" fill="url(#grid)"/>
        <rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="none" stroke="rgba(10,132,255,0.3)" stroke-width="1"/>
        ${iconSvg}
        <text x="50%" y="${h - 35}" fill="#8E9AA8" font-family="'Inter', sans-serif" font-size="12" font-weight="600" text-anchor="middle" letter-spacing="2">
          ${safeLabel.toUpperCase()}
        </text>
        <text x="50%" y="${h - 18}" fill="rgba(255,255,255,0.25)" font-family="'Inter', sans-serif" font-size="10" font-weight="500" text-anchor="middle" letter-spacing="1">
          IMAGE ASSET PENDING [${ratio}]
        </text>
      </svg>
    `.trim().replace(/\s+/g, ' ');

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  /**
   * Image onError handler to prevent broken-image icons anywhere in the application.
   * @param {HTMLImageElement} img
   * @param {'event'|'profile'|'team'|'logo'} type
   * @param {string} label
   */
  function handleImageError(img, type = 'event', label = '') {
    if (!img) return;
    img.onerror = null; // Prevent infinite loop
    img.src = createFallbackSvg(type, label || img.alt || 'ALODANAX');
    img.classList.add('is-fallback-image');
  }

  /**
   * Diagnostic dev tool activated via ?audit=1.
   * Scans all loaded data objects and DOM for unfilled placeholders and missing assets.
   */
  function initAuditTool() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('audit') !== '1') return;

    const report = {
      site: [],
      events: [],
      committee: [],
      faculty: [],
      team: [],
      hackathon: [],
      faq: []
    };

    let totalPlaceholders = 0;
    let missingImages = 0;

    // Helper to recursively inspect objects
    function inspect(obj, fileKey, path = '') {
      if (!obj) return;
      if (typeof obj === 'string') {
        if (isPlaceholder(obj)) {
          report[fileKey].push({ path, value: obj, type: 'placeholder' });
          totalPlaceholders++;
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, idx) => inspect(item, fileKey, `${path}[${idx}]`));
      } else if (typeof obj === 'object') {
        Object.keys(obj).forEach(k => inspect(obj[k], fileKey, path ? `${path}.${k}` : k));
      }
    }

    if (window.SITE_DATA) inspect(window.SITE_DATA, 'site');
    if (window.EVENTS_DATA) inspect(window.EVENTS_DATA, 'events');
    if (window.COMMITTEE_DATA) inspect(window.COMMITTEE_DATA, 'committee');
    if (window.FACULTY_DATA) inspect(window.FACULTY_DATA, 'faculty');
    if (window.TEAM_DATA) inspect(window.TEAM_DATA, 'team');
    if (window.HACKATHON_DATA) inspect(window.HACKATHON_DATA, 'hackathon');
    if (window.FAQ_DATA) inspect(window.FAQ_DATA, 'faq');

    // Count missing images on page
    document.querySelectorAll('img').forEach(img => {
      if (img.classList.contains('is-fallback-image') || !img.complete || img.naturalWidth === 0) {
        missingImages++;
      }
    });

    // Console output
    console.group(`%c✦ ALODANAX AUDIT SUITE (?audit=1) ✦`, 'color: #0A84FF; font-size: 14px; font-weight: bold;');
    console.log(`%cTotal Unfilled Placeholders: ${totalPlaceholders}`, 'color: #FF1744; font-weight: bold;');
    console.log(`%cPending / Fallback Image Elements: ${missingImages}`, 'color: #0A84FF;');

    Object.keys(report).forEach(fileKey => {
      const items = report[fileKey];
      if (items.length > 0) {
        console.groupCollapsed(`js/data/${fileKey}.js (${items.length} pending items)`);
        console.table(items);
        console.groupEnd();
      }
    });
    console.groupEnd();

    // Render floating Audit HUD Panel
    renderAuditHud(report, totalPlaceholders, missingImages);
  }

  function renderAuditHud(report, totalPlaceholders, missingImages) {
    let hud = document.getElementById('audit-hud');
    if (hud) hud.remove();

    hud = document.createElement('div');
    hud.id = 'audit-hud';
    hud.className = 'audit-hud-panel';

    let filesHtml = '';
    Object.keys(report).forEach(f => {
      const count = report[f].length;
      filesHtml += `
        <div class="audit-file-row">
          <span class="audit-file-name">js/data/${f}.js</span>
          <span class="audit-file-count ${count > 0 ? 'count-pending' : 'count-done'}">${count} pending</span>
        </div>
      `;
    });

    hud.innerHTML = `
      <div class="audit-hud-header">
        <div class="audit-title-wrap">
          <span class="audit-pulse-dot"></span>
          <strong>DEV AUDIT HUD</strong>
        </div>
        <button type="button" class="audit-close-btn" aria-label="Minimize Audit HUD" id="audit-toggle-btn">_</button>
      </div>
      <div class="audit-hud-body" id="audit-hud-body">
        <div class="audit-stat-strip">
          <div class="audit-stat-box">
            <span class="audit-stat-num">${totalPlaceholders}</span>
            <span class="audit-stat-lbl">PLACEHOLDERS</span>
          </div>
          <div class="audit-stat-box">
            <span class="audit-stat-num">${missingImages}</span>
            <span class="audit-stat-lbl">MISSING ASSETS</span>
          </div>
        </div>
        <div class="audit-files-list">
          ${filesHtml}
        </div>
        <div class="audit-footer-actions">
          <button type="button" class="btn-audit-copy" id="btn-copy-audit">COPY REPORT</button>
        </div>
      </div>
    `;

    document.body.appendChild(hud);

    const toggleBtn = document.getElementById('audit-toggle-btn');
    const hudBody = document.getElementById('audit-hud-body');
    if (toggleBtn && hudBody) {
      toggleBtn.addEventListener('click', () => {
        const isHidden = hudBody.style.display === 'none';
        hudBody.style.display = isHidden ? 'block' : 'none';
        toggleBtn.textContent = isHidden ? '_' : '+';
      });
    }

    const copyBtn = document.getElementById('btn-copy-audit');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = JSON.stringify(report, null, 2);
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = 'COPIED TO CLIPBOARD!';
          setTimeout(() => { copyBtn.textContent = 'COPY REPORT'; }, 2000);
        });
      });
    }
  }

  // Export to window.ALODANAX_UTILS
  window.ALODANAX_UTILS = {
    isPlaceholder,
    formatSafeText,
    formatSafeLink,
    getEventRegistrationUrl,
    renderRegistrationButton,
    verifyUniqueRegistrationUrls,
    createFallbackSvg,
    handleImageError,
    initAuditTool
  };

  // Run audit and duplicate URL verification on load
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('DOMContentLoaded', () => {
      if (window.EVENTS_DATA) {
        verifyUniqueRegistrationUrls(window.EVENTS_DATA);
      }
      initAuditTool();
    });
  }

})(window);
