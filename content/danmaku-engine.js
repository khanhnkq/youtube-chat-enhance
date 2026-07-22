class DanmakuEngine {
  constructor() {
    this.container = null;
    this.playerEl = null;
    this.isEnabled = true;
    this.speed = 10;
    this.fontSize = 22;
    this.opacity = 0.9;
    this.displayAreaRatio = 0.5;
    this.textColor = '#ffffff';
    this.tracks = [];
    this.config = {};
    this.activeCount = 0;
    this.maxActive = 30;
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

      // Create or locate Danmaku Container inside YouTube Player
      this.container = this.playerEl.querySelector('.yt-danmaku-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.className = 'yt-danmaku-container';
        this.playerEl.appendChild(this.container);
      }

      this.onFullscreenChange(this.isFS || false, this.config);
      return true;
    } catch (e) {
      console.warn('[YT Chat Extension] DanmakuEngine init warning:', e);
      return false;
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
          if (this.isEnabled && this.container) {
            this.container.classList.remove('is-hidden');
          } else if (this.container) {
            this.container.classList.add('is-hidden');
          }
        } else {
          if (this.container) {
            this.container.classList.add('is-hidden');
          }
        }
      } else {
        if (this.container) {
          if (this.isEnabled) this.container.classList.remove('is-hidden');
          else this.container.classList.add('is-hidden');
        }
      }
      this.recalculateTracks();
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
      if (newConfig.danmakuFontSize !== undefined) {
        this.fontSize = newConfig.danmakuFontSize;
      }
      if (newConfig.danmakuOpacity !== undefined) this.opacity = newConfig.danmakuOpacity / 100;
      if (newConfig.danmakuTextColor !== undefined) this.textColor = newConfig.danmakuTextColor;
      if (newConfig.danmakuArea !== undefined) {
        this.displayAreaRatio = parseFloat(newConfig.danmakuArea);
      }
      this.onFullscreenChange(this.isFS || false, newConfig);
    } catch (e) {}
  }

  recalculateTracks() {
    try {
      if (!this.playerEl) return;
      const playerHeight = this.playerEl.clientHeight || 720;
      const availableHeight = playerHeight * this.displayAreaRatio;
      const lineHeight = this.fontSize * 1.4;
      const totalTracks = Math.max(1, Math.floor(availableHeight / lineHeight));

      this.tracks = new Array(totalTracks).fill(0);
    } catch (e) {
      this.tracks = [0, 0, 0, 0, 0];
    }
  }

  addComment(msgData) {
    try {
      if (!this.isEnabled || !this.container || !msgData || !msgData.text) return;
      if (this.activeCount >= this.maxActive) return;

      const now = Date.now();
      const playerWidth = this.playerEl ? this.playerEl.clientWidth : window.innerWidth;
      
      if (!this.tracks || this.tracks.length === 0) this.recalculateTracks();

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

      const topPos = trackIndex * (this.fontSize * 1.4) + 10;
      
      const itemEl = document.createElement('div');
      itemEl.className = 'yt-danmaku-item';
      itemEl.style.top = `${topPos}px`;
      itemEl.style.fontSize = `${this.fontSize}px`;
      itemEl.style.opacity = this.opacity;
      itemEl.style.animation = `ytDanmakuFly ${this.speed}s linear forwards`;

      if (msgData.avatar) {
        const avatarImg = document.createElement('img');
        avatarImg.className = 'yt-danmaku-avatar';
        avatarImg.src = msgData.avatar;
        itemEl.appendChild(avatarImg);
      }

      if (msgData.isSuperChat) {
        const badgeEl = document.createElement('span');
        badgeEl.className = 'yt-danmaku-badge';
        badgeEl.textContent = msgData.amount || 'SuperChat';
        itemEl.appendChild(badgeEl);
      }

      const textSpan = document.createElement('span');
      textSpan.textContent = msgData.text;
      if (this.textColor) {
        textSpan.style.color = this.textColor;
      }
      itemEl.appendChild(textSpan);

      this.container.appendChild(itemEl);
      this.activeCount++;

      const textWidth = msgData.text.length * (this.fontSize * 0.7) + (msgData.avatar ? 30 : 0);
      const speedPxPerMs = (playerWidth + textWidth) / (this.speed * 1000);
      const timeToClearRightEdge = (textWidth + 40) / speedPxPerMs;

      this.tracks[trackIndex] = now + Math.min(timeToClearRightEdge, this.speed * 800);

      itemEl.addEventListener('animationend', () => {
        if (itemEl.parentNode) {
          itemEl.parentNode.removeChild(itemEl);
        }
        this.activeCount = Math.max(0, this.activeCount - 1);
      });
    } catch (e) {
      console.warn('[YT Chat Extension] addComment warning:', e);
    }
  }

  clear() {
    try {
      if (this.container) {
        this.container.innerHTML = '';
        this.activeCount = 0;
      }
    } catch (e) {}
  }
}

window.ytDanmakuEngine = new DanmakuEngine();
