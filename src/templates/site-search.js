import { renderIcon } from './icons.js';

export function renderSiteSearch() {
  return [
    '<div class="site-search" data-site-search>',
    '<button class="site-search__toggle" type="button" data-search-toggle aria-controls="site-search-surface" aria-expanded="false" aria-label="Открыть поиск по сайту">',
    renderIcon('search', 'site-search__toggle-icon'),
    '<span class="sr-only">Поиск по сайту</span></button>',
    '<div class="site-search__surface" id="site-search-surface" data-search-surface>',
    `<div class="site-search__field">${renderIcon('search')}<label class="sr-only" for="site-search-input">Поиск по сайту</label><input id="site-search-input" type="search" data-search-input role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-controls="site-search-results" aria-expanded="false" autocomplete="off" spellcheck="false" placeholder="Услуга, врач, документ или вопрос"><kbd>Ctrl K</kbd><button type="button" data-search-clear aria-label="Очистить поиск" hidden>${renderIcon('clear')}</button></div>`,
    '<div class="site-search__dropdown" data-search-dropdown aria-hidden="true">',
    '<p class="site-search__status" data-search-status aria-live="polite">Введите не менее двух символов</p>',
    '<div class="site-search__content" data-search-content></div>',
    '<ul class="site-search__results" id="site-search-results" role="listbox"></ul>',
    '<p class="site-search__hint"><kbd>↑</kbd><kbd>↓</kbd> выбор <kbd>Enter</kbd> открыть <kbd>Esc</kbd> закрыть</p>',
    '</div></div>',
    '<a class="site-search-fallback" href="patients.html">Карта сайта</a>',
    '</div>',
  ].join('');
}
