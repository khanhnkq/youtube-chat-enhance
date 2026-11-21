(function () {
  'use strict';

  const { selectors, messageTags, diagnostics } = YTChatRuntime;
  const messageTagNames = Object.values(messageTags);

  let currentConfig = { ...YTChatConfig.defaults };

  const isCustomOverlayFrame =
    window.location.hash.includes('yt_custom_overlay=1') ||
    window.location.hash.includes('yt_custom_chat=1') ||
    window.name === 'yt_custom_chat_frame';

  // Inject dynamic CSS into Live Chat iframe
  const styleEl = document.createElement('style');
  styleEl.id = 'yt-custom-chat-iframe-style';

  function buildDynamicStyles(config = {}) {
    const hideItemBg = config.hideItemBg !== false;
    const fontSize = config.chatFontSize || 14;
    const authorColor = config.authorTextColor || '#ff88aa';
    const messageColor = config.chatTextColor || '#ffffff';

    return `
      html, body, #item-list, #items, #contents, #chat-messages {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }

      ::-webkit-scrollbar,
      ::-webkit-scrollbar-thumb,
      ::-webkit-scrollbar-track,
      ::-webkit-scrollbar-corner {
        display: none !important;
        width: 0px !important;
        height: 0px !important;
        background: transparent !important;
        opacity: 0 !important;
      }

      html, body,
      yt-live-chat-renderer,
      yt-live-chat-item-list-renderer,
      #item-list,
      #items,
      #contents,
      #chat-messages,
      #separator {
        background: transparent !important;
        background-color: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }

      /* Internal Header, Notice Panels & Separators */
      yt-live-chat-header-renderer,
      #header,
      #action-panel,
      #separator,
      yt-live-chat-viewer-engagement-message-renderer,
      yt-live-chat-restricted-participating-msg-renderer,
      yt-live-chat-mode-change-message-renderer {
        display: none !important;
      }

      /* Chat Input Panel & Footer - AUTO HIDE by default, FADE IN on Mouse Hover */
      yt-live-chat-message-input-renderer,
      #input-panel,
      #footer {
        opacity: 0 !important;
        pointer-events: none !important;
        transition: opacity 0.2s ease !important;
        background: rgba(0, 0, 0, 0.7) !important;
        border-radius: 8px !important;
        margin-top: 4px !important;
      }

      /* FADE IN Input Box when Hovering mouse over Chat Box */
      body:hover yt-live-chat-message-input-renderer,
      body:hover #input-panel,
      body:hover #footer,
      yt-live-chat-renderer:hover yt-live-chat-message-input-renderer,
      yt-live-chat-renderer:hover #input-panel,
      yt-live-chat-renderer:hover #footer {
        opacity: 1 !important;
        pointer-events: auto !important;
      }

      /* Lightweight Chat Message Items */
      yt-live-chat-text-message-renderer,
      yt-live-chat-paid-message-renderer,
      yt-live-chat-membership-item-renderer {
        background: ${hideItemBg ? 'transparent !important' : 'rgba(0, 0, 0, 0.3) !important'};
        border-radius: ${hideItemBg ? '0px' : '6px'} !important;
        margin: 1px 0px !important;
        padding: 2px 4px !important;
        border: none !important;
        box-shadow: none !important;
        contain: content !important;
      }

      yt-live-chat-text-message-renderer:hover {
        background: rgba(0, 0, 0, 0.25) !important;
      }

      #author-name {
        color: ${authorColor} !important;
        font-weight: 700 !important;
        font-size: ${fontSize}px !important;
        text-shadow: 0 1px 3px rgba(0,0,0,0.95) !important;
      }

      #message {
        color: ${messageColor} !important;
        font-weight: 600 !important;
        font-size: ${fontSize}px !important;
        text-shadow: 0 1px 3px rgba(0,0,0,0.95) !important;
      }
    `;
  }

  const configReady = YTChatConfig.load().then((stored) => {
    currentConfig = stored;
    if (isCustomOverlayFrame) styleEl.textContent = buildDynamicStyles(currentConfig);
  }).catch(error => diagnostics.report('chat reader config load', error));

  YTChatConfig.subscribe((updated) => {
    currentConfig = { ...currentConfig, ...updated };
    if (isCustomOverlayFrame && ['hideItemBg', 'chatFontSize', 'authorTextColor', 'chatTextColor'].some(key => key in updated)) {
      styleEl.textContent = buildDynamicStyles(currentConfig);
    }
  });

  if (isCustomOverlayFrame) {
    styleEl.textContent = buildDynamicStyles(currentConfig);

    if (document.head) {
      document.head.appendChild(styleEl);
    } else {
      document.addEventListener('DOMContentLoaded', () => document.head.appendChild(styleEl));
    }
  }

  // YouTube fills #message shortly after inserting the node; re-read a few times, then give up.
  const RENDER_RETRY_DELAY = 80;
  const MAX_RENDER_RETRIES = 10;

  let observer = null;
  let messageBuffer = [];
  let flushTimer = null;

  function isMessageElement(el) {
    return !!el && !!el.tagName && messageTagNames.includes(el.tagName.toLowerCase());
  }

  function startChatObserver() {
    try {
      const chatList = document.querySelector(selectors.chatList);
      if (!chatList) {
        setTimeout(startChatObserver, 500);
        return;
      }

      if (observer) observer.disconnect();

      observer = new MutationObserver((mutations) => {
        if (!chatList.isConnected) {
          observer.disconnect();
          startChatObserver();
          return;
        }

        if (currentConfig.enableDanmaku === false) return;

        for (let i = 0; i < mutations.length; i++) {
          const addedNodes = mutations[i].addedNodes;
          for (let j = 0; j < addedNodes.length; j++) {
            const node = addedNodes[j];
            if (node && node.nodeType === 1) {
              if (isMessageElement(node)) {
                parseAndSendChatMessage(node);
              } else {
                const sub = node.querySelectorAll(selectors.chatMessage);
                for (let k = 0; k < sub.length; k++) {
                  parseAndSendChatMessage(sub[k]);
                }
              }
            }
          }
        }
      });

      // Observe childList + subtree to catch when Polymer binds content inside message nodes
      observer.observe(chatList, { childList: true, subtree: true });

      // Parse initial visible messages (latest 5 to immediately verify on load)
      const initialItems = chatList.querySelectorAll(selectors.chatMessage);
      const startIdx = Math.max(0, initialItems.length - 5);
      for (let i = startIdx; i < initialItems.length; i++) {
        parseAndSendChatMessage(initialItems[i]);
      }
    } catch (error) {
      diagnostics.report('chat observer setup', error);
    }
  }

  // Unicode emoji carry the character in alt; channel emoji carry a bare name and a data-emoji-id.
  function readEmojiText(img) {
    const alt = img.getAttribute('alt') || '';
    return alt && img.getAttribute('data-emoji-id') ? `:${alt}:` : alt;
  }

  // textContent skips emoji, which YouTube renders as <img alt="...">.
  function readMessageText(node) {
    let text = '';
    const children = node.childNodes;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.nodeType === 3) {
        text += child.textContent;
      } else if (child.nodeType === 1) {
        text += child.tagName.toLowerCase() === 'img' ? readEmojiText(child) : readMessageText(child);
      }
    }
    return text;
  }

  function parseAndSendChatMessage(element) {
    try {
      if (!element || element.__ytProcessed) return;

      const tagName = element.tagName ? element.tagName.toLowerCase() : '';
      const msgId = element.getAttribute('id') || element.dataset.id || '';

      let author = '';
      let avatar = '';
      let text = '';
      let isSuperChat = false;
      let amount = '';

      const authorEl = element.querySelector(selectors.messageAuthor);
      if (authorEl) author = authorEl.textContent.trim();

      const imgEl = element.querySelector(selectors.messageAvatar);
      if (imgEl) avatar = imgEl.currentSrc || imgEl.src || '';

      const messageEl = element.querySelector(selectors.messageText);
      if (messageEl) {
        text = readMessageText(messageEl).trim();
      }

      if (tagName === messageTags.paid) {
        isSuperChat = true;
        const amountEl = element.querySelector(selectors.superChatAmount);
        if (amountEl) amount = amountEl.textContent.trim();
      } else if (tagName === messageTags.membership) {
        const headerEl = element.querySelector(selectors.membershipText);
        if (headerEl) text = headerEl.textContent.trim() || 'New Member!';
      }

      // If Polymer hasn't rendered the text yet, retry shortly and do NOT mark processed
      if (!text && !isSuperChat) {
        const retries = element.__ytRetries || 0;
        if (element.__ytPending || !element.isConnected || retries >= MAX_RENDER_RETRIES) return;
        element.__ytPending = true;
        element.__ytRetries = retries + 1;
        setTimeout(() => {
          element.__ytPending = false;
          if (element.isConnected) parseAndSendChatMessage(element);
        }, RENDER_RETRY_DELAY);
        return;
      }

      // Mark processed now that we have real message content
      element.__ytProcessed = true;

      queueChatMessage({
        id: msgId,
        author,
        avatar,
        text,
        isSuperChat,
        amount,
        timestamp: Date.now()
      });
    } catch (error) {
      diagnostics.report('chat message parse', error);
    }
  }

  function queueChatMessage(payload) {
    messageBuffer.push(payload);
    if (!flushTimer) {
      flushTimer = setTimeout(flushMessageBuffer, 60);
    }
  }

  function flushMessageBuffer() {
    flushTimer = null;
    if (messageBuffer.length === 0) return;

    const batch = messageBuffer;
    messageBuffer = [];

    try {
      window.parent.postMessage({
        type: 'YT_DANMAKU_BATCH',
        frameSource: isCustomOverlayFrame ? 'custom' : 'native',
        batch: batch
      }, 'https://www.youtube.com');
    } catch (error) {
      diagnostics.report('chat batch post', error);
    }
  }

  configReady.then(() => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startChatObserver);
    } else {
      startChatObserver();
    }
  });
})();
