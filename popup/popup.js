document.addEventListener('DOMContentLoaded', async () => {
  // Default configuration values
  const defaultConfig = {
    enableFloatingChat: true,
    enableDanmaku: true,
    autoHideNativeChat: true,
    hideHeaderAndBorder: true,
    hideItemBg: true,
    hideInputBox: true,
    authorTextColor: '#ff88aa',
    chatTextColor: '#ffffff',
    danmakuTextColor: '#ffffff',
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
    statusText.textContent = 'Đã đặt lại vị trí!';
    setTimeout(() => {
      statusText.textContent = 'Đã sẵn sàng';
    }, 2000);
  });

  function updateAreaLabel(val) {
    if (val === '0.33') danmakuAreaVal.textContent = '1/3 Màn hình trên';
    else if (val === '0.5') danmakuAreaVal.textContent = 'Nửa màn hình (50%)';
    else if (val === '0.75') danmakuAreaVal.textContent = '3/4 Màn hình';
    else danmakuAreaVal.textContent = 'Toàn màn hình';
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
