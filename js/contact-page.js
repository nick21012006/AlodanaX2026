/**
 * ALODANAX TechFest - Contact & Inquiries Interaction Controller
 * Handles map degradation, event coordinators aggregation from events.js,
 * accessible FAQ accordion, and inquiry form validation with honeypot spam protection.
 */

(function (window) {
  'use strict';

  function init() {
    // 1. Render Subpage Hero
    if (window.ALODANAX_COMPONENTS && window.ALODANAX_COMPONENTS.renderSubpageHero) {
      window.ALODANAX_COMPONENTS.renderSubpageHero('contact-hero', {
        breadcrumb: 'CONTACT',
        titleSolid: 'GET IN',
        titleOutline: 'TOUCH',
        subtitle: 'Connect with festival coordinators, dispatch official inquiries, explore campus location, and find answers to common questions.'
      });
    }

    const site = window.SITE_DATA || {};
    const utils = window.ALODANAX_UTILS || {};

    // 2. Hydrate Official Contacts & Campus Address
    hydrateOfficialContacts(site, utils);

    // 3. Render Map or Graceful Designed Placeholder
    renderMapArea(site.map, site.college, utils);

    // 4. Aggregate Event Coordinators from events.js (Single Source of Truth)
    renderEventCoordinators(window.EVENTS_DATA, utils);

    // 5. Render FAQ Accordion from faq.js
    renderFaqAccordion(window.FAQ_DATA);

    // 6. Setup Inquiry Form Controller
    setupInquiryForm(site.inquiryEndpoint, utils);
  }

  /**
   * Hydrates college address, direct contacts, and verified social links.
   * @param {object} site
   * @param {object} utils
   */
  function hydrateOfficialContacts(site, utils) {
    const college = site.college || {};
    const contacts = site.contacts || {};
    const socials = site.socials || {};

    const fullTitleEl = document.getElementById('college-full-title');
    const addressEl = document.getElementById('college-address');
    const emailEl = document.getElementById('official-email-val');
    const phoneEl = document.getElementById('official-phone-val');
    const venueEl = document.getElementById('official-venue-val');
    const socialsWrap = document.getElementById('contact-socials-wrap');

    if (fullTitleEl) fullTitleEl.textContent = college.fullTitle || '[DEPARTMENT, COLLEGE]';
    if (addressEl) addressEl.textContent = college.address || '[CAMPUS ADDRESS, CITY, STATE, PIN]';
    if (venueEl) venueEl.textContent = college.venue || '[VENUE TBA]';

    if (emailEl) {
      const emailLink = utils.formatSafeLink ? utils.formatSafeLink('mailto', contacts.email) : null;
      emailEl.innerHTML = emailLink
        ? `<a href="${emailLink}" class="coord-link">${contacts.email}</a>`
        : `<span class="badge-tba">TBA</span>`;
    }

    if (phoneEl) {
      const phoneLink = utils.formatSafeLink ? utils.formatSafeLink('tel', contacts.phone) : null;
      phoneEl.innerHTML = phoneLink
        ? `<a href="${phoneLink}" class="coord-link">${contacts.phone}</a>`
        : `<span class="badge-tba">TBA</span>`;
    }

    if (socialsWrap) {
      let socialsHtml = '';
      const socialKeys = ['instagram', 'linkedin', 'github', 'youtube', 'x'];
      socialKeys.forEach(k => {
        const url = socials[k];
        if (url && !utils.isPlaceholder(url)) {
          socialsHtml += `
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="social-pill" aria-label="${k.toUpperCase()}">
              ${k.toUpperCase()}
            </a>
          `;
        }
      });
      socialsWrap.innerHTML = socialsHtml;
    }
  }

  /**
   * Renders map iframe if embedUrl exists; otherwise renders a designed dark card.
   * Never guesses or geocodes an unknown address.
   * @param {object} map
   * @param {object} college
   * @param {object} utils
   */
  function renderMapArea(map, college, utils) {
    const mapArea = document.getElementById('map-frame-area');
    if (!mapArea) return;

    map = map || {};
    const embedUrl = map.embedUrl;
    const mapLink = map.link;

    // Check if embedUrl is a real, non-placeholder URL
    if (embedUrl && !utils.isPlaceholder(embedUrl) && embedUrl.startsWith('https://')) {
      mapArea.innerHTML = `
        <iframe
          src="${embedUrl}"
          class="map-iframe"
          title="Google Map of Campus Venue"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen
        ></iframe>
      `;
    } else {
      // Graceful Designed Dark Placeholder Card
      const linkHtml = (mapLink && !utils.isPlaceholder(mapLink))
        ? `<a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="btn-cta btn-secondary-blue map-external-link">
            <span>OPEN IN GOOGLE MAPS</span>
            <span aria-hidden="true">↗</span>
          </a>`
        : `<span class="badge-tba">MAP COORDINATES TBA</span>`;

      mapArea.innerHTML = `
        <div class="map-placeholder-card">
          <div class="map-grid-graphic" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <h4 class="map-ph-title">CAMPUS VENUE MAP</h4>
          <p class="map-ph-desc">
            ${college && college.address ? college.address : '[CAMPUS ADDRESS PENDING ANNOUNCEMENT]'}
          </p>
          <div class="map-ph-action">
            ${linkHtml}
          </div>
        </div>
      `;
    }
  }

  /**
   * Aggregates event-specific coordinators directly from events.js.
   * Single source of truth.
   * @param {Array} events
   * @param {object} utils
   */
  function renderEventCoordinators(events, utils) {
    const grid = document.getElementById('events-coordinators-grid');
    if (!grid || !Array.isArray(events)) return;

    grid.innerHTML = '';
    let totalCards = 0;

    events.forEach(ev => {
      if (Array.isArray(ev.coordinators) && ev.coordinators.length > 0) {
        ev.coordinators.forEach(coord => {
          totalCards++;
          const card = document.createElement('article');
          card.className = `event-coord-card category-${ev.category}`;

          const catBadgeClass = ev.category === 'technical' ? 'cat-technical' : (ev.category === 'gaming' ? 'cat-gaming' : 'cat-non-technical');
          const phoneSafe = utils.formatSafeLink ? utils.formatSafeLink('tel', coord.phone) : null;
          const emailSafe = utils.formatSafeLink ? utils.formatSafeLink('mailto', coord.email) : null;

          const phoneText = phoneSafe ? `<a href="${phoneSafe}" class="coord-link">${coord.phone}</a>` : `<span class="badge-tba">TBA</span>`;
          const emailText = emailSafe ? `<a href="${emailSafe}" class="coord-link">${coord.email}</a>` : `<span class="badge-tba">TBA</span>`;

          card.innerHTML = `
            <div class="coord-card-top">
              <span class="category-badge ${catBadgeClass}">${ev.name}</span>
              <span class="coord-card-role">${coord.role || 'COORDINATOR'}</span>
            </div>
            <h4 class="coord-card-name">${coord.name || '[NAME TBA]'}</h4>
            <div class="coord-card-details">
              <div><span>TEL:</span> ${phoneText}</div>
              <div><span>EMAIL:</span> ${emailText}</div>
            </div>
          `;

          grid.appendChild(card);
        });
      }
    });

    if (totalCards === 0) {
      grid.innerHTML = `<p class="lead-text">Event coordinator details are currently being finalized.</p>`;
    }
  }

  /**
   * Renders the accessible FAQ accordion from faq.js.
   * @param {Array} faqList
   */
  function renderFaqAccordion(faqList) {
    const container = document.getElementById('faq-accordion-container');
    if (!container || !Array.isArray(faqList)) return;

    container.innerHTML = '';

    faqList.forEach((faq, index) => {
      const item = document.createElement('div');
      item.className = 'faq-accordion-item';

      const qId = `faq-btn-${index}`;
      const aId = `faq-ans-${index}`;

      item.innerHTML = `
        <button
          type="button"
          class="faq-question-btn"
          id="${qId}"
          aria-expanded="false"
          aria-controls="${aId}"
        >
          <span class="faq-question-text">${faq.q}</span>
          <span class="faq-toggle-icon" aria-hidden="true">+</span>
        </button>
        <div
          id="${aId}"
          class="faq-answer-panel"
          role="region"
          aria-labelledby="${qId}"
          hidden
        >
          <div class="faq-answer-inner">
            <p>${faq.a}</p>
          </div>
        </div>
      `;

      const btn = item.querySelector('.faq-question-btn');
      const panel = item.querySelector('.faq-answer-panel');
      const icon = item.querySelector('.faq-toggle-icon');

      btn.addEventListener('click', () => {
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        panel.hidden = isExpanded;
        icon.textContent = isExpanded ? '+' : '−';
        item.classList.toggle('is-active', !isExpanded);
      });

      container.appendChild(item);
    });
  }

  /**
   * Configures client-side validation, honeypot spam protection,
   * and endpoint detection for the general inquiry form.
   * @param {string} endpoint
   * @param {object} utils
   */
  function setupInquiryForm(endpoint, utils) {
    const form = document.getElementById('contact-inquiry-form');
    const actionRow = document.getElementById('inquiry-action-row');
    const successPanel = document.getElementById('inquiry-success-panel');
    const resetBtn = document.getElementById('btn-reset-inquiry');

    if (!form || !actionRow) return;

    const isEndpointValid = (endpoint && !utils.isPlaceholder(endpoint) && endpoint.startsWith('https://'));

    // If endpoint is placeholder or not configured: disable submit button with specific note
    if (!isEndpointValid) {
      actionRow.innerHTML = `
        <button type="button" class="btn-cta btn-disabled" aria-disabled="true" title="Live email dispatch is pending configuration">
          <span class="disabled-status-dot"></span>
          <span>Inquiry form will be activated soon</span>
        </button>
        <span class="inquiry-form-note">Inquiry submissions are currently in preview mode.</span>
      `;
    } else {
      actionRow.innerHTML = `
        <button type="submit" class="btn-cta btn-primary-neon" id="btn-submit-inquiry">
          <span>TRANSMIT INQUIRY</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      `;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Check honeypot spam trap
      const honeypot = document.getElementById('inquiry-honeypot');
      if (honeypot && honeypot.value.trim() !== '') {
        console.warn('Spam submission suppressed by honeypot.');
        return;
      }

      let isValid = true;
      const nameInput = document.getElementById('inq-name');
      const emailInput = document.getElementById('inq-email');
      const subjectInput = document.getElementById('inq-subject');
      const messageInput = document.getElementById('inq-message');

      const errName = document.getElementById('err-inq-name');
      const errEmail = document.getElementById('err-inq-email');
      const errSubject = document.getElementById('err-inq-subject');
      const errMessage = document.getElementById('err-inq-message');

      [nameInput, emailInput, subjectInput, messageInput].forEach(el => el && el.classList.remove('is-invalid'));
      [errName, errEmail, errSubject, errMessage].forEach(el => el && (el.textContent = ''));

      // Validate Name
      if (!nameInput.value.trim()) {
        nameInput.classList.add('is-invalid');
        errName.textContent = 'Please provide your full name.';
        isValid = false;
      }

      // Validate Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
        emailInput.classList.add('is-invalid');
        errEmail.textContent = 'Please provide a valid email address.';
        isValid = false;
      }

      // Validate Subject
      if (!subjectInput.value.trim()) {
        subjectInput.classList.add('is-invalid');
        errSubject.textContent = 'Please state an inquiry subject.';
        isValid = false;
      }

      // Validate Message
      if (!messageInput.value.trim() || messageInput.value.trim().length < 10) {
        messageInput.classList.add('is-invalid');
        errMessage.textContent = 'Please enter a message of at least 10 characters.';
        isValid = false;
      }

      if (!isValid) return;

      // Handle successful client-side validation
      form.style.display = 'none';
      if (successPanel) successPanel.style.display = 'block';
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        form.reset();
        form.style.display = 'block';
        if (successPanel) successPanel.style.display = 'none';
      });
    }
  }

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);

