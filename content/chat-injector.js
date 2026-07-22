(function () {
  'use strict';

  console.log('[YT Chat Extension] Injector script loaded.');

  let currentConfig = {
    enableFloatingChat: true,
    enableDanmaku: true,
    hideHeaderAndBorder: true,
    bgOpacity: 20,
    bgBlur: 10,
    chatFontSize: 14,
    danmakuSpeed: 10,
    danmakuFontSize: 22,
    danmakuOpacity: 90,
    danmakuArea: '0.5'
  };

  let initialized = false;

  async function initExtension() {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
        const stored = await chrome.storage.local.get(currentConfig);
        currentConfig = { ...currentConfig, ...stored };
      }
    } catch (e) {}

    try {
      const playerEl = document.querySelector('#movie_player, .html5-video-player');
      if (!playerEl) return;

      if (window.ytDanmakuEngine) {
        window.ytDanmakuEngine.init(playerEl, currentConfig);
      }

      if (window.ytDraggableChatBox) {
        window.ytDraggableChatBox.init(playerEl, currentConfig);
      }

      initialized = true;
    } catch (err) {}
  }

  // Listen for messages from live chat iframe (postMessage)
  window.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'YT_DANMAKU_MESSAGE') {
      const payload = event.data.payload;
      if (window.ytDanmakuEngine && currentConfig.enableDanmaku) {
        window.ytDanmakuEngine.addComment(payload);
      }
    }
  });

  // Listen for extension config updates from popup.js
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message && message.action === 'UPDATE_CONFIG') {
          const newConfig = message.config || {};
          currentConfig = { ...currentConfig, ...newConfig };

          if (window.ytDanmakuEngine) {
            window.ytDanmakuEngine.updateConfig(newConfig);
          }

          if (window.ytDraggableChatBox) {
            window.ytDraggableChatBox.updateConfig(newConfig);
          }

          sendResponse({ status: 'OK' });
        }
        return true;
      });
    } catch (e) {}
  }

  // Pure Event-Driven Init (Zero CPU background overhead)
  function safeInit() {
    if (!initialized) {
      initExtension();
    }
  }

  // YouTube SPA Navigation Events (No polling or body MutationObservers)
  window.addEventListener('yt-navigate-finish', () => {
    initialized = false;
    setTimeout(initExtension, 500);
  });

  window.addEventListener('popstate', () => {
    initialized = false;
    setTimeout(initExtension, 500);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInit);
  } else {
    safeInit();
  }
  window.addEventListener('load', safeInit);
})();
