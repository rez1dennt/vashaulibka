import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { renderHeader } from '../../src/templates/site-chrome.js';

const ADVANCED_SETTING_GROUPS = [
  {
    legend: 'Шрифт',
    setting: 'font',
    values: ['site', 'sans'],
  },
  {
    legend: 'Межбуквенный интервал',
    setting: 'letterSpacing',
    values: ['standard', 'medium', 'large'],
  },
  {
    legend: 'Межстрочный интервал',
    setting: 'lineHeight',
    values: ['standard', 'medium', 'large'],
  },
  {
    legend: 'Интервал между абзацами',
    setting: 'paragraphSpacing',
    values: ['standard', 'large'],
  },
];

describe('accessibility panel template', () => {
  it('renders exactly five compact, labeled toolbar groups', () => {
    const document = new JSDOM(`<body>${renderHeader('index.html')}</body>`).window.document;
    const panel = document.querySelector('#accessibility-panel[data-accessibility-panel]');
    const toolbar = panel?.querySelector('.accessibility-toolbar');
    const groups = [...(toolbar?.querySelectorAll(':scope > fieldset') ?? [])];

    expect(panel).not.toBeNull();
    expect(panel?.tagName).toBe('SECTION');
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(panel?.getAttribute('aria-labelledby')).toBe('accessibility-panel-title');
    expect(panel?.querySelector('#accessibility-panel-title')?.textContent).toBe('Настройки доступности');
    expect(groups.map((group) => group.querySelector('legend')?.textContent)).toEqual([
      'Размер текста',
      'Цветовая схема',
      'Изображения',
      'Голосовое подтверждение',
      'Настройки и действия',
    ]);
    expect(panel?.querySelectorAll('[data-accessibility-setting="font"], [data-accessibility-setting="letterSpacing"], [data-accessibility-setting="lineHeight"], [data-accessibility-setting="paragraphSpacing"]')).toHaveLength(0);
    expect(panel?.querySelector('[data-speech-read], [data-speech-pause], [data-speech-stop]')).toBeNull();
    expect(panel?.matches('[role="dialog"]')).toBe(false);
    expect(panel?.querySelector('form, input, textarea, select')).toBeNull();
  });

  it('renders scale, theme, image, speech, and visible action controls', () => {
    const document = new JSDOM(`<body>${renderHeader('index.html')}</body>`).window.document;
    const panel = document.querySelector('[data-accessibility-panel]');
    const scaleDecrease = panel?.querySelector('button[data-accessibility-scale-decrease]');
    const scaleValue = panel?.querySelector('output[data-accessibility-scale-value]');
    const scaleIncrease = panel?.querySelector('button[data-accessibility-scale-increase]');
    const themes = [...(panel?.querySelectorAll('button[data-accessibility-setting="theme"]') ?? [])];
    const images = [...(panel?.querySelectorAll('button[data-accessibility-setting="images"]') ?? [])];
    const speech = panel?.querySelector('button[data-speech-announcements]');
    const advanced = panel?.querySelector('button[data-accessibility-advanced-open]');
    const standard = panel?.querySelector('button[data-accessibility-standard]');
    const collapse = panel?.querySelector('button[data-accessibility-close]');

    expect(scaleDecrease?.matches('button[type="button"]')).toBe(true);
    expect(scaleDecrease?.getAttribute('aria-label')).toBe('Уменьшить размер текста');
    expect(scaleDecrease?.textContent).toBe('A−');
    expect(scaleValue?.getAttribute('aria-live')).toBe('polite');
    expect(scaleValue?.textContent).toBe('100%');
    expect(scaleIncrease?.matches('button[type="button"]')).toBe(true);
    expect(scaleIncrease?.getAttribute('aria-label')).toBe('Увеличить размер текста');
    expect(scaleIncrease?.textContent).toBe('A+');

    expect(themes.map((button) => button.dataset.accessibilityValue)).toEqual([
      'standard',
      'black-white',
      'white-black',
      'blue-light',
    ]);
    expect(themes.map((button) => button.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false', 'false']);
    expect(themes.every((button) => Boolean(button.getAttribute('aria-label')))).toBe(true);
    expect(new Set(themes.map((button) => button.querySelector('[data-accessibility-theme-swatch]')?.className)).size).toBe(4);

    expect(images.map((button) => button.dataset.accessibilityValue)).toEqual(['visible', 'hidden']);
    expect(images.map((button) => button.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
    expect(speech?.matches('button[type="button"]:disabled')).toBe(true);
    expect(speech?.getAttribute('aria-pressed')).toBe('false');
    expect(speech?.hasAttribute('data-accessibility-setting')).toBe(false);
    expect(speech?.textContent.trim()).toBe('Голосовые подтверждения');
    expect(advanced?.getAttribute('aria-controls')).toBe('accessibility-settings-dialog');
    expect(advanced?.getAttribute('aria-expanded')).toBe('false');
    expect(advanced?.textContent.trim()).toBe('Расширенные настройки');
    expect(standard?.textContent.trim()).toBe('Обычная версия сайта');
    expect(collapse?.textContent.trim()).toBe('Свернуть');
    expect(panel?.querySelector('[data-accessibility-status][role="status"][aria-live="polite"]')).not.toBeNull();
  });

  it('renders a hidden, labeled advanced settings dialog with four closed-choice groups', () => {
    const document = new JSDOM(`<body>${renderHeader('index.html')}</body>`).window.document;
    const dialog = document.querySelector('#accessibility-settings-dialog');

    expect(dialog?.getAttribute('role')).toBe('dialog');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(dialog?.getAttribute('aria-labelledby')).toBe('accessibility-settings-title');
    expect(dialog?.hasAttribute('hidden')).toBe(true);
    expect(dialog?.querySelector('#accessibility-settings-title')?.textContent).toBe('Расширенные настройки');
    expect(dialog?.querySelector('[data-accessibility-dialog-backdrop][aria-hidden="true"]')).not.toBeNull();
    expect(dialog?.querySelector('button[data-accessibility-dialog-close][aria-label="Закрыть расширенные настройки"]')).not.toBeNull();

    const groups = [...(dialog?.querySelectorAll('fieldset') ?? [])];
    expect(groups).toHaveLength(4);
    for (const group of ADVANCED_SETTING_GROUPS) {
      const fieldset = groups.find((candidate) => candidate.querySelector('legend')?.textContent === group.legend);
      const buttons = [...(fieldset?.querySelectorAll('button[data-accessibility-setting]') ?? [])];

      expect(fieldset, group.legend).toBeDefined();
      expect(buttons.map((button) => button.dataset.accessibilitySetting)).toEqual(
        group.values.map(() => group.setting),
      );
      expect(buttons.map((button) => button.dataset.accessibilityValue)).toEqual(group.values);
      expect(buttons.every((button) => ['true', 'false'].includes(button.getAttribute('aria-pressed')))).toBe(true);
    }

    expect(dialog?.querySelector('button[data-accessibility-reset]')?.textContent).toBe('Сбросить настройки');
    expect(dialog?.querySelector('form, input, textarea, select')).toBeNull();
    expect(dialog?.querySelector('[data-speech-read], [data-speech-pause], [data-speech-stop]')).toBeNull();
  });
});
