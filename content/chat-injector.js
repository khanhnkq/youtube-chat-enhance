(function () {
  'use strict';

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
  let nativeChatCollapsedFor = null;
  let nativeChatCollapsePoll = null;
  const receivedMsgCache = new Map();

  function getCurrentVideoId() {
    const chatBox = window.ytDraggableChatBox;
    return chatBox && typeof chatBox.getVideoId === 'function' ? chatBox.getVideoId() : null;
  }

  function clearNativeChatCollapsePoll() {
    if (!nativeChatCollapsePoll) return;
    if (nativeChatCollapsePoll.timer !== null) {
      clearTimeout(nativeChatCollapsePoll.timer);
    }
    nativeChatCollapsePoll = null;
  }

  function collapseNativeChatForVideo() {
    if (currentConfig.enableFloatingChat === false) {
      clearNativeChatCollapsePoll();
      return;
    }

    const videoId = getCurrentVideoId();
    if (!videoId || videoId === nativeChatCollapsedFor) return;
    if (nativeChatCollapsePoll && nativeChatCollapsePoll.videoId === videoId) return;

    clearNativeChatCollapsePoll();
    const pollState = { videoId, startedAt: Date.now(), timer: null };
    nativeChatCollapsePoll = pollState;

    const poll = () => {
      if (nativeChatCollapsePoll !== pollState) return;
      pollState.timer = null;

      if (
        currentConfig.enableFloatingChat === false ||
        getCurrentVideoId() !== videoId ||
        nativeChatCollapsedFor === videoId
      ) {
        clearNativeChatCollapsePoll();
        return;
      }

      const chatFrame = document.querySelector('ytd-live-chat-frame');
      if (chatFrame) {
        if (chatFrame.hasAttribute('collapsed')) {
          nativeChatCollapsedFor = videoId;
          clearNativeChatCollapsePoll();
          return;
        }

        const toggleButton = chatFrame.querySelector('#show-hide-button button');
        if (toggleButton) {
          toggleButton.click();
          nativeChatCollapsedFor = videoId;
          clearNativeChatCollapsePoll();
          return;
        }
      }

      if (Date.now() - pollState.startedAt >= 10_000) {
        clearNativeChatCollapsePoll();
        return;
      }
      pollState.timer = setTimeout(poll, 500);
    };

    poll();
  }

  function handleFloatingChatConfigChange(wasEnabled) {
    const isEnabled = currentConfig.enableFloatingChat !== false;
    if (wasEnabled && !isEnabled) {
      clearNativeChatCollapsePoll();
    } else if (!wasEnabled && isEnabled) {
      clearNativeChatCollapsePoll();
      nativeChatCollapsedFor = null;
      collapseNativeChatForVideo();
    }
  }

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
      if (!watchFlexy) return;

      if (watchFlexyObserver) {
        watchFlexyObserver.disconnect();
        watchFlexyObserver = null;
      }

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
      if (!playerEl) {
        if (!window.__ytChatRetryCount) window.__ytChatRetryCount = 0;
        if (window.__ytChatRetryCount < 10) {
          window.__ytChatRetryCount++;
          setTimeout(initExtension, 500);
        }
        return;
      }
      window.__ytChatRetryCount = 0;

      if (window.ytDanmakuEngine) {
        window.ytDanmakuEngine.init(playerEl, currentConfig);
      }

      if (window.ytDraggableChatBox) {
        window.ytDraggableChatBox.init(playerEl, currentConfig);
      }

      collapseNativeChatForVideo();
      setupWatchFlexyObserver();
      handleFullscreenState();
      initialized = true;
    } catch (err) {}
  }

  function processPayload(payload, now) {
    if (!payload || !payload.text) return null;

    const dedupeKey = (payload.id && payload.id.length > 8 && !payload.id.startsWith('rand_'))
      ? payload.id
      : `${payload.author || ''}_${payload.text}_${Math.floor(now / 1500)}`;

    if (receivedMsgCache.has(dedupeKey)) return null;

    receivedMsgCache.set(dedupeKey, now);
    if (receivedMsgCache.size > 300) {
      const firstKey = receivedMsgCache.keys().next().value;
      receivedMsgCache.delete(firstKey);
    }
    return payload;
  }

  window.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'YT_DANMAKU_BATCH') {
      const batch = event.data.batch;
      if (!Array.isArray(batch) || batch.length === 0) return;

      if (!window.ytDanmakuEngine || !currentConfig.enableDanmaku) return;

      const now = Date.now();
      const validPayloads = [];
      for (let i = 0; i < batch.length; i++) {
        const item = processPayload(batch[i], now);
        if (item) validPayloads.push(item);
      }

      if (validPayloads.length > 0) {
        window.ytDanmakuEngine.addCommentBatch(validPayloads);
      }
    } else if (event.data.type === 'YT_DANMAKU_MESSAGE') {
      const payload = event.data.payload;
      const valid = processPayload(payload, Date.now());
      if (valid && window.ytDanmakuEngine && currentConfig.enableDanmaku) {
        window.ytDanmakuEngine.addComment(valid);
      }
    }
  });

  // Listen for extension config updates via chrome.storage.onChanged
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local') {
        const wasFloatingChatEnabled = currentConfig.enableFloatingChat !== false;
        const updatedConfig = {};
        for (const key in changes) {
          updatedConfig[key] = changes[key].newValue;
        }
        currentConfig = { ...currentConfig, ...updatedConfig };

        if (window.ytDanmakuEngine) {
          window.ytDanmakuEngine.updateConfig(updatedConfig);
        }

        if (window.ytDraggableChatBox) {
          window.ytDraggableChatBox.updateConfig(updatedConfig);
        }

        handleFloatingChatConfigChange(wasFloatingChatEnabled);
        handleFullscreenState();
      }
    });
  }

  // Listen for extension config updates from popup.js
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message && message.action === 'UPDATE_CONFIG') {
          const wasFloatingChatEnabled = currentConfig.enableFloatingChat !== false;
          const newConfig = message.config || {};
          currentConfig = { ...currentConfig, ...newConfig };

          if (window.ytDanmakuEngine) {
            window.ytDanmakuEngine.updateConfig(newConfig);
          }

          if (window.ytDraggableChatBox) {
            window.ytDraggableChatBox.updateConfig(newConfig);
          }

          handleFloatingChatConfigChange(wasFloatingChatEnabled);
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

  function resetOnNavigation() {
    initialized = false;
    clearNativeChatCollapsePoll();
    receivedMsgCache.clear();
    if (watchFlexyObserver) {
      watchFlexyObserver.disconnect();
      watchFlexyObserver = null;
    }
    if (window.ytDanmakuEngine) {
      window.ytDanmakuEngine.clear();
    }
    setTimeout(initExtension, 400);
  }

  // YouTube SPA Navigation Events (Clean state reset)
  window.addEventListener('yt-navigate-finish', resetOnNavigation);
  window.addEventListener('popstate', resetOnNavigation);

  function safeInit() {
    if (!initialized) {
      initExtension();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInit);
  } else {
    safeInit();
  }
  window.addEventListener('load', safeInit);
})();
