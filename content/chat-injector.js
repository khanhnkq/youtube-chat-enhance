(function () {
  'use strict';

  console.log('[YT Chat Extension] Injector script loaded.');

  let currentConfig = {
    enableFloatingChat: true,
    enableDanmaku: true,
    autoHideNativeChat: true,
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
  let watchFlexyObserver = null;

  function checkFullscreen() {
    const playerEl = document.querySelector('#movie_player, .html5-video-player');
    const watchFlexy = document.querySelector('ytd-watch-flexy');

    const isFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      (playerEl && playerEl.classList.contains('ytp-fullscreen')) ||
      (watchFlexy && watchFlexy.hasAttribute('fullscreen'))
    );

    const isTheater = !!(
      (watchFlexy && watchFlexy.hasAttribute('theater')) ||
      (playerEl && playerEl.classList.contains('ytp-large-width'))
    );

    return isFullscreen || isTheater;
  }

  function setupWatchFlexyObserver() {
    try {
      const watchFlexy = document.querySelector('ytd-watch-flexy');
      if (!watchFlexy || watchFlexyObserver) return;

      watchFlexyObserver = new MutationObserver(() => {
        handleFullscreenState();
      });

      watchFlexyObserver.observe(watchFlexy, {
        attributes: true,
        attributeFilter: ['fullscreen', 'theater', 'is-two-columns_']
      });
    } catch (e) {}
  }

  function handleFullscreenState() {
    const isFS = checkFullscreen();

    if (currentConfig.autoHideNativeChat !== false) {
      if (isFS) {
        document.body.classList.add('yt-native-chat-hidden');
      } else {
        document.body.classList.remove('yt-native-chat-hidden');
      }
    } else {
      document.body.classList.remove('yt-native-chat-hidden');
    }

    if (window.ytDraggableChatBox) {
      window.ytDraggableChatBox.onFullscreenChange(isFS, currentConfig);
    }

    if (window.ytDanmakuEngine) {
      window.ytDanmakuEngine.onFullscreenChange(isFS, currentConfig);
    }
  }

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

      setupWatchFlexyObserver();
      handleFullscreenState();
      initialized = true;
    } catch (err) {}
  }

  // Listen for messages from live chat iframe (postMessage) with Deduplication Cache
  const receivedMsgCache = new Map();

  window.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'YT_DANMAKU_MESSAGE') {
      const payload = event.data.payload;
      if (!payload || !payload.text) return;

      // Unique deduplication key: combine ID or author+text with a 1.5s window
      const now = Date.now();
      const dedupeKey = (payload.id && payload.id.length > 10 && !payload.id.startsWith('rand_'))
        ? payload.id
        : `${payload.author || ''}_${payload.text}_${Math.floor(now / 1500)}`;

      if (receivedMsgCache.has(dedupeKey)) {
        return; // Skip duplicate comment sent by second iframe in same 1.5s window
      }

      receivedMsgCache.set(dedupeKey, now);

      if (receivedMsgCache.size > 300) {
        const firstKey = receivedMsgCache.keys().next().value;
        receivedMsgCache.delete(firstKey);
      }

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

          handleFullscreenState();

          sendResponse({ status: 'OK' });
        }
        return true;
      });
    } catch (e) {}
  }

  // Fullscreen state listeners
  document.addEventListener('fullscreenchange', handleFullscreenState);
  document.addEventListener('webkitfullscreenchange', handleFullscreenState);
  window.addEventListener('resize', handleFullscreenState);

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
