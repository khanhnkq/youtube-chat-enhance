class DanmakuEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.playerEl = null;
    this.isEnabled = true;
    this.speed = 10; // seconds
    this.fontSize = 22;
    this.opacity = 0.9;
    this.displayAreaRatio = 0.5;
    this.textColor = '#ffffff';
    this.config = {};
    this.tracks = [];
    this.comments = [];
    this.avatarCache = new Map();
    this.animFrameId = null;
    this.isFS = false;
    this.dpr = window.devicePixelRatio || 1;
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
      this.isEnabled = this.config.enableDanmaku !== undefined ? this.config.enableDanmaku : true;

      // Locate or create high-performance Canvas element inside YouTube Player
      this.canvas = this.playerEl.querySelector('.yt-danmaku-canvas');
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'yt-danmaku-canvas';
        this.canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:25;';
        this.playerEl.appendChild(this.canvas);
      }

      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();

      this.onFullscreenChange(this.isFS || false, this.config);
      this.startLoop();

      window.removeEventListener('resize', this.boundResize);
      this.boundResize = () => this.resizeCanvas();
      window.addEventListener('resize', this.boundResize);

      return true;
    } catch (e) {
      console.warn('[YT Chat Extension] Canvas DanmakuEngine init warning:', e);
      return false;
    }
  }

  resizeCanvas() {
    try {
      if (!this.canvas || !this.playerEl) return;
      this.dpr = window.devicePixelRatio || 1;
      const width = this.playerEl.clientWidth || window.innerWidth;
      const height = this.playerEl.clientHeight || window.innerHeight;

      if (this.canvas.width !== width * this.dpr || this.canvas.height !== height * this.dpr) {
        this.canvas.width = width * this.dpr;
        this.canvas.height = height * this.dpr;
      }
      this.recalculateTracks();
    } catch (e) {}
  }

  recalculateTracks() {
    try {
      if (!this.canvas) return;
      const canvasHeight = this.canvas.height / this.dpr;
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
      if (autoHide) {
        if (isFullscreen) {
          if (this.isEnabled && this.canvas) {
            this.canvas.style.display = 'block';
          } else if (this.canvas) {
            this.canvas.style.display = 'none';
          }
        } else {
          if (this.canvas) {
            this.canvas.style.display = 'none';
          }
        }
      } else {
        if (this.canvas) {
          if (this.isEnabled) this.canvas.style.display = 'block';
          else this.canvas.style.display = 'none';
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
        } else {
          this.canvas.style.display = 'none';
          this.clear();
        }
      }

      this.onFullscreenChange(this.isFS || false, newConfig);
    } catch (e) {}
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

      let avatarImg = null;
      if (msgData.avatar) {
        if (this.avatarCache.has(msgData.avatar)) {
          avatarImg = this.avatarCache.get(msgData.avatar);
        } else {
          const img = new Image();
          img.src = msgData.avatar;
          this.avatarCache.set(msgData.avatar, img);
          if (this.avatarCache.size > 200) {
            const firstKey = this.avatarCache.keys().next().value;
            this.avatarCache.delete(firstKey);
          }
          avatarImg = img;
        }
      }

      const totalWidth = textWidth + (avatarImg ? this.fontSize * 1.3 : 0) + (msgData.isSuperChat ? 60 : 0);
      const canvasWidth = this.canvas.width / this.dpr;
      const speedPxPerMs = (canvasWidth + totalWidth) / (this.speed * 1000);
      const timeToClearRightEdge = (totalWidth + 30) / speedPxPerMs;

      this.tracks[trackIndex] = now + Math.min(timeToClearRightEdge, this.speed * 800);

      this.comments.push({
        text: msgData.text,
        author: msgData.author || '',
        avatar: avatarImg,
        isSuperChat: msgData.isSuperChat || false,
        amount: msgData.amount || '',
        trackIndex,
        startTime: now,
        width: totalWidth,
        textWidth
      });
    } catch (e) {}
  }

  addCommentBatch(batch) {
    if (!Array.isArray(batch)) return;
    for (let i = 0; i < batch.length; i++) {
      this.addComment(batch[i]);
    }
  }

  startLoop() {
    if (this.animFrameId) return;
    const loop = () => {
      this.render();
      this.animFrameId = requestAnimationFrame(loop);
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

      // Clear full canvas
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

      for (let i = 0; i < this.comments.length; i++) {
        const item = this.comments[i];
        const elapsed = now - item.startTime;
        if (elapsed > durationMs) continue; // Remove completed comment

        const progress = elapsed / durationMs;
        const x = canvasWidth - progress * (canvasWidth + item.width);
        const y = item.trackIndex * lineHeight + 12;

        if (x + item.width < 0) continue; // Out of left screen

        let currentX = x;

        // Render Avatar
        if (item.avatar && item.avatar.complete && item.avatar.naturalWidth > 0) {
          const avatarSize = this.fontSize * 1.1;
          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.arc(currentX + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
          this.ctx.closePath();
          this.ctx.clip();
          this.ctx.drawImage(item.avatar, currentX, y, avatarSize, avatarSize);
          this.ctx.restore();
          currentX += avatarSize + 6;
        }

        // Render SuperChat Badge
        if (item.isSuperChat) {
          const badgeText = item.amount || 'SuperChat';
          const badgeWidth = this.ctx.measureText(badgeText).width + 10;
          this.ctx.fillStyle = '#ffb300';
          this.ctx.beginPath();
          this.ctx.roundRect ? this.ctx.roundRect(currentX, y, badgeWidth, this.fontSize * 1.1, 4) : this.ctx.rect(currentX, y, badgeWidth, this.fontSize * 1.1);
          this.ctx.fill();

          this.ctx.fillStyle = '#000000';
          this.ctx.fillText(badgeText, currentX + 5, y + 1);
          currentX += badgeWidth + 8;
        }

        // Render Comment Text (with configurable stroke & shadow)
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
}

window.ytDanmakuEngine = new DanmakuEngine();
