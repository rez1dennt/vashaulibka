import {
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  loadAccessibilityPreferences,
  resetAccessibilityPreferences,
  saveAccessibilityPreferences,
} from '../core/accessibility-preferences.js';
import { createAccessibilityImageController } from './accessibility-images.js';
import { initAccessibilitySettingsDialog } from './accessibility-settings-dialog.js';
import { createAccessibilitySpeechController } from './accessibility-speech.js';
import { safeStorage } from '../core/storage.js';

const ACTIVE_ATTRIBUTES = Object.freeze({
  scale: 'data-accessibility-scale',
  theme: 'data-accessibility-theme',
  font: 'data-accessibility-font',
  letterSpacing: 'data-accessibility-letter-spacing',
  lineHeight: 'data-accessibility-line-height',
  paragraphSpacing: 'data-accessibility-paragraph-spacing',
  images: 'data-accessibility-images',
});

const SETTING_LABELS = Object.freeze({
  scale: 'Размер текста',
  theme: 'Цветовая схема',
  font: 'Шрифт',
  letterSpacing: 'Межбуквенный интервал',
  lineHeight: 'Межстрочный интервал',
  paragraphSpacing: 'Интервал между абзацами',
  images: 'Изображения',
});

function readStorage(storage, key) {
  try {
    return storage?.get?.(key) ?? null;
  } catch {
    return null;
  }
}

function announcementFor(button) {
  const { accessibilitySetting: setting } = button.dataset;
  const label = SETTING_LABELS[setting];
  const value = setting === 'scale'
    ? `${button.dataset.accessibilityValue} процентов`
    : button.textContent.trim();
  return `${label}: ${value}`;
}

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
  const status = panel.querySelector('[data-accessibility-status]');
  const settingButtons = [...document.querySelectorAll('[data-accessibility-setting][data-accessibility-value]')];
  const resolvedImageController = imageController ?? createAccessibilityImageController();
  const resolvedSpeechController = speechController ?? createAccessibilitySpeechController();
  const settingsDialog = initAccessibilitySettingsDialog();
  let preferences = loadAccessibilityPreferences(storage);

  resolvedSpeechController.init();

  const apply = (nextPreferences) => {
    preferences = nextPreferences;
    const root = document.documentElement;

    if (preferences.enabled) {
      root.setAttribute('data-accessibility-enabled', 'true');
      for (const [setting, attribute] of Object.entries(ACTIVE_ATTRIBUTES)) {
        root.setAttribute(attribute, preferences[setting]);
      }
    } else {
      root.removeAttribute('data-accessibility-enabled');
      for (const attribute of Object.values(ACTIVE_ATTRIBUTES)) {
        root.removeAttribute(attribute);
      }
    }

    resolvedImageController.setHidden(preferences.enabled && preferences.images === 'hidden');
    resolvedSpeechController.setEnabled(preferences.enabled);

    for (const button of settingButtons) {
      const { accessibilitySetting: setting, accessibilityValue: value } = button.dataset;
      button.setAttribute('aria-pressed', String(preferences[setting] === value));
    }
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

  apply(preferences);
  if (readStorage(storage, 'vision-mode') === 'on') {
    saveAccessibilityPreferences(storage, preferences);
  }

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
      const enabled = preferences.enabled || value !== DEFAULT_ACCESSIBILITY_PREFERENCES[setting];
      const nextPreferences = { ...preferences, enabled, [setting]: value };
      saveAccessibilityPreferences(storage, nextPreferences);
      apply(nextPreferences);
      if (status) status.textContent = announcementFor(button);
    });
  }

  resetButton?.addEventListener('click', () => {
    apply(resetAccessibilityPreferences(storage));
    if (status) status.textContent = 'Настройки доступности сброшены';
  });
}
