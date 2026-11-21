(function () {
  'use strict';

  // OS color dialogs can dismiss Firefox's action popup before it can save.
  // Keep editing in the popup and reuse its existing input/change write path.
  globalThis.setupColorPicker = function (input) {
    const doc = input.ownerDocument;
    const row = input.closest('.setting-row');
    const details = doc.createElement('details');
    details.className = 'color-picker-control';
    const summary = doc.createElement('summary');
    summary.className = 'color-picker-summary';
    const currentValue = doc.createElement('span');
    currentValue.id = `${input.id}CurrentValue`;
    currentValue.className = 'visually-hidden';
    summary.setAttribute('aria-labelledby', `${input.id}Label ${currentValue.id}`);
    const swatch = doc.createElement('span');
    swatch.className = 'color-picker';
    swatch.setAttribute('aria-hidden', 'true');
    summary.append(row.querySelector('.setting-info'), swatch, currentValue);

    const editor = doc.createElement('div');
    editor.id = `${input.id}Editor`;
    summary.setAttribute('aria-controls', editor.id);
    editor.className = 'color-editor';
    input.hidden = true;
    editor.append(input);
    const sliders = [];
    const outputs = [];
    const emit = type => input.dispatchEvent(new Event(type, { bubbles: true }));
    for (const [name, fullName] of [['R', 'Red'], ['G', 'Green'], ['B', 'Blue']]) {
      const label = doc.createElement('label');
      label.textContent = name;
      const channelName = doc.createElement('span');
      channelName.id = `${input.id}${fullName}Label`;
      channelName.className = 'visually-hidden';
      channelName.textContent = fullName;
      channelName.setAttribute('data-i18n', `color${fullName}`);
      const slider = doc.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '255';
      slider.step = '1';
      slider.setAttribute('aria-labelledby', `${input.id}Label ${channelName.id}`);
      const output = doc.createElement('output');
      output.setAttribute('aria-hidden', 'true');
      sliders.push(slider);
      outputs.push(output);
      label.append(channelName, slider, output);
      editor.append(label);
      slider.addEventListener('input', () => {
        input.value = '#' + sliders.map(item => Number(item.value).toString(16).padStart(2, '0')).join('');
        render();
        emit('input');
      });
      slider.addEventListener('change', () => emit('change'));
    }
    const hexLabel = doc.createElement('label');
    const hexName = doc.createElement('span');
    hexName.id = `${input.id}HexLabel`;
    hexName.textContent = 'HEX';
    const hex = doc.createElement('input');
    hex.type = 'text';
    hex.maxLength = 7;
    hex.spellcheck = false;
    hex.autocomplete = 'off';
    hex.setAttribute('aria-labelledby', `${input.id}Label ${hexName.id}`);
    hexLabel.append(hexName, hex);
    editor.append(hexLabel);

    function render() {
      swatch.style.backgroundColor = input.value;
      currentValue.textContent = input.value;
      hex.value = input.value;
      for (let i = 0; i < sliders.length; i++) {
        const value = parseInt(input.value.slice(1 + i * 2, 3 + i * 2), 16);
        sliders[i].value = String(value);
        outputs[i].textContent = String(value);
      }
    }

    hex.addEventListener('input', () => {
      if (!/^#[\da-f]{6}$/i.test(hex.value)) return;
      input.value = hex.value.toLowerCase();
      render();
      emit('input');
    });
    hex.addEventListener('change', () => {
      render(); // Incomplete/invalid text never replaces the last valid color.
      emit('change');
    });
    details.addEventListener('toggle', () => {
      if (!details.open) emit('change');
    });
    details.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      details.open = false;
      summary.focus();
    });
    details.append(summary, editor);
    row.replaceWith(details);
    render();
  };
})();
