# Local Clinic Site Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a polished, fast, accessible, fully local search that finds every published page, licensed service and confirmed staff member using Russian keywords and synonyms.

**Architecture:** The static generator will build a deterministic `public/search-index.json` from the page manifest and confirmed structured data. A dependency-free pure search engine will normalize Russian text, rank exact and fuzzy matches, and a progressively enhanced dialog will render results with safe DOM APIs. The header gets one responsive search trigger: a centered labelled control on desktop and a compact icon beside the burger on smaller screens.

**Tech Stack:** Node.js ESM, Vite 8, vanilla HTML/CSS/JavaScript, JSDOM 26, Vitest 4, existing focus-trap and ref-counted scroll-lock utilities.

## Global Constraints

- Search queries stay in the browser and must not be written to cookies, `localStorage`, the URL, analytics, logs or any remote service.
- Search is a user-experience feature; public copy must not claim that Order of the Ministry of Health of Russia No. 118n directly mandates an internal search field.
- Search all 21 generated pages plus separate records for the three confirmed services and five confirmed staff members.
- Keep `prices.html` and `specialists.html` externally `noindex` until their missing confirmed content is supplied; they remain available to internal search.
- Use a generated `public/search-index.json` with only local `.html` links and optional verified fragments.
- Keep search keywords in `src/data/search-keywords.js`; do not add obsolete `<meta name="keywords">` tags.
- Normalize case, punctuation, whitespace and `ё`/`е`; allow a one-edit fuzzy match only for query tokens of at least four characters and only against titles or keywords.
- Never add unsupported service keywords such as implantology, orthodontics, surgery or pediatric dentistry until the clinic confirms those services.
- Render query text and index text with DOM text nodes; never interpolate them into `innerHTML`.
- The enhancement must work without new runtime packages, external fonts, trackers, analytics or search APIs.
- With JavaScript disabled, search controls are hidden and all information remains reachable through the existing navigation and patient map.
- Preserve the existing appointment dialog, mobile menu, vision mode, cookie controls, reduced-motion behavior and 44px minimum interactive targets.

---

## File Map

**Create**

- `src/data/search-keywords.js` — reviewed Russian keyword and synonym groups keyed by public route and structured entity.
- `scripts/generate-search-index.mjs` — deterministic index builder, HTML text extraction and safe local-href validation.
- `src/js/core/search-engine.js` — pure normalization, tokenization, fuzzy comparison, ranking and snippet selection.
- `src/js/components/site-search.js` — dialog lifecycle, lazy index loading, keyboard navigation, safe result rendering and deep-link activation.
- `src/templates/site-search.js` — semantic header trigger and shared dialog markup.
- `src/styles/site-search.css` — responsive trigger, fullscreen/mobile dialog and desktop result panel styles.
- `tests/scripts/search-index.test.js` — index contents, determinism, safety, synonyms and unsupported-term guards.
- `tests/js/search-engine.test.js` — normalization, ranking, fuzzy behavior and empty-query behavior.
- `tests/js/site-search.test.js` — progressive enhancement, keyboard, focus, safe highlighting and load-error behavior.
- `tests/templates/site-search.test.js` — semantic trigger/dialog/no-JS markup.
- `tests/styles/site-search.test.js` — responsive, vision and reduced-motion contracts.

**Modify**

- `scripts/generate-pages.mjs` — generate `search-index.json` with robots and sitemap.
- `scripts/verify-site.mjs` — validate the built index, every local target and every fragment.
- `src/content/service-pages.js` — add stable `service-*` fragment targets.
- `src/content/specialists-page.js` — add stable `specialist-*` fragment targets.
- `src/templates/icons.js` — add search, clear and close SVG paths.
- `src/templates/site-chrome.js` — place the responsive search trigger in the brand row.
- `src/templates/render-page.js` — render the search dialog once on every page.
- `src/js/main.js` — initialize the site search.
- `src/js/components/tabs.js` — select a service tab from a `#service-*` fragment.
- `src/js/components/disclosures.js` — expand a service disclosure from a `#service-*` fragment.
- `src/js/components/specialists-coverflow.js` — activate a staff card from a `#specialist-*` fragment.
- `src/styles/main.css` — import the search component stylesheet.
- `src/styles/tokens.css` — add search sizes, colors, shadows and z-index semantic tokens.
- `src/styles/layout.css` — change the brand row to brand/search/actions on desktop and brand/search/burger below 75rem.
- `tests/scripts/site-verifier.test.js` — cover malformed and unsafe search indexes.
- `tests/templates/site-chrome.test.js` — assert the trigger placement and accessible name.
- `tests/templates/icons.test.js` — cover the new SVG icons.
- `tests/project/handoff.test.js` — permit the non-collecting search input while continuing to reject forms and personal-data submission.
- `README.md` — document local index generation and privacy behavior.

**Generated and committed**

- `public/search-index.json` — stable source artifact copied by Vite to `dist/search-index.json`.
- All 21 root HTML files — regenerated after shared header/dialog and fragment changes.

---

### Task 1: Deterministic Search Index and Reviewed Keywords

**Files:**
- Create: `src/data/search-keywords.js`
- Create: `scripts/generate-search-index.mjs`
- Create: `tests/scripts/search-index.test.js`
- Modify: `scripts/generate-pages.mjs`
- Modify: `src/content/service-pages.js`
- Modify: `src/content/specialists-page.js`
- Generate: `public/search-index.json`

**Interfaces:**
- Consumes: `PAGES`, `SERVICES`, `STAFF` and `SEARCH_PAGE_META`.
- Produces: `buildSearchIndex({ pages, services, staff }): { version: 1, items: SearchItem[] }`, `serializeSearchIndex(index): string`, and `isSafeSearchHref(href): boolean`.
- `SearchItem` is `{ id, href, category, title, summary, content, keywords }`, where `keywords` is a frozen string array and all other fields are non-empty strings.

- [ ] **Step 1: Write the failing generator tests**

Create `tests/scripts/search-index.test.js` with these contract checks:

```js
import { describe, expect, it } from 'vitest';
import { PAGES } from '../../src/content/page-manifest.js';
import { SERVICES } from '../../src/data/services.js';
import { STAFF } from '../../src/data/staff.js';
import {
  buildSearchIndex,
  isSafeSearchHref,
  serializeSearchIndex,
} from '../../scripts/generate-search-index.mjs';

const build = () => buildSearchIndex({ pages: PAGES, services: SERVICES, staff: STAFF });

describe('generated local search index', () => {
  it('contains each page, each service and each confirmed staff member', () => {
    const { version, items } = build();
    expect(version).toBe(1);
    expect(items).toHaveLength(PAGES.length + SERVICES.length + STAFF.length);
    expect(PAGES.every((page) => items.some((item) => item.href === page.file))).toBe(true);
    expect(SERVICES.every((service) => items.some((item) => item.href === `services.html#service-${service.slug}`))).toBe(true);
    expect(STAFF.every((person, index) => items.some((item) => item.href === `specialists.html#specialist-${index + 1}` && item.title === person.name))).toBe(true);
  });

  it('is deterministic, unique and restricted to local HTML targets', () => {
    const first = build();
    const second = build();
    expect(serializeSearchIndex(first)).toBe(serializeSearchIndex(second));
    expect(new Set(first.items.map((item) => item.id)).size).toBe(first.items.length);
    expect(first.items.every((item) => isSafeSearchHref(item.href))).toBe(true);
    expect(isSafeSearchHref('https://example.com')).toBe(false);
    expect(isSafeSearchHref('javascript:alert(1)')).toBe(false);
    expect(isSafeSearchHref('../private.html')).toBe(false);
  });

  it.each([
    ['врач', 'specialists.html'],
    ['сколько стоит', 'prices.html'],
    ['болит зуб', 'services.html#service-therapy'],
    ['лицензия', 'license.html'],
    ['ОГРН', 'license.html'],
    ['график', 'contacts.html'],
    ['жалоба', 'complaints.html'],
    ['ОМС', 'oms.html'],
    ['куки', 'cookies.html'],
  ])('stores reviewed keywords for %s', (keyword, expectedHref) => {
    const item = build().items.find((candidate) => candidate.href === expectedHref);
    expect([item.title, item.summary, item.content, ...item.keywords].join(' ').toLowerCase()).toContain(keyword.toLowerCase());
  });

  it('does not advertise unconfirmed services', () => {
    const corpus = serializeSearchIndex(build()).toLowerCase();
    for (const unsupported of ['имплантация', 'ортодонтия', 'хирургия', 'детская стоматология']) {
      expect(corpus).not.toContain(unsupported);
    }
  });
});
```

- [ ] **Step 2: Run the test and capture RED**

Run: `pnpm test tests/scripts/search-index.test.js`

Expected: FAIL because `scripts/generate-search-index.mjs` and `src/data/search-keywords.js` do not exist.

- [ ] **Step 3: Add the reviewed keyword data**

Create `src/data/search-keywords.js` as immutable data with one entry per route and dedicated entity groups. Use these exact supported groups:

```js
export const SEARCH_PAGE_META = Object.freeze({
  'index.html': { category: 'Клиника', keywords: ['стоматология', 'зубы', 'Белгород', 'главная'] },
  'about.html': { category: 'Клиника', keywords: ['о клинике', 'стоматология', 'лицензия', 'Белгород'] },
  'services.html': { category: 'Услуги', keywords: ['услуги', 'лечение зубов', 'болит зуб', 'стоматологическая помощь'] },
  'specialists.html': { category: 'Специалисты', keywords: ['врач', 'доктор', 'стоматолог', 'специалист', 'сотрудник', 'команда'] },
  'prices.html': { category: 'Цены', keywords: ['цена', 'стоимость', 'прейскурант', 'сколько стоит'] },
  'reviews.html': { category: 'Клиника', keywords: ['отзывы', 'мнение пациентов'] },
  'vacancies.html': { category: 'Клиника', keywords: ['вакансии', 'работа', 'резюме'] },
  'patients.html': { category: 'Пациентам', keywords: ['пациентам', 'документы', 'правовая информация', 'карта сайта'] },
  'contacts.html': { category: 'Контакты', keywords: ['контакты', 'адрес', 'как проехать', 'телефон', 'почта', 'график', 'режим работы', 'перерыв', 'выходной'] },
  'license.html': { category: 'Документы', keywords: ['лицензия', 'выписка', 'реестр', 'ОГРН', 'ИНН', 'реквизиты', 'документы'] },
  'payment.html': { category: 'Пациентам', keywords: ['оплата', 'наличные', 'карта', 'цена', 'стоимость'] },
  'benefits.html': { category: 'Пациентам', keywords: ['льготы', 'скидки'] },
  'waiting-periods.html': { category: 'Пациентам', keywords: ['сроки ожидания', 'ожидание', 'запись на прием', 'запись на приём'] },
  'oms.html': { category: 'Пациентам', keywords: ['ОМС', 'полис', 'обязательное медицинское страхование'] },
  'informed-consent.html': { category: 'Пациентам', keywords: ['информированное согласие', 'ИДС', 'медицинское вмешательство'] },
  'guarantees.html': { category: 'Пациентам', keywords: ['гарантия', 'гарантийные сроки'] },
  'complaints.html': { category: 'Пациентам', keywords: ['жалоба', 'обращение', 'госорганы', 'контролирующие органы'] },
  'standards.html': { category: 'Пациентам', keywords: ['стандарты', 'клинические рекомендации', 'клинреки', 'Минздрав'] },
  'personal-data-consent.html': { category: 'Персональные данные', keywords: ['согласие', 'персональные данные', 'обработка персональных данных'] },
  'privacy.html': { category: 'Персональные данные', keywords: ['политика конфиденциальности', 'персональные данные', 'оператор'] },
  'cookies.html': { category: 'Персональные данные', keywords: ['cookies', 'cookie', 'куки', 'файлы cookie'] },
});

export const SEARCH_SERVICE_KEYWORDS = Object.freeze({
  therapy: ['лечение зубов', 'болит зуб', 'кариес', 'терапевт', 'стоматолог-терапевт'],
  orthopedics: ['протезирование', 'протез', 'ортопед', 'стоматолог-ортопед'],
  premedical: ['доврачебная помощь', 'фельдшер', 'сестринское дело', 'медицинская сестра', 'профилактика'],
});

export const SEARCH_STAFF_KEYWORDS = Object.freeze([
  'врач',
  'доктор',
  'стоматолог',
  'специалист',
  'сотрудник',
  'команда',
]);
```

- [ ] **Step 4: Implement the deterministic index builder**

Create `scripts/generate-search-index.mjs` with these public functions and rules:

```js
import { JSDOM } from 'jsdom';
import { SEARCH_PAGE_META, SEARCH_SERVICE_KEYWORDS, SEARCH_STAFF_KEYWORDS } from '../src/data/search-keywords.js';

const SAFE_HREF = /^[a-z0-9-]+\.html(?:#[a-z][a-z0-9-]*)?$/;
const REMOVED_SELECTORS = 'script,style,button,nav,footer,dialog,[hidden],[aria-hidden="true"],.sr-only';

export const isSafeSearchHref = (href) => SAFE_HREF.test(String(href));

const extractText = (markup) => {
  const document = new JSDOM(`<main>${markup}</main>`).window.document;
  document.querySelectorAll(REMOVED_SELECTORS).forEach((node) => node.remove());
  return document.querySelector('main').textContent.replace(/\s+/g, ' ').trim();
};

const freezeItem = (item) => Object.freeze({
  ...item,
  keywords: Object.freeze([...new Set(item.keywords.map((keyword) => String(keyword).trim()).filter(Boolean))]),
});

export function buildSearchIndex({ pages, services, staff }) {
  const pageItems = pages.map((page, order) => {
    const meta = SEARCH_PAGE_META[page.file];
    if (!meta) throw new Error(`Missing search metadata for ${page.file}`);
    return freezeItem({
      id: `page-${page.file.replace(/\.html$/, '')}`,
      href: page.file,
      category: meta.category,
      title: page.heading,
      summary: page.lead,
      content: extractText(page.body),
      keywords: meta.keywords,
      order,
    });
  });

  const serviceItems = services.map((service, index) => freezeItem({
    id: `service-${service.slug}`,
    href: `services.html#service-${service.slug}`,
    category: 'Услуги',
    title: service.title,
    summary: service.summary,
    content: service.items.join(' '),
    keywords: SEARCH_SERVICE_KEYWORDS[service.slug],
    order: pageItems.length + index,
  }));

  const staffItems = staff.map((person, index) => freezeItem({
    id: `specialist-${index + 1}`,
    href: `specialists.html#specialist-${index + 1}`,
    category: 'Специалисты',
    title: person.name,
    summary: person.role,
    content: person.role,
    keywords: [...SEARCH_STAFF_KEYWORDS, person.name, person.role],
    order: pageItems.length + services.length + index,
  }));

  const items = [...pageItems, ...serviceItems, ...staffItems];
  if (items.some((item) => !isSafeSearchHref(item.href))) throw new Error('Search index contains an unsafe href');
  if (new Set(items.map((item) => item.id)).size !== items.length) throw new Error('Search index contains duplicate ids');
  return Object.freeze({ version: 1, items: Object.freeze(items) });
}

export const serializeSearchIndex = (index) => `${JSON.stringify(index, null, 2)}\n`;
```

Remove the private `order` property before freezing the public item: retain generation order by array position, not by JSON field. Add explicit errors for an empty title, category, summary, content or keyword array.

- [ ] **Step 5: Add stable service and staff fragments**

In `src/content/service-pages.js`, render one neutral target for each service before the dual responsive views:

```js
const serviceAnchors = SERVICES
  .map((service) => `<span class="search-anchor" id="service-${service.slug}" aria-hidden="true"></span>`)
  .join('');
```

Place `${serviceAnchors}` immediately inside the services page container. In `src/content/specialists-page.js`, add `id="specialist-${index + 1}"` to each coverflow slide. These ids are public fragment targets and must stay stable.

- [ ] **Step 6: Wire index generation into the existing generator**

In `scripts/generate-pages.mjs`, import `SERVICES`, `STAFF`, `buildSearchIndex` and `serializeSearchIndex`, build once after HTML generation, and add this write to the existing `Promise.all`:

```js
writeFile(
  resolve(publicDirectory, 'search-index.json'),
  serializeSearchIndex(buildSearchIndex({ pages: PAGES, services: SERVICES, staff: STAFF })),
  'utf8',
),
```

- [ ] **Step 7: Run focused and generation tests**

Run: `pnpm test tests/scripts/search-index.test.js && pnpm generate`

Expected: PASS; `public/search-index.json` contains version `1` and exactly `PAGES.length + 8` items; running `pnpm generate` twice leaves the file byte-identical.

- [ ] **Step 8: Commit the index slice**

```bash
git add src/data/search-keywords.js scripts/generate-search-index.mjs scripts/generate-pages.mjs src/content/service-pages.js src/content/specialists-page.js tests/scripts/search-index.test.js public/search-index.json services.html specialists.html
git commit -m "feat: generate local clinic search index"
```

---

### Task 2: Pure Russian Search and Ranking Engine

**Files:**
- Create: `src/js/core/search-engine.js`
- Create: `tests/js/search-engine.test.js`

**Interfaces:**
- Consumes: `SearchItem[]` from `search-index.json` and the raw query string.
- Produces: `normalizeSearchText(value): string`, `tokenizeSearchQuery(query): string[]`, and `searchItems(items, query, { limit = 8 } = {}): SearchMatch[]`.
- `SearchMatch` is `{ item, score, snippet, matchedTerms }`; `matchedTerms` contains normalized strings and is never HTML.

- [ ] **Step 1: Write failing normalization and ranking tests**

Create `tests/js/search-engine.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { normalizeSearchText, searchItems, tokenizeSearchQuery } from '../../src/js/core/search-engine.js';

const items = [
  { id: 'therapy', href: 'services.html#service-therapy', category: 'Услуги', title: 'Терапевтическая стоматология', summary: 'Лечение кариеса', content: 'Консультация стоматолога-терапевта', keywords: ['болит зуб', 'лечение зубов'] },
  { id: 'prices', href: 'prices.html', category: 'Цены', title: 'Стоимость услуг', summary: 'Статус прейскуранта', content: 'Стоимость уточняется у администратора', keywords: ['цена', 'сколько стоит'] },
  { id: 'license', href: 'license.html', category: 'Документы', title: 'Лицензия и документы', summary: 'Выписка из реестра лицензий', content: 'ОГРН и реквизиты', keywords: ['лицензия', 'ОГРН'] },
];

describe('Russian local search engine', () => {
  it('normalizes ё, case, punctuation and repeated whitespace', () => {
    expect(normalizeSearchText('  ПРИЁМ,  врача! ')).toBe('прием врача');
    expect(tokenizeSearchQuery('ЗУБ, зуб; болит')).toEqual(['зуб', 'болит']);
  });

  it.each([
    ['болит зуб', 'therapy'],
    ['сколько стоит', 'prices'],
    ['огрн', 'license'],
  ])('ranks the intended result first for %s', (query, expectedId) => {
    expect(searchItems(items, query)[0].item.id).toBe(expectedId);
  });

  it('prefers exact titles over keyword-only matches', () => {
    const ranked = searchItems([
      ...items,
      { id: 'exact', href: 'exact.html', category: 'Документы', title: 'Лицензия', summary: 'Документ', content: 'Документ', keywords: ['документ'] },
    ], 'лицензия');
    expect(ranked[0].item.id).toBe('exact');
  });

  it('allows one typo in a long title or keyword but not in body-only text', () => {
    expect(searchItems(items, 'лицензияя')[0].item.id).toBe('license');
    expect(searchItems(items, 'кариез').some((match) => match.item.id === 'therapy')).toBe(false);
  });

  it('returns nothing for fewer than two normalized characters and obeys the limit', () => {
    expect(searchItems(items, 'з')).toEqual([]);
    expect(searchItems(items, 'и', { limit: 1 })).toEqual([]);
    expect(searchItems(items, 'ст', { limit: 1 })).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the engine test and capture RED**

Run: `pnpm test tests/js/search-engine.test.js`

Expected: FAIL because `src/js/core/search-engine.js` does not exist.

- [ ] **Step 3: Implement normalization and scoring**

Create `src/js/core/search-engine.js` with these exact ranking bands:

```js
const SCORE = Object.freeze({
  exactTitle: 1000,
  titlePhrase: 700,
  titleToken: 180,
  keywordPhrase: 500,
  keywordToken: 140,
  summaryPhrase: 320,
  summaryToken: 90,
  contentPhrase: 160,
  contentToken: 40,
  fuzzyTitleOrKeyword: 24,
});

export const normalizeSearchText = (value) => String(value ?? '')
  .normalize('NFKC')
  .toLocaleLowerCase('ru-RU')
  .replaceAll('ё', 'е')
  .replace(/[^a-zа-я0-9]+/giu, ' ')
  .trim()
  .replace(/\s+/g, ' ');

export const tokenizeSearchQuery = (query) => [...new Set(normalizeSearchText(query).split(' ').filter(Boolean))];
```

Add an early-exit edit-distance function that returns whether two tokens differ by at most one insertion, deletion, replacement or adjacent transposition. Score each field separately, require every query token to match at least one field, and use fuzzy comparison only against normalized title and keyword tokens when the query token length is at least four. Sort by score descending, matched token count descending, title length ascending, then input array order. Build `snippet` from summary first, otherwise a 150-character window from content around the first literal match.

- [ ] **Step 4: Run focused tests and guard script size**

Run: `pnpm test tests/js/search-engine.test.js`

Expected: PASS. Then run `git diff --check` and confirm `src/js/core/search-engine.js` has no DOM, storage, network or location access.

- [ ] **Step 5: Commit the engine slice**

```bash
git add src/js/core/search-engine.js tests/js/search-engine.test.js
git commit -m "feat: rank Russian clinic search results"
```

---

### Task 3: Semantic Search Trigger and Dialog Markup

**Files:**
- Create: `src/templates/site-search.js`
- Create: `tests/templates/site-search.test.js`
- Modify: `src/templates/site-chrome.js`
- Modify: `src/templates/render-page.js`
- Modify: `src/templates/icons.js`
- Modify: `tests/templates/site-chrome.test.js`
- Modify: `tests/templates/icons.test.js`
- Modify: `tests/project/handoff.test.js`
- Generate: all 21 root HTML files

**Interfaces:**
- Consumes: `renderIcon('search' | 'close' | 'clear')` and the existing header renderer.
- Produces: `renderSearchTrigger(): string` and `renderSiteSearch(): string` with stable ids and `data-search-*` hooks used by Task 4.

- [ ] **Step 1: Write failing semantic markup tests**

Create `tests/templates/site-search.test.js`:

```js
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { renderSearchTrigger, renderSiteSearch } from '../../src/templates/site-search.js';

describe('site search markup', () => {
  it('renders one labelled responsive trigger with a real SVG icon', () => {
    const document = new JSDOM(`<body>${renderSearchTrigger()}</body>`).window.document;
    const trigger = document.querySelector('button[data-search-open]');
    expect(trigger.getAttribute('aria-controls')).toBe('site-search-dialog');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.textContent).toContain('Поиск по сайту');
    expect(trigger.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });

  it('renders a hidden modal combobox without a form or submit control', () => {
    const document = new JSDOM(`<body>${renderSiteSearch()}</body>`).window.document;
    const dialog = document.querySelector('#site-search-dialog[role="dialog"][aria-modal="true"][hidden]');
    const input = dialog.querySelector('[data-search-input][role="combobox"]');
    expect(input.getAttribute('aria-controls')).toBe('site-search-results');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(dialog.querySelector('#site-search-results[role="listbox"]')).not.toBeNull();
    expect(dialog.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(dialog.querySelector('form')).toBeNull();
    expect(dialog.querySelector('[type="submit"]')).toBeNull();
  });
});
```

Extend `tests/templates/site-chrome.test.js` to assert that `.site-search-trigger` occurs after `.brand` and before `.brand-row__actions`, and extend `tests/project/handoff.test.js` so the only permitted input is `[data-search-input]` with no `name`, no `form`, no submit button and no remote action.

- [ ] **Step 2: Run markup tests and capture RED**

Run: `pnpm test tests/templates/site-search.test.js tests/templates/site-chrome.test.js tests/templates/icons.test.js tests/project/handoff.test.js`

Expected: FAIL because the search template, icons and header control do not exist.

- [ ] **Step 3: Add the SVG icon vocabulary**

Add these entries to `ICONS` in `src/templates/icons.js`:

```js
search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
close: '<path d="M5 5l14 14M19 5 5 19"/>',
clear: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
```

- [ ] **Step 4: Create the search template**

Create `src/templates/site-search.js` with no dynamic user content:

```js
import { renderIcon } from './icons.js';

export function renderSearchTrigger() {
  return `<button class="site-search-trigger" type="button" data-search-open aria-controls="site-search-dialog" aria-haspopup="dialog">${renderIcon('search', 'site-search-trigger__icon')}<span class="site-search-trigger__label">Поиск по сайту</span><kbd>Ctrl K</kbd></button><a class="site-search-fallback" href="patients.html">Карта сайта</a>`;
}

export function renderSiteSearch() {
  return `<div id="site-search-dialog" class="site-search" role="dialog" aria-modal="true" aria-labelledby="site-search-title" hidden>
    <div class="site-search__backdrop" data-search-backdrop aria-hidden="true"></div>
    <section class="site-search__panel">
      <header class="site-search__header"><div><p class="eyebrow">Поиск по сайту</p><h2 id="site-search-title">Что вы хотите найти?</h2></div><button class="site-search__close" type="button" data-search-close aria-label="Закрыть поиск">${renderIcon('close')}</button></header>
      <div class="site-search__field">${renderIcon('search')}<input type="search" data-search-input role="combobox" aria-autocomplete="list" aria-controls="site-search-results" aria-expanded="false" autocomplete="off" spellcheck="false" placeholder="Услуга, врач, документ или вопрос"><button type="button" data-search-clear aria-label="Очистить поиск" hidden>${renderIcon('clear')}</button></div>
      <p class="site-search__status" data-search-status aria-live="polite">Введите не менее двух символов</p>
      <div class="site-search__content" data-search-content></div>
      <ul class="site-search__results" id="site-search-results" role="listbox"></ul>
      <p class="site-search__hint"><kbd>↑</kbd><kbd>↓</kbd> выбор <kbd>Enter</kbd> открыть <kbd>Esc</kbd> закрыть</p>
    </section>
  </div>`;
}
```

The fallback link is visible only in `.no-js`; the button is visible only in `.js`. Do not give the input a `name` and do not wrap it in a form.

- [ ] **Step 5: Place the trigger and dialog in every page**

Import `renderSearchTrigger` into `src/templates/site-chrome.js` and place its output between the brand link and `.brand-row__actions`. Import `renderSiteSearch` into `src/templates/render-page.js` and place its output after `renderHeader(page.file)` and before `<main>`. This yields one trigger and one dialog per page.

- [ ] **Step 6: Regenerate and run focused tests**

Run: `pnpm generate && pnpm test tests/templates/site-search.test.js tests/templates/site-chrome.test.js tests/templates/icons.test.js tests/project/handoff.test.js`

Expected: PASS; each generated page has exactly one search input, no form and no submit button.

- [ ] **Step 7: Commit the semantic markup slice**

```bash
git add src/templates/site-search.js src/templates/site-chrome.js src/templates/render-page.js src/templates/icons.js tests/templates/site-search.test.js tests/templates/site-chrome.test.js tests/templates/icons.test.js tests/project/handoff.test.js *.html
git commit -m "feat: add accessible site search shell"
```

---

### Task 4: Dialog Interaction, Safe Results and Deep Links

**Files:**
- Create: `src/js/components/site-search.js`
- Create: `tests/js/site-search.test.js`
- Modify: `src/js/main.js`
- Modify: `src/js/components/tabs.js`
- Modify: `src/js/components/disclosures.js`
- Modify: `src/js/components/specialists-coverflow.js`
- Modify: `tests/js/interactions.test.js`
- Modify: `tests/js/specialists-coverflow.test.js`

**Interfaces:**
- Consumes: `searchItems`, `createFocusTrap`, `lockScroll`, `unlockScroll`, `search-index.json` and all `data-search-*` hooks.
- Produces: `initSiteSearch({ fetchImpl = globalThis.fetch, navigate = (href) => window.location.assign(href) } = {}): void`.
- The component fetches once on first open, holds the index only in memory and never writes the query outside memory.

- [ ] **Step 1: Write failing component tests**

Create `tests/js/site-search.test.js` with a production-shaped DOM and injected fetch:

```js
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initSiteSearch } from '../../src/js/components/site-search.js';
import { unlockScroll } from '../../src/js/core/scroll-lock.js';

const item = { id: 'license', href: 'license.html', category: 'Документы', title: 'Лицензия и документы', summary: 'Выписка из реестра', content: 'ОГРН', keywords: ['лицензия'] };
const markup = `<button data-search-open aria-controls="site-search-dialog">Поиск</button><div id="site-search-dialog" role="dialog" hidden><div data-search-backdrop></div><section><button data-search-close>Закрыть</button><input data-search-input role="combobox" aria-controls="site-search-results" aria-expanded="false"><button data-search-clear hidden>Очистить</button><p data-search-status></p><div data-search-content></div><ul id="site-search-results" role="listbox"></ul></section></div>`;

afterEach(() => unlockScroll());

describe('site search dialog', () => {
  it('loads once, searches, supports arrows and returns focus after Escape', async () => {
    document.body.innerHTML = markup;
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ version: 1, items: [item] }) }));
    const navigate = vi.fn();
    initSiteSearch({ fetchImpl, navigate });
    const opener = document.querySelector('[data-search-open]');
    opener.click();
    await Promise.resolve();
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
    await Promise.resolve();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('renders malicious query text as text and never as executable markup', async () => {
    document.body.innerHTML = markup;
    initSiteSearch({ fetchImpl: async () => ({ ok: true, json: async () => ({ version: 1, items: [{ ...item, title: '<img src=x onerror=alert(1)> Лицензия' }] }) }) });
    document.querySelector('[data-search-open]').click();
    await Promise.resolve();
    const input = document.querySelector('[data-search-input]');
    input.value = '<img src=x onerror=alert(1)> лицензия';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.querySelector('.site-search__results img')).toBeNull();
    expect(document.querySelector('.site-search__results').textContent).toContain('<img');
  });

  it('shows common links for empty input and a usable error state for a failed index', async () => {
    document.body.innerHTML = markup;
    initSiteSearch({ fetchImpl: async () => ({ ok: false }) });
    document.querySelector('[data-search-open]').click();
    await Promise.resolve();
    expect(document.querySelector('[data-search-content]').textContent).toContain('Карта сайта');
    expect(document.querySelector('[data-search-status]').textContent).toContain('не удалось загрузить');
  });
});
```

Append these concrete interaction cases to the same file:

```js
it.each([
  [{ ctrlKey: true, key: 'k' }, 'Control+K'],
  [{ metaKey: true, key: 'k' }, 'Meta+K'],
])('opens from the %s shortcut', (keys) => {
  document.body.innerHTML = markup;
  initSiteSearch({ fetchImpl: async () => ({ ok: true, json: async () => ({ version: 1, items: [] }) }) });
  document.dispatchEvent(new KeyboardEvent('keydown', { ...keys, bubbles: true, cancelable: true }));
  expect(document.querySelector('#site-search-dialog').hidden).toBe(false);
  expect(document.activeElement).toBe(document.querySelector('[data-search-input]'));
});

it('clears the query and closes from the real backdrop', async () => {
  document.body.innerHTML = markup;
  initSiteSearch({ fetchImpl: async () => ({ ok: true, json: async () => ({ version: 1, items: [item] }) }) });
  const opener = document.querySelector('[data-search-open]');
  opener.click();
  await Promise.resolve();
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
  const many = Array.from({ length: 10 }, (_, index) => ({ ...item, id: `license-${index}`, href: `license-${index}.html` }));
  initSiteSearch({ fetchImpl: async () => ({ ok: true, json: async () => ({ version: 1, items: many }) }) });
  document.querySelector('[data-search-open]').click();
  await Promise.resolve();
  const input = document.querySelector('[data-search-input]');
  input.value = 'лицензия';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  expect(document.querySelectorAll('[role="option"]')).toHaveLength(8);
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  expect(input.getAttribute('aria-activedescendant')).toBe(document.querySelector('[role="option"]').id);
  const close = document.querySelector('[data-search-close]');
  close.focus();
  close.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  expect(document.activeElement).toBe(input);
});

it('does not hijack shortcuts behind an open menu or another dialog', () => {
  document.body.innerHTML = `${markup}<div id="appointment-dialog" role="dialog"></div>`;
  initSiteSearch({ fetchImpl: vi.fn() });
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  expect(document.querySelector('#site-search-dialog').hidden).toBe(true);
  document.querySelector('#appointment-dialog').hidden = true;
  document.body.classList.add('menu-open');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  expect(document.querySelector('#site-search-dialog').hidden).toBe(true);
  document.body.classList.remove('menu-open');
});

it.each([
  ['', 'Введите не менее двух символов'],
  ['з', 'Добавьте ещё один символ'],
  ['неизвестныйзапрос', 'Ничего не найдено'],
])('announces the query state for %j', async (query, expected) => {
  document.body.innerHTML = markup;
  initSiteSearch({ fetchImpl: async () => ({ ok: true, json: async () => ({ version: 1, items: [item] }) }) });
  document.querySelector('[data-search-open]').click();
  await Promise.resolve();
  const input = document.querySelector('[data-search-input]');
  input.value = query;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  expect(document.querySelector('[data-search-status]').textContent).toContain(expected);
});
```

- [ ] **Step 2: Run component tests and capture RED**

Run: `pnpm test tests/js/site-search.test.js`

Expected: FAIL because `src/js/components/site-search.js` does not exist.

- [ ] **Step 3: Implement memory-only loading and dialog lifecycle**

Create `src/js/components/site-search.js` with module-local `indexPromise`, an injected `fetchImpl`, and these lifecycle rules:

```js
const INDEX_URL = 'search-index.json';
const QUICK_LINKS = Object.freeze([
  ['Услуги', 'services.html'],
  ['Цены', 'prices.html'],
  ['Специалисты', 'specialists.html'],
  ['Лицензия', 'license.html'],
  ['Контакты', 'contacts.html'],
  ['Пациентам', 'patients.html'],
]);

const loadIndex = async (fetchImpl) => {
  const response = await fetchImpl(INDEX_URL, { credentials: 'same-origin' });
  if (!response.ok) throw new Error('Search index request failed');
  const payload = await response.json();
  if (payload.version !== 1 || !Array.isArray(payload.items)) throw new Error('Search index schema is invalid');
  return payload.items;
};
```

On open: store the visible opener, unhide the dialog, lock scroll, attach the focus trap, focus the input and lazily resolve the cached index. On close: hide dialog, clear active option state, unlock scroll and return focus to the visible opener. Backdrop, close button and Escape close it. `Ctrl+K`/`Meta+K` opens it only when no other modal is visible and `body` does not have `menu-open`.

- [ ] **Step 4: Render results with safe DOM APIs**

Create every result using `document.createElement`, assign link `href` from the validated index, assign plain fields through `textContent`, and create `<mark>` nodes by slicing strings around normalized literal ranges. Never assign query or item fields to `innerHTML`. Keep focus on the combobox; set `aria-activedescendant` to the selected option id for ArrowDown/ArrowUp/Home/End, navigate on Enter, and allow normal mouse/touch anchor activation. Show at most eight results.

Use these status strings exactly:

- Empty: `Введите не менее двух символов`
- One character: `Добавьте ещё один символ`
- Results: `Найдено: N`
- No results: `Ничего не найдено. Попробуйте изменить запрос.`
- Error: `Поиск не удалось загрузить. Откройте карту сайта.`

- [ ] **Step 5: Initialize search and implement fragment activation**

Import and call `initSiteSearch()` in `src/js/main.js` after mobile-menu initialization. In `tabs.js` and `disclosures.js`, read only hashes matching `^#service-([a-z0-9-]+)$`: select the matching desktop tab and expand the matching mobile disclosure without collapsing content in no-JS mode. In `specialists-coverflow.js`, read only `^#specialist-(\d+)$` and activate that zero-based slide through the component's existing selection function.

- [ ] **Step 6: Run focused interaction tests**

Run: `pnpm test tests/js/site-search.test.js tests/js/interactions.test.js tests/js/specialists-coverflow.test.js`

Expected: PASS; no test leaves `body.is-locked`, and search links activate the correct service or staff item after navigation.

- [ ] **Step 7: Commit the interaction slice**

```bash
git add src/js/core/search-engine.js src/js/components/site-search.js src/js/main.js src/js/components/tabs.js src/js/components/disclosures.js src/js/components/specialists-coverflow.js tests/js/site-search.test.js tests/js/interactions.test.js tests/js/specialists-coverflow.test.js
git commit -m "feat: make local site search interactive"
```

---

### Task 5: Responsive Header Placement and Search Visual System

**Files:**
- Create: `src/styles/site-search.css`
- Create: `tests/styles/site-search.test.js`
- Modify: `src/styles/main.css`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/layout.css`
- Modify: `tests/styles/design-system.test.js`

**Interfaces:**
- Consumes: `.site-search-trigger`, `.site-search`, `.site-search__panel`, `.site-search__results`, `.site-search__result`, `[aria-selected]`, `[hidden]`, `.vision-mode` and `body.is-locked`.
- Produces: one desktop center trigger from 75rem, an icon trigger beside the burger below 75rem, fullscreen search below 48rem and a centered dialog from 48rem upward.

- [ ] **Step 1: Write failing CSS contract tests**

Create `tests/styles/site-search.test.js`:

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../../src/styles/site-search.css', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../../src/styles/layout.css', import.meta.url), 'utf8');
const tokens = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');

describe('responsive site search styles', () => {
  it('uses a fullscreen mobile surface and a central tablet/desktop panel', () => {
    expect(css).toMatch(/\.site-search__panel[\s\S]*100dvh/);
    expect(css).toMatch(/@media \(min-width: 48rem\)/);
    expect(css).toMatch(/max-inline-size: var\(--search-panel-max-inline-size\)/);
  });

  it('centers the labelled trigger on desktop and keeps a compact icon beside the burger below desktop', () => {
    expect(layout).toMatch(/grid-template-columns:[^;]*minmax/);
    expect(css).toMatch(/@media \(min-width: 75rem\)[\s\S]*site-search-trigger__label/);
    expect(css).toMatch(/@media \(max-width: 74\.999rem\)[\s\S]*site-search-trigger kbd/);
  });

  it('honors reduced motion and vision mode without raw primitive consumption', () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce/);
    expect(css).toMatch(/\.vision-mode \.site-search__panel/);
    expect(css).not.toMatch(/var\(--primitive-/);
    expect(tokens).toContain('--z-search:');
  });
});
```

- [ ] **Step 2: Run style tests and capture RED**

Run: `pnpm test tests/styles/site-search.test.js tests/styles/design-system.test.js`

Expected: FAIL because `src/styles/site-search.css` and search semantic tokens do not exist.

- [ ] **Step 3: Add semantic search tokens**

In `src/styles/tokens.css`, add primitive values alongside related size/layer primitives and expose semantic aliases:

```css
--search-panel-max-inline-size: 46rem;
--search-results-max-block-size: min(31rem, 52dvh);
--search-trigger-max-inline-size: 28rem;
--search-backdrop-color: rgb(8 30 58 / 52%);
--search-panel-shadow: 0 1.5rem 5rem rgb(19 53 91 / 20%);
--z-search: 320;
```

Follow the existing three-tier token structure: actual literal values live in the primitive block, and component CSS consumes only semantic aliases.

- [ ] **Step 4: Rebuild the brand row grid**

In `src/styles/layout.css`, keep mobile order as brand, search icon, burger. At `min-width: 75rem`, use `grid-template-columns: auto minmax(16rem, 1fr) auto`, center the search trigger in its track with `justify-self: center`, show phone/appointment actions and hide the burger. Keep the header shell's existing maximum width and all controls at least 44px.

- [ ] **Step 5: Style the search component**

Create `src/styles/site-search.css` and import it after `components.css` in `src/styles/main.css`. Implement:

- fixed overlay at `z-index: var(--z-search)`;
- an opacity-fading backdrop;
- edge-to-edge `100dvh` panel below 48rem with safe-area padding;
- centered rounded panel from 48rem with max width `var(--search-panel-max-inline-size)`;
- prominent bordered input, clear/close icon buttons, category labels, highlighted terms and a selected-result state;
- scroll only inside the results area;
- no horizontal overflow at 320px and 120% vision scaling;
- `transition: none` and `animation: none` under `prefers-reduced-motion: reduce`;
- `.no-js .site-search-trigger { display: none; }`, `.js .site-search-fallback { display: none; }`;
- below 75rem hide the trigger label and shortcut badge while retaining an accessible name in the DOM;
- from 75rem show label and `<kbd>`, make the trigger a compact pill, and limit its width.

- [ ] **Step 6: Run focused styles and full generated render tests**

Run: `pnpm test tests/styles/site-search.test.js tests/styles/design-system.test.js tests/templates/site-search.test.js tests/templates/site-chrome.test.js`

Expected: PASS. Then run `pnpm generate` and `git diff --check`.

- [ ] **Step 7: Commit the responsive visual slice**

```bash
git add src/styles/site-search.css src/styles/main.css src/styles/tokens.css src/styles/layout.css tests/styles/site-search.test.js tests/styles/design-system.test.js *.html
git commit -m "style: polish responsive clinic search"
```

---

### Task 6: Production Verifier and Privacy Guards

**Files:**
- Modify: `scripts/verify-site.mjs`
- Modify: `tests/scripts/site-verifier.test.js`
- Modify: `tests/project/handoff.test.js`

**Interfaces:**
- Consumes: built `dist/search-index.json` and the verifier's existing `documents` map.
- Produces: verifier error codes `search-index.missing`, `search-index.parse`, `search-index.schema`, `search-index.duplicate`, `search-index.href` and `search-index.fragment`.

- [ ] **Step 1: Write failing verifier cases**

Extend `tests/scripts/site-verifier.test.js` with isolated fixtures that assert:

```js
expect(codesForSiteWithoutSearchIndex).toContain('search-index.missing');
expect(codesForInvalidJson).toContain('search-index.parse');
expect(codesForDuplicateIds).toContain('search-index.duplicate');
expect(codesForExternalHref).toContain('search-index.href');
expect(codesForMissingFragment).toContain('search-index.fragment');
```

Build every fixture from a valid minimal version-1 payload first, then mutate exactly one property so each assertion demonstrates one failure reason.

- [ ] **Step 2: Run verifier tests and capture RED**

Run: `pnpm test tests/scripts/site-verifier.test.js`

Expected: FAIL because the verifier does not inspect `search-index.json`.

- [ ] **Step 3: Validate the production index**

In `verifyDirectory`, require `search-index.json`, parse it once, validate `version === 1`, validate the exact item fields, reject empty values and duplicate ids, and pass every `href` through the existing local reference resolver with fragment validation. Reject passive schemes (`tel:`, `mailto:`, `data:`) for search results even though they remain valid elsewhere. Check that every manifest page has one page-level item and cap the JSON file at 250 KiB.

- [ ] **Step 4: Keep privacy assertions explicit**

In `tests/project/handoff.test.js`, assert that search code contains no `localStorage`, `sessionStorage`, `document.cookie`, `URLSearchParams`, remote URL literal, `sendBeacon`, `XMLHttpRequest`, analytics identifier or form submission. Permit only `fetch('search-index.json', { credentials: 'same-origin' })`.

- [ ] **Step 5: Run focused verifier and full build**

Run: `pnpm test tests/scripts/search-index.test.js tests/scripts/site-verifier.test.js tests/project/handoff.test.js && pnpm build && pnpm verify:site`

Expected: PASS; verifier reports all 21 HTML files and the search index as valid, with every fragment found.

- [ ] **Step 6: Commit the production guard slice**

```bash
git add scripts/verify-site.mjs tests/scripts/site-verifier.test.js tests/project/handoff.test.js
git commit -m "test: verify production search index"
```

---

### Task 7: Documentation, Full Verification and Browser QA

**Files:**
- Modify: `README.md`
- Regenerate: all 21 root HTML files
- Regenerate: `public/search-index.json`

**Interfaces:**
- Consumes: the complete generated site and production build.
- Produces: a documented, verified search release with recorded responsive evidence.

- [ ] **Step 1: Document how search works**

Add a `## Поиск по сайту` section to `README.md` containing these operational facts:

```markdown
## Поиск по сайту

`pnpm generate` создаёт `public/search-index.json` из опубликованных страниц и подтверждённых структурированных данных. Поиск выполняется полностью в браузере: запросы не отправляются на сервер, не сохраняются в URL, cookies или web storage и не передаются аналитике.

Ключевые слова и синонимы редактируются в `src/data/search-keywords.js`. Неподтверждённые медицинские направления добавлять в индекс нельзя. После изменения страниц, услуг, сотрудников или ключевых слов выполните `pnpm verify`.
```

- [ ] **Step 2: Run the fresh automated release gate**

Run: `pnpm verify`

Expected: all Vitest files pass, Vite builds 21 HTML pages and `verify:site` exits 0 with no warnings or errors.

- [ ] **Step 3: Run artifact and privacy scans**

Run:

```powershell
rg -n "https?://|sendBeacon|XMLHttpRequest|localStorage|sessionStorage|document\.cookie|URLSearchParams|<form|type=\"submit\"" dist src/js/components/site-search.js public/search-index.json
```

Expected: no search-related remote endpoint, storage, form or submit match. Existing schema.org and official document links may appear in unrelated generated HTML and must be reviewed rather than removed.

- [ ] **Step 4: Test the responsive Browser matrix**

Serve the production build with `pnpm preview --host 127.0.0.1 --port 4173`. In the in-app Browser, verify `index.html`, `services.html`, `specialists.html`, `license.html` and `contacts.html` at 320, 390, 768, 1024, 1280 and 1440 CSS pixels:

- no document-level horizontal overflow or clipped control;
- desktop trigger occupies the visual center without crowding brand, phone or appointment controls;
- mobile icon remains beside the burger and both controls are separate 44px targets;
- below 48rem the dialog fills the viewport and respects safe areas;
- from 48rem it is a centered panel with internal result scrolling;
- query matrix `врач`, `сколько стоит`, `болит зуб`, `лицензия`, `ОГРН`, `график`, `жалоба`, `ОМС`, `куки` returns the intended first result;
- keyboard `Ctrl/Cmd+K`, ArrowUp/Down, Home/End, Enter, Escape and Tab trapping work;
- backdrop and close button restore focus to the opener;
- service and staff results activate the intended responsive view after navigation;
- vision mode at 120% has no overlap or overflow;
- console has zero errors and network requests remain same-origin assets plus `search-index.json`.

- [ ] **Step 5: Confirm no-JS and reduced-motion behavior**

Fetch a raw generated page and confirm `class="no-js"` shows the existing navigation/map while the search trigger is hidden. Inspect the loaded CSSOM for the reduced-motion rule and confirm search overlay animation and transitions become instantaneous when `prefers-reduced-motion: reduce` is active.

- [ ] **Step 6: Run the final clean gate and commit**

Run:

```bash
pnpm verify
git diff --check
git status --short
```

Expected: verification passes; diff check is clean; status shows only README, regenerated artifacts and any final test evidence intended for this task.

```bash
git add README.md public/search-index.json *.html
git commit -m "docs: document local clinic search"
```

---

## Self-Review Record

- **Spec coverage:** Every approved section is mapped: responsive option C in Tasks 3 and 5; local deterministic data in Task 1; keywords and unsupported-service boundary in Task 1; Russian normalization, ranking and typo tolerance in Task 2; dialog, keyboard, focus, loading states and safe highlighting in Task 4; no-JS, vision and reduced motion in Tasks 3 and 5; verifier/privacy in Task 6; full viewport/query QA in Task 7.
- **Placeholder scan:** The plan contains no deferred implementation markers. Every task names exact files, public interfaces, failing tests, implementation rules, commands and expected results.
- **Type consistency:** `buildSearchIndex` produces the exact item shape consumed by `searchItems`; `searchItems` produces matches rendered by `initSiteSearch`; template ids and `data-search-*` hooks match component selectors; service and staff fragments match generator hrefs and verifier targets.
- **Boundary check:** No task adds an external service, runtime dependency, unsupported medical direction, metadata-keywords tag, personal-data collection or false legal claim.
