# ChatGPT Bookmarks — Problem Statement

## 1. Vision

ChatGPT conversations can grow extremely long — hundreds of messages deep. Finding a specific answer, code snippet, or insight you saw earlier means endless scrolling. **ChatGPT Bookmarks** solves this by letting you bookmark specific text selections within any ChatGPT conversation and jump back to them instantly, across sessions and across conversations.

---

## 2. Core Functionality

### 2.1 Text Selection → Bookmark Creation
- User selects text (≥5 characters) inside a ChatGPT conversation.
- A floating **"🔖 Bookmark"** button appears near the selection.
- Clicking it opens a **modal dialog** where the user can:
  - Enter a custom name for the bookmark.
  - See a preview of the selected text.
  - Save or cancel.

### 2.2 Bookmark Data Model
Each bookmark stores:
| Field | Description |
|---|---|
| `id` | Unique identifier (`bm_` + timestamp + random string) |
| `name` | User-provided label |
| `chatUrl` | Full URL of the ChatGPT conversation |
| `selectedText` | The exact text that was selected |
| `context` | Surrounding text (50 chars before & after) for precise re-location |
| `createdAt` | ISO timestamp |

### 2.3 Sidebar Panel
- A **floating icon** (green circle with bookmark SVG) is fixed on the right side of the page.
- Clicking it toggles a **sidebar** that lists all saved bookmarks, sorted newest-first.
- Each bookmark item shows:
  - Name (bold)
  - Text preview (first 80 characters)
  - Date created
  - Delete button (🗑️)

### 2.4 Navigate to Bookmark
- **Same conversation**: Clicking a bookmark scrolls smoothly to the text and highlights it in yellow with a pulse animation.
- **Different conversation**: Opens the correct chat URL, waits for content to load, then scrolls and highlights.
- Text is located using a **TreeWalker** that searches all text nodes, with **context matching** (surrounding text) to avoid false positives.

### 2.5 Delete Bookmarks
- Each bookmark has a delete button in the sidebar.
- Deletion removes from `chrome.storage.local` and refreshes the sidebar.

### 2.6 Toast Notifications
- Confirmation messages for: bookmark saved, bookmark deleted, text not found, save errors.

---

## 3. What Was Built (Original State)

| File | Status | Notes |
|---|---|---|
| `manifest.json` | ✅ Complete | Manifest V3, correct permissions, targets `chatgpt.com` + `chat.openai.com` |
| `content.js` | ✅ Written | ~427 lines, all core logic present |
| `background.js` | ❌ Empty | No code at all |
| `styles.css` | ❌ Empty | No styles at all |
| `icons/` | ✅ Present | `icon128.png` and `icon48.png` exist |

---

## 4. What Is Broken / Missing

### 4.1 `background.js` — Completely Empty

> [!CAUTION]
> The background script has zero code. Cross-conversation navigation is completely non-functional.

- **No `openBookmark` message handler**: When a user clicks a bookmark from a different conversation, `content.js` sends `{ action: 'openBookmark', bookmark }` to the background script — but nothing receives it.
- **No tab management**: Should open the bookmark's chat URL in the current tab (or a new tab) and store the bookmark as `pendingBookmark` so the content script can navigate to it after page load.
- **No extension toolbar icon click handler**: The `action` field in manifest suggests the toolbar icon should do something (e.g., toggle sidebar), but there's no handler.

### 4.2 `styles.css` — Completely Empty

> [!CAUTION]
> All UI components besides the floating icon (which has inline fallback styles) are completely unstyled and will render as raw HTML.

The content script references these CSS classes/IDs, but **none of them are defined**:

| Selector | Purpose |
|---|---|
| `#chatgpt-bookmark-icon` | Floating icon (has inline fallback) |
| `#chatgpt-bookmark-button` | "🔖 Bookmark" popup button on text selection |
| `#chatgpt-bookmark-modal` | Full-screen modal overlay |
| `.bookmark-modal-content` | Modal inner container |
| `#bookmark-name-input` | Text input inside modal |
| `.bookmark-modal-preview` | Selected text preview area |
| `.bookmark-modal-buttons` | Save/Cancel button row |
| `#bookmark-save-btn` / `#bookmark-cancel-btn` | Action buttons |
| `#chatgpt-bookmark-sidebar` | Slide-out sidebar panel |
| `.sidebar-header` | Sidebar header with title + close button |
| `.sidebar-content` | Scrollable bookmark list area |
| `.sidebar-loading` / `.sidebar-empty` | Loading and empty states |
| `.bookmark-item` | Individual bookmark card |
| `.bookmark-item-header` | Name + delete button row |
| `.bookmark-name` / `.bookmark-preview` / `.bookmark-date` | Bookmark card elements |
| `.bookmark-delete-btn` | Delete button |
| `.chatgpt-bookmark-toast` / `.show` | Toast notification + animation |
| `.chatgpt-bookmark-highlight` / `.pulse` | Overlay highlight + animation |

### 4.3 Content Script Bugs

> [!WARNING]
> These issues will cause the extension to malfunction even once background.js and styles.css are completed.

1. **No SPA awareness**: ChatGPT is a React SPA. When the user navigates between chats, the page doesn't fully reload — the content script won't re-initialize, and URL-dependent logic (like `checkPendingNavigation`) won't re-trigger.
2. **Wrong scroll container**: `window.scrollY` / `window.scrollX` are used for positioning, but ChatGPT's scrollable container is a **nested `<div>`**, not the `window`. Bookmark buttons and highlights will appear at wrong positions.
3. **`findConversationElement` is too broad**: Matching on `main, [role="main"], .conversation, article` may break as ChatGPT's DOM evolves.
4. **No debounce on selection**: `mouseup` fires on every click, calling `handleTextSelection` unnecessarily.
5. **Highlight overlay is absolute-positioned but uses `window.scrollY`**: If the scroll container is not the window, the highlight won't align with the target element.

---

## 5. Additional Features & Improvements Needed

### 5.1 Must Have (P0)
- [ ] **Working `background.js`** with:
  - `openBookmark` message handler (open URL + store pending bookmark)
  - Extension toolbar icon click handler (send toggle-sidebar message to content script)
- [ ] **Complete `styles.css`** — polished dark-theme styling that feels native to ChatGPT
- [ ] **SPA-aware navigation** — use a URL change listener / `MutationObserver` to detect conversation switches
- [ ] **Fix scroll container detection** — find ChatGPT's actual scrollable container instead of using `window`
- [ ] **Fix highlight positioning** — use the correct scroll container offsets

### 5.2 Should Have (P1)
- [ ] **Search / filter** bookmarks in the sidebar (by name or text content)
- [ ] **Group bookmarks by conversation** in the sidebar (collapsible groups showing the chat title)
- [ ] **Keyboard shortcut** (e.g., `Ctrl+Shift+B`) to bookmark the current selection with an auto-generated name
- [ ] **Edit bookmark name** after creation (inline edit in sidebar)
- [ ] **Export / Import** bookmarks as JSON for backup
- [ ] **Bookmark count badge** on the floating icon showing count for the current conversation

### 5.3 Nice to Have (P2)
- [ ] **Tags / categories** for organizing bookmarks (e.g., "code", "important", "todo")
- [ ] **Color-coded bookmarks** — let users pick a color when saving
- [ ] **Pin bookmarks** — pin important ones to the top of the sidebar
- [ ] **Sync across devices** using `chrome.storage.sync` (with 100KB limit awareness)
- [ ] **Right-click context menu** — "Bookmark this selection" in the browser context menu
- [ ] **Dark/Light theme toggle** for the sidebar (auto-detect ChatGPT's current theme)

---

## 6. Technical Constraints

| Constraint | Detail |
|---|---|
| **Manifest V3** | Must use service workers (not background pages), `chrome.storage.local` |
| **Host permissions** | Must work on both `chatgpt.com` and `chat.openai.com` |
| **ChatGPT DOM instability** | ChatGPT's DOM structure changes frequently — selectors must be resilient |
| **SPA behavior** | ChatGPT is a React SPA — URL changes don't trigger full page reloads |
| **Content Security Policy** | Cannot inject external scripts; all code must be bundled |
| **Storage limits** | `chrome.storage.local` has a 10MB limit — bookmark text should be truncated if very long |
| **Z-index conflicts** | ChatGPT uses high z-index values — extension UI must use very high z-index (999999+) |

---

## 7. Target Browsers
- Google Chrome (primary)
- Chromium-based browsers (Edge, Brave, etc.)

---

## 8. Success Criteria

1. ✅ User can select text in any ChatGPT conversation and bookmark it with a custom name
2. ✅ Bookmarks persist across browser sessions via `chrome.storage.local`
3. ✅ Clicking a bookmark scrolls to and highlights the exact text — even if the conversation was reopened
4. ✅ Cross-conversation navigation works (open correct chat → scroll to text)
5. ✅ The UI is polished, dark-themed, and feels native to ChatGPT's design language
6. ✅ The extension handles ChatGPT's SPA navigation gracefully
7. ✅ Search and keyboard shortcuts make the extension fast to use
8. ✅ No visual glitches — highlights, buttons, and sidebar all position correctly

---

## 9. Files to Rebuild

| File | Action |
|---|---|
| `manifest.json` | Update — add `commands` for keyboard shortcut, review permissions |
| `content.js` | **Rewrite** — fix all bugs, add SPA handling, search, keyboard shortcuts |
| `background.js` | **Write from scratch** — message handlers, tab management, toolbar icon |
| `styles.css` | **Write from scratch** — complete dark-theme styling for all components |
| `icons/` | Keep existing icons |
