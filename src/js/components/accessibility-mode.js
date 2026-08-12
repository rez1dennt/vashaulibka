import {
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  loadAccessibilityPreferences,
  resetAccessibilityPreferences,
  saveAccessibilityPreferences,
} from '../core/accessibility-preferences.js';
import { safeStorage } from '../core/storage.js';
import { createAccessibilityImageController } from './accessibility-images.js';
import { initAccessibilitySettingsDialog } from './accessibility-settings-dialog.js';
import { createAccessibilitySpeechController } from './accessibility-speech.js';

const ACTIVE_ATTRIBUTES = Object.freeze({
  scale: 'data-accessibility-scale',
  theme: 'data-accessibility-theme',
  font: 'data-accessibility-font',
  letterSpacing: 'data-accessibility-letter-spacing',
  lineHeight: 'data-accessibility-line-height',
  paragraphSpacing: 'data-accessibility-paragraph-spacing',
  images: 'data-accessibility-images',
});

const SCALE_VALUES = Object.freeze(['100', '125', '150', '200']);

const ANNOUNCEMENTS = Object.freeze({
  scale: Object.freeze({
    100: 'Размер шрифта — 100 процентов',
    125: 'Размер шрифта — 125 процентов',
    150: 'Размер шрифта — 150 процентов',
    200: 'Размер шрифта — 200 процентов',
  }),
  theme: Object.freeze({
    standard: 'Цветовая схема — стандартная',
    'black-white': 'Цветовая схема — чёрный текст на белом фоне',
    'white-black': 'Цветовая схема — белый текст на чёрном фоне',
    'blue-light': 'Цветовая схема — тёмно-синий текст на светло-голубом фоне',
  }),
  images: Object.freeze({
    visible: 'Изображения показаны',
    hidden: 'Изображения скрыты',
  }),
  font: Object.freeze({
    site: 'Шрифт — фирменный',
    sans: 'Шрифт — без засечек',
  }),
  letterSpacing: Object.freeze({
    standard: 'Межбуквенный интервал — стандартный',
    medium: 'Межбуквенный интервал — средний',
    large: 'Межбуквенный интервал — увеличенный',
  }),
  lineHeight: Object.freeze({
    standard: 'Межстрочный интервал — стандартный',
    medium: 'Межстрочный интервал — полуторный',
    large: 'Межстрочный интервал — двойной',
  }),
  paragraphSpacing: Object.freeze({
    standard: 'Интервал между абзацами — стандартный',
    large: 'Интервал между абзацами — увеличенный',
  }),
});

export function initAccessibilityMode({
  storage = safeStorage,
  imageController,
  speechController,
} = {}) {
  const toggle = document.querySelector('[data-vision-toggle]');
  const panel = document.querySelector('[data-accessibility-panel]');
  if (!toggle || !panel) return;

  const closeButton = panel.querySelector('[data-accessibility-close]');
  const resetButton = document.querySelector('[data-accessibility-reset]');
  const standardButton = panel.querySelector('[data-accessibility-standard]');
  const speechButton = panel.querySelector('[data-speech-announcements]');
  const scaleDecrease = panel.querySelector('[data-accessibility-scale-decrease]');
  const scaleIncrease = panel.querySelector('[data-accessibility-scale-increase]');
  const scaleValue = panel.querySelector('[data-accessibility-scale-value]');
  const status = panel.querySelector('[data-accessibility-status]');
  const settingButtons = [...document.querySelectorAll('[data-accessibility-setting][data-accessibility-value]')];
  const resolvedImageController = imageController ?? createAccessibilityImageController();
  const resolvedSpeechController = speechController ?? createAccessibilitySpeechController();
  const settingsDialog = initAccessibilitySettingsDialog();
  let preferences = loadAccessibilityPreferences(storage);

  resolvedSpeechController.init();

  const apply = (nextPreferences, { syncSpeech = true } = {}) => {
    preferences = nextPreferences;
    const root = document.documentElement;

    if (preferences.enabled) {
      root.setAttribute('data-accessibility-enabled', 'true');
      for (const [setting, attribute] of Object.entries(ACTIVE_ATTRIBUTES)) {
        root.setAttribute(attribute, preferences[setting]);
      }
    } else {
      root.removeAttribute('data-accessibility-enabled');
      for (const attribute of Object.values(ACTIVE_ATTRIBUTES)) root.removeAttribute(attribute);
    }

    resolvedImageController.setHidden(preferences.enabled && preferences.images === 'hidden');
    if (syncSpeech) resolvedSpeechController.setEnabled(preferences.speechAnnouncements);

    for (const button of settingButtons) {
      const { accessibilitySetting: setting, accessibilityValue: value } = button.dataset;
      button.setAttribute('aria-pressed', String(preferences[setting] === value));
    }

    const scaleIndex = SCALE_VALUES.indexOf(preferences.scale);
    if (scaleValue) scaleValue.textContent = `${preferences.scale}%`;
    if (scaleDecrease) scaleDecrease.disabled = scaleIndex <= 0;
    if (scaleIncrease) scaleIncrease.disabled = scaleIndex === SCALE_VALUES.length - 1;
  };

  const setStatus = (message) => {
    if (status) status.textContent = message;
  };

  const report = (message) => {
    setStatus(message);
    resolvedSpeechController.announce(message);
  };

  const updateSetting = (setting, value) => {
    const enabled = preferences.enabled || value !== DEFAULT_ACCESSIBILITY_PREFERENCES[setting];
    const nextPreferences = { ...preferences, enabled, [setting]: value };
    saveAccessibilityPreferences(storage, nextPreferences);
    apply(nextPreferences);
    report(ANNOUNCEMENTS[setting][value]);
  };

  const closePanel = () => {
    if (panel.hidden) return;
    settingsDialog.close({ restoreFocus: false });
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  };

  const openPanel = () => {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    closeButton?.focus();
  };

  const stepScale = (offset) => {
    const currentIndex = SCALE_VALUES.indexOf(preferences.scale);
    const nextIndex = Math.max(0, Math.min(SCALE_VALUES.length - 1, currentIndex + offset));
    if (nextIndex === currentIndex) return;
    updateSetting('scale', SCALE_VALUES[nextIndex]);
  };

  apply(preferences);

  toggle.addEventListener('click', () => {
    if (panel.hidden) openPanel();
    else closePanel();
  });

  closeButton?.addEventListener('click', closePanel);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) closePanel();
  });

  for (const button of settingButtons) {
    button.addEventListener('click', () => {
      const { accessibilitySetting: setting, accessibilityValue: value } = button.dataset;
      updateSetting(setting, value);
    });
  }

  scaleDecrease?.addEventListener('click', () => stepScale(-1));
  scaleIncrease?.addEventListener('click', () => stepScale(1));

  speechButton?.addEventListener('click', () => {
    const enabled = !preferences.speechAnnouncements;
    const nextPreferences = { ...preferences, speechAnnouncements: enabled };
    saveAccessibilityPreferences(storage, nextPreferences);
    apply(nextPreferences);
    if (enabled) report('Голосовые подтверждения включены');
    else setStatus('Голосовые подтверждения выключены');
  });

  standardButton?.addEventListener('click', () => {
    const nextPreferences = { ...preferences, enabled: false };
    saveAccessibilityPreferences(storage, nextPreferences);
    apply(nextPreferences);
    resolvedSpeechController.stop();
    setStatus('Обычная версия сайта включена');
  });

  resetButton?.addEventListener('click', () => {
    const speechWasEnabled = preferences.speechAnnouncements;
    const defaults = resetAccessibilityPreferences(storage);
    apply(defaults, { syncSpeech: !speechWasEnabled });
    setStatus('Настройки сброшены');
    if (speechWasEnabled) resolvedSpeechController.confirmAndDisable('Настройки сброшены');
  });
}
