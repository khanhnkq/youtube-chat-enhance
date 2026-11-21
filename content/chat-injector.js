(function () {
  'use strict';

  const { selectors, diagnostics, createDedupeCache } = YTChatRuntime;
  const MAX_PLAYER_LOOKUPS = 10;

  let currentConfig = { ...YTChatConfig.defaults };

  let initialized = false;
  let watchFlexyObserver = null;
  let nativeChatCollapsedFor = null;
  let nativeChatAutoCollapsed = false;
  let nativeChatCollapsePoll = null;
  let resizeTimeout = null;
  let playerLookups = 0;
  const receivedMessages = createDedupeCache();

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

      const chatFrame = document.querySelector(selectors.nativeChatFrame);
      if (chatFrame) {
        if (chatFrame.hasAttribute('collapsed')) {
          nativeChatCollapsedFor = videoId;
          clearNativeChatCollapsePoll();
          return;
        }

        const toggleButton = chatFrame.querySelector(selectors.nativeChatToggle);
        if (toggleButton) {
          toggleButton.click();
          nativeChatCollapsedFor = videoId;
          nativeChatAutoCollapsed = true;
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

  // The native chat is the only Danmaku source while the floating chat is off.
  // YouTube keeps the collapsed state across SPA navigation, so this is not tied to one video.
  function restoreAutoCollapsedNativeChat() {
    const chatFrame = document.querySelector(selectors.nativeChatFrame);
    if (nativeChatAutoCollapsed && chatFrame && chatFrame.hasAttribute('collapsed')) {
      const toggleButton = chatFrame.querySelector(selectors.nativeChatToggle);
      if (toggleButton) toggleButton.click();
    }
    nativeChatAutoCollapsed = false;
    nativeChatCollapsedFor = null;
  }

  function handleFloatingChatConfigChange(wasEnabled) {
    const isEnabled = currentConfig.enableFloatingChat !== false;
    if (wasEnabled && !isEnabled) {
      clearNativeChatCollapsePoll();
      restoreAutoCollapsedNativeChat();
    } else if (!wasEnabled && isEnabled) {
      clearNativeChatCollapsePoll();
      nativeChatCollapsedFor = null;
      collapseNativeChatForVideo();
    }
  }

  function checkFullscreen() {
    const playerEl = document.querySelector(selectors.player);
    const watchFlexy = document.querySelector(selectors.watchFlexy);

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
      const watchFlexy = document.querySelector(selectors.watchFlexy);
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
    } catch (error) {
      diagnostics.report('watch layout observer', error);
    }
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
        currentConfig = await YTChatConfig.load();
      }
    } catch (error) {
      // The page keeps working with the defaults or the last loaded settings.
      diagnostics.report('page config load', error);
    }

    try {
      const playerEl = document.querySelector(selectors.player);
      if (!playerEl) {
        if (playerLookups < MAX_PLAYER_LOOKUPS) {
          playerLookups++;
          setTimeout(initExtension, 500);
        }
        return;
      }
      playerLookups = 0;

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
    } catch (error) {
      diagnostics.report('page init', error);
    }
  }

  function isTrustedChatSource(source) {
    const overlayIframe = document.querySelector('.yt-custom-chat-overlay iframe');
    const nativeIframe = document.querySelector(selectors.nativeChatIframe);
    return (
      (overlayIframe && overlayIframe.contentWindow === source) ||
      (nativeIframe && nativeIframe.contentWindow === source)
    );
  }

  window.addEventListener('message', (event) => {
    if (!event.data || event.data.type !== 'YT_DANMAKU_BATCH') return;
    if (event.origin !== 'https://www.youtube.com' || !isTrustedChatSource(event.source)) return;

    const batch = event.data.batch;
    if (!Array.isArray(batch) || !window.ytDanmakuEngine || !currentConfig.enableDanmaku) return;

    const now = Date.now();
    const newMessages = batch.filter(payload => payload && payload.text && receivedMessages.accept(payload, now));
    if (newMessages.length > 0) window.ytDanmakuEngine.addCommentBatch(newMessages);
  });

  // Storage is the only configuration update channel.
  YTChatConfig.subscribe((updatedConfig) => {
    const wasFloatingChatEnabled = currentConfig.enableFloatingChat !== false;
    currentConfig = { ...currentConfig, ...updatedConfig };

    if (window.ytDanmakuEngine && Object.keys(updatedConfig).some(key => key.startsWith('danmaku') || key === 'enableDanmaku')) {
      window.ytDanmakuEngine.updateConfig(updatedConfig);
    }

    if (window.ytDraggableChatBox && ['enableFloatingChat', 'hideHeaderAndBorder', 'bgOpacity'].some(key => key in updatedConfig)) {
      window.ytDraggableChatBox.updateConfig(updatedConfig);
    }

    if ('enableFloatingChat' in updatedConfig) handleFloatingChatConfigChange(wasFloatingChatEnabled);
    if ('autoHideNativeChat' in updatedConfig) handleFullscreenState();
  });

  // Commands are transient and repeatable, never stored as config flags.
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message && message.action === 'RESET_CHAT_POSITION') {
          if (window.ytDraggableChatBox) window.ytDraggableChatBox.resetPosition();
          sendResponse({ status: 'OK' });
        }
      });
    } catch (error) {
      diagnostics.report('popup command listener', error);
    }
  }

  // A viewer toggling YouTube's chat owns its state from then on; only the extension's own collapse is undone.
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (event.isTrusted && target && target.closest && target.closest(selectors.nativeChatToggleArea)) {
      nativeChatAutoCollapsed = false;
    }
  }, true);

  // Fullscreen state listeners
  document.addEventListener('fullscreenchange', handleFullscreenState);
  document.addEventListener('webkitfullscreenchange', handleFullscreenState);
  window.addEventListener('resize', () => {
    if (resizeTimeout !== null) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resizeTimeout = null;
      handleFullscreenState();
    }, 150);
  });

  function resetOnNavigation() {
    initialized = false;
    if (resizeTimeout !== null) {
      clearTimeout(resizeTimeout);
      resizeTimeout = null;
    }
    clearNativeChatCollapsePoll();
    receivedMessages.clear();
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
