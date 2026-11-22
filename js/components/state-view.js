/**
 * DevTrail State View Component
 * Provides reusable loading skeletons, empty states, and error alerts.
 */

import { createElement, createSvgFromString, clearElement } from '../utils/dom.js';

const EMPTY_SEARCH_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    <line x1="8" y1="11" x2="14" y2="11"></line>
  </svg>`;

const ERROR_ALERT_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>`;

/**
 * Renders animated skeleton placeholder cards while fetching data.
 * 
 * @param {HTMLElement} container - The container element to receive skeletons
 * @param {number} [count=6] - Number of skeleton cards to render
 */
export function renderLoadingState(container, count = 6) {
  if (!container) return;
  clearElement(container);

  for (let i = 0; i < count; i++) {
    const skeleton = createElement('div', {
      className: 'skeleton-card',
      attrs: { 'aria-hidden': 'true' },
      children: [
        createElement('div', { className: ['skeleton-line', 'skeleton-title'] }),
        createElement('div', { className: ['skeleton-line', 'skeleton-desc'] }),
        createElement('div', { className: ['skeleton-line', 'skeleton-desc-2'] }),
        createElement('div', {
          style: 'display: flex; gap: 8px; margin-top: auto; padding-top: 16px;',
          children: [
            createElement('div', { className: 'skeleton-line', style: 'width: 60px;' }),
            createElement('div', { className: 'skeleton-line', style: 'width: 50px;' })
          ]
        })
      ]
    });
    container.appendChild(skeleton);
  }
}

/**
 * Renders an empty state view when no matching results are found.
 * 
 * @param {HTMLElement} container - The target container element
 * @param {Object} options - Customization options
 * @param {string} [options.title='No results found'] - Heading
 * @param {string} [options.message='Try adjusting your search terms or filters.'] - Explanation
 * @param {string} [options.actionText] - Optional label for action button
 * @param {Function} [options.onAction] - Optional click handler for action button
 */
export function renderEmptyState(container, {
  title = 'No resources found',
  message = 'Try modifying your search query or selecting a different language or tag.',
  actionText = '',
  onAction = null
} = {}) {
  if (!container) return;
  clearElement(container);

  const iconWrap = createElement('div', {
    className: ['state-icon-wrap', 'empty'],
    children: [createSvgFromString(EMPTY_SEARCH_SVG)]
  });

  const heading = createElement('h3', {
    className: 'state-title',
    text: title
  });

  const desc = createElement('p', {
    className: 'state-message',
    text: message
  });

  const content = [iconWrap, heading, desc];

  if (actionText && typeof onAction === 'function') {
    const actionBtn = createElement('button', {
      className: ['btn', 'btn-secondary', 'btn-sm'],
      attrs: { type: 'button' },
      text: actionText,
      events: { click: onAction }
    });
    content.push(actionBtn);
  }

  const wrapper = createElement('div', {
    className: 'state-container',
    attrs: { role: 'status' },
    children: content
  });

  container.appendChild(wrapper);
}

/**
 * Renders an error state view when network or API requests fail.
 * 
 * @param {HTMLElement} container - The target container element
 * @param {Object} options - Customization options
 * @param {string} [options.title='Unable to load resources'] - Heading
 * @param {string} options.message - Error explanation
 * @param {Function} [options.onRetry] - Optional retry handler
 */
export function renderErrorState(container, {
  title = 'Unable to load resources',
  message = 'An unexpected error occurred while communicating with the API.',
  onRetry = null
} = {}) {
  if (!container) return;
  clearElement(container);

  const iconWrap = createElement('div', {
    className: ['state-icon-wrap', 'error'],
    children: [createSvgFromString(ERROR_ALERT_SVG)]
  });

  const heading = createElement('h3', {
    className: 'state-title',
    text: title
  });

  const desc = createElement('p', {
    className: 'state-message',
    text: message
  });

  const content = [iconWrap, heading, desc];

  if (typeof onRetry === 'function') {
    const retryBtn = createElement('button', {
      className: ['btn', 'btn-primary', 'btn-sm'],
      attrs: { type: 'button' },
      text: 'Retry Request',
      events: { click: onRetry }
    });
    content.push(retryBtn);
  }

  const wrapper = createElement('div', {
    className: 'state-container',
    attrs: { role: 'alert' },
    children: content
  });

  container.appendChild(wrapper);
}
