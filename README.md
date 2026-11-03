# 🔖 ChatGPT Bookmarker

> **Bookmark specific answers, code snippets, or ideas in ChatGPT conversations and jump right back to them with instant auto-scroll & text highlighting.**

[![Chrome Extension](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-blue?logo=googlechrome&logoColor=white)](#-installation--quick-start-guide)
[![GitHub stars](https://img.shields.io/github/stars/tkvp023/Chatgpt-bookmarker?style=social)](https://github.com/tkvp023/Chatgpt-bookmarker)
[![Dependencies](https://img.shields.io/badge/Dependencies-0_(Vanilla_JS)-success)](#-technical-details)
[![Privacy](https://img.shields.io/badge/Privacy-100%25_Offline_%2F_No_Tracking-brightgreen)](#-privacy--security)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Overview

ChatGPT conversations can easily span hundreds of prompts and long code responses. Standard browser bookmarks only link to the conversation URL, forcing you to scroll endlessly to find that one specific regex, code snippet, or explanation.

**ChatGPT Bookmarker** solves this by letting you highlight and bookmark **exact text segments** within any ChatGPT chat. Whenever you need that snippet, just click the bookmark: the extension automatically navigates to the conversation, scrolls directly to the element, and highlights the bookmarked text in yellow.

---

## 🚀 Quick Start Guide: How to Try It (2-Minute Setup)

Follow these easy steps to get the extension running in Chrome or any Chromium-based browser (Brave, Edge, Opera, Vivaldi).

### Step 1: Clone or Download the Repository

Open your terminal and run:

```bash
git clone https://github.com/tkvp023/Chatgpt-bookmarker.git
```

> 💡 **Prefer a ZIP file?**  
> Click the green **Code** button at the top of this GitHub repo, select **Download ZIP**, and extract it anywhere on your computer.

---

### Step 2: Open Extensions in Google Chrome

1. Open **Google Chrome** (or Edge/Brave).
2. Enter this URL into your browser address bar:
   ```text
   chrome://extensions
   ```
   *(For Edge: `edge://extensions` | For Brave: `brave://extensions`)*

---

### Step 3: Enable Developer Mode

Locate the **Developer mode** toggle switch in the **top-right corner** of the Extensions page and turn it **ON**.

```
+-------------------------------------------------------------+
| Extensions                                  [Developer mode: ON] |
+-------------------------------------------------------------+
```

---

### Step 4: Load the Extension

1. Click the **"Load unpacked"** button in the top-left corner.
2. In the file picker dialog, select the **`bookmark-for-gpt`** folder (the folder containing `manifest.json`).
3. You will now see **ChatGPT Bookmarks** listed among your extensions!

---

### Step 5: Test Drive on ChatGPT

1. Head over to **[chatgpt.com](https://chatgpt.com)** (or refresh any existing ChatGPT tab).
2. Look at the right edge of your browser window — you will see a subtle **green bookmark button** pinned to the side.

#### 🎯 Try your first bookmark in 3 easy actions:
- **Save a selection**: Highlight any sentence or code block with your mouse (minimum 5 characters). A floating **"🔖 Bookmark"** pill will appear above your selection. Click it, type a name, and press **Enter** (or simply select text and press `Ctrl+Shift+B` / `Cmd+Shift+B` for instant quick-save).
- **Open your bookmarks**: Click the floating green bookmark tab on the right side of the screen, or press `Ctrl+Shift+K` (Mac: `Cmd+Shift+K`).
- **Jump & Highlight**: In the sidebar panel, click your bookmark. The page will immediately auto-scroll to the exact paragraph and illuminate it with a smooth yellow highlight!

---

## ✨ Features at a Glance

| Feature | What It Does |
|---|---|
| 🎯 **Text-Level Precision** | Bookmark exact paragraphs, lists, explanations, or code blocks — not just the chat URL. |
| ⚡ **Instant Quick Bookmark** | Select any text and press `Ctrl+Shift+B` (`Cmd+Shift+B`) to instantly bookmark without interrupting your flow. |
| 🧭 **Cross-Chat Navigation** | Click any bookmark from the sidebar, even if it belongs to a different conversation; the extension automatically loads the chat and scrolls to the exact point. |
| 🗂️ **Organized by Conversation** | Bookmarks are cleanly grouped by conversation title with collapsible sections and count badges. |
| 🔍 **Live Search & Filter** | Instantly find saved snippets by searching through bookmark titles or excerpt text in real time. |
| 🎨 **Dark-Mode Native Sidebar** | A sleek, collapsible sidebar built to seamlessly blend with ChatGPT's interface. |
| ✏️ **Rename & Manage** | Edit bookmark titles inline, delete outdated snippets, or clear groups with single clicks. |
| 💾 **JSON Export & Import** | Easily back up your bookmarks or transfer them between devices and browser profiles. |
| 🛡️ **100% Offline & Private** | Zero analytics, zero external network requests, zero third-party scripts. |

---

## ⌨️ Keyboard Shortcuts

| Action | Windows / Linux | macOS |
|---|---|---|
| **Quick Bookmark** (save selected text immediately) | `Ctrl + Shift + B` | `Cmd + Shift + B` |
| **Toggle Sidebar** (open/close bookmarks panel) | `Ctrl + Shift + K` | `Cmd + Shift + K` |
| **Save Bookmark** (in popup modal) | `Enter` | `Enter` / `Return` |
| **Close Modal or Sidebar** | `Escape` | `Escape` |

> ⚙️ *Want custom keys? Go to `chrome://extensions/shortcuts` in your browser to rebind them.*

---

## 🖥️ User Guide & Detailed Usage

### 1. Creating Bookmarks
1. Select any portion of an answer or prompt (minimum 5 characters).
2. Click the floating **"🔖 Bookmark"** button next to your cursor.
3. Give your bookmark an optional memorable label (e.g., *"FastAPI JWT Auth Implementation"*).
4. Hit **Save** (or press `Enter`). A toast notification will confirm the bookmark is saved.

### 2. Viewing and Searching Bookmarks
- Click the floating bookmark handle on the right or press `Ctrl+Shift+K`.
- Use the search bar at the top of the sidebar to filter bookmarks across all conversations in real time.

### 3. Navigating to a Saved Spot
- **Same Conversation**: Simply click the bookmark in the sidebar. The page will smoothly scroll down or up and highlight the target text with an animated pulse.
- **Different Conversation**: Click a bookmark saved under a different chat. The extension will automatically route the tab to that chat, wait for messages to render, and bring your target into view.

### 4. Backing Up & Transferring Bookmarks
- Open the sidebar and click **Export** at the bottom to download a `.json` backup file.
- On another browser or profile, open the sidebar, click **Import**, and select the `.json` file to merge your bookmarks seamlessly.

---

## 📁 Project Structure

```
Chatgpt-bookmarker/
├── manifest.json       # Manifest V3 extension configuration & permissions
├── background.js       # Service worker (tab switching, cross-chat coordination)
├── content.js          # Core content script (SPA observer, DOM search, UI sidebar)
├── styles.css          # Sleek styling & animations for toolbar, modal & sidebar
├── icons/              # Extension icons (16x16, 48x48, 128x128)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── DOCS/               # Detailed technical documentation & design specs
│   ├── architecture.md
│   ├── TRD.md
│   ├── implementation_plan.md
│   ├── edgecases.md
│   ├── TESTING.md
│   └── CHANGELOG.md
├── LICENSE             # MIT License
└── README.md           # Project documentation & quick start guide
```

---

## 🔒 Privacy & Security

- **Zero Data Collection**: No user data, conversation content, or telemetry is collected, stored remotely, or transmitted.
- **Completely Offline**: All bookmarks, labels, and metadata stay strictly on your device inside Chrome's sandboxed `chrome.storage.local`.
- **No Third-Party Scripts**: Built with 100% vanilla JavaScript and CSS — no external CDNs, trackers, or dependencies.
- **Strict Host Scope**: Only operates on `chatgpt.com` and `chat.openai.com`.

---

## 🌐 Compatibility

| Browser | Support | Notes |
|---|---|---|
| **Google Chrome** | ✅ Supported | Version 110+ (Manifest V3) |
| **Brave Browser** | ✅ Supported | Full compatibility |
| **Microsoft Edge** | ✅ Supported | Full compatibility |
| **Opera / Opera GX** | ✅ Supported | Full compatibility |
| **Vivaldi** | ✅ Supported | Full compatibility |
| **Mozilla Firefox** | ⏳ In Progress | MV3 storage & background script migration |

---

## 🤝 Contributing

Contributions, feature requests, and bug reports are welcome!
1. Fork the Project (`https://github.com/tkvp023/Chatgpt-bookmarker/fork`)
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m "Add AmazingFeature"`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.
