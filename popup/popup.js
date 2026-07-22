document.addEventListener('DOMContentLoaded', async () => {
  // i18n Translations
  const translations = {
    vi: {
      brandSub: 'Nâng tầm xem Livestream YouTube',
      cardOperatingModes: 'Chế Độ Hoạt Động',
      floatingChatTitle: 'Khung Chat Nổi Trong Suốt',
      floatingChatDesc: 'Hiển thị khung chat đè video full màn',
      danmakuTitle: 'Danmaku (Chữ Chạy Ngang)',
      danmakuDesc: 'Bình luận chạy ngang video như Bilibili',
      autoHideChatTitle: 'Tự Động Ẩn Chat Khi Phóng To',
      autoHideChatDesc: 'Ẩn chat gốc khi Fullscreen & khôi phục khi thoát',
      cardInterfaceCustomization: 'Tinh Chỉnh Giao Diện',
      hideHeaderTitle: 'Ẩn Viền & Thanh Tiêu Đề',
      hideHeaderDesc: 'Chỉ hiện thanh kéo khi rê chuột vào',
      hideRowBgTitle: 'Ẩn Nền Từng Dòng Chat',
      hideRowBgDesc: 'Chỉ hiện chữ & avatar nổi trên video',
      hideInputTitle: 'Ẩn Khung Nhập Chat & Footer',
      hideInputDesc: 'Ẩn ô nhập tin nhắn và thanh thông báo',
      cardColorFloatingChat: 'Màu Sắc & Khung Chat Nổi',
      authorTextColor: 'Màu tên người dùng',
      chatTextColor: 'Màu nội dung tin nhắn',
      bgOpacityLabel: 'Độ trong suốt nền khung chat',
      bgOpacityMin: 'Trong suốt (0%)',
      bgOpacityMax: 'Trong mờ (100%)',
      bgBlurLabel: 'Hiệu ứng kính mờ (Blur)',
      chatFontSizeLabel: 'Cỡ chữ trong khung chat',
      resetPosBtn: 'Đặt lại Vị trí & Kích thước khung',
      cardDanmakuSettings: 'Tùy Chỉnh Danmaku',
      danmakuTextColor: 'Màu chữ Danmaku',
      danmakuStrokeTitle: 'Viền đen chữ Danmaku',
      danmakuStrokeDesc: 'Vẽ viền đen đậm quanh nét chữ',
      danmakuShadowTitle: 'Bóng mờ chữ Danmaku',
      danmakuShadowDesc: 'Tạo hiệu ứng đổ bóng mờ chữ',
      danmakuSpeedLabel: 'Tốc độ chữ chạy',
      danmakuSpeedMin: 'Nhanh (4s)',
      danmakuSpeedMax: 'Chậm (20s)',
      danmakuFontSizeLabel: 'Kích thước chữ Danmaku',
      danmakuOpacityLabel: 'Độ mờ chữ Danmaku',
      danmakuAreaLabel: 'Vùng màn hình hiển thị',
      danmakuArea033: '1/3 Màn hình trên',
      danmakuArea05: 'Nửa màn hình (50%)',
      danmakuArea075: '3/4 Màn hình',
      danmakuArea10: 'Toàn màn hình (100%)',
      coffeeTitle: 'Mời Tác Giả Ly Cà Phê ☕',
      coffeeDesc: 'Ủng hộ để phát triển thêm tính năng mới: khanhnkq',
      statusReady: 'Đã sẵn sàng hoạt động',
      statusReset: 'Đã đặt lại vị trí!',
      authorLabel: 'Tác giả:'
    },
    en: {
      brandSub: 'Elevate Your YouTube Livestreaming Experience',
      cardOperatingModes: 'Operating Modes',
      floatingChatTitle: 'Transparent Floating Chat',
      floatingChatDesc: 'Display floating chat overlay over video',
      danmakuTitle: 'Danmaku (Scrolling Comments)',
      danmakuDesc: 'On-screen flying comments like Bilibili',
      autoHideChatTitle: 'Auto-Hide Native Chat in Fullscreen',
      autoHideChatDesc: 'Hide native side chat in Fullscreen & restore on exit',
      cardInterfaceCustomization: 'Interface Customization',
      hideHeaderTitle: 'Hide Header & Border',
      hideHeaderDesc: 'Show drag handle bar only on hover',
      hideRowBgTitle: 'Hide Chat Row Backgrounds',
      hideRowBgDesc: 'Show floating text & avatar over video',
      hideInputTitle: 'Hide Input Box & Footer',
      hideInputDesc: 'Hide message input box and notice bar',
      cardColorFloatingChat: 'Color & Floating Chat',
      authorTextColor: 'Username color',
      chatTextColor: 'Message text color',
      bgOpacityLabel: 'Chat window background opacity',
      bgOpacityMin: 'Transparent (0%)',
      bgOpacityMax: 'Opaque (100%)',
      bgBlurLabel: 'Background blur (Blur)',
      chatFontSizeLabel: 'Chat text font size',
      resetPosBtn: 'Reset Window Position & Size',
      cardDanmakuSettings: 'Danmaku Settings',
      danmakuTextColor: 'Danmaku text color',
      danmakuStrokeTitle: 'Danmaku text stroke outline',
      danmakuStrokeDesc: 'Draw dark stroke around text',
      danmakuShadowTitle: 'Danmaku text shadow',
      danmakuShadowDesc: 'Add drop shadow effect to text',
      danmakuSpeedLabel: 'Comment scroll speed',
      danmakuSpeedMin: 'Fast (4s)',
      danmakuSpeedMax: 'Slow (20s)',
      danmakuFontSizeLabel: 'Danmaku font size',
      danmakuOpacityLabel: 'Danmaku opacity',
      danmakuAreaLabel: 'On-screen display area',
      danmakuArea033: 'Top 1/3 Screen',
      danmakuArea05: 'Top Half (50%)',
      danmakuArea075: 'Top 3/4 Screen',
      danmakuArea10: 'Fullscreen (100%)',
      coffeeTitle: 'Buy the Developer a Coffee ☕',
      coffeeDesc: 'Support ongoing development & new features: khanhnkq',
      statusReady: 'Ready',
      statusReset: 'Position reset!',
      authorLabel: 'Author:'
    }
  };

  // Default configuration values
  const defaultConfig = {
    lang: 'en',
    enableFloatingChat: true,
    enableDanmaku: true,
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
  };

  // Get current storage or fallback to defaults
  const config = await chrome.storage.local.get(defaultConfig);
  let currentLang = config.lang || 'en';

  // UI Elements
  const enableFloatingChat = document.getElementById('enableFloatingChat');
  const enableDanmaku = document.getElementById('enableDanmaku');
  const autoHideNativeChat = document.getElementById('autoHideNativeChat');
  const hideHeaderAndBorder = document.getElementById('hideHeaderAndBorder');
  const hideItemBg = document.getElementById('hideItemBg');
  const hideInputBox = document.getElementById('hideInputBox');
  const authorTextColor = document.getElementById('authorTextColor');
  const chatTextColor = document.getElementById('chatTextColor');
  const danmakuTextColor = document.getElementById('danmakuTextColor');
  const danmakuTextStroke = document.getElementById('danmakuTextStroke');
  const danmakuTextShadow = document.getElementById('danmakuTextShadow');
  const bgOpacity = document.getElementById('bgOpacity');
  const bgOpacityVal = document.getElementById('bgOpacityVal');
  const bgBlur = document.getElementById('bgBlur');
  const bgBlurVal = document.getElementById('bgBlurVal');
  const chatFontSize = document.getElementById('chatFontSize');
  const chatFontSizeVal = document.getElementById('chatFontSizeVal');
  const danmakuSpeed = document.getElementById('danmakuSpeed');
  const danmakuSpeedVal = document.getElementById('danmakuSpeedVal');
  const danmakuFontSize = document.getElementById('danmakuFontSize');
  const danmakuFontSizeVal = document.getElementById('danmakuFontSizeVal');
  const danmakuOpacity = document.getElementById('danmakuOpacity');
  const danmakuOpacityVal = document.getElementById('danmakuOpacityVal');
  const danmakuArea = document.getElementById('danmakuArea');
  const danmakuAreaVal = document.getElementById('danmakuAreaVal');
  const resetPosBtn = document.getElementById('resetPosBtn');
  const statusText = document.getElementById('statusText');

  // Apply Language to UI
  function applyLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    const dict = translations[lang] || translations.en;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    document.querySelectorAll('#langSwitch .lang-opt').forEach((opt) => {
      if (opt.getAttribute('data-lang') === lang) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });

    updateAreaLabel(danmakuArea.value);
  }

  // Initialize Language
  applyLanguage(currentLang);

  // Language Switcher Click Event
  const langSwitch = document.getElementById('langSwitch');
  if (langSwitch) {
    langSwitch.addEventListener('click', async (e) => {
      const targetOpt = e.target.closest('.lang-opt');
      const selectedLang = targetOpt ? targetOpt.getAttribute('data-lang') : (currentLang === 'vi' ? 'en' : 'vi');
      if (selectedLang && selectedLang !== currentLang) {
        applyLanguage(selectedLang);
        await saveAndNotify({ lang: selectedLang });
      }
    });
  }

  // Populate UI with stored config
  enableFloatingChat.checked = config.enableFloatingChat;
  enableDanmaku.checked = config.enableDanmaku;
  autoHideNativeChat.checked = config.autoHideNativeChat !== false;
  hideHeaderAndBorder.checked = config.hideHeaderAndBorder;
  hideItemBg.checked = config.hideItemBg;
  hideInputBox.checked = config.hideInputBox;

  authorTextColor.value = config.authorTextColor || '#ff88aa';
  chatTextColor.value = config.chatTextColor || '#ffffff';
  danmakuTextColor.value = config.danmakuTextColor || '#ffffff';

  bgOpacity.value = config.bgOpacity;
  bgOpacityVal.textContent = `${config.bgOpacity}%`;

  bgBlur.value = config.bgBlur;
  bgBlurVal.textContent = `${config.bgBlur}px`;

  chatFontSize.value = config.chatFontSize;
  chatFontSizeVal.textContent = `${config.chatFontSize}px`;

  danmakuSpeed.value = config.danmakuSpeed;
  danmakuSpeedVal.textContent = `${config.danmakuSpeed}s`;

  danmakuFontSize.value = config.danmakuFontSize;
  danmakuFontSizeVal.textContent = `${config.danmakuFontSize}px`;

  danmakuOpacity.value = config.danmakuOpacity;
  danmakuOpacityVal.textContent = `${config.danmakuOpacity}%`;

  danmakuArea.value = config.danmakuArea;
  updateAreaLabel(config.danmakuArea);

  // Event Listeners for controls
  enableFloatingChat.addEventListener('change', async (e) => {
    await saveAndNotify({ enableFloatingChat: e.target.checked });
  });

  enableDanmaku.addEventListener('change', async (e) => {
    await saveAndNotify({ enableDanmaku: e.target.checked });
  });

  autoHideNativeChat.addEventListener('change', async (e) => {
    await saveAndNotify({ autoHideNativeChat: e.target.checked });
  });

  hideHeaderAndBorder.addEventListener('change', async (e) => {
    await saveAndNotify({ hideHeaderAndBorder: e.target.checked });
  });

  hideItemBg.addEventListener('change', async (e) => {
    await saveAndNotify({ hideItemBg: e.target.checked });
  });

  hideInputBox.addEventListener('change', async (e) => {
    await saveAndNotify({ hideInputBox: e.target.checked });
  });

  authorTextColor.addEventListener('input', async (e) => {
    await saveAndNotify({ authorTextColor: e.target.value });
  });

  chatTextColor.addEventListener('input', async (e) => {
    await saveAndNotify({ chatTextColor: e.target.value });
  });

  danmakuTextColor.addEventListener('input', async (e) => {
    await saveAndNotify({ danmakuTextColor: e.target.value });
  });

  if (danmakuTextStroke) {
    danmakuTextStroke.addEventListener('change', async (e) => {
      await saveAndNotify({ danmakuTextStroke: e.target.checked });
    });
  }

  if (danmakuTextShadow) {
    danmakuTextShadow.addEventListener('change', async (e) => {
      await saveAndNotify({ danmakuTextShadow: e.target.checked });
    });
  }

  bgOpacity.addEventListener('input', async (e) => {
    const val = parseInt(e.target.value, 10);
    bgOpacityVal.textContent = `${val}%`;
    await saveAndNotify({ bgOpacity: val });
  });

  bgBlur.addEventListener('input', async (e) => {
    const val = parseInt(e.target.value, 10);
    bgBlurVal.textContent = `${val}px`;
    await saveAndNotify({ bgBlur: val });
  });

  chatFontSize.addEventListener('input', async (e) => {
    const val = parseInt(e.target.value, 10);
    chatFontSizeVal.textContent = `${val}px`;
    await saveAndNotify({ chatFontSize: val });
  });

  danmakuSpeed.addEventListener('input', async (e) => {
    const val = parseInt(e.target.value, 10);
    danmakuSpeedVal.textContent = `${val}s`;
    await saveAndNotify({ danmakuSpeed: val });
  });

  danmakuFontSize.addEventListener('input', async (e) => {
    const val = parseInt(e.target.value, 10);
    danmakuFontSizeVal.textContent = `${val}px`;
    await saveAndNotify({ danmakuFontSize: val });
  });

  danmakuOpacity.addEventListener('input', async (e) => {
    const val = parseInt(e.target.value, 10);
    danmakuOpacityVal.textContent = `${val}%`;
    await saveAndNotify({ danmakuOpacity: val });
  });

  danmakuArea.addEventListener('change', async (e) => {
    const val = e.target.value;
    updateAreaLabel(val);
    await saveAndNotify({ danmakuArea: val });
  });

  resetPosBtn.addEventListener('click', async () => {
    await saveAndNotify({ resetChatPosition: true });
    const dict = translations[currentLang] || translations.en;
    statusText.textContent = dict.statusReset;
    setTimeout(() => {
      statusText.textContent = dict.statusReady;
    }, 2000);
  });

  const coffeeBtn = document.getElementById('coffeeBtn');
  if (coffeeBtn) {
    coffeeBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://khanhnkq.quizken.com/buy-me-a-coffee' });
    });
  }

  function updateAreaLabel(val) {
    const dict = translations[currentLang] || translations.en;
    if (val === '0.33') danmakuAreaVal.textContent = dict.danmakuArea033;
    else if (val === '0.5') danmakuAreaVal.textContent = dict.danmakuArea05;
    else if (val === '0.75') danmakuAreaVal.textContent = dict.danmakuArea075;
    else danmakuAreaVal.textContent = dict.danmakuArea10;
  }

  // Save to chrome.storage.local and send message to all YouTube tabs & frames
  async function saveAndNotify(partialConfig) {
    await chrome.storage.local.set(partialConfig);

    try {
      const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' });
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'UPDATE_CONFIG',
          config: partialConfig
        }).catch(() => {});
      }
    } catch (err) {}
  }
});

