# Premium Light Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перестроить главную страницу, shared header/footer и типографику сайта в утверждённом Premium Light направлении с насыщенной навигацией, локальными SVG-иконками, реальными превью документов и сохранением всех юридических/приватностных границ.

**Architecture:** Существующий генератор и manifest остаются источником 21 статической страницы. Shared chrome выносится из `render-page.js` в отдельный шаблон, иконки — в чистый локальный renderer, а насыщенная главная — в отдельный content-модуль, собранный из подтверждённых `CLINIC`, `LICENSE`, `CONTACTS`, `HOURS`, `SERVICES`, `STAFF` и `PUBLIC_DOCUMENTS`. CSS остаётся пятислойным: tokens → base → layout → components → pages.

**Tech Stack:** Vanilla HTML/CSS/ES modules, Vite 8.2.1, Vitest 4.1.10, JSDOM 26.1.0, Poppler `pdftoppm`, ImageMagick 7.

## Global Constraints

- Не добавлять вымышленные цены, квалификации, отзывы, вакансии, медицинские услуги или факты о помещениях.
- На главной публикуются только три направления из `SERVICES` и пять сотрудников из `STAFF`.
- Страницы `specialists.html` и `prices.html` сохраняют `noindex`.
- Запись остаётся phone-only: без форм, input и передачи персональных данных.
- Никаких внешних шрифтов, icon-font, CDN, аналитики, карты, iframe или трекеров.
- Большая hero-плашка заменяется подписью `Визуализация интерьера`; полностью скрывать происхождение фотограмметрических визуализаций нельзя.
- Все SVG-иконки локальные, `aria-hidden="true"`, `focusable="false"`, со смыслом, продублированным текстом.
- Контрольные ширины: 360, 390, 768, 1024, 1280 и 1440 px; minimum target 44 px; горизонтальный overflow запрещён.
- Сохраняются no-JS content/navigation fallback, vision mode и `prefers-reduced-motion`.
- Каждый production-код/bugfix проходит отдельный RED → GREEN цикл; после каждой задачи — независимое review и отдельный commit.

---

### Task 1: Local SVG icon renderer

**Files:**
- Create: `src/templates/icons.js`
- Create: `tests/templates/icons.test.js`

**Interfaces:**
- Consumes: semantic icon name and optional CSS class.
- Produces: `renderIcon(name: IconName, className?: string): string`; supported names: `document`, `team`, `tooth`, `ruble`, `calendar`, `info`, `shield`, `phone`, `pin`, `clock`, `mail`, `arrow`.

- [ ] **Step 1: Write the failing icon contract**

```js
// tests/templates/icons.test.js
import { describe, expect, it } from 'vitest';
import { renderIcon } from '../../src/templates/icons.js';

const names = ['document', 'team', 'tooth', 'ruble', 'calendar', 'info', 'shield', 'phone', 'pin', 'clock', 'mail', 'arrow'];

describe('local UI icons', () => {
  it('renders every approved name as safe decorative inline SVG', () => {
    for (const name of names) {
      const svg = renderIcon(name, 'test-icon');
      expect(svg).toContain('<svg');
      expect(svg).toContain('class="test-icon"');
      expect(svg).toContain('viewBox="0 0 24 24"');
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).toContain('focusable="false"');
      expect(svg).toContain('currentColor');
      expect(svg).not.toMatch(/<script|on\w+=|https?:/i);
    }
  });

  it('fails closed for unknown icon names', () => {
    expect(() => renderIcon('unknown')).toThrow('Unknown icon: unknown');
  });
});
```

- [ ] **Step 2: Run the focused test and capture RED**

Run: `pnpm test tests/templates/icons.test.js`  
Expected: FAIL because `src/templates/icons.js` does not exist.

- [ ] **Step 3: Implement the deterministic icon helper**

```js
// src/templates/icons.js
const ICONS = Object.freeze({
  document: '<path d="M6 2.75h8l4 4V21.25H6z"/><path d="M14 2.75v4h4M9 12h6M9 16h6"/>',
  team: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19c.4-3.2 2.2-5 5.5-5s5.1 1.8 5.5 5"/><circle cx="17" cy="9" r="2.25"/><path d="M15.5 14.5c2.8-.4 4.6 1.1 5 4"/>',
  tooth: '<path d="M12 3.2C8.8.8 4.5 2.5 4.3 7.2c-.1 2.5 1.2 4.2 2.1 6.1 1 2.1 1 7.5 3.2 7.5 1.5 0 1.3-5.2 2.4-5.2s.9 5.2 2.4 5.2c2.2 0 2.2-5.4 3.2-7.5.9-1.9 2.2-3.6 2.1-6.1C19.5 2.5 15.2.8 12 3.2z"/>',
  ruble: '<path d="M8 20V4h5.2a4.2 4.2 0 0 1 0 8.4H8M6 12.4h9M6 16h8"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2.75v4.5M17 2.75v4.5M3 9.5h18M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 10.5v6M12 7.5h.01"/>',
  shield: '<path d="M12 2.8 20 6v5.5c0 4.9-3.2 8.1-8 9.7-4.8-1.6-8-4.8-8-9.7V6z"/><path d="m8.2 12 2.4 2.4 5.2-5.2"/>',
  phone: '<path d="M7.1 3.5 4.5 5.1c-.8.5-.9 1.5-.5 2.5 2.2 5.7 6.7 10.2 12.4 12.4 1 .4 2 .3 2.5-.5l1.6-2.6-4.7-3-1.6 2c-2.7-1.3-4.8-3.4-6.1-6.1l2-1.6z"/>',
  pin: '<path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
});

export function renderIcon(name, className = 'ui-icon') {
  const content = ICONS[name];
  if (!content) throw new Error(`Unknown icon: ${name}`);
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;
}
```

- [ ] **Step 4: Run focused and full tests**

Run: `pnpm test tests/templates/icons.test.js && pnpm test`  
Expected: icon tests PASS; existing suite remains green.

- [ ] **Step 5: Commit**

```bash
git add src/templates/icons.js tests/templates/icons.test.js
git commit -m "feat: add clinic SVG icon system"
```

---

### Task 2: Real PDF document previews

**Files:**
- Create: `public/assets/documents/license-registry-extract.webp`
- Create: `public/assets/documents/ogrn-certificate.webp`
- Modify: `tests/assets/assets.test.js`

**Interfaces:**
- Consumes: `public/documents/license-registry-extract.pdf`, `public/documents/ogrn-certificate.pdf`.
- Produces: two local 720×960 WebP thumbnails used by `HOME_PAGE`.

- [ ] **Step 1: Add failing asset assertions**

```js
// append inside tests/assets/assets.test.js
const documentPreviews = [
  'public/assets/documents/license-registry-extract.webp',
  'public/assets/documents/ogrn-certificate.webp',
];

it('ships real local WebP previews for the approved PDFs', () => {
  for (const file of documentPreviews) {
    expect(existsSync(file), `${file} should exist`).toBe(true);
    const bytes = readFileSync(file);
    expect(bytes.length).toBeGreaterThan(20_000);
    expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(bytes.subarray(8, 12).toString('ascii')).toBe('WEBP');
  }
});
```

- [ ] **Step 2: Run asset test and capture RED**

Run: `pnpm test tests/assets/assets.test.js`  
Expected: FAIL because the two WebP previews are missing.

- [ ] **Step 3: Render first PDF pages and convert them**

```powershell
New-Item -ItemType Directory -Force tmp/pdfs, public/assets/documents
pdftoppm -f 1 -singlefile -png -r 160 public/documents/license-registry-extract.pdf tmp/pdfs/license-registry-extract
pdftoppm -f 1 -singlefile -png -r 160 public/documents/ogrn-certificate.pdf tmp/pdfs/ogrn-certificate
magick tmp/pdfs/license-registry-extract.png -auto-orient -strip -background white -alpha remove -resize "680x920>" -gravity center -extent 720x960 -quality 84 public/assets/documents/license-registry-extract.webp
magick tmp/pdfs/ogrn-certificate.png -auto-orient -strip -background white -alpha remove -resize "680x920>" -gravity center -extent 720x960 -quality 84 public/assets/documents/ogrn-certificate.webp
```

- [ ] **Step 4: Inspect both previews visually**

Open both WebPs at original detail with `view_image`. Expected: real first pages, upright, centered on white, readable seal/layout, no crop, black boxes or conversion artifacts.

- [ ] **Step 5: Run focused tests and commit**

Run: `pnpm test tests/assets/assets.test.js`  
Expected: PASS.

```bash
git add public/assets/documents tests/assets/assets.test.js
git commit -m "feat: add clinic document previews"
```

---

### Task 3: Spacious shared header and complete footer

**Files:**
- Create: `src/templates/site-chrome.js`
- Create: `tests/templates/site-chrome.test.js`
- Modify: `src/templates/render-page.js`
- Modify: `tests/templates/render-page.test.js`
- Modify: `tests/content/public-pages.test.js`
- Regenerate: `*.html`

**Interfaces:**
- Consumes: `activeFile`, `CLINIC`, `CONTACTS`, `HOURS`, `LICENSE`, `renderIcon`.
- Produces: `renderHeader(activeFile): string`, `renderFooter(): string`.

- [ ] **Step 1: Write failing shared-chrome tests**

```js
// tests/templates/site-chrome.test.js
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { renderFooter, renderHeader } from '../../src/templates/site-chrome.js';
import { CONTACTS, HOURS, LICENSE } from '../../src/data/clinic.js';

describe('premium light site chrome', () => {
  it('separates utility, brand/action, and primary navigation rows', () => {
    const document = new JSDOM(`<body>${renderHeader('index.html')}</body>`).window.document;
    expect(document.querySelector('.utility-bar')).not.toBeNull();
    expect(document.querySelector('.brand-row')).not.toBeNull();
    expect(document.querySelector('.nav-row')).not.toBeNull();
    expect(document.querySelector('.nav-row a[aria-current="page"]')?.textContent).toBe('Главная');
    expect(document.querySelector('.header-phone')?.getAttribute('href')).toBe(CONTACTS.phones[0].href);
    expect(document.querySelector('.header-appointment[data-appointment-open]')).not.toBeNull();
  });

  it('renders a complete four-column footer from verified data', () => {
    const document = new JSDOM(`<body>${renderFooter()}</body>`).window.document;
    expect(document.querySelectorAll('.footer-grid > section')).toHaveLength(4);
    expect(document.body.textContent).toContain(LICENSE.number);
    expect(document.body.textContent).toContain(HOURS.weekdays.value);
    expect(document.querySelector('a[href="patients.html"]')).not.toBeNull();
    expect(document.querySelector('a[href="privacy.html"]')).not.toBeNull();
    expect(document.querySelector('[data-cookie-settings]')).not.toBeNull();
    expect(document.querySelectorAll('a[href^="tel:"]')).toHaveLength(CONTACTS.phones.length);
  });
});
```

- [ ] **Step 2: Run focused test and capture RED**

Run: `pnpm test tests/templates/site-chrome.test.js`  
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement `site-chrome.js`**

Create the module with the exact navigation order already approved and these structural contracts:

```js
import { CLINIC, CONTACTS, HOURS, LICENSE } from '../data/clinic.js';
import { renderIcon } from './icons.js';

export const NAV_ITEMS = Object.freeze([
  ['index.html', 'Главная'], ['about.html', 'О клинике'], ['services.html', 'Наши услуги'],
  ['specialists.html', 'Специалисты'], ['prices.html', 'Цены'], ['reviews.html', 'Отзывы'],
  ['vacancies.html', 'Вакансии'], ['patients.html', 'Информация для пациентов'], ['contacts.html', 'Контакты'],
]);

const navLinks = (activeFile) => NAV_ITEMS.map(([href, label]) =>
  `<a href="${href}"${href === activeFile ? ' aria-current="page"' : ''}>${label}</a>`).join('');

export function renderHeader(activeFile) {
  return `<header class="site-header"><div class="utility-bar"><button type="button" data-vision-toggle>Версия для слабовидящих</button><span>${CLINIC.activityAddress}</span><span>${HOURS.weekdays.value}</span><a href="${CONTACTS.phones[0].href}">${CONTACTS.phones[0].label}</a></div><div class="brand-row"><a class="brand" href="index.html" aria-label="${CLINIC.name}, главная"><img src="assets/icons/logo.svg" alt="" width="56" height="56"><span><strong>${CLINIC.name}</strong><small>стоматологическая клиника</small></span></a><div class="header-contact"><a class="header-phone" href="${CONTACTS.phones[0].href}">${renderIcon('phone', 'ui-icon')}<span>${CONTACTS.phones[0].label}</span></a><a class="header-appointment button button-primary" href="${CONTACTS.phones[0].href}" data-appointment-open>Запись на приём</a></div><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-menu"><span class="sr-only" data-menu-toggle-label>Открыть меню</span></button></div><div class="menu-backdrop" data-menu-backdrop aria-hidden="true"></div><div class="nav-row"><nav id="main-menu" aria-label="Основная навигация"><button class="menu-close" type="button" data-menu-close aria-label="Закрыть меню">×</button>${navLinks(activeFile)}<a class="button button-primary nav-appointment" href="${CONTACTS.phones[0].href}" data-appointment-open>Запись на приём</a></nav></div></header>`;
}

export function renderFooter() {
  return `<footer class="site-footer"><div class="container footer-grid"><section class="footer-brand"><a class="brand" href="index.html"><img src="assets/icons/logo.svg" alt="" width="48" height="48"><span><strong>${CLINIC.name}</strong><small>стоматологическая клиника</small></span></a><p>Стоматологическая помощь в пределах действующей лицензии.</p><p class="footer-license">Лицензия ${LICENSE.number}<br>ОГРН ${CLINIC.ogrn}</p></section><section><h2>Навигация</h2><a href="about.html">О клинике</a><a href="services.html">Услуги</a><a href="specialists.html">Специалисты</a><a href="prices.html">Цены</a><a href="contacts.html">Контакты</a></section><section><h2>Пациентам</h2><a href="license.html">Лицензия и документы</a><a href="payment.html">Оплата услуг</a><a href="benefits.html">Льготы</a><a href="guarantees.html">Гарантии</a><a href="complaints.html">Обращения и жалобы</a><a href="standards.html">Стандарты</a></section><section><h2>Контакты</h2><p>${renderIcon('pin', 'footer-icon')}${CLINIC.activityAddress}</p>${CONTACTS.phones.map((phone) => `<a href="${phone.href}">${renderIcon('phone', 'footer-icon')}${phone.label}</a>`).join('')}<a href="${CONTACTS.emailHref}">${renderIcon('mail', 'footer-icon')}${CONTACTS.email}</a><p>${renderIcon('clock', 'footer-icon')}${HOURS.weekdays.label}: ${HOURS.weekdays.value}<br>${HOURS.saturday.label}: ${HOURS.saturday.value}</p><button class="button button-secondary" type="button" data-appointment-open>Запись на приём</button></section></div><div class="footer-bottom"><span>© 2026 ${CLINIC.name}</span><a href="privacy.html">Политика конфиденциальности</a><a href="cookies.html">Cookies</a><a href="patients.html">Карта сайта</a><button type="button" data-cookie-settings>Настройки cookies</button></div></footer>`;
}
```

- [ ] **Step 4: Integrate shared chrome and compact hero label**

In `render-page.js`:

- import `renderHeader` and `renderFooter`;
- remove the inline `nav` constant and inline header/footer markup;
- call `renderHeader(page.file)` and `renderFooter()`;
- replace `Иллюстративное изображение — не фотография помещений клиники.` with `Визуализация интерьера` and class `hero-visualization-label`;
- retain existing menu backdrop, dialog, cookies, mobile appointment and no-JS bootstrap contracts.

- [ ] **Step 5: Update old-note assertions and regenerate**

Update renderer/public-page tests to require exactly one `.hero-visualization-label` per page with text `Визуализация интерьера`, and reject the old long phrase.

Run: `pnpm generate && pnpm test tests/templates/site-chrome.test.js tests/templates/render-page.test.js tests/content/public-pages.test.js`  
Expected: PASS; all 21 generated pages contain the new chrome and micro-label.

- [ ] **Step 6: Run full test and commit**

Run: `pnpm test`  
Expected: full suite PASS.

```bash
git add src/templates/site-chrome.js src/templates/render-page.js tests/templates/site-chrome.test.js tests/templates/render-page.test.js tests/content/public-pages.test.js *.html
git commit -m "feat: redesign clinic site chrome"
```

---

### Task 4: Rich verified homepage content and hero

**Files:**
- Create: `src/content/home-page.js`
- Create: `src/templates/render-hero.js`
- Create: `tests/content/home-page.test.js`
- Modify: `src/content/core-pages.js`
- Modify: `src/templates/render-page.js`
- Test: `tests/templates/render-page.test.js`
- Regenerate: `index.html`

**Interfaces:**
- Consumes: `CLINIC`, `CONTACTS`, `HOURS`, `LICENSE`, `SERVICES`, `STAFF`, `PUBLIC_DOCUMENTS`, `renderIcon`.
- Produces: `HOME_PAGE`, `renderHero(page): string`; `HOME_PAGE.heroVariant === 'home'` selects the rich two-column hero.

- [ ] **Step 1: Write failing homepage content tests**

```js
// tests/content/home-page.test.js
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { HOME_PAGE } from '../../src/content/home-page.js';
import { renderPage } from '../../src/templates/render-page.js';
import { SERVICES } from '../../src/data/services.js';
import { STAFF } from '../../src/data/staff.js';

describe('premium light homepage', () => {
  const document = () => new JSDOM(renderPage(HOME_PAGE)).window.document;

  it('offers the five primary patient journeys immediately after the hero', () => {
    const page = document();
    expect([...page.querySelectorAll('.quick-card h2')].map((node) => node.textContent)).toEqual([
      'Лицензии и документы', 'Специалисты', 'Услуги', 'Цены', 'Запись на приём',
    ]);
    expect(page.querySelectorAll('.quick-card .ui-icon')).toHaveLength(5);
  });

  it('summarizes every licensed service and every confirmed staff member only', () => {
    const page = document();
    expect([...page.querySelectorAll('.home-service-card h3')].map((node) => node.textContent)).toEqual(
      SERVICES.map((service) => service.title),
    );
    expect([...page.querySelectorAll('.home-staff-card h3')].map((node) => node.textContent)).toEqual(
      STAFF.map((person) => person.name),
    );
    expect(page.querySelector('.home-staff img')).toBeNull();
  });

  it('links real document previews to the approved PDFs', () => {
    const page = document();
    const cards = [...page.querySelectorAll('.document-card')];
    expect(cards).toHaveLength(2);
    expect(cards.map((card) => card.querySelector('img')?.getAttribute('src'))).toEqual([
      'assets/documents/license-registry-extract.webp',
      'assets/documents/ogrn-certificate.webp',
    ]);
    expect(cards.map((card) => card.getAttribute('href'))).toEqual([
      'documents/license-registry-extract.pdf',
      'documents/ogrn-certificate.pdf',
    ]);
  });

  it('keeps prices controlled and appointment phone-only', () => {
    const page = document();
    expect(page.querySelector('.home-price-panel')?.textContent).toContain('Стоимость уточняется у администратора');
    expect(page.querySelector('.home-price-panel')?.textContent).not.toMatch(/\d[\d\s]*\s(?:₽|руб)/i);
    expect(page.querySelector('.home-contact form, .home-contact input')).toBeNull();
  });
});
```

- [ ] **Step 2: Run focused test and capture RED**

Run: `pnpm test tests/content/home-page.test.js`  
Expected: FAIL because `HOME_PAGE` and the rich sections do not exist.

- [ ] **Step 3: Implement `renderHero(page)`**

```js
// src/templates/render-hero.js
import { CONTACTS, LICENSE } from '../data/clinic.js';
import { renderIcon } from './icons.js';

export function renderHero(page) {
  if (page.heroVariant === 'home') {
    return `<section class="home-hero"><div class="home-hero__inner"><div class="home-hero__copy"><p class="eyebrow">Стоматологическая клиника в Белгороде</p><h1>${page.heading}</h1><p class="home-hero__lead">${page.lead}</p><div class="home-hero__actions"><a class="button button-primary" href="${CONTACTS.phones[0].href}" data-appointment-open>${renderIcon('calendar', 'button-icon')}Записаться на приём</a><a class="button button-secondary" href="services.html">Посмотреть услуги${renderIcon('arrow', 'button-icon')}</a></div><p class="home-hero__trust">${renderIcon('shield', 'ui-icon')}Лицензия ${LICENSE.number}. Статус: ${LICENSE.status}.</p></div><figure class="home-hero__media"><picture><source srcset="assets/images/hero-home.avif" type="image/avif"><img src="assets/images/hero-home.webp" alt="" width="1920" height="1080" fetchpriority="high"></picture><figcaption>Визуализация интерьера</figcaption></figure></div></section>`;
  }

  return `<section class="page-hero page-hero--${page.heroImage}"><div class="container"><nav aria-label="Хлебные крошки"><a href="index.html">Главная</a><span aria-hidden="true">/</span><span>${page.heading}</span></nav><h1>${page.heading}</h1>${page.lead ? `<p>${page.lead}</p>` : ''}<span class="hero-visualization-label">Визуализация интерьера</span></div></section>`;
}
```

Use the existing renderer escape helper when integrating; do not interpolate unsanitized external data.

- [ ] **Step 4: Implement `HOME_PAGE` from shared data**

`src/content/home-page.js` must build these exact semantic groups:

```js
export const HOME_PAGE = Object.freeze({
  file: 'index.html',
  title: 'Стоматологическая клиника в Белгороде',
  description: 'ООО «Стоматология Ваша улыбка»: лицензированная стоматологическая помощь в Белгороде.',
  heading: 'Стоматология Ваша улыбка',
  lead: 'Стоматологическая помощь в Белгороде в пределах действующей медицинской лицензии.',
  heroImage: 'home',
  heroVariant: 'home',
  noindex: false,
  body: [
    quickLinksSection, aboutSection, servicesSection, staffAndPricesSection,
    patientSection, documentsSection, contactsSection,
  ].join(''),
});
```

Implementation rules for the section constants:

- `quickLinksSection`: five `.quick-card` articles in the tested order, icons `document/team/tooth/ruble/calendar`.
- `aboutSection`: `<picture>` using `hero-about.avif/webp`, factual registration/license copy, three licensed directions count and link to `about.html`.
- `servicesSection`: map all `SERVICES` to `.home-service-card`, render `title`, `summary`, first three `items`, icon `tooth`, link to `services.html`.
- `staffAndPricesSection`: map all `STAFF` to `.home-staff-card` with initials, name and role only; adjacent `.home-price-panel` uses `SERVICES[0].priceStatus`, link to `prices.html` and appointment button.
- `patientSection`: six links to `payment.html`, `benefits.html`, `waiting-periods.html`, `guarantees.html`, `complaints.html`, `standards.html`, plus `patients.html` CTA.
- `documentsSection`: two `.document-card` anchors and real preview/PDF paths from Task 2 and `PUBLIC_DOCUMENTS`.
- `contactsSection`: address, two phones, email, all confirmed hours, phone-only appointment button and `hero-contacts.avif/webp` figure with `Визуализация интерьера` figcaption.

Remove the old inline home object from `CORE_PAGES`; import `HOME_PAGE` and export `[HOME_PAGE, aboutPage, contactsPage]`.

- [ ] **Step 5: Integrate hero rendering and regenerate**

In `render-page.js`, replace inline hero construction with `renderHero(page)` while preserving one H1 and the same main/skip-link structure.

Run: `pnpm generate && pnpm test tests/content/home-page.test.js tests/templates/render-page.test.js tests/content/public-pages.test.js`  
Expected: PASS; generated `index.html` includes the rich home structure and no fabricated facts.

- [ ] **Step 6: Commit semantic homepage**

```bash
git add src/content/home-page.js src/content/core-pages.js src/templates/render-hero.js src/templates/render-page.js tests/content/home-page.test.js tests/templates/render-page.test.js index.html
git commit -m "feat: build rich verified clinic homepage"
```

---

### Task 5: Premium Light design system and responsive layout

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/base.css`
- Modify: `src/styles/layout.css`
- Modify: `src/styles/components.css`
- Modify: `src/styles/pages.css`
- Create: `tests/styles/home-redesign.test.js`
- Modify: `tests/styles/design-system.test.js`

**Interfaces:**
- Consumes: class names from Tasks 3–4.
- Produces: responsive Premium Light layout at all six control widths without changing interaction selectors.

- [ ] **Step 1: Write failing visual-contract tests**

```js
// tests/styles/home-redesign.test.js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync('src/styles/tokens.css', 'utf8');
const layout = readFileSync('src/styles/layout.css', 'utf8');
const pages = readFileSync('src/styles/pages.css', 'utf8');
const components = readFileSync('src/styles/components.css', 'utf8');

describe('premium light visual contract', () => {
  it('uses the compact approved typography and wider content measure', () => {
    expect(tokens).toMatch(/--text-h1-size:\s*clamp\(2\.35rem,\s*4\.2vw,\s*3\.4rem\)/);
    expect(tokens).toMatch(/--text-h2-size:\s*clamp\(1\.75rem,\s*2\.6vw,\s*2\.35rem\)/);
    expect(tokens).toMatch(/--primitive-container-max:\s*77\.5rem/);
  });

  it('implements three desktop header bands without the old cramped row', () => {
    expect(layout).toMatch(/\.utility-bar\s*{/);
    expect(layout).toMatch(/\.brand-row\s*{/);
    expect(layout).toMatch(/\.nav-row\s*{/);
    expect(layout).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.nav-row/);
  });

  it('styles all rich homepage sections and local icons', () => {
    for (const selector of ['home-hero', 'quick-links', 'home-about', 'home-services', 'home-staff-prices', 'home-patients', 'home-documents', 'home-contact']) {
      expect(pages).toContain(`.${selector}`);
    }
    expect(components).toMatch(/\.ui-icon\s*{[^}]*stroke:/s);
    expect(pages).toMatch(/\.quick-links__grid\s*{[^}]*grid-template-columns:/s);
  });

  it('uses a micro-label rather than the removed large pill', () => {
    expect(layout).toMatch(/\.hero-visualization-label\s*{[^}]*font-size:\s*var\(--text-caption-size\)/s);
    expect(layout).not.toContain('.hero-illustration-note');
  });
});
```

- [ ] **Step 2: Run style test and capture RED**

Run: `pnpm test tests/styles/home-redesign.test.js`  
Expected: FAIL on the old type scale and missing class rules.

- [ ] **Step 3: Update tokens and base typography**

Set these exact aliases in `tokens.css`:

```css
--primitive-container-max: 77.5rem;
--primitive-size-header-container: 85rem;
--text-body-size: var(--primitive-font-size-base);
--text-small-size: 0.875rem;
--text-caption-size: 0.75rem;
--text-h1-size: clamp(2.35rem, 4.2vw, 3.4rem);
--text-h2-size: clamp(1.75rem, 2.6vw, 2.35rem);
--text-h3-size: clamp(1.125rem, 1.7vw, 1.35rem);
```

Keep body at 16 px desktop and allow 15 px only below 30rem. Do not reduce control targets.

- [ ] **Step 4: Implement spacious shared chrome CSS**

In `layout.css`:

- `.utility-bar`: 36–40 px, centered container, four distributed items.
- `.brand-row`: max 1360 px, two columns, minimum 76 px, brand left/contact+CTA right.
- `.nav-row`: independent full-width border band; `#main-menu` distributed without brand competition.
- below 75rem, preserve current fixed drawer/backdrop and hide desktop-only phone group;
- desktop `.menu-toggle`, `.menu-close`, `.nav-appointment` hidden;
- footer: 1 column mobile, 2 columns tablet, 4 columns desktop; `.footer-bottom` wraps without overlap.
- micro-label: absolute/bottom aligned, 12 px, translucent white text surface, no pill-sized padding.

- [ ] **Step 5: Implement component and homepage CSS**

In `components.css`:

- `.ui-icon`, `.button-icon`, `.footer-icon` use `currentColor`, fixed 24/18 px sizes and `flex:none`;
- quick cards use subtle border, soft shadow, 16–20 px radii, hover translate no more than 2 px;
- document cards provide real paper preview frames and visible PDF labels.

In `pages.css`:

- `.home-hero__inner`: two columns `minmax(0, .88fr) minmax(30rem, 1.12fr)` desktop; one column mobile;
- media uses `aspect-ratio: 16/10`, `object-fit: cover`, right-weighted crop;
- `.quick-links` overlaps hero by at most 3rem desktop and returns to normal flow mobile;
- grids: quick 1/2/5, services 1/3, patients 1/2/3, documents 1/2, footer 1/2/4;
- about/contact use 1 column mobile and 2 columns from 48rem;
- staff/prices use 1 column mobile and 7/5 split desktop;
- document previews use `aspect-ratio: 3/4`, `object-fit: contain`.

- [ ] **Step 6: Run focused/full tests and build**

Run: `pnpm test tests/styles/home-redesign.test.js tests/styles/design-system.test.js && pnpm test && pnpm build`  
Expected: all tests PASS; Vite emits 21 pages and the two preview assets without warnings.

- [ ] **Step 7: Commit visual system**

```bash
git add src/styles tests/styles *.html
git commit -m "feat: apply premium light clinic design"
```

---

### Task 6: Final generation, browser QA, and handoff update

**Files:**
- Modify only for demonstrated defects: `src/content/*`, `src/templates/*`, `src/styles/*`, corresponding focused tests.
- Modify: `README.md`
- Update: `.superpowers/sdd/task-home-redesign-report.md`

**Interfaces:**
- Consumes: completed Tasks 1–5.
- Produces: independently reviewed production build and documented content-update path.

- [ ] **Step 1: Update README paths and homepage maintenance notes**

Add a short section stating:

```md
## Главная страница и визуальные материалы

- состав главной: `src/content/home-page.js`;
- shared header/footer: `src/templates/site-chrome.js`;
- локальные SVG-иконки: `src/templates/icons.js`;
- превью документов: `public/assets/documents/`;
- интерьерные визуализации: `public/assets/images/`.

После замены визуализаций реальными фотографиями клиники обновите подписи изображений и повторно выполните `pnpm verify`.
```

- [ ] **Step 2: Run the fresh automated release gate**

Run: `pnpm generate && pnpm verify && git diff --check`  
Expected: all tests PASS, 21 HTML verified, build has no warnings/errors, diff check exit 0.

- [ ] **Step 3: Run asset/content scans**

Confirm:

- 21 HTML pages;
- two WebP document previews resolve in `dist/assets/documents/`;
- no old phrase `Иллюстративное изображение — не фотография помещений клиники.`;
- exactly one `Визуализация интерьера` label in each interior media/hero instance;
- no forms, external active resources, trackers, remote fonts, iframe or automatic map;
- no fabricated prices, services, reviews, vacancies or qualifications;
- `specialists.html` and `prices.html` remain the only noindex pages.

- [ ] **Step 4: Production Browser QA**

Start `pnpm preview --host 127.0.0.1 --port 4173 --strictPort` and inspect:

- `index.html` at 360×800, 390×844, 768×1024, 1024×768, 1280×900, 1440×900;
- one internal page at 390 and 1440 to confirm shared chrome/footer;
- header bands, nav fit, burger/backdrop, no width jump, bottom mobile CTA;
- hero crop, micro-label, quick cards, section order, document previews, footer columns;
- appointment dialog, focus return, cookies, vision mode, no-JS fallback;
- no horizontal overflow, clipped controls, duplicate IDs or console errors;
- reduced-motion CSSOM contract if the Browser cannot emulate media features.

- [ ] **Step 5: Correct only demonstrated defects with RED → GREEN tests**

For every Browser finding: add the smallest failing DOM/style regression, implement the smallest fix, rerun the affected viewport and `pnpm verify`.

- [ ] **Step 6: Independent review and final commit**

Request a read-only code/design review of the redesign range against the approved spec. Fix every Critical/Important issue before completion.

```bash
git add README.md src public/assets/documents tests *.html
git commit -m "docs: finalize premium light homepage redesign"
```

Report final commit, fresh test count, 21-page verifier result, Browser matrix, clean worktree, and remaining external launch inputs.

## Plan self-review

- Spec coverage: sections 1–11 map to Tasks 1–6.
- No placeholders: no TBD/TODO or unspecified production behavior remains.
- Type consistency: `renderIcon`, `renderHeader`, `renderFooter`, `renderHero` and `HOME_PAGE` are defined before consumption.
- Controlled content: all homepage facts derive from existing verified modules; noindex/privacy/MIS boundaries are preserved.
- Visual truthfulness: the rejected large pill is replaced by an unobtrusive but visible micro-label, not silently removed.
- Testability: each task has focused RED/GREEN commands, full gates and a separate commit/review boundary.
