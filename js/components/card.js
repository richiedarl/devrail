/**
 * DevTrail Resource Card Component
 * Builds accessible, safe DOM elements for GitHub Repositories and Stack Overflow Questions.
 * Strictly uses safe DOM methods (textContent, document.createElement) to prevent XSS.
 * Includes interactive bookmark controls integrated with the Local Storage service.
 */

import { createElement, createSvgFromString, decodeHtmlEntities } from '../utils/dom.js';
import { formatCompactNumber, formatDate, truncate } from '../utils/formatters.js';
import { isResourceSaved, saveResource, removeResource } from '../services/storage.js';
import { showToast } from './toast.js';

// Reusable SVG strings
const STAR_ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>`;

const FORK_ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="18" cy="18" r="3"></circle>
    <circle cx="6" cy="6" r="3"></circle>
    <circle cx="6" cy="18" r="3"></circle>
    <path d="M18 15V9a9 9 0 0 0-9-9"></path>
    <line x1="6" y1="9" x2="6" y2="15"></line>
  </svg>`;

const COMMENT_ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>`;

const EXTERNAL_LINK_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>`;

const CHECK_ICON_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>`;

const BOOKMARK_OUTLINE_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>`;

const BOOKMARK_FILLED_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
  </svg>`;

/**
 * Creates an interactive bookmark button for a resource card.
 * 
 * @param {Object} options - Resource details
 * @param {string} options.resourceId - Unique identifier
 * @param {'repository'|'question'} options.resourceType - Type of resource
 * @param {string} options.title - Resource title
 * @param {string} [options.description] - Resource description
 * @param {string} options.url - Original URL
 * @param {Object} [options.metadata] - Extra metadata
 * @param {Function} [options.onBookmarkChange] - Callback when bookmark state changes
 * @returns {HTMLButtonElement} Bookmark button element
 */
function createBookmarkButton({
  resourceId,
  resourceType,
  title,
  description = '',
  url,
  metadata = {},
  onBookmarkChange = null
}) {
  let isSaved = isResourceSaved(resourceId);

  const button = createElement('button', {
    className: ['btn-bookmark', isSaved ? 'bookmarked' : ''],
    attrs: {
      type: 'button',
      'aria-pressed': String(isSaved),
      'aria-label': isSaved ? `Remove ${title} from saved resources` : `Save ${title} to saved resources`,
      title: isSaved ? 'Remove from saved resources' : 'Save to resources'
    },
    children: [createSvgFromString(isSaved ? BOOKMARK_FILLED_SVG : BOOKMARK_OUTLINE_SVG)]
  });

  const updateVisuals = (savedState) => {
    isSaved = savedState;
    button.classList.toggle('bookmarked', isSaved);
    button.setAttribute('aria-pressed', String(isSaved));
    button.setAttribute('aria-label', isSaved ? `Remove ${title} from saved resources` : `Save ${title} to saved resources`);
    button.setAttribute('title', isSaved ? 'Remove from saved resources' : 'Save to resources');
    button.innerHTML = '';
    button.appendChild(createSvgFromString(isSaved ? BOOKMARK_FILLED_SVG : BOOKMARK_OUTLINE_SVG));
  };

  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();

    const currentlySaved = isResourceSaved(resourceId);

    try {
      if (currentlySaved) {
        removeResource(resourceId);
        updateVisuals(false);
        showToast(`Removed "${title}" from saved resources.`, 'info');
        if (typeof onBookmarkChange === 'function') {
          onBookmarkChange(false);
        }
      } else {
        saveResource({
          id: resourceId,
          type: resourceType,
          title,
          description,
          url,
          metadata
        });
        updateVisuals(true);
        showToast(`Saved "${title}" to your resources!`, 'success');
        if (typeof onBookmarkChange === 'function') {
          onBookmarkChange(true);
        }
      }
    } catch (error) {
      showToast(error.message || 'Unable to update saved resource.', 'error');
    }
  });

  // Cross-page / cross-tab synchronization listeners
  const syncHandler = (event) => {
    if (event.detail?.action === 'sync' || event.detail?.action === 'clear') {
      updateVisuals(isResourceSaved(resourceId));
    } else if (event.detail?.resource?.id === resourceId) {
      updateVisuals(event.detail.action === 'save');
    }
  };
  window.addEventListener('devtrail:storage-updated', syncHandler);

  window.addEventListener('storage', (event) => {
    if (event.key === 'devtrail_saved_resources' || event.key === null) {
      updateVisuals(isResourceSaved(resourceId));
    }
  });

  return button;
}

/**
 * Creates a repository card DOM element.
 * 
 * @param {Object} repo - GitHub Repository item from API
 * @param {Object} [options={}] - Optional callbacks
 * @param {Function} [options.onBookmarkChange] - Callback when bookmark state changes
 * @returns {HTMLElement} Card element
 */
export function createRepositoryCard(repo, { onBookmarkChange = null } = {}) {
  const card = createElement('article', { className: ['card', 'repo-card'] });

  const resourceId = `repo-${repo.id}`;
  const repoName = repo.name || repo.full_name || 'Repository';
  const repoDesc = repo.description || '';
  const repoUrl = repo.html_url || '';

  // Header: Avatar, Owner, Repo Name, Bookmark Button
  const header = createElement('div', { className: 'repo-header' });

  const avatar = createElement('img', {
    className: 'repo-avatar',
    attrs: {
      src: repo.owner?.avatar_url || 'assets/icons/logo.svg',
      alt: `${repo.owner?.login || 'Author'} avatar`,
      loading: 'lazy',
      width: '38',
      height: '38'
    }
  });

  const infoWrap = createElement('div', { className: 'repo-header-info' });

  const owner = createElement('span', {
    className: 'repo-owner',
    text: repo.owner?.login || 'Unknown author'
  });

  const repoTitle = createElement('h3', {
    className: 'repo-name',
    text: repoName
  });

  infoWrap.appendChild(owner);
  infoWrap.appendChild(repoTitle);

  // Bookmark Control
  const bookmarkBtn = createBookmarkButton({
    resourceId,
    resourceType: 'repository',
    title: repoName,
    description: repoDesc,
    url: repoUrl,
    metadata: {
      owner: repo.owner?.login || '',
      avatarUrl: repo.owner?.avatar_url || '',
      language: repo.language || '',
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0
    },
    onBookmarkChange
  });

  header.appendChild(avatar);
  header.appendChild(infoWrap);
  header.appendChild(bookmarkBtn);

  // Description
  const description = createElement('p', {
    className: 'repo-description',
    text: repoDesc ? truncate(repoDesc, 160) : 'No description provided by repository maintainers.'
  });

  // Metadata & Stats Row
  const metaRow = createElement('div', { className: 'repo-meta-row' });
  const statsWrap = createElement('div', { className: 'repo-stats' });

  // Language Badge
  if (repo.language) {
    const langBadge = createElement('span', {
      className: ['badge', 'badge-navy'],
      text: repo.language
    });
    statsWrap.appendChild(langBadge);
  }

  // Stars Stat
  const starStat = createElement('span', {
    className: ['stat-item', 'star-stat'],
    attrs: { title: `${repo.stargazers_count?.toLocaleString() || 0} stars` },
    children: [
      createSvgFromString(STAR_ICON_SVG),
      document.createTextNode(formatCompactNumber(repo.stargazers_count || 0))
    ]
  });

  // Forks Stat
  const forkStat = createElement('span', {
    className: 'stat-item',
    attrs: { title: `${repo.forks_count?.toLocaleString() || 0} forks` },
    children: [
      createSvgFromString(FORK_ICON_SVG),
      document.createTextNode(formatCompactNumber(repo.forks_count || 0))
    ]
  });

  statsWrap.appendChild(starStat);
  statsWrap.appendChild(forkStat);

  // External Action Link
  const linkBtn = createElement('a', {
    className: ['btn', 'btn-secondary', 'btn-sm'],
    attrs: {
      href: repoUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': `View ${repo.full_name || repoName} repository on GitHub (opens in new tab)`
    },
    children: [
      document.createTextNode('GitHub'),
      createSvgFromString(EXTERNAL_LINK_SVG)
    ]
  });

  metaRow.appendChild(statsWrap);
  metaRow.appendChild(linkBtn);

  // Assemble Card
  card.appendChild(header);
  card.appendChild(description);
  card.appendChild(metaRow);

  return card;
}

/**
 * Creates a programming question card DOM element.
 * 
 * @param {Object} question - Stack Overflow Question item from API
 * @param {Object} [options={}] - Optional callbacks
 * @param {Function} [options.onBookmarkChange] - Callback when bookmark state changes
 * @returns {HTMLElement} Card element
 */
export function createQuestionCard(question, { onBookmarkChange = null } = {}) {
  const card = createElement('article', { className: ['card', 'question-card'] });

  const questionId = question.question_id || question.id;
  const resourceId = `question-${questionId}`;
  const cleanTitle = decodeHtmlEntities(question.title);
  const questionUrl = question.link || '';

  // Header: Answered status badge, asked date, and Bookmark button
  const header = createElement('div', { className: 'question-header' });

  const headerLeft = createElement('div', {
    style: 'display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap;'
  });

  const isAnswered = Boolean(question.is_answered);
  const statusBadge = createElement('span', {
    className: ['badge', isAnswered ? 'badge-answered' : 'badge-unanswered'],
    children: [
      isAnswered ? createSvgFromString(CHECK_ICON_SVG) : null,
      document.createTextNode(isAnswered ? 'Answered' : 'Unanswered')
    ].filter(Boolean)
  });

  const dateFormatted = question.creation_date ? formatDate(question.creation_date) : '';
  const dateSpan = createElement('span', {
    className: 'repo-owner',
    text: dateFormatted ? `Asked ${dateFormatted}` : ''
  });

  headerLeft.appendChild(statusBadge);
  if (dateFormatted) headerLeft.appendChild(dateSpan);

  // Bookmark Control
  const bookmarkBtn = createBookmarkButton({
    resourceId,
    resourceType: 'question',
    title: cleanTitle,
    description: '',
    url: questionUrl,
    metadata: {
      tags: question.tags || [],
      score: question.score || 0,
      answerCount: question.answer_count || 0,
      isAnswered,
      creationDate: question.creation_date || null
    },
    onBookmarkChange
  });

  header.appendChild(headerLeft);
  header.appendChild(bookmarkBtn);

  // Title (Safely decoded plain text)
  const title = createElement('h3', {
    className: 'question-title',
    text: cleanTitle
  });

  // Tags List (Up to 5 tags)
  const tagsWrap = createElement('div', { className: 'question-tags-list' });
  const tags = Array.isArray(question.tags) ? question.tags.slice(0, 5) : [];
  tags.forEach(tag => {
    const chip = createElement('span', {
      className: 'tag-chip',
      text: tag
    });
    tagsWrap.appendChild(chip);
  });

  // Metadata Row
  const metaRow = createElement('div', { className: 'question-meta-row' });
  const statsWrap = createElement('div', { className: 'repo-stats' });

  // Score (Votes)
  const scoreText = (question.score > 0 ? `+${question.score}` : `${question.score || 0}`) + ' votes';
  const scoreBadge = createElement('span', {
    className: ['badge', 'badge-navy'],
    text: scoreText
  });

  // Answer Count
  const answersStat = createElement('span', {
    className: 'stat-item',
    attrs: { title: `${question.answer_count || 0} answers` },
    children: [
      createSvgFromString(COMMENT_ICON_SVG),
      document.createTextNode(`${question.answer_count || 0} answers`)
    ]
  });

  statsWrap.appendChild(scoreBadge);
  statsWrap.appendChild(answersStat);

  // External Action Link
  const linkBtn = createElement('a', {
    className: ['btn', 'btn-secondary', 'btn-sm'],
    attrs: {
      href: questionUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': `View "${cleanTitle}" question on Stack Overflow (opens in new tab)`
    },
    children: [
      document.createTextNode('Stack Overflow'),
      createSvgFromString(EXTERNAL_LINK_SVG)
    ]
  });

  metaRow.appendChild(statsWrap);
  metaRow.appendChild(linkBtn);

  // Assemble Card
  card.appendChild(header);
  card.appendChild(title);
  card.appendChild(tagsWrap);
  card.appendChild(metaRow);

  return card;
}

/**
 * Creates a card directly from a saved resource entry from localStorage.
 * Adapts stored metadata into the respective repository or question shape.
 * 
 * @param {Object} savedResource - Stored resource entry
 * @param {Object} [options={}] - Options
 * @param {Function} [options.onRemove] - Callback invoked when resource is un-bookmarked
 * @returns {HTMLElement} Card element
 */
export function createCardFromSavedResource(savedResource, { onRemove = null } = {}) {
  if (savedResource.type === 'repository') {
    const repoAdapter = {
      id: savedResource.id.replace(/^repo-/, ''),
      name: savedResource.title,
      full_name: savedResource.title,
      description: savedResource.description,
      html_url: savedResource.url,
      language: savedResource.metadata?.language,
      stargazers_count: savedResource.metadata?.stars,
      forks_count: savedResource.metadata?.forks,
      owner: {
        login: savedResource.metadata?.owner,
        avatar_url: savedResource.metadata?.avatarUrl
      }
    };

    return createRepositoryCard(repoAdapter, {
      onBookmarkChange: (isSaved) => {
        if (!isSaved && typeof onRemove === 'function') {
          onRemove(savedResource);
        }
      }
    });
  } else {
    const questionAdapter = {
      question_id: savedResource.id.replace(/^question-/, ''),
      title: savedResource.title,
      link: savedResource.url,
      tags: savedResource.metadata?.tags || [],
      score: savedResource.metadata?.score || 0,
      answer_count: savedResource.metadata?.answerCount || 0,
      is_answered: savedResource.metadata?.isAnswered || false,
      creation_date: savedResource.metadata?.creationDate || null
    };

    return createQuestionCard(questionAdapter, {
      onBookmarkChange: (isSaved) => {
        if (!isSaved && typeof onRemove === 'function') {
          onRemove(savedResource);
        }
      }
    });
  }
}
