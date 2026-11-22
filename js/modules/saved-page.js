/**
 * DevTrail Saved Resources Page Controller
 * Manages the personal resource library, filtering by type, removal, and empty state rendering.
 */

import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { getSavedResources, getResourcesByType, getSavedCounts, removeResource, clearAllResources } from '../services/storage.js';
import { createCardFromSavedResource } from '../components/card.js';
import { renderEmptyState } from '../components/state-view.js';
import { clearElement } from '../utils/dom.js';
import { showToast } from '../components/toast.js';

// DOM Elements
const resultsGrid = document.getElementById('saved-results-grid');
const resultsCountEl = document.getElementById('saved-results-count');
const filterTabs = document.getElementById('saved-filter-tabs');
const badgeAll = document.getElementById('count-badge-all');
const badgeRepos = document.getElementById('count-badge-repos');
const badgeQuestions = document.getElementById('count-badge-questions');
const clearAllBtn = document.getElementById('btn-clear-all');

let currentFilter = 'all';

/**
 * Updates the badges showing the number of saved items per category.
 */
function updateTabBadges() {
  const counts = getSavedCounts();
  if (badgeAll) badgeAll.textContent = String(counts.total);
  if (badgeRepos) badgeRepos.textContent = String(counts.repositories);
  if (badgeQuestions) badgeQuestions.textContent = String(counts.questions);

  if (clearAllBtn) {
    clearAllBtn.style.display = counts.total > 0 ? 'inline-flex' : 'none';
  }
}

/**
 * Renders the saved resources grid based on current filter.
 */
export function renderSavedView() {
  if (!resultsGrid) return;

  updateTabBadges();
  clearElement(resultsGrid);

  const totalCounts = getSavedCounts();
  const items = getResourcesByType(currentFilter);

  // Global empty library (0 items saved anywhere)
  if (totalCounts.total === 0) {
    if (resultsCountEl) resultsCountEl.textContent = '0 saved resources';
    renderEmptyState(resultsGrid, {
      title: 'Your saved library is empty',
      message: 'Bookmark open-source repositories and programming solutions while exploring to build your personal library.',
      actionText: 'Explore Repositories',
      onAction: () => {
        window.location.href = 'repositories.html';
      }
    });
    return;
  }

  // Filter-specific empty state (e.g. user has saved questions but 0 repos)
  if (items.length === 0) {
    if (resultsCountEl) resultsCountEl.textContent = `0 saved ${currentFilter}s`;
    const isRepo = currentFilter === 'repository';
    renderEmptyState(resultsGrid, {
      title: `No saved ${isRepo ? 'repositories' : 'questions'}`,
      message: isRepo
        ? 'You have not saved any GitHub repositories yet.'
        : 'You have not saved any Stack Overflow questions yet.',
      actionText: isRepo ? 'Find Repositories' : 'Search Questions',
      onAction: () => {
        window.location.href = isRepo ? 'repositories.html' : 'questions.html';
      }
    });
    return;
  }

  // Update count text
  if (resultsCountEl) {
    const filterLabel = currentFilter === 'all'
      ? 'saved resources'
      : currentFilter === 'repository' ? 'saved repositories' : 'saved questions';
    resultsCountEl.textContent = `Showing ${items.length} ${filterLabel}`;
  }

  // Render Cards
  items.forEach(savedItem => {
    const card = createCardFromSavedResource(savedItem, {
      onRemove: (removed) => {
        // Smoothly remove card from view and re-evaluate
        card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
          renderSavedView();
        }, 220);
      }
    });
    resultsGrid.appendChild(card);
  });
}

/**
 * Initializes the Saved Resources page.
 */
export function initSavedPage() {
  initHeader();
  initFooter();

  // Tab Filtering Listeners
  if (filterTabs) {
    filterTabs.addEventListener('click', (event) => {
      const tab = event.target.closest('.tab-btn');
      if (!tab) return;

      const newType = tab.dataset.type;
      if (newType === currentFilter) return;

      currentFilter = newType;

      // Update active tab visuals
      filterTabs.querySelectorAll('.tab-btn').forEach(btn => {
        const isActive = btn === tab;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', String(isActive));
      });

      renderSavedView();
    });
  }

  // Clear All Button
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      const counts = getSavedCounts();
      if (counts.total === 0) return;

      const confirmed = window.confirm(
        `Are you sure you want to remove all ${counts.total} saved resources from your local library?`
      );

      if (confirmed) {
        const success = clearAllResources();
        if (success) {
          showToast('Cleared all saved resources.', 'info');
          renderSavedView();
        } else {
          showToast('Unable to clear resources.', 'error');
        }
      }
    });
  }

  // Listen for storage events from other tabs or card interactions
  window.addEventListener('devtrail:storage-updated', () => {
    renderSavedView();
  });

  window.addEventListener('storage', (event) => {
    if (event.key === 'devtrail_saved_resources' || event.key === null) {
      renderSavedView();
    }
  });

  // Initial render
  renderSavedView();
}

// Auto-run if loaded as page entry module
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSavedPage);
} else {
  initSavedPage();
}
