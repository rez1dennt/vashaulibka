# Dental Clinic Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать адаптивный многостраничный официальный сайт ООО «Стоматология Ваша улыбка» по утверждённой спецификации, с подтверждёнными данными, юридическим разделом, доступностью, SEO и подготовленной точкой интеграции с МИС.

**Architecture:** Vite 8.1 собирает набор самостоятельных HTML-страниц. Истинные данные клиники, услуг, сотрудников и юридических разделов хранятся в ES-модулях, а небольшой генератор создаёт семантический HTML до запуска Vite; браузерный JavaScript только улучшает взаимодействия. Все интерактивные модули раздельны и тестируются в jsdom.

**Tech Stack:** Node.js 24, pnpm 11, Vite 8.1, Vanilla HTML5/CSS/ES modules, Vitest 4, jsdom, локальные SVG/WebP/AVIF/PDF.

## Global Constraints

- Использовать только данные из утверждённой спецификации `docs/superpowers/specs/2026-08-11-dental-clinic-website-design.md` и официальных источников.
- Действующий номер лицензии: `Л041-01154-31/00551666`; старый номер не показывать как действующий.
- Не публиковать услуги, которых нет в актуальной лицензии: хирургия, имплантология, ортодонтия и детская стоматология.
- Не придумывать цены, образование, стаж, фотографии врачей, отзывы или вакансии.
- Страницы `specialists.html` и `prices.html` получают `noindex` до поступления подтверждённых данных и не включаются в `sitemap.xml`.
- Кнопка записи не собирает персональные данные и всегда предлагает кликабельные телефоны до подключения МИС.
- Не подключать внешние шрифты, аналитику, рекламные пиксели, iframe-карты и иные трекеры.
- Основной HTML должен быть доступен без JavaScript; JavaScript используется как progressive enhancement.
- Поддержать клавиатуру, видимый фокус, reduced motion, режим слабовидящих и ширины 360–1440 px.
- Все изменения выполнять по TDD: тест должен сначала завершиться ожидаемым падением, затем пройти после минимальной реализации.

---

### Task 1: Project foundation and verified clinic data

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `vite.config.js`
- Create: `vitest.config.js`
- Create: `tests/setup.js`
- Create: `src/data/clinic.js`
- Create: `tests/data/clinic.test.js`

**Interfaces:**
- Consumes: утверждённые реквизиты из дизайн-спецификации.
- Produces: `CLINIC`, `HOURS`, `LICENSE`, `CONTACTS`; команды `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm generate`, `pnpm verify`.

- [ ] **Step 1: Create package and test-runner configuration**

```json
{
  "name": "stomatologiya-vasha-ulybka",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "generate": "node scripts/generate-pages.mjs",
    "dev": "pnpm generate && vite",
    "build": "pnpm generate && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "verify:site": "node scripts/verify-site.mjs dist",
    "verify": "pnpm test && pnpm build && pnpm verify:site"
  },
  "devDependencies": {
    "jsdom": "^26.1.0",
    "vite": "^8.1.0",
    "vitest": "^4.0.0"
  }
}
```

```js
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    clearMocks: true,
    restoreMocks: true,
    setupFiles: ['./tests/setup.js'],
  },
});
```

```js
// tests/setup.js
import { afterEach } from 'vitest';

afterEach(() => {
  document.documentElement.innerHTML = '<head></head><body></body>';
  localStorage.clear();
});
```

```js
// vite.config.js
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const htmlInputs = Object.fromEntries(
  readdirSync(import.meta.dirname)
    .filter((name) => name.endsWith('.html'))
    .map((name) => [name.replace('.html', ''), resolve(import.meta.dirname, name)]),
);

export default defineConfig({
  base: './',
  build: { rollupOptions: { input: htmlInputs } },
});
```

```gitignore
node_modules/
dist/
coverage/
.vite/
*.log
```

Run: `pnpm install`  
Expected: dependencies install and `pnpm-lock.yaml` is created.

- [ ] **Step 2: Write the failing clinic-data test**

```js
// tests/data/clinic.test.js
import { describe, expect, it } from 'vitest';
import { CLINIC, CONTACTS, HOURS, LICENSE } from '../../src/data/clinic.js';

describe('verified clinic data', () => {
  it('exposes the current registry identity and license', () => {
    expect(CLINIC.legalName).toBe('Общество с ограниченной ответственностью «Стоматология Ваша улыбка»');
    expect(CLINIC.ogrn).toBe('1123123003299');
    expect(CLINIC.inn).toBe('3123296829');
    expect(LICENSE.number).toBe('Л041-01154-31/00551666');
    expect(JSON.stringify({ CLINIC, LICENSE })).not.toContain('ЛО-31-01-001157');
  });

  it('keeps contact channels machine-readable', () => {
    expect(CONTACTS.phones.map((phone) => phone.href)).toEqual([
      'tel:+74722215356',
      'tel:+79087864848',
    ]);
    expect(HOURS.sunday.closed).toBe(true);
  });
});
```

- [ ] **Step 3: Run the test and verify the expected failure**

Run: `pnpm test tests/data/clinic.test.js`  
Expected: FAIL because `src/data/clinic.js` does not exist.

- [ ] **Step 4: Implement the verified clinic-data module**

```js
// src/data/clinic.js
export const CLINIC = Object.freeze({
  name: 'Стоматология Ваша улыбка',
  legalName: 'Общество с ограниченной ответственностью «Стоматология Ваша улыбка»',
  shortLegalName: 'ООО «Стоматология Ваша улыбка»',
  ogrn: '1123123003299',
  inn: '3123296829',
  registeredSince: '17 февраля 2012 года',
  activityAddress: 'Белгородская область, г. Белгород, ул. Макаренко, д. 1г',
  registryAddress: '308000, Белгородская область, г. Белгород, ул. Макаренко, д. 1г',
  complaintsPostalAddress: '308013, Белгородская обл., г. Белгород, ул. Макаренко, д. 1-Г',
});

export const LICENSE = Object.freeze({
  number: 'Л041-01154-31/00551666',
  grantedAt: '16.11.2012',
  authority: 'Министерство здравоохранения Белгородской области',
  status: 'Действует',
  order: '№ 167-л от 22.02.2022',
});

export const CONTACTS = Object.freeze({
  email: 'stomdemidov@mail.ru',
  emailHref: 'mailto:stomdemidov@mail.ru',
  phones: [
    { label: '+7 (4722) 21-53-56', href: 'tel:+74722215356' },
    { label: '+7 (908) 786-48-48', href: 'tel:+79087864848' },
  ],
});

export const HOURS = Object.freeze({
  weekdays: { label: 'Пн–Пт', value: '10:00–19:00', closed: false },
  saturday: { label: 'Сб', value: '10:00–14:00', closed: false },
  sunday: { label: 'Вс', value: 'Выходной', closed: true },
  breakNote: 'Без перерыва',
});
```

- [ ] **Step 5: Run the focused and full tests**

Run: `pnpm test tests/data/clinic.test.js && pnpm test`  
Expected: PASS, 2 focused tests and the same 2 tests in the full suite.

- [ ] **Step 6: Commit the foundation**

```bash
git add .gitignore package.json pnpm-lock.yaml vite.config.js vitest.config.js src/data/clinic.js tests/setup.js tests/data/clinic.test.js
git commit -m "chore: set up clinic website foundation"
```

---

### Task 2: Licensed services, staff, and controlled incomplete states

**Files:**
- Create: `src/data/services.js`
- Create: `src/data/staff.js`
- Create: `tests/data/content-safety.test.js`

**Interfaces:**
- Consumes: `LICENSE.number` from Task 1.
- Produces: `SERVICES`, `STAFF`, `INCOMPLETE_CONTENT`; downstream page renderers iterate these arrays without duplicating facts.

- [ ] **Step 1: Write the failing content-safety tests**

```js
// tests/data/content-safety.test.js
import { describe, expect, it } from 'vitest';
import { SERVICES } from '../../src/data/services.js';
import { INCOMPLETE_CONTENT, STAFF } from '../../src/data/staff.js';

describe('published content safety', () => {
  it('contains only license-backed service groups', () => {
    expect(SERVICES.map((item) => item.slug)).toEqual(['therapy', 'orthopedics', 'premedical']);
    expect(JSON.stringify(SERVICES)).not.toMatch(/имплант|хирург|ортодонт|детск/i);
    expect(SERVICES.every((item) => item.priceStatus === 'Стоимость уточняется у администратора')).toBe(true);
  });

  it('contains exactly the five supplied employees without fabricated credentials', () => {
    expect(STAFF).toHaveLength(5);
    expect(STAFF.map((person) => person.name)).toContain('Демидов Андрей Фёдорович');
    expect(STAFF.every((person) => person.photo === null && person.credentials === null)).toBe(true);
    expect(INCOMPLETE_CONTENT.specialists.noindex).toBe(true);
    expect(INCOMPLETE_CONTENT.prices.noindex).toBe(true);
  });
});
```

- [ ] **Step 2: Verify the tests fail for missing modules**

Run: `pnpm test tests/data/content-safety.test.js`  
Expected: FAIL because `services.js` and `staff.js` do not exist.

- [ ] **Step 3: Implement services and staff data**

```js
// src/data/services.js
const controlledPrice = 'Стоимость уточняется у администратора';

export const SERVICES = Object.freeze([
  {
    slug: 'therapy',
    title: 'Терапевтическая стоматология',
    summary: 'Диагностика и лечение заболеваний зубов и слизистой оболочки полости рта в пределах лицензированного направления.',
    items: ['Консультация стоматолога-терапевта', 'Диагностика состояния полости рта', 'Лечение кариеса и его осложнений'],
    priceStatus: controlledPrice,
  },
  {
    slug: 'orthopedics',
    title: 'Ортопедическая стоматология',
    summary: 'Восстановление функции и эстетики зубных рядов ортопедическими конструкциями по медицинским показаниям.',
    items: ['Консультация стоматолога-ортопеда', 'Подбор ортопедической конструкции', 'Изготовление и коррекция протезов'],
    priceStatus: controlledPrice,
  },
  {
    slug: 'premedical',
    title: 'Доврачебная помощь',
    summary: 'Первичная доврачебная медико-санитарная помощь по стоматологии и сестринскому делу.',
    items: ['Стоматологическая доврачебная помощь', 'Сестринское сопровождение', 'Профилактическое информирование'],
    priceStatus: controlledPrice,
  },
]);
```

```js
// src/data/staff.js
const credentialNotice = 'Сведения об образовании, аккредитации и стаже будут опубликованы после получения подтверждающих документов.';

export const STAFF = Object.freeze([
  { name: 'Демидова Инна Владимировна', role: 'Директор, главный врач', initials: 'ДИ', photo: null, credentials: null, credentialNotice },
  { name: 'Демидов Андрей Фёдорович', role: 'Стоматолог-терапевт, стоматолог-ортопед', initials: 'ДА', photo: null, credentials: null, credentialNotice },
  { name: 'Рощина Любовь Ивановна', role: 'Фельдшер стоматологический', initials: 'РЛ', photo: null, credentials: null, credentialNotice },
  { name: 'Ненько Софья Максимовна', role: 'Медицинская сестра', initials: 'НС', photo: null, credentials: null, credentialNotice },
  { name: 'Мясоедова Анастасия Андреевна', role: 'Медицинская сестра', initials: 'МА', photo: null, credentials: null, credentialNotice },
]);

export const INCOMPLETE_CONTENT = Object.freeze({
  specialists: { noindex: true, reason: credentialNotice },
  prices: { noindex: true, reason: 'Утверждённый прейскурант будет опубликован после получения от клиники.' },
});
```

- [ ] **Step 4: Run the focused tests**

Run: `pnpm test tests/data/content-safety.test.js`  
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit the data contracts**

```bash
git add src/data/services.js src/data/staff.js tests/data/content-safety.test.js
git commit -m "feat: add verified clinic content data"
```

---

### Task 3: Semantic page renderer and multi-page generation

**Files:**
- Create: `src/content/page-manifest.js`
- Create: `src/templates/render-page.js`
- Create: `scripts/generate-pages.mjs`
- Create: `tests/templates/render-page.test.js`

**Interfaces:**
- Consumes: `CLINIC`, `CONTACTS`, `HOURS`, page descriptors.
- Produces: `renderPage(page) -> string`, `PAGES`, and root-level HTML entries consumed by Vite.

- [ ] **Step 1: Add the failing renderer tests**

```js
// tests/templates/render-page.test.js
import { describe, expect, it } from 'vitest';
import { renderPage } from '../../src/templates/render-page.js';

const page = {
  file: 'about.html',
  title: 'О клинике',
  description: 'Информация о стоматологической клинике в Белгороде.',
  heading: 'О клинике',
  heroImage: 'about',
  body: '<section aria-labelledby="mission"><h2 id="mission">Наша миссия</h2></section>',
  noindex: false,
};

describe('renderPage', () => {
  it('renders semantic content and accessibility anchors', () => {
    const html = renderPage(page);
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('href="#main-content"');
    expect(html).toContain('<main id="main-content"');
    expect(html).toContain('<h1>О клинике</h1>');
    expect(html).toContain('data-appointment-open');
  });

  it('adds robots noindex only for controlled incomplete pages', () => {
    expect(renderPage({ ...page, noindex: true })).toContain('content="noindex, follow"');
    expect(renderPage(page)).not.toContain('content="noindex, follow"');
  });
});
```

- [ ] **Step 2: Verify renderer tests fail**

Run: `pnpm test tests/templates/render-page.test.js`  
Expected: FAIL because `render-page.js` does not exist.

- [ ] **Step 3: Implement the shared semantic renderer**

```js
// src/templates/render-page.js
import { CLINIC, CONTACTS, HOURS, LICENSE } from '../data/clinic.js';

const nav = [
  ['about.html', 'О клинике'], ['services.html', 'Наши услуги'], ['specialists.html', 'Специалисты'],
  ['prices.html', 'Цены'], ['reviews.html', 'Отзывы'], ['vacancies.html', 'Вакансии'], ['contacts.html', 'Контакты'],
];

const esc = (value) => String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);

export function renderPage(page) {
  const robots = page.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow">';
  const active = page.file === 'index.html' ? '' : page.file;
  const navHtml = nav.map(([href, label]) => `<a href="${href}"${href === active ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const schema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Dentist', name: CLINIC.name, legalName: CLINIC.legalName,
    address: { '@type': 'PostalAddress', streetAddress: 'ул. Макаренко, д. 1г', addressLocality: 'Белгород', addressRegion: 'Белгородская область', addressCountry: 'RU' },
    telephone: CONTACTS.phones.map((item) => item.label), email: CONTACTS.email,
    identifier: [{ '@type': 'PropertyValue', propertyID: 'ОГРН', value: CLINIC.ogrn }, { '@type': 'PropertyValue', propertyID: 'Лицензия', value: LICENSE.number }],
  });

  return `<!doctype html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${robots}<title>${esc(page.title)} — ${esc(CLINIC.name)}</title><meta name="description" content="${esc(page.description)}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(page.title)}"><meta property="og:description" content="${esc(page.description)}"><link rel="icon" href="assets/icons/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/src/styles/main.css"><script type="application/ld+json">${schema}</script></head><body data-page="${esc(page.file)}"><a class="skip-link" href="#main-content">К основному содержимому</a><header class="site-header"><div class="topbar"><button type="button" data-vision-toggle>Версия для слабовидящих</button><span>${esc(CLINIC.activityAddress)}</span><span>${esc(HOURS.weekdays.value)}</span></div><div class="header-main"><a class="brand" href="index.html" aria-label="${esc(CLINIC.name)}, главная"><img src="assets/icons/logo.svg" alt="" width="56" height="56"><span>${esc(CLINIC.name)}</span></a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-menu"><span class="sr-only">Открыть меню</span></button><nav id="main-menu" aria-label="Основная навигация">${navHtml}<button class="button button-primary" type="button" data-appointment-open>Запись на приём</button></nav></div></header><main id="main-content"><section class="page-hero page-hero--${esc(page.heroImage)}"><div class="container"><nav aria-label="Хлебные крошки"><a href="index.html">Главная</a><span aria-hidden="true">/</span><span>${esc(page.heading)}</span></nav><h1>${esc(page.heading)}</h1>${page.lead ? `<p>${esc(page.lead)}</p>` : ''}</div></section>${page.body}</main><footer class="site-footer"><div class="container footer-grid"><section><h2>${esc(CLINIC.name)}</h2><p>Стоматологическая помощь в пределах действующей лицензии.</p></section><section><h2>Пациентам</h2><a href="patients.html">Информация для пациентов</a><a href="privacy.html">Политика конфиденциальности</a><button type="button" data-cookie-settings>Настройки cookies</button></section><section><h2>Контакты</h2>${CONTACTS.phones.map((p) => `<a href="${p.href}">${esc(p.label)}</a>`).join('')}<a href="mailto:${CONTACTS.email}">${esc(CONTACTS.email)}</a></section></div></footer><div id="appointment-dialog" class="dialog" role="dialog" aria-modal="true" aria-labelledby="appointment-title" hidden><div class="dialog__panel"><button type="button" data-dialog-close aria-label="Закрыть">×</button><h2 id="appointment-title">Запись на приём</h2><p>Онлайн-запись подключается. Запишитесь по телефону:</p>${CONTACTS.phones.map((p) => `<a class="button button-secondary" href="${p.href}">${esc(p.label)}</a>`).join('')}</div></div><div class="cookie-banner" data-cookie-banner hidden><p>Сайт использует необходимые технологии хранения настроек. Необязательные технологии отключены.</p><button type="button" data-cookie-reject>Отклонить необязательные</button><button type="button" data-cookie-accept>Разрешить выбранные</button></div><script type="module" src="/src/js/main.js"></script></body></html>`;
}
```

- [ ] **Step 4: Create the initial page manifest and generator**

```js
// src/content/page-manifest.js
export const PAGES = [
  { file: 'index.html', title: 'Стоматологическая клиника в Белгороде', description: 'ООО «Стоматология Ваша улыбка»: лицензированная стоматологическая помощь в Белгороде.', heading: 'Стоматология Ваша улыбка', lead: 'Забота о здоровье зубов в пределах действующей медицинской лицензии.', heroImage: 'home', body: '<section class="section"><div class="container"><h2>О клинике</h2><p>Клиника работает в Белгороде с 2012 года.</p></div></section>', noindex: false },
  { file: 'about.html', title: 'О клинике', description: 'Реквизиты, лицензия и принципы работы ООО «Стоматология Ваша улыбка».', heading: 'О клинике', lead: 'Подтверждённые сведения о клинике и медицинской деятельности.', heroImage: 'about', body: '<section class="section"><div class="container"><h2>Наша миссия</h2><p>Оказывать понятную и ответственную стоматологическую помощь.</p></div></section>', noindex: false },
];
```

```js
// scripts/generate-pages.mjs
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PAGES } from '../src/content/page-manifest.js';
import { renderPage } from '../src/templates/render-page.js';

for (const page of PAGES) {
  await writeFile(resolve(import.meta.dirname, '..', page.file), renderPage(page), 'utf8');
}
```

- [ ] **Step 5: Run generation and renderer tests**

Run: `pnpm generate && pnpm test tests/templates/render-page.test.js`  
Expected: `index.html` and `about.html` are created; 2 tests PASS.

- [ ] **Step 6: Commit the renderer**

```bash
git add src/content/page-manifest.js src/templates/render-page.js scripts/generate-pages.mjs tests/templates/render-page.test.js index.html about.html
git commit -m "feat: add semantic multi-page renderer"
```

---

### Task 4: Accessible interactions and resilient state

**Files:**
- Create: `src/js/core/focus-trap.js`
- Create: `src/js/core/scroll-lock.js`
- Create: `src/js/core/storage.js`
- Create: `src/js/core/appointment-provider.js`
- Create: `src/js/components/dialog.js`
- Create: `src/js/components/mobile-menu.js`
- Create: `src/js/components/disclosures.js`
- Create: `src/js/components/tabs.js`
- Create: `src/js/components/vision-mode.js`
- Create: `src/js/components/cookie-consent.js`
- Create: `src/js/main.js`
- Create: `tests/js/interactions.test.js`

**Interfaces:**
- Produces: `createFocusTrap(element)`, `safeStorage`, `appointmentProvider.open()`, `initDialog()`, `initMobileMenu()`, `initDisclosures()`, `initVisionMode()`, `initCookieConsent()`.

- [ ] **Step 1: Write failing interaction tests**

```js
// tests/js/interactions.test.js
import { describe, expect, it, vi } from 'vitest';
import { createAppointmentProvider } from '../../src/js/core/appointment-provider.js';
import { initCookieConsent } from '../../src/js/components/cookie-consent.js';
import { initDialog } from '../../src/js/components/dialog.js';
import { initTabs } from '../../src/js/components/tabs.js';
import { lockScroll, unlockScroll } from '../../src/js/core/scroll-lock.js';

describe('progressive interactions', () => {
  it('opens and closes the appointment dialog without submitting data', () => {
    document.body.innerHTML = '<button data-appointment-open>Запись</button><div id="appointment-dialog" role="dialog" hidden><button data-dialog-close>Закрыть</button></div>';
    const provider = createAppointmentProvider();
    initDialog({ provider });
    document.querySelector('[data-appointment-open]').click();
    expect(document.querySelector('#appointment-dialog').hidden).toBe(false);
    expect(provider.submit).toBeUndefined();
    document.querySelector('[data-dialog-close]').click();
    expect(document.querySelector('#appointment-dialog').hidden).toBe(true);
  });

  it('stores an explicit rejection and hides the cookie banner', () => {
    document.body.innerHTML = '<div data-cookie-banner><button data-cookie-reject>Нет</button><button data-cookie-accept>Да</button></div>';
    const storage = { get: vi.fn(() => null), set: vi.fn() };
    initCookieConsent({ storage });
    document.querySelector('[data-cookie-reject]').click();
    expect(storage.set).toHaveBeenCalledWith('cookie-consent', 'rejected');
    expect(document.querySelector('[data-cookie-banner]').hidden).toBe(true);
  });

  it('switches service tabs with the expected ARIA state', () => {
    document.body.innerHTML = '<div role="tablist"><button role="tab" aria-selected="true" aria-controls="therapy">Терапия</button><button role="tab" aria-selected="false" aria-controls="orthopedics">Ортопедия</button></div><section id="therapy" role="tabpanel"></section><section id="orthopedics" role="tabpanel" hidden></section>';
    initTabs();
    document.querySelectorAll('[role="tab"]')[1].click();
    expect(document.querySelector('#therapy').hidden).toBe(true);
    expect(document.querySelector('#orthopedics').hidden).toBe(false);
  });

  it('compensates scrollbar width while locking the page', () => {
    Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: 1000 });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1016 });
    lockScroll();
    expect(document.body.style.paddingRight).toBe('16px');
    unlockScroll();
    expect(document.body.style.paddingRight).toBe('');
  });
});
```

- [ ] **Step 2: Verify interaction tests fail**

Run: `pnpm test tests/js/interactions.test.js`  
Expected: FAIL because interaction modules do not exist.

- [ ] **Step 3: Implement resilient storage and appointment adapter**

```js
// src/js/core/storage.js
export const safeStorage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } },
};
```

```js
// src/js/core/appointment-provider.js
export function createAppointmentProvider() {
  return Object.freeze({ mode: 'phone-only' });
}
```

```js
// src/js/core/scroll-lock.js
let previousPadding = '';
export function lockScroll() {
  previousPadding = document.body.style.paddingRight;
  const scrollbar = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
  document.body.style.paddingRight = scrollbar ? `${scrollbar}px` : previousPadding;
  document.body.classList.add('is-locked');
}
export function unlockScroll() {
  document.body.classList.remove('is-locked');
  document.body.style.paddingRight = previousPadding;
}
```

- [ ] **Step 4: Implement dialog, cookie, menu, disclosure, and vision modules**

```js
// src/js/components/dialog.js
import { createFocusTrap } from '../core/focus-trap.js';
import { lockScroll, unlockScroll } from '../core/scroll-lock.js';
export function initDialog({ provider } = {}) {
  const dialog = document.querySelector('#appointment-dialog');
  const openers = [...document.querySelectorAll('[data-appointment-open]')];
  const closer = dialog?.querySelector('[data-dialog-close]');
  if (!dialog || !openers.length || !provider) return;
  let returnFocus = null;
  const trap = createFocusTrap(dialog);
  const open = (event) => { returnFocus = event.currentTarget; dialog.hidden = false; lockScroll(); closer?.focus(); };
  const close = () => { dialog.hidden = true; unlockScroll(); returnFocus?.focus(); };
  openers.forEach((button) => button.addEventListener('click', open));
  closer?.addEventListener('click', close);
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
  dialog.addEventListener('keydown', trap);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !dialog.hidden) close(); });
}
```

```js
// src/js/components/cookie-consent.js
import { safeStorage } from '../core/storage.js';

export function initCookieConsent({ storage = safeStorage } = {}) {
  const banner = document.querySelector('[data-cookie-banner]');
  if (!banner) return;
  const choice = storage.get('cookie-consent');
  banner.hidden = Boolean(choice);
  const choose = (value) => { storage.set('cookie-consent', value); banner.hidden = true; };
  banner.querySelector('[data-cookie-reject]')?.addEventListener('click', () => choose('rejected'));
  banner.querySelector('[data-cookie-accept]')?.addEventListener('click', () => choose('accepted-essential-only'));
  document.querySelectorAll('[data-cookie-settings]').forEach((button) => button.addEventListener('click', () => { banner.hidden = false; }));
}
```

```js
// src/js/components/mobile-menu.js
import { createFocusTrap } from '../core/focus-trap.js';
import { lockScroll, unlockScroll } from '../core/scroll-lock.js';
export function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#main-menu');
  if (!toggle || !menu) return;
  const trap = createFocusTrap(menu);
  const close = () => { toggle.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open'); unlockScroll(); toggle.focus(); };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    if (open) lockScroll(); else unlockScroll();
    if (open) menu.querySelector('a,button')?.focus();
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  menu.addEventListener('keydown', trap);
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', close));
}
```

```js
// src/js/components/tabs.js
export function initTabs() {
  document.querySelectorAll('[role="tablist"]').forEach((list) => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const activate = (tab) => {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(item.getAttribute('aria-controls'));
        if (panel) panel.hidden = !selected;
      });
    };
    tabs.forEach((tab) => tab.addEventListener('click', () => activate(tab)));
  });
}
```

```js
// src/js/components/disclosures.js
export function initDisclosures() {
  document.querySelectorAll('[data-disclosure-button]').forEach((button) => {
    button.addEventListener('click', () => {
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      if (panel) panel.hidden = !open;
    });
  });
}
```

```js
// src/js/components/vision-mode.js
import { safeStorage } from '../core/storage.js';
export function initVisionMode() {
  const button = document.querySelector('[data-vision-toggle]');
  if (!button) return;
  const apply = (enabled) => { document.documentElement.classList.toggle('vision-mode', enabled); button.setAttribute('aria-pressed', String(enabled)); };
  apply(safeStorage.get('vision-mode') === 'on');
  button.addEventListener('click', () => { const enabled = !document.documentElement.classList.contains('vision-mode'); apply(enabled); safeStorage.set('vision-mode', enabled ? 'on' : 'off'); });
}
```

```js
// src/js/core/focus-trap.js
export function createFocusTrap(container) {
  return (event) => {
    if (event.key !== 'Tab') return;
    const items = [...container.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')];
    if (!items.length) return;
    const first = items[0]; const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
}
```

```js
// src/js/main.js
import { createAppointmentProvider } from './core/appointment-provider.js';
import { initCookieConsent } from './components/cookie-consent.js';
import { initDialog } from './components/dialog.js';
import { initDisclosures } from './components/disclosures.js';
import { initMobileMenu } from './components/mobile-menu.js';
import { initTabs } from './components/tabs.js';
import { initVisionMode } from './components/vision-mode.js';

initMobileMenu();
initDialog({ provider: createAppointmentProvider() });
initDisclosures();
initTabs();
initVisionMode();
initCookieConsent();
```

- [ ] **Step 5: Run all interaction tests**

Run: `pnpm test tests/js/interactions.test.js && pnpm test`  
Expected: PASS; no unhandled jsdom errors.

- [ ] **Step 6: Commit interactions**

```bash
git add src/js tests/js/interactions.test.js
git commit -m "feat: add accessible website interactions"
```

---

### Task 5: Design system, responsive shell, and smooth mobile menu

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/base.css`
- Create: `src/styles/layout.css`
- Create: `src/styles/components.css`
- Create: `src/styles/pages.css`
- Create: `src/styles/main.css`
- Create: `tests/styles/design-system.test.js`

**Interfaces:**
- Consumes: class names emitted by `renderPage` and page bodies.
- Produces: responsive visual system with CSS variables, menu/dialog/cookie/vision/reduced-motion states.

- [ ] **Step 1: Write the failing design-token contract test**

```js
// tests/styles/design-system.test.js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('design system contract', () => {
  it('declares approved colors and accessibility modes', () => {
    const css = readFileSync('src/styles/tokens.css', 'utf8') + readFileSync('src/styles/components.css', 'utf8');
    expect(css).toContain('--color-primary: #2879d8');
    expect(css).toContain('.vision-mode');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
```

- [ ] **Step 2: Verify the style test fails**

Run: `pnpm test tests/styles/design-system.test.js`  
Expected: FAIL because CSS files do not exist.

- [ ] **Step 3: Implement CSS tokens and base rules**

```css
/* src/styles/tokens.css */
:root {
  --color-primary: #2879d8;
  --color-primary-strong: #1665be;
  --color-text: #132238;
  --color-muted: #536173;
  --color-blue-soft: #eef6ff;
  --color-warm: #f8f3ed;
  --color-border: #dfe7f0;
  --color-white: #ffffff;
  --shadow-card: 0 18px 52px rgba(34, 74, 120, 0.09);
  --radius-sm: 12px;
  --radius-md: 18px;
  --radius-lg: 28px;
  --container: 1180px;
  --header-height: 92px;
}
```

```css
/* src/styles/base.css */
*,*::before,*::after{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;color:var(--color-text);background:var(--color-white);font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.6}body.is-locked{overflow:hidden}img{max-width:100%;height:auto}a{color:inherit}button,input,select,textarea{font:inherit}button,a{touch-action:manipulation}h1,h2,h3{font-family:Georgia,"Times New Roman",serif;line-height:1.15;font-weight:500}h1{font-size:clamp(2.5rem,6vw,5.25rem)}h2{font-size:clamp(2rem,4vw,3.4rem)}:focus-visible{outline:3px solid #0b5cab;outline-offset:4px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.skip-link{position:fixed;z-index:9999;left:1rem;top:1rem;transform:translateY(-180%);background:#000;color:#fff;padding:.75rem 1rem}.skip-link:focus{transform:none}
```

- [ ] **Step 4: Implement layout and component styles**

```css
/* src/styles/layout.css */
.container{width:min(calc(100% - 2rem),var(--container));margin-inline:auto}.section{padding:clamp(4rem,8vw,7.5rem) 0}.topbar{min-height:42px;display:flex;gap:2rem;align-items:center;justify-content:center;background:#f7f9fc;font-size:.875rem}.header-main{width:min(calc(100% - 2rem),var(--container));min-height:var(--header-height);margin:auto;display:flex;align-items:center;justify-content:space-between;gap:2rem}.brand{display:flex;align-items:center;gap:.85rem;text-decoration:none;font-weight:700}.site-header nav{display:flex;align-items:center;gap:1.4rem}.site-header nav a{text-decoration:none;font-size:.94rem}.menu-toggle{display:none}.page-hero{min-height:430px;display:grid;align-items:center;background:linear-gradient(90deg,rgba(255,255,255,.98) 0 42%,rgba(255,255,255,.3)),var(--hero-image) center/cover}.footer-grid{display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:3rem}.site-footer{padding:4rem 0;background:#f5f8fc}.site-footer section{display:grid;align-content:start;gap:.55rem}
@media(max-width:980px){.topbar{display:none}.menu-toggle{display:inline-grid;width:48px;height:48px}.site-header nav{position:fixed;z-index:100;inset:0 0 0 15%;padding:7rem 1.5rem 2rem;display:grid;align-content:start;gap:1rem;background:#fff;transform:translateX(100%);transition:transform .28s ease}.menu-open .site-header nav{transform:none}.footer-grid{grid-template-columns:1fr}.page-hero{min-height:380px;background:linear-gradient(rgba(255,255,255,.88),rgba(255,255,255,.88)),var(--hero-image) center/cover}}
```

```css
/* src/styles/components.css */
.button{min-height:48px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--color-primary);border-radius:10px;padding:.75rem 1.25rem;text-decoration:none;cursor:pointer}.button-primary{background:linear-gradient(135deg,var(--color-primary),var(--color-primary-strong));color:#fff}.button-secondary{background:#fff;color:var(--color-primary-strong)}.card{border:1px solid var(--color-border);border-radius:var(--radius-md);background:#fff;box-shadow:var(--shadow-card)}.dialog[hidden],.cookie-banner[hidden]{display:none}.dialog{position:fixed;z-index:300;inset:0;display:grid;place-items:center;padding:1rem;background:rgba(10,28,50,.55)}.dialog__panel{width:min(100%,520px);padding:2rem;border-radius:var(--radius-md);background:#fff;box-shadow:var(--shadow-card)}.cookie-banner{position:fixed;z-index:250;right:1rem;bottom:1rem;width:min(calc(100% - 2rem),560px);padding:1.25rem;border:1px solid var(--color-border);border-radius:var(--radius-md);background:#fff;box-shadow:var(--shadow-card)}.vision-mode{font-size:120%;filter:contrast(1.15)}.vision-mode a{text-decoration:underline;text-decoration-thickness:2px}.vision-mode .card{box-shadow:none;border-width:2px}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
```

```css
/* src/styles/pages.css */
.page-hero--home{--hero-image:image-set(url('/assets/images/hero-home.avif') type('image/avif'),url('/assets/images/hero-home.webp') type('image/webp'))}.page-hero--about{--hero-image:image-set(url('/assets/images/hero-about.avif') type('image/avif'),url('/assets/images/hero-about.webp') type('image/webp'))}.page-hero--services{--hero-image:image-set(url('/assets/images/hero-services.avif') type('image/avif'),url('/assets/images/hero-services.webp') type('image/webp'))}.page-hero--specialists{--hero-image:image-set(url('/assets/images/hero-specialists.avif') type('image/avif'),url('/assets/images/hero-specialists.webp') type('image/webp'))}.page-hero--reviews{--hero-image:image-set(url('/assets/images/hero-reviews.avif') type('image/avif'),url('/assets/images/hero-reviews.webp') type('image/webp'))}.page-hero--vacancies{--hero-image:image-set(url('/assets/images/hero-vacancies.avif') type('image/avif'),url('/assets/images/hero-vacancies.webp') type('image/webp'))}.page-hero--contacts{--hero-image:image-set(url('/assets/images/hero-contacts.avif') type('image/avif'),url('/assets/images/hero-contacts.webp') type('image/webp'))}.service-tabs{display:grid;grid-template-columns:280px 1fr;gap:2rem}.service-tabs [role="tablist"]{display:grid;align-content:start}.staff-list,.review-grid{display:grid;gap:1rem}.staff-card{display:grid;grid-template-columns:96px 1fr;gap:1.5rem;padding:1.5rem}.staff-avatar{width:96px;height:96px;display:grid;place-items:center;border-radius:50%;background:var(--color-blue-soft);color:var(--color-primary-strong);font-size:1.5rem}.notice{padding:1.25rem;border-radius:var(--radius-md);background:var(--color-warm)}@media(max-width:760px){.service-tabs{grid-template-columns:1fr}.service-tabs [role="tablist"]{display:flex;overflow-x:auto}.staff-card{grid-template-columns:64px 1fr}.staff-avatar{width:64px;height:64px}}
```

```css
/* src/styles/main.css */
@import './tokens.css';
@import './base.css';
@import './layout.css';
@import './components.css';
@import './pages.css';
```

- [ ] **Step 5: Run style and full tests**

Run: `pnpm test tests/styles/design-system.test.js && pnpm test`  
Expected: PASS.

- [ ] **Step 6: Commit the design system**

```bash
git add src/styles tests/styles/design-system.test.js
git commit -m "feat: add responsive clinic design system"
```

---

### Task 6: Core, service, staff, price, review, vacancy, and contact pages

**Files:**
- Modify: `src/content/page-manifest.js`
- Create: `src/content/core-pages.js`
- Create: `src/content/service-pages.js`
- Create: `src/content/legal-pages.js` as an empty boundary for Task 7
- Create: `tests/content/public-pages.test.js`
- Regenerate: `index.html`, `about.html`, `services.html`, `specialists.html`, `prices.html`, `reviews.html`, `vacancies.html`, `contacts.html`

**Interfaces:**
- Consumes: `SERVICES`, `STAFF`, `INCOMPLETE_CONTENT`, clinic contacts.
- Produces: nine complete public page descriptors and generated HTML entries.

- [ ] **Step 1: Write failing public-page tests**

```js
// tests/content/public-pages.test.js
import { describe, expect, it } from 'vitest';
import { PAGES } from '../../src/content/page-manifest.js';

describe('public page manifest', () => {
  it('contains every approved main route exactly once', () => {
    expect(PAGES.map((page) => page.file)).toEqual(expect.arrayContaining([
      'index.html','about.html','services.html','specialists.html','prices.html','reviews.html','vacancies.html','contacts.html',
    ]));
    expect(new Set(PAGES.map((page) => page.file)).size).toBe(PAGES.length);
  });

  it('marks incomplete legal-content pages and avoids fabricated copy', () => {
    const specialists = PAGES.find((page) => page.file === 'specialists.html');
    const prices = PAGES.find((page) => page.file === 'prices.html');
    const allCopy = PAGES.map((page) => page.body).join(' ');
    expect(specialists.noindex).toBe(true);
    expect(prices.noindex).toBe(true);
    expect(allCopy).not.toMatch(/Иванова Мария|4 500 ₽|имплантология|ортодонтия/i);
  });
});
```

- [ ] **Step 2: Verify tests fail because routes are missing**

Run: `pnpm test tests/content/public-pages.test.js`  
Expected: FAIL because the initial manifest has only two pages.

- [ ] **Step 3: Implement page body builders**

```js
// src/content/core-pages.js
import { CLINIC, CONTACTS, HOURS, LICENSE } from '../data/clinic.js';
const phones = CONTACTS.phones.map((phone) => `<a class="button button-secondary" href="${phone.href}">${phone.label}</a>`).join('');

export const CORE_PAGES = [
  { file:'index.html',title:'Стоматологическая клиника в Белгороде',description:'ООО «Стоматология Ваша улыбка»: лицензированная стоматологическая помощь в Белгороде.',heading:'Стоматология Ваша улыбка',lead:`Лицензия ${LICENSE.number} от ${LICENSE.grantedAt}.`,heroImage:'home',noindex:false,body:`<section class="section"><div class="container"><div class="card feature-grid"><article><h2>Лицензия и документы</h2><p>Действующая лицензия подтверждена государственным реестром.</p><a href="license.html">Подробнее</a></article><article><h2>Специалисты</h2><p>Сведения о сотрудниках клиники.</p><a href="specialists.html">Подробнее</a></article><article><h2>Услуги</h2><p>Только лицензированные направления.</p><a href="services.html">Подробнее</a></article></div></div></section><section class="section"><div class="container split"><div><h2>О клинике</h2><p>${CLINIC.legalName} зарегистрировано ${CLINIC.registeredSince}.</p><button class="button button-primary" data-appointment-open>Записаться на приём</button></div></div></section>` },
  { file:'about.html',title:'О клинике',description:'Реквизиты, лицензия и принципы работы ООО «Стоматология Ваша улыбка».',heading:'О клинике',lead:'Подтверждённые сведения о клинике и медицинской деятельности.',heroImage:'about',noindex:false,body:`<section class="section"><div class="container split"><article><h2>Наша миссия</h2><p>Понятная и ответственная стоматологическая помощь в пределах действующей лицензии.</p></article><article class="card"><h2>Реквизиты</h2><dl><dt>ОГРН</dt><dd>${CLINIC.ogrn}</dd><dt>ИНН</dt><dd>${CLINIC.inn}</dd><dt>Лицензия</dt><dd>${LICENSE.number}</dd></dl></article></div></section>` },
  { file:'contacts.html',title:'Контакты',description:'Адрес, телефоны, электронная почта и режим работы стоматологии в Белгороде.',heading:'Контакты',lead:'Свяжитесь с клиникой удобным способом.',heroImage:'contacts',noindex:false,body:`<section class="section"><div class="container split"><article><h2>Как связаться</h2><p>${CLINIC.activityAddress}</p>${phones}<a href="${CONTACTS.emailHref}">${CONTACTS.email}</a></article><article class="card"><h2>Режим работы</h2><p>${HOURS.weekdays.label}: ${HOURS.weekdays.value}</p><p>${HOURS.saturday.label}: ${HOURS.saturday.value}</p><p>${HOURS.sunday.label}: ${HOURS.sunday.value}</p><a class="button button-secondary" href="https://yandex.ru/maps/?text=${encodeURIComponent(CLINIC.activityAddress)}" rel="noopener noreferrer">Открыть адрес на карте</a></article></div></section>` },
];
```

```js
// src/content/service-pages.js
import { SERVICES } from '../data/services.js';
import { INCOMPLETE_CONTENT, STAFF } from '../data/staff.js';

const servicePanels = SERVICES.map((service, index) => `<article class="card service-panel"><button type="button" data-disclosure-button aria-expanded="${index === 0}" aria-controls="price-${service.slug}"><span>${service.title}</span></button><div id="price-${service.slug}"${index === 0 ? '' : ' hidden'}><p>${service.summary}</p><ul>${service.items.map((item) => `<li>${item}</li>`).join('')}</ul><strong>${service.priceStatus}</strong></div></article>`).join('');
const serviceTabs = `<div class="service-tabs"><div role="tablist" aria-label="Направления стоматологии">${SERVICES.map((service,index) => `<button role="tab" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" aria-controls="tab-${service.slug}">${service.title}</button>`).join('')}</div><div>${SERVICES.map((service,index) => `<section id="tab-${service.slug}" role="tabpanel"${index === 0 ? '' : ' hidden'}><h2>${service.title}</h2><p>${service.summary}</p><ul>${service.items.map((item) => `<li>${item}</li>`).join('')}</ul><strong>${service.priceStatus}</strong></section>`).join('')}</div></div>`;
const staffCards = STAFF.map((person) => `<article class="card staff-card"><div class="staff-avatar" aria-hidden="true">${person.initials}</div><div><h2>${person.name}</h2><p>${person.role}</p><p class="notice">${person.credentialNotice}</p></div></article>`).join('');

export const SERVICE_PAGES = [
  { file:'services.html',title:'Наши услуги',description:'Лицензированные стоматологические услуги ООО «Стоматология Ваша улыбка».',heading:'Наши услуги',lead:'Терапевтическая, ортопедическая стоматология и доврачебная помощь.',heroImage:'services',noindex:false,body:`<section class="section"><div class="container">${serviceTabs}</div></section>` },
  { file:'specialists.html',title:'Специалисты',description:'Сотрудники ООО «Стоматология Ваша улыбка».',heading:'Специалисты',lead:'Подтверждённый список сотрудников клиники.',heroImage:'specialists',noindex:INCOMPLETE_CONTENT.specialists.noindex,body:`<section class="section"><div class="container staff-list">${staffCards}</div></section>` },
  { file:'prices.html',title:'Цены',description:'Информация о стоимости стоматологических услуг.',heading:'Цены',lead:'Прейскурант готовится к публикации.',heroImage:'services',noindex:INCOMPLETE_CONTENT.prices.noindex,body:`<section class="section"><div class="container"><p class="notice">${INCOMPLETE_CONTENT.prices.reason}</p>${servicePanels}</div></section>` },
  { file:'reviews.html',title:'Отзывы',description:'Информация об отзывах пациентов стоматологической клиники.',heading:'Отзывы',lead:'Подтверждённые отзывы пока не опубликованы.',heroImage:'reviews',noindex:false,body:'<section class="section"><div class="container"><div class="notice"><h2>Мы не публикуем вымышленные отзывы</h2><p>Чтобы поделиться мнением, свяжитесь с клиникой по официальным контактам.</p></div></div></section>' },
  { file:'vacancies.html',title:'Вакансии',description:'Актуальная информация о вакансиях стоматологической клиники.',heading:'Вакансии',lead:'В переданных данных нет открытых вакансий.',heroImage:'vacancies',noindex:false,body:'<section class="section"><div class="container"><div class="notice"><h2>Открытые вакансии не заявлены</h2><p>Резюме можно направить на официальный электронный адрес клиники.</p><a class="button button-secondary" href="mailto:stomdemidov@mail.ru?subject=Резюме">Отправить резюме</a></div></div></section>' },
];
```

- [ ] **Step 4: Merge page arrays and generate HTML**

```js
// src/content/page-manifest.js
import { CORE_PAGES } from './core-pages.js';
import { SERVICE_PAGES } from './service-pages.js';
import { LEGAL_PAGES } from './legal-pages.js';
export const PAGES = Object.freeze([...CORE_PAGES, ...SERVICE_PAGES, ...LEGAL_PAGES]);
```

Create the Task 6 boundary module below; Task 7 replaces its empty array with the approved patient-information pages.

```js
// src/content/legal-pages.js
export const LEGAL_PAGES = [];
```

Run: `pnpm generate && pnpm test tests/content/public-pages.test.js`  
Expected: eight main HTML files exist and both tests PASS.

- [ ] **Step 5: Commit public pages**

```bash
git add src/content index.html about.html services.html specialists.html prices.html reviews.html vacancies.html contacts.html patients.html tests/content/public-pages.test.js
git commit -m "feat: add clinic public pages"
```

---

### Task 7: Patient information, privacy, and source documents

**Files:**
- Create: `src/data/legal.js`
- Modify: `src/content/legal-pages.js`
- Create: `public/documents/license-registry-extract.pdf`
- Create: `public/documents/ogrn-certificate.pdf`
- Create: `public/assets/qr/legal-resources.png`
- Create: `tests/content/legal-pages.test.js`
- Regenerate: `patients.html`, `license.html`, `payment.html`, `benefits.html`, `waiting-periods.html`, `oms.html`, `informed-consent.html`, `guarantees.html`, `complaints.html`, `standards.html`, `personal-data-consent.html`, `privacy.html`, `cookies.html`, and all previous HTML files.

**Interfaces:**
- Consumes: supplied DOCX/PDF facts and official links `https://pravo.gov.ru/`, `https://cr.minzdrav.gov.ru/`.
- Produces: `LEGAL_SECTIONS`, `LEGAL_PAGES`, patient-hub links, downloadable public PDFs.

- [ ] **Step 1: Write failing legal-content tests**

```js
// tests/content/legal-pages.test.js
import { describe, expect, it } from 'vitest';
import { LEGAL_PAGES } from '../../src/content/legal-pages.js';

describe('patient information pages', () => {
  it('covers every approved patient-information topic', () => {
    expect(LEGAL_PAGES.map((page) => page.file)).toEqual(expect.arrayContaining([
      'patients.html','license.html','payment.html','benefits.html','waiting-periods.html','oms.html','informed-consent.html','guarantees.html','complaints.html','standards.html','personal-data-consent.html','privacy.html','cookies.html',
    ]));
  });

  it('publishes exact key facts and official destinations', () => {
    const copy = LEGAL_PAGES.map((page) => page.body).join(' ');
    expect(copy).toContain('Л041-01154-31/00551666');
    expect(copy).toContain('Максимальный срок ожидания');
    expect(copy).toContain('30 дней');
    expect(copy).toContain('не участвует в реализации территориальной программы');
    expect(copy).toContain('https://pravo.gov.ru/');
    expect(copy).toContain('https://cr.minzdrav.gov.ru/');
  });
});
```

- [ ] **Step 2: Verify legal tests fail**

Run: `pnpm test tests/content/legal-pages.test.js`  
Expected: FAIL because the legal page array is empty.

- [ ] **Step 3: Implement legal data and pages**

```js
// src/data/legal.js
export const LEGAL_SECTIONS = Object.freeze({
  payment: 'Оплата платных медицинских услуг осуществляется наличным и безналичным расчётом по выбору потребителя.',
  waiting: 'Максимальный срок ожидания предоставления медицинских услуг составляет 30 дней с момента записи на приём.',
  oms: 'ООО «Стоматология Ваша улыбка» не участвует в реализации территориальной программы государственных гарантий бесплатного оказания гражданам медицинской помощи.',
  ids: 'Перед оказанием медицинских услуг пациент или его законный представитель подписывает информированное добровольное согласие, содержащее сведения о методах медицинской помощи, связанных рисках, вариантах вмешательства, последствиях и предполагаемых результатах.',
  benefits: [
    ['Инвалиды войны', '10%'], ['Участники Великой Отечественной войны', '10%'], ['Ветераны боевых действий', '10%'],
    ['Военнослужащие, проходившие службу в указанный законом период 1941–1945 годов', '10%'],
    ['Лица со знаком «Жителю блокадного Ленинграда» или «Житель осаждённого Севастополя»', '10%'],
    ['Работники объектов обороны и члены экипажей транспортного флота, указанные в документе клиники', '10%'],
    ['Члены семей погибших инвалидов войны, участников ВОВ и ветеранов боевых действий', '10%'], ['Инвалиды', '5%'], ['Ветераны и участники СВО', '10%'],
  ],
  complaints: [
    { name: 'Управление Роспотребнадзора по Белгородской области', address: '308023, Белгородская область, г. Белгород, ул. Железнякова, 2', phone: '8 (4722) 34-03-16' },
    { name: 'Территориальный орган Росздравнадзора по Белгородской области', address: '308000, г. Белгород, ул. Мичурина, 56, этаж 5', phone: '(4722) 31-05-11' },
  ],
  guaranteeRows: [
    ['Пломба из стеклоиономерного цемента, I класс по Блэку', '6 месяцев', '1 год'],
    ['Пломба из стеклоиономерного цемента, II–V классы по Блэку', '9 месяцев', '1 год'],
    ['Светоотверждаемая пломба, I класс по Блэку', '1 год', '2 года'],
    ['Светоотверждаемая пломба, II–V классы по Блэку', '9 месяцев', '1 год'],
    ['Керамические виниры', '1 год', '2 года'], ['Временные пластмассовые коронки', '3 месяца', '6 месяцев'],
    ['Керамические коронки, коронки и вкладки E-max', '1 год', '2 года'], ['Металлокерамические коронки и мостовидные протезы', '2 года', '5 лет'],
    ['Коронки и мостовидные протезы из диоксида циркония', '2 года', '5 лет'], ['Съёмный пластиночный протез', '1 год', '2 года'],
    ['Бюгельные и условно-съёмные протезы', '2 года', '5 лет'],
  ],
});
```

```js
// src/content/legal-pages.js
import { CLINIC, CONTACTS, LICENSE } from '../data/clinic.js';
import { LEGAL_SECTIONS } from '../data/legal.js';
const article = (title, content) => `<section class="section legal-article"><div class="container"><article><h2>${title}</h2>${content}</article></div></section>`;
const rows = LEGAL_SECTIONS.guaranteeRows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('');
const benefits = LEGAL_SECTIONS.benefits.map(([name, discount]) => `<li><span>${name}</span><strong>${discount}</strong></li>`).join('');
const complaints = LEGAL_SECTIONS.complaints.map((item) => `<article class="card"><h2>${item.name}</h2><p>${item.address}</p><p>${item.phone}</p></article>`).join('');

export const LEGAL_PAGES = [
  {file:'patients.html',title:'Информация для пациентов',description:'Лицензия, гарантии, льготы, сроки ожидания и правовая информация для пациентов.',heading:'Информация для пациентов',lead:'Документы и сведения об оказании медицинской помощи.',heroImage:'about',noindex:false,body:'<section class="section"><div class="container patient-grid"><a class="card" href="license.html">Лицензия и реквизиты</a><a class="card" href="payment.html">Оплата услуг</a><a class="card" href="benefits.html">Перечень льгот</a><a class="card" href="waiting-periods.html">Сроки ожидания</a><a class="card" href="oms.html">Информация об ОМС</a><a class="card" href="informed-consent.html">Информированное согласие</a><a class="card" href="guarantees.html">Гарантии</a><a class="card" href="complaints.html">Обращения и жалобы</a><a class="card" href="standards.html">Стандарты и клинические рекомендации</a><a class="card" href="privacy.html">Политика конфиденциальности</a></div></section>'},
  {file:'license.html',title:'Лицензия и реквизиты',description:'Действующая лицензия и реквизиты стоматологической клиники.',heading:'Лицензия и реквизиты',heroImage:'about',noindex:false,body:article('Действующая лицензия',`<dl><dt>Номер</dt><dd>${LICENSE.number}</dd><dt>Дата предоставления</dt><dd>${LICENSE.grantedAt}</dd><dt>Лицензирующий орган</dt><dd>${LICENSE.authority}</dd><dt>ОГРН</dt><dd>${CLINIC.ogrn}</dd><dt>ИНН</dt><dd>${CLINIC.inn}</dd></dl><a href="documents/license-registry-extract.pdf">Открыть выписку из реестра лицензий</a><a href="documents/ogrn-certificate.pdf">Открыть свидетельство ОГРН</a>`)},
  {file:'payment.html',title:'Оплата услуг',description:'Способы оплаты платных медицинских услуг.',heading:'Оплата услуг',heroImage:'services',noindex:false,body:article('Способы оплаты',`<p>${LEGAL_SECTIONS.payment}</p>`)},
  {file:'benefits.html',title:'Перечень льгот',description:'Категории пациентов, имеющих право на льготы.',heading:'Перечень льгот',heroImage:'about',noindex:false,body:article('Категории и размер скидки',`<ul class="benefit-list">${benefits}</ul>`)},
  {file:'waiting-periods.html',title:'Сроки ожидания услуг',description:'Максимальный срок ожидания платных медицинских услуг.',heading:'Сроки ожидания услуг',heroImage:'services',noindex:false,body:article('Максимальный срок ожидания',`<p>${LEGAL_SECTIONS.waiting}</p>`)},
  {file:'oms.html',title:'Информация об ОМС',description:'Участие клиники в территориальной программе государственных гарантий.',heading:'Информация об ОМС',heroImage:'about',noindex:false,body:article('Территориальная программа',`<p>${LEGAL_SECTIONS.oms}</p>`)},
  {file:'informed-consent.html',title:'Информированное добровольное согласие',description:'Информация о подписании ИДС перед медицинским вмешательством.',heading:'Информированное добровольное согласие',heroImage:'services',noindex:false,body:article('Перед оказанием услуг',`<p>${LEGAL_SECTIONS.ids}</p>`)},
  {file:'guarantees.html',title:'Гарантии',description:'Гарантийные сроки и сроки службы стоматологических работ.',heading:'Положение о гарантиях',heroImage:'about',noindex:false,body:article('Гарантийные сроки и сроки службы',`<div class="table-scroll"><table><thead><tr><th>Вид работы</th><th>Гарантия</th><th>Срок службы</th></tr></thead><tbody>${rows}</tbody></table></div><p>Сроки могут изменяться в случаях и порядке, предусмотренных положением клиники и законодательством. Для рассмотрения замечания пациент обращается в клинику и подаёт письменное заявление.</p>`)},
  {file:'complaints.html',title:'Обращения и жалобы',description:'Способы направления обращений в клинику и государственные органы.',heading:'Обращения и жалобы',heroImage:'contacts',noindex:false,body:article('Куда обратиться',`${complaints}<h2>Обращение в клинику</h2><p>${CLINIC.complaintsPostalAddress}</p><a href="${CONTACTS.emailHref}">${CONTACTS.email}</a>`)},
  {file:'standards.html',title:'Стандарты и клинические рекомендации',description:'Официальные источники стандартов медицинской помощи и клинических рекомендаций.',heading:'Стандарты и клинические рекомендации',heroImage:'services',noindex:false,body:article('Официальные ресурсы','<p><a href="https://pravo.gov.ru/" rel="noopener noreferrer">Официальный интернет-портал правовой информации</a></p><p><a href="https://cr.minzdrav.gov.ru/" rel="noopener noreferrer">Клинические рекомендации Минздрава России</a></p><img src="assets/qr/legal-resources.png" alt="QR-коды официального портала правовой информации и клинических рекомендаций Минздрава">')},
  {file:'personal-data-consent.html',title:'Согласие на обработку персональных данных',description:'Условия согласия на обработку данных при будущей онлайн-записи.',heading:'Согласие на обработку персональных данных',heroImage:'about',noindex:false,body:article('Условия согласия',`<p>При появлении формы онлайн-записи согласие будет распространяться на имя, телефон и адрес электронной почты с целью записи на приём. До подключения МИС сайт не собирает эти сведения.</p><p>Отзыв согласия направляется оператору по адресу: ${CLINIC.registryAddress}.</p>`)},
  {file:'privacy.html',title:'Политика конфиденциальности',description:'Политика обработки и защиты персональных данных на сайте клиники.',heading:'Политика конфиденциальности',heroImage:'about',noindex:false,body:article('Оператор и фактическая обработка',`<p>Оператор: ${CLINIC.legalName}, ОГРН ${CLINIC.ogrn}, ИНН ${CLINIC.inn}, адрес ${CLINIC.registryAddress}.</p><p>До подключения МИС сайт не принимает формы с персональными данными. При переходе по ссылкам телефона или электронной почты взаимодействие происходит средствами устройства пользователя.</p><p>Запросы направляются по адресу <a href="${CONTACTS.emailHref}">${CONTACTS.email}</a>.</p>`)},
  {file:'cookies.html',title:'Использование cookies',description:'Сведения о необходимых технологиях хранения настроек сайта.',heading:'Cookies и локальное хранение',heroImage:'about',noindex:false,body:article('Какие настройки сохраняются','<p>Сайт локально сохраняет выбор cookie-настроек и включение версии для слабовидящих. Аналитика, рекламные идентификаторы, удалённые шрифты и внешние карты не загружаются.</p><button class="button button-secondary" type="button" data-cookie-settings>Изменить настройки</button>')},
];
```

- [ ] **Step 4: Copy public source files and regenerate pages**

Run:

```powershell
New-Item -ItemType Directory -Force public/documents, public/assets/qr | Out-Null
Copy-Item -LiteralPath 'C:\Users\bahti\Downloads\Gmail (3)\Выписка из реестра лицензий.pdf' -Destination 'public\documents\license-registry-extract.pdf'
Copy-Item -LiteralPath 'C:\Users\bahti\Downloads\Gmail (3)\огрн.pdf' -Destination 'public\documents\ogrn-certificate.pdf'
Copy-Item -LiteralPath 'C:\Users\bahti\Downloads\Gmail (3)\attachment-file_get.png' -Destination 'public\assets\qr\legal-resources.png'
pnpm generate
```

Expected: public files exist and all 21 HTML entries are regenerated.

- [ ] **Step 5: Run legal and full tests**

Run: `pnpm test tests/content/legal-pages.test.js && pnpm test`  
Expected: PASS.

- [ ] **Step 6: Commit patient information**

```bash
git add src/data/legal.js src/content/legal-pages.js public tests/content/legal-pages.test.js *.html
git commit -m "feat: add patient and legal information pages"
```

---

### Task 8: Original clinic imagery and SVG identity

**Files:**
- Create: `public/assets/images/hero-home.webp`
- Create: `public/assets/images/hero-about.webp`
- Create: `public/assets/images/hero-services.webp`
- Create: `public/assets/images/hero-specialists.webp`
- Create: `public/assets/images/hero-reviews.webp`
- Create: `public/assets/images/hero-vacancies.webp`
- Create: `public/assets/images/hero-contacts.webp`
- Create: corresponding `.avif` files
- Create: `public/assets/icons/logo.svg`
- Create: `public/assets/icons/favicon.svg`
- Create: `tests/assets/assets.test.js`

**Interfaces:**
- Consumes: approved visual direction and screenshot references; no specialist portraits.
- Produces: seven distinct locally hosted hero images and original tooth identity.

- [ ] **Step 1: Write the failing asset-presence test**

```js
// tests/assets/assets.test.js
import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const names = ['home','about','services','specialists','reviews','vacancies','contacts'];
describe('local visual assets', () => {
  it.each(names)('has a non-trivial %s hero in WebP and AVIF', (name) => {
    for (const ext of ['webp','avif']) {
      const path = `public/assets/images/hero-${name}.${ext}`;
      expect(existsSync(path)).toBe(true);
      expect(statSync(path).size).toBeGreaterThan(20_000);
    }
  });
  it('has an original local SVG logo', () => {
    expect(existsSync('public/assets/icons/logo.svg')).toBe(true);
  });
});
```

- [ ] **Step 2: Verify asset tests fail**

Run: `pnpm test tests/assets/assets.test.js`  
Expected: FAIL because hero assets do not exist.

- [ ] **Step 3: Generate seven distinct interior images**

Use the image-generation skill with this shared direction and a different composition for every destination:

```text
Photorealistic premium but welcoming private dental clinic interior in Belgorod, Russia; white and warm ivory palette with restrained pale blue accents; soft daylight; clean contemporary medical environment; no people, no text, no logos, no readable brands, no signage; wide horizontal editorial architecture photography; generous negative space for a Russian website hero; distinct room and composition for the requested page.
```

Page-specific compositions: home — dental treatment room; about — reception; services — modern treatment chair and equipment; specialists — calm consultation room; reviews — bright waiting lounge; vacancies — staff room/corridor without people; contacts — exterior entrance/reception approach.

Save lossless generation outputs outside `public/`, inspect them, then convert approved images using the ImageMagick conversion skill:

```powershell
magick input.png -auto-orient -strip -resize '1920x1080^' -gravity center -extent 1920x1080 -quality 82 public/assets/images/hero-home.webp
magick input.png -auto-orient -strip -resize '1920x1080^' -gravity center -extent 1920x1080 -quality 55 public/assets/images/hero-home.avif
```

Repeat with the exact destination filename for all seven images.

- [ ] **Step 4: Create the local SVG logo and favicon**

```svg
<!-- public/assets/icons/logo.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <path d="M18 7c-8 2-12 11-9 22 2 8 7 13 9 25 1 5 6 5 8 0l4-12c1-3 3-3 4 0l4 12c2 5 7 5 8 0 2-12 7-17 9-25 3-11-1-20-9-22-6-2-10 2-14 2S24 5 18 7Z" stroke="#2879D8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M23 11c5 3 13 3 18 0" stroke="#7EB8F4" stroke-width="2" stroke-linecap="round"/>
</svg>
```

Create `favicon.svg` from the same paths with a square viewBox and no text.

- [ ] **Step 5: Run asset and full tests**

Run: `pnpm test tests/assets/assets.test.js && pnpm test`  
Expected: PASS; every hero has WebP/AVIF and logo exists.

- [ ] **Step 6: Commit visual assets**

```bash
git add public/assets tests/assets/assets.test.js
git commit -m "feat: add original clinic visual assets"
```

---

### Task 9: SEO outputs and production verifier

**Files:**
- Create: `scripts/generate-seo.mjs`
- Create: `scripts/verify-site.mjs`
- Create: `public/robots.txt`
- Create: `public/sitemap.xml`
- Modify: `package.json`
- Modify: `scripts/generate-pages.mjs`
- Create: `tests/scripts/site-verifier.test.js`

**Interfaces:**
- Consumes: `PAGES`, generated `dist/*.html`.
- Produces: `generateSeo(pages)`, production verification exit status 0/1, sitemap excluding noindex pages.

- [ ] **Step 1: Write failing SEO/verifier tests**

```js
// tests/scripts/site-verifier.test.js
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { verifyDirectory } from '../../scripts/verify-site.mjs';
import { generateSeo } from '../../scripts/generate-seo.mjs';

describe('production site verifier', () => {
  it('rejects pages without one h1 or meta description', () => {
    const dir = mkdtempSync(join(tmpdir(), 'clinic-site-'));
    writeFileSync(join(dir, 'index.html'), '<html><head></head><body><h2>Нет h1</h2></body></html>');
    expect(verifyDirectory(dir).errors.length).toBeGreaterThan(0);
  });

  it('omits noindex pages from sitemap', () => {
    const xml = generateSeo([{file:'index.html',noindex:false},{file:'prices.html',noindex:true}]).sitemap;
    expect(xml).toContain('index.html');
    expect(xml).not.toContain('prices.html');
  });
});
```

- [ ] **Step 2: Verify tests fail**

Run: `pnpm test tests/scripts/site-verifier.test.js`  
Expected: FAIL because verifier modules do not exist.

- [ ] **Step 3: Implement SEO generation**

```js
// scripts/generate-seo.mjs
export function generateSeo(pages) {
  const urls = pages.filter((page) => !page.noindex).map((page) => `  <url><loc>/${page.file === 'index.html' ? '' : page.file}</loc></url>`).join('\n');
  return {
    robots: 'User-agent: *\nAllow: /\nDisallow: /prices.html\nDisallow: /specialists.html\nSitemap: /sitemap.xml\n',
    sitemap: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  };
}
```

Update `generate-pages.mjs` after page writes:

```js
import { mkdir, writeFile } from 'node:fs/promises';
import { generateSeo } from './generate-seo.mjs';
const publicDir = resolve(import.meta.dirname, '..', 'public');
await mkdir(publicDir, { recursive: true });
const seo = generateSeo(PAGES);
await writeFile(resolve(publicDir, 'robots.txt'), seo.robots, 'utf8');
await writeFile(resolve(publicDir, 'sitemap.xml'), seo.sitemap, 'utf8');
```

- [ ] **Step 4: Implement the production verifier**

```js
// scripts/verify-site.mjs
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

export function verifyDirectory(directory) {
  const errors = [];
  const files = readdirSync(directory).filter((name) => name.endsWith('.html'));
  for (const file of files) {
    const html = readFileSync(resolve(directory, file), 'utf8');
    const { document } = new JSDOM(html).window;
    if (document.querySelectorAll('h1').length !== 1) errors.push(`${file}: expected exactly one h1`);
    if (!document.querySelector('meta[name="description"]')?.content.trim()) errors.push(`${file}: missing meta description`);
    if (!document.title.trim()) errors.push(`${file}: missing title`);
    for (const link of document.querySelectorAll('a[href]')) {
      const href = link.getAttribute('href');
      if (/^(https?:|mailto:|tel:|#)/.test(href)) continue;
      const local = href.split('#')[0].split('?')[0];
      if (local && !existsSync(resolve(directory, local))) errors.push(`${file}: broken link ${href}`);
    }
  }
  return { errors, filesChecked: files.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = verifyDirectory(resolve(process.argv[2] || 'dist'));
  if (result.errors.length) { console.error(result.errors.join('\n')); process.exitCode = 1; }
  else console.log(`Verified ${result.filesChecked} HTML pages`);
}
```

- [ ] **Step 5: Generate, test, build, and verify**

Run: `pnpm generate && pnpm test tests/scripts/site-verifier.test.js && pnpm build && pnpm verify:site`  
Expected: tests PASS, Vite exits 0, verifier prints the number of checked pages with no errors.

- [ ] **Step 6: Commit SEO and verification**

```bash
git add scripts package.json public/robots.txt public/sitemap.xml tests/scripts/site-verifier.test.js
git commit -m "feat: add SEO output and site verification"
```

---

### Task 10: Content handoff, full QA, and final production build

**Files:**
- Create: `README.md`
- Create: `CONTENT_CHECKLIST.md`
- Modify: CSS/HTML/JS only for defects demonstrated by verification.

**Interfaces:**
- Consumes: complete site and all test/build commands.
- Produces: documented handoff and fresh evidence for completion.

- [ ] **Step 1: Write the handoff documents**

````md
<!-- README.md -->
# Сайт ООО «Стоматология Ваша улыбка»

## Запуск

```powershell
pnpm install
pnpm dev
```

Production-сборка: `pnpm build`. Полная проверка: `pnpm verify`.

## Обновление данных

- реквизиты и контакты: `src/data/clinic.js`;
- услуги и цены: `src/data/services.js`;
- сотрудники: `src/data/staff.js`;
- юридическая информация: `src/data/legal.js` и `src/content/legal-pages.js`.

После изменения данных выполнить `pnpm generate`, затем `pnpm verify`.

## Подключение МИС

Заменить телефонный адаптер в `src/js/core/appointment-provider.js`. До подключения сайт не отправляет персональные данные.
````

```md
<!-- CONTENT_CHECKLIST.md -->
# Что необходимо получить до публичного релиза без ограничений

- [ ] Утверждённый прейскурант с наименованиями и ценами услуг.
- [ ] Образование каждого медицинского работника.
- [ ] Сведения об аккредитации или сертификате каждого медицинского работника.
- [ ] Стаж по специальности каждого медицинского работника.
- [ ] Реальный домен для canonical URL и полного адреса сайта в политике.
- [ ] Подтверждённые отзывы, если клиника решит их публиковать.
- [ ] Актуальные вакансии, если клиника решит их публиковать.
- [ ] Документация и параметры подключения МИС.

После получения первых четырёх пунктов убрать `noindex` со страниц специалистов и цен и добавить их в карту сайта.
```

- [ ] **Step 2: Run the complete automated verification**

Run: `pnpm verify`  
Expected: all Vitest tests PASS, Vite build exits 0, every generated HTML page passes the production verifier.

- [ ] **Step 3: Start the production preview and perform browser QA**

Run: `pnpm preview --host 127.0.0.1`  
Expected: local preview URL responds successfully.

Inspect at 1440×900, 1024×768, 768×1024, 390×844, and 360×800:

- home, services, specialists, contacts, patient hub, guarantees, privacy;
- mobile menu open/close, focus return, Escape, no width jump;
- appointment dialog, phone links, Escape, focus return;
- cookie reject/accept/reopen;
- vision mode persistence;
- tab/disclosure behavior;
- no horizontal scrolling or clipped content;
- each hero image differs and contains no person, logo, brand, or text;
- reduced-motion emulation disables decorative transitions.

- [ ] **Step 4: Run accessibility and content spot checks**

Use the browser accessibility tree and console. Expected:

- one `main` and one `h1` per page;
- navigation and dialogs have accessible names;
- no duplicate IDs;
- no console errors;
- keyboard reaches every interactive element;
- legal facts match supplied files;
- network log contains no analytics, fonts, trackers, or automatic map requests.

- [ ] **Step 5: Re-run verification after any QA correction**

Run: `pnpm verify`  
Expected: all checks PASS after the final edits.

- [ ] **Step 6: Commit the handoff and verified release state**

```bash
git add README.md CONTENT_CHECKLIST.md src public *.html pnpm-lock.yaml
git commit -m "docs: finalize clinic website handoff"
```

## Plan self-review

- Spec coverage: all eleven specification sections map to Tasks 1–10.
- Data consistency: `CLINIC`, `LICENSE`, `CONTACTS`, `SERVICES`, `STAFF`, and `LEGAL_SECTIONS` names remain identical across tests, renderers, pages, and SEO output.
- Controlled incomplete states: prices and specialist qualifications are explicit, tested, noindexed, and documented for handoff.
- Privacy: no form submission, analytics, external fonts, embedded maps, or fabricated consent flow is introduced.
- Verification: unit/DOM tests, production build, link/meta verifier, browser breakpoints, accessibility tree, network log, and visual checks are all required before completion.
