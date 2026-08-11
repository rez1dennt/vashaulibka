# Brand Wordmark and Contacts Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать единый выразительный фирменный блок «логотип + Ваша улыбка» и заменить три одинаковые карточки контактов на асимметричный полезный экран.

**Architecture:** Шапка остаётся общей серверно-генерируемой разметкой в `site-chrome.js`; декоративный SVG-штрих добавляется прямо в фирменный блок и стилизуется существующей системой токенов. Страница контактов остаётся частью `CORE_PAGES`, но получает отдельные семантические классы и изолированный responsive-слой в `pages.css`.

**Tech Stack:** Vanilla HTML, CSS custom properties, JavaScript template renderer, Vitest/JSDOM, Vite.

## Global Constraints

- Логотип и текст «Ваша улыбка» видны на всех ширинах.
- Полное название и подпись клиники не выводятся в визуальной разметке шапки.
- Не подключать внешние шрифты, iframe-карту, аналитику или сторонние скрипты.
- Использовать только существующие семантические CSS-токены и локальные SVG.
- Сохранить `tel:`, `mailto:`, диалог записи, focus-visible и режим для слабовидящих.
- На 320px не должно быть горизонтального overflow.

---

### Task 1: Фирменная надпись

**Files:**
- Modify: `tests/templates/site-chrome.test.js`
- Modify: `tests/styles/home-redesign.test.js`
- Modify: `src/templates/site-chrome.js`
- Modify: `src/styles/layout.css`

**Interfaces:**
- Consumes: `renderHeader(activeFile)` и существующий `assets/icons/logo.svg`.
- Produces: `.brand__wordmark`, `.brand__prefix`, `.brand__accent`, `.brand__smile`.

- [ ] **Step 1: Write the failing tests**

Проверить наличие логотипа, двух текстовых частей и декоративного SVG, а также token-driven typography:

```js
expect(document.querySelector('.brand__prefix')?.textContent).toBe('Ваша');
expect(document.querySelector('.brand__accent')?.textContent).toBe('улыбка');
expect(document.querySelector('.brand__smile[aria-hidden="true"]')).not.toBeNull();
expect(layout).toMatch(/\.brand__wordmark\s*{[^}]*font-family:\s*var\(--font-heading\)/s);
expect(layout).toMatch(/\.brand__accent\s*{[^}]*color:\s*var\(--color-primary-strong\)[^}]*font-style:\s*italic/s);
```

- [ ] **Step 2: Run tests to verify RED**

Run: `pnpm test tests/templates/site-chrome.test.js tests/styles/home-redesign.test.js --reporter=dot`

Expected: FAIL because the wordmark spans and smile SVG do not exist.

- [ ] **Step 3: Implement the wordmark**

Use semantic text plus a decorative local path:

```html
<span class="brand__wordmark"><span class="brand__prefix">Ваша</span> <span class="brand__accent">улыбка</span><svg class="brand__smile" aria-hidden="true" viewBox="0 0 64 8"><path d="M2 2c16 6 44 6 60 0"/></svg></span>
```

Style with `--font-heading`, `--text-lead-size`, `--color-primary-strong`, existing transition and spacing tokens. Keep the logo visible in the mobile-first rule.

- [ ] **Step 4: Run focused GREEN**

Run: `pnpm test tests/templates/site-chrome.test.js tests/styles/home-redesign.test.js --reporter=dot`

Expected: 2 files passed.

---

### Task 2: Semantic contacts content

**Files:**
- Modify: `tests/content/public-pages.test.js`
- Modify: `src/content/core-pages.js`

**Interfaces:**
- Consumes: `CLINIC.activityAddress`, `CONTACTS.phones`, `CONTACTS.email`, `HOURS`, `renderIcon(name, className)`.
- Produces: `.contact-page`, `.contact-location`, `.contact-channels`, `.contact-channel`, `.contact-schedule`, `.contact-hours`.

- [ ] **Step 1: Write the failing content test**

```js
const contacts = CORE_PAGES.find((page) => page.file === 'contacts.html');
expect(contacts.body).toContain('class="contact-page"');
expect(contacts.body).toContain('<address');
expect(contacts.body).toContain('Построить маршрут');
expect(contacts.body.match(/class="contact-channel/g)).toHaveLength(3);
expect(contacts.body).toContain('class="contact-hours"');
expect(contacts.body).not.toContain('class="container contact-grid"');
```

- [ ] **Step 2: Run test to verify RED**

Run: `pnpm test tests/content/public-pages.test.js --reporter=dot`

Expected: FAIL because the old page still renders three generic cards.

- [ ] **Step 3: Implement semantic markup**

Import `renderIcon`, escape URL-visible values, create an encoded Yandex Maps search URL from `CLINIC.activityAddress`, render two `tel:` rows and one `mailto:` row, then render four schedule cells and the existing `data-appointment-open` action.

- [ ] **Step 4: Run focused GREEN**

Run: `pnpm test tests/content/public-pages.test.js --reporter=dot`

Expected: the public page suite passes and all confirmed facts remain present.

---

### Task 3: Responsive contact composition and release gate

**Files:**
- Create: `tests/styles/contact-page-redesign.test.js`
- Modify: `src/styles/pages.css`
- Generate: `contacts.html` and shared generated HTML files

**Interfaces:**
- Consumes: contact classes from Task 2 and the existing semantic token layer.
- Produces: mobile one-column layout, 2×2 mobile hours grid, 7/5 desktop contact grid, wide schedule/action panel.

- [ ] **Step 1: Write the failing visual-contract test**

```js
expect(pages).toMatch(/\.contact-page__grid\s*{[^}]*display:\s*grid/s);
expect(pages).toMatch(/\.contact-hours\s*{[^}]*grid-template-columns:\s*repeat\(2,/s);
expect(pages).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*?\.contact-page__grid\s*{[^}]*7fr[^}]*5fr/s);
expect(pages).toMatch(/\.contact-channel:hover\s*{/s);
expect(pages).toMatch(/\.contact-channel:active\s*{/s);
```

- [ ] **Step 2: Run test to verify RED**

Run: `pnpm test tests/styles/contact-page-redesign.test.js --reporter=dot`

Expected: FAIL because contact-specific CSS does not exist.

- [ ] **Step 3: Implement token-driven CSS**

Use the existing page/surface/border/radius/spacing/control tokens. The base layout is one column; `.contact-hours` is 2 columns; at 48rem `.contact-page__grid` becomes `minmax(0, 7fr) minmax(0, 5fr)` and the schedule panel becomes content plus action.

- [ ] **Step 4: Generate and run automated gates**

Run: `pnpm generate`

Run: `pnpm verify`

Run: bundled `lint_hardcodes.py src/styles` and `validate_theme_refs.py src/styles/tokens.css src/styles`.

Expected: all tests pass, 21 HTML pages verify, no hardcoded values and no unresolved token references.

- [ ] **Step 5: Run live responsive QA**

Open `contacts.html` at mobile and desktop widths. Verify no document overflow, no clipped interactive controls, readable email/address wrapping, visible logo and wordmark, 2×2 mobile schedule, working burger/dialog, and zero console errors.

- [ ] **Step 6: Commit**

```bash
git add src/content/core-pages.js src/templates/site-chrome.js src/styles/layout.css src/styles/pages.css tests contacts.html *.html
git commit -m "feat: redesign clinic contacts"
```

