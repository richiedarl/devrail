/**
 * DevTrail Toast Notification Component
 * Displays non-obstructive, accessible feedback messages for bookmark operations and errors.
 */

import { createElement, createSvgFromString } from '../utils/dom.js';

const CHECK_ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>`;

const INFO_ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>`;

const ALERT_ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>`;

/**
 * Ensures the floating toast container exists in the DOM.
 * 
 * @returns {HTMLElement} Container element
 */
function getOrCreateToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = createElement('div', {
      className: 'toast-container',
      attrs: {
        id: 'toast-container',
        'aria-live': 'polite',
        'aria-atomic': 'true'
      }
    });
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Displays a toast notification.
 * 
 * @param {string} message - Message text to display
 * @param {'success'|'info'|'warning'|'error'} [type='info'] - Notification type
 * @param {number} [duration=3500] - Duration in milliseconds before auto-dismiss
 */
export function showToast(message, type = 'info', duration = 3500) {
  const container = getOrCreateToastContainer();

  let iconSvg = INFO_ICON_SVG;
  if (type === 'success') iconSvg = CHECK_ICON_SVG;
  else if (type === 'error' || type === 'warning') iconSvg = ALERT_ICON_SVG;

  const iconEl = createElement('span', {
    className: 'toast-icon',
    children: [createSvgFromString(iconSvg)]
  });

  const messageEl = createElement('span', {
    className: 'toast-message',
    text: message
  });

  const closeBtn = createElement('button', {
    className: 'toast-close',
    attrs: {
      type: 'button',
      'aria-label': 'Dismiss notification'
    },
    text: '×'
  });

  const toast = createElement('div', {
    className: ['toast', `toast-${type}`],
    attrs: { role: 'status' },
    children: [iconEl, messageEl, closeBtn]
  });

  // Dismiss logic
  let isDismissed = false;
  const dismiss = () => {
    if (isDismissed) return;
    isDismissed = true;
    toast.classList.add('toast-fade-out');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  };

  closeBtn.addEventListener('click', dismiss);

  container.appendChild(toast);

  // Auto-dismiss after duration
  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
}
