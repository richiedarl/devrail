# DevTrail — Developer Resource Discovery

A focused web application designed to help software engineers discover open-source code repositories and programming solutions in a clean, unified workspace.

Built as an individual final project for **WDD 330: Web Frontend Development**.

---

## 1. Problem DevTrail Addresses

When developers encounter a technical problem, start a new project, or evaluate open-source tooling, their workflow often involves jumping between disconnected browser tabs across GitHub and Stack Overflow:
- **GitHub** is great for discovering complete implementations, starter libraries, and active open-source projects, but searching through repositories often produces cluttered results with conflicting metrics.
- **Stack Overflow** provides targeted answers to specific technical roadblocks and edge cases, but finding accepted solutions without wading through redundant discussions can be cumbersome.

**DevTrail** bridges this gap by unifying repository discovery and community question discovery into a single interface. It provides responsive keyword searching, topic tag filtering, community health metrics, and private client-side bookmarking without tracking, ads, or heavy framework dependencies.

---

## 2. Main Features

- **Dashboard**: Central entry point with quick search routing to either GitHub repositories or Stack Overflow questions.
- **GitHub Repository Discovery (`repositories.html`)**:
  - Keyword search through public repositories via GitHub REST API v3.
  - Language filtering (JavaScript, TypeScript, Python, HTML, CSS, Rust, Go, Java, C++, PHP, Ruby, Kotlin, Swift).
  - Sorting by highest star count or most recently updated.
  - Pagination controls allowing navigation across deep search result sets.
  - Repository health indicators (stars, forks, programming language, author avatar).
  - One-click bookmarking to save repositories locally.
  - Direct links to original GitHub repositories (opening safely in new tabs).
- **Stack Overflow Question Discovery (`questions.html`)**:
  - Technical question search via Stack Exchange API v2.3 advanced search.
  - Topic tag filtering (`javascript`, `typescript`, `python`, `reactjs`, `dom`, `async-await`, `node.js`, etc.).
  - Sorting by relevance, vote score, recent activity, and creation date.
  - Pagination controls across question result sets.
  - Answered status badges, vote tallies, answer counts, and asked timestamps.
  - Safe HTML entity decoding for question titles without XSS risks.
  - Daily API quota balance monitoring.
  - One-click bookmarking to save questions locally.
- **Saved Resources Library (`saved.html`)**:
  - Private collection of bookmarked repositories and questions persisted via `localStorage`.
  - Category filtering tabs (**All**, **Repositories**, **Questions**) with live counter badges.
  - Individual item removal with animated transitions.
  - "Clear All" action with user confirmation.
  - Informative empty states guiding users back to discovery when no bookmarks exist.
  - Real-time cross-tab synchronization using native browser `storage` events.
- **Accessible Toast Notifications**:
  - Visual and screen-reader status alerts (`role="status"`, `aria-live="polite"`) when items are saved or removed.
  - Positioned non-obstructively with auto-dismissal.
- **Responsive & Accessible Design**:
  - Tested and operational on mobile (375px), tablet, and desktop viewports.
  - Mobile hamburger navigation drawer with keyboard support (`Escape` to close).
  - Skip-to-content landmark links and accessible focus-visible rings throughout.

---

## 3. Technologies Used

- **HTML5**: Semantic elements (`<header>`, `<main>`, `<section>`, `<article>`, `<nav>`, `<footer>`), ARIA attributes, and accessible labels.
- **Custom CSS3**:
  - CSS Custom Properties (design tokens for Navy `#0F172A` and Mint `#0D9488` color palette).
  - CSS Grid and Flexbox responsive layouts.
  - CSS Keyframe Animations (`@keyframes spin`, `@keyframes shimmer`, `@keyframes cardFadeIn`, `@keyframes toastSlideIn`).
- **Vanilla JavaScript (ES2022)**:
  - Native JavaScript ES Modules (`import` / `export`) without bundlers or compilers.
  - Modern `async` / `await` and `fetch` API for asynchronous HTTP networking.
  - Safe DOM generation via `document.createElement` and `element.textContent` to prevent script injection.
  - Native browser `localStorage` and `StorageEvent` for persistence and multi-tab synchronization.

*No external libraries, frontend frameworks (React, Vue, Angular, jQuery), or CSS frameworks (Bootstrap, Tailwind) are used.*

---

## 4. Third-Party APIs Used

### 1. GitHub REST API v3
- **Endpoint**: `https://api.github.com/search/repositories`
- **Parameters**: `q`, `sort`, `order`, `page`, `per_page`
- **Rate Limits**: 10 unauthenticated search requests per minute.
- **Integration Features**: Inspects response headers (`x-ratelimit-remaining`, `x-ratelimit-reset`) to display remaining requests and provide clear cooldown messages when limits are approached.

### 2. Stack Exchange API v2.3
- **Endpoint**: `https://api.stackexchange.com/2.3/search/advanced`
- **Parameters**: `site=stackoverflow`, `q`, `tagged`, `sort`, `order`, `page`, `pagesize`, `filter=default`
- **Rate Limits**: 300 requests per day for unauthenticated IP addresses.
- **Integration Features**: Tracks `quota_remaining` in real time, respects `backoff` throttling directives, and decodes HTML entities into plain text safely.

---

## 5. How to Run DevTrail Locally

Because DevTrail uses native JavaScript ES modules (`type="module"`), the browser enforces Cross-Origin Resource Sharing (CORS) rules that prevent modules from running directly over the `file:///` protocol. The application must be served over a local HTTP server.

### Option 1: Python (Recommended, Pre-installed)
From your terminal in the project root directory:
```bash
# Navigate to the project directory
cd devtrail

# Start Python's built-in HTTP server on port 3000
python -m http.server 3000
```
Open your browser and navigate to:
**`http://localhost:3000`**

### Option 2: Node.js `npx serve`
```bash
cd devtrail
npx serve . -p 3000
```
Open **`http://localhost:3000`** in your browser.

### Option 3: VS Code Live Server Extension
1. Open the `devtrail` folder in Visual Studio Code.
2. Right-click `index.html` in the file explorer.
3. Select **"Open with Live Server"**.

---

## 6. How Saved Resources Work & Storage Limitations

### Architecture
- Bookmarked resources are serialized to JSON and stored in browser `localStorage` under the key:
  `devtrail_saved_resources`
- Rather than persisting large API payloads, DevTrail stores a lean, normalized resource object (~300 bytes):
  ```json
  {
    "id": "repo-10270250",
    "type": "repository",
    "title": "react",
    "description": "The library for web and native user interfaces.",
    "url": "https://github.com/facebook/react",
    "savedAt": "2026-11-22T14:30:00.000Z",
    "metadata": {
      "owner": "facebook",
      "avatarUrl": "https://avatars.githubusercontent.com/u/69631?v=4",
      "language": "JavaScript",
      "stars": 230450,
      "forks": 46210
    }
  }
  ```
- **Cross-Tab Synchronization**: When a resource is saved or removed in one tab, a native `storage` event fires on other open tabs, immediately updating their card bookmark states and category badges without requiring a manual refresh.

### Limitations
- **Local Origin Scope**: Saved resources are bound to the specific browser and origin domain. Opening DevTrail in a different browser, on a different device, or in Private/Incognito browsing mode will not share bookmarks.
- **Browser Storage Quota**: Browser `localStorage` allows approximately 5 MB of text storage per origin. Because DevTrail normalizes data to ~300 bytes per bookmark, the storage can accommodate roughly 15,000 saved items before reaching browser quotas.
- **Corrupted Data Resilience**: If stored data becomes corrupted or is modified externally, `storage.js` catches parsing exceptions, resets the storage array safely, and prevents runtime crashes.

---

## 7. Project Folder Structure

```
devtrail/
├── index.html                   # Dashboard & application entry point
├── repositories.html            # GitHub repository discovery interface
├── questions.html               # Stack Overflow question discovery interface
├── saved.html                   # Saved resources library view
├── vercel.json                  # Vercel deployment configuration
├── README.md                    # Project documentation
├── assets/
│   ├── icons/                   # Modular SVG vector icons
│   │   ├── alert-circle.svg
│   │   ├── bookmark.svg
│   │   ├── check.svg
│   │   ├── comment.svg
│   │   ├── external-link.svg
│   │   ├── fork.svg
│   │   ├── github.svg
│   │   ├── logo.svg
│   │   ├── search.svg
│   │   ├── stack-overflow.svg
│   │   ├── star.svg
│   │   └── tag.svg
│   └── images/
│       └── favicon.svg          # Application browser favicon
├── css/
│   ├── base.css                 # CSS reset, accessibility utilities, typography
│   ├── components.css           # Cards, buttons, forms, badges, toasts, skeletons
│   ├── layout.css               # Header, navigation, containers, footer, mobile drawer
│   ├── styles.css               # Main stylesheet aggregator (@import)
│   └── variables.css            # Design tokens (colors, spacing, shadows, radii)
└── js/
    ├── components/
    │   ├── card.js              # Safe DOM card builders (repos & questions)
    │   ├── footer.js            # Shared site footer component
    │   ├── header.js            # Shared navigation header & mobile drawer component
    │   ├── state-view.js        # Skeleton loading, empty, and error state views
    │   └── toast.js             # Accessible toast notification component
    ├── modules/
    │   ├── dashboard-page.js    # Controller for index.html
    │   ├── question-page.js     # Controller for questions.html
    │   ├── repo-page.js         # Controller for repositories.html
    │   └── saved-page.js        # Controller for saved.html
    ├── services/
    │   ├── github.js            # GitHub REST API service & rate limit handling
    │   ├── stackexchange.js     # Stack Exchange API service & quota handling
    │   └── storage.js           # LocalStorage service & cross-tab synchronization
    └── utils/
        ├── dom.js               # Safe DOM manipulation & HTML entity decoding
        └── formatters.js        # Compact numbers (1.2k), date formatting, text truncation
```

---

## 8. Deployment Information (Vercel)

DevTrail is prepared for static deployment on **Vercel**:
- All HTML entry points reside in the project root.
- All stylesheet, script, and icon references use relative paths compatible with any static host.
- A `vercel.json` configuration is included to cache static assets and serve pages without build steps.
- Zero private secrets or API keys are exposed.
