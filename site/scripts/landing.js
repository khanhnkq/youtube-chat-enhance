(function () {
  'use strict';

  const LANG = document.documentElement.lang === 'vi' ? 'vi' : 'en';
  const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SAMPLE_MESSAGES = LANG === 'vi'
    ? [
        { author: '@gaucon.demo', color: '#ff88aa', avatar: 'G', bg: '#7c4d3e', text: 'Khung chat trong suốt nhìn gọn hẳn!' },
        { author: '@mai.demo', color: '#ff88aa', avatar: 'M', bg: '#b44825', text: 'Xem toàn màn hình vẫn đọc chat ngon lành' },
        { author: '@khoa.demo', color: '#ff88aa', avatar: 'K', bg: '#2c5ba8', text: 'Chào cả nhà buổi tối 👋' },
        { author: '@quynh.demo', color: '#ff88aa', avatar: 'Q', bg: '#1b7a78', text: 'Chữ chạy Danmaku mượt thật sự 💯' },
        { author: '@tuan.demo', color: '#ff88aa', avatar: 'T', bg: '#4e5f70', text: 'Kéo thả khung chat đi góc nào cũng được' },
        { author: '@lan.demo', color: '#ff88aa', avatar: 'L', bg: '#a3285b', text: 'Hải Phòng có mặt ✌️' },
        { author: '@nam.demo', color: '#ff88aa', avatar: 'N', bg: '#d97706', text: 'Cảm ơn buổi phát sóng cực chill!', superchat: '50.000₫' },
        { author: '@dem.khuya.demo', color: '#ff88aa', avatar: 'D', bg: '#4b457a', text: 'Tạm dừng video là chữ cũng đứng yên theo' },
        { author: '@ha.demo', color: '#ff88aa', avatar: 'H', bg: '#2e7d4f', text: 'Không che mất khung hình chính nữa rồi' }
      ]
    : [
        { author: '@leo.demo', color: '#ff88aa', avatar: 'L', bg: '#a3285b', text: 'So you can drag the chat anywhere over the video!' },
        { author: '@pia.demo', color: '#ff88aa', avatar: 'P', bg: '#4e5f70', text: 'Transparent overlay looks so clean in fullscreen' },
        { author: '@gus.demo', color: '#ff88aa', avatar: 'G', bg: '#7c4d3e', text: 'Just joined, hello everyone 👋' },
        { author: '@ben.demo', color: '#ff88aa', avatar: 'B', bg: '#c0392b', text: 'Bilibili-style Danmaku feels super smooth' },
        { author: '@mia.demo', color: '#ff88aa', avatar: 'M', bg: '#1b7a78', text: 'Oslo checking in — zero clutter!' },
        { author: '@kai.demo', color: '#ff88aa', avatar: 'K', bg: '#2c5ba8', text: 'Love watching live streams like this ❤️' },
        { author: '@yuki.demo', color: '#ff88aa', avatar: 'Y', bg: '#d97706', text: 'Amazing stream tonight, keep it going!', superchat: '$5.00' },
        { author: '@vera.demo', color: '#ff88aa', avatar: 'V', bg: '#6d399c', text: 'Pausing the player freezes scrolling comments right in place' },
        { author: '@theo.demo', color: '#ff88aa', avatar: 'T', bg: '#386b4a', text: 'Minimizing to the Live Chat badge is so handy' }
      ];

  function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  /* ========================================================================
     1. Full Interactive Extension Demo Studio
     ======================================================================== */
  function initDemoStudio() {
    const studio = document.getElementById('demo-studio');
    if (!studio) return;

    const shell = studio.querySelector('#demo-player-shell');
    const stage = studio.querySelector('#demo-video-stage');
    const floatingBox = studio.querySelector('#demo-floating-chat');
    const dragBar = studio.querySelector('#demo-chat-dragbar');
    const resizeHandle = studio.querySelector('#demo-resize-handle');
    const minBtn = studio.querySelector('#demo-min-btn');
    const minBadge = studio.querySelector('#demo-min-badge');
    const msgList = studio.querySelector('#demo-chat-messages');
    const nativeList = studio.querySelector('#demo-native-list');
    const inputMock = studio.querySelector('#demo-chat-input-mock');
    const danmakuLayer = studio.querySelector('#demo-danmaku-layer');

    const ctrlFloating = studio.querySelector('#ctrl-floating');
    const ctrlDanmaku = studio.querySelector('#ctrl-danmaku');
    const ctrlHideFrame = studio.querySelector('#ctrl-hide-frame');
    const ctrlHideInput = studio.querySelector('#ctrl-hide-input');
    const ctrlStroke = studio.querySelector('#ctrl-stroke');
    const ctrlOpacity = studio.querySelector('#ctrl-opacity');
    const ctrlOpacityVal = studio.querySelector('#ctrl-opacity-val');
    const ctrlFontSize = studio.querySelector('#ctrl-fontsize');
    const ctrlFontSizeVal = studio.querySelector('#ctrl-fontsize-val');
    const ctrlSpeed = studio.querySelector('#ctrl-speed');
    const ctrlSpeedVal = studio.querySelector('#ctrl-speed-val');
    const ctrlResetPos = studio.querySelector('#ctrl-reset-pos');
    const pauseBtn = studio.querySelector('#demo-pause-btn');
    const superChatBtn = studio.querySelector('#demo-superchat-btn');
    const sendForm = studio.querySelector('#demo-send-form');
    const sendInput = studio.querySelector('#demo-send-input');
    const swatches = Array.from(studio.querySelectorAll('.swatch-btn'));
    const areaPills = Array.from(studio.querySelectorAll('.area-pill'));

    const state = {
      floatingOn: true,
      danmakuOn: true,
      minimized: false,
      hideFrame: true,
      hideInput: true,
      bgOpacity: 25,
      chatFontSize: 13,
      authorColor: '#ff88aa',
      danmakuSpeed: 9,
      danmakuArea: 0.5,
      danmakuStroke: false,
      paused: false
    };

    const laneFreeAt = [];
    let msgCursor = 0;
    let feedTimer = null;

    function applyVisualState() {
      const showFloating = state.floatingOn && !state.minimized;
      floatingBox.classList.toggle('is-hidden', !showFloating);
      minBadge.classList.toggle('is-visible', state.floatingOn && state.minimized);
      shell.classList.toggle('show-native-chat', !state.floatingOn);

      const alpha = (state.bgOpacity / 100).toFixed(2);
      floatingBox.style.setProperty('--demo-bg-alpha', alpha);
      floatingBox.style.backgroundColor = `rgba(15, 17, 20, ${alpha})`;
      floatingBox.classList.toggle('show-frame-header', !state.hideFrame);
      inputMock.classList.toggle('is-hidden', state.hideInput);

      msgList.style.fontSize = `${state.chatFontSize}px`;
      msgList.querySelectorAll('.demo-msg-author').forEach((el) => {
        el.style.color = state.authorColor;
      });

      danmakuLayer.style.display = state.danmakuOn ? 'block' : 'none';
      if (!state.danmakuOn) {
        danmakuLayer.replaceChildren();
      }

      ctrlOpacityVal.textContent = `${state.bgOpacity}%`;
      ctrlFontSizeVal.textContent = `${state.chatFontSize}px`;
      ctrlSpeedVal.textContent = `${state.danmakuSpeed}s`;
    }

    function appendChatRow(container, item, isNative) {
      const row = createEl('div', `demo-msg${item.superchat ? ' is-superchat' : ''}`);
      const avatar = createEl('span', 'demo-msg-avatar', item.avatar);
      avatar.style.backgroundColor = item.bg || '#e3363b';

      const body = createEl('div');
      const author = createEl('span', 'demo-msg-author', item.author);
      author.style.color = item.superchat ? '#fff7d6' : (isNative ? '#c4c9c6' : state.authorColor);
      body.appendChild(author);

      if (item.superchat) {
        body.appendChild(createEl('span', 'dm-amount', item.superchat));
        body.appendChild(document.createTextNode(' '));
      }
      body.appendChild(createEl('span', '', item.text));

      row.appendChild(avatar);
      row.appendChild(body);
      container.appendChild(row);

      while (container.children.length > 14) {
        container.removeChild(container.firstChild);
      }
      container.scrollTop = container.scrollHeight;
    }

    function spawnDanmaku(item) {
      if (!state.danmakuOn || state.paused || REDUCED_MOTION) return;
      const stageRect = stage.getBoundingClientRect();
      if (stageRect.width < 120) return;

      const laneHeight = 32;
      const usableHeight = Math.max(laneHeight, (stageRect.height - 54) * state.danmakuArea);
      const maxLanes = Math.max(1, Math.floor(usableHeight / laneHeight));
      const now = performance.now();

      let chosenLane = -1;
      for (let i = 0; i < maxLanes; i += 1) {
        if (!laneFreeAt[i] || laneFreeAt[i] <= now) {
          chosenLane = i;
          break;
        }
      }
      if (chosenLane === -1) {
        chosenLane = Math.floor(Math.random() * maxLanes);
      }

      const bullet = createEl(
        'div',
        `dm-bullet${state.danmakuStroke ? ' has-stroke' : ''}${item.superchat ? ' is-superchat' : ''}`
      );
      bullet.style.top = `${10 + chosenLane * laneHeight}px`;
      bullet.style.fontSize = `${Math.max(14, state.chatFontSize + 4)}px`;
      bullet.style.color = '#ffffff';

      const avatar = createEl('span', 'dm-avatar', item.avatar);
      avatar.style.backgroundColor = item.bg || '#e3363b';
      bullet.appendChild(avatar);

      if (item.superchat) {
        bullet.appendChild(createEl('span', 'dm-amount', item.superchat));
      }
      bullet.appendChild(createEl('span', '', item.text));
      danmakuLayer.appendChild(bullet);

      const bulletWidth = bullet.offsetWidth || 200;
      const travel = stageRect.width + bulletWidth + 32;
      const durationMs = state.danmakuSpeed * 1000;
      const clearanceMs = ((bulletWidth + 44) / travel) * durationMs;
      laneFreeAt[chosenLane] = now + clearanceMs;

      if (typeof bullet.animate === 'function') {
        const anim = bullet.animate(
          [
            { transform: 'translate3d(0, 0, 0)' },
            { transform: `translate3d(-${travel}px, 0, 0)` }
          ],
          { duration: durationMs, easing: 'linear', fill: 'forwards' }
        );
        anim.onfinish = () => {
          bullet.remove();
        };
      } else {
        bullet.remove();
      }
    }

    function pushMessage(item, alsoDanmaku) {
      appendChatRow(msgList, item, false);
      appendChatRow(nativeList, item, true);
      if (alsoDanmaku) {
        spawnDanmaku(item);
      }
    }

    // Seed initial messages
    for (let i = 0; i < 6; i += 1) {
      pushMessage(SAMPLE_MESSAGES[i % SAMPLE_MESSAGES.length], i < 3);
      msgCursor = i + 1;
    }

    function scheduleNextMessage() {
      if (feedTimer) clearInterval(feedTimer);
      feedTimer = setInterval(() => {
        if (state.paused) return;
        const item = SAMPLE_MESSAGES[msgCursor % SAMPLE_MESSAGES.length];
        msgCursor += 1;
        pushMessage(item, true);
      }, 2200);
    }
    scheduleNextMessage();

    // Controls bindings
    ctrlFloating.addEventListener('change', () => {
      state.floatingOn = ctrlFloating.checked;
      if (state.floatingOn) state.minimized = false;
      applyVisualState();
    });

    ctrlDanmaku.addEventListener('change', () => {
      state.danmakuOn = ctrlDanmaku.checked;
      applyVisualState();
      if (state.danmakuOn) {
        spawnDanmaku(SAMPLE_MESSAGES[msgCursor % SAMPLE_MESSAGES.length]);
        msgCursor += 1;
      }
    });

    ctrlHideFrame.addEventListener('change', () => {
      state.hideFrame = ctrlHideFrame.checked;
      state.hideInput = ctrlHideFrame.checked;
      applyVisualState();
    });

    ctrlHideInput.addEventListener('change', () => {
      state.hideInput = ctrlHideInput.checked;
      applyVisualState();
    });

    ctrlStroke.addEventListener('change', () => {
      state.danmakuStroke = ctrlStroke.checked;
      danmakuLayer.querySelectorAll('.dm-bullet').forEach((el) => {
        el.classList.toggle('has-stroke', state.danmakuStroke);
      });
    });

    ctrlOpacity.addEventListener('input', () => {
      state.bgOpacity = Number(ctrlOpacity.value);
      applyVisualState();
    });

    ctrlFontSize.addEventListener('input', () => {
      state.chatFontSize = Number(ctrlFontSize.value);
      applyVisualState();
    });

    ctrlSpeed.addEventListener('input', () => {
      state.danmakuSpeed = Number(ctrlSpeed.value);
      applyVisualState();
    });

    swatches.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.authorColor = btn.dataset.color || '#ff88aa';
        swatches.forEach((s) => s.classList.toggle('is-selected', s === btn));
        applyVisualState();
      });
    });

    areaPills.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.danmakuArea = Number(btn.dataset.area || '0.5');
        areaPills.forEach((p) => p.classList.toggle('is-active', p === btn));
      });
    });

    minBtn.addEventListener('click', () => {
      state.minimized = true;
      applyVisualState();
    });

    minBadge.addEventListener('click', () => {
      state.minimized = false;
      applyVisualState();
    });

    ctrlResetPos.addEventListener('click', () => {
      floatingBox.style.left = '';
      floatingBox.style.right = '22px';
      floatingBox.style.top = '22px';
      floatingBox.style.width = '';
      floatingBox.style.height = '';
      state.minimized = false;
      state.floatingOn = true;
      ctrlFloating.checked = true;
      applyVisualState();
    });

    pauseBtn.addEventListener('click', () => {
      state.paused = !state.paused;
      stage.classList.toggle('is-paused', state.paused);
      pauseBtn.textContent = state.paused
        ? (LANG === 'vi' ? 'Phát tiếp' : 'Resume')
        : (LANG === 'vi' ? 'Tạm dừng' : 'Pause');

      danmakuLayer.querySelectorAll('.dm-bullet').forEach((el) => {
        if (typeof el.getAnimations === 'function') {
          el.getAnimations().forEach((anim) => {
            if (state.paused) anim.pause();
            else anim.play();
          });
        }
      });
    });

    superChatBtn.addEventListener('click', () => {
      const sc = LANG === 'vi'
        ? { author: '@ban.demo', color: '#fbbf24', avatar: 'B', bg: '#d97706', text: 'Ủng hộ livestream chất lượng!', superchat: '100.000₫' }
        : { author: '@you.demo', color: '#fbbf24', avatar: 'Y', bg: '#d97706', text: 'Testing Super Chat in Danmaku!', superchat: '$10.00' };
      pushMessage(sc, true);
    });

    sendForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = sendInput.value.trim();
      if (!text) return;
      pushMessage(
        {
          author: LANG === 'vi' ? '@ban.demo' : '@you.demo',
          color: state.authorColor,
          avatar: LANG === 'vi' ? 'B' : 'Y',
          bg: '#e3363b',
          text
        },
        true
      );
      sendInput.value = '';
    });

    // Pointer drag (clamped inside demo video stage)
    dragBar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      e.preventDefault();
      const stageRect = stage.getBoundingClientRect();
      const boxRect = floatingBox.getBoundingClientRect();
      const offsetX = e.clientX - boxRect.left;
      const offsetY = e.clientY - boxRect.top;

      floatingBox.style.right = 'auto';
      floatingBox.style.left = `${boxRect.left - stageRect.left}px`;
      floatingBox.style.top = `${boxRect.top - stageRect.top}px`;
      floatingBox.classList.add('is-dragging');
      dragBar.setPointerCapture(e.pointerId);

      function onMove(ev) {
        const curStage = stage.getBoundingClientRect();
        const maxX = Math.max(0, curStage.width - floatingBox.offsetWidth - 8);
        const maxY = Math.max(0, curStage.height - floatingBox.offsetHeight - 52);
        const nextX = Math.min(Math.max(8, ev.clientX - curStage.left - offsetX), maxX);
        const nextY = Math.min(Math.max(8, ev.clientY - curStage.top - offsetY), maxY);
        floatingBox.style.left = `${nextX}px`;
        floatingBox.style.top = `${nextY}px`;
      }

      function onUp() {
        floatingBox.classList.remove('is-dragging');
        dragBar.removeEventListener('pointermove', onMove);
        dragBar.removeEventListener('pointerup', onUp);
      }

      dragBar.addEventListener('pointermove', onMove);
      dragBar.addEventListener('pointerup', onUp);
    });

    // Pointer resize from bottom-right handle
    resizeHandle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = floatingBox.offsetWidth;
      const startH = floatingBox.offsetHeight;
      const boxRect = floatingBox.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();

      floatingBox.style.right = 'auto';
      floatingBox.style.left = `${boxRect.left - stageRect.left}px`;
      floatingBox.style.top = `${boxRect.top - stageRect.top}px`;
      resizeHandle.setPointerCapture(e.pointerId);

      function onMove(ev) {
        const curStage = stage.getBoundingClientRect();
        const leftVal = parseFloat(floatingBox.style.left) || 0;
        const topVal = parseFloat(floatingBox.style.top) || 0;
        const maxW = Math.max(190, curStage.width - leftVal - 8);
        const maxH = Math.max(150, curStage.height - topVal - 52);
        const nextW = Math.min(Math.max(190, startW + (ev.clientX - startX)), maxW);
        const nextH = Math.min(Math.max(150, startH + (ev.clientY - startY)), maxH);
        floatingBox.style.width = `${nextW}px`;
        floatingBox.style.height = `${nextH}px`;
      }

      function onUp() {
        resizeHandle.removeEventListener('pointermove', onMove);
        resizeHandle.removeEventListener('pointerup', onUp);
      }

      resizeHandle.addEventListener('pointermove', onMove);
      resizeHandle.addEventListener('pointerup', onUp);
    });

    applyVisualState();
  }

  /* ========================================================================
     2. Before / After Interactive Split Comparator
     ======================================================================== */
  function initBeforeAfter() {
    const outer = document.getElementById('ba-comparator');
    if (!outer) return;

    const range = outer.querySelector('#ba-range');
    const afterImg = outer.querySelector('#ba-after-img');
    const afterTag = outer.querySelector('#ba-after-tag');
    const afterCaption = document.getElementById('ba-after-caption');
    const tabs = Array.from(document.querySelectorAll('.ba-mode-tab'));

    function setSplit(val) {
      const clamped = Math.min(96, Math.max(4, Number(val)));
      outer.style.setProperty('--ba-split', `${clamped}%`);
    }

    range.addEventListener('input', () => setSplit(range.value));
    setSplit(range.value);

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => {
          const active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        if (tab.dataset.afterSrc) afterImg.src = tab.dataset.afterSrc;
        if (tab.dataset.afterAlt) afterImg.alt = tab.dataset.afterAlt;
        if (tab.dataset.afterLabel && afterTag) afterTag.textContent = tab.dataset.afterLabel;
        if (tab.dataset.afterDesc && afterCaption) afterCaption.textContent = tab.dataset.afterDesc;
      });
    });
  }

  /* ========================================================================
     3. Video Tour with 7 Interactive Chapter Jumps
     ======================================================================== */
  function initVideoTour() {
    const video = document.getElementById('tour-video');
    const posterBtn = document.getElementById('video-poster-btn');
    const chapterBtns = Array.from(document.querySelectorAll('.chapter-btn'));
    if (!video || !posterBtn) return;

    let pendingSeek = null;

    function applyPendingSeek() {
      if (pendingSeek === null) return;
      const target = pendingSeek;
      if (video.readyState >= 1) {
        try {
          video.currentTime = target;
        } catch {
          // Ignore invalid seek state while media metadata is initializing.
        }
        if (Math.abs(video.currentTime - target) < 1.5) {
          pendingSeek = null;
        }
      }
    }

    function startPlayback(seekTo) {
      posterBtn.classList.add('is-hidden');
      if (typeof seekTo === 'number' && !Number.isNaN(seekTo)) {
        pendingSeek = seekTo;
        if (video.readyState >= 1) {
          applyPendingSeek();
          video.play().catch(() => {
            // Browser autoplay policy may require direct user interaction on video controls.
          });
        } else {
          video.addEventListener('loadedmetadata', () => {
            applyPendingSeek();
            video.play().catch(() => {
              // Browser autoplay policy may require direct user interaction on video controls.
            });
          }, { once: true });
          video.load();
        }
      } else {
        video.play().catch(() => {
          // Browser autoplay policy may require direct user interaction on video controls.
        });
      }
    }

    video.addEventListener('canplay', applyPendingSeek);
    video.addEventListener('seeked', () => {
      if (pendingSeek !== null && Math.abs(video.currentTime - pendingSeek) < 1.5) {
        pendingSeek = null;
      }
    });

    posterBtn.addEventListener('click', () => startPlayback());

    chapterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const seconds = Number(btn.dataset.time || '0');
        chapterBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
        startPlayback(seconds);
      });
    });

    video.addEventListener('timeupdate', () => {
      if (pendingSeek !== null) return;
      const t = video.currentTime;
      let activeBtn = chapterBtns[0];
      for (const btn of chapterBtns) {
        if (t >= Number(btn.dataset.time || '0')) {
          activeBtn = btn;
        }
      }
      chapterBtns.forEach((b) => b.classList.toggle('is-active', b === activeBtn));
    });
  }

  /* ========================================================================
     4. Scroll Reveal (IntersectionObserver)
     ======================================================================== */
  function initReveal() {
    const nodes = Array.from(document.querySelectorAll('.reveal'));
    if (!nodes.length) return;
    if (REDUCED_MOTION || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((n) => n.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );

    nodes.forEach((n) => observer.observe(n));
  }

  document.addEventListener('DOMContentLoaded', () => {
    initDemoStudio();
    initBeforeAfter();
    initVideoTour();
    initReveal();
  });
})();
