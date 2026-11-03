/**
 * ALODANAX TechFest - Hackathon Portal Page Controller
 * Handles domain tabs, problem statement cards, #domain=<slug> deep linking,
 * asynchronous PPT HEAD verification, and registration CTA linking to events.js.
 */

(function (window) {
  'use strict';

  let currentDomainSlug = 'domain-1';

  function init() {
    // 1. Render Subpage Hero
    if (window.ALODANAX_COMPONENTS && window.ALODANAX_COMPONENTS.renderSubpageHero) {
      window.ALODANAX_COMPONENTS.renderSubpageHero('hackathon-hero', {
        breadcrumb: 'HACKATHON',
        titleSolid: '24-HOUR',
        titleOutline: 'HACKATHON',
        subtitle: 'SYNAPSE PROTOCOL: Build the next frontier of distributed, production-grade solutions in a relentless overnight sprint.'
      });
    }

    if (!window.HACKATHON_DATA) return;
    const data = window.HACKATHON_DATA;

    // 2. Hydrate Meta & Dynamic Registration Button
    hydrateHeroActionBanner(data.meta);

    // 3. Setup Domain Categories & Problem Statements
    setupDomainTabs(data.domains);

    // 4. Asynchronous Sample PPT HEAD Verification
    verifySamplePptDeck(data.meta.samplePptUrl || 'assets/downloads/hackathon-sample.pptx');

    // 5. Render Rules
    renderRules(data.rules);

    // 6. Render Heads Contact
    renderHeads(data.heads);

    // 7. Check Hash Deep Link (#domain=<slug>)
    checkDomainHash();
    window.addEventListener('hashchange', checkDomainHash);
  }

  /**
   * Hydrates the top action banner and links registration to events.js.
   * @param {object} meta
   */
  function hydrateHeroActionBanner(meta) {
    if (!meta) return;
    const durationEl = document.getElementById('hack-duration');
    const dateEl = document.getElementById('hack-date');
    const venueEl = document.getElementById('hack-venue');
    const modeEl = document.getElementById('hack-mode');
    const ctaWrap = document.getElementById('hack-reg-cta-wrap');

    if (durationEl && meta.duration) durationEl.textContent = meta.duration;
    if (dateEl && meta.date) dateEl.textContent = meta.date;
    if (venueEl && meta.venue) venueEl.textContent = meta.venue;
    if (modeEl && meta.mode) modeEl.textContent = meta.mode;

    // Pull registration CTA dynamically from events.js for the Hackathon entry
    if (ctaWrap && window.EVENTS_DATA) {
      const hackEvent = window.EVENTS_DATA.find(e => e.slug === (meta.eventSlug || 'hackathon'));
      const utils = window.ALODANAX_UTILS || {};

      if (hackEvent && utils.renderRegistrationButton) {
        ctaWrap.innerHTML = utils.renderRegistrationButton(hackEvent, {
          className: 'btn-cta btn-primary-neon hack-register-btn',
          text: 'REGISTER ON GOOGLE FORMS'
        });
      } else {
        ctaWrap.innerHTML = `
          <button type="button" class="btn-cta btn-disabled" aria-disabled="true">
            <span class="disabled-status-dot"></span>
            <span>Registration Opening Soon</span>
          </button>
        `;
      }
    }
  }

  /**
   * Sets up domain category tabs and selection interactions.
   * @param {Array} domains
   */
  function setupDomainTabs(domains) {
    const tabsWrap = document.getElementById('domain-tabs-wrap');
    if (!tabsWrap || !Array.isArray(domains) || domains.length === 0) return;

    tabsWrap.innerHTML = '';
    domains.forEach((dom, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `domain-tab-btn ${index === 0 ? 'is-active' : ''}`;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      btn.setAttribute('data-slug', dom.slug);

      btn.innerHTML = `
        <span class="domain-tab-tag">${dom.tag || `DOMAIN 0${index + 1}`}</span>
        <span class="domain-tab-name">${dom.name}</span>
      `;

      btn.addEventListener('click', () => {
        selectDomain(dom.slug);
      });

      tabsWrap.appendChild(btn);
    });

    // Render initial domain
    renderActiveDomain(domains[0]);
  }

  /**
   * Selects a domain and updates UI.
   * @param {string} slug
   */
  function selectDomain(slug) {
    if (!window.HACKATHON_DATA) return;
    const domain = window.HACKATHON_DATA.domains.find(d => d.slug === slug);
    if (!domain) return;

    currentDomainSlug = slug;

    // Update Tab Buttons
    document.querySelectorAll('.domain-tab-btn').forEach(btn => {
      const match = (btn.getAttribute('data-slug') === slug);
      btn.classList.toggle('is-active', match);
      btn.setAttribute('aria-selected', match ? 'true' : 'false');
    });

    renderActiveDomain(domain);

    // Sync Hash without scroll jump
    if (window.location.hash !== `#domain=${slug}`) {
      window.location.hash = `domain=${slug}`;
    }
  }

  /**
   * Renders problem statements for the currently active domain.
   * @param {object} domain
   */
  function renderActiveDomain(domain) {
    if (!domain) return;
    const titleEl = document.getElementById('domain-active-title');
    const descEl = document.getElementById('domain-active-desc');
    const grid = document.getElementById('problem-statements-grid');

    if (titleEl) titleEl.textContent = domain.name;
    if (descEl) descEl.textContent = domain.shortDescription || '';

    if (!grid) return;
    grid.innerHTML = '';

    if (Array.isArray(domain.problemStatements)) {
      domain.problemStatements.forEach(ps => {
        const card = document.createElement('article');
        card.className = 'problem-statement-card';

        const diffClass = (ps.difficulty === 'EXTREME' || ps.difficulty === 'HARD') ? 'badge-hard' : 'badge-medium';

        card.innerHTML = `
          <div class="ps-card-header">
            <span class="ps-id-badge">${ps.id}</span>
            <span class="ps-diff-badge ${diffClass}">${ps.difficulty || 'CORE'}</span>
          </div>
          <h4 class="ps-title">${ps.title}</h4>
          <p class="ps-desc">${ps.description}</p>
          <div class="ps-outcome-box">
            <span class="ps-outcome-lbl">EXPECTED OUTCOME:</span>
            <p class="ps-outcome-text">${ps.expectedOutcome}</p>
          </div>
        `;

        grid.appendChild(card);
      });
    }
  }

  /**
   * Checks for existence of the sample PPT via an asynchronous HEAD request.
   * If missing or error, disables the button with "Sample coming soon".
   * @param {string} url
   */
  function verifySamplePptDeck(url) {
    const wrap = document.getElementById('ppt-download-wrap');
    if (!wrap) return;

    fetch(url, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          wrap.innerHTML = `
            <a href="${url}" download class="btn-cta btn-primary-neon" aria-label="Download standardized presentation template">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>DOWNLOAD SAMPLE DECK</span>
            </a>
          `;
        } else {
          showPptUnavailable(wrap);
        }
      })
      .catch(() => {
        showPptUnavailable(wrap);
      });
  }

  function showPptUnavailable(wrap) {
    wrap.innerHTML = `
      <button type="button" class="btn-cta btn-disabled" aria-disabled="true" title="Presentation template is pending upload">
        <span class="disabled-status-dot"></span>
        <span>Sample coming soon</span>
      </button>
    `;
  }

  /**
   * Renders the numbered list of hackathon rules.
   * @param {Array} rules
   */
  function renderRules(rules) {
    const list = document.getElementById('hackathon-rules-list');
    if (!list || !Array.isArray(rules)) return;

    list.innerHTML = '';
    rules.forEach(rule => {
      const li = document.createElement('li');
      li.className = 'hack-rule-item';
      li.textContent = rule;
      list.appendChild(li);
    });
  }

  /**
   * Renders hackathon heads contact cards.
   * @param {Array} heads
   */
  function renderHeads(heads) {
    const grid = document.getElementById('hackathon-heads-grid');
    if (!grid || !Array.isArray(heads)) return;

    const utils = window.ALODANAX_UTILS || {};
    grid.innerHTML = '';

    heads.forEach(h => {
      const phoneSafe = utils.formatSafeLink ? utils.formatSafeLink('tel', h.phone) : null;
      const emailSafe = utils.formatSafeLink ? utils.formatSafeLink('mailto', h.email) : null;

      const phoneDisplay = phoneSafe ? `<a href="${phoneSafe}" class="head-contact-link">${h.phone}</a>` : `<span class="badge-tba">TBA</span>`;
      const emailDisplay = emailSafe ? `<a href="${emailSafe}" class="head-contact-link">${h.email}</a>` : `<span class="badge-tba">TBA</span>`;

      const card = document.createElement('div');
      card.className = 'hackathon-head-card';
      card.innerHTML = `
        <span class="head-role-badge">${h.role || 'LEAD'}</span>
        <h4 class="head-name">${h.name}</h4>
        <div class="head-contacts-list">
          <div class="head-contact-row"><strong>TEL:</strong> ${phoneDisplay}</div>
          <div class="head-contact-row"><strong>EMAIL:</strong> ${emailDisplay}</div>
        </div>
      `;

      grid.appendChild(card);
    });
  }

  /**
   * Checks #domain=<slug> on load and hash change.
   */
  function checkDomainHash() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#domain=')) {
      const slug = hash.replace('#domain=', '').trim();
      if (slug && slug !== currentDomainSlug) {
        selectDomain(slug);
      }
    }
  }

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
