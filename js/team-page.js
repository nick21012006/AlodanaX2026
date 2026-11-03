/**
 * ALODANAX TechFest - Student Team Page Controller
 * Handles 40 profile cards, dynamic department filter chips,
 * instant live search (name + role), safe social icon rendering, and image fallbacks.
 */

(function (window) {
  'use strict';

  let currentDept = 'all';
  let searchQuery = '';

  const searchInput = document.getElementById('team-search-input');
  const searchClearBtn = document.getElementById('team-search-clear');
  const chipsContainer = document.getElementById('team-department-chips');
  const statusBar = document.getElementById('team-status-bar');
  const cardsGrid = document.getElementById('team-cards-grid');
  const emptyState = document.getElementById('team-empty-state');
  const resetBtn = document.getElementById('btn-reset-team-filters');

  function init() {
    // 1. Render Subpage Hero
    if (window.ALODANAX_COMPONENTS && window.ALODANAX_COMPONENTS.renderSubpageHero) {
      window.ALODANAX_COMPONENTS.renderSubpageHero('team-hero', {
        breadcrumb: 'OUR TEAM',
        titleSolid: 'THE STUDENT',
        titleOutline: 'ENGINEERING CREW',
        subtitle: '40 dedicated student developers, infrastructure engineers, creative designers, and arena managers.'
      });
    }

    if (!window.TEAM_DATA) return;
    const allMembers = window.TEAM_DATA;
    const utils = window.ALODANAX_UTILS || {};

    // 2. Build Dynamic Department Filter Chips
    buildDynamicDepartmentChips(allMembers, utils);

    // 3. Render Cards
    renderTeamCards();

    // 4. Attach Listeners
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        if (searchClearBtn) {
          searchClearBtn.style.display = searchQuery ? 'inline-block' : 'none';
        }
        renderTeamCards();
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
        renderTeamCards();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentDept = 'all';
        searchQuery = '';
        if (searchInput) {
          searchInput.value = '';
          if (searchClearBtn) searchClearBtn.style.display = 'none';
        }
        updateChipsUI('all');
        renderTeamCards();
      });
    }
  }

  /**
   * Dynamically extracts unique non-placeholder departments to render filter chips.
   * If none are available, shows 'All' only.
   * @param {Array} members
   * @param {object} utils
   */
  function buildDynamicDepartmentChips(members, utils) {
    if (!chipsContainer) return;

    // Extract unique non-placeholder departments
    const rawDepts = members
      .map(m => m.department)
      .filter(d => d && typeof d === 'string' && !utils.isPlaceholder(d));

    const uniqueDepts = Array.from(new Set(rawDepts));

    let chipsHtml = `
      <button type="button" class="category-chip is-active" role="tab" aria-selected="true" data-dept="all">
        <span>ALL CREW (40)</span>
      </button>
    `;

    if (uniqueDepts.length > 0) {
      uniqueDepts.forEach(dept => {
        const count = members.filter(m => m.department === dept).length;
        chipsHtml += `
          <button type="button" class="category-chip" role="tab" aria-selected="false" data-dept="${dept}">
            <span>${dept.toUpperCase()} (${count})</span>
          </button>
        `;
      });
    }

    chipsContainer.innerHTML = chipsHtml;

    chipsContainer.querySelectorAll('.category-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const dept = btn.getAttribute('data-dept') || 'all';
        currentDept = dept;
        updateChipsUI(dept);
        renderTeamCards();
      });
    });
  }

  function updateChipsUI(selectedDept) {
    if (!chipsContainer) return;
    chipsContainer.querySelectorAll('.category-chip').forEach(btn => {
      const match = (btn.getAttribute('data-dept') === selectedDept);
      btn.classList.toggle('is-active', match);
      btn.setAttribute('aria-selected', match ? 'true' : 'false');
    });
  }

  /**
   * Filters and renders the 40 team cards.
   */
  function renderTeamCards() {
    if (!cardsGrid || !window.TEAM_DATA) return;
    const members = window.TEAM_DATA;
    const utils = window.ALODANAX_UTILS || {};

    const filtered = members.filter(m => {
      // Department match
      if (currentDept !== 'all' && m.department !== currentDept) {
        return false;
      }

      // Search match (name or role)
      if (!searchQuery) return true;
      const nameMatch = m.name && m.name.toLowerCase().includes(searchQuery);
      const roleMatch = m.role && m.role.toLowerCase().includes(searchQuery);
      const deptMatch = m.department && m.department.toLowerCase().includes(searchQuery);

      return nameMatch || roleMatch || deptMatch;
    });

    cardsGrid.innerHTML = '';

    if (filtered.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (statusBar) statusBar.textContent = '0 crew members match the search query.';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (statusBar) {
      const deptLabel = currentDept === 'all' ? 'all departments' : `${currentDept} department`;
      statusBar.textContent = `Showing ${filtered.length} of ${members.length} student crew members in ${deptLabel}${searchQuery ? ` matching "${searchQuery}"` : ''}.`;
    }

    filtered.forEach(m => {
      const card = document.createElement('article');
      card.className = 'team-profile-card';

      // Social Links (rendered ONLY if link exists and is not placeholder)
      let socialsHtml = '';
      if (m.social) {
        if (m.social.linkedin && !utils.isPlaceholder(m.social.linkedin)) {
          socialsHtml += `
            <a href="${m.social.linkedin}" target="_blank" rel="noopener noreferrer" class="team-social-icon" aria-label="LinkedIn Profile">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
          `;
        }
        if (m.social.github && !utils.isPlaceholder(m.social.github)) {
          socialsHtml += `
            <a href="${m.social.github}" target="_blank" rel="noopener noreferrer" class="team-social-icon" aria-label="GitHub Profile">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            </a>
          `;
        }
        if (m.social.instagram && !utils.isPlaceholder(m.social.instagram)) {
          socialsHtml += `
            <a href="${m.social.instagram}" target="_blank" rel="noopener noreferrer" class="team-social-icon" aria-label="Instagram Profile">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
          `;
        }
      }

      card.innerHTML = `
        <div class="team-photo-wrap">
          <img
            src="${m.photo || 'assets/images/team/member.jpg'}"
            alt="${m.name}"
            class="team-photo-img"
            loading="lazy"
            decoding="async"
            onerror="window.ALODANAX_UTILS && window.ALODANAX_UTILS.handleImageError(this, 'team', '${m.name}')"
          >
          <span class="team-dept-badge">${m.department || 'CREW'}</span>
        </div>
        <div class="team-card-content">
          <span class="team-role-title">${m.role}</span>
          <h4 class="team-member-name">${m.name}</h4>
          ${socialsHtml ? `<div class="team-socials-row">${socialsHtml}</div>` : ''}
        </div>
      `;

      cardsGrid.appendChild(card);
    });
  }

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);

