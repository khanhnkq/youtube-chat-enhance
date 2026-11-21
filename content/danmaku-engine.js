class DanmakuEngine {
  constructor() {
    this.layer = null;
    this.playerEl = null;
    this.videoEl = null;
    this.measureContext = null;
    this.resizeObserver = null;
    this.isEnabled = true;
    this.speed = 10;
    this.fontSize = 22;
    this.opacity = 0.9;
    this.displayAreaRatio = 0.5;
    this.textColor = '#ffffff';
    this.hasStroke = false;
    this.hasShadow = true;
    this.config = {};
    this.tracks = [];
    this.pending = [];
    this.pendingDrainTimer = null;
    this.pausedAt = null;
    this.pausedTotal = 0;
    this.activeItems = [];
    this.nodePool = [];
    this.layerWidth = 0;
    this.layerHeight = 0;
    this.isFS = false;

    this.boundVideoPlay = this.onVideoPlay.bind(this);
    this.boundVideoPause = this.onVideoPause.bind(this);
  }

  static trackFreeAt(last, newV, layerWidth, gap) {
    if (!last) return -Infinity;

    const t1 = last.start + (last.w + gap) / last.v;
    if (newV > last.v) {
      const exit = last.start + (layerWidth + last.w) / last.v;
      const t2 = exit - layerWidth / newV;
      return Math.max(t1, t2);
    }
    return t1;
  }

  init(playerElement, config = {}) {
    try {
      const player = playerElement || document.querySelector('#movie_player, .html5-video-player');
      if (!player) return false;

      if (this.playerEl && this.playerEl !== player) this.destroy();
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      this.clear();

      this.playerEl = player;
      this.pausedAt = null;
      this.pausedTotal = 0;
      this.config = config || {};
      this.applyConfig(this.config, true);

      for (const canvas of this.playerEl.querySelectorAll('.yt-danmaku-canvas')) {
        canvas.remove();
      }

      this.layer = this.playerEl.querySelector('.yt-danmaku-layer');
      if (!this.layer) {
        this.layer = document.createElement('div');
        this.layer.className = 'yt-danmaku-layer';
        this.playerEl.appendChild(this.layer);
      }

      if (!this.measureContext) {
        this.measureContext = document.createElement('canvas').getContext('2d');
      }

      this.layerWidth = this.playerEl.clientWidth;
      this.layerHeight = this.playerEl.clientHeight * this.displayAreaRatio;
      this.updateLayerStyle();
      this.recalculateTracks();
      this.attachVideoListeners();
      this.pausedAt = this.isVideoPaused() ? performance.now() : null;

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(entries => {
          const entry = entries.find(item => item.target === this.layer);
          if (!entry) return;
          this.layerWidth = entry.contentRect.width;
          this.layerHeight = entry.contentRect.height;
          this.recalculateTracks();
        });
        this.resizeObserver.observe(this.layer);
      }

      this.updateLayerStyle();
      this.recalculateTracks();
      return true;
    } catch (e) {
      console.warn('[YT Chat Extension] DOM DanmakuEngine init warning:', e);
      return false;
    }
  }

  applyConfig(config, isInitial = false) {
    if (isInitial) {
      this.speed = config.danmakuSpeed || 10;
      this.fontSize = config.danmakuFontSize || 22;
      this.opacity = (config.danmakuOpacity !== undefined ? config.danmakuOpacity : 90) / 100;
      this.displayAreaRatio = parseFloat(config.danmakuArea || '0.5');
      this.textColor = config.danmakuTextColor || '#ffffff';
      this.hasStroke = !!config.danmakuTextStroke;
      this.hasShadow = config.danmakuTextShadow !== false;
      this.isEnabled = config.enableDanmaku !== undefined ? config.enableDanmaku : true;
      return;
    }

    if (config.enableDanmaku !== undefined) this.isEnabled = config.enableDanmaku;
    if (config.danmakuSpeed !== undefined) this.speed = config.danmakuSpeed;
    if (config.danmakuFontSize !== undefined) this.fontSize = config.danmakuFontSize;
    if (config.danmakuOpacity !== undefined) this.opacity = config.danmakuOpacity / 100;
    if (config.danmakuTextColor !== undefined) this.textColor = config.danmakuTextColor;
    if (config.danmakuTextStroke !== undefined) this.hasStroke = !!config.danmakuTextStroke;
    if (config.danmakuTextShadow !== undefined) this.hasShadow = config.danmakuTextShadow !== false;
    if (config.danmakuArea !== undefined) {
      const previousAreaRatio = this.displayAreaRatio;
      this.displayAreaRatio = parseFloat(config.danmakuArea);
      if (previousAreaRatio && Number.isFinite(this.displayAreaRatio)) {
        this.layerHeight *= this.displayAreaRatio / previousAreaRatio;
      }
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
      }
    } catch (e) {}
  }

  clock() {
    return (this.pausedAt ?? performance.now()) - this.pausedTotal;
  }

  isVideoPaused() {
    if (this.videoEl) return this.videoEl.paused;
    const video = this.playerEl ? this.playerEl.querySelector('video') : document.querySelector('video');
    return video ? video.paused : false;
  }

  onVideoPlay() {
    if (this.pausedAt !== null) {
      this.pausedTotal += performance.now() - this.pausedAt;
      this.pausedAt = null;
    }
    for (const item of this.activeItems) {
      if (item.animation) item.animation.play();
    }
    this.drainPending();
  }

  onVideoPause() {
    if (this.pausedAt === null) this.pausedAt = performance.now();
    for (const item of this.activeItems) {
      if (item.animation) item.animation.pause();
    }
  }

  parseHexColor(color) {
    const match = /^#([a-f\d]{3}|[a-f\d]{6})$/i.exec(color);
    if (!match) return null;
    const hex = match[1].length === 3
      ? [...match[1]].map(character => character + character).join('')
      : match[1];
    return [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16));
  }

  updateLayerStyle() {
    if (!this.layer) return;
    this.layer.style.position = 'absolute';
    this.layer.style.top = '0';
    this.layer.style.left = '0';
    this.layer.style.width = '100%';
    this.layer.style.height = `${this.displayAreaRatio * 100}%`;
    this.layer.style.setProperty('--dm-font-size', `${this.fontSize}px`);
    const color = this.textColor || '#ffffff';
    const rgb = this.parseHexColor(color);
    if (rgb) {
      this.layer.style.setProperty('--dm-color', `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${this.opacity})`);
      this.layer.style.removeProperty('opacity');
    } else {
      this.layer.style.setProperty('--dm-color', color);
      this.layer.style.opacity = this.opacity;
    }
    this.layer.style.setProperty('--dm-shadow-color', `rgba(0, 0, 0, ${0.85 * this.opacity})`);
    this.layer.classList.toggle('dm-shadow', this.hasShadow);
    this.layer.classList.toggle('dm-stroke', this.hasStroke);
    this.layer.style.display = this.isEnabled ? '' : 'none';
    if (!this.isEnabled) this.clear();
  }

  recalculateTracks() {
    const lineHeight = this.fontSize * 1.35;
    const calculatedTrackCount = Math.floor(this.layerHeight / lineHeight);
    const trackCount = Number.isFinite(calculatedTrackCount)
      ? Math.max(1, calculatedTrackCount)
      : 5;
    if (this.tracks.length !== trackCount) {
      const tracks = this.tracks.slice(0, trackCount);
      while (tracks.length < trackCount) tracks.push(null);
      this.tracks = tracks;
    }
  }

  onFullscreenChange(isFullscreen, newConfig) {
    try {
      this.isFS = isFullscreen;
      if (newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (newConfig.enableDanmaku !== undefined) this.isEnabled = newConfig.enableDanmaku;
      }
      this.updateLayerStyle();
      this.recalculateTracks();
    } catch (e) {}
  }

  updateConfig(newConfig) {
    try {
      if (!newConfig) return;
      this.config = { ...this.config, ...newConfig };
      this.applyConfig(newConfig);
      this.updateLayerStyle();
      this.recalculateTracks();
    } catch (e) {}
  }

  getItemNode() {
    const node = this.nodePool.pop() || document.createElement('div');
    node.replaceChildren();
    for (const attribute of [...node.attributes]) {
      node.removeAttribute(attribute.name);
    }
    node.className = 'yt-danmaku-item';
    return node;
  }

  recycleNode(node) {
    if (this.nodePool.length < 40) this.nodePool.push(node);
  }

  removeActiveItem(item, recycle = true) {
    const index = this.activeItems.indexOf(item);
    if (index !== -1) this.activeItems.splice(index, 1);
    if (item.animation) {
      item.animation.onfinish = null;
      item.animation.oncancel = null;
      item.animation.cancel();
      item.animation = null;
    }
    item.el.remove();
    if (recycle) this.recycleNode(item.el);
  }

  finishItem(item) {
    if (!this.activeItems.includes(item)) return;
    this.removeActiveItem(item);
  }

  schedulePendingDrain() {
    if (
      this.pendingDrainTimer !== null ||
      this.pending.length === 0 ||
      this.isVideoPaused()
    ) {
      return;
    }

    this.pendingDrainTimer = setTimeout(() => {
      this.pendingDrainTimer = null;
      this.drainPending();
    }, 200);
  }

  drainPending() {
    if (this.isVideoPaused()) return;

    while (this.pending.length > 0) {
      let placed;
      try {
        placed = this.placeComment(this.pending[0]);
      } catch (e) {
        placed = true;
      }
      if (!placed) break;
      this.pending.shift();
    }

    this.schedulePendingDrain();
  }

  placeComment(msgData) {
    if (!this.tracks || this.tracks.length === 0) this.recalculateTracks();

    const now = this.clock();
    const text = String(msgData.text);
    this.measureContext.font = `bold ${this.fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const textWidth = this.measureContext.measureText(text).width;
    const hasAvatar = !!msgData.avatar;
    const isSuperChat = !!msgData.isSuperChat;
    const badgeText = isSuperChat ? (msgData.amount || 'SuperChat') : '';
    const badgeTextWidth = isSuperChat ? this.measureContext.measureText(badgeText).width : 0;
    const avatarSpacing = hasAvatar ? this.fontSize * 1.1 + 6 : 0;
    const badgeSpacing = isSuperChat ? badgeTextWidth + 10 + 6 : 0;
    const totalWidth = textWidth + avatarSpacing + badgeSpacing;
    const newV = (this.layerWidth + totalWidth) / (this.speed * 1000);

    let trackIndex = -1;
    for (let i = 0; i < this.tracks.length; i++) {
      if (DanmakuEngine.trackFreeAt(this.tracks[i], newV, this.layerWidth, 24) <= now) {
        trackIndex = i;
        break;
      }
    }
    if (trackIndex === -1) return false;

    const previousTrack = this.tracks[trackIndex];
    this.tracks[trackIndex] = { start: now, v: newV, w: totalWidth };

    const lineHeight = this.fontSize * 1.35;
    const y = trackIndex * lineHeight + 12;
    const node = this.getItemNode();
    node.textContent = text;

    if (hasAvatar) {
      const avatar = document.createElement('img');
      avatar.className = 'yt-danmaku-avatar';
      avatar.decoding = 'async';
      avatar.src = msgData.avatar;
      avatar.alt = '';
      node.insertBefore(avatar, node.firstChild);
    }

    if (isSuperChat) {
      const badge = document.createElement('span');
      badge.className = 'yt-danmaku-badge';
      badge.textContent = badgeText;
      node.insertBefore(badge, hasAvatar ? node.childNodes[1] : node.firstChild);
    }

    this.layer.appendChild(node);
    let animation;
    try {
      animation = node.animate([
        { transform: `translate3d(${this.layerWidth}px,${y}px,0)` },
        { transform: `translate3d(${-totalWidth}px,${y}px,0)` }
      ], {
        duration: this.speed * 1000,
        easing: 'linear',
        fill: 'none'
      });
    } catch (e) {
      this.tracks[trackIndex] = previousTrack;
      node.remove();
      this.recycleNode(node);
      return true;
    }

    if (this.activeItems.length >= 80) {
      this.removeActiveItem(this.activeItems[0]);
    }

    const item = { el: node, animation };
    this.activeItems.push(item);
    animation.onfinish = () => this.finishItem(item);

    if (!this.videoEl) this.attachVideoListeners();
    if (this.isVideoPaused()) animation.pause();
    return true;
  }

  addComment(msgData) {
    try {
      if (!this.isEnabled || !this.layer || !this.measureContext || !msgData || !msgData.text) return;
      if (this.isVideoPaused() || this.pending.length > 0 || !this.placeComment(msgData)) {
        if (this.pending.length >= 30) this.pending.shift();
        this.pending.push(msgData);
        this.schedulePendingDrain();
      }
    } catch (e) {}
  }

  addCommentBatch(batch) {
    if (!Array.isArray(batch) || batch.length === 0) return;
    for (let i = 0; i < batch.length; i++) {
      this.addComment(batch[i]);
    }
  }

  clear() {
    this.pending = [];
    if (this.pendingDrainTimer !== null) {
      clearTimeout(this.pendingDrainTimer);
      this.pendingDrainTimer = null;
    }
    this.tracks = this.tracks.map(() => null);
    for (const item of this.activeItems.slice()) {
      this.removeActiveItem(item, false);
    }
    this.activeItems = [];
    this.nodePool = [];
  }

  destroy() {
    this.clear();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.videoEl) {
      this.videoEl.removeEventListener('play', this.boundVideoPlay);
      this.videoEl.removeEventListener('pause', this.boundVideoPause);
      this.videoEl = null;
    }
    if (this.layer) {
      this.layer.remove();
      this.layer = null;
    }
    this.playerEl = null;
  }
}

window.ytDanmakuEngine = new DanmakuEngine();
