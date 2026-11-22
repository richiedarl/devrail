/**
 * DevTrail Stack Exchange Service
 * Interacts with the Stack Exchange API v2.3 advanced search endpoint.
 * Docs: https://api.stackexchange.com/docs/advanced-search
 */

const STACK_EXCHANGE_API_BASE = 'https://api.stackexchange.com/2.3';
const DEFAULT_PAGE_SIZE = 18;

// Client-side rate-limit / backoff tracking
let backoffUntilTimestamp = 0;
let lastQuotaRemaining = null;

/**
 * Searches for programming questions on Stack Overflow via Stack Exchange API v2.3.
 * 
 * @param {Object} params - Search options
 * @param {string} [params.query=''] - Keyword search string
 * @param {string} [params.tag=''] - Tag filter (e.g. 'javascript', 'python', 'css')
 * @param {string} [params.sort='activity'] - Sort criteria ('activity', 'votes', 'creation', 'relevance')
 * @param {string} [params.order='desc'] - Sort order ('desc' or 'asc')
 * @param {number} [params.page=1] - Page number (1-indexed)
 * @param {number} [params.pageSize=DEFAULT_PAGE_SIZE] - Items per page
 * @returns {Promise<{items: Array, totalCount: number, quotaRemaining: number|null, hasMore: boolean}>}
 */
export async function searchQuestions({
  query = '',
  tag = '',
  sort = 'relevance',
  order = 'desc',
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
} = {}) {
  // Check if API backoff is currently active
  const now = Date.now();
  if (now < backoffUntilTimestamp) {
    const waitSeconds = Math.ceil((backoffUntilTimestamp - now) / 1000);
    throw new Error(`Stack Exchange API throttling active. Please wait ${waitSeconds}s before requesting again.`);
  }

  const trimmedQuery = query.trim();
  const trimmedTag = tag.trim().toLowerCase().replace(/^#/, '');

  const searchParams = new URLSearchParams({
    site: 'stackoverflow',
    order: order,
    sort: sort,
    page: String(page),
    pagesize: String(pageSize),
    filter: 'default' // returns standard fields: question_id, title, tags, score, answer_count, is_answered, link, owner
  });

  if (trimmedQuery) {
    searchParams.set('q', trimmedQuery);
  }

  if (trimmedTag) {
    searchParams.set('tagged', trimmedTag);
  }

  // If neither query nor tag is specified, default to popular recent questions
  if (!trimmedQuery && !trimmedTag) {
    searchParams.set('sort', 'votes');
    searchParams.set('tagged', 'javascript');
  }

  const url = `${STACK_EXCHANGE_API_BASE}/search/advanced?${searchParams.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Stack Exchange API request failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check for API-level errors
    if (data.error_id) {
      throw new Error(`Stack Exchange API error (${data.error_name}): ${data.error_message}`);
    }

    // Respect backoff requests from Stack Exchange API
    if (data.backoff && typeof data.backoff === 'number') {
      backoffUntilTimestamp = Date.now() + (data.backoff * 1000);
      console.warn(`[StackExchange API] Backoff requested: ${data.backoff} seconds.`);
    }

    // Track quota
    if (typeof data.quota_remaining === 'number') {
      lastQuotaRemaining = data.quota_remaining;
    }

    return {
      items: Array.isArray(data.items) ? data.items : [],
      hasMore: Boolean(data.has_more),
      quotaRemaining: lastQuotaRemaining,
      totalCount: Array.isArray(data.items) ? data.items.length : 0
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach Stack Exchange API. Please check your internet connection.');
    }
    throw error;
  }
}

/**
 * Returns the most recent quota remaining figure from Stack Exchange.
 * @returns {number|null}
 */
export function getStackExchangeQuota() {
  return lastQuotaRemaining;
}
