import { DEFAULT_ACCESSIBILITY_PREFERENCES } from '../js/core/accessibility-preferences.js';
import { renderIcon } from './icons.js';

const ADVANCED_SETTING_GROUPS = Object.freeze([
  {
    legend: 'Шрифт',
    setting: 'font',
    options: [
      ['site', 'Шрифт сайта'],
      ['sans', 'Без засечек'],
    ],
  },
  {
    legend: 'Межбуквенный интервал',
    setting: 'letterSpacing',
    options: [
      ['standard', 'Стандартный'],
      ['medium', 'Средний'],
      ['large', 'Увеличенный'],
    ],
  },
  {
    legend: 'Межстрочный интервал',
    setting: 'lineHeight',
    options: [
      ['standard', 'Стандартный'],
      ['medium', '1,5'],
      ['large', '2'],
    ],
  },
  {
    legend: 'Интервал между абзацами',
    setting: 'paragraphSpacing',
    options: [
      ['standard', 'Стандартный'],
      ['large', 'Увеличенный'],
    ],
  },
]);

const THEMES = Object.freeze([
  ['standard', 'Стандартная цветовая схема'],
  ['black-white', 'Чёрный текст на белом фоне'],
  ['white-black', 'Белый текст на чёрном фоне'],
  ['blue-light', 'Тёмно-синий текст на светло-голубом фоне'],
]);

const renderSettingGroup = ({ legend, setting, options }) => [
  '<fieldset class="accessibility-panel__group">',
  `<legend>${legend}</legend>`,
  '<div class="accessibility-panel__choices">',
  options.map(([value, label]) => `<button type="button" data-accessibility-setting="${setting}" data-accessibility-value="${value}" aria-pressed="${value === DEFAULT_ACCESSIBILITY_PREFERENCES[setting]}">${label}</button>`).join(''),
  '</div>',
  '</fieldset>',
].join('');

const renderThemeButtons = () => THEMES.map(([value, label]) => [
  `<button type="button" data-accessibility-setting="theme" data-accessibility-value="${value}" aria-label="${label}" aria-pressed="${value === DEFAULT_ACCESSIBILITY_PREFERENCES.theme}">`,
  `<span class="accessibility-theme-swatch accessibility-theme-swatch--${value}" data-accessibility-theme-swatch aria-hidden="true"></span>`,
  `<span class="sr-only">${label}</span>`,
  '</button>',
].join('')).join('');

export function renderAccessibilityPanel() {
  return [
    '<section class="accessibility-panel" id="accessibility-panel" data-accessibility-panel aria-labelledby="accessibility-panel-title" hidden>',
    '<div class="header-shell accessibility-panel__inner">',
    '<h2 id="accessibility-panel-title">Настройки доступности</h2>',
    '<div class="accessibility-toolbar">',
    '<fieldset class="accessibility-panel__group accessibility-toolbar__scale"><legend>Размер текста</legend><div class="accessibility-panel__choices"><button type="button" data-accessibility-scale-decrease aria-label="Уменьшить размер текста">A−</button><output data-accessibility-scale-value aria-live="polite">100%</output><button type="button" data-accessibility-scale-increase aria-label="Увеличить размер текста">A+</button></div></fieldset>',
    `<fieldset class="accessibility-panel__group accessibility-toolbar__themes"><legend>${renderIcon('contrast', 'ui-icon accessibility-panel__icon')}Цветовая схема</legend><div class="accessibility-panel__choices">${renderThemeButtons()}</div></fieldset>`,
    `<fieldset class="accessibility-panel__group accessibility-toolbar__images"><legend>${renderIcon('image', 'ui-icon accessibility-panel__icon')}Изображения</legend><div class="accessibility-panel__choices"><button type="button" data-accessibility-setting="images" data-accessibility-value="visible" aria-pressed="true">Показывать</button><button type="button" data-accessibility-setting="images" data-accessibility-value="hidden" aria-pressed="false">Скрывать</button></div></fieldset>`,
    `<fieldset class="accessibility-panel__group accessibility-toolbar__speech"><legend>${renderIcon('speaker', 'ui-icon accessibility-panel__icon')}Голосовое подтверждение</legend><div class="accessibility-panel__choices"><button class="accessibility-action-button" type="button" data-speech-announcements aria-describedby="accessibility-speech-availability" aria-pressed="false" disabled>${renderIcon('speaker', 'ui-icon')}<span class="accessibility-action-button__label">Голосовые подтверждения</span></button></div><p id="accessibility-speech-availability" class="accessibility-panel__availability" data-speech-availability>Локальный русский голос недоступен в этом браузере</p></fieldset>`,
    '<fieldset class="accessibility-panel__group accessibility-toolbar__actions"><legend>Настройки и действия</legend><div class="accessibility-panel__choices">',
    `<button class="accessibility-action-button" type="button" data-accessibility-advanced-open aria-controls="accessibility-settings-dialog" aria-expanded="false">${renderIcon('gear', 'ui-icon')}<span class="accessibility-action-button__label">Расширенные настройки</span></button>`,
    '<button type="button" data-accessibility-standard>Обычная версия сайта</button>',
    `<button class="accessibility-action-button accessibility-action-button--collapse" type="button" data-accessibility-close><span class="accessibility-action-button__label">Свернуть</span>${renderIcon('collapse', 'ui-icon')}</button>`,
    '</div></fieldset>',
    '</div>',
    '<p class="sr-only" data-accessibility-status role="status" aria-live="polite"></p>',
    '</div>',
    '</section>',
  ].join('');
}

export function renderAccessibilitySettingsDialog() {
  return [
    '<div id="accessibility-settings-dialog" class="accessibility-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="accessibility-settings-title" hidden>',
    '<div class="accessibility-settings-dialog__backdrop" data-accessibility-dialog-backdrop aria-hidden="true"></div>',
    '<div class="accessibility-settings-dialog__panel">',
    '<button type="button" data-accessibility-dialog-close aria-label="Закрыть расширенные настройки">×</button>',
    '<h2 id="accessibility-settings-title">Расширенные настройки</h2>',
    '<div class="accessibility-settings-dialog__groups">',
    ADVANCED_SETTING_GROUPS.map(renderSettingGroup).join(''),
    '</div>',
    '<button type="button" data-accessibility-reset>Сбросить настройки</button>',
    '</div>',
    '</div>',
  ].join('');
}
