(function () {
  'use strict';

  const defaults = Object.freeze({
    lang: 'en',
    enableFloatingChat: true,
    enableDanmaku: false,
    autoHideNativeChat: true,
    hideHeaderAndBorder: true,
    hideItemBg: true,
    hideInputBox: true,
    authorTextColor: '#ff88aa',
    chatTextColor: '#ffffff',
    danmakuTextColor: '#ffffff',
    danmakuTextStroke: false,
    danmakuTextShadow: true,
    bgOpacity: 20,
    bgBlur: 10,
    chatFontSize: 14,
    danmakuSpeed: 10,
    danmakuFontSize: 22,
    danmakuOpacity: 90,
    danmakuArea: '0.5'
  });
  const profileKey = 'ytChatDefaultsVersion';
  const listeners = new Set();
  let fallback = defaults;
  let config = null;
  let loading = null;
  let pending = [];

  function applyChanges(changes, notify = true) {
    const updated = {};
    for (const key of Object.keys(defaults)) {
      if (!Object.hasOwn(changes, key)) continue;
      const value = changes[key].newValue ?? fallback[key];
      if (config[key] !== value) updated[key] = value;
    }
    if (Object.keys(updated).length === 0) return;
    config = { ...config, ...updated };
    if (notify) {
      for (const listener of listeners) listener(updated);
    }
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (!config) pending.push(changes);
    else applyChanges(changes);
  });

  async function load() {
    if (!loading) {
      loading = (async () => {
        const stored = await chrome.storage.local.get(null);
        // Old profiles may only contain the settings they changed, not defaults.
        const legacy = stored[profileKey] === 1 || (
          stored[profileKey] === undefined &&
          [...Object.keys(defaults), 'chatBoxPos', 'resetChatPosition']
            .some(key => Object.hasOwn(stored, key))
        );
        fallback = { ...defaults, enableDanmaku: legacy };
        config = { ...fallback };
        for (const key of Object.keys(defaults)) {
          if (stored[key] !== undefined) config[key] = stored[key];
        }
        for (const changes of pending) applyChanges(changes, false);
        pending = [];
        // Store only the default policy; never overwrite saved user choices.
        if (stored[profileKey] === undefined) {
          await chrome.storage.local.set({ [profileKey]: legacy ? 1 : 2 });
        }
        // A command left by an older popup must never replay on every update.
        if (Object.hasOwn(stored, 'resetChatPosition')) {
          await chrome.storage.local.remove('resetChatPosition');
        }
      })().catch(error => {
        loading = null;
        throw error;
      });
    }
    await loading;
    return { ...config };
  }

  globalThis.YTChatConfig = Object.freeze({
    defaults,
    load,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  });
})();
