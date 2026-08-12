import { renderIcon } from './icons.js';

export function renderSearchTrigger() {
  return [
    '<button class="site-search-trigger" type="button" data-search-open aria-controls="site-search-dialog" aria-haspopup="dialog">',
    renderIcon('search', 'site-search-trigger__icon'),
    '<span class="site-search-trigger__label">Поиск по сайту</span>',
    '<kbd>Ctrl K</kbd>',
    '</button>',
    '<a class="site-search-fallback" href="patients.html">Карта сайта</a>',
  ].join('');
}

export function renderSiteSearch() {
  return [
    '<div id="site-search-dialog" class="site-search" role="dialog" aria-modal="true" aria-labelledby="site-search-title" hidden>',
    '<div class="site-search__backdrop" data-search-backdrop aria-hidden="true"></div>',
    '<section class="site-search__panel">',
    '<header class="site-search__header"><div><p class="eyebrow">Поиск по сайту</p><h2 id="site-search-title">Что вы хотите найти?</h2></div>',
    `<button class="site-search__close" type="button" data-search-close aria-label="Закрыть поиск">${renderIcon('close')}</button></header>`,
    `<div class="site-search__field">${renderIcon('search')}<input type="search" data-search-input role="combobox" aria-autocomplete="list" aria-controls="site-search-results" aria-expanded="false" autocomplete="off" spellcheck="false" placeholder="Услуга, врач, документ или вопрос"><button type="button" data-search-clear aria-label="Очистить поиск" hidden>${renderIcon('clear')}</button></div>`,
    '<p class="site-search__status" data-search-status aria-live="polite">Введите не менее двух символов</p>',
    '<div class="site-search__content" data-search-content></div>',
    '<ul class="site-search__results" id="site-search-results" role="listbox"></ul>',
    '<p class="site-search__hint"><kbd>↑</kbd><kbd>↓</kbd> выбор <kbd>Enter</kbd> открыть <kbd>Esc</kbd> закрыть</p>',
    '</section></div>',
  ].join('');
}
