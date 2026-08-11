# About Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a rich, patient-oriented `about.html` that presents verified clinic facts, licensed care, the published team, official documents and appointment paths in a premium editorial layout.

**Architecture:** Move the about-page definition out of the inline core manifest into a focused `ABOUT_PAGE` content module. Render every fact from existing data modules through small pure HTML helpers, add page-scoped token-driven CSS, and keep the generic shared hero/header/footer and existing interactions unchanged.

**Tech Stack:** Static ESM renderer, semantic HTML, vanilla CSS custom properties, JSDOM, Vitest, Vite, in-app Browser QA.

## Global Constraints

- Use only `CLINIC`, `CONTACTS`, `HOURS`, `LICENSE`, `SERVICES` and `STAFF` as factual sources.
- Do not infer clinical operating history from `CLINIC.registeredSince`.
- Do not invent patient counts, awards, ratings, equipment, amenities, staff credentials, experience or prices.
- Preserve one H1, indexability, breadcrumbs, header/footer, mobile appointment action, dialog, cookies and vision mode.
- Do not add a form or personal-data field before approved MIS integration.
- Reuse existing AVIF/WebP and approved document assets; no remote media, fonts, trackers or analytics.
- Consume the existing semantic/component token layer only; no raw colors, font sizes, radii, shadows, durations or breakpoints.
- Keep generated `about.html` reproducible from source; never edit it directly.
- Base layout is mobile first; desktop composition starts at the existing `75rem` breakpoint.

---

### Task 1: Build the verified about-page content module

**Files:**
- Create: `src/content/about-page.js`
- Modify: `src/content/core-pages.js`
- Create: `tests/content/about-page.test.js`
- Regenerate: `about.html`

**Interfaces:**
- Consumes: `CLINIC`, `CONTACTS`, `HOURS`, `LICENSE`, `SERVICES`, `STAFF`, `renderIcon(name, className?)`.
- Produces: frozen `ABOUT_PAGE` with `file`, `title`, `description`, `heading`, `lead`, `heroImage`, `noindex` and `body`.
- Produces selectors consumed by Task 2: `.about-mission`, `.about-values`, `.about-facts`, `.about-space`, `.about-gallery`, `.about-services`, `.about-team`, `.about-license`, `.about-legal`, `.about-cta`.

- [ ] **Step 1: Write the failing content test**

Create `tests/content/about-page.test.js`:

```js
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { CLINIC, CONTACTS, LICENSE } from '../../src/data/clinic.js';
import { SERVICES } from '../../src/data/services.js';
import { STAFF } from '../../src/data/staff.js';
import { ABOUT_PAGE } from '../../src/content/about-page.js';
import { renderPage } from '../../src/templates/render-page.js';

describe('patient-oriented about page', () => {
  const render = () => new JSDOM(renderPage(ABOUT_PAGE)).window.document;

  it('renders the approved editorial section sequence and one heading', () => {
    const document = render();
    expect([...document.querySelectorAll('main > section')].map((node) => node.className)).toEqual([
      'page-hero page-hero--about',
      'about-section about-mission',
      'about-facts',
      'about-section about-space',
      'about-section about-services',
      'about-section about-team',
      'about-section about-license',
      'about-section about-legal',
      'about-section about-cta',
    ]);
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    expect(document.querySelector('h1')?.textContent).toBe('О клинике');
  });

  it('derives the four trust facts from confirmed data', () => {
    const document = render();
    const facts = [...document.querySelectorAll('.about-fact')].map((node) => node.textContent);
    expect(facts).toHaveLength(4);
    expect(facts[0]).toContain(CLINIC.registeredSince.match(/\d{4}/)?.[0]);
    expect(facts[1]).toContain(String(SERVICES.length));
    expect(facts[2]).toContain(String(STAFF.length));
    expect(facts[3]).toContain(LICENSE.status);
  });

  it('renders every licensed service and published staff member', () => {
    const document = render();
    expect([...document.querySelectorAll('.about-service h3')].map((node) => node.textContent)).toEqual(
      SERVICES.map((service) => service.title),
    );
    expect([...document.querySelectorAll('.about-team__person h3')].map((node) => node.textContent)).toEqual(
      STAFF.map((person) => person.name),
    );
    expect([...document.querySelectorAll('.about-team__role')].map((node) => node.textContent)).toEqual(
      STAFF.map((person) => person.role),
    );
    expect(document.querySelector('.about-team img')).toBeNull();
  });

  it('uses three local visualizations with one honest caption', () => {
    const document = render();
    expect([...document.querySelectorAll('.about-gallery img')].map((node) => node.getAttribute('src'))).toEqual([
      'assets/images/hero-services.webp',
      'assets/images/hero-home.webp',
      'assets/images/hero-contacts.webp',
    ]);
    expect(document.querySelectorAll('.about-gallery figcaption')).toHaveLength(1);
    expect(document.querySelector('.about-gallery figcaption')?.textContent).toBe('Визуализация интерьера');
  });

  it('links the approved license and registration documents', () => {
    const document = render();
    expect(document.querySelector('.about-license__preview')?.getAttribute('href')).toBe(
      'documents/license-registry-extract.pdf',
    );
    expect(document.querySelector('.about-license__preview img')?.getAttribute('src')).toBe(
      'assets/documents/license-registry-extract.webp',
    );
    expect(document.querySelector('.about-license__secondary')?.getAttribute('href')).toBe(
      'documents/ogrn-certificate.pdf',
    );
    expect(document.querySelector('.about-license')?.textContent).toContain(LICENSE.number);
  });

  it('keeps legal and appointment facts exact without collecting personal data', () => {
    const document = render();
    for (const value of [CLINIC.legalName, CLINIC.ogrn, CLINIC.inn, CLINIC.registryAddress, CLINIC.activityAddress]) {
      expect(document.querySelector('.about-legal')?.textContent).toContain(value);
    }
    expect(document.querySelector('.about-cta [data-appointment-open]')?.getAttribute('href')).toBe(CONTACTS.phones[0].href);
    expect(document.querySelectorAll('.about-cta a[href^="tel:"]')).toHaveLength(CONTACTS.phones.length + 1);
    expect(document.querySelector('.about-cta form, .about-cta input, .about-cta textarea')).toBeNull();
  });

  it('does not publish unsupported claims', () => {
    const text = render().body.textContent;
    expect(text).not.toMatch(/5\s?000|15\+|довольн\w* пациент|лет работы|современн\w* оборудован/i);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
pnpm test tests/content/about-page.test.js
```

Expected: FAIL because `src/content/about-page.js` does not exist.

- [ ] **Step 3: Create the page module**

Create `src/content/about-page.js` with these helpers and page contract:

```js
import { CLINIC, CONTACTS, HOURS, LICENSE } from '../data/clinic.js';
import { SERVICES } from '../data/services.js';
import { STAFF } from '../data/staff.js';
import { renderIcon } from '../templates/icons.js';

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const renderPicture = (name, className) => [
  `<picture class="${className}">`,
  `<source srcset="assets/images/hero-${name}.avif" type="image/avif">`,
  `<img src="assets/images/hero-${name}.webp" alt="" width="1920" height="1080" loading="lazy">`,
  '</picture>',
].join('');

const registrationYear = CLINIC.registeredSince.match(/\d{4}/)?.[0] ?? CLINIC.registeredSince;

const values = [
  ['shield', 'Лицензированная помощь', `Статус медицинской лицензии: ${LICENSE.status.toLowerCase()}.`],
  ['info', 'Понятная информация', 'Направления помощи и документы для пациентов собраны на сайте.'],
  ['team', 'Опубликованная команда', 'Имена и должности сотрудников доступны до записи на приём.'],
  ['document', 'Права пациента', 'Порядок обращений и обязательная информация вынесены в отдельный раздел.'],
];

const valuesMarkup = values.map(([icon, title, text]) => [
  '<article class="about-value">',
  renderIcon(icon),
  `<div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div>`,
  '</article>',
].join('')).join('');

const facts = [
  ['calendar', registrationYear, 'Регистрация юридического лица'],
  ['tooth', SERVICES.length, 'Лицензированных направления помощи'],
  ['team', STAFF.length, 'Сотрудников в опубликованном списке'],
  ['shield', LICENSE.status, 'Статус медицинской лицензии'],
];

const factsMarkup = facts.map(([icon, value, label]) => [
  '<div class="about-fact">',
  renderIcon(icon),
  `<div><dt>${escapeHtml(value)}</dt><dd>${escapeHtml(label)}</dd></div>`,
  '</div>',
].join('')).join('');

const servicesMarkup = SERVICES.map((service, index) => [
  `<article class="about-service${index === 0 ? ' about-service--featured' : ''}">`,
  `<span class="about-service__icon">${renderIcon(index === 2 ? 'team' : 'tooth')}</span>`,
  `<div><h3>${escapeHtml(service.title)}</h3><p>${escapeHtml(service.summary)}</p></div>`,
  `<a class="text-link" href="services.html">Подробнее об услугах${renderIcon('arrow', 'button-icon')}</a>`,
  '</article>',
].join('')).join('');

const staffMarkup = STAFF.map((person) => [
  '<article class="about-team__person">',
  `<span class="about-team__avatar" aria-hidden="true">${escapeHtml(person.initials)}</span>`,
  `<div><h3>${escapeHtml(person.name)}</h3><p class="about-team__role">${escapeHtml(person.role)}</p></div>`,
  '</article>',
].join('')).join('');

const hoursMarkup = [HOURS.weekdays, HOURS.saturday, HOURS.sunday]
  .map((entry) => `<div><dt>${escapeHtml(entry.label)}</dt><dd>${escapeHtml(entry.value)}</dd></div>`)
  .join('');

const body = [
  '<section class="about-section about-mission"><div class="container about-mission__grid">',
  '<div class="about-mission__copy"><p class="eyebrow">Наша задача</p><h2>Сделать обращение за стоматологической помощью понятным</h2><p>До визита пациент может проверить направления помощи, состав команды, лицензию и порядок обращения в клинику.</p><a class="button button-secondary" href="license.html">Проверить лицензию</a></div>',
  `<div class="about-values">${valuesMarkup}</div></div></section>`,
  `<section class="about-facts"><div class="container"><h2 class="sr-only">Подтверждённые сведения</h2><dl class="about-facts__grid">${factsMarkup}</dl></div></section>`,
  '<section class="about-section about-space"><div class="container about-space__grid"><div class="about-space__copy"><p class="eyebrow">Клиника в Белгороде</p><h2>Вся информация для визита собрана заранее</h2>',
  `<ul class="about-checklist"><li>${escapeHtml(CLINIC.activityAddress)}</li><li>${escapeHtml(HOURS.weekdays.label)}: ${escapeHtml(HOURS.weekdays.value)}</li><li>${escapeHtml(HOURS.saturday.label)}: ${escapeHtml(HOURS.saturday.value)}</li></ul>`,
  `<div class="about-actions"><a class="button button-primary" href="${CONTACTS.phones[0].href}" data-appointment-open>${renderIcon('calendar', 'button-icon')}Записаться на приём</a><a class="button button-secondary" href="contacts.html">Контакты</a></div></div>`,
  `<figure class="about-gallery">${renderPicture('services', 'about-gallery__item about-gallery__item--primary')}${renderPicture('home', 'about-gallery__item')}${renderPicture('contacts', 'about-gallery__item')}<figcaption class="hero-visualization-label">Визуализация интерьера</figcaption></figure></div></section>`,
  `<section class="about-section about-services"><div class="container"><div class="about-section__heading"><div><p class="eyebrow">Направления помощи</p><h2>Стоматологическая помощь по действующей лицензии</h2></div><a class="text-link" href="services.html">Все услуги${renderIcon('arrow', 'button-icon')}</a></div><div class="about-services__grid">${servicesMarkup}</div></div></section>`,
  `<section class="about-section about-team"><div class="container"><div class="about-section__heading"><div><p class="eyebrow">Команда</p><h2>Сотрудники клиники</h2></div><a class="text-link" href="specialists.html">Сведения о специалистах${renderIcon('arrow', 'button-icon')}</a></div><div class="about-team__list">${staffMarkup}</div><p class="about-team__notice">${escapeHtml(STAFF[0].credentialNotice)}</p></div></section>`,
  '<section class="about-section about-license"><div class="container about-license__grid">',
  '<a class="about-license__preview" href="documents/license-registry-extract.pdf" target="_blank" rel="noopener"><img src="assets/documents/license-registry-extract.webp" alt="Выписка из реестра лицензий" width="720" height="960" loading="lazy"><span>Открыть выписку в PDF</span></a>',
  `<div class="about-license__content"><p class="eyebrow">Официальные документы</p><h2>Медицинская лицензия</h2><dl class="about-license__facts"><div><dt>Номер</dt><dd>${escapeHtml(LICENSE.number)}</dd></div><div><dt>Статус</dt><dd>${escapeHtml(LICENSE.status)}</dd></div><div><dt>Лицензирующий орган</dt><dd>${escapeHtml(LICENSE.authority)}</dd></div><div><dt>Приказ</dt><dd>${escapeHtml(LICENSE.order)}</dd></div></dl><div class="about-actions"><a class="button button-primary" href="license.html">Все сведения о лицензии</a><a class="about-license__secondary text-link" href="documents/ogrn-certificate.pdf" target="_blank" rel="noopener">Свидетельство ОГРН${renderIcon('arrow', 'button-icon')}</a></div></div></div></section>`,
  '<section class="about-section about-legal"><div class="container"><div class="about-section__heading"><div><p class="eyebrow">Реквизиты</p><h2>Юридические сведения</h2></div></div>',
  `<dl class="about-legal__grid"><div><dt>Полное наименование</dt><dd>${escapeHtml(CLINIC.legalName)}</dd></div><div><dt>ОГРН</dt><dd>${escapeHtml(CLINIC.ogrn)}</dd></div><div><dt>ИНН</dt><dd>${escapeHtml(CLINIC.inn)}</dd></div><div><dt>Адрес регистрации</dt><dd>${escapeHtml(CLINIC.registryAddress)}</dd></div><div><dt>Адрес клиники</dt><dd>${escapeHtml(CLINIC.activityAddress)}</dd></div></dl></div></section>`,
  '<section class="about-section about-cta"><div class="container about-cta__panel"><div><p class="eyebrow">Запись на приём</p><h2>Выберите удобный способ связи</h2><p>Онлайн-запись подключается. Пока запишитесь по телефону.</p>',
  `<div class="about-actions"><a class="button button-primary" href="${CONTACTS.phones[0].href}" data-appointment-open>${renderIcon('calendar', 'button-icon')}Записаться на приём</a>${CONTACTS.phones.map((phone) => `<a class="button button-secondary" href="${phone.href}">${escapeHtml(phone.label)}</a>`).join('')}</div></div><div><h3>Режим работы</h3><dl class="definition-list definition-list--compact">${hoursMarkup}</dl><p><strong>${escapeHtml(HOURS.breakNote)}</strong></p></div></div></section>`,
].join('');

export const ABOUT_PAGE = Object.freeze({
  file: 'about.html',
  title: 'О стоматологической клинике',
  description: `О клинике ${CLINIC.name}: лицензированные направления помощи, команда, документы и реквизиты.`,
  heading: 'О клинике',
  lead: 'Лицензированная стоматологическая помощь и подтверждённая информация для пациентов в Белгороде.',
  heroImage: 'about',
  noindex: false,
  body,
});
```

- [ ] **Step 4: Integrate `ABOUT_PAGE` into the manifest**

In `src/content/core-pages.js`:

```js
import { CLINIC, CONTACTS, HOURS } from '../data/clinic.js';
import { ABOUT_PAGE } from './about-page.js';
import { HOME_PAGE } from './home-page.js';
```

Replace the existing inline about object with `ABOUT_PAGE` immediately after `HOME_PAGE`.

- [ ] **Step 5: Regenerate and verify GREEN**

Run:

```powershell
pnpm generate
pnpm test tests/content/about-page.test.js tests/content/public-pages.test.js tests/templates/render-page.test.js
```

Expected: all focused tests pass; `about.html` contains the new static main content and remains indexable.

- [ ] **Step 6: Commit Task 1**

```powershell
git add src/content/about-page.js src/content/core-pages.js tests/content/about-page.test.js about.html
git commit -m "feat: build patient-oriented about page"
```

---

### Task 2: Add the premium responsive visual system

**Files:**
- Modify: `src/styles/pages.css`
- Create: `tests/styles/about-redesign.test.js`

**Interfaces:**
- Consumes: all `.about-*` selectors produced by Task 1 and existing tokens from `src/styles/tokens.css`.
- Produces: mobile-first page layout, `48rem` tablet composition and `75rem` desktop composition without new tokens.

- [ ] **Step 1: Write the failing style contract**

Create `tests/styles/about-redesign.test.js`:

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pages = readFileSync('src/styles/pages.css', 'utf8');

describe('about page visual contract', () => {
  it('defines every approved about-page block', () => {
    for (const selector of ['about-mission', 'about-values', 'about-facts', 'about-space', 'about-gallery', 'about-services', 'about-team', 'about-license', 'about-legal', 'about-cta']) {
      expect(pages).toContain(`.${selector}`);
    }
  });

  it('uses a two-by-two fact grid and four desktop columns', () => {
    expect(pages).toMatch(/\.about-facts__grid\s*{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(var\(--space-0\),\s*1fr\)\)/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.about-facts__grid\s*{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(var\(--space-0\),\s*1fr\)\)/s);
  });

  it('creates asymmetric desktop layouts and the featured service', () => {
    expect(pages).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.about-mission__grid\s*{[^}]*grid-template-columns:\s*minmax\(var\(--space-0\),\s*4fr\)\s+minmax\(var\(--space-0\),\s*8fr\)/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.about-services__grid\s*{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(var\(--space-0\),\s*1fr\)\)/s);
    expect(pages).toMatch(/\.about-service--featured\s*{[^}]*grid-column:\s*span\s+2/s);
  });

  it('builds a two-column gallery with a wide primary image', () => {
    expect(pages).toMatch(/\.about-gallery\s*{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(var\(--space-0\),\s*1fr\)\)/s);
    expect(pages).toMatch(/\.about-gallery__item--primary\s*{[^}]*grid-column:\s*1\s*\/\s*-1/s);
  });
});
```

- [ ] **Step 2: Run the style test and verify RED**

Run:

```powershell
pnpm test tests/styles/about-redesign.test.js
```

Expected: four failures because page-scoped styles do not exist.

- [ ] **Step 3: Add the mobile-first styles**

Append a single `.about-*` block to `src/styles/pages.css` implementing:

```css
.about-section {
  padding-block: var(--section-space);
}

.about-mission__grid,
.about-space__grid,
.about-license__grid,
.about-cta__panel {
  min-inline-size: var(--space-0);
  display: grid;
  align-items: start;
  gap: var(--space-8);
}

.about-mission__copy,
.about-space__copy,
.about-license__content {
  min-inline-size: var(--space-0);
}

.about-mission__copy > p:not(.eyebrow),
.about-space__copy > p:not(.eyebrow),
.about-license__content > p:not(.eyebrow),
.about-cta__panel > div > p:not(.eyebrow) {
  max-inline-size: var(--text-body-measure);
  color: var(--color-text-muted);
}

.about-values,
.about-services__grid,
.about-team__list,
.about-legal__grid {
  min-inline-size: var(--space-0);
  display: grid;
  gap: var(--space-4);
}

.about-value {
  min-inline-size: var(--space-0);
  display: grid;
  grid-template-columns: auto minmax(var(--space-0), 1fr);
  align-items: start;
  gap: var(--space-4);
  padding-block: var(--space-5);
  border-block-end: var(--border-width) solid var(--color-border);
}

.about-value .ui-icon,
.about-fact > .ui-icon,
.about-service__icon {
  color: var(--color-primary-strong);
}

.about-value h3,
.about-value p,
.about-team__person h3,
.about-team__person p,
.about-service h3,
.about-service p {
  max-inline-size: none;
  margin-block-end: var(--space-0);
}

.about-value p,
.about-service p,
.about-team__role,
.about-team__notice {
  color: var(--color-text-muted);
}

.about-facts {
  padding-block: var(--space-8);
  background: var(--color-surface-brand-soft);
}

.about-facts__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(var(--space-0), 1fr));
  gap: var(--border-width);
  margin: var(--space-0);
  padding: var(--border-width);
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--color-border);
}

.about-fact {
  min-inline-size: var(--space-0);
  display: grid;
  align-content: start;
  gap: var(--space-3);
  padding: var(--space-5);
  background: var(--color-surface-raised);
}

.about-fact dt {
  overflow-wrap: anywhere;
  color: var(--color-primary-strong);
  font-family: var(--font-heading);
  font-size: var(--text-h3-size);
}

.about-fact dd {
  margin-inline-start: var(--space-0);
  color: var(--color-text-muted);
  font-size: var(--text-small-size);
}

.about-checklist {
  display: grid;
  gap: var(--space-3);
  margin-block: var(--space-6);
  padding-inline-start: var(--space-6);
}

.about-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.about-gallery {
  position: relative;
  min-inline-size: var(--space-0);
  display: grid;
  grid-template-columns: repeat(2, minmax(var(--space-0), 1fr));
  gap: var(--space-3);
  margin: var(--space-0);
}

.about-gallery__item {
  min-inline-size: var(--space-0);
  aspect-ratio: var(--media-aspect-wide);
  overflow: hidden;
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-subtle);
}

.about-gallery__item--primary {
  grid-column: 1 / -1;
}

.about-gallery img {
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}

.about-gallery figcaption {
  inset: auto var(--space-3) var(--space-3) auto;
}

.about-services,
.about-legal {
  background: var(--color-surface-subtle);
}

.about-section__heading {
  min-inline-size: var(--space-0);
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-block-end: var(--space-8);
}

.about-section__heading h2,
.about-section__heading .eyebrow {
  margin-block-end: var(--space-0);
}

.about-service {
  min-inline-size: var(--space-0);
  display: grid;
  align-content: start;
  gap: var(--space-4);
  padding: var(--space-6);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-raised);
  transition: var(--transition-interactive);
}

.about-service:hover {
  border-color: var(--color-border-strong);
  transform: translateY(calc(var(--space-0-5) * -1));
}

.about-service__icon {
  inline-size: calc(var(--icon-size) + var(--space-6));
  block-size: calc(var(--icon-size) + var(--space-6));
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  background: var(--color-surface-brand-soft);
}

.about-team__person {
  min-inline-size: var(--space-0);
  display: grid;
  grid-template-columns: auto minmax(var(--space-0), 1fr);
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  border-block-end: var(--border-width) solid var(--color-border);
}

.about-team__avatar {
  inline-size: calc(var(--icon-size) + var(--space-6));
  block-size: calc(var(--icon-size) + var(--space-6));
  display: grid;
  place-items: center;
  border-radius: var(--radius-pill);
  color: var(--color-primary-strong);
  background: var(--color-surface-brand-soft);
  font-weight: var(--text-label-weight);
}

.about-team__notice {
  max-inline-size: var(--text-body-measure);
  margin-block-start: var(--space-6);
}

.about-license {
  background: var(--color-surface-warm);
}

.about-license__preview {
  min-inline-size: var(--space-0);
  overflow: hidden;
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text);
  background: var(--color-surface-raised);
  box-shadow: var(--shadow-card);
  text-decoration: none;
}

.about-license__preview img {
  inline-size: 100%;
  aspect-ratio: var(--media-aspect-document);
  display: block;
  object-fit: contain;
  background: var(--color-surface-subtle);
}

.about-license__preview span {
  min-block-size: var(--control-block-size);
  display: flex;
  align-items: center;
  padding: var(--space-4);
  font-weight: var(--text-label-weight);
}

.about-license__facts,
.about-legal__grid {
  margin: var(--space-0);
}

.about-license__facts {
  display: grid;
  gap: var(--space-0);
  margin-block: var(--space-6);
}

.about-license__facts > div,
.about-legal__grid > div {
  min-inline-size: var(--space-0);
  padding-block: var(--space-4);
  border-block-end: var(--border-width) solid var(--color-border);
}

.about-license__facts dt,
.about-legal__grid dt {
  color: var(--color-text-muted);
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
}

.about-license__facts dd,
.about-legal__grid dd {
  margin: var(--space-1) var(--space-0) var(--space-0);
  overflow-wrap: anywhere;
}

.about-cta {
  padding-block-start: var(--space-0);
}

.about-cta__panel {
  padding: var(--space-8);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-brand-soft);
}
```

- [ ] **Step 4: Add tablet and desktop composition**

Inside the existing `@media (min-width: 48rem)` block add:

```css
.about-values,
.about-team__list,
.about-legal__grid {
  grid-template-columns: repeat(2, minmax(var(--space-0), 1fr));
}

.about-team__person:first-child {
  grid-column: 1 / -1;
}

.about-license__grid {
  grid-template-columns: minmax(var(--space-0), 5fr) minmax(var(--space-0), 7fr);
}
```

Inside the existing `@media (min-width: 75rem)` block add:

```css
.about-mission__grid {
  grid-template-columns: minmax(var(--space-0), 4fr) minmax(var(--space-0), 8fr);
}

.about-space__grid,
.about-cta__panel {
  grid-template-columns: minmax(var(--space-0), 5fr) minmax(var(--space-0), 7fr);
}

.about-facts__grid {
  grid-template-columns: repeat(4, minmax(var(--space-0), 1fr));
}

.about-services__grid {
  grid-template-columns: repeat(4, minmax(var(--space-0), 1fr));
}

.about-service--featured {
  grid-column: span 2;
}
```

- [ ] **Step 5: Verify focused GREEN and design-system gates**

Run:

```powershell
pnpm test tests/content/about-page.test.js tests/styles/about-redesign.test.js
& 'C:\Users\bahti\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\lint_hardcodes.py' src/styles
& 'C:\Users\bahti\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\validate_theme_refs.py' src/styles/tokens.css src/styles
git diff --check
```

Expected: focused tests pass, zero hardcoded values, every CSS variable resolves and diff check is clean.

- [ ] **Step 6: Commit Task 2**

```powershell
git add src/styles/pages.css tests/styles/about-redesign.test.js
git commit -m "feat: style premium about page"
```

---

### Task 3: Complete responsive and release verification

**Files:**
- Create: `.superpowers/sdd/task-about-page-redesign-report.md`

**Interfaces:**
- Consumes: static page and style output from Tasks 1 and 2.
- Produces: automated, visual, accessibility and responsive evidence for release.

- [ ] **Step 1: Run the full project gate**

Run:

```powershell
pnpm verify
git diff --check
```

Expected: all tests pass, Vite builds 21 HTML pages, and the site verifier validates all 21 pages.

- [ ] **Step 2: Run in-app Browser responsive QA**

On `http://127.0.0.1:4173/about.html`, use fresh reloads at 320, 390, 768 and 1280px and record:

```text
- document scrollWidth equals clientWidth;
- all visible controls stay within the viewport;
- exactly one H1 and the approved nine-section sequence;
- four fact cells: two columns below 75rem, four at 1280px;
- three gallery images and one visualization caption;
- all services and five staff entries visible;
- document preview loads and fits its container;
- appointment opener opens the shared dialog, Escape closes it and focus returns;
- mobile menu and fixed appointment action still work;
- console errors: zero; active asset origins: same-origin only.
```

At 320px enable vision mode and repeat overflow/clipping, document and team checks.

- [ ] **Step 3: Run the UX helper gates**

Run and record the actual output:

```powershell
node 'C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\verify_states.mjs' about.html
node 'C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\verify_states.mjs' about.html --dark
node 'C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\taste_audit.mjs' about.html
node 'C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\accuracy_report.mjs'
```

If an external skill helper reports a missing standalone dependency or Windows launcher issue, document it honestly and keep the project-native full gate plus in-app Browser QA as release evidence.

- [ ] **Step 4: Write the verification report**

Create `.superpowers/sdd/task-about-page-redesign-report.md` with:

```markdown
# About Page Redesign — Verification Report

## Scope
[Exact source/style/generated files changed]

## TDD evidence
[Baseline, RED failure reasons, focused GREEN and full counts]

## Design-system evidence
[Hardcode, theme-reference and helper outputs]

## Browser matrix
[320/390/768/1280 and vision-mode measured results]

## Content/legal boundary
[Confirmed data sources and unsupported-claim scan]

## Result
[Release status and any honest tool limitation]
```

- [ ] **Step 5: Commit the report**

```powershell
git add -f .superpowers/sdd/task-about-page-redesign-report.md
git commit -m "docs: verify about page redesign"
```

- [ ] **Step 6: Run the fresh final gate**

Run:

```powershell
pnpm verify
git diff --check
git diff --cached --check
git status --short
```

Expected: all tests/build/verifier pass and the worktree is clean.
