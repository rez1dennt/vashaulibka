import { DEFAULT_ACCESSIBILITY_PREFERENCES } from '../js/core/accessibility-preferences.js';

const SETTING_GROUPS = Object.freeze([
  {
    legend: 'Размер текста',
    setting: 'scale',
    options: [
      ['100', '100%'],
      ['125', '125%'],
      ['150', '150%'],
      ['200', '200%'],
    ],
  },
  {
    legend: 'Цветовая схема',
    setting: 'theme',
    options: [
      ['standard', 'Стандартная'],
      ['black-white', 'Чёрным по белому'],
      ['white-black', 'Белым по чёрному'],
      ['blue-light', 'Тёмно-синим по светло-голубому'],
    ],
  },
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
  {
    legend: 'Изображения',
    setting: 'images',
    options: [
      ['visible', 'Показывать'],
      ['hidden', 'Скрывать'],
    ],
  },
]);

const renderSettingGroup = ({ legend, setting, options }) => [
  '<fieldset class="accessibility-panel__group">',
  `<legend>${legend}</legend>`,
  '<div class="accessibility-panel__choices">',
  options.map(([value, label]) => `<button type="button" data-accessibility-setting="${setting}" data-accessibility-value="${value}" aria-pressed="${value === DEFAULT_ACCESSIBILITY_PREFERENCES[setting]}">${label}</button>`).join(''),
  '</div>',
  '</fieldset>',
].join('');

export function renderAccessibilityPanel() {
  return [
    '<section class="accessibility-panel" id="accessibility-panel" data-accessibility-panel aria-labelledby="accessibility-panel-title" hidden>',
    '<div class="header-shell accessibility-panel__inner">',
    '<div class="accessibility-panel__heading">',
    '<h2 id="accessibility-panel-title">Настройки доступности</h2>',
    '<button type="button" data-accessibility-close aria-label="Закрыть настройки">×</button>',
    '</div>',
    '<div class="accessibility-panel__groups">',
    SETTING_GROUPS.map(renderSettingGroup).join(''),
    '<fieldset class="accessibility-panel__group"><legend>Озвучивание</legend><div class="accessibility-panel__choices"><button type="button" data-speech-read disabled>Читать страницу</button><button type="button" data-speech-pause disabled>Пауза/Продолжить</button><button type="button" data-speech-stop disabled>Остановить</button></div></fieldset>',
    '</div>',
    '<div class="accessibility-panel__actions">',
    '<button type="button" data-accessibility-reset>Сбросить настройки</button>',
    '</div>',
    '<p class="sr-only" data-accessibility-status role="status" aria-live="polite"></p>',
    '</div>',
    '</section>',
  ].join('');
}
