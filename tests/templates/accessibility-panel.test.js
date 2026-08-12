import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { renderHeader } from '../../src/templates/site-chrome.js';

const SETTING_GROUPS = [
  {
    legend: 'Размер текста',
    setting: 'scale',
    values: ['100', '125', '150', '200'],
  },
  {
    legend: 'Цветовая схема',
    setting: 'theme',
    values: ['standard', 'black-white', 'white-black', 'blue-light'],
  },
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
  {
    legend: 'Изображения',
    setting: 'images',
    values: ['visible', 'hidden'],
  },
];

describe('accessibility panel template', () => {
  it('renders the complete set of labeled, closed-choice setting groups', () => {
    const document = new JSDOM(`<body>${renderHeader('index.html')}</body>`).window.document;
    const panel = document.querySelector('#accessibility-panel[data-accessibility-panel]');

    expect(panel).not.toBeNull();
    expect(panel?.tagName).toBe('SECTION');
    expect(panel?.hasAttribute('hidden')).toBe(true);
    expect(panel?.getAttribute('aria-labelledby')).toBe('accessibility-panel-title');
    expect(panel?.querySelector('#accessibility-panel-title')?.textContent).toBe('Настройки доступности');

    for (const group of SETTING_GROUPS) {
      const fieldset = [...panel.querySelectorAll('fieldset')]
        .find((candidate) => candidate.querySelector('legend')?.textContent === group.legend);
      const buttons = [...(fieldset?.querySelectorAll('button[data-accessibility-setting]') ?? [])];

      expect(fieldset, group.legend).toBeDefined();
      expect(buttons.map((button) => button.dataset.accessibilitySetting)).toEqual(
        group.values.map(() => group.setting),
      );
      expect(buttons.map((button) => button.dataset.accessibilityValue)).toEqual(group.values);
      expect(buttons.every((button) => ['true', 'false'].includes(button.getAttribute('aria-pressed')))).toBe(true);
    }
  });

  it('renders local speech and panel controls without modal or data-entry semantics', () => {
    const document = new JSDOM(`<body>${renderHeader('index.html')}</body>`).window.document;
    const panel = document.querySelector('[data-accessibility-panel]');
    const speech = [...panel.querySelectorAll('fieldset')]
      .find((fieldset) => fieldset.querySelector('legend')?.textContent === 'Озвучивание');
    const speechButtons = [
      speech?.querySelector('[data-speech-read]'),
      speech?.querySelector('[data-speech-pause]'),
      speech?.querySelector('[data-speech-stop]'),
    ];

    expect(speechButtons.every((button) => button?.matches('button[type="button"]:disabled'))).toBe(true);
    expect(speechButtons.map((button) => button?.textContent)).toEqual([
      'Читать страницу',
      'Пауза/Продолжить',
      'Остановить',
    ]);
    expect(panel.querySelector('button[data-accessibility-reset]')?.textContent).toBe('Сбросить настройки');
    expect(panel.querySelector('button[data-accessibility-close][aria-label="Закрыть настройки"]')).not.toBeNull();
    expect(panel.querySelector('[data-accessibility-status][role="status"][aria-live="polite"]')).not.toBeNull();
    expect(panel.matches('[role="dialog"]')).toBe(false);
    expect(panel.querySelector('form, input, textarea, select')).toBeNull();
  });
});
