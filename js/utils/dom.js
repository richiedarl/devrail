/**
 * DevTrail DOM Utility Module
 * Provides safe DOM manipulation methods, element creation, and entity decoding.
 * Prevents XSS vulnerabilities by strictly using DOM properties (textContent) instead of innerHTML.
 */

/**
 * Creates a DOM element with specified attributes, classes, and text content.
 * 
 * @param {string} tag - HTML tag name (e.g. 'div', 'span', 'a')
 * @param {Object} [options={}] - Options object
 * @param {string|string[]} [options.className] - CSS class or array of classes
 * @param {Object} [options.attrs] - Key-value pair of HTML attributes (e.g. { href, target, id })
 * @param {string} [options.text] - Safe plain text content (set via textContent)
 * @param {HTMLElement|HTMLElement[]} [options.children] - Child element or array of child elements
 * @param {Object} [options.events] - Event listeners (e.g. { click: fn })
 * @returns {HTMLElement} The created DOM element
 */
export function createElement(tag, options = {}) {
  const el = document.createElement(tag);

  // Set classes
  if (options.className) {
    if (Array.isArray(options.className)) {
      el.classList.add(...options.className.filter(Boolean));
    } else if (typeof options.className === 'string') {
      const classes = options.className.split(' ').map(c => c.trim()).filter(Boolean);
      if (classes.length > 0) {
        el.classList.add(...classes);
      }
    }
  }

  // Set attributes
  if (options.attrs) {
    for (const [key, value] of Object.entries(options.attrs)) {
      if (value !== undefined && value !== null) {
        el.setAttribute(key, String(value));
      }
    }
  }

  // Set safe text content
  if (options.text !== undefined && options.text !== null) {
    el.textContent = String(options.text);
  }

  // Attach child elements
  if (options.children) {
    const children = Array.isArray(options.children) ? options.children : [options.children];
    for (const child of children) {
      if (child instanceof Node) {
        el.appendChild(child);
      }
    }
  }

  // Attach event listeners
  if (options.events) {
    for (const [event, handler] of Object.entries(options.events)) {
      if (typeof handler === 'function') {
        el.addEventListener(event, handler);
      }
    }
  }

  return el;
}

/**
 * Safely decodes HTML entities (e.g. &quot;, &#39;, &lt;, &gt;, &amp;)
 * into plain text using native browser DOMParser.
 * Does NOT execute scripts or insert anything into the active document.
 * 
 * @param {string} rawString - String containing HTML entities
 * @returns {string} Clean plain text representation
 */
export function decodeHtmlEntities(rawString) {
  if (!rawString) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawString, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Safely clears all children from a DOM element.
 * 
 * @param {HTMLElement} element - Target container element
 */
export function clearElement(element) {
  if (!element) return;
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Safely creates an inline SVG element from an SVG string.
 * Uses DOMParser to ensure safe creation without using innerHTML on target container.
 * 
 * @param {string} svgString - Valid SVG markup
 * @returns {SVGElement|null} The parsed SVG element
 */
export function createSvgFromString(svgString) {
  if (!svgString) return null;
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (svg) {
    svg.setAttribute('aria-hidden', 'true');
    return document.importNode(svg, true);
  }
  return null;
}
