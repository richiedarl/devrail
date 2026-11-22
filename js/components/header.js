/**
 * DevTrail Shared Header & Navigation Component
 * Provides responsive navigation, active page highlighting, and mobile drawer functionality.
 */

import { createElement, createSvgFromString } from '../utils/dom.js';

const NAV_ITEMS = [
  { label: 'Dashboard', href: 'index.html', key: 'dashboard' },
  { label: 'Explore Repositories', href: 'repositories.html', key: 'repositories' },
  { label: 'Programming Questions', href: 'questions.html', key: 'questions' },
  { label: 'Saved Resources', href: 'saved.html', key: 'saved' }
];

/**
 * Initializes and mounts the shared navigation header.
 * 
 * @param {HTMLElement} [container] - The header element to mount into. Defaults to #site-header.
 */
export function initHeader(container = document.getElementById('site-header')) {
  if (!container) return;

  const currentPath = window.location.pathname.toLowerCase();

  // Helper to test if a nav link matches current URL
  const isPageActive = (item) => {
    if (item.href === 'index.html') {
      return currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '';
    }
    return currentPath.includes(item.href.replace('.html', ''));
  };

  // Skip Link for Accessibility
  const skipLink = createElement('a', {
    className: 'skip-link',
    attrs: { href: '#main-content' },
    text: 'Skip to main content'
  });

  // Header Inner Container
  const inner = createElement('div', { className: ['app-container', 'header-inner'] });

  // Brand Link
  const brandImg = createElement('img', {
    className: 'brand-logo-img',
    attrs: {
      src: 'assets/icons/logo.svg',
      alt: 'DevTrail Logo',
      width: '36',
      height: '36'
    }
  });

  const brandTitle = createElement('span', { className: 'brand-title' });
  const titleDev = document.createTextNode('Dev');
  const titleTrail = createElement('span', { className: 'accent', text: 'Trail' });
  brandTitle.appendChild(titleDev);
  brandTitle.appendChild(titleTrail);

  const brandBadge = createElement('span', {
    className: 'brand-badge',
    text: 'Resource Discovery'
  });

  const brandTextWrap = createElement('div', {
    className: 'brand-text-wrap',
    children: [brandTitle, brandBadge]
  });

  const brandLink = createElement('a', {
    className: 'brand-link',
    attrs: {
      href: 'index.html',
      'aria-label': 'DevTrail Home'
    },
    children: [brandImg, brandTextWrap]
  });

  // Desktop Navigation
  const navList = createElement('ul', { className: 'nav-list' });

  NAV_ITEMS.forEach(item => {
    const active = isPageActive(item);
    const link = createElement('a', {
      className: ['nav-link', active ? 'active' : ''],
      attrs: {
        href: item.href,
        'aria-current': active ? 'page' : undefined
      },
      text: item.label
    });

    const li = createElement('li', { children: [link] });
    navList.appendChild(li);
  });

  const desktopNav = createElement('nav', {
    className: 'main-nav',
    attrs: { 'aria-label': 'Main Navigation' },
    children: [navList]
  });

  // Mobile Menu Toggle Button
  const menuIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>`;
  
  const closeIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>`;

  const mobileToggle = createElement('button', {
    className: 'mobile-toggle',
    attrs: {
      type: 'button',
      'aria-label': 'Toggle navigation menu',
      'aria-expanded': 'false',
      'aria-controls': 'mobile-nav-drawer'
    },
    children: [createSvgFromString(menuIconSvg)]
  });

  // Mobile Drawer
  const mobileNavList = createElement('ul', { className: 'mobile-nav-list' });

  NAV_ITEMS.forEach(item => {
    const active = isPageActive(item);
    const link = createElement('a', {
      className: ['nav-link', active ? 'active' : ''],
      attrs: {
        href: item.href,
        'aria-current': active ? 'page' : undefined
      },
      text: item.label
    });

    const li = createElement('li', { children: [link] });
    mobileNavList.appendChild(li);
  });

  const mobileDrawer = createElement('div', {
    className: 'mobile-menu-drawer',
    attrs: {
      id: 'mobile-nav-drawer',
      'aria-label': 'Mobile Navigation'
    },
    children: [mobileNavList]
  });

  // Toggle Functionality
  let isMenuOpen = false;
  const toggleMobileMenu = () => {
    isMenuOpen = !isMenuOpen;
    mobileDrawer.classList.toggle('open', isMenuOpen);
    mobileToggle.setAttribute('aria-expanded', String(isMenuOpen));

    // Swap icon
    mobileToggle.innerHTML = '';
    mobileToggle.appendChild(createSvgFromString(isMenuOpen ? closeIconSvg : menuIconSvg));
  };

  mobileToggle.addEventListener('click', toggleMobileMenu);

  // Close on outside click
  document.addEventListener('click', (event) => {
    if (isMenuOpen && !container.contains(event.target)) {
      toggleMobileMenu();
    }
  });

  // Close on escape key
  document.addEventListener('keydown', (event) => {
    if (isMenuOpen && event.key === 'Escape') {
      toggleMobileMenu();
      mobileToggle.focus();
    }
  });

  // Assemble Header
  inner.appendChild(brandLink);
  inner.appendChild(desktopNav);
  inner.appendChild(mobileToggle);

  container.innerHTML = '';
  container.appendChild(skipLink);
  container.appendChild(inner);
  container.appendChild(mobileDrawer);
}
