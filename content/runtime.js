(function () {
  'use strict';

  const messageTags = Object.freeze({
    text: 'yt-live-chat-text-message-renderer',
    paid: 'yt-live-chat-paid-message-renderer',
    membership: 'yt-live-chat-membership-item-renderer'
  });

  // Every YouTube DOM hook the content scripts rely on, so a markup change is fixed in one place.
  const selectors = Object.freeze({
    player: '#movie_player, .html5-video-player',
    video: 'video',
    watchFlexy: 'ytd-watch-flexy',
    nativeChatFrame: 'ytd-live-chat-frame',
    nativeChatIframe: 'ytd-live-chat-frame iframe',
    nativeChatToggle: '#show-hide-button button',
    nativeChatToggleArea: 'ytd-live-chat-frame #show-hide-button',
    chatList: '#items.yt-live-chat-item-list-renderer, yt-live-chat-item-list-renderer #items, #contents.yt-live-chat-renderer, #chat-messages #items, yt-live-chat-renderer #items',
    chatMessage: Object.values(messageTags).join(', '),
    messageAuthor: '#author-name',
    messageAvatar: '#img, yt-img-shadow img',
    messageText: '#message',
    superChatAmount: '#purchase-amount',
    membershipText: '#header-subtext'
  });

  // Unexpected errors are logged a few times per source and then only counted,
  // so a failure that repeats for every chat message cannot flood the console.
  const MAX_LOGS_PER_SOURCE = 3;
  const errorCounts = new Map();

  // Chrome throws this once the extension is reloaded or updated under an open page;
  // the old content scripts keep running but can no longer reach storage or messaging.
  function isContextInvalidated(error) {
    return /Extension context invalidated/i.test(String(error && error.message));
  }

  function report(source, error) {
    if (isContextInvalidated(error)) return;
    const count = (errorCounts.get(source) || 0) + 1;
    errorCounts.set(source, count);
    if (count > MAX_LOGS_PER_SOURCE) return;
    const note = count === MAX_LOGS_PER_SOURCE ? ' (further errors from this source are only counted)' : '';
    console.warn(`[YT Chat Extension] ${source}${note}:`, error);
  }

  // Remembers recent messages so one that arrives twice (two chat frames, a re-rendered node) is shown once.
  function createDedupeCache({ limit = 300, windowMs = 1500 } = {}) {
    const seen = new Map();
    return {
      // Messages without a YouTube id are matched by author and text, and only within windowMs.
      accept(payload, now) {
        const key = payload.id ? `id:${payload.id}` : `text:${payload.author || ''}\n${payload.text}`;
        const lastSeen = seen.get(key);
        if (lastSeen !== undefined && (payload.id || now - lastSeen < windowMs)) return false;
        seen.delete(key);
        seen.set(key, now);
        if (seen.size > limit) seen.delete(seen.keys().next().value);
        return true;
      },
      clear() { seen.clear(); },
      get size() { return seen.size; }
    };
  }

  // Holds items that cannot be placed yet, in arrival order, dropping the oldest beyond `limit`.
  // `place(item)` returns false when there is no room; an item whose placement throws is dropped.
  function createPendingQueue({ limit, retryDelay, place, isPaused, onError }) {
    let items = [];
    let retryTimer = null;

    function tryPlace(item) {
      try {
        return place(item);
      } catch (error) {
        onError(error);
        return true;
      }
    }

    function scheduleRetry() {
      if (retryTimer !== null || items.length === 0 || isPaused()) return;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        drain();
      }, retryDelay);
    }

    function drain() {
      if (isPaused()) return;
      while (items.length > 0 && tryPlace(items[0])) items.shift();
      scheduleRetry();
    }

    return {
      add(item) {
        if (!isPaused() && items.length === 0 && tryPlace(item)) return;
        if (items.length >= limit) items.shift();
        items.push(item);
        scheduleRetry();
      },
      drain,
      clear() {
        items = [];
        if (retryTimer !== null) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }
      },
      get size() { return items.length; }
    };
  }

  // Keeps a box inside its bounds; a box larger than the bounds is pinned to the top-left corner.
  function clampPosition(box, bounds) {
    return {
      left: Math.max(0, Math.min(box.left, Math.max(0, bounds.width - box.width))),
      top: Math.max(0, Math.min(box.top, Math.max(0, bounds.height - box.height)))
    };
  }

  globalThis.YTChatRuntime = Object.freeze({
    selectors,
    messageTags,
    diagnostics: Object.freeze({
      report,
      counts: () => Object.fromEntries(errorCounts)
    }),
    createDedupeCache,
    createPendingQueue,
    clampPosition
  });
})();
