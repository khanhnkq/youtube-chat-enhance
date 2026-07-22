class DraggableChatBox {
  constructor() {
    this.overlay = null;
    this.header = null;
    this.iframeContainer = null;
    this.resizeHandle = null;
    this.playerEl = null;
    this.config = {};
    this.isDragging = false;
    this.isResizing = false;
    this.dragOffset = { x: 0, y: 0 };
    this.resizeStart = { width: 0, height: 0, x: 0, y: 0 };
    this.currentVideoId = null;
    this.animFrameReq = null;
    this.hasListeners = false;
  }

  init(playerElement, config = {}) {
    try {
      this.playerEl = playerElement || document.querySelector('#movie_player, .html5-video-player');
      if (!this.playerEl) return false;

      this.config = config || {};

      // Create or locate Custom Overlay Container inside YouTube Player
      this.overlay = this.playerEl.querySelector('.yt-custom-chat-overlay');
      if (!this.overlay) {
        this.overlay = document.createElement('div');
        this.overlay.className = 'yt-custom-chat-overlay';
        this.overlay.innerHTML = `
          <div class="yt-custom-drag-header">
            <div class="yt-custom-drag-title">Live Chat</div>
            <div class="yt-custom-drag-actions">
              <button class="yt-drag-btn" id="ytChatMinBtn" title="Thu nhỏ / Mở lại">—</button>
            </div>
          </div>
          <div class="yt-custom-chat-body"></div>
          <div class="yt-custom-resize-handle" title="Kéo để thay đổi kích thước"></div>
        `;
        this.playerEl.appendChild(this.overlay);
      }

      this.header = this.overlay.querySelector('.yt-custom-drag-header');
      this.iframeContainer = this.overlay.querySelector('.yt-custom-chat-body');
      this.resizeHandle = this.overlay.querySelector('.yt-custom-resize-handle');

      this.applyStyles(this.config);
      this.restorePositionAndSize();
      this.attachEventListeners();
      this.updateChatIframe();

      this.onFullscreenChange(this.isFS || false, this.config);

      return true;
    } catch (e) {
      console.warn('[YT Chat Extension] DraggableChatBox init warning:', e);
      return false;
    }
  }

  getVideoId() {
    try {
      if (this.playerEl && typeof this.playerEl.getVideoData === 'function') {
        const data = this.playerEl.getVideoData();
        if (data && data.video_id) return data.video_id;
      }
    } catch (e) {}

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('v')) return urlParams.get('v');

    if (window.location.pathname.startsWith('/live/')) {
      return window.location.pathname.split('/live/')[1];
    }
    return null;
  }

  updateChatIframe() {
    try {
      if (!this.iframeContainer) return;

      const videoId = this.getVideoId();
      if (!videoId) return;

      const targetSrc = `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${window.location.hostname}#yt_custom_overlay=1`;
      let iframe = this.iframeContainer.querySelector('iframe');

      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.name = 'yt_custom_chat_frame';
        iframe.allow = 'autoplay; encrypted-media';
        iframe.src = targetSrc;
        this.iframeContainer.appendChild(iframe);
        this.currentVideoId = videoId;
      } else if (this.currentVideoId !== videoId || iframe.src !== targetSrc) {
        iframe.name = 'yt_custom_chat_frame';
        iframe.src = targetSrc;
        this.currentVideoId = videoId;
      }
    } catch (e) {}
  }

  applyStyles(config) {
    try {
      if (!this.overlay) return;

      const bgOpacity = (config.bgOpacity !== undefined ? config.bgOpacity : 20) / 100;

      this.overlay.style.backgroundColor = `rgba(0, 0, 0, ${bgOpacity})`;

      if (config.hideHeaderAndBorder !== false) {
        this.overlay.classList.add('yt-frameless-mode');
      } else {
        this.overlay.classList.remove('yt-frameless-mode');
      }
    } catch (e) {}
  }

  toggleMinimize() {
    if (!this.overlay) return;
    const minBtn = this.overlay.querySelector('#ytChatMinBtn');
    const titleEl = this.overlay.querySelector('.yt-custom-drag-title');
    const isMin = this.overlay.classList.contains('is-minimized');

    if (isMin) {
      // Reopen full chat window
      this.overlay.classList.remove('is-minimized');
      if (this.iframeContainer) this.iframeContainer.style.display = 'block';
      if (this.resizeHandle) this.resizeHandle.style.display = 'block';
      if (minBtn) minBtn.style.display = 'flex';
      if (titleEl) titleEl.textContent = 'Live Chat';

      this.overlay.style.width = `${this.lastWidth || 320}px`;
      this.overlay.style.height = `${this.lastHeight || 420}px`;
    } else {
      // Minimize into pure text button "Live Chat"
      this.lastWidth = this.overlay.offsetWidth;
      this.lastHeight = this.overlay.offsetHeight;

      this.overlay.classList.add('is-minimized');
      if (this.iframeContainer) this.iframeContainer.style.display = 'none';
      if (this.resizeHandle) this.resizeHandle.style.display = 'none';
      if (minBtn) minBtn.style.display = 'none';
      if (titleEl) titleEl.textContent = 'Live Chat';

      this.overlay.style.width = '80px';
      this.overlay.style.height = '28px';
    }
  }

  attachEventListeners() {
    try {
      if (!this.header || !this.overlay || this.hasListeners) return;
      this.hasListeners = true;

      const minBtn = this.header.querySelector('#ytChatMinBtn');
      if (minBtn) {
        minBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleMinimize();
        });
      }

      // Allow clicking minimized title bar to reopen
      this.header.addEventListener('click', (e) => {
        if (this.overlay.classList.contains('is-minimized')) {
          this.toggleMinimize();
        }
      });

      // Smooth Dragging Start
      this.header.addEventListener('mousedown', this.onDragStart);

      // Smooth Resizing Start
      if (this.resizeHandle) {
        this.resizeHandle.addEventListener('mousedown', this.onResizeStart);
      }
    } catch (e) {}
  }

  onDragStart = (e) => {
    if (e.target.closest('.yt-drag-btn')) return;
    this.isDragging = true;
    const rect = this.overlay.getBoundingClientRect();
    this.dragOffset.x = e.clientX - rect.left;
    this.dragOffset.y = e.clientY - rect.top;

    // Disable iframe pointer events during drag to prevent mouse capture stutter
    const iframe = this.overlay.querySelector('iframe');
    if (iframe) iframe.style.pointerEvents = 'none';
    document.body.style.userSelect = 'none';

    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.onStopDrag);
    e.preventDefault();
  };

  onDrag = (e) => {
    if (!this.isDragging || !this.overlay || !this.playerEl) return;

    if (this.animFrameReq) cancelAnimationFrame(this.animFrameReq);

    this.animFrameReq = requestAnimationFrame(() => {
      const playerRect = this.playerEl.getBoundingClientRect();
      let left = e.clientX - playerRect.left - this.dragOffset.x;
      let top = e.clientY - playerRect.top - this.dragOffset.y;

      const maxLeft = Math.max(0, playerRect.width - this.overlay.offsetWidth);
      const maxTop = Math.max(0, playerRect.height - this.overlay.offsetHeight);

      left = Math.max(0, Math.min(left, maxLeft));
      top = Math.max(0, Math.min(top, maxTop));

      this.overlay.style.left = `${left}px`;
      this.overlay.style.top = `${top}px`;
      this.overlay.style.right = 'auto';
      this.overlay.style.bottom = 'auto';
    });
  };

  onStopDrag = () => {
    if (!this.isDragging) return;
    this.isDragging = false;

    // Restore iframe pointer events
    const iframe = this.overlay.querySelector('iframe');
    if (iframe) iframe.style.pointerEvents = 'auto';
    document.body.style.userSelect = '';

    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.onStopDrag);
    this.savePositionAndSize();
  };

  onResizeStart = (e) => {
    this.isResizing = true;
    const rect = this.overlay.getBoundingClientRect();
    this.resizeStart = {
      width: rect.width,
      height: rect.height,
      x: e.clientX,
      y: e.clientY
    };

    // Disable iframe pointer events during resize
    const iframe = this.overlay.querySelector('iframe');
    if (iframe) iframe.style.pointerEvents = 'none';
    document.body.style.userSelect = 'none';

    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('mouseup', this.onStopResize);
    e.preventDefault();
  };

  onResize = (e) => {
    if (!this.isResizing || !this.overlay) return;

    if (this.animFrameReq) cancelAnimationFrame(this.animFrameReq);

    this.animFrameReq = requestAnimationFrame(() => {
      const deltaX = e.clientX - this.resizeStart.x;
      const deltaY = e.clientY - this.resizeStart.y;

      const newWidth = Math.max(160, this.resizeStart.width + deltaX);
      const newHeight = Math.max(100, this.resizeStart.height + deltaY);

      this.overlay.style.width = `${newWidth}px`;
      this.overlay.style.height = `${newHeight}px`;
    });
  };

  onStopResize = () => {
    if (!this.isResizing) return;
    this.isResizing = false;

    // Restore iframe pointer events
    const iframe = this.overlay.querySelector('iframe');
    if (iframe) iframe.style.pointerEvents = 'auto';
    document.body.style.userSelect = '';

    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.onStopResize);
    this.savePositionAndSize();
  };

  async savePositionAndSize() {
    if (!this.overlay || this.overlay.classList.contains('is-minimized')) return;
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) return;
      const posData = {
        left: this.overlay.style.left,
        top: this.overlay.style.top,
        width: this.overlay.style.width,
        height: this.overlay.style.height
      };
      await chrome.storage.local.set({ chatBoxPos: posData });
    } catch (err) {}
  }

  async restorePositionAndSize() {
    if (!this.overlay) return;
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) return;
      const { chatBoxPos } = await chrome.storage.local.get('chatBoxPos');
      if (chatBoxPos && (chatBoxPos.left || chatBoxPos.top)) {
        if (chatBoxPos.left) this.overlay.style.left = chatBoxPos.left;
        if (chatBoxPos.top) this.overlay.style.top = chatBoxPos.top;
        if (chatBoxPos.width) this.overlay.style.width = chatBoxPos.width;
        if (chatBoxPos.height) this.overlay.style.height = chatBoxPos.height;
        this.overlay.style.right = 'auto';
        this.overlay.style.bottom = 'auto';
      } else {
        this.resetPosition();
      }
    } catch (err) {
      this.resetPosition();
    }
  }

  resetPosition() {
    if (!this.overlay) return;
    this.overlay.style.top = '20px';
    this.overlay.style.left = 'auto';
    this.overlay.style.right = '20px';
    this.overlay.style.bottom = 'auto';
    this.overlay.style.width = '320px';
    this.overlay.style.height = '420px';
    this.savePositionAndSize();
  }

  onFullscreenChange(isFullscreen, newConfig) {
    try {
      this.isFS = isFullscreen;
      if (newConfig) this.config = { ...this.config, ...newConfig };
      if (!this.overlay) return;

      if (this.config.enableFloatingChat === false) {
        this.overlay.classList.add('is-hidden');
      } else {
        this.overlay.classList.remove('is-hidden');
      }
    } catch (e) {}
  }

  updateConfig(newConfig) {
    try {
      this.config = { ...this.config, ...newConfig };

      if (newConfig.resetChatPosition) {
        this.resetPosition();
      }

      this.applyStyles(this.config);
      this.updateChatIframe();
      this.onFullscreenChange(this.isFS || false, this.config);
    } catch (e) {}
  }
}

window.ytDraggableChatBox = new DraggableChatBox();
