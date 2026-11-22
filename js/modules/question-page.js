/**
 * DevTrail Questions Page Controller
 * Manages Stack Overflow question discovery, tags, pagination, search form, and UI states.
 */

import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';
import { searchQuestions } from '../services/stackexchange.js';
import { createQuestionCard } from '../components/card.js';
import { renderLoadingState, renderEmptyState, renderErrorState } from '../components/state-view.js';
import { clearElement, createElement } from '../utils/dom.js';

// DOM Elements
const searchForm = document.getElementById('question-search-form');
const queryInput = document.getElementById('question-query-input');
const tagSelect = document.getElementById('question-tag-select');
const sortSelect = document.getElementById('question-sort-select');
const resultsContainer = document.getElementById('question-results-grid');
const resultsCountEl = document.getElementById('question-results-count');
const quotaBadge = document.getElementById('question-quota-badge');
const paginationContainer = document.getElementById('question-pagination');
const submitBtn = searchForm.querySelector('button[type="submit"]');

const PAGE_SIZE = 18;

let isSearching = false;
let currentPage = 1;
let hasMoreResults = false;

/**
 * Renders pagination controls for question search.
 */
function renderPagination() {
  if (!paginationContainer) return;
  clearElement(paginationContainer);

  // If on page 1 and no more results, no pagination needed
  if (currentPage === 1 && !hasMoreResults) return;

  // Previous Button
  const prevBtn = createElement('button', {
    className: 'pagination-btn',
    attrs: {
      type: 'button',
      'aria-label': 'Go to previous page of question results'
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
    text: `Page ${currentPage}`
  });

  // Next Button
  const nextBtn = createElement('button', {
    className: 'pagination-btn',
    attrs: {
      type: 'button',
      'aria-label': 'Go to next page of question results'
    },
    text: 'Next →',
    events: {
      click: () => {
        if (hasMoreResults) {
          currentPage++;
          performSearch(currentPage);
          resultsContainer.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  });
  if (!hasMoreResults) {
    nextBtn.disabled = true;
  }

  paginationContainer.appendChild(prevBtn);
  paginationContainer.appendChild(indicator);
  paginationContainer.appendChild(nextBtn);
}

/**
 * Executes a question search and updates the interface.
 * 
 * @param {number} [page=1] - Page number to fetch
 */
async function performSearch(page = 1) {
  if (isSearching) return;

  const query = queryInput.value.trim();
  const tag = tagSelect.value.trim();
  const sort = sortSelect.value;

  isSearching = true;
  if (submitBtn) submitBtn.disabled = true;
  renderLoadingState(resultsContainer, 6);
  if (paginationContainer) clearElement(paginationContainer);
  resultsCountEl.textContent = page > 1 ? `Loading page ${page}...` : 'Searching Stack Overflow questions...';

  try {
    const data = await searchQuestions({
      query,
      tag,
      sort,
      order: 'desc',
      page,
      pageSize: PAGE_SIZE
    });

    clearElement(resultsContainer);
    hasMoreResults = data.hasMore;

    if (data.items.length === 0) {
      hasMoreResults = false;
      resultsCountEl.textContent = 'No questions found';
      renderEmptyState(resultsContainer, {
        title: 'No questions found',
        message: 'No matching Stack Overflow questions were found. Try broader keywords or clearing the tag filter.',
        actionText: 'Reset Filters',
        onAction: () => {
          queryInput.value = '';
          tagSelect.value = '';
          sortSelect.value = 'relevance';
          currentPage = 1;
          performSearch(1);
        }
      });
      return;
    }

    // Render Count
    resultsCountEl.textContent = `Found ${data.items.length} relevant questions (Page ${page})`;

    // Display Quota Remaining if returned
    if (quotaBadge && data.quotaRemaining !== null) {
      quotaBadge.textContent = `Stack Exchange Daily Quota Remaining: ${data.quotaRemaining}`;
    }

    // Render Cards
    data.items.forEach(question => {
      const card = createQuestionCard(question);
      resultsContainer.appendChild(card);
    });

    // Render Pagination
    renderPagination();

  } catch (error) {
    console.error('Stack Overflow search error:', error);
    resultsCountEl.textContent = 'Search failed';
    renderErrorState(resultsContainer, {
      title: 'Question Search Failed',
      message: error.message || 'Could not retrieve questions from Stack Exchange. Please try again.',
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
export function initQuestionsPage() {
  initHeader();
  initFooter();

  // Read URL params if any
  const urlParams = new URLSearchParams(window.location.search);
  const qParam = urlParams.get('q');
  const tagParam = urlParams.get('tag');

  if (qParam) queryInput.value = qParam;
  if (tagParam) tagSelect.value = tagParam;

  // Form submission
  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    currentPage = 1;
    performSearch(1);
  });

  // Filter changes reset to page 1
  tagSelect.addEventListener('change', () => {
    currentPage = 1;
    performSearch(1);
  });
  sortSelect.addEventListener('change', () => {
    currentPage = 1;
    performSearch(1);
  });

  // Default initial search
  if (!queryInput.value && !tagSelect.value) {
    queryInput.value = 'fetch api';
    tagSelect.value = 'javascript';
  }
  currentPage = 1;
  performSearch(1);
}

// Auto-run if loaded as page entry module
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQuestionsPage);
} else {
  initQuestionsPage();
}
