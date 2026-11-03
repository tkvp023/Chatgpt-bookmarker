// ChatGPT Bookmarks Extension — Background Service Worker
// Phase 1: Message handling, toolbar icon, keyboard shortcuts

// ============================================================
// Message Listener — handles messages from content script
// ============================================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'openBookmark':
      handleOpenBookmark(request.bookmark, sender.tab)
        .then(() => sendResponse({ success: true }))
        .catch((err) => {
          console.error('ChatGPT Bookmarks: openBookmark error:', err);
          sendResponse({ success: false, error: err.message });
        });
      return true; // Keep message channel open for async response

    case 'getBookmarks':
      chrome.storage.local.get(['bookmarks'], (result) => {
        sendResponse({ bookmarks: result.bookmarks || [] });
      });
      return true;

    default:
      return false;
  }
});

// ============================================================
// Toolbar Icon Click — toggle sidebar in active tab
// ============================================================
chrome.action.onClicked.addListener((tab) => {
  sendToTab(tab.id, 'toggleSidebar');
});

// ============================================================
// Keyboard Shortcuts — route commands to content script
// ============================================================
chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case 'quick-bookmark':
      sendToActiveTab('quickBookmark');
      break;
    case 'toggle-sidebar':
      sendToActiveTab('toggleSidebar');
      break;
  }
});

// ============================================================
// handleOpenBookmark — cross-conversation navigation
// ============================================================
// Stores the bookmark as pending, then navigates the tab to
// the bookmark's chat URL. The content script on the new page
// will pick up the pending bookmark and scroll to the text.
// ============================================================
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

async function handleOpenBookmark(bookmark, senderTab) {
  if (!bookmark || !isValidChatGPTUrl(bookmark.chatUrl)) {
    throw new Error('Security Error: Invalid ChatGPT URL');
  }

  // Store the pending bookmark for the content script to pick up
  await chrome.storage.local.set({ pendingBookmark: bookmark });

  // Navigate the sender tab to the bookmark's conversation URL
  if (senderTab && senderTab.id) {
    await chrome.tabs.update(senderTab.id, { url: bookmark.chatUrl });
  } else {
    // Fallback: open in a new tab
    await chrome.tabs.create({ url: bookmark.chatUrl });
  }
}

// ============================================================
// Helper: Send a message to a specific tab
// ============================================================
function sendToTab(tabId, action, data = {}) {
  chrome.tabs.sendMessage(tabId, { action, ...data }).catch((err) => {
    // Content script may not be loaded yet — this is expected on non-ChatGPT pages
    console.warn('ChatGPT Bookmarks: Could not send message to tab:', err.message);
  });
}

// ============================================================
// Helper: Send a message to the active tab in the current window
// ============================================================
function sendToActiveTab(action, data = {}) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      sendToTab(tabs[0].id, action, data);
    }
  });
}
