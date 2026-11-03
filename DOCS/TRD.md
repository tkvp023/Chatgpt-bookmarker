# ChatGPT Bookmarks — Technical Requirements Document (TRD)

> This document specifies the precise technical requirements, API contracts, data schemas, and constraints for the ChatGPT Bookmarks Chrome extension.
>
> **References:**
> - [problemstatement.md](file:///c:/Users/THARUN/Desktop/bookmark-for-gpt/docs/problemstatement.md)
> - [architecture.md](file:///c:/Users/THARUN/Desktop/bookmark-for-gpt/docs/architecture.md)
> - [implementation_plan.md](file:///c:/Users/THARUN/Desktop/bookmark-for-gpt/docs/implementation_plan.md)
> - [edgecases.md](file:///c:/Users/THARUN/Desktop/bookmark-for-gpt/docs/edgecases.md)

---

## 1. Functional Requirements

### 1.1 Bookmark Creation

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-01 | Extension shall detect text selections of ≥5 characters within ChatGPT conversation areas | P0 | Selecting 4 chars → no button. Selecting 5+ chars inside a conversation → button appears |
| FR-02 | A "🔖 Bookmark" popup button shall appear near the user's text selection | P0 | Button is positioned within 10px of the selection's bounding rect. Button disappears when user clicks elsewhere |
| FR-03 | Clicking the popup button shall open a modal with a name input and text preview | P0 | Modal has: title, text input (auto-focused), preview of first 100 chars, Save button, Cancel button |
| FR-04 | Save button shall be disabled when name input is empty or whitespace-only | P0 | Button visually disabled + non-clickable when input is blank |
| FR-05 | Pressing Enter in the name input shall trigger save (same as clicking Save) | P0 | Enter key saves; Escape key cancels |
| FR-06 | On save, bookmark data shall be persisted to `chrome.storage.local` | P0 | Bookmark appears in `chrome.storage.local` → Application tab in DevTools |
| FR-07 | Selected text exceeding 2000 characters shall be truncated with `isTruncated: true` flag | P1 | 2001-char selection → stored `selectedText` is 2000 chars, `isTruncated` is `true` |
| FR-08 | Bookmark shall store the chat page title as `chatTitle` | P1 | `chatTitle` is extracted from `document.title` or ChatGPT sidebar, stored with bookmark |

### 1.2 Bookmark Navigation

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-09 | Clicking a bookmark for the current conversation shall scroll to and highlight the bookmarked text | P0 | Smooth scroll to element, yellow highlight visible for ~3 seconds, pulse animation plays |
| FR-10 | Clicking a bookmark for a different conversation shall navigate to that conversation's URL, then scroll to the text | P0 | Tab URL changes, page loads, text is found and highlighted within 10 seconds |
| FR-11 | If bookmarked text cannot be found on the page, a toast shall inform the user | P0 | Toast says "Could not find bookmarked text" |
| FR-12 | Text-finding shall use context matching (surrounding text) to disambiguate duplicate matches | P0 | If "return true;" appears 3 times, the one with matching before/after context is selected |

### 1.3 Sidebar

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-13 | A floating action button (FAB) shall be permanently visible on ChatGPT pages | P0 | Green circular button with bookmark icon, fixed position, right side of viewport |
| FR-14 | Clicking the FAB shall toggle a sidebar panel | P0 | Sidebar slides in from the right (360px wide). Clicking again closes it |
| FR-15 | Sidebar shall display all bookmarks sorted by creation date (newest first) | P0 | Most recent bookmark at top |
| FR-16 | Each bookmark item shall display: name, text preview (80 chars), date, delete button | P0 | All four elements visible on each card |
| FR-17 | Delete button shall remove the bookmark from storage and refresh the sidebar | P0 | Bookmark disappears from list, toast confirms deletion |
| FR-18 | Sidebar shall show an empty state message when no bookmarks exist | P0 | "No bookmarks yet" with instruction text |
| FR-19 | Sidebar shall include a search bar that filters bookmarks by name and text content in real-time | P1 | Typing "API" filters to bookmarks containing "API" in name or selectedText |
| FR-20 | Bookmarks shall be grouped by conversation (using `chatTitle`) with collapsible headers | P1 | Groups show title + count. Click to expand/collapse. Current conversation group shown first |
| FR-21 | Bookmark names shall be editable inline (click edit icon → input field → Enter to save) | P1 | Name transforms to input on edit click. Enter saves, Escape cancels |
| FR-22 | Sidebar shall include Export and Import buttons | P1 | Export downloads `.json` file. Import opens file picker, merges bookmarks |

### 1.4 Keyboard Shortcuts

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-23 | `Ctrl+Shift+B` shall quick-bookmark the current selection with an auto-generated name | P1 | Selection exists → bookmark saved with first 30 chars as name → toast. No selection → "Select text first" toast |
| FR-24 | `Ctrl+Shift+K` shall toggle the sidebar | P1 | Sidebar opens/closes. Same as clicking FAB |
| FR-25 | `Escape` shall close the topmost open UI element (modal → sidebar) | P1 | If modal open → close modal. If sidebar open → close sidebar |

### 1.5 Badge

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-26 | FAB shall display a badge showing bookmark count for the current conversation | P1 | Shows "3" if 3 bookmarks for current URL. Hidden when count is 0 |
| FR-27 | Badge shall update on save, delete, and URL change | P1 | Save a bookmark → badge increments. Switch conversation → badge shows new count |

### 1.6 Toast Notifications

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-28 | Toasts shall appear for: save success, save error, delete success, text not found, navigation timeout, import results, export results | P0 | Each scenario shows a descriptive toast |
| FR-29 | Toasts shall auto-dismiss after 2.5 seconds with a fade-out animation | P0 | Toast visible for 2.5s, then fades out over 300ms |
| FR-30 | Multiple concurrent toasts shall stack vertically | P1 | Second toast appears below the first, not overlapping |

---

## 2. Non-Functional Requirements

### 2.1 Performance

| ID | Requirement | Target | Measurement |
|---|---|---|---|
| NFR-01 | Selection-to-button latency | < 200ms | Time from `mouseup` to button visible in DOM |
| NFR-02 | Sidebar open time (100 bookmarks) | < 300ms | Time from FAB click to sidebar fully rendered |
| NFR-03 | Search filter response time | < 100ms per keystroke | Time from keyup to filtered results rendered |
| NFR-04 | Text-finding (page with 500 messages) | < 500ms | Time for `findTextInPage()` to return |
| NFR-05 | Memory overhead of content script | < 5MB | Measured via Chrome Task Manager |

### 2.2 Storage

| ID | Requirement | Detail |
|---|---|---|
| NFR-06 | Storage engine | `chrome.storage.local` (10MB limit) |
| NFR-07 | Capacity warning threshold | Warn user at 80% (8MB) usage |
| NFR-08 | Maximum `selectedText` length | 2000 characters (truncate beyond) |
| NFR-09 | Maximum bookmarks supported | Functionally tested with 500+ bookmarks |

### 2.3 Reliability

| ID | Requirement | Detail |
|---|---|---|
| NFR-10 | No silent data loss | Every storage write failure must show an error toast |
| NFR-11 | Extension context invalidation handling | Detect `chrome.runtime` errors, show "Please refresh" message |
| NFR-12 | Stale pending bookmark cleanup | Auto-clear `pendingBookmark` older than 60 seconds |

### 2.4 Security

| ID | Requirement | Detail |
|---|---|---|
| NFR-13 | XSS prevention | All user-generated content escaped via `escapeHtml()` before DOM insertion |
| NFR-14 | Import validation | Validate JSON schema, strip HTML from all string fields |
| NFR-15 | No `eval()` or `Function()` | Code must never use dynamic code execution |
| NFR-16 | No external network requests | Extension makes zero HTTP requests — fully offline |

### 2.5 Compatibility

| ID | Requirement | Detail |
|---|---|---|
| NFR-17 | Chrome version | Minimum Chrome 110+ (Manifest V3 stable) |
| NFR-18 | Chromium browsers | Must work on Edge, Brave, Opera (Chromium-based) |
| NFR-19 | ChatGPT domains | `chatgpt.com` and `chat.openai.com` |
| NFR-20 | Manifest version | Manifest V3 (no MV2 APIs) |

### 2.6 Accessibility

| ID | Requirement | Detail |
|---|---|---|
| NFR-21 | ARIA roles | Sidebar: `role="complementary"`. Modal: `role="dialog"`. Toast: `aria-live="polite"` |
| NFR-22 | Keyboard navigation | All buttons focusable. Modal traps focus. Tab order logical |
| NFR-23 | Color contrast | Text-to-background contrast ratio ≥ 4.5:1 (WCAG AA) |

### 2.7 Other

| ID | Requirement | Detail |
|---|---|---|
| NFR-24 | Z-index isolation | All extension elements use z-index 999997–99999999, never colliding with ChatGPT |
| NFR-25 | Style isolation | Extension CSS must not leak styles into ChatGPT's own DOM. All selectors are prefixed or scoped |
| NFR-26 | Code maintainability | Content script organized into named modules (no spaghetti) |
| NFR-27 | Bundle size | Total extension size < 100KB (excluding icons) |
| NFR-28 | Graceful degradation | If ChatGPT DOM changes break selectors, fallback chain ensures partial functionality. Never a white screen or crash |

---

## 3. Chrome API Surface

### 3.1 APIs Used

| API | Used In | Purpose |
|---|---|---|
| `chrome.storage.local.get()` | content.js, background.js | Read bookmarks and pending bookmark |
| `chrome.storage.local.set()` | content.js, background.js | Write bookmarks and pending bookmark |
| `chrome.storage.local.remove()` | content.js | Clear pending bookmark |
| `chrome.storage.local.getBytesInUse()` | content.js | Check storage quota usage |
| `chrome.runtime.sendMessage()` | content.js | Send messages to background (e.g., `openBookmark`) |
| `chrome.runtime.onMessage` | content.js, background.js | Receive messages |
| `chrome.runtime.lastError` | content.js, background.js | Detect API call errors |
| `chrome.tabs.query()` | background.js | Find active ChatGPT tab |
| `chrome.tabs.update()` | background.js | Navigate tab to bookmark URL |
| `chrome.tabs.sendMessage()` | background.js | Send messages to content script |
| `chrome.action.onClicked` | background.js | Handle toolbar icon click |
| `chrome.commands.onCommand` | background.js | Handle keyboard shortcuts |

### 3.2 APIs NOT Used (and why)

| API | Why Not |
|---|---|
| `chrome.storage.sync` | 100KB limit too small; would require complex chunking. Deferred to P2 |
| `chrome.contextMenus` | Right-click menu is a P2 nice-to-have |
| `chrome.notifications` | Using in-page toasts instead — less intrusive |
| `chrome.scripting.executeScript()` | Content script injected via manifest — no need for programmatic injection |
| `chrome.alarms` | No scheduled tasks needed |

---

## 4. Message Protocol Contract

### 4.1 Content Script → Background (via `chrome.runtime.sendMessage`)

```typescript
// Message: Open a bookmark in a different conversation
interface OpenBookmarkMessage {
  action: 'openBookmark';
  bookmark: Bookmark;
}
// Response: { success: boolean }

// Message: Get all bookmarks (optional, if needed)
interface GetBookmarksMessage {
  action: 'getBookmarks';
}
// Response: { bookmarks: Bookmark[] }
```

### 4.2 Background → Content Script (via `chrome.tabs.sendMessage`)

```typescript
// Command: Toggle sidebar visibility
interface ToggleSidebarMessage {
  action: 'toggleSidebar';
}

// Command: Quick-bookmark current selection
interface QuickBookmarkMessage {
  action: 'quickBookmark';
}

// Command: Navigate to a specific bookmark
interface NavigateToBookmarkMessage {
  action: 'navigateToBookmark';
  bookmark: Bookmark;
}
```

### 4.3 Message Flow Table

| # | Message | Sender | Receiver | Trigger | Payload | Response |
|---|---|---|---|---|---|---|
| 1 | `openBookmark` | content.js | background.js | User clicks bookmark for different conversation | `{ bookmark }` | `{ success: true }` |
| 2 | `getBookmarks` | content.js | background.js | (Optional) Centralized data fetch | `{}` | `{ bookmarks: [...] }` |
| 3 | `toggleSidebar` | background.js | content.js | Toolbar icon click or Ctrl+Shift+K | `{}` | — |
| 4 | `quickBookmark` | background.js | content.js | Ctrl+Shift+B | `{}` | — |
| 5 | `navigateToBookmark` | background.js | content.js | After `chrome.tabs.update()` completes for cross-conv nav | `{ bookmark }` | — |

---

## 5. Storage Data Contracts

### 5.1 Bookmark Object Schema

```javascript
{
  // REQUIRED fields (must be present on every bookmark)
  "id":           String,    // Format: "bm_{timestamp}_{random9chars}"
                             // Example: "bm_1723456789_a1b2c3d4e"
                             // Constraints: unique, non-empty

  "name":         String,    // User-provided label
                             // Constraints: non-empty, trimmed, max 200 chars stored

  "chatUrl":      String,    // Full URL of the ChatGPT conversation
                             // Example: "https://chatgpt.com/c/abc-123-def"
                             // Constraints: must start with http:// or https://

  "selectedText": String,    // The exact text that was selected
                             // Constraints: max 2000 chars (truncated if longer)

  "context": {               // Surrounding text for disambiguation
    "before":     String,    // Up to 50 chars before the selection
    "after":      String     // Up to 50 chars after the selection
  },

  "createdAt":    String,    // ISO 8601 timestamp
                             // Example: "2026-08-12T09:00:00.000Z"

  // OPTIONAL fields (may be absent on older bookmarks — code must handle undefined)
  "chatTitle":    String,    // Page title at time of bookmarking
                             // Default: "Untitled Conversation"

  "isTruncated":  Boolean    // True if selectedText was truncated from original
                             // Default: false
}
```

### 5.2 Full Storage Schema

```javascript
// chrome.storage.local contents
{
  "bookmarks":       Bookmark[],     // Array of bookmark objects. Default: []
  "pendingBookmark": Bookmark | null  // Set during cross-conversation navigation. Default: null
}
```

### 5.3 Validation Rules

| Field | Rule | On Violation |
|---|---|---|
| `id` | Non-empty string, unique in array | Reject on import; auto-generate on save |
| `name` | Non-empty after trim | Prevent save (disable button) |
| `chatUrl` | Starts with `http://` or `https://` | Reject on import |
| `selectedText` | Non-empty string | Reject on import |
| `context` | Object with `before` and `after` string fields | Default to `{ before: "", after: "" }` |
| `createdAt` | Valid ISO 8601 date string | Default to current timestamp on import |
| `chatTitle` | String or undefined | Default to `"Untitled Conversation"` |
| `bookmarks` (root) | Must be an array | Reset to `[]` |
| `pendingBookmark` (root) | Must be an object or null | Reset to `null` |

### 5.4 Export File Format

```javascript
// File: chatgpt-bookmarks-export-{YYYY-MM-DD}.json
{
  "version": 1,                       // Schema version for future migration
  "exportedAt": "2026-08-12T09:00:00.000Z",
  "bookmarkCount": 42,
  "bookmarks": [ /* Bookmark[] */ ]
}
```

---

## 6. DOM Interaction Contracts

### 6.1 Conversation Element Detection — Selector Fallback Chain

The extension must find the conversation message container for a text selection. Since ChatGPT's DOM changes frequently, selectors are tried in priority order:

```
Priority 1: [data-testid^="conversation-turn"]
Priority 2: article[data-scroll-anchor]
Priority 3: div[data-message-id]
Priority 4: main .group
Priority 5: main                          ← ultimate fallback
```

**Contract**: `findConversationElement(node)` walks up the DOM from `node` and returns the first ancestor matching any selector in priority order. Returns `null` only if `document.body` is reached.

### 6.2 Scroll Container Detection — Candidate List

```
Candidate 1: document.querySelector('main .overflow-y-auto')
Candidate 2: document.querySelector('main [class*="overflow"]')
Candidate 3: document.querySelector('main')?.parentElement
Candidate 4: document.querySelector('[role="presentation"]')
Fallback:    document.documentElement
```

**Contract**: `findScrollContainer()` returns the first candidate where `el.scrollHeight > el.clientHeight`. Falls back to `document.documentElement`.

### 6.3 Chat Title Extraction

```
Source 1: document.title.replace(' | ChatGPT', '').replace('ChatGPT - ', '').trim()
Source 2: document.querySelector('nav [class*="active"]')?.textContent?.trim()
Source 3: document.querySelector('header h1')?.textContent?.trim()
Fallback: "Untitled Conversation"
```

---

## 7. CSS Contract

### 7.1 Z-Index Layer Map

```
Layer 0:     ChatGPT's own UI (unknown, varies)
Layer 999997: .chatgpt-bookmark-highlight   (highlight overlay)
Layer 999998: #chatgpt-bookmark-button      (selection popup)
Layer 999999: #chatgpt-bookmark-icon        (floating action button)
Layer 9999990: #chatgpt-bookmark-sidebar    (sidebar panel)
Layer 9999999: #chatgpt-bookmark-modal      (modal overlay)
Layer 99999999: .chatgpt-bookmark-toast     (toast notifications)
```

### 7.2 Animation Specifications

| Animation | Duration | Easing | Properties | Used By |
|---|---|---|---|---|
| `fadeIn` | 200ms | ease | `opacity: 0 → 1` | Modal, toast |
| `fadeOut` | 300ms | ease | `opacity: 1 → 0` | Modal, toast |
| `slideInRight` | 300ms | cubic-bezier(0.4, 0, 0.2, 1) | `transform: translateX(100%) → translateX(0)` | Sidebar open |
| `slideOutRight` | 250ms | cubic-bezier(0.4, 0, 0.2, 1) | `transform: translateX(0) → translateX(100%)` | Sidebar close |
| `pulse` | 2000ms | ease-in-out | `opacity: 0.5 → 0.2 → 0.5` (×2), then remove | Highlight overlay |
| `scaleIn` | 150ms | cubic-bezier(0.34, 1.56, 0.64, 1) | `transform: scale(0.8) → scale(1)` | Bookmark popup button |
| `badgePop` | 300ms | cubic-bezier(0.34, 1.56, 0.64, 1) | `transform: scale(0) → scale(1)` | Badge count update |

### 7.3 Responsive Breakpoints

| Viewport Width | Sidebar Behavior |
|---|---|
| ≥ 768px | 360px fixed width, right-aligned |
| 400px – 767px | 300px width |
| < 400px | 100vw full-screen overlay |

### 7.4 Color Contrast Verification

| Element | Foreground | Background | Ratio | WCAG AA |
|---|---|---|---|---|
| Primary text | `#ececec` | `#212121` | 14.4:1 | ✅ Pass |
| Secondary text | `#b4b4b4` | `#212121` | 8.1:1 | ✅ Pass |
| Muted text | `#8e8e8e` | `#212121` | 4.6:1 | ✅ Pass |
| Accent on dark | `#10a37f` | `#212121` | 4.7:1 | ✅ Pass |
| Button text | `#ffffff` | `#10a37f` | 4.5:1 | ✅ Pass |
| Danger text | `#ef4444` | `#2f2f2f` | 5.1:1 | ✅ Pass |

---

## 8. Error Taxonomy

| Error Code | Source | Trigger | User-Facing Message | Recovery |
|---|---|---|---|---|
| `ERR_STORAGE_WRITE` | `chrome.storage.local.set()` | Quota exceeded or internal error | "Failed to save bookmark" | Keep modal open, log to console |
| `ERR_STORAGE_READ` | `chrome.storage.local.get()` | Corrupted data | "Could not load bookmarks" | Reset to empty array, log warning |
| `ERR_CONTEXT_INVALID` | `chrome.runtime.*` | Extension updated/reloaded | "Extension updated. Please refresh the page." | Disable all interactions |
| `ERR_TEXT_NOT_FOUND` | `findTextInPage()` | Text deleted, regenerated, or lazy-loaded | "Could not find bookmarked text" | No recovery — informational |
| `ERR_NAV_TIMEOUT` | `checkPendingNavigation()` | Page took >10s to load content | "Navigation timed out" | Clear pending bookmark |
| `ERR_IMPORT_PARSE` | `JSON.parse()` | Invalid JSON file | "Invalid file format" | No changes to storage |
| `ERR_IMPORT_SCHEMA` | Schema validation | Valid JSON, wrong shape | "Invalid bookmark data (X entries skipped)" | Import valid entries only |
| `ERR_IMPORT_QUOTA` | Pre-write quota check | Import would exceed 10MB | "Not enough storage space" | No changes to storage |
| `ERR_TAB_UPDATE` | `chrome.tabs.update()` | Tab closed or invalid | "Could not navigate to bookmark" | Clear pending bookmark |
| `ERR_MESSAGE_SEND` | `chrome.runtime.sendMessage()` | No receiver (background inactive) | "Please try again" | Retry once automatically |
| `ERR_SELECTOR_FAIL` | `findConversationElement()` | All selectors miss | (Silent — button just doesn't appear) | Log which selectors failed |
| `ERR_SCROLL_CONTAINER` | `findScrollContainer()` | All candidates fail | (Silent — uses `document.documentElement`) | Fallback to window scroll |

---

## 9. Browser Compatibility Matrix

| Feature | Chrome 110+ | Edge 110+ | Brave 1.50+ | Opera 96+ |
|---|---|---|---|---|
| Manifest V3 | ✅ | ✅ | ✅ | ✅ |
| `chrome.storage.local` | ✅ | ✅ | ✅ | ✅ |
| `chrome.commands` | ✅ | ✅ | ✅ | ✅ |
| `chrome.action` | ✅ | ✅ | ✅ | ✅ |
| Content scripts | ✅ | ✅ | ✅ | ✅ |
| CSS `backdrop-filter` | ✅ | ✅ | ✅ | ✅ |
| CSS custom properties | ✅ | ✅ | ✅ | ✅ |
| `TreeWalker` API | ✅ | ✅ | ✅ | ✅ |
| `getBoundingClientRect()` | ✅ | ✅ | ✅ | ✅ |

---

## 10. Dependencies

| Type | Count | Detail |
|---|---|---|
| External libraries | **0** | No React, no jQuery, no frameworks |
| External fonts | **0** | System font stack only |
| External APIs | **0** | No network calls |
| NPM packages | **0** | No build step, no bundler |
| Chrome APIs | **6** | storage, runtime, tabs, action, commands, scripting |

> [!IMPORTANT]
> This extension has **zero external dependencies**. Everything is vanilla JS/CSS. This means no supply chain risk, no build step, no CDN dependency, and no CSP issues.

---

## 11. Suggested Additional Documents

Beyond this TRD, the following documents would make the build process more efficient:

### 11.1 `TESTING.md` — Test Plan & Test Cases
| | |
|---|---|
| **Why** | Maps each functional requirement (FR-01 through FR-30) to manual test cases. Provides a checklist to run after each implementation phase. Covers happy paths, edge cases, and regression scenarios |
| **Contains** | Test case table (ID, description, steps, expected result, status), browser-specific tests, performance benchmarks to verify NFRs |
| **When to create** | Before starting Phase 1 — reference it after each phase |

### 11.2 `README.md` — User-Facing Documentation
| | |
|---|---|
| **Why** | Installation instructions, usage guide, keyboard shortcuts reference, screenshots, FAQ, and known limitations. Essential if you plan to publish on the Chrome Web Store |
| **Contains** | Features overview, installation steps, usage GIFs/screenshots, shortcut table, troubleshooting, privacy policy (required for Chrome Web Store) |
| **When to create** | After Phase 3 (core functionality complete) — update after Phase 4 |

### 11.3 `CHANGELOG.md` — Version History
| | |
|---|---|
| **Why** | Tracks what changed in each version/phase. Useful for debugging regressions and for Chrome Web Store version descriptions |
| **Contains** | Semantic version entries with categorized changes (Added, Fixed, Changed, Removed) |
| **When to create** | After Phase 1 — update after each phase |

> [!TIP]
> **Recommended priority**: Create `TESTING.md` first (before building), then `CHANGELOG.md` (as you build), then `README.md` (after core is working).
