/**
 * DevTrail Formatters Utility Module
 * Provides number, date, and text formatting for UI components.
 */

/**
 * Formats large numbers into human-readable compact strings.
 * Example: 1200 -> "1.2k", 45000 -> "45k", 1000000 -> "1M"
 * 
 * @param {number} num - The number to format
 * @returns {string} Formatted number
 */
export function formatCompactNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return String(num);
}

/**
 * Formats a timestamp (Unix seconds or ISO string) into a friendly date string.
 * Example: "Nov 21, 2026"
 * 
 * @param {number|string|Date} dateInput - Epoch seconds, ISO string, or Date object
 * @returns {string} Friendly date string
 */
export function formatDate(dateInput) {
  if (!dateInput) return '';

  let date;
  if (typeof dateInput === 'number') {
    // Check if timestamp is in seconds (Stack Exchange epoch format) or milliseconds
    date = new Date(dateInput < 10000000000 ? dateInput * 1000 : dateInput);
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

/**
 * Truncates a string to a maximum length without cutting words in half.
 * 
 * @param {string} str - String to truncate
 * @param {number} maxLen - Maximum character length
 * @returns {string} Truncated string with ellipsis
 */
export function truncate(str, maxLen = 120) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  const sub = str.slice(0, maxLen);
  const lastSpace = sub.lastIndexOf(' ');
  return (lastSpace > 0 ? sub.slice(0, lastSpace) : sub) + '...';
}
