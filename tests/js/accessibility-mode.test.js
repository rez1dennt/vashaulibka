import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initAccessibilityMode } from '../../src/js/components/accessibility-mode.js';
import {
  ACCESSIBILITY_STORAGE_KEY,
  DEFAULT_ACCESSIBILITY_PREFERENCES,
} from '../../src/js/core/accessibility-preferences.js';
import { renderHeader } from '../../src/templates/site-chrome.js';

const ACTIVE_ATTRIBUTES = [
  'data-accessibility-enabled',
  'data-accessibility-scale',
  'data-accessibility-theme',
  'data-accessibility-font',
  'data-accessibility-letter-spacing',
  'data-accessibility-line-height',
  'data-accessibility-paragraph-spacing',
  'data-accessibility-images',
];

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    get: vi.fn((key) => values.get(key) ?? null),
    set: vi.fn((key, value) => {
      values.set(key, value);
      return true;
    }),
    remove: vi.fn((key) => {
      values.delete(key);
      return true;
    }),
  };
}

function setup(storage = createStorage(), controllers = {}) {
  document.body.innerHTML = renderHeader('index.html');
  initAccessibilityMode({ storage, ...controllers });
  return {
    storage,
    toggle: document.querySelector('[data-vision-toggle]'),
    panel: document.querySelector('[data-accessibility-panel]'),
    close: document.querySelector('[data-accessibility-close]'),
    reset: document.querySelector('[data-accessibility-reset]'),
    status: document.querySelector('[data-accessibility-status]'),
  };
}

function settingButton(setting, value) {
  return document.querySelector(
    `[data-accessibility-setting="${setting}"][data-accessibility-value="${value}"]`,
  );
}

describe('accessibility mode controller', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('class');
  });

  it('opens from the eye button, exposes the panel, and moves focus inside', () => {
    const { toggle, panel, close } = setup();

    toggle.click();

    expect(panel.hidden).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(close);
  });

  it.each([
    ['repeat toggle', ({ toggle }) => toggle.click()],
    ['close button', ({ close }) => close.click()],
    ['Escape', () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))],
  ])('closes with %s and restores focus to the eye button', (_, closePanel) => {
    const controls = setup();
    controls.toggle.click();

    closePanel(controls);

    expect(controls.panel.hidden).toBe(true);
    expect(controls.toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(controls.toggle);
  });

  it('keeps active preferences when the panel closes', () => {
    const { toggle, panel, storage } = setup();
    toggle.click();
    settingButton('theme', 'white-black').click();
    toggle.click();

    expect(panel.hidden).toBe(true);
    expect(document.documentElement.getAttribute('data-accessibility-enabled')).toBe('true');
    expect(document.documentElement.getAttribute('data-accessibility-theme')).toBe('white-black');
    expect(JSON.parse(storage.values.get(ACCESSIBILITY_STORAGE_KEY))).toMatchObject({
      enabled: true,
      theme: 'white-black',
    });
  });

  it('applies image visibility whenever enabled image preferences change or reset', () => {
    const imageController = { setHidden: vi.fn() };
    const { reset } = setup(createStorage(), { imageController });

    settingButton('images', 'hidden').click();
    reset.click();

    expect(imageController.setHidden).toHaveBeenNthCalledWith(1, false);
    expect(imageController.setHidden).toHaveBeenNthCalledWith(2, true);
    expect(imageController.setHidden).toHaveBeenNthCalledWith(3, false);
  });

  it('initializes speech once and applies enabled state without stopping when the panel closes', () => {
    const speechController = {
      init: vi.fn(),
      setEnabled: vi.fn(),
      stop: vi.fn(),
    };
    const { toggle, reset } = setup(createStorage(), { speechController });

    expect(speechController.init).toHaveBeenCalledTimes(1);
    expect(speechController.setEnabled).toHaveBeenNthCalledWith(1, false);

    settingButton('theme', 'black-white').click();
    expect(speechController.setEnabled).toHaveBeenNthCalledWith(2, true);

    toggle.click();
    toggle.click();
    expect(speechController.setEnabled).toHaveBeenCalledTimes(2);
    expect(speechController.stop).not.toHaveBeenCalled();

    reset.click();
    expect(speechController.setEnabled).toHaveBeenNthCalledWith(3, false);
  });

  it('updates one setting, persists one validated record, synchronizes choices, and announces it', () => {
    const { storage, status } = setup();
    const selected = settingButton('theme', 'black-white');
    const previous = settingButton('theme', 'standard');

    selected.click();

    expect(storage.set).toHaveBeenCalledTimes(1);
    expect(storage.set).toHaveBeenCalledWith(ACCESSIBILITY_STORAGE_KEY, JSON.stringify({
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      enabled: true,
      theme: 'black-white',
    }));
    expect(selected.getAttribute('aria-pressed')).toBe('true');
    expect(previous.getAttribute('aria-pressed')).toBe('false');
    expect(document.documentElement.getAttribute('data-accessibility-enabled')).toBe('true');
    expect(document.documentElement.getAttribute('data-accessibility-theme')).toBe('black-white');
    expect(status.textContent).toBe('Цветовая схема: Чёрный текст на белом фоне');
  });

  it('hydrates disabled stored choices without presentation attributes or an announcement', () => {
    const stored = {
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      scale: '150',
      theme: 'white-black',
    };
    const { status } = setup(createStorage({
      [ACCESSIBILITY_STORAGE_KEY]: JSON.stringify(stored),
    }));

    expect(settingButton('theme', 'white-black').getAttribute('aria-pressed')).toBe('true');
    expect(ACTIVE_ATTRIBUTES.every((attribute) => !document.documentElement.hasAttribute(attribute))).toBe(true);
    expect(status.textContent).toBe('');
  });

  it('enables and reapplies retained choices when a non-default setting is selected', () => {
    const stored = {
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      scale: '150',
      theme: 'white-black',
    };
    setup(createStorage({ [ACCESSIBILITY_STORAGE_KEY]: JSON.stringify(stored) }));

    settingButton('theme', 'white-black').click();

    expect(document.documentElement.getAttribute('data-accessibility-enabled')).toBe('true');
    expect(document.documentElement.getAttribute('data-accessibility-scale')).toBe('150');
    expect(document.documentElement.getAttribute('data-accessibility-theme')).toBe('white-black');
  });

  it('resets storage and DOM defaults while leaving the panel open', () => {
    const storage = createStorage({ 'vision-mode': 'on' });
    const { toggle, panel, reset } = setup(storage);
    toggle.click();
    settingButton('theme', 'black-white').click();

    reset.click();

    expect(panel.hidden).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(storage.remove).toHaveBeenCalledWith(ACCESSIBILITY_STORAGE_KEY);
    expect(storage.remove).toHaveBeenCalledWith('vision-mode');
    expect(storage.values.has(ACCESSIBILITY_STORAGE_KEY)).toBe(false);
    expect(storage.values.has('vision-mode')).toBe(false);
    expect(ACTIVE_ATTRIBUTES.every((attribute) => !document.documentElement.hasAttribute(attribute))).toBe(true);
    expect(settingButton('theme', 'standard').getAttribute('aria-pressed')).toBe('true');
    expect(settingButton('theme', 'black-white').getAttribute('aria-pressed')).toBe('false');
  });

  it('ignores malformed stored preferences and hydrates defaults silently', () => {
    const { storage, status } = setup(createStorage({
      [ACCESSIBILITY_STORAGE_KEY]: '{not-json',
    }));

    expect(settingButton('theme', 'standard').getAttribute('aria-pressed')).toBe('true');
    expect(ACTIVE_ATTRIBUTES.every((attribute) => !document.documentElement.hasAttribute(attribute))).toBe(true);
    expect(storage.set).not.toHaveBeenCalled();
    expect(status.textContent).toBe('');
  });

  it('migrates legacy vision mode to enabled 125 percent preferences', () => {
    const { storage, status } = setup(createStorage({ 'vision-mode': 'on' }));
    const migrated = {
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      enabled: true,
      scale: '125',
    };

    expect(document.documentElement.getAttribute('data-accessibility-enabled')).toBe('true');
    expect(document.documentElement.getAttribute('data-accessibility-scale')).toBe('125');
    expect(storage.values.get(ACCESSIBILITY_STORAGE_KEY)).toBe(JSON.stringify(migrated));
    expect(storage.values.has('vision-mode')).toBe(false);
    expect(status.textContent).toBe('Локальный русский голос недоступен в этом браузере');
  });

  it('uses normal document flow without a backdrop, modal, body lock, or focus trap', () => {
    const imageController = { setHidden: vi.fn() };
    const speechController = { init: vi.fn(), setEnabled: vi.fn() };
    const { toggle, panel } = setup(createStorage(), { imageController, speechController });
    toggle.click();
    const lastButton = panel.querySelector('[data-accessibility-close]');
    lastButton.focus();
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    lastButton.dispatchEvent(tabEvent);

    expect(panel.matches('[role="dialog"], [aria-modal="true"]')).toBe(false);
    expect(document.querySelector('[data-accessibility-backdrop]')).toBeNull();
    expect(document.body.classList.contains('is-locked')).toBe(false);
    expect(document.body.style.overflow).toBe('');
    expect(tabEvent.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(lastButton);
  });

  it('closes the advanced dialog before collapsing the toolbar and returns focus to the eye button', () => {
    const { close, panel, toggle } = setup();
    const advanced = document.querySelector('[data-accessibility-advanced-open]');
    const dialog = document.querySelector('#accessibility-settings-dialog');
    toggle.click();
    advanced.click();

    close.click();

    expect(dialog.hidden).toBe(true);
    expect(advanced.getAttribute('aria-expanded')).toBe('false');
    expect(panel.hidden).toBe(true);
    expect(document.body.classList.contains('is-locked')).toBe(false);
    expect(document.activeElement).toBe(toggle);
  });
});
