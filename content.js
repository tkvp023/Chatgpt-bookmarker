// ChatGPT Bookmarks Extension — Content Script
// Phase 2: Full modular rewrite
// Modules: SPAObserver, StorageManager, SelectionManager, UIManager, MessageHandler

(function () {
  'use strict';

  // Prevent double initialization
  if (window.__chatgptBookmarksInitialized) return;
  window.__chatgptBookmarksInitialized = true;

  // =============================================================
  // HELPERS: Context Validation & Security
  // =============================================================
  function isContextValid() {
    return typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
  }

  let contextInvalidatedNotified = false;
  function notifyContextInvalidated() {
    if (contextInvalidatedNotified) return;
    contextInvalidatedNotified = true;
    console.warn('ChatGPT Bookmarks: Extension context invalidated. Please refresh the page.');
    try {
      if (typeof UIManager !== 'undefined' && UIManager.showToast) {
        UIManager.showToast('⚠️ Extension updated. Please refresh the page.', 8000);
      }
    } catch {}
  }

  function isValidChatGPTUrl(url) {
    if (!url || typeof url !== 'string') return false;
    try {
      const parsed = new URL(url);
      return (
        (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
        (parsed.hostname === 'chatgpt.com' ||
         parsed.hostname === 'chat.openai.com' ||
         parsed.hostname.endsWith('.chatgpt.com') ||
         parsed.hostname.endsWith('.openai.com'))
      );
    } catch {
      return false;
    }
  }

  // =============================================================
  // MODULE: SPAObserver
  // Detects URL changes in ChatGPT's SPA (React) navigation
  // =============================================================
  const SPAObserver = (() => {
    let currentUrl = window.location.href;
    let pollInterval = null;
    let isHistoryPatched = false;
    const callbacks = new Set();

    function start() {
      // 1. Patch history API to dispatch custom events
      patchHistoryAPI();

      // 2. Listen for popstate (browser back/forward)
      window.addEventListener('popstate', handleNavigation);

      // 3. Listen for our custom locationchange event
      window.addEventListener('locationchange', handleNavigation);

      // 4. Fallback: poll every 1 second
      pollInterval = setInterval(() => {
        if (window.location.href !== currentUrl) {
          handleNavigation();
        }
      }, 1000);
    }

    function stop() {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('locationchange', handleNavigation);
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    }

    function patchHistoryAPI() {
      if (isHistoryPatched) return;
      isHistoryPatched = true;

      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = function (...args) {
        originalPushState.apply(this, args);
        window.dispatchEvent(new Event('locationchange'));
      };

      history.replaceState = function (...args) {
        originalReplaceState.apply(this, args);
        window.dispatchEvent(new Event('locationchange'));
      };
    }

    function handleNavigation() {
      const newUrl = window.location.href;
      if (newUrl !== currentUrl) {
        const oldUrl = currentUrl;
        currentUrl = newUrl;
        console.log('ChatGPT Bookmarks: URL changed', { from: oldUrl, to: newUrl });
        callbacks.forEach((cb) => {
          try { cb(newUrl, oldUrl); } catch (e) { console.error('URL change callback error:', e); }
        });
      }
    }

    function onUrlChange(callback) {
      callbacks.add(callback);
      return () => callbacks.delete(callback);
    }

    function getCurrentUrl() {
      return currentUrl;
    }

    return { start, stop, onUrlChange, getCurrentUrl };
  })();


  // =============================================================
  // MODULE: StorageManager
  // Centralized CRUD for bookmarks via chrome.storage.local
  // =============================================================
  const StorageManager = (() => {
    let cache = null;
    let writeQueue = Promise.resolve();

    function invalidateCache() {
      cache = null;
    }

    function enqueueWrite(operation) {
      const next = writeQueue.then(() => operation());
      writeQueue = next.catch((err) => {
        console.error('ChatGPT Bookmarks: Storage write error:', err);
      });
      return next;
    }

    async function getAll() {
      if (cache) return [...cache];
      if (!isContextValid()) {
        notifyContextInvalidated();
        return [];
      }
      return new Promise((resolve) => {
        try {
          chrome.storage.local.get(['bookmarks'], (result) => {
            if (chrome.runtime.lastError) {
              if (chrome.runtime.lastError.message?.includes('Extension context invalidated')) {
                notifyContextInvalidated();
              } else {
                console.error('ChatGPT Bookmarks: Storage get error:', chrome.runtime.lastError);
              }
              return resolve(cache ? [...cache] : []);
            }
            let bookmarks = result ? result.bookmarks : [];
            if (!Array.isArray(bookmarks)) {
              console.warn('ChatGPT Bookmarks: Invalid bookmarks data, resetting to []');
              bookmarks = [];
            }
            cache = bookmarks;
            resolve([...cache]);
          });
        } catch (err) {
          if (err?.message?.includes('Extension context invalidated')) {
            notifyContextInvalidated();
          }
          resolve(cache ? [...cache] : []);
        }
      });
    }

    async function getByConversation(url) {
      const all = await getAll();
      if (!url) return [];
      const baseUrl = url.split('?')[0].split('#')[0];
      return all.filter((b) => {
        if (!b || !b.chatUrl) return false;
        const bBase = b.chatUrl.split('?')[0].split('#')[0];
        return bBase === baseUrl;
      });
    }

    async function save(bookmark) {
      return enqueueWrite(async () => {
        if (!isContextValid()) {
          notifyContextInvalidated();
          throw new Error('Extension context invalidated');
        }
        const all = await getAll();
        // Enforce 2000 char limit on selectedText
        if (bookmark.selectedText && bookmark.selectedText.length > 2000) {
          bookmark.selectedText = bookmark.selectedText.substring(0, 2000);
          bookmark.isTruncated = true;
        }
        all.push(bookmark);
        return new Promise((resolve, reject) => {
          chrome.storage.local.set({ bookmarks: all }, () => {
            if (chrome.runtime.lastError) {
              console.error('ChatGPT Bookmarks: Save error:', chrome.runtime.lastError);
              invalidateCache();
              if (chrome.runtime.lastError.message?.includes('Extension context invalidated')) {
                notifyContextInvalidated();
              }
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              cache = all;
              resolve();
            }
          });
        });
      });
    }

    async function update(id, fields) {
      return enqueueWrite(async () => {
        if (!isContextValid()) {
          notifyContextInvalidated();
          throw new Error('Extension context invalidated');
        }
        const all = await getAll();
        const index = all.findIndex((b) => b && b.id === id);
        if (index === -1) return;
        Object.assign(all[index], fields);
        return new Promise((resolve, reject) => {
          chrome.storage.local.set({ bookmarks: all }, () => {
            if (chrome.runtime.lastError) {
              invalidateCache();
              if (chrome.runtime.lastError.message?.includes('Extension context invalidated')) {
                notifyContextInvalidated();
              }
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              cache = all;
              resolve();
            }
          });
        });
      });
    }

    async function remove(id) {
      return enqueueWrite(async () => {
        if (!isContextValid()) {
          notifyContextInvalidated();
          throw new Error('Extension context invalidated');
        }
        const all = await getAll();
        const filtered = all.filter((b) => b && b.id !== id);
        return new Promise((resolve, reject) => {
          chrome.storage.local.set({ bookmarks: filtered }, () => {
            if (chrome.runtime.lastError) {
              invalidateCache();
              if (chrome.runtime.lastError.message?.includes('Extension context invalidated')) {
                notifyContextInvalidated();
              }
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              cache = filtered;
              resolve();
            }
          });
        });
      });
    }

    async function search(query) {
      const all = await getAll();
      const q = (query || '').toLowerCase().trim();
      if (!q) return all;
      return all.filter((b) => {
        if (!b) return false;
        const name = (typeof b.name === 'string') ? b.name.toLowerCase() : '';
        const text = (typeof b.selectedText === 'string') ? b.selectedText.toLowerCase() : '';
        const chatTitle = (typeof b.chatTitle === 'string') ? b.chatTitle.toLowerCase() : '';
        return name.includes(q) || text.includes(q) || chatTitle.includes(q);
      });
    }

    async function exportAll() {
      const all = await getAll();
      return JSON.stringify(
        {
          version: 1,
          exportedAt: new Date().toISOString(),
          bookmarkCount: all.length,
          bookmarks: all,
        },
        null,
        2
      );
    }

    async function importAll(jsonString) {
      return enqueueWrite(async () => {
        if (!isContextValid()) {
          notifyContextInvalidated();
          throw new Error('Extension context invalidated');
        }
        let data;
        try {
          data = JSON.parse(jsonString);
        } catch {
          throw new Error('Invalid JSON format');
        }

        const incoming = Array.isArray(data) ? data : data.bookmarks;
        if (!Array.isArray(incoming)) {
          throw new Error('No bookmarks array found in file');
        }

        // Validate and filter
        const requiredFields = ['id', 'name', 'chatUrl', 'selectedText'];
        const valid = incoming.filter((b) =>
          b &&
          requiredFields.every((f) => typeof b[f] === 'string' && b[f].length > 0) &&
          isValidChatGPTUrl(b.chatUrl)
        );
        const invalid = incoming.length - valid.length;

        // Merge: skip existing IDs
        const existing = await getAll();
        const existingIds = new Set(existing.map((b) => b.id));
        const newBookmarks = valid.filter((b) => !existingIds.has(b.id));
        const duplicates = valid.length - newBookmarks.length;

        // Fill missing optional fields
        newBookmarks.forEach((b) => {
          if (!b.context) b.context = { before: '', after: '' };
          if (!b.createdAt) b.createdAt = new Date().toISOString();
          if (!b.chatTitle) b.chatTitle = 'Untitled Conversation';
        });

        const merged = [...existing, ...newBookmarks];
        return new Promise((resolve, reject) => {
          chrome.storage.local.set({ bookmarks: merged }, () => {
            if (chrome.runtime.lastError) {
              invalidateCache();
              if (chrome.runtime.lastError.message?.includes('Extension context invalidated')) {
                notifyContextInvalidated();
              }
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              cache = merged;
              resolve({ added: newBookmarks.length, duplicates, invalid });
            }
          });
        });
      });
    }

    async function getPending() {
      if (!isContextValid()) return null;
      return new Promise((resolve) => {
        try {
          chrome.storage.local.get(['pendingBookmark'], (result) => {
            if (chrome.runtime.lastError) {
              return resolve(null);
            }
            resolve(result ? result.pendingBookmark || null : null);
          });
        } catch {
          resolve(null);
        }
      });
    }

    async function setPending(bookmark) {
      if (!isContextValid()) return;
      return new Promise((resolve) => {
        try {
          chrome.storage.local.set({ pendingBookmark: bookmark }, resolve);
        } catch {
          resolve();
        }
      });
    }

    async function clearPending() {
      if (!isContextValid()) return;
      return new Promise((resolve) => {
        try {
          chrome.storage.local.remove(['pendingBookmark'], resolve);
        } catch {
          resolve();
        }
      });
    }

    return {
      getAll, getByConversation, save, update, remove, search,
      exportAll, importAll, getPending, setPending, clearPending,
      invalidateCache,
    };
  })();


  // =============================================================
  // MODULE: DOMHelpers
  // Resilient DOM queries for ChatGPT's changing structure
  // =============================================================
  const DOMHelpers = (() => {
    const CONVERSATION_SELECTORS = [
      '[data-testid^="conversation-turn"]',
      'article[data-scroll-anchor]',
      'div[data-message-id]',
      'main .group',
      'main',
    ];

    function findConversationElement(node) {
      let current = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
      while (current && current !== document.body) {
        for (const selector of CONVERSATION_SELECTORS) {
          try {
            if (current.matches(selector)) return current;
          } catch { /* invalid selector for this element */ }
        }
        current = current.parentElement;
      }
      return null;
    }

    function findScrollContainer() {
      const candidates = [
        document.querySelector('main .overflow-y-auto'),
        document.querySelector('main [class*="overflow-y"]'),
        document.querySelector('[role="presentation"] .overflow-y-auto'),
        document.querySelector('main')?.closest('[class*="overflow"]'),
        document.querySelector('main')?.parentElement,
      ];
      for (const el of candidates) {
        if (el && el.scrollHeight > el.clientHeight) return el;
      }
      return document.documentElement;
    }

    function extractChatTitle() {
      // Source 1: document title
      let title = document.title
        .replace(/\s*[\|–—-]\s*ChatGPT\s*$/i, '')
        .replace(/^ChatGPT\s*[\|–—-]\s*/i, '')
        .trim();
      if (title && title !== 'ChatGPT' && title.length > 0) return title;

      // Source 2: active nav item in sidebar
      const activeNav = document.querySelector('nav a[class*="bg-"]')
        || document.querySelector('nav li[class*="active"]');
      if (activeNav) {
        const navText = activeNav.textContent?.trim();
        if (navText && navText.length > 0) return navText;
      }

      return 'Untitled Conversation';
    }

    function extractContext(selectedText, container) {
      const fullText = container.innerText || container.textContent || '';
      const index = fullText.indexOf(selectedText);
      const contextLen = 50;
      const before = index > 0
        ? fullText.substring(Math.max(0, index - contextLen), index).trim()
        : '';
      const after = index >= 0
        ? fullText.substring(
            index + selectedText.length,
            Math.min(fullText.length, index + selectedText.length + contextLen)
          ).trim()
        : '';
      return { before, after };
    }

    function escapeHtml(text) {
      if (text === null || text === undefined) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    return { findConversationElement, findScrollContainer, extractChatTitle, extractContext, escapeHtml };
  })();


  // =============================================================
  // MODULE: UIManager
  // Creates and manages all injected UI elements
  // =============================================================
  const UIManager = (() => {
    let floatingIcon = null;
    let bookmarkButton = null;
    let bookmarkModal = null;
    let sidebar = null;
    let fabDebounce = false;

    // --- MutationObserver to re-inject FAB if React wipes it ---
    let fabObserver = null;

    function watchFAB() {
      if (fabObserver) return;
      fabObserver = new MutationObserver(() => {
        if (floatingIcon && !document.body.contains(floatingIcon)) {
          console.log('ChatGPT Bookmarks: FAB was removed, re-injecting');
          floatingIcon = null;
          injectFAB();
        }
      });
      fabObserver.observe(document.body, { childList: true, subtree: false });
    }

    // ----- Floating Action Button -----
    function injectFAB() {
      if (floatingIcon && document.body.contains(floatingIcon)) return;

      floatingIcon = document.createElement('div');
      floatingIcon.id = 'chatgpt-bookmark-icon';
      floatingIcon.setAttribute('role', 'button');
      floatingIcon.setAttribute('aria-label', 'Open bookmarks sidebar');
      floatingIcon.setAttribute('tabindex', '0');
      floatingIcon.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
      floatingIcon.title = 'ChatGPT Bookmarks';

      floatingIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        if (fabDebounce) return;
        fabDebounce = true;
        setTimeout(() => { fabDebounce = false; }, 300);
        toggleSidebar();
      });

      floatingIcon.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleSidebar();
        }
      });

      document.body.appendChild(floatingIcon);
      watchFAB();
      updateBadge();
    }

    // ----- Badge -----
    function updateBadge() {
      if (!floatingIcon) return;
      StorageManager.getByConversation(window.location.href)
        .then((bookmarks) => {
          let badge = floatingIcon.querySelector('.bookmark-badge');
          if (!bookmarks || bookmarks.length === 0) {
            if (badge) badge.remove();
            return;
          }
          if (!badge) {
            badge = document.createElement('span');
            badge.className = 'bookmark-badge';
            floatingIcon.appendChild(badge);
          }
          badge.textContent = bookmarks.length > 99 ? '99+' : bookmarks.length;
        })
        .catch((err) => {
          console.warn('ChatGPT Bookmarks: updateBadge error:', err);
        });
    }

    // ----- Bookmark Popup Button -----
    function showBookmarkButton(range, selectedText, conversationElement) {
      removeBookmarkButton();

      const rect = range.getBoundingClientRect();
      bookmarkButton = document.createElement('div');
      bookmarkButton.id = 'chatgpt-bookmark-button';
      bookmarkButton.textContent = '🔖 Bookmark';

      // Position near selection — clamp to viewport
      let left = rect.left;
      let top = rect.bottom + 6;

      // If too close to bottom, show above
      if (top + 40 > window.innerHeight) {
        top = rect.top - 40;
      }
      // Clamp horizontal
      left = Math.max(8, Math.min(left, window.innerWidth - 140));

      bookmarkButton.style.left = `${left}px`;
      bookmarkButton.style.top = `${top}px`;
      bookmarkButton.style.position = 'fixed';

      bookmarkButton.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const context = DOMHelpers.extractContext(selectedText, conversationElement);
        showBookmarkModal(selectedText, context);
      });

      document.body.appendChild(bookmarkButton);

      // Auto-dismiss on click elsewhere
      setTimeout(() => {
        if (bookmarkButton) {
          document.addEventListener('mousedown', onClickAwayButton);
        }
      }, 50);
    }

    function onClickAwayButton(e) {
      if (bookmarkButton && !bookmarkButton.contains(e.target)) {
        removeBookmarkButton();
      }
    }

    function removeBookmarkButton() {
      document.removeEventListener('mousedown', onClickAwayButton);
      if (bookmarkButton) {
        bookmarkButton.remove();
        bookmarkButton = null;
      }
    }

    // ----- Bookmark Modal -----
    function showBookmarkModal(selectedText, context) {
      removeBookmarkButton();
      closeBookmarkModal();

      bookmarkModal = document.createElement('div');
      bookmarkModal.id = 'chatgpt-bookmark-modal';
      bookmarkModal.setAttribute('role', 'dialog');
      bookmarkModal.setAttribute('aria-label', 'Create bookmark');

      const preview = selectedText.length > 100
        ? DOMHelpers.escapeHtml(selectedText.substring(0, 100)) + '…'
        : DOMHelpers.escapeHtml(selectedText);

      bookmarkModal.innerHTML = `
        <div class="bookmark-modal-content">
          <h3>🔖 Create Bookmark</h3>
          <input type="text" id="bookmark-name-input" placeholder="Enter a name for this bookmark…" maxlength="200" />
          <div class="bookmark-modal-preview">
            <strong>Selected text</strong>
            <p>${preview}</p>
          </div>
          <div class="bookmark-modal-buttons">
            <button id="bookmark-cancel-btn" type="button">Cancel</button>
            <button id="bookmark-save-btn" type="button" class="disabled" disabled>Save</button>
          </div>
        </div>
      `;

      document.body.appendChild(bookmarkModal);

      const input = document.getElementById('bookmark-name-input');
      const saveBtn = document.getElementById('bookmark-save-btn');
      const cancelBtn = document.getElementById('bookmark-cancel-btn');

      // Focus input
      setTimeout(() => input.focus(), 50);

      // Enable/disable save based on input
      input.addEventListener('input', () => {
        const hasValue = input.value.trim().length > 0;
        saveBtn.disabled = !hasValue;
        if (hasValue) {
          saveBtn.classList.remove('disabled');
        } else {
          saveBtn.classList.add('disabled');
        }
      });

      // Save handler
      const doSave = async () => {
        const name = input.value.trim();
        if (!name) return;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving…';
        try {
          await saveBookmark(name, selectedText, context);
          closeBookmarkModal();
          showToast('✅ Bookmark saved!');
        } catch (err) {
          showToast('❌ Failed to save bookmark');
          console.error('Save error:', err);
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save';
        }
      };

      saveBtn.addEventListener('click', doSave);
      cancelBtn.addEventListener('click', closeBookmarkModal);

      // Enter to save, Escape to cancel
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
          e.preventDefault();
          doSave();
        }
      });

      bookmarkModal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeBookmarkModal();
        }
      });

      // Click backdrop to close
      bookmarkModal.addEventListener('click', (e) => {
        if (e.target === bookmarkModal) {
          closeBookmarkModal();
        }
      });
    }

    function closeBookmarkModal() {
      if (bookmarkModal) {
        bookmarkModal.remove();
        bookmarkModal = null;
      }
    }

    // ----- Save Bookmark -----
    async function saveBookmark(name, selectedText, context) {
      const bookmark = {
        id: 'bm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11),
        name,
        chatUrl: window.location.href,
        chatTitle: DOMHelpers.extractChatTitle(),
        selectedText,
        context,
        createdAt: new Date().toISOString(),
      };
      await StorageManager.save(bookmark);
      updateBadge();
      if (sidebar && sidebar.classList.contains('open')) {
        loadBookmarksIntoSidebar();
      }
    }

    // ----- Toast Notifications -----
    function showToast(message, duration = 2500) {
      const toast = document.createElement('div');
      toast.className = 'chatgpt-bookmark-toast';
      toast.setAttribute('aria-live', 'polite');
      toast.textContent = message;

      // Stack toasts: offset by existing toast count
      const existingToasts = document.querySelectorAll('.chatgpt-bookmark-toast');
      const offset = existingToasts.length * 48;
      toast.style.bottom = `${24 + offset}px`;

      document.body.appendChild(toast);

      // Animate in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          toast.classList.add('show');
        });
      });

      // Auto-dismiss
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    // ----- Sidebar -----
    function toggleSidebar() {
      if (!sidebar) {
        createSidebar();
      }
      sidebar.classList.toggle('open');
      if (sidebar.classList.contains('open')) {
        loadBookmarksIntoSidebar();
      }
    }

    function closeSidebar() {
      if (sidebar) {
        sidebar.classList.remove('open');
      }
    }

    function isSidebarOpen() {
      return sidebar && sidebar.classList.contains('open');
    }

    function createSidebar() {
      if (sidebar && document.body.contains(sidebar)) return;

      sidebar = document.createElement('div');
      sidebar.id = 'chatgpt-bookmark-sidebar';
      sidebar.setAttribute('role', 'complementary');
      sidebar.setAttribute('aria-label', 'Bookmarks sidebar');

      sidebar.innerHTML = `
        <div class="sidebar-header">
          <h2>📚 Bookmarks</h2>
          <button id="sidebar-close-btn" aria-label="Close sidebar" title="Close">✕</button>
        </div>
        <div class="sidebar-search">
          <div class="sidebar-search-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" id="sidebar-search-input" placeholder="Search bookmarks…" />
            <button class="sidebar-search-clear" aria-label="Clear search">✕</button>
          </div>
        </div>
        <div class="sidebar-actions">
          <button id="sidebar-export-btn" title="Export bookmarks as JSON">📤 Export</button>
          <button id="sidebar-import-btn" title="Import bookmarks from JSON">📥 Import</button>
        </div>
        <div class="sidebar-content" id="sidebar-bookmarks-list">
          <div class="sidebar-loading">Loading bookmarks…</div>
        </div>
      `;

      document.body.appendChild(sidebar);

      // Wire close button
      document.getElementById('sidebar-close-btn').addEventListener('click', closeSidebar);

      // Wire search
      const searchInput = document.getElementById('sidebar-search-input');
      const clearBtn = sidebar.querySelector('.sidebar-search-clear');
      let searchTimeout = null;

      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const query = searchInput.value.trim();
        clearBtn.classList.toggle('visible', query.length > 0);
        searchTimeout = setTimeout(() => {
          loadBookmarksIntoSidebar(query);
        }, 100);
      });

      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.classList.remove('visible');
        loadBookmarksIntoSidebar();
        searchInput.focus();
      });

      // Wire export/import
      document.getElementById('sidebar-export-btn').addEventListener('click', handleExport);
      document.getElementById('sidebar-import-btn').addEventListener('click', handleImport);
    }

    // ----- Sidebar: Load & Render Bookmarks -----
    async function loadBookmarksIntoSidebar(searchQuery = '') {
      const listContainer = document.getElementById('sidebar-bookmarks-list');
      if (!listContainer) return;

      let bookmarks;
      try {
        bookmarks = searchQuery
          ? await StorageManager.search(searchQuery)
          : await StorageManager.getAll();
      } catch {
        listContainer.innerHTML = '<div class="sidebar-empty">Could not load bookmarks.</div>';
        return;
      }

      if (bookmarks.length === 0) {
        if (searchQuery) {
          listContainer.innerHTML = '<div class="sidebar-no-results">No matching bookmarks found.</div>';
        } else {
          listContainer.innerHTML = `
            <div class="sidebar-empty">
              No bookmarks yet.<br /><br />
              Select text in a conversation and click<br/>
              <strong>🔖 Bookmark</strong> to save it.
            </div>
          `;
        }
        return;
      }

      // Group by chatTitle
      const groups = new Map();
      const currentBase = window.location.href.split('?')[0].split('#')[0];

      bookmarks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      bookmarks.forEach((bm) => {
        const title = bm.chatTitle || 'Untitled Conversation';
        if (!groups.has(title)) {
          groups.set(title, { bookmarks: [], isCurrent: false });
        }
        groups.get(title).bookmarks.push(bm);
        // Check if this group is the current conversation
        const bmBase = bm.chatUrl.split('?')[0].split('#')[0];
        if (bmBase === currentBase) {
          groups.get(title).isCurrent = true;
        }
      });

      // Sort groups: current conversation first, then alphabetical
      const sortedGroups = [...groups.entries()].sort((a, b) => {
        if (a[1].isCurrent && !b[1].isCurrent) return -1;
        if (!a[1].isCurrent && b[1].isCurrent) return 1;
        return a[0].localeCompare(b[0]);
      });

      // Render
      const fragment = document.createDocumentFragment();

      sortedGroups.forEach(([title, group]) => {
        const groupEl = document.createElement('div');
        groupEl.className = 'conversation-group';

        const escapedTitle = DOMHelpers.escapeHtml(title);
        const count = group.bookmarks.length;
        const currentLabel = group.isCurrent ? ' (current)' : '';

        groupEl.innerHTML = `
          <div class="group-header" role="button" tabindex="0" aria-expanded="true">
            <span class="group-title" title="${escapedTitle}">${escapedTitle}${currentLabel}</span>
            <span class="group-count">${count}</span>
            <span class="group-toggle">▼</span>
          </div>
          <div class="group-items"></div>
        `;

        const header = groupEl.querySelector('.group-header');
        const items = groupEl.querySelector('.group-items');
        const toggle = groupEl.querySelector('.group-toggle');

        header.addEventListener('click', () => {
          const collapsed = items.classList.toggle('collapsed');
          toggle.classList.toggle('collapsed', collapsed);
          header.setAttribute('aria-expanded', !collapsed);
        });

        // Render bookmark items
        group.bookmarks.forEach((bm) => {
          const item = createBookmarkItem(bm, searchQuery);
          items.appendChild(item);
        });

        fragment.appendChild(groupEl);
      });

      listContainer.innerHTML = '';
      listContainer.appendChild(fragment);
    }

    function createBookmarkItem(bookmark, searchQuery = '') {
      const item = document.createElement('div');
      item.className = 'bookmark-item';
      item.dataset.bookmarkId = bookmark.id;

      let date = 'Unknown date';
      try {
        if (bookmark.createdAt) {
          const d = new Date(bookmark.createdAt);
          if (!isNaN(d.getTime())) {
            date = d.toLocaleDateString(undefined, {
              month: 'short', day: 'numeric', year: 'numeric',
            });
          }
        }
      } catch {}

      const rawText = bookmark.selectedText || '';
      const previewText = rawText.substring(0, 80) + (rawText.length > 80 ? '…' : '');
      const safeName = bookmark.name || 'Untitled Bookmark';

      const nameHtml = searchQuery
        ? highlightMatch(DOMHelpers.escapeHtml(safeName), searchQuery)
        : DOMHelpers.escapeHtml(safeName);
      const previewHtml = searchQuery
        ? highlightMatch(DOMHelpers.escapeHtml(previewText), searchQuery)
        : DOMHelpers.escapeHtml(previewText);

      item.innerHTML = `
        <div class="bookmark-item-header">
          <span class="bookmark-name" title="${DOMHelpers.escapeHtml(safeName)}">${nameHtml}</span>
          <div class="bookmark-item-actions">
            <button class="bookmark-edit-btn" title="Edit name" aria-label="Edit bookmark name">✎</button>
            <button class="bookmark-delete-btn" title="Delete" aria-label="Delete bookmark">🗑️</button>
          </div>
        </div>
        <div class="bookmark-preview">${previewHtml}</div>
        <div class="bookmark-date">${date}</div>
      `;

      // Click to navigate (Phase 3 will add full navigation)
      item.addEventListener('click', (e) => {
        if (e.target.closest('.bookmark-edit-btn') || e.target.closest('.bookmark-delete-btn')) return;
        BookmarkNavigator.handleBookmarkClick(bookmark);
      });

      // Delete
      item.querySelector('.bookmark-delete-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await StorageManager.remove(bookmark.id);
          showToast('🗑️ Bookmark deleted');
          updateBadge();
          loadBookmarksIntoSidebar(
            document.getElementById('sidebar-search-input')?.value?.trim() || ''
          );
        } catch {
          showToast('❌ Failed to delete bookmark');
        }
      });

      // Edit
      item.querySelector('.bookmark-edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        startInlineEdit(item, bookmark);
      });

      return item;
    }

    function startInlineEdit(item, bookmark) {
      const nameSpan = item.querySelector('.bookmark-name');
      const originalName = bookmark.name;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'bookmark-name-edit';
      input.value = originalName;
      input.maxLength = 200;

      nameSpan.replaceWith(input);
      input.focus();
      input.select();

      const finishEdit = async (save) => {
        const newName = input.value.trim();
        if (save && newName && newName !== originalName) {
          try {
            await StorageManager.update(bookmark.id, { name: newName });
            bookmark.name = newName;
            showToast('✅ Bookmark renamed');
          } catch {
            showToast('❌ Failed to rename');
          }
        }
        // Restore span
        const span = document.createElement('span');
        span.className = 'bookmark-name';
        span.title = bookmark.name;
        span.textContent = bookmark.name;
        input.replaceWith(span);
      };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          finishEdit(true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          finishEdit(false);
        }
      });

      input.addEventListener('blur', () => finishEdit(true));
    }

    function highlightMatch(html, query) {
      if (!query) return html;
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      return html.replace(regex, '<span class="bookmark-search-match">$1</span>');
    }

    // ----- Export / Import -----
    async function handleExport() {
      try {
        const all = await StorageManager.getAll();
        if (all.length === 0) {
          showToast('📭 No bookmarks to export');
          return;
        }
        const json = await StorageManager.exportAll();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `chatgpt-bookmarks-export-${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`📤 Exported ${all.length} bookmarks`);
      } catch (err) {
        showToast('❌ Export failed');
        console.error('Export error:', err);
      }
    }

    function handleImport() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          showToast('❌ File too large (max 5MB)');
          return;
        }

        try {
          const text = await file.text();
          const result = await StorageManager.importAll(text);
          let msg = `📥 Imported ${result.added} new bookmarks`;
          if (result.duplicates > 0) msg += ` (${result.duplicates} duplicates skipped)`;
          if (result.invalid > 0) msg += ` (${result.invalid} invalid skipped)`;
          showToast(msg);
          updateBadge();
          loadBookmarksIntoSidebar();
        } catch (err) {
          showToast(`❌ ${err.message}`);
          console.error('Import error:', err);
        }
      });
      input.click();
    }

    // ----- Quick Bookmark -----
    function quickBookmark() {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (!selectedText || selectedText.length < 5) {
        showToast('⚠️ Select text first (at least 5 characters)');
        return;
      }

      try {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const convElement = DOMHelpers.findConversationElement(container);

        if (!convElement) {
          showToast('⚠️ Select text inside a conversation');
          return;
        }

        const context = DOMHelpers.extractContext(selectedText, convElement);
        const autoName = selectedText.substring(0, 30) + (selectedText.length > 30 ? '…' : '');

        saveBookmark(autoName, selectedText, context).then(() => {
          showToast('⚡ Bookmark saved!');
        }).catch(() => {
          showToast('❌ Failed to save bookmark');
        });
      } catch {
        showToast('❌ Could not create bookmark');
      }
    }

    return {
      injectFAB, updateBadge, showBookmarkButton, removeBookmarkButton,
      showBookmarkModal, closeBookmarkModal, showToast,
      toggleSidebar, closeSidebar, isSidebarOpen,
      loadBookmarksIntoSidebar, quickBookmark,
    };
  })();


  // =============================================================
  // MODULE: SelectionManager
  // Handles text selection with debounce
  // =============================================================
  const SelectionManager = (() => {
    let debounceTimer = null;

    function start() {
      document.addEventListener('mouseup', onMouseUp);
    }

    function onMouseUp(e) {
      // Don't trigger if clicking inside our own UI
      if (e.target.closest('#chatgpt-bookmark-icon') ||
          e.target.closest('#chatgpt-bookmark-sidebar') ||
          e.target.closest('#chatgpt-bookmark-modal') ||
          e.target.closest('#chatgpt-bookmark-button')) {
        return;
      }

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => handleSelection(), 150);
    }

    function handleSelection() {
      UIManager.removeBookmarkButton();

      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (!selectedText || selectedText.length < 5) return;

      try {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const convElement = DOMHelpers.findConversationElement(container);

        if (!convElement) return;

        UIManager.showBookmarkButton(range, selectedText, convElement);
      } catch {
        // Selection may be invalid
      }
    }

    return { start };
  })();


  // =============================================================
  // MODULE: BookmarkNavigator
  // Finds text on page, scrolls to it, highlights it
  // =============================================================
  const BookmarkNavigator = (() => {

    function handleBookmarkClick(bookmark) {
      if (!bookmark || !bookmark.chatUrl) {
        UIManager.showToast('❌ Invalid bookmark');
        return;
      }
      if (!isValidChatGPTUrl(bookmark.chatUrl)) {
        UIManager.showToast('❌ Security error: Invalid chat URL');
        return;
      }
      const currentBase = window.location.href.split('?')[0].split('#')[0];
      const bookmarkBase = bookmark.chatUrl.split('?')[0].split('#')[0];

      if (currentBase === bookmarkBase) {
        navigateToBookmarkWithRetry(bookmark);
      } else {
        // Cross-conversation: send to background to navigate tab
        try {
          if (!isContextValid()) {
            notifyContextInvalidated();
            return;
          }
          chrome.runtime.sendMessage(
            { action: 'openBookmark', bookmark },
            () => {
              if (chrome.runtime.lastError) {
                UIManager.showToast('❌ Could not navigate. Please refresh the page.');
              }
            }
          );
        } catch {
          UIManager.showToast('❌ Extension error. Please refresh the page.');
        }
      }
    }

    // Retry up to 3 times with increasing delay (handles lazy-loaded content)
    function navigateToBookmarkWithRetry(bookmark, attempt = 1) {
      const element = findTextInPage(bookmark.selectedText, bookmark.context);

      if (element) {
        // Try to find and highlight the exact text, falling back to element highlight
        const exactRange = findExactTextRange(element, bookmark.selectedText);
        if (exactRange) {
          scrollToRange(exactRange);
          highlightRange(exactRange);
        } else {
          scrollToElement(element);
          highlightElement(element);
        }
      } else if (attempt < 3) {
        setTimeout(() => navigateToBookmarkWithRetry(bookmark, attempt + 1), 800 * attempt);
      } else {
        UIManager.showToast('⚠️ Could not find bookmarked text on this page');
      }
    }

    // Find a Range object covering the exact bookmarked text within an element
    function findExactTextRange(container, selectedText) {
      const normalizedSearch = normalizeText(selectedText);
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);

      // Collect all text nodes with their cumulative offsets
      const textNodes = [];
      let fullText = '';
      let node;
      while ((node = walker.nextNode())) {
        textNodes.push({ node, start: fullText.length });
        fullText += node.textContent;
      }

      if (textNodes.length === 0) return null;

      // Try to find the selected text in the concatenated text
      const normalizedFull = normalizeText(fullText);
      let matchIndex = normalizedFull.indexOf(normalizedSearch);

      // If normalized match found, map back to original positions
      if (matchIndex >= 0) {
        // Map normalized index back to original text positions
        const originalPositions = mapNormalizedToOriginal(fullText, matchIndex, normalizedSearch.length);
        if (originalPositions) {
          return createRangeFromPositions(textNodes, originalPositions.start, originalPositions.end);
        }
      }

      // Fallback: try raw text match
      let rawIndex = fullText.indexOf(selectedText);
      if (rawIndex >= 0) {
        return createRangeFromPositions(textNodes, rawIndex, rawIndex + selectedText.length);
      }

      // Fallback: try first line match
      const firstLine = selectedText.split('\n')[0]?.trim();
      if (firstLine && firstLine.length >= 10) {
        rawIndex = fullText.indexOf(firstLine);
        if (rawIndex >= 0) {
          return createRangeFromPositions(textNodes, rawIndex, rawIndex + firstLine.length);
        }
      }

      return null;
    }

    // Map a position in normalized text back to the original text
    function mapNormalizedToOriginal(original, normalizedStart, normalizedLength) {
      let normIdx = 0;
      let origStart = -1;
      let origEnd = -1;

      for (let i = 0; i < original.length && normIdx < normalizedStart + normalizedLength; i++) {
        const ch = original[i];
        const isWhitespace = /\s/.test(ch);

        // Skip extra whitespace (normalized collapses multiple spaces to one)
        if (isWhitespace && i > 0 && /\s/.test(original[i - 1])) {
          continue;
        }

        if (normIdx === normalizedStart) {
          origStart = i;
        }
        normIdx++;
        if (normIdx === normalizedStart + normalizedLength) {
          origEnd = i + 1;
          break;
        }
      }

      // Handle leading whitespace in original
      if (origStart === -1 && normalizedStart === 0) origStart = 0;

      if (origStart >= 0 && origEnd > origStart) {
        return { start: origStart, end: origEnd };
      }
      return null;
    }

    // Create a Range spanning from startOffset to endOffset in concatenated text nodes
    function createRangeFromPositions(textNodes, startOffset, endOffset) {
      try {
        const range = document.createRange();
        let startSet = false;

        for (const { node, start } of textNodes) {
          const nodeEnd = start + node.textContent.length;

          if (!startSet && startOffset >= start && startOffset < nodeEnd) {
            range.setStart(node, startOffset - start);
            startSet = true;
          }
          if (startSet && endOffset <= nodeEnd) {
            range.setEnd(node, endOffset - start);
            return range;
          }
          if (startSet && endOffset > nodeEnd) {
            range.setEnd(node, node.textContent.length);
          }
        }

        return startSet ? range : null;
      } catch {
        return null;
      }
    }

    function scrollToRange(range) {
      const rects = range.getClientRects();
      const firstRect = rects[0];
      if (!firstRect) {
        // Fallback to range's bounding rect
        const bounding = range.getBoundingClientRect();
        if (bounding.height > 0) {
          scrollToRect(bounding);
        }
        return;
      }
      scrollToRect(firstRect);
    }

    function scrollToRect(rect) {
      // Calculate where to scroll so the highlight is ~1/3 from the top
      const targetY = window.scrollY + rect.top - window.innerHeight / 3;

      // Try ChatGPT's scroll container first
      try {
        const scrollContainer = DOMHelpers.findScrollContainer();
        if (scrollContainer && scrollContainer !== document.documentElement) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const offset = rect.top - containerRect.top + scrollContainer.scrollTop;
          scrollContainer.scrollTo({
            top: offset - containerRect.height / 3,
            behavior: 'smooth',
          });
          return;
        }
      } catch { /* fall through */ }

      // Fallback: window scroll
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
    }

    function scrollToElement(element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      try {
        const scrollContainer = DOMHelpers.findScrollContainer();
        if (scrollContainer && scrollContainer !== document.documentElement) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const offset = elementRect.top - containerRect.top + scrollContainer.scrollTop;
          scrollContainer.scrollTo({
            top: offset - containerRect.height / 3,
            behavior: 'smooth',
          });
        }
      } catch { /* scrollIntoView already worked */ }
    }

    // Highlight the exact text range with overlay + temporary <mark> wrapping
    function highlightRange(range) {
      // 1. Create overlay highlights for each line rect
      const rects = range.getClientRects();
      const overlays = [];

      for (const rect of rects) {
        if (rect.width < 1 || rect.height < 1) continue;
        const overlay = document.createElement('div');
        overlay.className = 'chatgpt-bookmark-highlight';
        overlay.style.top = `${rect.top}px`;
        overlay.style.left = `${rect.left}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;
        document.body.appendChild(overlay);
        overlays.push(overlay);
      }

      // Animate all overlays
      requestAnimationFrame(() => {
        overlays.forEach(o => o.classList.add('pulse'));
      });

      // 2. Also wrap the text in a <mark> for a clear in-DOM highlight
      try {
        const mark = document.createElement('mark');
        mark.className = 'chatgpt-bookmark-mark';
        mark.style.cssText = 'background: rgba(255, 245, 157, 0.4) !important; border-radius: 2px !important; padding: 1px 0 !important; transition: background 0.5s ease !important;';
        range.surroundContents(mark);

        // Fade out the mark after 3 seconds
        setTimeout(() => {
          if (!mark.parentNode) return;
          mark.style.background = 'transparent';
          setTimeout(() => {
            // Unwrap: move children out and remove mark
            const parent = mark.parentNode;
            if (parent) {
              while (mark.firstChild) {
                parent.insertBefore(mark.firstChild, mark);
              }
              parent.removeChild(mark);
              parent.normalize(); // Merge adjacent text nodes
            }
          }, 500);
        }, 3000);
      } catch {
        // surroundContents fails if range spans multiple elements — that's OK, overlays still work
      }

      // Remove overlays after animation
      setTimeout(() => overlays.forEach(o => o.remove()), 2500);
    }

    // Fallback: highlight the entire container element
    function highlightElement(element) {
      const rect = element.getBoundingClientRect();
      const highlight = document.createElement('div');
      highlight.className = 'chatgpt-bookmark-highlight';
      highlight.style.top = `${rect.top}px`;
      highlight.style.left = `${rect.left}px`;
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;

      document.body.appendChild(highlight);
      requestAnimationFrame(() => highlight.classList.add('pulse'));

      const originalBg = element.style.backgroundColor;
      const originalTransition = element.style.transition;
      element.style.transition = 'background-color 0.3s ease';
      element.style.backgroundColor = 'rgba(255, 245, 157, 0.3)';

      setTimeout(() => {
        element.style.backgroundColor = originalBg;
        element.style.transition = originalTransition;
      }, 3000);

      setTimeout(() => highlight.remove(), 2500);
    }

    // Normalize whitespace for reliable text comparison
    function normalizeText(text) {
      return text.replace(/\s+/g, ' ').trim();
    }

    // Extract meaningful words from text (for word-sequence matching)
    function extractWords(text) {
      return text.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(w => w.length > 2);
    }

    function findTextInPage(selectedText, context) {
      const normalizedSearch = normalizeText(selectedText);
      const searchWords = extractWords(selectedText);

      console.log('ChatGPT Bookmarks: Searching for text...', {
        originalLength: selectedText.length,
        normalizedLength: normalizedSearch.length,
        wordCount: searchWords.length,
        first50chars: selectedText.substring(0, 50),
      });

      // Get all possible search targets
      const messageContainers = getMessageContainers();
      console.log('ChatGPT Bookmarks: Found', messageContainers.length, 'message containers');

      // Strategy 1: Exact normalized match in message containers
      let match = searchByNormalizedText(messageContainers, normalizedSearch, context);
      if (match) { console.log('ChatGPT Bookmarks: Found via Strategy 1 (normalized match in containers)'); return match; }

      // Strategy 2: First line / first sentence match
      const firstLine = normalizedSearch.split(/[.!?\n]/)[0]?.trim();
      if (firstLine && firstLine.length >= 10) {
        match = searchByNormalizedText(messageContainers, firstLine, context);
        if (match) { console.log('ChatGPT Bookmarks: Found via Strategy 2 (first sentence)'); return match; }
      }

      // Strategy 3: Word-sequence matching (first 8 significant words in order)
      if (searchWords.length >= 3) {
        const wordSequence = searchWords.slice(0, 8);
        match = searchByWordSequence(messageContainers, wordSequence);
        if (match) { console.log('ChatGPT Bookmarks: Found via Strategy 3 (word sequence)'); return match; }
      }

      // Strategy 4: Short substring match (first 40 chars, normalized)
      if (normalizedSearch.length > 40) {
        const shortSearch = normalizedSearch.substring(0, 40);
        match = searchByNormalizedText(messageContainers, shortSearch, null);
        if (match) { console.log('ChatGPT Bookmarks: Found via Strategy 4 (first 40 chars)'); return match; }
      }

      // Strategy 5: Full body scan with TreeWalker (last resort)
      match = searchFullBody(normalizedSearch, searchWords);
      if (match) { console.log('ChatGPT Bookmarks: Found via Strategy 5 (full body scan)'); return match; }

      console.warn('ChatGPT Bookmarks: Text not found with any strategy');
      return null;
    }

    // Get all conversation message containers
    function getMessageContainers() {
      // Try multiple selector strategies to find message elements
      const selectorSets = [
        '[data-testid^="conversation-turn"]',
        'article[data-scroll-anchor]',
        'div[data-message-id]',
        '[data-message-author-role]',
      ];

      for (const selector of selectorSets) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log('ChatGPT Bookmarks: Using selector:', selector, '→', elements.length, 'elements');
          return [...elements];
        }
      }

      // Fallback: grab broader containers from main
      const main = document.querySelector('main');
      if (main) {
        // Try to find any div that contains substantial text
        const allDivs = main.querySelectorAll('div');
        const messageDivs = [...allDivs].filter(div => {
          const text = div.innerText || '';
          // Message containers typically have >20 chars and are not too large (not the main container itself)
          return text.length > 20 && text.length < 10000 && div.children.length > 0;
        });
        if (messageDivs.length > 0) {
          console.log('ChatGPT Bookmarks: Using fallback div selection →', messageDivs.length, 'elements');
          return messageDivs;
        }
      }

      return [];
    }

    // Strategy: search by normalized text in containers
    function searchByNormalizedText(containers, normalizedSearch, context) {
      const candidates = [];

      for (const container of containers) {
        const rawText = container.innerText || container.textContent || '';
        const normalizedPageText = normalizeText(rawText);

        if (normalizedPageText.includes(normalizedSearch)) {
          candidates.push(container);
        }
      }

      if (candidates.length === 0) return null;

      // Try context matching to disambiguate
      if (context && (context.before || context.after)) {
        for (const el of candidates) {
          if (matchesContext(el, normalizedSearch, context)) return el;
        }
      }

      return candidates[0];
    }

    // Strategy: find container whose text contains words in sequence
    function searchByWordSequence(containers, words) {
      // Build a regex that matches the words in order with any whitespace/punctuation between them
      const pattern = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\S]{0,50}');
      let regex;
      try {
        regex = new RegExp(pattern, 'i');
      } catch {
        return null;
      }

      for (const container of containers) {
        const text = container.innerText || container.textContent || '';
        if (regex.test(text)) {
          return container;
        }
      }

      // Also try on the full body
      const bodyText = document.body.innerText || '';
      if (regex.test(bodyText)) {
        // Found in body but not in any container - try to narrow down
        return findNarrowestMatch(regex);
      }

      return null;
    }

    // Strategy: scan the full document body
    function searchFullBody(normalizedSearch, searchWords) {
      const bodyText = normalizeText(document.body.innerText || '');

      if (!bodyText.includes(normalizedSearch)) {
        // Even the full body doesn't have it - try word sequence on body
        if (searchWords.length >= 3) {
          const pattern = searchWords.slice(0, 5).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[\\s\\S]{0,50}');
          try {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(document.body.innerText || '')) {
              return findNarrowestMatch(regex);
            }
          } catch { /* invalid regex */ }
        }
        return null;
      }

      // Text is somewhere in the body — use TreeWalker to find the element
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null, false);
      let bestMatch = null;
      let bestLength = Infinity;

      let el;
      while ((el = walker.nextNode())) {
        const text = normalizeText(el.innerText || el.textContent || '');
        if (text.includes(normalizedSearch) && text.length < bestLength) {
          bestMatch = el;
          bestLength = text.length;
        }
      }

      return bestMatch;
    }

    // Find the narrowest (most specific) element matching a regex
    function findNarrowestMatch(regex) {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null, false);
      let bestMatch = null;
      let bestLength = Infinity;

      let el;
      while ((el = walker.nextNode())) {
        const text = el.innerText || el.textContent || '';
        if (regex.test(text) && text.length < bestLength && text.length > 20) {
          bestMatch = el;
          bestLength = text.length;
        }
      }

      return bestMatch;
    }

    // Check if an element's surrounding text matches the stored context
    function matchesContext(el, normalizedSearch, context) {
      const text = normalizeText(el.innerText || el.textContent || '');
      const index = text.indexOf(normalizedSearch);
      if (index < 0) return false;

      const beforeText = text.substring(Math.max(0, index - 100), index);
      const afterText = text.substring(
        index + normalizedSearch.length,
        Math.min(text.length, index + normalizedSearch.length + 100)
      );

      const normalizedBefore = context.before ? normalizeText(context.before) : '';
      const normalizedAfter = context.after ? normalizeText(context.after) : '';

      const beforeMatch = !normalizedBefore ||
        beforeText.includes(normalizedBefore.substring(0, Math.min(20, normalizedBefore.length)));
      const afterMatch = !normalizedAfter ||
        afterText.includes(normalizedAfter.substring(0, Math.min(20, normalizedAfter.length)));

      return beforeMatch && afterMatch;
    }

    function checkPendingNavigation() {
      StorageManager.getPending().then((pending) => {
        if (!pending) return;

        // Check if stale (>60 seconds old)
        if (pending.createdAt) {
          const age = Date.now() - new Date(pending.createdAt).getTime();
          if (age > 60000) {
            console.log('ChatGPT Bookmarks: Clearing stale pending bookmark');
            StorageManager.clearPending();
            return;
          }
        }

        // Wait for conversation content to load
        let attempts = 0;
        const maxAttempts = 30; // 15 seconds
        const interval = setInterval(() => {
          attempts++;
          const main = document.querySelector('main');
          const hasContent = main && main.innerText.length > 100;
          // Also check for message containers
          const hasMessages = document.querySelector(
            '[data-testid^="conversation-turn"], article[data-scroll-anchor], div[data-message-id]'
          );
          if (hasContent || hasMessages) {
            clearInterval(interval);
            // Wait a bit more for full render
            setTimeout(() => {
              navigateToBookmarkWithRetry(pending);
              StorageManager.clearPending();
            }, 1500);
          } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            UIManager.showToast('⏱️ Navigation timed out. Try scrolling to load older messages.');
            StorageManager.clearPending();
          }
        }, 500);
      });
    }

    return { handleBookmarkClick, navigateToBookmarkWithRetry, checkPendingNavigation };
  })();


  // =============================================================
  // MODULE: MessageHandler
  // Receives commands from the background script
  // =============================================================
  const MessageHandler = (() => {
    function init() {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        try {
          switch (request.action) {
            case 'toggleSidebar':
              UIManager.toggleSidebar();
              sendResponse({ success: true });
              break;

            case 'quickBookmark':
              UIManager.quickBookmark();
              sendResponse({ success: true });
              break;

            case 'navigateToBookmark':
              if (request.bookmark) {
                BookmarkNavigator.navigateToBookmarkWithRetry(request.bookmark);
              }
              sendResponse({ success: true });
              break;

            default:
              return false;
          }
        } catch (err) {
          console.error('ChatGPT Bookmarks: Message handler error:', err);
          sendResponse({ success: false, error: err.message });
        }
        return true;
      });
    }

    return { init };
  })();


  // =============================================================
  // GLOBAL: Escape key handler
  // =============================================================
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close modal first, then sidebar
      const modal = document.getElementById('chatgpt-bookmark-modal');
      if (modal) {
        UIManager.closeBookmarkModal();
        e.preventDefault();
        return;
      }
      if (UIManager.isSidebarOpen()) {
        UIManager.closeSidebar();
        e.preventDefault();
      }
    }
  });


  // =============================================================
  // INIT
  // =============================================================
  function init() {
    console.log('ChatGPT Bookmarks: Initializing (Phase 2)');

    // Start SPA observer
    SPAObserver.start();

    // On URL change: update badge, refresh sidebar, check pending nav
    SPAObserver.onUrlChange(() => {
      UIManager.updateBadge();
      if (UIManager.isSidebarOpen()) {
        UIManager.loadBookmarksIntoSidebar();
      }
      BookmarkNavigator.checkPendingNavigation();
    });

    // Start selection listener
    SelectionManager.start();

    // Inject floating action button
    UIManager.injectFAB();

    // Set up message handler
    MessageHandler.init();

    // Check for pending navigation (from cross-conversation click)
    BookmarkNavigator.checkPendingNavigation();
  }

  // Run init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
