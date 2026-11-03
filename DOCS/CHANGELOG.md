# Changelog

All notable changes to the ChatGPT Bookmarks extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planning & Documentation
- Created problem statement document ([problemstatement.md](file:///c:/Users/THARUN/Desktop/bookmark-for-gpt/docs/problemstatement.md))
- Created architecture document ([architecture.md](file:///c:/Users/THARUN/Desktop/bookmark-for-gpt/docs/architecture.md))
- Created 5-phase implementation plan ([implementation_plan.md](file:///c:/Users/THARUN/Desktop/bookmark-for-gpt/docs/implementation_plan.md))
- Created edge cases catalog — 43 scenarios ([edgecases.md](file:///c:/Users/THARUN/Desktop/bookmark-for-gpt/docs/edgecases.md))
- Created technical requirements document ([TRD.md](file:///c:/Users/THARUN/Desktop/bookmark-for-gpt/docs/TRD.md))
- Created test plan — 92 test cases ([TESTING.md](file:///c:/Users/THARUN/Desktop/bookmark-for-gpt/docs/TESTING.md))
- Created README ([README.md](file:///c:/Users/THARUN/Desktop/bookmark-for-gpt/docs/README.md))

---

## [1.0.0] — TBD

> Full rebuild of the ChatGPT Bookmarks extension.

### Phase 1 — Foundation
_Status: Not started_

#### Added
- [ ] `manifest.json` — Updated with keyboard shortcut commands (`Ctrl+Shift+B`, `Ctrl+Shift+K`)
- [ ] `background.js` — Service worker with message handlers (`openBookmark`, `toggleSidebar`, `quickBookmark`)
- [ ] `background.js` — Toolbar icon click handler
- [ ] `styles.css` — CSS design tokens (custom properties for colors, spacing, typography, shadows)
- [ ] `styles.css` — Floating action button styles
- [ ] `styles.css` — Toast notification styles and animations
- [ ] `styles.css` — Highlight overlay styles and pulse animation
- [ ] `styles.css` — Base `@keyframes` animations (`fadeIn`, `fadeOut`, `slideInRight`, `slideOutRight`, `pulse`)

---

### Phase 2 — Core Content Script
_Status: Not started_

#### Added
- [ ] `content.js` — SPAObserver module (history API patching, popstate listener, URL polling)
- [ ] `content.js` — StorageManager module (CRUD operations, in-memory cache, pending bookmark management)
- [ ] `content.js` — SelectionManager module (debounced mouseup, resilient DOM selectors, scroll container detection)
- [ ] `content.js` — UIManager module (FAB, bookmark button, modal, toast, sidebar shell)
- [ ] `content.js` — Message listener for background script commands
- [ ] `styles.css` — Bookmark popup button styles
- [ ] `styles.css` — Modal overlay, content, input, preview, and button styles
- [ ] `styles.css` — Sidebar panel styles (header, content area, empty/loading states)
- [ ] `styles.css` — Bookmark item card styles

#### Fixed (vs. original)
- [ ] Added SPA navigation awareness (original had none)
- [ ] Added debounce on text selection handler (original fired on every mouseup)
- [ ] Fixed scroll container detection (original used `window` instead of ChatGPT's nested div)

---

### Phase 3 — Navigation & Polish
_Status: Not started_

#### Added
- [ ] `content.js` — BookmarkNavigator module (findTextInPage, scrollToElement, highlightElement)
- [ ] `content.js` — Cross-conversation navigation flow with pending bookmark
- [ ] `content.js` — Sidebar bookmark rendering with click-to-navigate
- [ ] `styles.css` — Sidebar slide-in/slide-out animations
- [ ] `styles.css` — Bookmark item hover effects and delete button visibility
- [ ] `styles.css` — Modal backdrop blur effect
- [ ] `styles.css` — Custom scrollbar for sidebar
- [ ] `styles.css` — Input focus styles with accent border

#### Fixed (vs. original)
- [ ] Highlight overlay now uses `position: fixed` (original used absolute with wrong scroll offsets)
- [ ] Scroll-to uses ChatGPT's scroll container (original used `window.scrollTo`)
- [ ] Context matching prevents false-positive text matches

---

### Phase 4 — Enhanced Features
_Status: Not started_

#### Added
- [ ] Search/filter bar in sidebar (real-time, case-insensitive, by name + text content)
- [ ] Conversation grouping with collapsible headers and bookmark count
- [ ] Inline bookmark name editing (click edit → input → Enter to save)
- [ ] `Ctrl+Shift+B` keyboard shortcut for quick bookmarking
- [ ] `Ctrl+Shift+K` keyboard shortcut for sidebar toggle
- [ ] `Escape` key to close modal/sidebar
- [ ] Export bookmarks to JSON file
- [ ] Import bookmarks from JSON file (merge strategy, schema validation)
- [ ] Badge count on FAB showing bookmarks for current conversation
- [ ] `chatTitle` field extracted and stored with each bookmark

---

### Phase 5 — Hardening & QA
_Status: Not started_

#### Added
- [ ] Error handling for all Chrome API calls (storage, runtime, tabs)
- [ ] Extension context invalidation detection with "Please refresh" message
- [ ] Storage quota monitoring (warning at 80%)
- [ ] Stale pending bookmark auto-cleanup (>60 seconds)
- [ ] Import file size validation
- [ ] ARIA roles and labels for accessibility

#### Fixed
- [ ] DocumentFragment used for batch sidebar rendering (performance)
- [ ] TreeWalker scoped to scroll container (performance)
- [ ] All animations use `transform`/`opacity` only (GPU-accelerated)

#### Tested
- [ ] 92 manual test cases passed
- [ ] Tested on Chrome, Edge, and Brave
- [ ] Tested with 100+ bookmarks
- [ ] All 43 documented edge cases addressed

---

## [0.1.0] — Pre-rebuild (Original)

> Original incomplete implementation. Preserved in documentation only.

### What Existed
- `manifest.json` — Complete, Manifest V3
- `content.js` — 427 lines with core logic
- `icons/` — icon128.png and icon48.png

### What Was Missing
- `background.js` — Empty file (0 bytes)
- `styles.css` — Empty file (0 bytes)

### Known Bugs
- No SPA navigation awareness
- Wrong scroll container (`window` instead of nested `<div>`)
- Highlight positioning broken (absolute + window.scrollY)
- No debounce on selection handler
- Cross-conversation navigation non-functional (empty background.js)
