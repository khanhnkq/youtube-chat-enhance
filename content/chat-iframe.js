(function () {
  'use strict';

  let currentConfig = {
    hideItemBg: true,
    hideInputBox: true,
    chatFontSize: 14,
    authorTextColor: '#ff88aa',
    chatTextColor: '#ffffff',
    enableDanmaku: true
  };

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

  // Load initial config from storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(currentConfig).then((stored) => {
      currentConfig = { ...currentConfig, ...stored };
      if (isCustomOverlayFrame) {
        styleEl.textContent = buildDynamicStyles(currentConfig);
      }
    }).catch(() => {});

    if (chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local') {
          const updated = {};
          for (const key in changes) {
            updated[key] = changes[key].newValue;
          }
          currentConfig = { ...currentConfig, ...updated };
          if (isCustomOverlayFrame) {
            styleEl.textContent = buildDynamicStyles(currentConfig);
          }
        }
      });
    }
  }

  if (isCustomOverlayFrame) {
    styleEl.textContent = buildDynamicStyles(currentConfig);

    if (document.head) {
      document.head.appendChild(styleEl);
    } else {
      document.addEventListener('DOMContentLoaded', () => document.head.appendChild(styleEl));
    }
  }

  // Real-time Extension Config Listener via chrome.runtime
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    try {
      chrome.runtime.onMessage.addListener((message) => {
        if (message && message.action === 'UPDATE_CONFIG') {
          currentConfig = { ...currentConfig, ...(message.config || {}) };
          if (isCustomOverlayFrame) {
            styleEl.textContent = buildDynamicStyles(currentConfig);
          }
        }
      });
    } catch (e) {}
  }

  // Real-time Extension Config Listener via postMessage
  window.addEventListener('message', (event) => {
    try {
      if (event.data && event.data.type === 'YT_CHAT_STYLE_UPDATE') {
        currentConfig = { ...currentConfig, ...(event.data.config || {}) };
        if (isCustomOverlayFrame) {
          styleEl.textContent = buildDynamicStyles(currentConfig);
        }
      }
    } catch (e) {}
  });

  let observer = null;
  let messageBuffer = [];
  let flushTimer = null;

  function isMessageElement(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'yt-live-chat-text-message-renderer' ||
           tag === 'yt-live-chat-paid-message-renderer' ||
           tag === 'yt-live-chat-membership-item-renderer';
  }

  function startChatObserver() {
    try {
      const chatList = document.querySelector(
        '#items.yt-live-chat-item-list-renderer, yt-live-chat-item-list-renderer #items, #contents.yt-live-chat-renderer, #chat-messages #items, yt-live-chat-renderer #items'
      );
      if (!chatList) {
        setTimeout(startChatObserver, 500);
        return;
      }

      if (observer) {
        try { observer.disconnect(); } catch (err) {}
      }

      observer = new MutationObserver((mutations) => {
        if (!chatList.isConnected) {
          try { observer.disconnect(); } catch (err) {}
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
                const sub = node.querySelectorAll(
                  'yt-live-chat-text-message-renderer, yt-live-chat-paid-message-renderer, yt-live-chat-membership-item-renderer'
                );
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
      const initialItems = chatList.querySelectorAll(
        'yt-live-chat-text-message-renderer, yt-live-chat-paid-message-renderer, yt-live-chat-membership-item-renderer'
      );
      const startIdx = Math.max(0, initialItems.length - 5);
      for (let i = startIdx; i < initialItems.length; i++) {
        parseAndSendChatMessage(initialItems[i]);
      }
    } catch (e) {}
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

      const authorEl = element.querySelector('#author-name');
      if (authorEl) author = authorEl.textContent.trim();

      const imgEl = element.querySelector('#img, yt-img-shadow img');
      if (imgEl) avatar = imgEl.currentSrc || imgEl.src || '';

      const messageEl = element.querySelector('#message');
      if (messageEl) {
        text = messageEl.textContent.trim();
      }

      if (tagName === 'yt-live-chat-paid-message-renderer') {
        isSuperChat = true;
        const amountEl = element.querySelector('#purchase-amount');
        if (amountEl) amount = amountEl.textContent.trim();
      } else if (tagName === 'yt-live-chat-membership-item-renderer') {
        const headerEl = element.querySelector('#header-subtext');
        if (headerEl) text = headerEl.textContent.trim() || 'New Member!';
      }

      // If Polymer hasn't rendered the text yet, retry in 80ms and do NOT mark processed
      if (!text && !isSuperChat) {
        if (!element.__ytPending) {
          element.__ytPending = true;
          setTimeout(() => {
            element.__ytPending = false;
            parseAndSendChatMessage(element);
          }, 80);
        }
        return;
      }

      // Mark processed now that we have real message content
      element.__ytProcessed = true;

      const payload = {
        id: msgId || ('msg_' + Math.random().toString(36).substr(2, 9)),
        author,
        avatar,
        text,
        isSuperChat,
        amount,
        timestamp: Date.now()
      };

      queueChatMessage(payload);
    } catch (e) {}
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
      }, '*');
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startChatObserver);
  } else {
    startChatObserver();
  }
})();
