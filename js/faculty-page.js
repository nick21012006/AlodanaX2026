/**
 * ALODANAX TechFest - Faculty Directory Page Controller
 * Handles live client-side name and expertise filtering,
 * reuses committee profile layout, and handles fallbacks.
 */

(function (window) {
  'use strict';

  let searchQuery = '';

  const searchInput = document.getElementById('faculty-search-input');
  const searchClearBtn = document.getElementById('faculty-search-clear');
  const countBadge = document.getElementById('faculty-count-badge');
  const gridContainer = document.getElementById('faculty-grid-container');
  const emptyState = document.getElementById('faculty-empty-state');
  const resetBtn = document.getElementById('btn-reset-faculty-search');

  function init() {
    // 1. Render Subpage Hero
    if (window.ALODANAX_COMPONENTS && window.ALODANAX_COMPONENTS.renderSubpageHero) {
      window.ALODANAX_COMPONENTS.renderSubpageHero('faculty-hero', {
        breadcrumb: 'FACULTY',
        titleSolid: 'ACADEMIC',
        titleOutline: 'MENTORS',
        subtitle: 'Distinguished faculty convenors, competition track directors, and technical jury evaluators.'
      });
    }

    renderFaculty();

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        if (searchClearBtn) {
          searchClearBtn.style.display = searchQuery ? 'inline-block' : 'none';
        }
        renderFaculty();
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
        renderFaculty();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        searchQuery = '';
        if (searchInput) {
          searchInput.value = '';
          if (searchClearBtn) searchClearBtn.style.display = 'none';
        }
        renderFaculty();
      });
    }
  }

  function renderFaculty() {
    if (!gridContainer || !window.FACULTY_DATA) return;
    const allFaculty = window.FACULTY_DATA;

    const filtered = allFaculty.filter(f => {
      if (!searchQuery) return true;
      const nameMatch = f.name && f.name.toLowerCase().includes(searchQuery);
      const roleMatch = f.role && f.role.toLowerCase().includes(searchQuery);
      const deptMatch = f.department && f.department.toLowerCase().includes(searchQuery);
      const expMatch = f.expertise && f.expertise.toLowerCase().includes(searchQuery);
      const introMatch = f.intro && f.intro.toLowerCase().includes(searchQuery);
      return nameMatch || roleMatch || deptMatch || expMatch || introMatch;
    });

    gridContainer.innerHTML = '';

    if (filtered.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (countBadge) countBadge.textContent = '0 faculty mentors found';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (countBadge) {
      countBadge.textContent = `Showing ${filtered.length} faculty ${filtered.length === 1 ? 'mentor' : 'mentors'}`;
    }

    filtered.forEach(faculty => {
      const card = document.createElement('article');
      card.className = 'committee-profile-card faculty-profile-card';

      card.innerHTML = `
        <div class="profile-photo-wrapper">
          <img
            src="${faculty.photo || 'assets/images/faculty/faculty.jpg'}"
            alt="${faculty.name}"
            class="profile-photo-img"
            loading="lazy"
            decoding="async"
            onerror="window.ALODANAX_UTILS && window.ALODANAX_UTILS.handleImageError(this, 'profile', '${faculty.name}')"
          >
        </div>
        <div class="profile-meta-content">
          <span class="profile-role-tag">${faculty.role || 'FACULTY MENTOR'}</span>
          <h3 class="profile-name">${faculty.name}</h3>
          <p class="profile-designation">${faculty.designation}</p>
          <p class="profile-department">${faculty.department}</p>
          ${faculty.expertise ? `<div class="faculty-expertise-badge"><span>FOCUS:</span> ${faculty.expertise}</div>` : ''}
          ${faculty.intro ? `<p class="profile-short-intro">${faculty.intro}</p>` : ''}
        </div>
      `;

      gridContainer.appendChild(card);
    });
  }

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
