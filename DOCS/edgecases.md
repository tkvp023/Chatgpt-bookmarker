# ChatGPT Bookmarks — Edge Cases

> Comprehensive catalog of edge cases to handle during implementation and testing.
> Each case includes expected behavior and severity rating.

**Severity Legend:**
- 🔴 **Critical** — Extension crashes, data loss, or completely broken flow
- 🟠 **High** — Feature doesn't work, poor UX, but no data loss
- 🟡 **Medium** — Degraded experience, workaround exists
- 🟢 **Low** — Cosmetic or minor inconvenience

---

## 1. Text Selection Edge Cases

### 1.1 Selection Inside a Code Block
| | |
|---|---|
| **Scenario** | User selects text within a `<pre><code>` block in a ChatGPT response |
| **Risk** | Code blocks have special formatting; `innerText` may include line numbers or copy-button text |
| **Expected Behavior** | Bookmark saves the raw code text without artifacts. Navigation finds the text inside the code block |
| **Severity** | 🟠 High |

### 1.2 Selection Across Multiple Messages
| | |
|---|---|
| **Scenario** | User drags selection from the end of one message into the start of the next |
| **Risk** | `commonAncestorContainer` will be a parent of both messages, context extraction may grab too much text |
| **Expected Behavior** | Bookmark saves the selected text. Context may be imprecise — navigation should still attempt a match using the selected text alone as fallback |
| **Severity** | 🟡 Medium |

### 1.3 Selection Inside LaTeX / Math Blocks
| | |
|---|---|
| **Scenario** | User selects rendered math content (MathJax/KaTeX) |
| **Risk** | Rendered math has deeply nested DOM nodes (`<span>`, `<svg>`, `<math>`). `innerText` may return garbled content like individual characters |
| **Expected Behavior** | Bookmark button appears but saves whatever text is extractable. Toast warning if text is <5 chars after extraction |
| **Severity** | 🟡 Medium |

### 1.4 Selection on an Image or Non-Text Element
| | |
|---|---|
| **Scenario** | User selects an image (DALL-E output), a chart, or a file attachment |
| **Risk** | `selection.toString()` returns empty or alt-text only |
| **Expected Behavior** | No bookmark button appears (selection <5 chars). No error thrown |
| **Severity** | 🟢 Low |

### 1.5 Exactly 5 Characters Selected
| | |
|---|---|
| **Scenario** | User selects exactly 5 characters (the minimum threshold) |
| **Risk** | Very short text may match multiple places on the page |
| **Expected Behavior** | Bookmark button appears. Context matching (before/after) is critical for accurate navigation. If multiple matches, use the first one with matching context |
| **Severity** | 🟡 Medium |

### 1.6 Selection Contains Only Whitespace
| | |
|---|---|
| **Scenario** | User selects a blank area or whitespace-only text |
| **Risk** | `selection.toString().trim()` could produce an empty or very short string |
| **Expected Behavior** | No bookmark button appears. Already handled by the `length < 5` check |
| **Severity** | 🟢 Low |

### 1.7 Selection During Streaming Response
| | |
|---|---|
| **Scenario** | User selects text while ChatGPT is still generating (streaming) a response |
| **Risk** | DOM is actively mutating. The selected text may grow, shift, or disappear as tokens stream in |
| **Expected Behavior** | If user manages to click "Bookmark" before the text moves, save whatever was selected. If the selection is invalidated, the bookmark button disappears naturally. No crash |
| **Severity** | 🟠 High |

### 1.8 Selection in User's Own Message
| | |
|---|---|
| **Scenario** | User selects text from their own prompt, not the AI response |
| **Risk** | None technically — but user prompts have different DOM structure than AI responses |
| **Expected Behavior** | Bookmark works identically for user prompts and AI responses |
| **Severity** | 🟢 Low |

### 1.9 Right-to-Left (RTL) Text
| | |
|---|---|
| **Scenario** | User selects Arabic, Hebrew, or other RTL text in a response |
| **Risk** | Bookmark button positioning may be mirrored or off-screen |
| **Expected Behavior** | Button appears near the selection regardless of text direction |
| **Severity** | 🟡 Medium |

### 1.10 Selection Inside Collapsed/Expandable Sections
| | |
|---|---|
| **Scenario** | ChatGPT sometimes uses collapsible sections (e.g., "Show more" for long code). User expands, selects, then the section collapses |
| **Risk** | Bookmarked text may not be visible during navigation if section is collapsed |
| **Expected Behavior** | Navigation finds the text (it's still in DOM even if collapsed). Element scrolled into view — if visually hidden, show toast "Text found but may be in a collapsed section" |
| **Severity** | 🟡 Medium |

---

## 2. DOM & SPA Edge Cases

### 2.1 ChatGPT SPA Navigation (No Page Reload)
| | |
|---|---|
| **Scenario** | User clicks a different conversation in the ChatGPT sidebar — URL changes but no page reload |
| **Risk** | Content script doesn't re-initialize. URL-dependent logic stale. Sidebar shows wrong bookmarks |
| **Expected Behavior** | SPAObserver detects URL change → refresh sidebar, update badge count, check for pending navigation |
| **Severity** | 🔴 Critical |

### 2.2 React Re-renders Wipe Injected Elements
| | |
|---|---|
| **Scenario** | ChatGPT's React app re-renders a large portion of the DOM, removing our injected elements (FAB, sidebar) |
| **Risk** | Floating icon disappears. Sidebar lost. User thinks extension stopped working |
| **Expected Behavior** | Use a MutationObserver on `document.body` to detect if `#chatgpt-bookmark-icon` is removed. If removed, re-inject it. Sidebar should be re-created on next toggle |
| **Severity** | 🔴 Critical |

### 2.3 ChatGPT DOM Structure Changes (After Update)
| | |
|---|---|
| **Scenario** | ChatGPT deploys a UI update that changes class names, element structure, or removes `data-testid` attributes |
| **Risk** | All selectors break — can't find conversation elements, scroll container, or position elements |
| **Expected Behavior** | Resilient selector fallback chain. If primary selector fails, try next. If all fail, use `main` as fallback. Log warnings for debugging |
| **Severity** | 🟠 High |

### 2.4 Multiple ChatGPT Tabs Open
| | |
|---|---|
| **Scenario** | User has 3 ChatGPT tabs open. Clicks a bookmark in tab 1 that points to a conversation open in tab 2 |
| **Risk** | `chrome.tabs.update()` will navigate tab 1 to the bookmark URL, even though tab 2 already has it open |
| **Expected Behavior** | Navigate the current tab (where user clicked). Don't try to find and switch to another tab — too complex and confusing |
| **Severity** | 🟢 Low |

### 2.5 Lazy-Loaded Conversation Messages
| | |
|---|---|
| **Scenario** | Very long conversation. ChatGPT only renders recent messages; older ones are lazy-loaded on scroll-up |
| **Risk** | Bookmarked text from an old message may not be in the DOM yet |
| **Expected Behavior** | `findTextInPage` returns null → show toast "Could not find bookmarked text. Try scrolling up to load older messages." Provide more descriptive error message |
| **Severity** | 🟠 High |

### 2.6 Shadow DOM Elements
| | |
|---|---|
| **Scenario** | ChatGPT introduces Shadow DOM for some components (unlikely but possible) |
| **Risk** | TreeWalker cannot traverse into shadow roots by default |
| **Expected Behavior** | If text not found in regular DOM, check for shadow roots and search within them. Low priority unless it actually happens |
| **Severity** | 🟢 Low |

### 2.7 Page Loaded in Iframe
| | |
|---|---|
| **Scenario** | User opens ChatGPT inside an iframe (e.g., an embedding service) |
| **Risk** | Content script has `all_frames: false` in manifest — won't run in iframes |
| **Expected Behavior** | Extension only works on top-level ChatGPT pages. This is intentional |
| **Severity** | 🟢 Low |

---

## 3. Storage Edge Cases

### 3.1 Storage Quota Exceeded (~10MB)
| | |
|---|---|
| **Scenario** | User has saved hundreds of bookmarks with long selected text, approaching 10MB limit |
| **Risk** | `chrome.storage.local.set()` fails silently or throws |
| **Expected Behavior** | Check `chrome.storage.local.getBytesInUse()` after each write. At 80% (8MB): show warning toast. At 95%+: show error toast with suggestion to export and delete old bookmarks. Never silently fail |
| **Severity** | 🔴 Critical |

### 3.2 Concurrent Storage Writes (Race Condition)
| | |
|---|---|
| **Scenario** | User rapidly saves two bookmarks within milliseconds (or quick-bookmark shortcut mashed) |
| **Risk** | Both read the same bookmarks array → both append → second write overwrites the first |
| **Expected Behavior** | Use a write queue / mutex pattern. Queue writes sequentially. Or use `chrome.storage.local.get()` inside the callback chain to always read the latest state before writing |
| **Severity** | 🟠 High |

### 3.3 Corrupted Storage Data
| | |
|---|---|
| **Scenario** | `chrome.storage.local` contains malformed data (e.g., `bookmarks` is a string instead of array, or a bookmark object is missing required fields) |
| **Risk** | Extension crashes on startup or when opening sidebar |
| **Expected Behavior** | Validate data shape on every read. If `bookmarks` is not an array, reset to `[]`. If individual bookmark objects are missing fields, skip or repair them. Log warnings |
| **Severity** | 🟠 High |

### 3.4 Very Long Selected Text (>2000 chars)
| | |
|---|---|
| **Scenario** | User selects an entire long code block or multiple paragraphs |
| **Risk** | Bloats storage quickly. Sidebar preview becomes unwieldy |
| **Expected Behavior** | Truncate `selectedText` to 2000 chars. Set `isTruncated: true`. Store full context (before/after) for navigation. Preview shows first 80 chars as usual |
| **Severity** | 🟡 Medium |

### 3.5 Duplicate Bookmark IDs (Theoretical)
| | |
|---|---|
| **Scenario** | Two bookmarks end up with the same `id` (extremely unlikely with timestamp + random) |
| **Risk** | Delete one → deletes both. Navigate → finds the wrong one |
| **Expected Behavior** | ID generation uses `Date.now()` + `Math.random()` — collision chance is astronomically low. But `delete` should only remove the first match. Add a check on save if paranoid |
| **Severity** | 🟢 Low |

### 3.6 Storage Cleared Externally
| | |
|---|---|
| **Scenario** | User clears browser data ("Clear browsing data" → "All time"), or another extension/script clears `chrome.storage.local` |
| **Risk** | All bookmarks lost. Sidebar shows empty. No crash but user loses data |
| **Expected Behavior** | Sidebar shows empty state gracefully. Consider periodic auto-export (P2 feature) or `chrome.storage.onChanged` listener to detect external wipes and notify user |
| **Severity** | 🟡 Medium |

### 3.7 Import Overwrites vs. Merges
| | |
|---|---|
| **Scenario** | User imports a JSON file that contains bookmarks with IDs that already exist in storage |
| **Risk** | If we replace, user loses edits to existing bookmarks. If we skip, user doesn't get updates |
| **Expected Behavior** | **Merge strategy**: Skip bookmarks whose `id` already exists. Show toast: "Imported X new bookmarks (Y duplicates skipped)" |
| **Severity** | 🟡 Medium |

---

## 4. Navigation Edge Cases

### 4.1 Bookmarked Conversation Was Deleted
| | |
|---|---|
| **Scenario** | User bookmarked text in a conversation, then deleted that conversation from ChatGPT |
| **Risk** | Navigation opens a URL that returns a 404 or redirect to ChatGPT home |
| **Expected Behavior** | After navigation, `checkPendingNavigation` waits for content → times out (10s) → show toast "Conversation may have been deleted" → clear pending |
| **Severity** | 🟠 High |

### 4.2 Response Was Regenerated
| | |
|---|---|
| **Scenario** | User bookmarked text in an AI response, then used "Regenerate response" — the text is now different |
| **Risk** | `findTextInPage` can't find the original text |
| **Expected Behavior** | Show toast "Could not find bookmarked text". The bookmark remains in storage (user can delete manually). Don't auto-delete stale bookmarks |
| **Severity** | 🟡 Medium |

### 4.3 Message Was Edited
| | |
|---|---|
| **Scenario** | User bookmarked text in their own prompt, then edited that prompt |
| **Risk** | Same as regeneration — bookmarked text no longer exists |
| **Expected Behavior** | Same as 4.2 — show "Could not find" toast |
| **Severity** | 🟡 Medium |

### 4.4 Same Text Appears Multiple Times on Page
| | |
|---|---|
| **Scenario** | The bookmarked text (e.g., "return true;") appears in multiple code blocks or messages |
| **Risk** | `findTextInPage` returns the wrong occurrence |
| **Expected Behavior** | Context matching (before/after text) disambiguates. If context also matches multiple, return the first match. Acceptable trade-off |
| **Severity** | 🟡 Medium |

### 4.5 Very Slow Page Load (Cross-Conversation)
| | |
|---|---|
| **Scenario** | User clicks a cross-conversation bookmark. ChatGPT takes >10 seconds to load the conversation |
| **Risk** | Pending navigation timeout fires, clears pending bookmark before content loads |
| **Expected Behavior** | 10-second timeout with toast "Navigation timed out". User can manually scroll. Consider increasing timeout or making it configurable |
| **Severity** | 🟡 Medium |

### 4.6 Redirected to Login Page
| | |
|---|---|
| **Scenario** | User's session expired. Clicking a bookmark navigates to the chat URL, but ChatGPT redirects to the login page |
| **Risk** | Content script runs on login page (matches `*://chatgpt.com/*`), tries to find text, fails |
| **Expected Behavior** | `checkPendingNavigation` checks if page has a `main` element with >100 chars of content. Login page won't match → timeout → clear pending. After login, user must click bookmark again |
| **Severity** | 🟡 Medium |

### 4.7 Shared/Public Chat Links
| | |
|---|---|
| **Scenario** | Bookmark was saved on a shared chat link (`chatgpt.com/share/...`) vs a regular chat (`chatgpt.com/c/...`) |
| **Risk** | URL comparison fails — same conversation, different URL format |
| **Expected Behavior** | URL comparison uses the full URL as stored. If user opens from a different URL format, it triggers cross-conversation navigation. Acceptable behavior |
| **Severity** | 🟢 Low |

### 4.8 Conversation With Branching (Multiple Response Versions)
| | |
|---|---|
| **Scenario** | User is on a different branch (version) of a response than when the bookmark was created |
| **Risk** | Bookmarked text exists in a different branch, not the currently visible one |
| **Expected Behavior** | `findTextInPage` won't find it → "Could not find bookmarked text" toast. User must manually switch to the correct branch |
| **Severity** | 🟡 Medium |

---

## 5. UI/UX Edge Cases

### 5.1 Z-Index War with ChatGPT Elements
| | |
|---|---|
| **Scenario** | ChatGPT's own modals, dropdowns, or tooltips have z-index values that compete with our extension UI |
| **Risk** | Our sidebar or modal appears behind ChatGPT's UI |
| **Expected Behavior** | Use z-index values of 999999+ with `!important`. Layer order: Highlight (999997) < FAB (999998) < Sidebar (999999) < Modal (9999999) < Toast (99999999) |
| **Severity** | 🟠 High |

### 5.2 Browser Window Resize
| | |
|---|---|
| **Scenario** | User resizes the browser window while the sidebar is open |
| **Risk** | Sidebar may overflow or get cut off on very narrow windows |
| **Expected Behavior** | Sidebar has `max-width: 90vw` fallback. On screens <400px wide, sidebar takes full width. FAB repositions to stay visible |
| **Severity** | 🟡 Medium |

### 5.3 Rapid Click on Floating Icon
| | |
|---|---|
| **Scenario** | User clicks the FAB 5 times rapidly |
| **Risk** | Multiple sidebars created, or sidebar toggling bugs out |
| **Expected Behavior** | Debounce FAB clicks (300ms). Only one sidebar instance ever exists. `toggleSidebar` is idempotent |
| **Severity** | 🟡 Medium |

### 5.4 Opening Modal While Sidebar is Open
| | |
|---|---|
| **Scenario** | User has sidebar open, selects text, clicks bookmark button |
| **Risk** | Modal and sidebar both visible — modal may be partially hidden behind sidebar |
| **Expected Behavior** | Modal has higher z-index and full-screen overlay. Sidebar remains behind the modal backdrop. Closing modal returns to sidebar |
| **Severity** | 🟡 Medium |

### 5.5 ChatGPT Theme Switch (Dark ↔ Light)
| | |
|---|---|
| **Scenario** | User switches ChatGPT from dark to light mode (or vice versa) while extension is active |
| **Risk** | Extension UI is always dark-themed — may look jarring on light ChatGPT |
| **Expected Behavior** | For v1, extension uses its own dark theme regardless. Future enhancement: detect `<html>` class or `prefers-color-scheme` and switch themes |
| **Severity** | 🟢 Low |

### 5.6 Screen Reader / Accessibility
| | |
|---|---|
| **Scenario** | User navigates with a screen reader (NVDA, JAWS, VoiceOver) |
| **Risk** | Injected elements lack ARIA attributes — invisible or confusing to screen readers |
| **Expected Behavior** | Add `role="complementary"` to sidebar, `role="dialog"` to modal, `aria-label` on buttons, `aria-live="polite"` on toast region. FAB has `aria-label="Open bookmarks"` |
| **Severity** | 🟡 Medium |

### 5.7 Bookmark Button Appears Off-Screen
| | |
|---|---|
| **Scenario** | User selects text at the very bottom or right edge of the viewport |
| **Risk** | Bookmark button renders outside the visible area |
| **Expected Behavior** | Clamp button position to viewport bounds. If selection is at the bottom, show button above the selection instead of below |
| **Severity** | 🟡 Medium |

### 5.8 Empty Bookmark Name
| | |
|---|---|
| **Scenario** | User clicks "Save" without typing a name, or types only spaces |
| **Risk** | Bookmark saved with empty name — hard to identify in sidebar |
| **Expected Behavior** | Save button is disabled while input is empty/whitespace-only. Visual cue (red border or placeholder text) indicates name is required |
| **Severity** | 🟡 Medium |

### 5.9 Very Long Bookmark Name
| | |
|---|---|
| **Scenario** | User types a 500-character bookmark name |
| **Risk** | Name overflows the sidebar card layout |
| **Expected Behavior** | Truncate display to 60 chars with ellipsis (`text-overflow: ellipsis`). Store the full name. Show full name on hover (title attribute) |
| **Severity** | 🟢 Low |

---

## 6. Cross-Conversation Navigation Edge Cases

### 6.1 Tab Closed During Navigation
| | |
|---|---|
| **Scenario** | User clicks a cross-conversation bookmark. Background script calls `chrome.tabs.update()`, but user closes the tab before it loads |
| **Risk** | `pendingBookmark` remains in storage forever |
| **Expected Behavior** | `pendingBookmark` has a timestamp. On next init, if pending bookmark is >60 seconds old, clear it automatically |
| **Severity** | 🟡 Medium |

### 6.2 Multiple Pending Bookmarks
| | |
|---|---|
| **Scenario** | User rapidly clicks two different cross-conversation bookmarks |
| **Risk** | Second `setPending` overwrites the first. First bookmark never navigated to |
| **Expected Behavior** | Only the most recent pending bookmark is honored. This is acceptable — user's latest intent wins |
| **Severity** | 🟢 Low |

### 6.3 Pending Bookmark for Current Page
| | |
|---|---|
| **Scenario** | Due to a race condition, `pendingBookmark` is set for the URL the user is already on |
| **Risk** | Unnecessary page reload or double navigation |
| **Expected Behavior** | `checkPendingNavigation` compares pending URL with current URL. If they match, skip navigation and just find+scroll to text |
| **Severity** | 🟡 Medium |

### 6.4 Background Service Worker Terminated
| | |
|---|---|
| **Scenario** | Chrome terminates the service worker (idle timeout ~30s in MV3) right when user clicks a cross-conversation bookmark |
| **Risk** | `chrome.runtime.sendMessage()` fails with "Could not establish connection. Receiving end does not exist." |
| **Expected Behavior** | Chrome automatically restarts the service worker when a message is sent. Wrap `sendMessage` in try-catch just in case. Show "Please try again" toast on failure |
| **Severity** | 🟡 Medium |

---

## 7. Keyboard Shortcut Edge Cases

### 7.1 Shortcut Conflicts with Browser/ChatGPT
| | |
|---|---|
| **Scenario** | `Ctrl+Shift+B` is Chrome's native "Toggle bookmarks bar" shortcut |
| **Risk** | Chrome shortcut takes precedence, extension shortcut never fires |
| **Expected Behavior** | Chrome extension commands override browser shortcuts on matching pages. If it doesn't work, user can rebind in `chrome://extensions/shortcuts`. Document this in README |
| **Severity** | 🟠 High |

### 7.2 Shortcut Pressed While Typing in Input
| | |
|---|---|
| **Scenario** | User is typing in ChatGPT's message input and presses the shortcut |
| **Risk** | Unexpected bookmark creation or sidebar toggle while composing a message |
| **Expected Behavior** | Chrome extension commands fire regardless of focus. This is acceptable — quick bookmark with no selection just shows "Select text first" toast. Sidebar toggle is always fine |
| **Severity** | 🟢 Low |

### 7.3 Shortcut Pressed While Modal is Open
| | |
|---|---|
| **Scenario** | User has the bookmark modal open and presses `Ctrl+Shift+B` again |
| **Risk** | Tries to create another bookmark while modal is showing |
| **Expected Behavior** | If modal is open, ignore quick-bookmark shortcut. Or close modal first, then process shortcut |
| **Severity** | 🟢 Low |

---

## 8. Import / Export Edge Cases

### 8.1 Malformed JSON Import
| | |
|---|---|
| **Scenario** | User imports a file that is not valid JSON (e.g., a CSV, a corrupted file) |
| **Risk** | `JSON.parse()` throws |
| **Expected Behavior** | Catch the error. Show toast "Invalid file format. Please select a valid JSON file." Do not modify existing bookmarks |
| **Severity** | 🟠 High |

### 8.2 Valid JSON but Wrong Schema
| | |
|---|---|
| **Scenario** | User imports valid JSON that doesn't match the bookmark schema (e.g., `[{"foo": "bar"}]`) |
| **Risk** | Invalid bookmark objects in storage — sidebar breaks |
| **Expected Behavior** | Validate each bookmark object has required fields: `id`, `name`, `chatUrl`, `selectedText`, `createdAt`. Skip invalid entries. Show toast "Imported X bookmarks (Y invalid entries skipped)" |
| **Severity** | 🟠 High |

### 8.3 Very Large Import File (>5MB)
| | |
|---|---|
| **Scenario** | User tries to import a huge JSON file |
| **Risk** | Browser hangs while parsing. May exceed storage quota |
| **Expected Behavior** | Check file size before parsing. If >5MB, show warning. Check available storage space before writing. Reject if it would exceed quota |
| **Severity** | 🟡 Medium |

### 8.4 Import File from Different Extension Version
| | |
|---|---|
| **Scenario** | Future version adds new fields to bookmark schema. User imports an old export missing those fields |
| **Risk** | New code expects fields that don't exist on imported bookmarks |
| **Expected Behavior** | On import, fill missing optional fields with defaults (e.g., `chatTitle: "Unknown"`, `isTruncated: false`). Never require fields that older versions didn't have |
| **Severity** | 🟡 Medium |

### 8.5 Export with Zero Bookmarks
| | |
|---|---|
| **Scenario** | User clicks Export when there are no bookmarks |
| **Risk** | Downloads an empty array JSON — confusing |
| **Expected Behavior** | Show toast "No bookmarks to export" instead of downloading an empty file |
| **Severity** | 🟢 Low |

### 8.6 Special Characters in Bookmark Data
| | |
|---|---|
| **Scenario** | Bookmarked text contains Unicode, emojis, HTML entities, or null bytes |
| **Risk** | JSON export may be malformed. Import may fail to parse |
| **Expected Behavior** | `JSON.stringify()` handles Unicode natively. Null bytes should be stripped on save. `escapeHtml()` prevents XSS on render |
| **Severity** | 🟢 Low |

---

## 9. Browser & Platform Edge Cases

### 9.1 Extension Updated While Tab is Open
| | |
|---|---|
| **Scenario** | Chrome auto-updates the extension. Existing content scripts become orphaned — `chrome.runtime` calls throw |
| **Risk** | Every `chrome.storage` and `chrome.runtime` call fails with "Extension context invalidated" |
| **Expected Behavior** | Wrap all Chrome API calls in try-catch. On context invalidation, show toast: "Extension was updated. Please refresh the page." Disable further interactions until refresh |
| **Severity** | 🔴 Critical |

### 9.2 Running on Edge, Brave, or Other Chromium Browsers
| | |
|---|---|
| **Scenario** | User installs on a Chromium-based browser that's not Chrome |
| **Risk** | Minor API differences, different default shortcuts, different z-index behavior |
| **Expected Behavior** | Test core flows on Edge and Brave. Use standard Manifest V3 APIs only. No Chrome-specific features |
| **Severity** | 🟡 Medium |

### 9.3 Browser Memory Pressure
| | |
|---|---|
| **Scenario** | User has many tabs open. Browser kills the service worker aggressively or throttles the content script |
| **Risk** | SPA polling interval stops. Messages between background and content may fail |
| **Expected Behavior** | Service worker automatically restarts on events. Content script polling should use `setInterval` which survives throttling. If extension seems unresponsive, refreshing the page is the fix |
| **Severity** | 🟢 Low |

### 9.4 Content Security Policy Restrictions
| | |
|---|---|
| **Scenario** | ChatGPT tightens their CSP, blocking certain content script behaviors |
| **Risk** | Inline styles via `element.style.cssText` might be blocked. `innerHTML` assignments might be blocked |
| **Expected Behavior** | CSP does not apply to content scripts for DOM manipulation — Chrome explicitly allows this. However, injecting `<style>` tags or using `eval()` could be blocked. We use a separate CSS file (injected by manifest) so this should be fine |
| **Severity** | 🟢 Low |

### 9.5 Incognito Mode
| | |
|---|---|
| **Scenario** | User enables the extension in incognito mode and creates bookmarks |
| **Risk** | `chrome.storage.local` is shared between regular and incognito by default. Bookmarks created in incognito are visible in regular mode |
| **Expected Behavior** | This is standard Chrome behavior. No special handling needed. Document that bookmarks persist across regular/incognito. If user wants isolation, they can use separate profiles |
| **Severity** | 🟢 Low |

### 9.6 Extension Disabled and Re-enabled
| | |
|---|---|
| **Scenario** | User disables the extension, then re-enables it without refreshing ChatGPT tabs |
| **Risk** | Content script not injected into existing tabs. Extension appears broken |
| **Expected Behavior** | Extension only works on tabs opened/refreshed after re-enabling. This is standard Chrome behavior. No workaround needed |
| **Severity** | 🟢 Low |

---

## Summary by Severity

| Severity | Count | Cases |
|---|---|---|
| 🔴 Critical | 4 | SPA navigation, React re-renders, storage quota, extension context invalidated |
| 🟠 High | 8 | Code block selection, streaming response, DOM changes, lazy-loaded messages, z-index wars, concurrent writes, corrupted storage, shortcut conflicts |
| 🟡 Medium | 18 | Multi-message selection, math blocks, RTL text, collapsed sections, resize, rapid clicks, empty name, theme switch, accessibility, pending bookmark stale, slow load, and more |
| 🟢 Low | 13 | Image selection, whitespace, duplicate IDs, long names, incognito, etc. |
| **Total** | **43** | |

---

## Implementation Priority

> [!IMPORTANT]
> All 🔴 Critical cases **must** be handled in Phase 2–3 (core implementation).
> All 🟠 High cases **must** be handled by Phase 5 (hardening).
> 🟡 Medium cases should be handled where feasible; acceptable to defer some to a future version.
> 🟢 Low cases are handled only if trivial to implement.
