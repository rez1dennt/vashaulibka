# Homepage Alignment Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать наложение быстрых карточек, выровнять служебную полосу header и собрать контакты главной страницы в единую сетку.

**Architecture:** Сохранить существующие renderer/data boundaries и изменить только один content-renderer и общие CSS-токены/правила. Разметка контактов получит повторяемый класс строки, а responsive-поведение останется token-driven и mobile-first.

**Tech Stack:** Vanilla HTML renderer, CSS custom properties, Vitest, JSDOM, Vite production preview.

## Global Constraints

- Использовать только подтверждённые данные из `src/data/clinic.js`.
- Не менять маршруты, `tel:`/`mailto:` значения, appointment dialog и отсутствие форм.
- SVG остаются декоративными и наследуют `currentColor`.
- Desktop-gap между hero и быстрыми карточками: `var(--space-6)` (24 px).
- Проверить 390, 1280 и 1440 px без горизонтального overflow.

---

### Task 1: Desktop spacing and utility-bar alignment

**Files:**
- Modify: `tests/styles/home-redesign.test.js`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/pages.css`

**Interfaces:**
- Consumes: `--layout-topbar-info-display`, `--space-6`, `.quick-links`.
- Produces: desktop `inline-flex` metadata rows and a 24 px non-overlapping quick-links seam.

- [ ] **Step 1: Write the failing style contract**

Add to `tests/styles/home-redesign.test.js`:

```js
it('aligns utility metadata inline and separates quick links from the hero', () => {
  expect(tokens).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?--layout-topbar-info-display:\s*inline-flex/s);
  expect(pages).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.quick-links\s*{[^}]*margin-block-start:\s*var\(--space-0\)[^}]*padding-block-start:\s*var\(--space-6\)/s);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
pnpm test tests/styles/home-redesign.test.js
```

Expected: FAIL because the desktop token is `inline` and `.quick-links` still uses a negative margin with zero top padding.

- [ ] **Step 3: Implement the minimal token and spacing changes**

In the `@media (min-width: 75rem)` token block in `src/styles/tokens.css`:

```css
--layout-topbar-info-display: inline-flex;
```

Replace the desktop `.quick-links` override in `src/styles/pages.css` with:

```css
.quick-links {
  margin-block-start: var(--space-0);
  padding-block-start: var(--space-6);
  background: var(--color-surface-page);
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run `pnpm test tests/styles/home-redesign.test.js`.

Expected: all tests in the file PASS.

- [ ] **Step 5: Commit Task 1**

```powershell
git add tests/styles/home-redesign.test.js src/styles/tokens.css src/styles/pages.css
git commit -m "fix: align homepage header metadata"
```

---

### Task 2: Unified homepage contact rows

**Files:**
- Modify: `tests/content/home-page.test.js`
- Modify: `tests/styles/home-redesign.test.js`
- Modify: `src/content/home-page.js`
- Modify: `src/styles/pages.css`

**Interfaces:**
- Consumes: `renderIcon(name)`, `CLINIC.activityAddress`, `CONTACTS`, `HOURS`, `.definition-list--compact`.
- Produces: `.home-contact__row` for address/phone/email/schedule and `.home-contact__schedule` containing the verified schedule.

- [ ] **Step 1: Write failing DOM and style contracts**

Add to `tests/content/home-page.test.js`:

```js
it('renders contacts as aligned icon-and-text rows', () => {
  const document = render();
  const rows = [...document.querySelectorAll('.home-contact__row')];

  expect(rows).toHaveLength(5);
  expect(document.querySelectorAll('.home-contact__phones .home-contact__row')).toHaveLength(CONTACTS.phones.length);
  expect(document.querySelector('.home-contact__schedule > .ui-icon')).not.toBeNull();
  expect(document.querySelector('.home-contact__schedule .definition-list')).not.toBeNull();
});
```

Add to `tests/styles/home-redesign.test.js`:

```js
it('uses one icon-and-text grid for homepage contacts', () => {
  expect(pages).toMatch(/\.home-contact__row\s*{[^}]*display:\s*grid[^}]*grid-template-columns:\s*var\(--icon-size\)\s+minmax\(var\(--space-0\),\s*1fr\)/s);
  expect(pages).toMatch(/\.home-contact__schedule\s+\.definition-list\s*{[^}]*margin-block-end:\s*var\(--space-0\)/s);
});
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
pnpm test tests/content/home-page.test.js tests/styles/home-redesign.test.js
```

Expected: FAIL because `.home-contact__row` and `.home-contact__schedule` do not exist.

- [ ] **Step 3: Render repeated contact rows**

In `src/content/home-page.js`, replace the existing address/phones/email/schedule fragment with:

```js
`<p class="home-contact__row home-contact__address">${renderIcon('pin')}<span>${escapeHtml(CLINIC.activityAddress)}</span></p>`,
`<div class="home-contact__phones">${CONTACTS.phones.map((phone) => `<a class="home-contact__row" href="${phone.href}">${renderIcon('phone')}<span>${escapeHtml(phone.label)}</span></a>`).join('')}</div>`,
`<a class="home-contact__row home-contact__email" href="${CONTACTS.emailHref}">${renderIcon('mail')}<span>${escapeHtml(CONTACTS.email)}</span></a>`,
`<div class="home-contact__row home-contact__schedule">${renderIcon('clock')}<div><dl class="definition-list definition-list--compact">${hours}</dl><p class="home-contact__break"><strong>${escapeHtml(HOURS.breakNote)}</strong></p></div></div>`,
```

- [ ] **Step 4: Replace the mixed contact CSS with a shared grid**

In `src/styles/pages.css`:

```css
.home-contact__row {
  min-inline-size: var(--space-0);
  display: grid;
  grid-template-columns: var(--icon-size) minmax(var(--space-0), 1fr);
  align-items: start;
  gap: var(--space-3);
  margin-block-end: var(--space-4);
}

.home-contact__row > .ui-icon {
  margin-block-start: var(--space-0-5);
}

.home-contact__phones {
  display: grid;
  gap: var(--space-2);
}

.home-contact__phones .home-contact__row,
.home-contact__email {
  min-block-size: var(--control-target-min);
  align-items: center;
  margin-block-end: var(--space-0);
  color: var(--color-text);
  font-weight: var(--text-label-weight);
  text-decoration: none;
}

.home-contact__email {
  margin-block-end: var(--space-4);
}

.home-contact__schedule .definition-list,
.home-contact__break {
  margin-block-end: var(--space-0);
}
```

- [ ] **Step 5: Run focused tests and verify GREEN**

Run `pnpm test tests/content/home-page.test.js tests/styles/home-redesign.test.js`.

Expected: both files PASS.

- [ ] **Step 6: Regenerate pages and commit Task 2**

```powershell
pnpm generate
git add src/content/home-page.js src/styles/pages.css tests/content/home-page.test.js tests/styles/home-redesign.test.js index.html
git commit -m "fix: align homepage contact details"
```

---

### Task 3: Responsive and release verification

**Files:**
- Create: `.superpowers/sdd/task-homepage-alignment-polish-report.md`

**Interfaces:**
- Consumes: production preview at `http://127.0.0.1:4173/index.html`.
- Produces: recorded RED/GREEN evidence and viewport QA results.

- [ ] **Step 1: Build and open the production artifact**

Run `pnpm build` and reload the existing preview.

Expected: Vite exits 0 and emits 21 HTML pages.

- [ ] **Step 2: Check the required viewports**

At 390×844, 1280×900 and 1440×900 verify:

- `document.documentElement.scrollWidth === document.documentElement.clientWidth`;
- utility icons and text share one row at desktop widths;
- quick links begin 24 px below the hero and do not overlap it;
- all five contact rows use the same icon column;
- the clock icon aligns with the schedule group;
- no visible controls are clipped.

- [ ] **Step 3: Smoke-test preserved interactions**

Verify mobile menu open/Escape/focus return, appointment dialog open/Escape/focus return, and vision-mode reflow.

- [ ] **Step 4: Run the full release gate**

Run:

```powershell
pnpm verify
git diff --check
```

Expected: all tests PASS, Vite build exits 0, verifier reports 21 HTML pages, diff check exits 0.

- [ ] **Step 5: Write and commit the verification report**

Record exact commands, counts, viewport evidence and any limitation in `.superpowers/sdd/task-homepage-alignment-polish-report.md`, then:

```powershell
git add -f .superpowers/sdd/task-homepage-alignment-polish-report.md
git commit -m "docs: verify homepage alignment polish"
```
