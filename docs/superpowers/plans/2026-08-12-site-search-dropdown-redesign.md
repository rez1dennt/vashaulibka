# Site Search Dropdown Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fullscreen site-search dialog with an anchored, smoothly animated header combobox dropdown while preserving the verified local index, Russian ranking, safe result rendering, and keyboard navigation.

**Architecture:** `renderSiteSearch()` becomes the single header-owned component containing a mobile toggle, the persistent combobox field, its anchored popup, and a no-JS sitemap fallback. `initSiteSearch()` owns only open/close state, lazy index loading, search rendering, and combobox keyboard behavior; modal focus-trap and scroll-lock dependencies are removed. CSS uses the existing token layer for a desktop anchored popup and a mobile absolute row that overlays content without changing document geometry.

**Tech Stack:** Vanilla HTML templates, token-driven CSS, ES modules, Vitest, JSDOM, Vite, local JSON index; no new runtime dependencies.

## Global Constraints

- Keep `public/search-index.json`, `src/data/search-keywords.js`, and `src/js/core/search-engine.js` behavior unchanged.
- Do not add query history, analytics, remote requests, external libraries, forms, named inputs, or data submission.
- Use only local `.html` and approved fragment links already emitted by the index.
- Preserve safe DOM construction with `textContent`/text nodes; never render index text through `innerHTML`.
- The dropdown must not block body scrolling, trap focus, add a backdrop, or move header/page geometry.
- Honor `prefers-reduced-motion: reduce`, vision mode, visible focus, 24×24 minimum targets, and the ARIA combobox/listbox pattern.
- Let the dropdown height follow its current content: no minimum card-height reservation; keep only a maximum results height with internal scrolling. Reveal result cards with a short tokenized fade/slide animation.
- Run every behavior change through a witnessed RED→GREEN cycle before production edits.

---

## File Map

- `src/templates/site-search.js` — complete semantic search component markup.
- `src/templates/site-chrome.js` — places the component between brand and contact actions.
- `src/templates/render-page.js` — removes the old post-header modal render.
- `src/js/components/site-search.js` — anchored popup lifecycle, lazy data, safe results, keyboard model.
- `src/styles/site-search.css` — mobile toggle/overlay row, desktop field/dropdown, states and motion.
- `src/styles/layout.css` — establishes the positioned header-row containing block.
- `src/styles/tokens.css` — increases the semantic search-field cap using the existing primitive/component alias chain.
- `tests/templates/site-search.test.js` — component semantics and no-modal/no-JS contracts.
- `tests/templates/site-chrome.test.js` — header ownership/order contract.
- `tests/js/site-search.test.js` — open/close, outside click, shortcuts, ranking rendering and accessibility behavior.
- `tests/styles/site-search.test.js` — anchored positioning, stable geometry, breakpoints and reduced motion.

---

### Task 1: Move the semantic combobox into the header

**Files:**
- Modify: `tests/templates/site-search.test.js`
- Modify: `tests/templates/site-chrome.test.js`
- Modify: `src/templates/site-search.js`
- Modify: `src/templates/site-chrome.js`
- Modify: `src/templates/render-page.js`

**Interfaces:**
- Produces: `renderSiteSearch(): string`, rendering one `[data-site-search]` root.
- Produces hooks: `[data-search-toggle]`, `[data-search-surface]`, `[data-search-input]`, `[data-search-clear]`, `[data-search-dropdown]`, `[data-search-status]`, `[data-search-content]`, `#site-search-results`.
- Removes: `renderSearchTrigger()`, `#site-search-dialog`, `role="dialog"`, `aria-modal`, backdrop and close-button hooks.

- [ ] **Step 1: Replace modal template assertions with failing anchored-combobox assertions**

```js
const document = new JSDOM(`<body>${renderSiteSearch()}</body>`).window.document;
const root = document.querySelector('[data-site-search]');
const toggle = root.querySelector('[data-search-toggle][aria-controls="site-search-surface"]');
const input = root.querySelector('[data-search-input][role="combobox"]');

expect(toggle.getAttribute('aria-expanded')).toBe('false');
expect(input.getAttribute('aria-controls')).toBe('site-search-results');
expect(input.getAttribute('aria-expanded')).toBe('false');
expect(root.querySelector('#site-search-results[role="listbox"]')).not.toBeNull();
expect(root.querySelector('.site-search-fallback[href="patients.html"]')).not.toBeNull();
expect(root.querySelector('[role="dialog"], [aria-modal="true"], [data-search-backdrop]')).toBeNull();
expect(root.querySelector('form, [type="submit"]')).toBeNull();
```

Update the header test to expect `.brand`, `[data-site-search]`, `.brand-row__actions`, and `.menu-toggle` in that order, and assert that `renderHeader()` contains exactly one search input.

- [ ] **Step 2: Run template tests and witness RED**

Run:

```powershell
pnpm test tests/templates/site-search.test.js tests/templates/site-chrome.test.js
```

Expected: FAIL because the old component still renders a dialog/backdrop and the header still owns separate trigger/fallback nodes.

- [ ] **Step 3: Implement the single header component**

Use this exact anatomy in `renderSiteSearch()`:

```html
<div class="site-search" data-site-search>
  <button class="site-search__toggle" type="button" data-search-toggle
    aria-controls="site-search-surface" aria-expanded="false" aria-label="Открыть поиск по сайту">
    <!-- existing local search SVG + sr-only label -->
  </button>
  <div class="site-search__surface" id="site-search-surface" data-search-surface>
    <div class="site-search__field">
      <!-- search SVG -->
      <input type="search" data-search-input role="combobox"
        aria-autocomplete="list" aria-haspopup="listbox"
        aria-controls="site-search-results" aria-expanded="false"
        autocomplete="off" spellcheck="false"
        placeholder="Услуга, врач, документ или вопрос">
      <kbd>Ctrl K</kbd>
      <button type="button" data-search-clear aria-label="Очистить поиск" hidden><!-- clear SVG --></button>
    </div>
    <div class="site-search__dropdown" data-search-dropdown aria-hidden="true">
      <p class="site-search__status" data-search-status aria-live="polite">Введите не менее двух символов</p>
      <div class="site-search__content" data-search-content></div>
      <ul class="site-search__results" id="site-search-results" role="listbox"></ul>
      <p class="site-search__hint"><kbd>↑</kbd><kbd>↓</kbd> выбор <kbd>Enter</kbd> открыть <kbd>Esc</kbd> закрыть</p>
    </div>
  </div>
  <a class="site-search-fallback" href="patients.html">Карта сайта</a>
</div>
```

Keep icons produced by `renderIcon()`. Import and call `renderSiteSearch()` directly from `site-chrome.js`; remove the separate call/import from `render-page.js`.

- [ ] **Step 4: Run template tests and regenerate pages**

Run:

```powershell
pnpm test tests/templates/site-search.test.js tests/templates/site-chrome.test.js
pnpm generate
```

Expected: both test files PASS; all 21 generated pages contain one header combobox and no `site-search-dialog`.

- [ ] **Step 5: Commit semantic integration**

```powershell
git add src/templates/site-search.js src/templates/site-chrome.js src/templates/render-page.js tests/templates/site-search.test.js tests/templates/site-chrome.test.js *.html
git commit -m "refactor: embed site search in header"
```

---

### Task 2: Replace modal lifecycle with anchored dropdown behavior

**Files:**
- Modify: `tests/js/site-search.test.js`
- Modify: `src/js/components/site-search.js`

**Interfaces:**
- Consumes: Task 1 `data-search-*` hooks.
- Preserves: `initSiteSearch({ fetchImpl = globalThis.fetch, navigate = href => window.location.assign(href) } = {})`.
- Produces state: root `.is-open`, toggle `aria-expanded`, input `aria-expanded`, dropdown `aria-hidden`.

- [ ] **Step 1: Replace dialog fixture and add failing dropdown lifecycle tests**

Use a production-shaped fixture with one outside button:

```html
<div data-site-search class="site-search">
  <button data-search-toggle aria-controls="site-search-surface" aria-expanded="false">Поиск</button>
  <div id="site-search-surface" data-search-surface>
    <input data-search-input role="combobox" aria-controls="site-search-results" aria-expanded="false">
    <button data-search-clear hidden>Очистить</button>
    <div data-search-dropdown aria-hidden="true">
      <p data-search-status></p><div data-search-content></div>
      <ul id="site-search-results" role="listbox"></ul>
    </div>
  </div>
</div>
<button data-outside>Вне поиска</button>
```

Add assertions:

```js
toggle.click();
expect(root.classList.contains('is-open')).toBe(true);
expect(toggle.getAttribute('aria-expanded')).toBe('true');
expect(input.getAttribute('aria-expanded')).toBe('true');
expect(dropdown.getAttribute('aria-hidden')).toBe('false');
expect(document.body.classList.contains('is-locked')).toBe(false);

document.querySelector('[data-outside]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
expect(root.classList.contains('is-open')).toBe(false);
```

Also assert: input focus opens on desktop semantics; repeated toggle closes and restores toggle focus; `Escape` closes; lazy fetch runs once; `Ctrl/Cmd+K` focuses input unless another dialog/menu is open; arrows/Home/End/Enter still work; no focus trap occurs; malicious text stays text; clear/error/quick-link states remain usable.

- [ ] **Step 2: Run JS tests and witness RED**

Run:

```powershell
pnpm test tests/js/site-search.test.js
```

Expected: FAIL because the implementation still queries `#site-search-dialog`, locks scrolling, traps focus, and listens for a backdrop/close button.

- [ ] **Step 3: Implement dropdown state without modal dependencies**

Remove `createFocusTrap`, `lockScroll`, and `unlockScroll` imports. Query the root and hooks as follows:

```js
const root = document.querySelector('[data-site-search]');
const toggle = root?.querySelector('[data-search-toggle]');
const input = root?.querySelector('[data-search-input]');
const dropdown = root?.querySelector('[data-search-dropdown]');
```

Implement state transitions:

```js
const setOpenState = (open) => {
  root.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Закрыть поиск по сайту' : 'Открыть поиск по сайту');
  input.setAttribute('aria-expanded', String(open));
  dropdown.setAttribute('aria-hidden', String(!open));
  if (!open) input.removeAttribute('aria-activedescendant');
};

const open = ({ focusInput = false } = {}) => {
  setOpenState(true);
  createQuickLinks(content);
  update();
  setStatus('Загружаем поиск…');
  ensureIndex();
  if (focusInput) input.focus();
};

const close = ({ restoreToggle = false } = {}) => {
  if (!root.classList.contains('is-open')) return;
  setOpenState(false);
  activeIndex = -1;
  if (restoreToggle) toggle.focus();
};
```

Open on input `focus`, toggle on button click, close on `Escape`, repeated toggle, and document `pointerdown` outside `root`. Keep the existing pure matching, eight-result limit, safe highlighting, `aria-activedescendant`, `Home`/`End`, and local navigation code. Do not add scroll-lock or focus-trap calls.

- [ ] **Step 4: Run focused JS tests and full search engine/index tests**

Run:

```powershell
pnpm test tests/js/site-search.test.js tests/js/search-engine.test.js tests/scripts/search-index.test.js
```

Expected: all focused tests PASS; index fetched once; no body lock; existing ranking cases remain unchanged.

- [ ] **Step 5: Commit interaction rewrite**

```powershell
git add src/js/components/site-search.js tests/js/site-search.test.js
git commit -m "feat: open site search as anchored dropdown"
```

---

### Task 3: Build the smooth responsive dropdown surface

**Files:**
- Modify: `tests/styles/site-search.test.js`
- Modify: `src/styles/site-search.css`
- Modify: `src/styles/layout.css`
- Modify: `src/styles/tokens.css`

**Interfaces:**
- Consumes: `.site-search.is-open`, `.site-search__toggle`, `.site-search__surface`, `.site-search__field`, `.site-search__dropdown`.
- Produces: compact mobile toggle below 75rem; persistent desktop field at/above 75rem; no fixed fullscreen search layer.

- [ ] **Step 1: Write failing CSS contract tests**

```js
expect(searchCss).not.toMatch(/\.site-search\s*\{[\s\S]*position:\s*fixed/);
expect(searchCss).toMatch(/\.site-search__dropdown[\s\S]*visibility:\s*hidden/);
expect(searchCss).toMatch(/\.site-search\.is-open[\s\S]*site-search__dropdown[\s\S]*visibility:\s*visible/);
expect(searchCss).toMatch(/@media \(min-width: 75rem\)[\s\S]*site-search__toggle[\s\S]*display:\s*none/);
expect(searchCss).toMatch(/@media \(max-width: 74\.999rem\)[\s\S]*site-search__surface[\s\S]*position:\s*absolute/);
expect(searchCss).toMatch(/prefers-reduced-motion:\s*reduce/);
expect(searchCss).not.toMatch(/var\(--primitive-/);
expect(layoutCss).toMatch(/\.brand-row__inner[\s\S]*position:\s*relative/);
```

Also assert transition properties include `opacity`, `transform`, and delayed `visibility`, and that no rule changes body overflow for search.

- [ ] **Step 2: Run style tests and witness RED**

Run:

```powershell
pnpm test tests/styles/site-search.test.js
```

Expected: FAIL because the current surface is fixed/fullscreen and has modal panel/backdrop rules.

- [ ] **Step 3: Implement token-driven mobile-first styles**

Apply these state principles, using existing semantic tokens only:

```css
.brand-row__inner { position: relative; }

.site-search__surface,
.site-search__dropdown {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transform: translateY(calc(var(--space-2) * -1)) scale(0.985);
  transition: var(--transition-navigation-close);
}

.site-search.is-open .site-search__surface,
.site-search.is-open .site-search__dropdown {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
  transform: none;
  transition: var(--transition-navigation-open);
}
```

Do not retain the literal scale: add a primitive scale token and semantic component alias in `tokens.css`, then consume only the semantic alias from `site-search.css`.

For `<75rem`, keep `.site-search` as a compact grid child, make `.site-search__toggle` one control square, and absolutely position `.site-search__surface` against `.brand-row__inner` at `inset-block-start: calc(100% + var(--space-2))` with `inset-inline: var(--space-0)`, safe viewport width, raised surface, border, radius and shadow. The results region gets an internal max block size and `overflow-y:auto`.

For `≥75rem`, hide the toggle, make `.site-search` fill the center track up to the widened search-field token, keep `.site-search__surface` statically visible with no card chrome, and position only `.site-search__dropdown` absolutely beneath the field, centered and capped by `--search-panel-max-inline-size`. Ensure `.is-open` affects only the popup while the field stays visible.

Keep current result-card, quick-link, mark, clear-button, vision-mode, focus-visible and native-search-clear styling. Remove all obsolete backdrop, modal header, close button, fullscreen block-size and dialog-center media rules.

- [ ] **Step 4: Run style tests, full focused search tests, and build**

Run:

```powershell
pnpm test tests/styles/site-search.test.js tests/templates/site-search.test.js tests/templates/site-chrome.test.js tests/js/site-search.test.js
pnpm build
```

Expected: focused tests PASS; Vite emits 21 pages and local assets with no unresolved references.

- [ ] **Step 5: Run design static gates**

From the UX skill root, run the hardcode and token-reference checks against changed CSS if the helper supports the repository’s vanilla-CSS input. If a helper is incompatible, record the exact incompatibility and use repository tests plus `rg` checks:

```powershell
rg -n "#[0-9a-fA-F]{3,8}|\b[0-9]+px\b|\b[0-9]+ms\b|var\(--primitive-" src/styles/site-search.css
```

Expected: no matches.

- [ ] **Step 6: Commit responsive visual redesign**

```powershell
git add src/styles/site-search.css src/styles/layout.css src/styles/tokens.css tests/styles/site-search.test.js
git commit -m "style: anchor responsive search dropdown"
```

---

### Task 4: Production regeneration and browser acceptance

**Files:**
- Regenerate: `*.html`
- Modify if needed through a new RED→GREEN cycle: only the files listed above.

**Interfaces:**
- Consumes the completed dropdown component.
- Produces byte-stable 21-page production output and fresh QA evidence.

- [ ] **Step 1: Run the complete automated gate**

```powershell
pnpm verify
git diff --check
git status --short
```

Expected: all Vitest files/tests PASS; Vite production build succeeds; verifier reports 21/21 HTML pages; diff check exits 0.

- [ ] **Step 2: Run production-preview Browser QA**

Inspect `index.html`, `specialists.html`, `services.html`, and `patients.html` at 390×844, 768×900, 1280×900, and 1440×900. Record:

- document `scrollWidth === clientWidth`;
- header/hero bounding boxes stay unchanged before/after search opens;
- mobile toggle opens a field below the header and repeated click closes it;
- desktop field focuses in place and opens a popup directly beneath it;
- outside click and `Escape` close without scroll lock;
- quick links, `болит зуб`, `лицензия`, `врач`, and a no-result query render expected states;
- ArrowDown/Enter opens the active local result;
- long results scroll inside the dropdown;
- console has zero errors and active resources remain same-origin;
- reduced-motion is checked through supported emulation; if unavailable, report the limitation and retain CSS/test evidence.

- [ ] **Step 3: Add a regression test before any QA-driven fix**

If Browser QA demonstrates a defect, first add the smallest failing test to the matching template/JS/style suite, witness RED, implement the minimal fix, rerun focused GREEN, then repeat the affected Browser scenario.

- [ ] **Step 4: Run a fresh final gate and commit generated output**

```powershell
pnpm verify
git diff --check
git add *.html
git commit -m "build: regenerate pages for inline search"
git status --short
```

Expected: full gate PASS, generated pages match the current renderer, and worktree is clean.

---

## Plan Self-Review

- **Spec coverage:** Header placement, mobile toggle, desktop persistent field, anchored popup, smooth no-layout motion, all search states, no history, no modal/scroll lock, ARIA keyboard behavior, no-JS fallback, lazy local data, reduced motion, vision mode, full verification and Browser QA each map to an explicit task.
- **Placeholder scan:** The plan contains no TBD/TODO/“implement later” steps; every implementation action identifies exact selectors, files, commands and expected failures/results.
- **Interface consistency:** Template hooks consumed by Task 2 and CSS classes consumed by Task 3 exactly match Task 1; `initSiteSearch()` retains its existing public signature; Task 4 exercises the same production output generated by the renderer.
