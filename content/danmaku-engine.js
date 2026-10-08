class DanmakuEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.playerEl = null;
    this.videoEl = null;
    this.isEnabled = true;
    this.speed = 10; // seconds
    this.fontSize = 22;
    this.opacity = 0.9;
    this.displayAreaRatio = 0.5;
    this.textColor = '#ffffff';
    this.hasStroke = false;
    this.hasShadow = true;
    this.config = {};
    this.tracks = [];
    this.comments = [];
    this.avatarCache = new Map();
    this.animFrameId = null;
    this.isFS = false;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.lastPauseTime = 0;
    this.isPaused = false;

    // Stable bound functions for proper cleanup
    this.boundResize = this.resizeCanvas.bind(this);
    this.boundVisibilityChange = this.onVisibilityChange.bind(this);
    this.boundVideoPlay = this.onVideoPlay.bind(this);
    this.boundVideoPause = this.onVideoPause.bind(this);
  }

  init(playerElement, config = {}) {
    try {
      this.playerEl = playerElement || document.querySelector('#movie_player, .html5-video-player');
      if (!this.playerEl) return false;

      this.config = config || {};
      this.speed = this.config.danmakuSpeed || 10;
      this.fontSize = this.config.danmakuFontSize || 22;
      this.opacity = (this.config.danmakuOpacity !== undefined ? this.config.danmakuOpacity : 90) / 100;
      this.displayAreaRatio = parseFloat(this.config.danmakuArea || '0.5');
      this.textColor = this.config.danmakuTextColor || '#ffffff';
      this.hasStroke = !!this.config.danmakuTextStroke;
      this.hasShadow = this.config.danmakuTextShadow !== false;
      this.isEnabled = this.config.enableDanmaku !== undefined ? this.config.enableDanmaku : true;

      // Locate or create high-performance Canvas element inside YouTube Player
      this.canvas = this.playerEl.querySelector('.yt-danmaku-canvas');
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'yt-danmaku-canvas';
        this.canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:25;';
        this.playerEl.appendChild(this.canvas);
      }

      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this.resizeCanvas();

      // Hook Video State for Smart Sleep/Wake
      this.attachVideoListeners();

      // Hook Visibility Change to freeze/resume
      document.removeEventListener('visibilitychange', this.boundVisibilityChange);
      document.addEventListener('visibilitychange', this.boundVisibilityChange);

      window.removeEventListener('resize', this.boundResize);
      window.addEventListener('resize', this.boundResize);

      this.onFullscreenChange(this.isFS || false, this.config);

      return true;
    } catch (e) {
      console.warn('[YT Chat Extension] Canvas DanmakuEngine init warning:', e);
      return false;
    }
  }

  attachVideoListeners() {
    try {
      const video = this.playerEl ? this.playerEl.querySelector('video') : document.querySelector('video');
      if (video && video !== this.videoEl) {
        if (this.videoEl) {
          this.videoEl.removeEventListener('play', this.boundVideoPlay);
          this.videoEl.removeEventListener('pause', this.boundVideoPause);
        }
        this.videoEl = video;
        this.videoEl.addEventListener('play', this.boundVideoPlay);
        this.videoEl.addEventListener('pause', this.boundVideoPause);
        this.isPaused = this.videoEl.paused;
      }
    } catch (e) {}
  }

  onVideoPlay() {
    this.isPaused = false;
    if (this.lastPauseTime > 0) {
      const now = Date.now();
      const pauseDuration = now - this.lastPauseTime;
      for (let i = 0; i < this.comments.length; i++) {
        if (this.comments[i].startTime < this.lastPauseTime) {
          this.comments[i].startTime += pauseDuration;
        } else {
          this.comments[i].startTime = now;
        }
      }
      this.lastPauseTime = 0;
    }
    if (this.comments.length > 0 && this.isEnabled) {
      this.startLoop();
    }
  }

  onVideoPause() {
    this.isPaused = true;
    this.lastPauseTime = Date.now();
    this.stopLoop();
  }

  onVisibilityChange() {
    if (document.hidden) {
      this.stopLoop();
    } else {
      if (!this.videoEl) this.attachVideoListeners();
      if (this.comments.length > 0 && this.isEnabled && !this.isPaused) {
        this.startLoop();
      }
    }
  }

  resizeCanvas() {
    try {
      if (!this.canvas || !this.playerEl) return;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = this.playerEl.clientWidth || window.innerWidth;
      const height = this.playerEl.clientHeight || window.innerHeight;

      const targetW = Math.round(width * this.dpr);
      const targetH = Math.round(height * this.dpr);

      if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
        this.canvas.width = targetW;
        this.canvas.height = targetH;
      }
      this.recalculateTracks();
    } catch (e) {}
  }

  recalculateTracks() {
    try {
      if (!this.canvas) return;
      const canvasHeight = (this.canvas.height > 0) ? (this.canvas.height / this.dpr) : 720;
      const availableHeight = canvasHeight * this.displayAreaRatio;
      const lineHeight = this.fontSize * 1.35;
      const totalTracks = Math.max(1, Math.floor(availableHeight / lineHeight));

      this.tracks = new Array(totalTracks).fill(0);
    } catch (e) {
      this.tracks = new Array(5).fill(0);
    }
  }

  onFullscreenChange(isFullscreen, newConfig) {
    try {
      this.isFS = isFullscreen;
      if (newConfig) this.config = { ...this.config, ...newConfig };
      if (newConfig && newConfig.enableDanmaku !== undefined) {
        this.isEnabled = newConfig.enableDanmaku;
      }

      const autoHide = this.config.autoHideNativeChat !== false;
      let shouldShow = false;

      if (autoHide) {
        shouldShow = isFullscreen && this.isEnabled;
      } else {
        shouldShow = this.isEnabled;
      }

      if (this.canvas) {
        this.canvas.style.display = shouldShow ? 'block' : 'none';
        if (!shouldShow) {
          this.stopLoop();
          this.clear();
        } else if (this.comments.length > 0 && !this.isPaused) {
          this.startLoop();
        }
      }
      this.resizeCanvas();
    } catch (e) {}
  }

  updateConfig(newConfig) {
    try {
      if (!newConfig) return;
      this.config = { ...this.config, ...newConfig };
      if (newConfig.enableDanmaku !== undefined) {
        this.isEnabled = newConfig.enableDanmaku;
      }
      if (newConfig.danmakuSpeed !== undefined) this.speed = newConfig.danmakuSpeed;
      if (newConfig.danmakuFontSize !== undefined) this.fontSize = newConfig.danmakuFontSize;
      if (newConfig.danmakuOpacity !== undefined) this.opacity = newConfig.danmakuOpacity / 100;
      if (newConfig.danmakuTextColor !== undefined) this.textColor = newConfig.danmakuTextColor;
      if (newConfig.danmakuTextStroke !== undefined) this.hasStroke = !!newConfig.danmakuTextStroke;
      if (newConfig.danmakuTextShadow !== undefined) this.hasShadow = newConfig.danmakuTextShadow !== false;
      if (newConfig.danmakuArea !== undefined) this.displayAreaRatio = parseFloat(newConfig.danmakuArea);

      if (this.canvas) {
        if (this.isEnabled) {
          this.canvas.style.display = 'block';
          if (this.comments.length > 0 && !this.isPaused) {
            this.startLoop();
          }
        } else {
          this.canvas.style.display = 'none';
          this.clear();
          this.stopLoop();
        }
      }

      this.onFullscreenChange(this.isFS || false, newConfig);
    } catch (e) {}
  }

  getOrCreateCircularAvatar(url) {
    if (!url) return null;
    if (this.avatarCache.has(url)) {
      return this.avatarCache.get(url);
    }

    const img = new Image();
    // Do not set crossOrigin = 'anonymous' to avoid CORS blocking on various CDN endpoints
    const entry = { canvas: null, ready: false };
    this.avatarCache.set(url, entry);

    if (this.avatarCache.size > 200) {
      const firstKey = this.avatarCache.keys().next().value;
      this.avatarCache.delete(firstKey);
    }

    img.onload = () => {
      try {
        const size = 64; // High-res offscreen stamp
        const offCanvas = document.createElement('canvas');
        offCanvas.width = size;
        offCanvas.height = size;
        const octx = offCanvas.getContext('2d');
        octx.beginPath();
        octx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        octx.closePath();
        octx.clip();
        octx.drawImage(img, 0, 0, size, size);

        entry.canvas = offCanvas;
        entry.ready = true;
      } catch (err) {
        entry.canvas = img;
        entry.ready = true;
      }
    };
    img.onerror = () => {
      this.avatarCache.delete(url);
    };
    img.src = url;

    return entry;
  }

  addComment(msgData) {
    try {
      if (!this.isEnabled || !this.ctx || !msgData || !msgData.text) return;
      if (this.comments.length >= 100) return; // Cap maximum onscreen capacity

      const now = Date.now();
      if (!this.tracks || this.tracks.length === 0) this.recalculateTracks();

      // Find available track
      let trackIndex = -1;
      for (let i = 0; i < this.tracks.length; i++) {
        if (this.tracks[i] <= now) {
          trackIndex = i;
          break;
        }
      }

      if (trackIndex === -1) {
        let minTime = Infinity;
        for (let i = 0; i < this.tracks.length; i++) {
          if (this.tracks[i] < minTime) {
            minTime = this.tracks[i];
            trackIndex = i;
          }
        }
      }
      if (trackIndex === -1) trackIndex = 0;

      // Pre-measure text width
      this.ctx.font = `bold ${this.fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const textMetrics = this.ctx.measureText(msgData.text);
      const textWidth = textMetrics.width;

      // Offscreen circular avatar cache
      const avatarEntry = msgData.avatar ? this.getOrCreateCircularAvatar(msgData.avatar) : null;

      // Pre-measure badge width for SuperChat
      let badgeWidth = 0;
      let badgeText = '';
      if (msgData.isSuperChat) {
        badgeText = msgData.amount || 'SuperChat';
        badgeWidth = this.ctx.measureText(badgeText).width + 10;
      }

      const avatarSpacing = avatarEntry ? this.fontSize * 1.3 : 0;
      const badgeSpacing = msgData.isSuperChat ? badgeWidth + 8 : 0;
      const totalWidth = textWidth + avatarSpacing + badgeSpacing;

      const canvasWidth = (this.canvas && this.canvas.width > 0) ? (this.canvas.width / this.dpr) : (window.innerWidth || 1280);
      const speedPxPerMs = (canvasWidth + totalWidth) / (this.speed * 1000);
      const timeToClearRightEdge = (totalWidth + 30) / speedPxPerMs;

      this.tracks[trackIndex] = now + Math.min(timeToClearRightEdge, this.speed * 800);

      this.comments.push({
        text: msgData.text,
        author: msgData.author || '',
        avatarEntry,
        isSuperChat: msgData.isSuperChat || false,
        badgeText,
        badgeWidth,
        trackIndex,
        startTime: now,
        width: totalWidth,
        textWidth
      });

      // Lazy re-check video listeners if needed
      if (!this.videoEl) {
        this.attachVideoListeners();
      }

      // Wake up render loop if not running
      if (!this.animFrameId && !this.isPaused && !document.hidden) {
        this.startLoop();
      }
    } catch (e) {}
  }

  addCommentBatch(batch) {
    if (!Array.isArray(batch) || batch.length === 0) return;
    for (let i = 0; i < batch.length; i++) {
      this.addComment(batch[i]);
    }
  }

  startLoop() {
    if (this.animFrameId) return;
    const loop = () => {
      this.render();
      if (this.comments.length > 0 && this.isEnabled && !this.isPaused && !document.hidden) {
        this.animFrameId = requestAnimationFrame(loop);
      } else {
        // Sleep when no comments or disabled
        this.stopLoop();
      }
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  stopLoop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  render() {
    try {
      if (!this.isEnabled || !this.ctx || !this.canvas) return;

      const now = Date.now();
      const canvasWidth = this.canvas.width / this.dpr;
      const canvasHeight = this.canvas.height / this.dpr;

      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      if (this.comments.length === 0) return;

      this.ctx.save();
      this.ctx.scale(this.dpr, this.dpr);
      this.ctx.globalAlpha = this.opacity;
      this.ctx.font = `bold ${this.fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      this.ctx.textBaseline = 'top';

      const durationMs = this.speed * 1000;
      const lineHeight = this.fontSize * 1.35;
      const remainingComments = [];

      // Setup Shadow properties once per frame
      if (this.hasShadow) {
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 2;
      } else {
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
      }

      for (let i = 0; i < this.comments.length; i++) {
        const item = this.comments[i];
        const elapsed = now - item.startTime;
        if (elapsed > durationMs) continue; // Out of life

        const progress = elapsed / durationMs;
        const x = canvasWidth - progress * (canvasWidth + item.width);
        const y = item.trackIndex * lineHeight + 12;

        if (x + item.width < 0) continue; // Out of screen

        let currentX = x;

        // Blazing Fast Offscreen Pre-rendered Avatar (Zero clipping overhead)
        if (item.avatarEntry && item.avatarEntry.ready && item.avatarEntry.canvas) {
          const avatarSize = this.fontSize * 1.1;
          this.ctx.drawImage(item.avatarEntry.canvas, currentX, y, avatarSize, avatarSize);
          currentX += avatarSize + 6;
        }

        // Render SuperChat Badge (Pre-calculated metrics)
        if (item.isSuperChat && item.badgeWidth > 0) {
          const badgeH = this.fontSize * 1.1;
          this.ctx.fillStyle = '#ffb300';
          this.ctx.beginPath();
          if (this.ctx.roundRect) {
            this.ctx.roundRect(currentX, y, item.badgeWidth, badgeH, 4);
          } else {
            this.ctx.rect(currentX, y, item.badgeWidth, badgeH);
          }
          this.ctx.fill();

          this.ctx.fillStyle = '#000000';
          this.ctx.fillText(item.badgeText, currentX + 5, y + 1);
          currentX += item.badgeWidth + 8;
        }

        // Render Comment Text
        if (this.hasStroke) {
          this.ctx.lineWidth = 3;
          this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
          this.ctx.strokeText(item.text, currentX, y);
        }

        this.ctx.fillStyle = this.textColor || '#ffffff';
        this.ctx.fillText(item.text, currentX, y);

        remainingComments.push(item);
      }

      this.ctx.restore();
      this.comments = remainingComments;
    } catch (e) {}
  }

  clear() {
    try {
      this.comments = [];
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    } catch (e) {}
  }

  destroy() {
    this.stopLoop();
    this.clear();
    window.removeEventListener('resize', this.boundResize);
    document.removeEventListener('visibilitychange', this.boundVisibilityChange);
    if (this.videoEl) {
      this.videoEl.removeEventListener('play', this.boundVideoPlay);
      this.videoEl.removeEventListener('pause', this.boundVideoPause);
      this.videoEl = null;
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
      this.canvas = null;
    }
  }
}

window.ytDanmakuEngine = new DanmakuEngine();
