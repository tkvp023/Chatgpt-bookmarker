# 🔖 ChatGPT Bookmarks

> Bookmark specific parts of ChatGPT conversations and jump back to them instantly.

![Chrome](https://img.shields.io/badge/Chrome-110%2B-brightgreen?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Dependencies](https://img.shields.io/badge/Dependencies-0-orange)

---

## The Problem

ChatGPT conversations grow long — hundreds of messages deep. Finding a specific answer, code snippet, or insight means endless scrolling. Browser bookmarks save the page, but not the *specific text* you need.

## The Solution

**ChatGPT Bookmarks** lets you select any text in a ChatGPT conversation, save it as a named bookmark, and jump back to it instantly — even across different conversations and browser sessions.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔖 **Text-Level Bookmarks** | Select any text → name it → save. Bookmark specific answers, code, and insights |
| 📚 **Sidebar Panel** | Browse all your bookmarks in a clean, dark-themed sidebar |
| 🔍 **Search & Filter** | Find bookmarks instantly by name or content |
| 📁 **Conversation Grouping** | Bookmarks organized by chat, with collapsible groups |
| 🎯 **Smart Navigation** | Click a bookmark → auto-scroll & highlight the exact text |
| 🔄 **Cross-Conversation** | Jump to bookmarks in any conversation — it navigates there automatically |
| ⌨️ **Keyboard Shortcuts** | `Ctrl+Shift+B` quick-save, `Ctrl+Shift+K` toggle sidebar |
| ✏️ **Inline Editing** | Rename bookmarks directly in the sidebar |
| 📤 **Export / Import** | Back up your bookmarks as JSON, import them anywhere |
| 🏷️ **Badge Count** | See how many bookmarks are in the current conversation |

---

## 📦 Installation

### From Source (Developer Mode)

1. **Download or clone** this repository:
   ```bash
   git clone https://github.com/yourusername/bookmark-for-gpt.git
   ```

2. **Open Chrome Extensions**:
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right)

3. **Load the extension**:
   - Click **"Load unpacked"**
   - Select the `bookmark-for-gpt` folder

4. **Pin the extension** (optional):
   - Click the puzzle icon in Chrome's toolbar
   - Pin "ChatGPT Bookmarks"

5. **Open ChatGPT**:
   - Go to [chatgpt.com](https://chatgpt.com)
   - You should see a green bookmark icon on the right side of the page

### From Chrome Web Store

> Coming soon!

---

## 🚀 Usage

### Creating a Bookmark

1. **Select text** in any ChatGPT conversation (minimum 5 characters)
2. A **"🔖 Bookmark"** button appears near your selection
3. Click it → enter a **name** → click **Save**
4. ✅ Done! A toast notification confirms the save

### Quick Bookmark (Keyboard)

1. **Select text** you want to bookmark
2. Press **`Ctrl+Shift+B`**
3. ✅ Bookmark saved instantly with an auto-generated name

### Viewing Bookmarks

- Click the **green bookmark icon** on the right side of the page
- Or press **`Ctrl+Shift+K`**
- The sidebar opens with all your bookmarks, grouped by conversation

### Navigating to a Bookmark

- **Same conversation**: Click a bookmark → page scrolls to the text and highlights it in yellow
- **Different conversation**: Click a bookmark → page navigates to that chat → scrolls to and highlights the text

### Searching Bookmarks

- Open the sidebar
- Type in the **search bar** at the top
- Bookmarks filter in real-time by name and content

### Editing a Bookmark

- Hover over a bookmark in the sidebar
- Click the **✎ edit** icon
- Type the new name → press **Enter**

### Deleting a Bookmark

- Hover over a bookmark in the sidebar
- Click the **🗑️ delete** icon
- Bookmark is removed and a toast confirms

### Export / Import

- **Export**: Click the **Export** button in the sidebar → downloads a `.json` file
- **Import**: Click the **Import** button → select a `.json` file → bookmarks are merged in

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+B` | Quick-bookmark selected text |
| `Ctrl+Shift+K` | Toggle bookmarks sidebar |
| `Escape` | Close modal or sidebar |
| `Enter` | Save bookmark (in modal) / Confirm edit (in sidebar) |

> **Customize shortcuts**: Go to `chrome://extensions/shortcuts` to change the default key bindings.

---

## 🔧 Technical Details

| Detail | Value |
|---|---|
| Manifest Version | V3 |
| Permissions | `storage`, `tabs`, `activeTab`, `scripting` |
| Host Permissions | `chatgpt.com`, `chat.openai.com` |
| External Dependencies | **None** (zero libraries, pure vanilla JS/CSS) |
| Storage | `chrome.storage.local` (10MB limit) |
| Network Requests | **None** (fully offline, no data sent anywhere) |

---

## 🌐 Browser Compatibility

| Browser | Supported | Notes |
|---|---|---|
| Google Chrome | ✅ 110+ | Primary target |
| Microsoft Edge | ✅ 110+ | Chromium-based |
| Brave | ✅ 1.50+ | Chromium-based |
| Opera | ✅ 96+ | Chromium-based |
| Firefox | ❌ | Not supported (Manifest V3 differences) |
| Safari | ❌ | Not supported |

---

## 🔒 Privacy

- **No data collection**: The extension does not collect, transmit, or share any data
- **No network requests**: The extension works entirely offline
- **Local storage only**: All bookmarks are stored locally in your browser using `chrome.storage.local`
- **No analytics**: No tracking, no telemetry, no cookies
- **No account required**: Works immediately after installation
- **Open source**: All code is inspectable

---

## 🐛 Known Limitations

1. **Lazy-loaded messages**: Very long conversations may not have all messages in the DOM. If your bookmarked text is in an older, unloaded message, you may need to scroll up to load it first
2. **Regenerated responses**: If you regenerate a ChatGPT response after bookmarking text from it, the bookmark can no longer find the original text
3. **Conversation branching**: Bookmarks are tied to the visible response branch at the time of creation
4. **Dark theme only**: The extension UI uses a dark theme regardless of ChatGPT's theme setting (light theme support planned)

---

## ❓ FAQ

**Q: Where are my bookmarks stored?**
A: Locally in your browser, using Chrome's `chrome.storage.local`. They persist across browser sessions but are tied to your browser profile.

**Q: Can I sync bookmarks across devices?**
A: Not yet. You can use Export/Import to manually transfer bookmarks between devices.

**Q: What happens if I clear my browser data?**
A: If you select "Clear browsing data → All time", your bookmarks may be deleted. Use Export to back them up first.

**Q: Does this work on the ChatGPT mobile app?**
A: No, this is a Chrome desktop extension only.

**Q: Will this work after ChatGPT updates their website?**
A: The extension uses resilient selectors with fallback chains, so minor UI updates shouldn't break it. Major redesigns may require an extension update.

**Q: How many bookmarks can I save?**
A: The storage limit is 10MB. With typical bookmark sizes, this supports thousands of bookmarks. The extension warns you at 80% capacity.

---

## 📂 Project Structure

```
bookmark-for-gpt/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (message handling, tab management)
├── content.js             # Content script (UI, bookmarking, navigation)
├── styles.css             # All extension styling
├── icons/
│   ├── icon128.png        # Extension icon (128x128)
│   └── icon48.png         # Extension icon (48x48)
└── docs/
    ├── problemstatement.md
    ├── architecture.md
    ├── implementation_plan.md
    ├── edgecases.md
    ├── TRD.md
    ├── TESTING.md
    ├── CHANGELOG.md
    └── README.md
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- Built for the ChatGPT community
- Inspired by the frustration of losing great answers in long conversations
- Zero dependencies, privacy-first approach
