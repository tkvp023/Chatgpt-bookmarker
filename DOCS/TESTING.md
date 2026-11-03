# ChatGPT Bookmarks — Test Plan & Test Cases

> Run the relevant test suite after completing each implementation phase.
> Mark each test as ✅ Pass, ❌ Fail, or ⏭️ Skipped (not yet implemented).
>
> **References:**
> - [TRD.md](file:///c:/Users/THARUN/Desktop/bookmark-for-gpt/docs/TRD.md) — Functional & non-functional requirements
> - [edgecases.md](file:///c:/Users/THARUN/Desktop/bookmark-for-gpt/docs/edgecases.md) — Edge case catalog
> - [implementation_plan.md](file:///c:/Users/THARUN/Desktop/bookmark-for-gpt/docs/implementation_plan.md) — Phase definitions

---

## How to Test

1. **Load the extension**: Go to `chrome://extensions` → Enable Developer Mode → "Load unpacked" → select the project folder
2. **Open ChatGPT**: Navigate to `https://chatgpt.com` in a tab
3. **Open DevTools**: `F12` → Console tab (check for errors), Application tab (check storage)
4. **After each phase**: Reload the extension (click the refresh icon on `chrome://extensions`) and refresh the ChatGPT tab

---

## Phase 1 — Foundation Tests

> Run after completing: `manifest.json`, `background.js`, `styles.css` (tokens)

### T1: Extension Loading

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T1.01 | Extension loads without errors | Load unpacked extension → check `chrome://extensions` | No error badge, extension is "Enabled" | ⏭️ |
| T1.02 | No console errors on ChatGPT | Open ChatGPT → open DevTools Console | No red errors from the extension | ⏭️ |
| T1.03 | Extension icon in toolbar | Load extension | Bookmark icon appears in Chrome toolbar | ⏭️ |

### T1: Background Script

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T1.04 | Toolbar icon click sends message | Click extension icon on a ChatGPT tab → check Console | Console logs `toggleSidebar` message received (or no error) | ⏭️ |
| T1.05 | Toolbar icon on non-ChatGPT tab | Click extension icon on `google.com` | No crash. Message may fail silently (no matching content script) | ⏭️ |
| T1.06 | Keyboard shortcut registered | Go to `chrome://extensions/shortcuts` | `Ctrl+Shift+B` and `Ctrl+Shift+K` listed for the extension | ⏭️ |

### T1: CSS Foundation

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T1.07 | CSS custom properties defined | Open DevTools → Elements → select `:root` → Computed styles | All `--bm-*` variables visible | ⏭️ |
| T1.08 | No style leaks | Inspect ChatGPT elements (message bubbles, sidebar, input) | No visual changes to ChatGPT's own UI | ⏭️ |

---

## Phase 2 — Core Content Script Tests

> Run after completing: `content.js` (modules), `styles.css` (components)

### T2: Floating Action Button

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T2.01 | FAB appears on page | Open ChatGPT | Green circular button visible on right side of page | ⏭️ |
| T2.02 | FAB survives page navigation (SPA) | Click a different conversation in ChatGPT sidebar | FAB remains visible after navigation | ⏭️ |
| T2.03 | FAB has hover effect | Hover over FAB | Visual feedback (scale, shadow, or color change) | ⏭️ |
| T2.04 | FAB click toggles sidebar | Click FAB once → click again | Sidebar opens → sidebar closes | ⏭️ |
| T2.05 | FAB not present on non-ChatGPT pages | Navigate to `google.com` | No FAB visible | ⏭️ |

### T2: Text Selection & Bookmark Button

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T2.06 | Bookmark button on valid selection | Select 10+ characters in a ChatGPT response | "🔖 Bookmark" button appears near selection | ⏭️ |
| T2.07 | No button for short selection | Select 3 characters | No bookmark button appears | ⏭️ |
| T2.08 | No button outside conversation | Select text in ChatGPT's sidebar or header | No bookmark button appears | ⏭️ |
| T2.09 | Button disappears on click-away | Select text → button appears → click elsewhere | Button disappears | ⏭️ |
| T2.10 | Button near selection bounds | Select text at top of page, middle, bottom | Button positioned near the selection each time, never off-screen | ⏭️ |
| T2.11 | Selection in code block | Select text inside a `<pre>` code block | Bookmark button appears normally | ⏭️ |
| T2.12 | Selection in user's own message | Select text from your own prompt | Bookmark button appears normally | ⏭️ |

### T2: Bookmark Modal

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T2.13 | Modal opens on button click | Select text → click "🔖 Bookmark" | Modal overlay appears with name input, text preview, Save/Cancel | ⏭️ |
| T2.14 | Input auto-focused | Open modal | Cursor is in the name input field | ⏭️ |
| T2.15 | Text preview shows selected text | Select "Hello world from ChatGPT" → open modal | Preview shows "Hello world from ChatGPT" (or truncated if >100 chars) | ⏭️ |
| T2.16 | Save disabled when name empty | Open modal, leave input blank | Save button is visually disabled / non-clickable | ⏭️ |
| T2.17 | Save with valid name | Type "My bookmark" → click Save | Modal closes, toast "Bookmark saved!" appears | ⏭️ |
| T2.18 | Save via Enter key | Type "My bookmark" → press Enter | Same as clicking Save — modal closes, toast appears | ⏭️ |
| T2.19 | Cancel closes modal | Click Cancel | Modal closes, no bookmark saved | ⏭️ |
| T2.20 | Escape closes modal | Press Escape | Modal closes, no bookmark saved | ⏭️ |
| T2.21 | Click backdrop closes modal | Click outside the modal content | Modal closes | ⏭️ |
| T2.22 | Bookmark appears in storage | Save a bookmark → DevTools → Application → chrome.storage.local | Bookmark object with correct fields visible in storage | ⏭️ |

### T2: Toast Notifications

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T2.23 | Toast appears on save | Save a bookmark | Toast "Bookmark saved!" visible | ⏭️ |
| T2.24 | Toast auto-dismisses | Wait after toast appears | Toast fades out after ~2.5 seconds | ⏭️ |
| T2.25 | Multiple toasts stack | Rapidly save 2 bookmarks | Two toasts visible, stacked vertically, not overlapping | ⏭️ |

### T2: SPA Navigation Detection

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T2.26 | URL change detected | Click different conversation → check Console | Log message indicating URL change detected | ⏭️ |
| T2.27 | Back/forward detected | Navigate to a chat → click browser Back → Forward | URL changes detected on both back and forward | ⏭️ |
| T2.28 | New chat detected | Click "New chat" in ChatGPT | URL change detected | ⏭️ |

### T2: Sidebar Shell

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T2.29 | Sidebar opens with animation | Click FAB | Sidebar slides in from right, 360px wide | ⏭️ |
| T2.30 | Sidebar has header with close button | Open sidebar | Header shows "📚 Bookmarks" and ✕ button | ⏭️ |
| T2.31 | Close button closes sidebar | Click ✕ | Sidebar slides out | ⏭️ |
| T2.32 | Empty state shown | Open sidebar with 0 bookmarks | "No bookmarks yet" message with instructions | ⏭️ |
| T2.33 | Bookmarks listed after save | Save a bookmark → open sidebar | Saved bookmark appears in list | ⏭️ |
| T2.34 | Delete removes bookmark | Click 🗑️ on a bookmark | Bookmark removed from list, toast confirms | ⏭️ |

---

## Phase 3 — Navigation & Polish Tests

> Run after completing: BookmarkNavigator, cross-conversation nav, style polish

### T3: Same-Conversation Navigation

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T3.01 | Scroll to bookmarked text | Save bookmark → scroll away → click bookmark in sidebar | Page smoothly scrolls to the bookmarked text | ⏭️ |
| T3.02 | Highlight on navigation | Click bookmark in sidebar | Yellow highlight appears on the text, visible for ~3 seconds | ⏭️ |
| T3.03 | Correct text found with context | Bookmark "return true;" (which appears 3 times) → click bookmark | Scrolls to the correct instance (matching context) | ⏭️ |
| T3.04 | Text not found | Bookmark text → regenerate the response → click bookmark | Toast "Could not find bookmarked text" | ⏭️ |

### T3: Cross-Conversation Navigation

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T3.05 | Navigate to different conversation | Open Chat A → save bookmark → go to Chat B → click bookmark from Chat A in sidebar | Page navigates to Chat A's URL, scrolls to text, highlights it | ⏭️ |
| T3.06 | Pending bookmark cleared | After cross-conv navigation → check storage | `pendingBookmark` is `null` | ⏭️ |
| T3.07 | Navigation timeout | Bookmark a deleted conversation → click it | After ~10 seconds, toast "Navigation timed out" | ⏭️ |

### T3: Visual Polish

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T3.08 | Sidebar animation smooth | Open/close sidebar multiple times | No janky frames, smooth slide transition | ⏭️ |
| T3.09 | Modal has backdrop blur | Open bookmark modal | Background is dimmed and blurred behind modal | ⏭️ |
| T3.10 | Bookmark items have hover effect | Hover over bookmark cards in sidebar | Background color changes on hover | ⏭️ |
| T3.11 | Delete button visible on hover | Hover over a bookmark item | 🗑️ button appears or becomes more visible | ⏭️ |
| T3.12 | Scrollbar styled in sidebar | Add 10+ bookmarks → open sidebar | Custom thin scrollbar, not default browser scrollbar | ⏭️ |
| T3.13 | Extension doesn't affect ChatGPT layout | Open sidebar → check ChatGPT messages/input area | ChatGPT's layout not pushed or distorted | ⏭️ |
| T3.14 | Z-index correct | Open sidebar → open ChatGPT's settings modal | Extension sidebar stays on top of ChatGPT's elements | ⏭️ |

---

## Phase 4 — Enhanced Features Tests

> Run after completing: search, grouping, editing, shortcuts, export/import, badge

### T4: Search & Filter

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T4.01 | Search bar visible | Open sidebar | Search input at top of sidebar | ⏭️ |
| T4.02 | Filter by name | Type a bookmark name in search | Only matching bookmarks shown | ⏭️ |
| T4.03 | Filter by text content | Type a word from the bookmarked text | Bookmarks containing that text in `selectedText` shown | ⏭️ |
| T4.04 | Case-insensitive search | Search "api" when bookmark has "API" | Match found | ⏭️ |
| T4.05 | Clear search | Click X or clear the input | All bookmarks shown again | ⏭️ |
| T4.06 | No results state | Search for "xyznonexistent" | "No matching bookmarks" message | ⏭️ |
| T4.07 | Search performance | Type quickly with 100+ bookmarks | Results update within 100ms per keystroke, no lag | ⏭️ |

### T4: Conversation Grouping

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T4.08 | Bookmarks grouped by chat | Save bookmarks in 3 different conversations → open sidebar | 3 collapsible groups with chat titles | ⏭️ |
| T4.09 | Group shows count | Group has 3 bookmarks | Header shows "Chat Title (3)" | ⏭️ |
| T4.10 | Collapse/expand group | Click group header | Bookmarks hide/show under the group | ⏭️ |
| T4.11 | Current conversation first | On Chat A's page, open sidebar | Chat A's group appears at the top | ⏭️ |
| T4.12 | Grouping with search | Search while groups are visible | Groups that have no matching bookmarks are hidden | ⏭️ |

### T4: Inline Editing

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T4.13 | Edit button visible on hover | Hover over a bookmark item | ✎ edit icon appears | ⏭️ |
| T4.14 | Click edit → input field | Click ✎ | Name text transforms into an input field, pre-filled | ⏭️ |
| T4.15 | Enter saves new name | Change name → press Enter | Name updated, input transforms back to text, toast confirms | ⏭️ |
| T4.16 | Escape cancels edit | Start editing → press Escape | Reverts to original name | ⏭️ |
| T4.17 | Empty name prevented | Clear the name → press Enter | Name not saved, visual error indicator | ⏭️ |
| T4.18 | Name persisted in storage | Edit name → close sidebar → reopen | New name still shown | ⏭️ |

### T4: Keyboard Shortcuts

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T4.19 | Quick bookmark (Ctrl+Shift+B) | Select text → press Ctrl+Shift+B | Bookmark saved with auto-generated name, toast appears | ⏭️ |
| T4.20 | Quick bookmark without selection | No text selected → press Ctrl+Shift+B | Toast "Select text first" | ⏭️ |
| T4.21 | Toggle sidebar (Ctrl+Shift+K) | Press Ctrl+Shift+K | Sidebar toggles open/closed | ⏭️ |
| T4.22 | Escape closes modal | Open modal → press Escape | Modal closes | ⏭️ |
| T4.23 | Escape closes sidebar | Open sidebar (no modal) → press Escape | Sidebar closes | ⏭️ |

### T4: Export / Import

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T4.24 | Export downloads file | Click Export in sidebar | Browser downloads `chatgpt-bookmarks-export-{date}.json` | ⏭️ |
| T4.25 | Export file structure | Open exported file | Contains `version`, `exportedAt`, `bookmarkCount`, `bookmarks` array | ⏭️ |
| T4.26 | Export with zero bookmarks | Delete all bookmarks → click Export | Toast "No bookmarks to export" — no file downloaded | ⏭️ |
| T4.27 | Import valid file | Export → delete all bookmarks → Import the exported file | All bookmarks restored, toast shows count | ⏭️ |
| T4.28 | Import merges (no duplicates) | Have 3 bookmarks → import file with same 3 + 2 new | 5 total bookmarks (3 existing + 2 new), toast "Imported 2 new bookmarks (3 duplicates skipped)" | ⏭️ |
| T4.29 | Import invalid JSON | Try to import a `.txt` file or corrupted JSON | Toast "Invalid file format" — no changes to storage | ⏭️ |
| T4.30 | Import wrong schema | Import `[{"foo": "bar"}]` | Toast "Invalid bookmark data (X entries skipped)" | ⏭️ |

### T4: Badge Count

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T4.31 | Badge shows on FAB | Save 3 bookmarks on current conversation | FAB shows "3" badge | ⏭️ |
| T4.32 | Badge hidden when zero | Navigate to a conversation with no bookmarks | No badge visible on FAB | ⏭️ |
| T4.33 | Badge updates on save | Save a bookmark | Badge count increments by 1 | ⏭️ |
| T4.34 | Badge updates on delete | Delete a bookmark | Badge count decrements by 1 | ⏭️ |
| T4.35 | Badge updates on URL change | Navigate to a different conversation | Badge shows count for the new conversation | ⏭️ |

---

## Phase 5 — Hardening & QA Tests

> Run after completing: error handling, performance optimization, edge case fixes

### T5: Error Handling

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T5.01 | Storage write failure | (Simulate by filling storage near 10MB) → save bookmark | Toast "Failed to save bookmark", modal stays open | ⏭️ |
| T5.02 | Extension context invalidated | Reload extension from `chrome://extensions` → try to interact on existing tab | Toast "Extension updated. Please refresh the page." | ⏭️ |
| T5.03 | Corrupted storage recovery | Manually set `bookmarks` to a string in storage → open sidebar | Sidebar shows empty state (auto-reset to []), warning logged | ⏭️ |
| T5.04 | Stale pending bookmark | Set `pendingBookmark` with old timestamp → open ChatGPT | Stale pending cleared automatically (>60s old) | ⏭️ |

### T5: Performance

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T5.05 | Selection-to-button latency | Select text, observe timing | Button appears within 200ms | ⏭️ |
| T5.06 | Sidebar with 100 bookmarks | Seed 100 bookmarks → open sidebar | Renders in <300ms, scrolling is smooth | ⏭️ |
| T5.07 | Search with 100 bookmarks | Type in search with 100 bookmarks | Results filter within 100ms per keystroke | ⏭️ |
| T5.08 | Memory footprint | Open Chrome Task Manager → check extension memory | Content script < 5MB | ⏭️ |

### T5: Edge Cases

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T5.09 | Streaming response selection | Start a long response → select text while streaming | Bookmark button appears (may disappear if DOM shifts), no crash | ⏭️ |
| T5.10 | Multi-message selection | Select text spanning two messages | Bookmark saves, navigation attempts to find text | ⏭️ |
| T5.11 | Very long text selection | Select a 3000-char block → save | Text truncated to 2000 chars, `isTruncated: true` in storage | ⏭️ |
| T5.12 | Rapid FAB clicks | Click FAB 5 times quickly | Sidebar toggles cleanly, no duplicate sidebars | ⏭️ |
| T5.13 | Rapid bookmark saves | Quick-bookmark 3 times in 1 second | 3 unique bookmarks saved, no duplicates, no race condition | ⏭️ |
| T5.14 | SPA nav while sidebar open | Open sidebar → click different conversation | Sidebar refreshes with new conversation's bookmarks | ⏭️ |
| T5.15 | React re-render removes FAB | (Hard to simulate) Navigate around aggressively | FAB persists or re-appears automatically | ⏭️ |
| T5.16 | Lazy-loaded messages | Long conversation → bookmark old message → refresh → click bookmark | If message loaded: scrolls to it. If not loaded: "Could not find" toast | ⏭️ |

### T5: Cross-Browser

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T5.17 | Edge compatibility | Load extension on Microsoft Edge → run T2.01–T2.34 | All tests pass | ⏭️ |
| T5.18 | Brave compatibility | Load extension on Brave → run T2.01–T2.34 | All tests pass | ⏭️ |

### T5: Accessibility

| ID | Test | Steps | Expected Result | Status |
|---|---|---|---|---|
| T5.19 | ARIA roles present | Inspect sidebar, modal, toast in DevTools | Correct `role` and `aria-label` attributes present | ⏭️ |
| T5.20 | Keyboard navigation | Tab through sidebar items → Enter to select | Focus moves logically, Enter triggers action | ⏭️ |
| T5.21 | Modal focus trap | Open modal → Tab repeatedly | Focus stays within modal, doesn't reach elements behind | ⏭️ |

---

## Regression Checklist

> Run ALL tests from previous phases after completing each new phase.

| After Phase | Run Tests From |
|---|---|
| Phase 2 | Phase 1 (T1.01–T1.08) |
| Phase 3 | Phase 1 + Phase 2 (T1.01–T2.34) |
| Phase 4 | Phase 1 + Phase 2 + Phase 3 (T1.01–T3.14) |
| Phase 5 | **ALL** (T1.01–T5.21) — Full regression |

---

## Test Summary

| Phase | Test Count | Category |
|---|---|---|
| Phase 1 | 8 | Extension loading, background script, CSS foundation |
| Phase 2 | 26 | FAB, selection, modal, toast, SPA, sidebar shell |
| Phase 3 | 14 | Same-conv nav, cross-conv nav, visual polish |
| Phase 4 | 27 | Search, groups, editing, shortcuts, export/import, badge |
| Phase 5 | 17 | Error handling, performance, edge cases, cross-browser, a11y |
| **Total** | **92** | |
