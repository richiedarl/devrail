/**
 * DevTrail Shared Footer Component
 * Provides consistent footer attribution, site navigation links, and API references.
 */

import { createElement } from '../utils/dom.js';

/**
 * Initializes and mounts the shared site footer.
 * 
 * @param {HTMLElement} [container] - Target footer element. Defaults to #site-footer.
 */
export function initFooter(container = document.getElementById('site-footer')) {
  if (!container) return;

  const currentYear = new Date().getFullYear();

  const appContainer = createElement('div', { className: ['app-container', 'footer-inner'] });

  // Top Section
  const footerTop = createElement('div', { className: 'footer-top' });

  // Brand Info
  const brand = createElement('div', {
    className: 'footer-brand',
    children: [
      createElement('img', {
        attrs: { src: 'assets/icons/logo.svg', alt: 'DevTrail', width: '24', height: '24' }
      }),
      createElement('span', { text: 'DevTrail — Developer Resource Discovery' })
    ]
  });

  // Navigation Links
  const navLinks = createElement('div', {
    className: 'footer-nav',
    children: [
      createElement('a', { attrs: { href: 'index.html' }, text: 'Dashboard' }),
      createElement('a', { attrs: { href: 'repositories.html' }, text: 'Explore Repositories' }),
      createElement('a', { attrs: { href: 'questions.html' }, text: 'Programming Questions' }),
      createElement('a', { attrs: { href: 'saved.html' }, text: 'Saved Resources' })
    ]
  });

  footerTop.appendChild(brand);
  footerTop.appendChild(navLinks);

  // Bottom Section
  const footerBottom = createElement('div', { className: 'footer-bottom' });

  const copyright = createElement('div', {
    className: 'footer-copyright',
    text: `© ${currentYear} DevTrail. WDD 330 Final Project.`
  });

  const attribution = createElement('div', {
    className: 'api-attribution',
    children: [
      createElement('span', { text: 'Powered by:' }),
      createElement('a', {
        className: 'api-attribution-item',
        attrs: {
          href: 'https://docs.github.com/en/rest',
          target: '_blank',
          rel: 'noopener noreferrer'
        },
        text: 'GitHub REST API'
      }),
      createElement('span', { text: '•' }),
      createElement('a', {
        className: 'api-attribution-item',
        attrs: {
          href: 'https://api.stackexchange.com/',
          target: '_blank',
          rel: 'noopener noreferrer'
        },
        text: 'Stack Exchange API'
      })
    ]
  });

  footerBottom.appendChild(copyright);
  footerBottom.appendChild(attribution);

  appContainer.appendChild(footerTop);
  appContainer.appendChild(footerBottom);

  container.innerHTML = '';
  container.appendChild(appContainer);
}
