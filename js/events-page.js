/**
 * ALODANAX TechFest - Events Portal Interaction Controller
 * Handles live search, category filtering, accessible modal with focus trap,
 * hash deep linking (#event=<slug>), and Google Form registration states.
 */

(function (window) {
  'use strict';

  let currentCategory = 'all';
  let searchQuery = '';
  let activeModalEvent = null;
  let previouslyFocusedElement = null;

  // DOM Elements
  const searchInput = document.getElementById('events-search-input');
  const searchClearBtn = document.getElementById('events-search-clear');
  const categoryChips = document.querySelectorAll('.category-chip');
  const statusBar = document.getElementById('events-status-bar');
  const emptyState = document.getElementById('events-empty-state');
  const resetFiltersBtn = document.getElementById('btn-reset-filters');

  const modalOverlay = document.getElementById('event-modal');
  const modalWindow = document.getElementById('modal-window');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  /**
   * Initializes page hero, URL parameters, event listeners, and initial render.
   */
  function init() {
    // 1. Render Subpage Hero
    if (window.ALODANAX_COMPONENTS && window.ALODANAX_COMPONENTS.renderSubpageHero) {
      window.ALODANAX_COMPONENTS.renderSubpageHero('events-hero', {
        breadcrumb: 'EVENTS',
        titleSolid: 'ARENAS OF',
        titleOutline: 'COMPETITION',
        subtitle: 'Explore flagship hackathons, speed coding tournaments, venture ideathons, and tactical esports arenas.'
      });
    }

    // 2. Parse URL parameters for initial category (?category=...)
    const params = new URLSearchParams(window.location.search);
    const catParam = params.get('category');
    if (catParam && ['technical', 'non-technical', 'gaming', 'all'].includes(catParam.toLowerCase())) {
      currentCategory = catParam.toLowerCase();
      updateCategoryChipsUI(currentCategory);
    }

    // 3. Render Event Grids
    renderAllCategories();

    // 4. Attach Toolbar Listeners
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        if (searchClearBtn) {
          searchClearBtn.style.display = searchQuery ? 'inline-block' : 'none';
        }
        renderAllCategories();
      });
    }

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchQuery = '';
          searchClearBtn.style.display = 'none';
          searchInput.focus();
        }
        renderAllCategories();
      });
    }

    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        currentCategory = 'all';
        searchQuery = '';
        if (searchInput) {
          searchInput.value = '';
          if (searchClearBtn) searchClearBtn.style.display = 'none';
        }
        updateCategoryChipsUI('all');
        renderAllCategories();
      });
    }

    categoryChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const selectedCat = chip.getAttribute('data-cat') || 'all';
        currentCategory = selectedCat;
        updateCategoryChipsUI(selectedCat);

        // Update URL query param without full reload
        const url = new URL(window.location);
        if (selectedCat === 'all') {
          url.searchParams.delete('category');
        } else {
          url.searchParams.set('category', selectedCat);
        }
        window.history.replaceState({}, '', url);

        renderAllCategories();
      });
    });

    // 5. Modal Close Listeners
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
      });
    }

    document.addEventListener('keydown', handleGlobalKeydown);

    // 6. Deep Link via Hash (#event=<slug>)
    checkHashDeepLink();
    window.addEventListener('hashchange', checkHashDeepLink);
  }

  /**
   * Updates category chip visual active state and ARIA attributes.
   * @param {string} activeCat
   */
  function updateCategoryChipsUI(activeCat) {
    categoryChips.forEach(c => {
      const isMatch = (c.getAttribute('data-cat') === activeCat);
      c.classList.toggle('is-active', isMatch);
      c.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
  }

  /**
   * Filters events and renders the 3 category sections.
   */
  function renderAllCategories() {
    if (!window.EVENTS_DATA) return;

    const allEvents = window.EVENTS_DATA;
    const utils = window.ALODANAX_UTILS || {};

    const categories = [
      { id: 'technical', label: 'Technical', gridId: 'grid-technical', sectionId: 'section-technical', countId: 'count-technical' },
      { id: 'non-technical', label: 'Non-Technical', gridId: 'grid-non-technical', sectionId: 'section-non-technical', countId: 'count-non-technical' },
      { id: 'gaming', label: 'Gaming', gridId: 'grid-gaming', sectionId: 'section-gaming', countId: 'count-gaming' }
    ];

    let totalVisible = 0;

    categories.forEach(cat => {
      const sectionEl = document.getElementById(cat.sectionId);
      const gridEl = document.getElementById(cat.gridId);
      const countEl = document.getElementById(cat.countId);

      if (!sectionEl || !gridEl) return;

      // Check if this category should be displayed based on chip selection
      const isCategoryActive = (currentCategory === 'all' || currentCategory === cat.id);

      if (!isCategoryActive) {
        sectionEl.style.display = 'none';
        return;
      }

      // Filter matching events in this category
      const matchingEvents = allEvents.filter(ev => {
        if (ev.category !== cat.id) return false;
        if (!searchQuery) return true;

        const nameMatch = ev.name && ev.name.toLowerCase().includes(searchQuery);
        const shortDescMatch = ev.shortDescription && ev.shortDescription.toLowerCase().includes(searchQuery);
        const fullDescMatch = ev.description && ev.description.toLowerCase().includes(searchQuery);
        const tagMatch = ev.tag && ev.tag.toLowerCase().includes(searchQuery);

        return nameMatch || shortDescMatch || fullDescMatch || tagMatch;
      });

      if (matchingEvents.length === 0) {
        sectionEl.style.display = 'none';
      } else {
        sectionEl.style.display = 'block';
        totalVisible += matchingEvents.length;

        if (countEl) {
          countEl.textContent = `${matchingEvents.length} ${matchingEvents.length === 1 ? 'ARENA' : 'ARENAS'}`;
        }

        // Render Cards
        gridEl.innerHTML = '';
        matchingEvents.forEach(ev => {
          const card = document.createElement('article');
          card.className = `event-card-item category-${ev.category}`;

          const catBadgeClass = ev.category === 'technical' ? 'cat-technical' : (ev.category === 'gaming' ? 'cat-gaming' : 'cat-non-technical');
          const dateVenue = `${ev.date || '[DATE TBA]'} · ${ev.venue || '[VENUE TBA]'}`;
          const regBtnHtml = utils.renderRegistrationButton
            ? utils.renderRegistrationButton(ev, { className: 'btn-cta' })
            : '<button type="button" class="btn-cta btn-disabled" aria-disabled="true">Registration Opening Soon</button>';

          card.innerHTML = `
            <div class="event-card-poster-wrap">
              <img
                src="${ev.image || 'assets/images/events/' + ev.slug + '.jpg'}"
                alt="${ev.name} Poster"
                class="event-card-poster"
                loading="lazy"
                decoding="async"
                onerror="window.ALODANAX_UTILS && window.ALODANAX_UTILS.handleImageError(this, 'event', '${ev.name}')"
              >
              <div class="event-card-overlay-badges">
                <span class="category-badge ${catBadgeClass}">${ev.category.toUpperCase()}</span>
                ${ev.tag ? `<span class="event-tag-badge">${ev.tag}</span>` : ''}
              </div>
            </div>
            <div class="event-card-body-content">
              <h3 class="event-card-title">${ev.name}</h3>
              <p class="event-card-short-desc">${ev.shortDescription}</p>
              <div class="event-card-meta-row">
                <span class="event-meta-icon" aria-hidden="true">✦</span>
                <span class="event-meta-text">${dateVenue}</span>
              </div>
              <div class="event-card-action-bar">
                <button type="button" class="btn-cta btn-secondary-blue btn-open-modal" data-slug="${ev.slug}" aria-label="View competition details for ${ev.name}">
                  <span>VIEW DETAILS</span>
                </button>
                ${regBtnHtml}
              </div>
            </div>
          `;

          const detailBtn = card.querySelector('.btn-open-modal');
          if (detailBtn) {
            detailBtn.addEventListener('click', () => {
              openModalBySlug(ev.slug);
            });
          }

          gridEl.appendChild(card);
        });
      }
    });

    // Update Empty State & Status Text
    if (emptyState) {
      emptyState.style.display = (totalVisible === 0) ? 'block' : 'none';
    }

    if (statusBar) {
      if (totalVisible === 0) {
        statusBar.textContent = 'No matching competitions found.';
      } else {
        const catLabel = currentCategory === 'all' ? 'all categories' : `${currentCategory} category`;
        statusBar.textContent = `Showing ${totalVisible} ${totalVisible === 1 ? 'competition' : 'competitions'} in ${catLabel}${searchQuery ? ` matching "${searchQuery}"` : ''}.`;
      }
    }
  }

  /**
   * Opens the accessible modal for a given event slug.
   * @param {string} slug
   */
  function openModalBySlug(slug) {
    if (!window.EVENTS_DATA) return;
    const event = window.EVENTS_DATA.find(e => e.slug === slug);
    if (!event) return;

    activeModalEvent = event;
    previouslyFocusedElement = document.activeElement;

    // Populate Modal Content
    populateModalData(event);

    // Open Overlay
    modalOverlay.classList.add('is-active');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Sync URL Hash
    window.location.hash = `event=${event.slug}`;

    // Focus close button inside modal
    if (modalCloseBtn) {
      modalCloseBtn.focus();
    }
  }

  /**
   * Closes the active modal and restores focus and history state.
   */
  function closeModal() {
    if (!modalOverlay.classList.contains('is-active')) return;

    modalOverlay.classList.remove('is-active');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    activeModalEvent = null;

    // Clear Hash without adding page jump
    if (window.location.hash.startsWith('#event=')) {
      history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }

    // Restore Focus
    if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
      previouslyFocusedElement.focus();
    }
  }

  /**
   * Populates all modal data fields according to schema.
   * @param {object} ev
   */
  function populateModalData(ev) {
    const utils = window.ALODANAX_UTILS || {};

    const titleEl = document.getElementById('modal-event-title');
    const badgeEl = document.getElementById('modal-category-badge');
    const posterImg = document.getElementById('modal-poster-img');
    const datetimeEl = document.getElementById('modal-datetime');
    const venueEl = document.getElementById('modal-venue');
    const teamsizeEl = document.getElementById('modal-teamsize');
    const introEl = document.getElementById('modal-intro');
    const descEl = document.getElementById('modal-description');
    const formatEl = document.getElementById('modal-format');
    const formatBlock = document.getElementById('modal-format-block');
    const rulesList = document.getElementById('modal-rules-list');
    const rulesBlock = document.getElementById('modal-rules-block');
    const reqList = document.getElementById('modal-requirements-list');
    const reqBlock = document.getElementById('modal-requirements-block');
    const instList = document.getElementById('modal-instructions-list');
    const instBlock = document.getElementById('modal-instructions-block');
    const coordList = document.getElementById('modal-coordinators-list');
    const coordBlock = document.getElementById('modal-coordinators-block');
    const extraLinkWrap = document.getElementById('modal-extra-link-wrap');
    const registerWrap = document.getElementById('modal-register-wrap');

    if (titleEl) titleEl.textContent = ev.name;

    if (badgeEl) {
      badgeEl.textContent = ev.category.toUpperCase();
      badgeEl.className = `category-badge ${ev.category === 'technical' ? 'cat-technical' : (ev.category === 'gaming' ? 'cat-gaming' : 'cat-non-technical')}`;
    }

    if (posterImg) {
      posterImg.src = ev.image || `assets/images/events/${ev.slug}.jpg`;
      posterImg.alt = `${ev.name} Poster`;
      posterImg.onerror = function () {
        if (utils.handleImageError) utils.handleImageError(this, 'event', ev.name);
      };
    }

    if (datetimeEl) datetimeEl.textContent = ev.date || '[DATE TBA]';
    if (venueEl) venueEl.textContent = ev.venue || '[VENUE TBA]';
    if (teamsizeEl) teamsizeEl.textContent = ev.teamSize || '[TEAM TBA]';

    if (introEl) introEl.textContent = ev.intro || ev.shortDescription || '';
    if (descEl) descEl.textContent = ev.description || '';

    // Event Format
    if (formatBlock && formatEl) {
      if (ev.format && !utils.isPlaceholder(ev.format)) {
        formatBlock.style.display = 'block';
        formatEl.textContent = ev.format;
      } else {
        formatBlock.style.display = 'none';
      }
    }

    // Rules List
    if (rulesBlock && rulesList) {
      if (Array.isArray(ev.rules) && ev.rules.length > 0) {
        rulesBlock.style.display = 'block';
        rulesList.innerHTML = ev.rules.map(r => `<li>${r}</li>`).join('');
      } else {
        rulesBlock.style.display = 'none';
      }
    }

    // Requirements List
    if (reqBlock && reqList) {
      if (Array.isArray(ev.requirements) && ev.requirements.length > 0) {
        reqBlock.style.display = 'block';
        reqList.innerHTML = ev.requirements.map(rq => `<li>${rq}</li>`).join('');
      } else {
        reqBlock.style.display = 'none';
      }
    }

    // Important Instructions List
    if (instBlock && instList) {
      if (Array.isArray(ev.instructions) && ev.instructions.length > 0) {
        instBlock.style.display = 'block';
        instList.innerHTML = ev.instructions.map(ins => `<li>${ins}</li>`).join('');
      } else {
        instBlock.style.display = 'none';
      }
    }

    // Coordinators
    if (coordBlock && coordList) {
      if (Array.isArray(ev.coordinators) && ev.coordinators.length > 0) {
        coordBlock.style.display = 'block';
        coordList.innerHTML = ev.coordinators.map(c => {
          const phoneSafe = utils.formatSafeLink ? utils.formatSafeLink('tel', c.phone) : null;
          const emailSafe = utils.formatSafeLink ? utils.formatSafeLink('mailto', c.email) : null;

          const phoneText = phoneSafe ? `<a href="${phoneSafe}" class="coord-link">${c.phone}</a>` : `<span class="badge-tba">TBA</span>`;
          const emailText = emailSafe ? `<a href="${emailSafe}" class="coord-link">${c.email}</a>` : `<span class="badge-tba">TBA</span>`;

          return `
            <div class="modal-coord-card">
              <span class="coord-role">${c.role || 'COORDINATOR'}</span>
              <h4 class="coord-name">${c.name || '[NAME TBA]'}</h4>
              <div class="coord-contacts">
                <div><span>TEL:</span> ${phoneText}</div>
                <div><span>EMAIL:</span> ${emailText}</div>
              </div>
            </div>
          `;
        }).join('');
      } else {
        coordBlock.style.display = 'none';
      }
    }

    // Extra link (e.g. Hackathon "Problem Statements & Rules" linking to hackathon.html)
    if (extraLinkWrap) {
      if (ev.slug === 'hackathon' || ev.extraLink) {
        const linkObj = ev.extraLink || { label: 'Problem Statements & Rules', url: 'hackathon.html' };
        extraLinkWrap.innerHTML = `
          <a href="${linkObj.url}" class="btn-cta btn-secondary-blue">
            <span>${linkObj.label.toUpperCase()}</span>
            <span aria-hidden="true">→</span>
          </a>
        `;
      } else {
        extraLinkWrap.innerHTML = '';
      }
    }

    // Registration Button
    if (registerWrap) {
      registerWrap.innerHTML = utils.renderRegistrationButton
        ? utils.renderRegistrationButton(ev, { className: 'btn-cta btn-primary-neon', text: 'REGISTER ON GOOGLE FORMS' })
        : '<button type="button" class="btn-cta btn-disabled" aria-disabled="true">Registration Opening Soon</button>';
    }
  }

  /**
   * Accessible focus trap and ESC dismiss handler.
   * @param {KeyboardEvent} e
   */
  function handleGlobalKeydown(e) {
    if (!modalOverlay.classList.contains('is-active')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }

    if (e.key === 'Tab') {
      const focusable = modalWindow.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  /**
   * Checks hash deep linking on load and hash change.
   */
  function checkHashDeepLink() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#event=')) {
      const slug = hash.replace('#event=', '').trim();
      if (slug) {
        openModalBySlug(slug);
      }
    } else if (activeModalEvent) {
      closeModal();
    }
  }

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);

