/**
 * DevTrail Dashboard Controller
 * Manages the home view, entry points for resource discovery, and quick topic explorations.
 */

import { initHeader } from '../components/header.js';
import { initFooter } from '../components/footer.js';

export function initDashboardPage() {
  initHeader();
  initFooter();

  // Quick search form on hero if present
  const heroSearchForm = document.getElementById('hero-quick-search-form');
  const heroQueryInput = document.getElementById('hero-query-input');
  const heroTargetSelect = document.getElementById('hero-target-select');

  if (heroSearchForm && heroQueryInput && heroTargetSelect) {
    heroSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = encodeURIComponent(heroQueryInput.value.trim());
      const target = heroTargetSelect.value;

      if (target === 'repositories') {
        window.location.href = `repositories.html${query ? `?q=${query}` : ''}`;
      } else {
        window.location.href = `questions.html${query ? `?q=${query}` : ''}`;
      }
    });
  }
}

// Auto-run if loaded as page entry module
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboardPage);
} else {
  initDashboardPage();
}
