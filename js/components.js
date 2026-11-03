/**
 * ALODANAX TechFest - Shared Components Layer
 * Injects shared navigation, mobile drawer with focus trap, shared footer,
 * and standard subpage heroes across all pages.
 */

(function (window) {
  'use strict';

  // Navigation Links Definition
  const NAV_LINKS = [
    { label: "Home", href: "index.html", pageId: "index" },
    { label: "About", href: "index.html#about", pageId: "about" },
    { label: "Events", href: "events.html", pageId: "events" },
    { label: "Organizing Committee", href: "committee.html", pageId: "committee" },
    { label: "Faculty", href: "faculty.html", pageId: "faculty" },
    { label: "Our Team", href: "team.html", pageId: "team" },
    { label: "Contact", href: "contact.html", pageId: "contact" }
  ];

  /**
   * Determine the current page identifier from window.location.pathname.
   * @returns {string}
   */
  function getCurrentPageId() {
    const path = window.location.pathname.toLowerCase();
    const filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

    if (filename.startsWith('index') || filename === '') return 'index';
    if (filename.startsWith('event')) return 'events';
    if (filename.startsWith('committee')) return 'committee';
    if (filename.startsWith('faculty')) return 'faculty';
    if (filename.startsWith('hackathon')) return 'hackathon';
    if (filename.startsWith('team')) return 'team';
    if (filename.startsWith('contact')) return 'contact';
    return '';
  }

  /**
   * Injects the shared navigation bar into #site-nav.
   * Preserves hero scroll choreography on index.html, immediately visible on subpages.
   */
  function renderNavigation() {
    const container = document.getElementById('site-nav');
    if (!container) return;

    const brandName = (window.SITE_DATA && window.SITE_DATA.brand && window.SITE_DATA.brand.name) || 'ALODANAX';
    const isHomePage = (getCurrentPageId() === 'index');
    const currentPage = getCurrentPageId();

    let navListHtml = '';
    let drawerListHtml = '';

    NAV_LINKS.forEach(link => {
      const isActive = (currentPage === link.pageId);
      const activeAttr = isActive ? ' aria-current="page" class="nav-link is-active"' : ' class="nav-link"';
      const drawerActiveAttr = isActive ? ' aria-current="page" class="drawer-link is-active"' : ' class="drawer-link"';

      navListHtml += `<li><a href="${link.href}"${activeAttr}>${link.label.toUpperCase()}</a></li>`;
      drawerListHtml += `<li><a href="${link.href}"${drawerActiveAttr}>${link.label.toUpperCase()}</a></li>`;
    });

    // Subpages start with is-visible; home page waits for hero scrub trigger
    const initialHeaderClass = isHomePage ? 'site-header site-header-hero' : 'site-header is-visible is-subpage-nav';

    container.innerHTML = `
      <header id="site-header" class="${initialHeaderClass}" role="banner">
        <div class="nav-inner-container">
          <a href="index.html" class="nav-brand" aria-label="${brandName} Home">
            <span class="brand-text">${brandName}</span>
          </a>

          <!-- Desktop Navigation Menu -->
          <nav class="nav-menu-wrapper" aria-label="Primary Navigation">
            <ul class="nav-menu">
              ${navListHtml}
            </ul>
          </nav>

          <!-- Mobile Hamburger Toggle -->
          <button
            type="button"
            class="nav-hamburger"
            id="nav-hamburger-btn"
            aria-label="Open mobile navigation menu"
            aria-expanded="false"
            aria-controls="mobile-nav-drawer"
          >
            <span class="hamburger-line line-1" aria-hidden="true"></span>
            <span class="hamburger-line line-2" aria-hidden="true"></span>
            <span class="hamburger-line line-3" aria-hidden="true"></span>
          </button>
        </div>

        <!-- Accessible Mobile Navigation Drawer -->
        <div
          id="mobile-nav-drawer"
          class="mobile-drawer"
          aria-hidden="true"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
        >
          <div class="drawer-backdrop" id="drawer-backdrop" aria-hidden="true"></div>
          <div class="drawer-panel" id="drawer-panel">
            <div class="drawer-top-bar">
              <span class="drawer-brand">${brandName}</span>
              <button type="button" class="drawer-close-btn" id="drawer-close-btn" aria-label="Close navigation menu">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <nav class="drawer-nav" aria-label="Mobile Navigation Links">
              <ul class="drawer-links-list">
                ${drawerListHtml}
              </ul>
            </nav>
            <div class="drawer-footer-meta">
              <span class="drawer-meta-sub">${(window.SITE_DATA && window.SITE_DATA.brand && window.SITE_DATA.brand.subtagline) || ''}</span>
            </div>
          </div>
        </div>
      </header>
    `;

    initNavigationInteractions();
  }

  /**
   * Initializes mobile drawer focus trap, ESC key dismiss, and scroll styling.
   */
  function initNavigationInteractions() {
    const header = document.getElementById('site-header');
    const hamburgerBtn = document.getElementById('nav-hamburger-btn');
    const drawer = document.getElementById('mobile-nav-drawer');
    const closeBtn = document.getElementById('drawer-close-btn');
    const backdrop = document.getElementById('drawer-backdrop');
    const panel = document.getElementById('drawer-panel');

    if (!header || !hamburgerBtn || !drawer) return;

    // Sticky transparent-to-solid on scroll
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }, { passive: true });

    let previouslyFocusedElement = null;

    function openDrawer() {
      previouslyFocusedElement = document.activeElement;
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      hamburgerBtn.setAttribute('aria-label', 'Close mobile navigation menu');
      document.body.style.overflow = 'hidden';

      // Set focus inside drawer
      if (closeBtn) closeBtn.focus();
      document.addEventListener('keydown', handleDrawerKeydown);
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      hamburgerBtn.setAttribute('aria-label', 'Open mobile navigation menu');
      document.body.style.overflow = '';

      document.removeEventListener('keydown', handleDrawerKeydown);
      if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
        previouslyFocusedElement.focus();
      }
    }

    // Accessible Focus Trap inside Drawer
    function handleDrawerKeydown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDrawer();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
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

    hamburgerBtn.addEventListener('click', () => {
      const isOpen = drawer.classList.contains('is-open');
      if (isOpen) closeDrawer();
      else openDrawer();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    // Close on any link click
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', closeDrawer);
    });
  }

  /**
   * Injects the shared footer into #site-footer.
   */
  function renderFooter() {
    const container = document.getElementById('site-footer');
    if (!container) return;

    const site = window.SITE_DATA || {};
    const brand = site.brand || { name: 'ALODANAX', edition: '2026', tagline: '[TAGLINE]' };
    const college = site.college || {};
    const contacts = site.contacts || {};
    const socials = site.socials || {};
    const utils = window.ALODANAX_UTILS || {};

    // Nav links in footer
    let quickLinksHtml = '';
    NAV_LINKS.forEach(l => {
      quickLinksHtml += `<li><a href="${l.href}">${l.label.toUpperCase()}</a></li>`;
    });

    // Social pills (rendered only if valid / not placeholder)
    let socialsHtml = '';
    const socialKeys = ['instagram', 'linkedin', 'github', 'youtube', 'x'];
    socialKeys.forEach(k => {
      const sVal = socials[k];
      if (sVal && !utils.isPlaceholder(sVal)) {
        socialsHtml += `<a href="${sVal}" target="_blank" rel="noopener noreferrer" class="social-pill" aria-label="${k.toUpperCase()}">${k.toUpperCase()}</a>`;
      }
    });

    // Safe contacts
    const phoneLink = utils.formatSafeLink ? utils.formatSafeLink('tel', contacts.phone) : null;
    const emailLink = utils.formatSafeLink ? utils.formatSafeLink('mailto', contacts.email) : null;

    const phoneDisplay = phoneLink
      ? `<a href="${phoneLink}" class="footer-link-active">${contacts.phone}</a>`
      : `<span class="footer-val-tba">${contacts.phone || '[PHONE TBA]'}</span>`;

    const emailDisplay = emailLink
      ? `<a href="${emailLink}" class="footer-link-active">${contacts.email}</a>`
      : `<span class="footer-val-tba">${contacts.email || '[EMAIL TBA]'}</span>`;

    container.innerHTML = `
      <div class="site-footer-inner">
        <div class="section-container">
          <div class="footer-grid">
            <!-- Brand & College Column -->
            <div class="footer-brand-column">
              <a href="index.html" class="footer-brand" aria-label="${brand.name} Home">${brand.name}</a>
              <p class="footer-department">${college.department || '[DEPARTMENT OF IT/CS]'}</p>
              <p class="footer-college-name">${college.name || '[COLLEGE NAME]'}</p>
              <p class="footer-tagline">${brand.tagline || ''}</p>
            </div>

            <!-- Quick Links -->
            <div class="footer-links-column">
              <h4 class="footer-col-title">NAVIGATION</h4>
              <ul class="footer-nav-list">
                ${quickLinksHtml}
              </ul>
            </div>

            <!-- Contacts & Venue -->
            <div class="footer-contact-column">
              <h4 class="footer-col-title">COORDINATION DESK</h4>
              <p class="footer-contact-line"><strong>EMAIL:</strong> ${emailDisplay}</p>
              <p class="footer-contact-line"><strong>PHONE:</strong> ${phoneDisplay}</p>
              <p class="footer-contact-line"><strong>VENUE:</strong> <span>${college.venue || '[VENUE TBA]'}</span></p>
              ${socialsHtml ? `<div class="footer-social-row">${socialsHtml}</div>` : ''}
            </div>
          </div>

          <!-- Bottom Bar -->
          <div class="footer-bottom-bar">
            <p class="footer-copyright">
              © ${brand.edition || '2026'} ${brand.name}. ${college.fullTitle || '[DEPARTMENT, COLLEGE]'}. ALL RIGHTS RESERVED.
            </p>
            <a href="#site-header" class="back-to-top" id="btn-back-to-top" aria-label="Back to top of page">
              <span>TOP</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </a>
          </div>
        </div>
      </div>
    `;

    const backToTop = document.getElementById('btn-back-to-top');
    if (backToTop) {
      backToTop.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /**
   * Helper to render common Subpage Hero (~45vh).
   * Black background, huge display type (solid + outline), breadcrumb, animated red-to-blue hairline sweep.
   * Respects prefers-reduced-motion.
   *
   * @param {string} containerId - Element ID to inject into
   * @param {object} options - { breadcrumb, titleSolid, titleOutline, subtitle }
   */
  function renderSubpageHero(containerId, options = {}) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const breadcrumb = options.breadcrumb || 'HOME';
    const titleSolid = options.titleSolid || '';
    const titleOutline = options.titleOutline || '';
    const subtitle = options.subtitle || '';

    el.className = 'subpage-hero-section';
    el.innerHTML = `
      <div class="subpage-hero-vignette" aria-hidden="true"></div>
      <div class="section-container subpage-hero-container">
        <nav class="subpage-breadcrumb" aria-label="Breadcrumb">
          <a href="index.html" class="breadcrumb-item">HOME</a>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-current" aria-current="page">${breadcrumb.toUpperCase()}</span>
        </nav>

        <h1 class="subpage-hero-title display-title">
          <span class="title-solid">${titleSolid}</span>
          <span class="title-outline">${titleOutline}</span>
        </h1>

        ${subtitle ? `<p class="subpage-hero-subtitle">${subtitle}</p>` : ''}
      </div>

      <!-- Animated Red-to-Blue Hairline Sweep (CSS only) -->
      <div class="hero-hairline-sweep-track" aria-hidden="true">
        <div class="hero-hairline-sweep-beam"></div>
      </div>
    `;
  }

  // Export to window.ALODANAX_COMPONENTS
  window.ALODANAX_COMPONENTS = {
    renderNavigation,
    renderFooter,
    renderSubpageHero
  };

  // Auto-render shared components on DOM ready
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('DOMContentLoaded', () => {
      renderNavigation();
      renderFooter();
    });
  }

})(window);
