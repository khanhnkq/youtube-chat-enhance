# YouTube Custom Chat & Danmaku - Chrome Web Store Listing Metadata

**Last Updated:** 2026-07-22  
**Extension Version:** 1.2.0  
**Manifest Version:** Manifest V3  

---

## 1. Store Metadata

- **Extension Name:** YouTube Custom Chat & Danmaku
- **Short Description:** Customize YouTube live chat: Transparent floating overlay on video, draggable & resizable window, and Danmaku mode (scrolling comments).
- **Category:** Entertainment / Productivity
- **Language:** English (Primary)

---

## 2. Detailed Description

Elevate your YouTube livestream and video watching experience with this feature-packed live chat customizer extension:

✨ **KEY FEATURES:**
1. **Transparent Floating Chat Overlays Video:**
   - Displays the live chat box directly over the video player during Fullscreen or Theatre Mode.
   - Adjust background opacity smoothly from 100% transparent (0%) to frosted glass (Glassmorphism 100%).
2. **Draggable & Resizable Floating Box:**
   - Drag and drop to position the chat window anywhere over the video player.
   - Resize width and height easily using the bottom-right corner resize handle.
   - Automatically saves and restores your custom window position and dimensions for future viewing.
3. **Danmaku Mode (On-Screen Flying Comments):**
   - Stream live chat comments smoothly across your video right-to-left in real-time (Bilibili / Douyu style).
   - Customize comment scroll speed (4s - 20s), font size (14px - 38px), text opacity, stroke outline, shadow, and display area (Top 1/3, Top Half, Top 3/4, or Fullscreen).

---

## 3. Permissions Justification

| Permission / Host Permission | Purpose / Justification |
| --- | --- |
| `storage` | Save user preferences (chat window position/size, opacity, Danmaku speed & font size). |
| `https://www.youtube.com/*` | Inject content scripts to customize YouTube live chat layout and render Danmaku canvas over video player. |

---

## 4. Privacy & Data Disclosures

- **Data Collection:** The extension does **NOT** collect, track, store, or transmit any user personal data or browsing activity.
- **Local State:** All user preferences and visual configurations are stored locally in the browser via `chrome.storage.local`.
