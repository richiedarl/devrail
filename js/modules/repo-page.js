/**
 * DevTrail Repositories Page Controller
 * Manages GitHub repository discovery, filters, pagination, search form, and UI states.
 */

import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { searchRepositories } from '../services/github.js';
import { createRepositoryCard } from '../components/card.js';
import { renderLoadingState, renderEmptyState, renderErrorState } from '../components/state-view.js';
import { clearElement, createElement } from '../utils/dom.js';

// DOM Elements
const searchForm = document.getElementById('repo-search-form');
const queryInput = document.getElementById('repo-query-input');
const languageSelect = document.getElementById('repo-language-select');
const sortSelect = document.getElementById('repo-sort-select');
const resultsContainer = document.getElementById('repo-results-grid');
const resultsCountEl = document.getElementById('repo-results-count');
const rateLimitBadge = document.getElementById('repo-rate-limit-badge');
const paginationContainer = document.getElementById('repo-pagination');
const submitBtn = searchForm.querySelector('button[type="submit"]');

const ITEMS_PER_PAGE = 18;
// GitHub Search API limits search results access to the first 1,000 items
const MAX_GITHUB_SEARCH_RESULTS = 1000;

let isSearching = false;
let currentPage = 1;
let totalPages = 1;

/**
 * Renders pagination controls for repository search.
 */
function renderPagination() {
  if (!paginationContainer) return;
  clearElement(paginationContainer);

  if (totalPages <= 1) return;

  // Previous Button
  const prevBtn = createElement('button', {
    className: 'pagination-btn',
    attrs: {
      type: 'button',
      'aria-label': 'Go to previous page of repository results'
    },
    text: '← Previous',
    events: {
      click: () => {
        if (currentPage > 1) {
          currentPage--;
          performSearch(currentPage);
          resultsContainer.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  });
  if (currentPage <= 1) {
    prevBtn.disabled = true;
  }

  // Page Indicator
  const indicator = createElement('span', {
    className: 'page-indicator',
    attrs: { 'aria-current': 'page' },
    text: `Page ${currentPage} of ${totalPages}`
  });

  // Next Button
  const nextBtn = createElement('button', {
    className: 'pagination-btn',
    attrs: {
      type: 'button',
      'aria-label': 'Go to next page of repository results'
    },
    text: 'Next →',
    events: {
      click: () => {
        if (currentPage < totalPages) {
          currentPage++;
          performSearch(currentPage);
          resultsContainer.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  });
  if (currentPage >= totalPages) {
    nextBtn.disabled = true;
  }

  paginationContainer.appendChild(prevBtn);
  paginationContainer.appendChild(indicator);
  paginationContainer.appendChild(nextBtn);
}

/**
 * Executes a repository search and updates the interface.
 * 
 * @param {number} [page=1] - Page number to fetch
 */
async function performSearch(page = 1) {
  if (isSearching) return;

  const query = queryInput.value.trim();
  const language = languageSelect.value;
  const sort = sortSelect.value;

  isSearching = true;
  if (submitBtn) submitBtn.disabled = true;
  renderLoadingState(resultsContainer, 6);
  if (paginationContainer) clearElement(paginationContainer);
  resultsCountEl.textContent = page > 1 ? `Loading page ${page}...` : 'Searching repositories...';

  try {
    const data = await searchRepositories({
      query,
      language,
      sort,
      order: 'desc',
      page,
      perPage: ITEMS_PER_PAGE
    });

    clearElement(resultsContainer);

    if (data.items.length === 0) {
      totalPages = 1;
      resultsCountEl.textContent = 'No repositories found';
      renderEmptyState(resultsContainer, {
        title: 'No repositories found',
        message: 'No matching GitHub repositories were found. Try modifying your keyword or choosing "All Languages".',
        actionText: 'Reset Filters',
        onAction: () => {
          queryInput.value = '';
          languageSelect.value = '';
          sortSelect.value = 'stars';
          currentPage = 1;
          performSearch(1);
        }
      });
      return;
    }

    // Calculate total pages (capped by GitHub's 1,000 item limit)
    const accessibleCount = Math.min(data.totalCount, MAX_GITHUB_SEARCH_RESULTS);
    totalPages = Math.max(1, Math.ceil(accessibleCount / ITEMS_PER_PAGE));

    // Render Count
    const totalFormatted = data.totalCount.toLocaleString();
    resultsCountEl.textContent = `Found ${totalFormatted} repositories (showing page ${page} of ${totalPages})`;

    // Display Rate Limit if returned
    if (rateLimitBadge && data.rateLimitRemaining !== null) {
      rateLimitBadge.textContent = `GitHub API requests remaining: ${data.rateLimitRemaining}`;
    }

    // Render Cards
    data.items.forEach(repo => {
      const card = createRepositoryCard(repo);
      resultsContainer.appendChild(card);
    });

    // Render Pagination
    renderPagination();

  } catch (error) {
    console.error('GitHub search error:', error);
    resultsCountEl.textContent = 'Search failed';
    renderErrorState(resultsContainer, {
      title: 'GitHub Search Failed',
      message: error.message || 'Could not retrieve repositories from GitHub. Please try again.',
      onRetry: () => performSearch(page)
    });
  } finally {
    isSearching = false;
    if (submitBtn) submitBtn.disabled = false;
  }
}

/**
 * Initializes the page.
 */
export function initRepositoriesPage() {
  initHeader();
  initFooter();

  // Read URL params if any
  const urlParams = new URLSearchParams(window.location.search);
  const qParam = urlParams.get('q');
  const langParam = urlParams.get('language') || urlParams.get('lang');

  if (qParam) queryInput.value = qParam;
  if (langParam) languageSelect.value = langParam;

  // Form submission
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    currentPage = 1;
    performSearch(1);
  });

  // Filter change triggers search and resets page to 1
  languageSelect.addEventListener('change', () => {
    currentPage = 1;
    performSearch(1);
  });
  sortSelect.addEventListener('change', () => {
    currentPage = 1;
    performSearch(1);
  });

  // Default initial search
  if (!queryInput.value) {
    queryInput.value = 'javascript';
  }
  currentPage = 1;
  performSearch(1);
}

// Auto-run if loaded as page entry module
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRepositoriesPage);
} else {
  initRepositoriesPage();
}
