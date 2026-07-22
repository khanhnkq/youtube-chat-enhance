# YouTube Chat Enhance 🚀

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Performance](https://img.shields.io/badge/Performance-60FPS%20Canvas-ff0055.svg)](#-supercharged-performance-60fps)

> **YouTube Chat Enhance** is a high-performance **Chrome Extension (Manifest V3)** designed to revolutionize your YouTube live stream and video watching experience. Features include **60FPS Hardware-Accelerated Danmaku Bullet Comments**, **Transparent Floating Chat Overlays**, **Real-time Live Color & Opacity Styling**, and **Auto-Hide Native Chat in Fullscreen Mode**.

---

## 📸 Screenshots & Live Demos

| 🎆 Danmaku Bullet Comments Mode (60FPS) | 💬 Transparent Floating Overlay Mode |
| :---: | :---: |
| ![Danmaku Mode](https://raw.githubusercontent.com/khanhnkq/youtube-chat-enhance/main/assets/danmaku-demo.jpg) | ![Floating Overlay](https://raw.githubusercontent.com/khanhnkq/youtube-chat-enhance/main/assets/floating-demo.jpg) |

---

## ✨ Key Features

### 1. 🎆 60FPS Hardware-Accelerated Danmaku (Bullet Screen Comments)
- **On-Screen Flying Comments**: Streams live chat messages horizontally across your video from right to left in real-time (Bilibili / Niconico style).
- **GPU-Accelerated HTML5 Canvas 2D Engine**: Zero DOM thrashing or layout reflows! Runs at smooth **60FPS** even during high-volume VTuber debuts and eSports tournaments (CS2, LoL, PUBG, Valorant).
- **Smart Track Allocation**: Intelligent line-collision algorithms ensure comments never overlap awkwardly.
- **Customizable Appearance**: Customize text speed (4s - 20s), font size (14px - 38px), opacity, text color, outline stroke, and display area (Top 1/3, Top 50%, Top 75%, or Fullscreen).

### 2. 💬 Transparent Floating Chat Overlay
- **Direct Video Overlay**: Floating transparent live chat rendered over your video in both Fullscreen and Theatre mode.
- **Frameless & Borderless**: Eliminates dark headers, black bars, and unnecessary borders for a 100% clean video view.
- **Hover-to-Type Interface**: The chat stays transparent while watching. Hovering over the overlay gracefully fades in the input box, drag handle, and resize controls (`opacity: 1`) to let you send messages or SuperChats smoothly.

### 3. 🎛️ Real-time Customization Control Panel
- **Draggable & Resizable**: Drag the title bar to position the chat box anywhere over your video. Resize from the bottom-right handle.
- **Minimized Floating Badge (`Live Chat`)**: Collapse the chat into a small, elegant badge at the corner of your video with one click.
- **Auto-Hide Native Chat in Fullscreen**: Automatically hides YouTube's native side chat in Fullscreen mode to expand the video player to 100% full screen width, restoring the original layout when exiting.
- **Live Color & Styling Pickers**: Adjust username colors, chat message colors, background blur, and background opacity in real-time with **0ms instant live apply**.

### ⚡ 4. Zero-Lag Performance Architecture
- **0ms Realtime State Sync**: Uses `chrome.storage.onChanged` to broadcast instant style changes across all frames without requiring F5 page reloads.
- **Batch IPC Messaging**: Batches high-volume incoming chat messages into 80ms buffers to reduce cross-frame IPC postMessage overhead by over 90%.

---

## 📦 Installation Guide

1. **Clone or Download the Repository:**
   ```bash
   git clone https://github.com/khanhnkq/youtube-chat-enhance.git
   ```
2. **Load into Google Chrome (or Brave / Edge / Arc):**
   - Open your browser and navigate to `chrome://extensions/`
   - Enable **Developer mode** using the toggle in the top-right corner.
   - Click **Load unpacked**.
   - Select the `youtube-chat-enhance` project folder.
3. **Enjoy!** Open any YouTube Live Stream or Video, and click the Extension icon in the toolbar to customize your experience.

---

## 📂 Project Structure

```
youtube-chat-enhance/
├── manifest.json         # Manifest V3 Extension Configuration
├── popup/
├── popup/popup.html      # Ultra-Clean Dark Glassmorphic Control Panel
├── popup/popup.css       # Neon Accents & Glassmorphism Styling
└── popup/popup.js        # Realtime Storage & Message Dispatcher
├── content/
├── content/chat-injector.js  # Main Content Script for YouTube Watch/Live Pages
├── content/chat-iframe.js    # Live Chat Iframe Parser & IPC Batcher
├── content/draggable-box.js  # Drag, Resize & Compositor Layer Manager
├── content/danmaku-engine.js # 60FPS Hardware-Accelerated HTML5 Canvas 2D Engine
└── content/overlay.css       # Clean Layout, Frameless Overlay & Fullscreen Expansion Rules
├── icons/                # High-Res Icons (icon.svg, 16px, 48px, 128px PNGs)
└── README.md             # Project Documentation
```

---

## 📝 License & Author

- **Author:** [khanhnkq](https://github.com/khanhnkq)
- **License:** MIT License. Pull Requests and Contributions are always welcome!
