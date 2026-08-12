import { afterEach, describe, expect, it, vi } from 'vitest';
import { initSiteSearch } from '../../src/js/components/site-search.js';

const item = {
  id: 'license',
  href: 'license.html',
  category: 'Документы',
  title: 'Лицензия и документы',
  summary: 'Выписка из реестра',
  content: 'ОГРН',
  keywords: ['лицензия'],
};

const markup = `
  <div class="site-search" data-site-search>
    <button data-search-toggle aria-controls="site-search-surface" aria-expanded="false" aria-label="Открыть поиск по сайту">Поиск</button>
    <div id="site-search-surface" data-search-surface>
      <input data-search-input role="combobox" aria-controls="site-search-results" aria-expanded="false">
      <button data-search-clear hidden>Очистить</button>
      <div data-search-dropdown aria-hidden="true">
        <p data-search-status></p>
        <div data-search-content></div>
        <ul class="site-search__results" id="site-search-results" role="listbox"></ul>
        <p data-search-hint hidden>Клавиатурная подсказка</p>
      </div>
    </div>
  </div>
  <button data-outside>Вне поиска</button>`;

const successfulFetch = (items = [item]) => vi.fn(async () => ({
  ok: true,
  json: async () => ({ version: 1, items }),
}));

const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.className = '';
  document.body.innerHTML = '';
});

describe('inline site search dropdown', () => {
  it('loads once, searches, supports arrows and closes without locking scroll', async () => {
    document.body.innerHTML = markup;
    const fetchImpl = successfulFetch();
    const navigate = vi.fn();
    initSiteSearch({ fetchImpl, navigate });
    const root = document.querySelector('[data-site-search]');
    const toggle = document.querySelector('[data-search-toggle]');
    const input = document.querySelector('[data-search-input]');
    const dropdown = document.querySelector('[data-search-dropdown]');

    toggle.click();
    await settle();
    expect(root.classList.contains('is-open')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(dropdown.getAttribute('aria-hidden')).toBe('false');
    expect(document.body.classList.contains('is-locked')).toBe(false);
    expect(document.activeElement).toBe(input);

    input.value = 'лицензия';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(1);
    expect(document.querySelector('[data-search-hint]').hidden).toBe(false);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(navigate).toHaveBeenCalledWith('license.html');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(root.classList.contains('is-open')).toBe(false);
    expect(dropdown.getAttribute('aria-hidden')).toBe('true');

    toggle.click();
    await settle();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('opens on input focus and closes on outside pointerdown or repeated toggle', () => {
    document.body.innerHTML = markup;
    initSiteSearch({ fetchImpl: successfulFetch([]) });
    const root = document.querySelector('[data-site-search]');
    const toggle = document.querySelector('[data-search-toggle]');
    const input = document.querySelector('[data-search-input]');

    input.focus();
    expect(root.classList.contains('is-open')).toBe(true);
    document.querySelector('[data-outside]').dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(root.classList.contains('is-open')).toBe(false);

    toggle.click();
    expect(root.classList.contains('is-open')).toBe(true);
    toggle.click();
    expect(root.classList.contains('is-open')).toBe(false);
    expect(document.activeElement).toBe(toggle);
  });

  it('returns focus to the visible toggle when Escape closes compact search', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    document.body.innerHTML = markup;
    initSiteSearch({ fetchImpl: successfulFetch([]) });
    const toggle = document.querySelector('[data-search-toggle]');
    const input = document.querySelector('[data-search-input]');

    toggle.click();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(document.querySelector('[data-site-search]').classList.contains('is-open')).toBe(false);
    expect(document.activeElement).toBe(toggle);
  });

  it('renders malicious index and query text only as text', async () => {
    document.body.innerHTML = markup;
    const malicious = { ...item, title: '<img src=x onerror=alert(1)> Лицензия' };
    initSiteSearch({ fetchImpl: successfulFetch([malicious]) });
    document.querySelector('[data-search-toggle]').click();
    await settle();
    const input = document.querySelector('[data-search-input]');
    input.value = 'лицензия';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(document.querySelector('.site-search__results img')).toBeNull();
    expect(document.querySelector('.site-search__results').textContent).toContain('<img');
  });

  it('shows common links while empty and a usable failed-index state', async () => {
    document.body.innerHTML = markup;
    initSiteSearch({ fetchImpl: async () => ({ ok: false }) });
    document.querySelector('[data-search-toggle]').click();
    expect(document.querySelector('[data-search-content]').textContent).toContain('Карта сайта');
    await settle();

    expect(document.querySelector('[data-search-status]').textContent).toContain('не удалось загрузить');
    expect(document.querySelector('[data-search-content] a[href="patients.html"]')).not.toBeNull();
    expect(document.querySelector('[data-search-hint]').hidden).toBe(true);
  });

  it.each([
    [{ ctrlKey: true, key: 'k' }],
    [{ metaKey: true, key: 'k' }],
  ])('opens from a global keyboard shortcut', (keys) => {
    document.body.innerHTML = markup;
    initSiteSearch({ fetchImpl: successfulFetch([]) });
    document.dispatchEvent(new KeyboardEvent('keydown', { ...keys, bubbles: true, cancelable: true }));

    expect(document.querySelector('[data-site-search]').classList.contains('is-open')).toBe(true);
    expect(document.activeElement).toBe(document.querySelector('[data-search-input]'));
  });

  it('clears the query and restores quick links', async () => {
    document.body.innerHTML = markup;
    initSiteSearch({ fetchImpl: successfulFetch() });
    document.querySelector('[data-search-toggle]').click();
    await settle();
    const input = document.querySelector('[data-search-input]');
    input.value = 'лицензия';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('[data-search-clear]').click();

    expect(input.value).toBe('');
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(0);
    expect(document.querySelector('[data-search-content]').textContent).toContain('Карта сайта');
    expect(document.querySelector('[data-search-hint]').hidden).toBe(true);
    expect(document.activeElement).toBe(input);
  });

  it('uses aria-activedescendant, preserves normal Tab behavior and limits output to eight results', async () => {
    document.body.innerHTML = markup;
    const many = Array.from({ length: 10 }, (_, index) => ({
      ...item,
      id: `license-${index}`,
      href: `license-${index}.html`,
    }));
    initSiteSearch({ fetchImpl: successfulFetch(many) });
    document.querySelector('[data-search-toggle]').click();
    await settle();
    const input = document.querySelector('[data-search-input]');
    input.value = 'лицензия';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(document.querySelectorAll('[role="option"]')).toHaveLength(8);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(input.getAttribute('aria-activedescendant')).toBe(document.querySelector('[role="option"]').id);
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    expect(input.dispatchEvent(tabEvent)).toBe(true);
  });

  it('does not hijack shortcuts behind an open menu or another dialog', () => {
    document.body.innerHTML = `${markup}<div id="appointment-dialog" role="dialog"></div>`;
    initSiteSearch({ fetchImpl: successfulFetch() });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    expect(document.querySelector('[data-site-search]').classList.contains('is-open')).toBe(false);

    document.querySelector('#appointment-dialog').hidden = true;
    document.body.classList.add('menu-open');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    expect(document.querySelector('[data-site-search]').classList.contains('is-open')).toBe(false);
  });

  it.each([
    ['', 'Введите не менее двух символов'],
    ['з', 'Добавьте ещё один символ'],
    ['неизвестныйзапрос', 'Ничего не найдено'],
  ])('announces the query state for %j', async (query, expected) => {
    document.body.innerHTML = markup;
    initSiteSearch({ fetchImpl: successfulFetch() });
    document.querySelector('[data-search-toggle]').click();
    await settle();
    const input = document.querySelector('[data-search-input]');
    input.value = query;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(document.querySelector('[data-search-status]').textContent).toContain(expected);
  });
});
