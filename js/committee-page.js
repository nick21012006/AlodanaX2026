/**
 * ALODANAX TechFest - Organizing Committee Page Controller
 * Renders HOD large featured profile first, then tiered council groups.
 * Automatically omits any tier without members.
 */

(function (window) {
  'use strict';

  function init() {
    // 1. Render Subpage Hero
    if (window.ALODANAX_COMPONENTS && window.ALODANAX_COMPONENTS.renderSubpageHero) {
      window.ALODANAX_COMPONENTS.renderSubpageHero('committee-hero', {
        breadcrumb: 'ORGANIZING COMMITTEE',
        titleSolid: 'GOVERNANCE &',
        titleOutline: 'LEADERSHIP',
        subtitle: 'Academic patrons, departmental directors, and student executive board driving ALODANAX 2026.'
      });
    }

    if (!window.COMMITTEE_DATA) return;
    const data = window.COMMITTEE_DATA;
    const utils = window.ALODANAX_UTILS || {};

    // 2. Render HOD Full-Width Featured Card
    renderHodCard(data.hod);

    // 3. Render Remaining Tiers
    renderTiers(data.tiers);
  }

  /**
   * Renders the single full-width HOD card.
   * @param {object} hod
   */
  function renderHodCard(hod) {
    const container = document.getElementById('hod-featured-container');
    if (!container || !hod) return;

    container.innerHTML = `
      <article class="hod-card-full">
        <div class="hod-photo-column">
          <div class="hod-photo-frame">
            <img
              src="${hod.photo || 'assets/images/committee/hod.jpg'}"
              alt="${hod.name}"
              class="hod-photo-img"
              loading="lazy"
              decoding="async"
              onerror="window.ALODANAX_UTILS && window.ALODANAX_UTILS.handleImageError(this, 'profile', '${hod.name}')"
            >
            <div class="hod-frame-accent" aria-hidden="true"></div>
          </div>
        </div>
        <div class="hod-info-column">
          <div class="hod-badge-bar">
            <span class="category-badge cat-technical">HEAD OF DEPARTMENT</span>
          </div>
          <h3 class="hod-name">${hod.name}</h3>
          <p class="hod-designation">${hod.designation}</p>
          <p class="hod-department">${hod.department}</p>
          <div class="hod-message-box">
            <span class="quote-accent-bar" aria-hidden="true"></span>
            <p class="hod-intro-text">${hod.intro || hod.message || ''}</p>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Renders tiered committee members (omits any tier with 0 members).
   * @param {Array} tiers
   */
  function renderTiers(tiers) {
    const container = document.getElementById('committee-tiers-container');
    if (!container || !Array.isArray(tiers)) return;

    container.innerHTML = '';

    tiers.forEach(tier => {
      // Omit empty tiers automatically
      if (!Array.isArray(tier.members) || tier.members.length === 0) return;

      const tierSection = document.createElement('section');
      tierSection.className = `committee-tier-section tier-${tier.tierId || 'general'}`;
      tierSection.setAttribute('aria-labelledby', `heading-${tier.tierId}`);

      const layoutClass = tier.layout === 'featured-tier'
        ? 'tier-grid-featured'
        : (tier.layout === 'compact-grid' ? 'tier-grid-compact' : 'tier-grid-standard');

      let membersHtml = '';
      tier.members.forEach(member => {
        membersHtml += `
          <article class="committee-profile-card ${tier.layout === 'featured-tier' ? 'card-featured' : ''}">
            <div class="profile-photo-wrapper">
              <img
                src="${member.photo || 'assets/images/committee/member.jpg'}"
                alt="${member.name}"
                class="profile-photo-img"
                loading="lazy"
                decoding="async"
                onerror="window.ALODANAX_UTILS && window.ALODANAX_UTILS.handleImageError(this, 'profile', '${member.name}')"
              >
            </div>
            <div class="profile-meta-content">
              <span class="profile-role-tag">${member.role || tier.title}</span>
              <h3 class="profile-name">${member.name}</h3>
              <p class="profile-designation">${member.designation}</p>
              <p class="profile-department">${member.department}</p>
              ${member.intro ? `<p class="profile-short-intro">${member.intro}</p>` : ''}
            </div>
          </article>
        `;
      });

      tierSection.innerHTML = `
        <div class="tier-header-bar">
          <span class="tier-tag">ORGANIZING COMMITTEE</span>
          <h2 id="heading-${tier.tierId}" class="tier-title">${tier.title.toUpperCase()}</h2>
        </div>
        <div class="hairline-divider-cat divider-tech" aria-hidden="true"></div>
        <div class="${layoutClass}">
          ${membersHtml}
        </div>
      `;

      container.appendChild(tierSection);
    });
  }

  // Initialize on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
