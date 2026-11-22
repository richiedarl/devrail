/**
 * DevTrail GitHub Service
 * Interacts with the GitHub REST API (v3) search endpoint.
 * Docs: https://docs.github.com/en/rest/search/search#search-repositories
 */

const GITHUB_API_BASE = 'https://api.github.com';
const DEFAULT_PER_PAGE = 18;

/**
 * Searches for public GitHub repositories based on keyword, language, and sorting criteria.
 * 
 * @param {Object} params - Search options
 * @param {string} [params.query=''] - Search keywords
 * @param {string} [params.language=''] - Programming language filter (e.g. 'JavaScript', 'Python')
 * @param {string} [params.sort='stars'] - Sort criteria ('stars', 'updated', or '')
 * @param {string} [params.order='desc'] - Sort order ('desc' or 'asc')
 * @param {number} [params.page=1] - Page number (1-indexed)
 * @param {number} [params.perPage=DEFAULT_PER_PAGE] - Items per page
 * @returns {Promise<{items: Array, totalCount: number, rateLimitRemaining: number|null}>}
 */
export async function searchRepositories({
  query = '',
  language = '',
  sort = 'stars',
  order = 'desc',
  page = 1,
  perPage = DEFAULT_PER_PAGE
} = {}) {
  const trimmedQuery = query.trim();
  const trimmedLang = language.trim();

  // Construct GitHub Search Query 'q'
  let queryParts = [];
  if (trimmedQuery) {
    queryParts.push(trimmedQuery);
  }
  if (trimmedLang) {
    queryParts.push(`language:${trimmedLang}`);
  }

  // If no query and no language was provided, guide the search or search top repositories
  if (queryParts.length === 0) {
    queryParts.push('stars:>100');
  }

  const finalQuery = queryParts.join(' ');

  const searchParams = new URLSearchParams({
    q: finalQuery,
    order: order,
    page: String(page),
    per_page: String(perPage)
  });

  if (sort) {
    searchParams.set('sort', sort);
  }

  const url = `${GITHUB_API_BASE}/search/repositories?${searchParams.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
    const rateLimitReset = response.headers.get('x-ratelimit-reset');

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        let resetTimeMessage = '';
        if (rateLimitReset) {
          const resetDate = new Date(parseInt(rateLimitReset, 10) * 1000);
          resetTimeMessage = ` Resets around ${resetDate.toLocaleTimeString()}.`;
        }
        throw new Error(
          `GitHub API rate limit exceeded (10 requests/minute for unauthenticated search).${resetTimeMessage} Please wait a moment and try again.`
        );
      }

      if (response.status === 422) {
        throw new Error('Invalid search query. Please adjust your keywords or filters.');
      }

      throw new Error(`GitHub API request failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      totalCount: data.total_count || 0,
      incompleteResults: data.incomplete_results || false,
      items: Array.isArray(data.items) ? data.items : [],
      rateLimitRemaining: rateLimitRemaining !== null ? parseInt(rateLimitRemaining, 10) : null
    };
  } catch (error) {
    // Distinguish network failure vs API error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach GitHub. Please check your internet connection.');
    }
    throw error;
  }
}
