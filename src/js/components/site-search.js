import { searchItems } from '../core/search-engine.js';

const INDEX_URL = 'search-index.json';
const QUICK_LINKS = Object.freeze([
  ['Услуги', 'services.html'],
  ['Цены', 'prices.html'],
  ['Специалисты', 'specialists.html'],
  ['Лицензия', 'license.html'],
  ['Контакты', 'contacts.html'],
  ['Карта сайта', 'patients.html'],
]);

const EMPTY_LINKS = Object.freeze([
  ['Услуги', 'services.html'],
  ['Цены', 'prices.html'],
  ['Контакты', 'contacts.html'],
]);

const isVisible = (element) => element && !element.hidden;
const isCompactSearch = () => globalThis.matchMedia?.('(max-width: 74.999rem)').matches ?? false;

const createQuickLinks = (container) => {
  container.replaceChildren();
  const heading = document.createElement('p');
  heading.className = 'site-search__quick-heading';
  heading.textContent = 'Часто ищут';
  const list = document.createElement('div');
  list.className = 'site-search__quick-links';
  for (const [label, href] of QUICK_LINKS) {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    list.append(link);
  }
  container.append(heading, list);
};

const createEmptyLinks = (container) => {
  container.replaceChildren();
  const heading = document.createElement('p');
  heading.className = 'site-search__quick-heading';
  heading.textContent = 'Попробуйте разделы';
  const list = document.createElement('div');
  list.className = 'site-search__quick-links';
  for (const [label, href] of EMPTY_LINKS) {
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    list.append(link);
  }
  container.append(heading, list);
};

const resultCountLabel = (count) => {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `Найдено ${count} результатов`;
  if (last === 1) return `Найден ${count} результат`;
  if (last >= 2 && last <= 4) return `Найдено ${count} результата`;
  return `Найдено ${count} результатов`;
};

const appendHighlighted = (container, value, terms) => {
  const text = String(value ?? '');
  const lower = text.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е');
  const positions = terms
    .map((term) => ({ term, index: lower.indexOf(term) }))
    .filter(({ index }) => index >= 0)
    .sort((left, right) => left.index - right.index);

  if (!positions.length) {
    container.textContent = text;
    return;
  }

  let cursor = 0;
  for (const { term, index } of positions) {
    if (index < cursor) continue;
    container.append(document.createTextNode(text.slice(cursor, index)));
    const mark = document.createElement('mark');
    mark.textContent = text.slice(index, index + term.length);
    container.append(mark);
    cursor = index + term.length;
  }
  container.append(document.createTextNode(text.slice(cursor)));
};

const loadIndex = async (fetchImpl) => {
  const response = await fetchImpl(INDEX_URL, { credentials: 'same-origin' });
  if (!response?.ok) throw new Error('Search index request failed');
  const payload = await response.json();
  if (payload?.version !== 1 || !Array.isArray(payload.items)) {
    throw new Error('Search index schema is invalid');
  }
  return payload.items;
};

export function initSiteSearch({
  fetchImpl = globalThis.fetch,
  navigate = (href) => window.location.assign(href),
} = {}) {
  const root = document.querySelector('[data-site-search]');
  const toggle = root?.querySelector('[data-search-toggle]');
  const input = root?.querySelector('[data-search-input]');
  const clearButton = root?.querySelector('[data-search-clear]');
  const dropdown = root?.querySelector('[data-search-dropdown]');
  const status = root?.querySelector('[data-search-status]');
  const content = root?.querySelector('[data-search-content]');
  const results = root?.querySelector('#site-search-results');
  const hint = root?.querySelector('[data-search-hint]');
  if (!root || !toggle || !input || !clearButton || !dropdown || !status || !content || !results || !hint
    || typeof fetchImpl !== 'function') return;

  let indexPromise;
  let indexItems = [];
  let activeIndex = -1;
  let currentMatches = [];

  const setStatus = (message) => {
    status.textContent = message;
  };

  const setActive = (nextIndex) => {
    const options = [...results.querySelectorAll('[role="option"]')];
    options.forEach((option) => option.setAttribute('aria-selected', 'false'));
    if (!options.length) {
      activeIndex = -1;
      input.removeAttribute('aria-activedescendant');
      return;
    }
    activeIndex = (nextIndex + options.length) % options.length;
    const active = options[activeIndex];
    active.setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', active.id);
    active.scrollIntoView?.({ block: 'nearest' });
  };

  const renderMatches = (matches) => {
    results.replaceChildren();
    currentMatches = matches;
    activeIndex = -1;
    hint.hidden = !matches.length;
    input.removeAttribute('aria-activedescendant');

    matches.forEach((match, index) => {
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      link.id = `site-search-option-${index}`;
      link.href = match.item.href;
      link.className = 'site-search__result';
      link.setAttribute('role', 'option');
      link.setAttribute('aria-selected', 'false');
      const category = document.createElement('span');
      category.className = 'site-search__result-category';
      category.textContent = match.item.category;
      const title = document.createElement('strong');
      appendHighlighted(title, match.item.title, match.matchedTerms);
      const summary = document.createElement('span');
      summary.className = 'site-search__result-summary';
      appendHighlighted(summary, match.snippet, match.matchedTerms);
      const arrow = document.createElement('span');
      arrow.className = 'site-search__result-arrow';
      arrow.textContent = '→';
      arrow.setAttribute('aria-hidden', 'true');
      link.append(category, title, summary, arrow);
      link.addEventListener('mousemove', () => setActive(index));
      listItem.append(link);
      results.append(listItem);
    });
  };

  const update = () => {
    const query = input.value.trim();
    clearButton.hidden = !query;
    content.hidden = Boolean(query);
    if (!query) {
      renderMatches([]);
      createQuickLinks(content);
      setStatus('Введите не менее двух символов');
      return;
    }
    if (query.replace(/\s+/g, '').length < 2) {
      renderMatches([]);
      setStatus('Добавьте ещё один символ');
      return;
    }
    const matches = searchItems(indexItems, query, { limit: 8 });
    renderMatches(matches);
    if (matches.length) {
      content.hidden = true;
      setStatus(resultCountLabel(matches.length));
      return;
    }
    createEmptyLinks(content);
    content.hidden = false;
    setStatus('Ничего не найдено. Проверьте запрос или откройте нужный раздел.');
  };

  const ensureIndex = () => {
    indexPromise ??= loadIndex(fetchImpl);
    return indexPromise
      .then((items) => {
        indexItems = items;
        update();
      })
      .catch(() => {
        indexItems = [];
        createQuickLinks(content);
        content.hidden = false;
        setStatus('Поиск не удалось загрузить. Откройте карту сайта.');
      });
  };

  const setOpenState = (open) => {
    root.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть поиск по сайту' : 'Открыть поиск по сайту');
    input.setAttribute('aria-expanded', String(open));
    dropdown.setAttribute('aria-hidden', String(!open));
    if (!open) input.removeAttribute('aria-activedescendant');
  };

  const open = ({ focusInput = false } = {}) => {
    const wasOpen = root.classList.contains('is-open');
    setOpenState(true);
    createQuickLinks(content);
    update();
    if (!indexItems.length) setStatus('Загружаем поиск…');
    ensureIndex();
    if (focusInput && document.activeElement !== input) input.focus();
    return !wasOpen;
  };

  const close = ({ restoreToggle = false } = {}) => {
    if (!root.classList.contains('is-open')) return;
    setOpenState(false);
    activeIndex = -1;
    if (restoreToggle && toggle.isConnected) toggle.focus();
  };

  input.addEventListener('input', update);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(activeIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(activeIndex - 1);
    } else if (event.key === 'Home' && currentMatches.length) {
      event.preventDefault();
      setActive(0);
    } else if (event.key === 'End' && currentMatches.length) {
      event.preventDefault();
      setActive(currentMatches.length - 1);
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      navigate(currentMatches[activeIndex].item.href);
    }
  });

  clearButton.addEventListener('click', () => {
    input.value = '';
    update();
    input.focus();
  });
  input.addEventListener('focus', () => open());
  toggle.addEventListener('click', () => {
    if (root.classList.contains('is-open')) {
      close({ restoreToggle: true });
      return;
    }
    open({ focusInput: true });
  });

  document.addEventListener('pointerdown', (event) => {
    if (!root.contains(event.target)) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('is-open')) {
      event.preventDefault();
      close({ restoreToggle: isCompactSearch() || document.activeElement !== input });
      return;
    }
    if (event.key.toLocaleLowerCase('ru-RU') !== 'k' || (!event.ctrlKey && !event.metaKey)) return;
    if (document.body.classList.contains('menu-open')) return;
    const otherDialog = [...document.querySelectorAll('[role="dialog"]')]
      .some((candidate) => isVisible(candidate));
    if (otherDialog) return;
    event.preventDefault();
    open({ focusInput: true });
  });
}
