import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initAccessibilityMode } from '../../src/js/components/accessibility-mode.js';
import {
  ACCESSIBILITY_STORAGE_KEY,
  DEFAULT_ACCESSIBILITY_PREFERENCES,
} from '../../src/js/core/accessibility-preferences.js';
import { renderHeader } from '../../src/templates/site-chrome.js';

const ACTIVE_ATTRIBUTES = {
  enabled: 'data-accessibility-enabled',
  scale: 'data-accessibility-scale',
  theme: 'data-accessibility-theme',
  font: 'data-accessibility-font',
  letterSpacing: 'data-accessibility-letter-spacing',
  lineHeight: 'data-accessibility-line-height',
  paragraphSpacing: 'data-accessibility-paragraph-spacing',
  images: 'data-accessibility-images',
};

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

function createSpeechController() {
  return {
    announce: vi.fn(),
    confirmAndDisable: vi.fn(),
    init: vi.fn(),
    setEnabled: vi.fn(),
    stop: vi.fn(),
  };
}

function setup(storage = createStorage(), controllers = {}) {
  document.body.innerHTML = renderHeader('index.html');
  const imageController = controllers.imageController ?? { setHidden: vi.fn() };
  const speechController = controllers.speechController ?? createSpeechController();
  initAccessibilityMode({ storage, imageController, speechController });
  return {
    advanced: document.querySelector('[data-accessibility-advanced-open]'),
    close: document.querySelector('[data-accessibility-close]'),
    dialog: document.querySelector('#accessibility-settings-dialog'),
    imageController,
    panel: document.querySelector('[data-accessibility-panel]'),
    reset: document.querySelector('[data-accessibility-reset]'),
    scaleDecrease: document.querySelector('[data-accessibility-scale-decrease]'),
    scaleIncrease: document.querySelector('[data-accessibility-scale-increase]'),
    scaleValue: document.querySelector('[data-accessibility-scale-value]'),
    speaker: document.querySelector('[data-speech-announcements]'),
    speechController,
    standard: document.querySelector('[data-accessibility-standard]'),
    status: document.querySelector('[data-accessibility-status]'),
    storage,
    toggle: document.querySelector('[data-vision-toggle]'),
  };
}

function settingButton(setting, value) {
  return document.querySelector(
    `[data-accessibility-setting="${setting}"][data-accessibility-value="${value}"]`,
  );
}

function expectNoActiveAttributes() {
  expect(Object.values(ACTIVE_ATTRIBUTES).every(
    (attribute) => !document.documentElement.hasAttribute(attribute),
  )).toBe(true);
}

describe('accessibility mode controller', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('class');
    document.body.className = '';
  });

  it('opens from the eye button, exposes the normal-flow panel, and moves focus inside', () => {
    const { close, panel, toggle } = setup();

    toggle.click();

    expect(panel.hidden).toBe(false);
    expect(panel.matches('[role="dialog"], [aria-modal="true"]')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(close);
    expect(document.body.classList.contains('is-locked')).toBe(false);
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

  it('closes the advanced dialog before the toolbar and returns final focus to the eye button', () => {
    const { advanced, close, dialog, panel, toggle } = setup();
    toggle.click();
    advanced.click();

    close.click();

    expect(dialog.hidden).toBe(true);
    expect(advanced.getAttribute('aria-expanded')).toBe('false');
    expect(panel.hidden).toBe(true);
    expect(document.body.classList.contains('is-locked')).toBe(false);
    expect(document.activeElement).toBe(toggle);
  });

  it('hydrates disabled v2 choices and scale output without applying or announcing them', () => {
    const stored = {
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      scale: '150',
      theme: 'white-black',
      font: 'sans',
    };
    const controls = setup(createStorage({
      [ACCESSIBILITY_STORAGE_KEY]: JSON.stringify(stored),
    }));

    expect(controls.scaleValue.textContent).toBe('150%');
    expect(settingButton('theme', 'white-black').getAttribute('aria-pressed')).toBe('true');
    expect(settingButton('font', 'sans').getAttribute('aria-pressed')).toBe('true');
    expectNoActiveAttributes();
    expect(controls.status.textContent).toBe('');
    expect(controls.speechController.announce).not.toHaveBeenCalled();
    expect(controls.speechController.setEnabled).toHaveBeenCalledWith(false);
  });

  it('hydrates every active v2 presentation attribute, images, and speaker silently', () => {
    const stored = {
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      enabled: true,
      scale: '200',
      theme: 'black-white',
      font: 'sans',
      letterSpacing: 'large',
      lineHeight: 'medium',
      paragraphSpacing: 'large',
      images: 'hidden',
      speechAnnouncements: true,
    };
    const controls = setup(createStorage({
      [ACCESSIBILITY_STORAGE_KEY]: JSON.stringify(stored),
    }));

    expect(document.documentElement.getAttribute(ACTIVE_ATTRIBUTES.enabled)).toBe('true');
    for (const [setting, attribute] of Object.entries(ACTIVE_ATTRIBUTES)) {
      if (setting !== 'enabled') expect(document.documentElement.getAttribute(attribute)).toBe(stored[setting]);
    }
    expect(controls.imageController.setHidden).toHaveBeenCalledWith(true);
    expect(controls.speechController.setEnabled).toHaveBeenCalledWith(true);
    expect(controls.speechController.announce).not.toHaveBeenCalled();
    expect(controls.status.textContent).toBe('');
  });

  it('migrates an enabled v1 record to exact v2 without announcing hydration', () => {
    const version1 = {
      version: 1,
      enabled: true,
      scale: '150',
      theme: 'white-black',
      font: 'sans',
      letterSpacing: 'medium',
      lineHeight: 'large',
      paragraphSpacing: 'large',
      images: 'hidden',
    };
    const storage = createStorage({
      [ACCESSIBILITY_STORAGE_KEY]: JSON.stringify(version1),
    });
    const controls = setup(storage);
    const migrated = { ...version1, version: 2, speechAnnouncements: false };

    expect(storage.values.get(ACCESSIBILITY_STORAGE_KEY)).toBe(JSON.stringify(migrated));
    expect(document.documentElement.getAttribute(ACTIVE_ATTRIBUTES.scale)).toBe('150');
    expect(controls.scaleValue.textContent).toBe('150%');
    expect(controls.speechController.setEnabled).toHaveBeenCalledWith(false);
    expect(controls.speechController.announce).not.toHaveBeenCalled();
    expect(controls.status.textContent).toBe('');
  });

  it('migrates legacy vision mode to enabled 125 percent v2 preferences silently', () => {
    const storage = createStorage({ 'vision-mode': 'on' });
    const controls = setup(storage);
    const migrated = {
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      enabled: true,
      scale: '125',
    };

    expect(document.documentElement.getAttribute(ACTIVE_ATTRIBUTES.enabled)).toBe('true');
    expect(document.documentElement.getAttribute(ACTIVE_ATTRIBUTES.scale)).toBe('125');
    expect(controls.scaleValue.textContent).toBe('125%');
    expect(storage.values.get(ACCESSIBILITY_STORAGE_KEY)).toBe(JSON.stringify(migrated));
    expect(storage.values.has('vision-mode')).toBe(false);
    expect(controls.speechController.announce).not.toHaveBeenCalled();
    expect(controls.status.textContent).toBe('');
  });

  it('updates an advanced setting, persists exact v2, applies it, and reports the closed message', () => {
    const controls = setup();
    const selected = settingButton('lineHeight', 'large');
    const previous = settingButton('lineHeight', 'standard');

    selected.click();

    const expected = {
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      enabled: true,
      lineHeight: 'large',
    };
    expect(controls.storage.set).toHaveBeenCalledWith(
      ACCESSIBILITY_STORAGE_KEY,
      JSON.stringify(expected),
    );
    expect(selected.getAttribute('aria-pressed')).toBe('true');
    expect(previous.getAttribute('aria-pressed')).toBe('false');
    expect(document.documentElement.getAttribute(ACTIVE_ATTRIBUTES.lineHeight)).toBe('large');
    expect(controls.status.textContent).toBe('Межстрочный интервал — двойной');
    expect(controls.speechController.announce).toHaveBeenCalledWith('Межстрочный интервал — двойной');
  });

  it('enables and reapplies retained choices when a non-default choice is selected', () => {
    const stored = {
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      scale: '150',
      theme: 'white-black',
    };
    setup(createStorage({ [ACCESSIBILITY_STORAGE_KEY]: JSON.stringify(stored) }));

    settingButton('theme', 'white-black').click();

    expect(document.documentElement.getAttribute(ACTIVE_ATTRIBUTES.enabled)).toBe('true');
    expect(document.documentElement.getAttribute(ACTIVE_ATTRIBUTES.scale)).toBe('150');
    expect(document.documentElement.getAttribute(ACTIVE_ATTRIBUTES.theme)).toBe('white-black');
  });

  it('steps through the exact scale list, updates bounds, persists, and announces each change', () => {
    const controls = setup();

    expect(controls.scaleValue.textContent).toBe('100%');
    expect(controls.scaleDecrease.disabled).toBe(true);
    expect(controls.scaleIncrease.disabled).toBe(false);

    controls.scaleIncrease.click();
    controls.scaleIncrease.click();
    controls.scaleIncrease.click();
    controls.scaleIncrease.click();

    expect(controls.scaleValue.textContent).toBe('200%');
    expect(controls.scaleIncrease.disabled).toBe(true);
    expect(controls.scaleDecrease.disabled).toBe(false);
    expect(document.documentElement.getAttribute(ACTIVE_ATTRIBUTES.scale)).toBe('200');
    expect(controls.storage.set).toHaveBeenCalledTimes(3);
    expect(controls.speechController.announce.mock.calls.map(([message]) => message)).toEqual([
      'Размер шрифта — 125 процентов',
      'Размер шрифта — 150 процентов',
      'Размер шрифта — 200 процентов',
    ]);

    controls.scaleDecrease.click();
    expect(controls.scaleValue.textContent).toBe('150%');
  });

  it('persists speaker enable/disable and speaks only the enable confirmation', () => {
    const controls = setup();
    controls.speaker.disabled = false;

    controls.speaker.click();

    expect(JSON.parse(controls.storage.values.get(ACCESSIBILITY_STORAGE_KEY))).toEqual({
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      speechAnnouncements: true,
    });
    expect(controls.speechController.setEnabled).toHaveBeenLastCalledWith(true);
    expect(controls.status.textContent).toBe('Голосовые подтверждения включены');
    expect(controls.speechController.announce).toHaveBeenCalledWith('Голосовые подтверждения включены');

    controls.speaker.click();

    expect(JSON.parse(controls.storage.values.get(ACCESSIBILITY_STORAGE_KEY))).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES);
    expect(controls.speechController.setEnabled).toHaveBeenLastCalledWith(false);
    expect(controls.status.textContent).toBe('Голосовые подтверждения выключены');
    expect(controls.speechController.announce).toHaveBeenCalledTimes(1);
  });

  it('leaves an unavailable disabled speaker inert', () => {
    const controls = setup();

    controls.speaker.click();

    expect(controls.storage.set).not.toHaveBeenCalled();
    expect(controls.speechController.announce).not.toHaveBeenCalled();
  });

  it('switches to the ordinary site without losing choices, closing the panel, or speaking', () => {
    const stored = {
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      enabled: true,
      scale: '150',
      theme: 'white-black',
      speechAnnouncements: true,
    };
    const controls = setup(createStorage({
      [ACCESSIBILITY_STORAGE_KEY]: JSON.stringify(stored),
    }));
    controls.toggle.click();

    controls.standard.click();

    const expected = { ...stored, enabled: false };
    expect(controls.storage.values.get(ACCESSIBILITY_STORAGE_KEY)).toBe(JSON.stringify(expected));
    expectNoActiveAttributes();
    expect(controls.imageController.setHidden).toHaveBeenLastCalledWith(false);
    expect(controls.speechController.stop).toHaveBeenCalledTimes(1);
    expect(controls.speechController.announce).not.toHaveBeenCalled();
    expect(controls.status.textContent).toBe('Обычная версия сайта включена');
    expect(controls.panel.hidden).toBe(false);
    expect(controls.scaleValue.textContent).toBe('150%');
  });

  it('resets exact defaults and image state without a voice confirmation when speech was off', () => {
    const stored = {
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      enabled: true,
      theme: 'black-white',
      images: 'hidden',
    };
    const controls = setup(createStorage({
      [ACCESSIBILITY_STORAGE_KEY]: JSON.stringify(stored),
    }));
    controls.toggle.click();

    controls.reset.click();

    expect(controls.storage.remove).toHaveBeenCalledWith(ACCESSIBILITY_STORAGE_KEY);
    expect(controls.storage.remove).toHaveBeenCalledWith('vision-mode');
    expect(controls.storage.values.has(ACCESSIBILITY_STORAGE_KEY)).toBe(false);
    expectNoActiveAttributes();
    expect(settingButton('theme', 'standard').getAttribute('aria-pressed')).toBe('true');
    expect(controls.scaleValue.textContent).toBe('100%');
    expect(controls.imageController.setHidden).toHaveBeenLastCalledWith(false);
    expect(controls.speechController.confirmAndDisable).not.toHaveBeenCalled();
    expect(controls.speechController.setEnabled).toHaveBeenLastCalledWith(false);
    expect(controls.status.textContent).toBe('Настройки сброшены');
    expect(controls.panel.hidden).toBe(false);
  });

  it('uses one final reset confirmation before disabling stored speech', () => {
    const stored = {
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      enabled: true,
      theme: 'white-black',
      speechAnnouncements: true,
    };
    const controls = setup(createStorage({
      [ACCESSIBILITY_STORAGE_KEY]: JSON.stringify(stored),
    }));
    controls.toggle.click();
    controls.advanced.click();
    controls.speechController.setEnabled.mockClear();

    controls.reset.click();

    expect(controls.speechController.setEnabled).not.toHaveBeenCalled();
    expect(controls.speechController.confirmAndDisable).toHaveBeenCalledTimes(1);
    expect(controls.speechController.confirmAndDisable).toHaveBeenCalledWith('Настройки сброшены');
    expect(controls.speechController.announce).not.toHaveBeenCalled();
    expect(controls.status.textContent).toBe('Настройки сброшены');
    expect(controls.dialog.hidden).toBe(false);
    expect(controls.panel.hidden).toBe(false);
  });

  it('ignores malformed stored preferences and hydrates exact defaults silently', () => {
    const controls = setup(createStorage({
      [ACCESSIBILITY_STORAGE_KEY]: '{not-json',
    }));

    expect(controls.scaleValue.textContent).toBe('100%');
    expect(settingButton('theme', 'standard').getAttribute('aria-pressed')).toBe('true');
    expectNoActiveAttributes();
    expect(controls.storage.set).not.toHaveBeenCalled();
    expect(controls.speechController.announce).not.toHaveBeenCalled();
    expect(controls.status.textContent).toBe('');
  });

  it('does not trap focus or lock scrolling in the primary panel', () => {
    const { close, panel, toggle } = setup();
    toggle.click();
    close.focus();
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });

    close.dispatchEvent(tabEvent);

    expect(panel.matches('[role="dialog"], [aria-modal="true"]')).toBe(false);
    expect(document.body.classList.contains('is-locked')).toBe(false);
    expect(tabEvent.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(close);
  });
});
