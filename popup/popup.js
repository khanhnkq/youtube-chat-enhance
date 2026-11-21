document.addEventListener('DOMContentLoaded', async () => {
  // i18n Translations
  const translations = {
    vi: {
      brandSub: 'Nâng tầm xem Livestream YouTube',
      languageAction: 'Đổi ngôn ngữ sang tiếng Anh',
      colorRed: 'Đỏ',
      colorGreen: 'Xanh lá',
      colorBlue: 'Xanh dương',
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
      hideInputDesc: 'Ẩn ô nhập và chân khung chat nổi, kể cả khi rê chuột',
      cardColorFloatingChat: 'Màu Sắc & Khung Chat Nổi',
      authorTextColor: 'Màu tên người dùng',
      chatTextColor: 'Màu nội dung tin nhắn',
      bgOpacityLabel: 'Độ trong suốt nền khung chat',
      bgOpacityMin: 'Trong suốt (0%)',
      bgOpacityMax: 'Trong mờ (100%)',
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
      statusSaveError: 'Không lưu được cài đặt. Hãy thử lại.',
      authorLabel: 'Tác giả:'
    },
    en: {
      brandSub: 'Elevate Your YouTube Livestreaming Experience',
      languageAction: 'Switch language to Vietnamese',
      colorRed: 'Red',
      colorGreen: 'Green',
      colorBlue: 'Blue',
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
      hideInputDesc: 'Hide the floating chat input and footer, even on hover',
      cardColorFloatingChat: 'Color & Floating Chat',
      authorTextColor: 'Username color',
      chatTextColor: 'Message text color',
      bgOpacityLabel: 'Chat window background opacity',
      bgOpacityMin: 'Transparent (0%)',
      bgOpacityMax: 'Opaque (100%)',
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
      statusSaveError: 'Could not save settings. Please try again.',
      authorLabel: 'Author:'
    }
  };

  let config;
  try {
    config = await YTChatConfig.load();
  } catch (error) {
    document.getElementById('statusText').textContent = translations.en.statusSaveError;
    document.querySelectorAll('input, select, button').forEach(el => { el.disabled = true; });
    return;
  }
  let currentLang = config.lang || 'en';
  const writer = createConfigWriter(chrome.storage.local, { onError: showSaveError });

  // UI Elements
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

    langSwitch.setAttribute('aria-label', dict.languageAction);
    updateAreaLabel(danmakuArea.value);
  }

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

  // Group controls by value type; all saves still use the same serialized writer.
  for (const id of [
    'enableFloatingChat', 'enableDanmaku', 'autoHideNativeChat',
    'hideHeaderAndBorder', 'hideItemBg', 'hideInputBox',
    'danmakuTextStroke', 'danmakuTextShadow'
  ]) {
    const input = document.getElementById(id);
    input.checked = id === 'autoHideNativeChat' ? config[id] !== false : config[id];
    input.addEventListener('change', () => saveAndNotify({ [id]: input.checked }));
  }

  for (const id of ['authorTextColor', 'chatTextColor', 'danmakuTextColor']) {
    const input = document.getElementById(id);
    input.value = config[id] || YTChatConfig.defaults[id];
    globalThis.setupColorPicker(input);
    bindContinuousControl(input, () => input.value);
  }

  for (const [id, unit] of Object.entries({
    bgOpacity: '%', chatFontSize: 'px', danmakuSpeed: 's',
    danmakuFontSize: 'px', danmakuOpacity: '%'
  })) {
    const input = document.getElementById(id);
    const label = document.getElementById(`${id}Val`);
    input.value = config[id];
    bindContinuousControl(input, () => parseInt(input.value, 10), () => {
      label.textContent = `${input.value}${unit}`;
      input.setAttribute('aria-valuetext', label.textContent);
    });
  }

  danmakuArea.value = config.danmakuArea;
  // Include the generated color-channel names in initial translation.
  applyLanguage(currentLang);

  function bindContinuousControl(input, readValue, render = () => {}) {
    render();
    input.addEventListener('input', () => {
      render();
      return saveAndNotify({ [input.id]: readValue() }, false);
    });
    // Pointer release and native keyboard change commit the final pending value.
    input.addEventListener('change', () => writer.flush().catch(showSaveError));
  }

  danmakuArea.addEventListener('change', async (e) => {
    const val = e.target.value;
    updateAreaLabel(val);
    await saveAndNotify({ danmakuArea: val });
  });

  resetPosBtn.addEventListener('click', async () => {
    try {
      await writer.flush();
      // Clearing persisted placement also resets tabs opened in the future.
      await chrome.storage.local.remove(['chatBoxPos', 'resetChatPosition']);
      const tabs = await chrome.tabs.query({ url: 'https://www.youtube.com/*' });
      await Promise.all(tabs.map(tab => chrome.tabs.sendMessage(tab.id, {
        action: 'RESET_CHAT_POSITION'
      }, { frameId: 0 }).catch(() => {})));
      const dict = translations[currentLang] || translations.en;
      statusText.textContent = dict.statusReset;
      setTimeout(() => { statusText.textContent = dict.statusReady; }, 2000);
    } catch (error) {
      showSaveError();
    }
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

  function showSaveError() {
    statusText.textContent = (translations[currentLang] || translations.en).statusSaveError;
  }

  // Storage listeners deliver settings once to every open YouTube frame.
  async function saveAndNotify(partialConfig, immediate = true) {
    try {
      await writer.update(partialConfig, immediate);
    } catch (error) {
      showSaveError();
    }
  }
});
