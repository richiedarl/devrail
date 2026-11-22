/**
 * DevTrail Local Storage Service
 * Manages client-side persistence of bookmarked repositories and questions.
 * Handles storage availability checks, corrupted data recovery, and change notifications.
 */

const STORAGE_KEY = 'devtrail_saved_resources';

/**
 * Checks if browser localStorage is supported and accessible.
 * 
 * @returns {boolean} True if localStorage is available
 */
export function isStorageAvailable() {
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('[Storage] localStorage is not available:', error);
    return false;
  }
}

/**
 * Retrieves all saved resources from localStorage.
 * Handles corrupted JSON by resetting cleanly.
 * 
 * @returns {Array<Object>} List of saved resource objects
 */
export function getSavedResources() {
  if (!isStorageAvailable()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('[Storage] Corrupted data detected in localStorage. Resetting storage array.');
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    return parsed;
  } catch (error) {
    console.error('[Storage] Error reading saved resources from localStorage:', error);
    return [];
  }
}

/**
 * Checks whether a specific resource is saved by its unique ID.
 * 
 * @param {string} resourceId - Unique identifier (e.g. 'repo-123' or 'question-456')
 * @returns {boolean} True if resource is saved
 */
export function isResourceSaved(resourceId) {
  if (!resourceId) return false;
  const items = getSavedResources();
  return items.some(item => item.id === resourceId);
}

/**
 * Saves a normalized resource to localStorage.
 * Prevents duplicates and stores only essential presentation data.
 * 
 * @param {Object} resource - Normalized resource object
 * @param {string} resource.id - Unique identifier
 * @param {'repository'|'question'} resource.type - Type of resource
 * @param {string} resource.title - Title or name
 * @param {string} [resource.description] - Short description
 * @param {string} resource.url - Original URL
 * @param {Object} [resource.metadata] - Relevant metadata (stars, language, tags, etc.)
 * @returns {boolean} True if successfully saved, false if duplicate or failed
 */
export function saveResource(resource) {
  if (!resource || !resource.id || !resource.type) {
    throw new Error('Invalid resource structure provided to saveResource.');
  }

  if (!isStorageAvailable()) {
    throw new Error('Local storage is unavailable or disabled in this browser.');
  }

  const items = getSavedResources();

  // Prevent duplicate bookmarks
  if (items.some(item => item.id === resource.id)) {
    return false;
  }

  const entry = {
    id: String(resource.id),
    type: resource.type,
    title: resource.title || 'Untitled Resource',
    description: resource.description || '',
    url: resource.url || '',
    savedAt: new Date().toISOString(),
    metadata: resource.metadata || {}
  };

  // Add to top of list (most recently saved first)
  items.unshift(entry);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    notifyStorageUpdated('save', entry);
    return true;
  } catch (error) {
    console.error('[Storage] Error saving resource to localStorage:', error);
    throw new Error('Failed to save resource. Browser storage quota may be full.');
  }
}

/**
 * Removes a saved resource from localStorage by its unique ID.
 * 
 * @param {string} resourceId - Unique identifier of resource to remove
 * @returns {boolean} True if removed, false if not found
 */
export function removeResource(resourceId) {
  if (!resourceId || !isStorageAvailable()) return false;

  const items = getSavedResources();
  const index = items.findIndex(item => item.id === resourceId);

  if (index === -1) return false;

  const removedItem = items[index];
  items.splice(index, 1);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    notifyStorageUpdated('remove', removedItem);
    return true;
  } catch (error) {
    console.error('[Storage] Error removing resource from localStorage:', error);
    return false;
  }
}

/**
 * Retrieves saved resources filtered by their type.
 * 
 * @param {'all'|'repository'|'question'} [type='all'] - Resource type filter
 * @returns {Array<Object>} Filtered list of resources
 */
export function getResourcesByType(type = 'all') {
  const all = getSavedResources();
  if (type === 'all') return all;
  return all.filter(item => item.type === type);
}

/**
 * Returns count breakdown of saved resources.
 * 
 * @returns {{total: number, repositories: number, questions: number}}
 */
export function getSavedCounts() {
  const items = getSavedResources();
  let repos = 0;
  let questions = 0;

  for (const item of items) {
    if (item.type === 'repository') repos++;
    else if (item.type === 'question') questions++;
  }

  return {
    total: items.length,
    repositories: repos,
    questions: questions
  };
}

/**
 * Clears all saved resources from localStorage.
 * 
 * @returns {boolean} True if cleared successfully
 */
export function clearAllResources() {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    notifyStorageUpdated('clear', null);
    return true;
  } catch (error) {
    console.error('[Storage] Error clearing saved resources:', error);
    return false;
  }
}

/**
 * Dispatches a custom DOM event so any open view or component can sync immediately.
 * 
 * @param {'save'|'remove'|'clear'|'sync'} action - Action performed
 * @param {Object|null} resource - The resource affected
 */
function notifyStorageUpdated(action, resource) {
  try {
    const event = new CustomEvent('devtrail:storage-updated', {
      detail: { action, resource }
    });
    window.dispatchEvent(event);
  } catch (e) {
    // Graceful fallback for environments without CustomEvent
  }
}

// Cross-tab synchronization via native browser storage event
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      notifyStorageUpdated('sync', null);
    }
  });
}
