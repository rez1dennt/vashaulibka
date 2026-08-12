import { afterEach, describe, expect, it, vi } from 'vitest';
import { initSiteSearch } from '../../src/js/components/site-search.js';
import { unlockScroll } from '../../src/js/core/scroll-lock.js';

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
  <button data-search-open aria-controls="site-search-dialog">Поиск</button>
  <div id="site-search-dialog" role="dialog" hidden>
    <div data-search-backdrop></div>
    <section>
      <button data-search-close>Закрыть</button>
      <input data-search-input role="combobox" aria-controls="site-search-results" aria-expanded="false">
      <button data-search-clear hidden>Очистить</button>
      <p data-search-status></p>
      <div data-search-content></div>
      <ul class="site-search__results" id="site-search-results" role="listbox"></ul>
    </section>
  </div>`;

const successfulFetch = (items = [item]) => vi.fn(async () => ({
  ok: true,
  json: async () => ({ version: 1, items }),
}));

const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

afterEach(() => {
  unlockScroll();
  document.body.className = '';
  document.body.innerHTML = '';
});

describe('site search dialog', () => {
  it('loads once, searches, supports arrows and returns focus after Escape', async () => {
    document.body.innerHTML = markup;
    const fetchImpl = successfulFetch();
    const navigate = vi.fn();
    initSiteSearch({ fetchImpl, navigate });
    const opener = document.querySelector('[data-search-open]');

    opener.click();
    await settle();
    const input = document.querySelector('[data-search-input]');
    input.value = 'лицензия';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(1);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(navigate).toHaveBeenCalledWith('license.html');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.querySelector('#site-search-dialog').hidden).toBe(true);
    expect(document.activeElement).toBe(opener);

    opener.click();
    await settle();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    document.querySelector('[data-search-close]').click();
  });

  it('renders malicious index and query text only as text', async () => {
    document.body.innerHTML = markup;
    const malicious = { ...item, title: '<img src=x onerror=alert(1)> Лицензия' };
    initSiteSearch({ fetchImpl: successfulFetch([malicious]) });
    document.querySelector('[data-search-open]').click();
    await settle();
    const input = document.querySelector('[data-search-input]');
    input.value = 'лицензия';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(document.querySelector('.site-search__results img')).toBeNull();
    expect(document.querySelector('.site-search__results').textContent).toContain('<img');
    document.querySelector('[data-search-close]').click();
  });

  it('shows common links while empty and a usable failed-index state', async () => {
    document.body.innerHTML = markup;
    initSiteSearch({ fetchImpl: async () => ({ ok: false }) });
    document.querySelector('[data-search-open]').click();
    expect(document.querySelector('[data-search-content]').textContent).toContain('Карта сайта');
    await settle();

    expect(document.querySelector('[data-search-status]').textContent).toContain('не удалось загрузить');
    expect(document.querySelector('[data-search-content] a[href="patients.html"]')).not.toBeNull();
    document.querySelector('[data-search-close]').click();
  });

  it.each([
    [{ ctrlKey: true, key: 'k' }],
    [{ metaKey: true, key: 'k' }],
  ])('opens from a global keyboard shortcut', (keys) => {
    document.body.innerHTML = markup;
    initSiteSearch({ fetchImpl: successfulFetch([]) });
    document.dispatchEvent(new KeyboardEvent('keydown', { ...keys, bubbles: true, cancelable: true }));

    expect(document.querySelector('#site-search-dialog').hidden).toBe(false);
    expect(document.activeElement).toBe(document.querySelector('[data-search-input]'));
    document.querySelector('[data-search-close]').click();
  });

  it('clears the query and closes from the real backdrop', async () => {
    document.body.innerHTML = markup;
    initSiteSearch({ fetchImpl: successfulFetch() });
    const opener = document.querySelector('[data-search-open]');
    opener.click();
    await settle();
    const input = document.querySelector('[data-search-input]');
    input.value = 'лицензия';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('[data-search-clear]').click();

    expect(input.value).toBe('');
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(0);
    document.querySelector('[data-search-backdrop]').click();
    expect(document.querySelector('#site-search-dialog').hidden).toBe(true);
    expect(document.activeElement).toBe(opener);
  });

  it('uses aria-activedescendant, traps Tab and limits output to eight results', async () => {
    document.body.innerHTML = markup;
    const many = Array.from({ length: 10 }, (_, index) => ({
      ...item,
      id: `license-${index}`,
      href: `license-${index}.html`,
    }));
    initSiteSearch({ fetchImpl: successfulFetch(many) });
    document.querySelector('[data-search-open]').click();
    await settle();
    const input = document.querySelector('[data-search-input]');
    input.value = 'лицензия';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(document.querySelectorAll('[role="option"]')).toHaveLength(8);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(input.getAttribute('aria-activedescendant')).toBe(document.querySelector('[role="option"]').id);
    const lastResult = [...document.querySelectorAll('[role="option"]')].at(-1);
    lastResult.focus();
    lastResult.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(document.querySelector('[data-search-close]'));
    document.querySelector('[data-search-close]').click();
  });

  it('does not hijack shortcuts behind an open menu or another dialog', () => {
    document.body.innerHTML = `${markup}<div id="appointment-dialog" role="dialog"></div>`;
    initSiteSearch({ fetchImpl: successfulFetch() });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    expect(document.querySelector('#site-search-dialog').hidden).toBe(true);

    document.querySelector('#appointment-dialog').hidden = true;
    document.body.classList.add('menu-open');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    expect(document.querySelector('#site-search-dialog').hidden).toBe(true);
  });

  it.each([
    ['', 'Введите не менее двух символов'],
    ['з', 'Добавьте ещё один символ'],
    ['неизвестныйзапрос', 'Ничего не найдено'],
  ])('announces the query state for %j', async (query, expected) => {
    document.body.innerHTML = markup;
    initSiteSearch({ fetchImpl: successfulFetch() });
    document.querySelector('[data-search-open]').click();
    await settle();
    const input = document.querySelector('[data-search-input]');
    input.value = query;
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(document.querySelector('[data-search-status]').textContent).toContain(expected);
    document.querySelector('[data-search-close]').click();
  });
});
