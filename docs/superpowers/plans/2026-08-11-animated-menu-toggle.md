# Animated Menu Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the separate mobile-menu close control with one stationary button whose three lines smoothly transform into a cross.

**Architecture:** Keep `.menu-toggle` as the single state owner and interactive control, with `aria-expanded` driving both menu behavior and the CSS morph. Add one `aria-hidden` decorative icon span, remove the in-panel close button and its JavaScript branch, and preserve existing backdrop, Escape, focus, scroll-lock and appointment-dialog behavior.

**Tech Stack:** Static HTML renderer, vanilla CSS custom properties, vanilla JavaScript, JSDOM, Vitest, Vite, in-app Browser QA.

## Global Constraints

- Use one `.menu-toggle` button for both opening and closing.
- The button keeps its existing size, border and header position.
- Closed state has three horizontal lines; open state has one cross.
- Remove `.menu-close` and `[data-menu-close]` from generated markup and behavior.
- Animate only `transform` and `opacity` with existing motion tokens.
- Preserve `aria-expanded`, the dynamic accessible label, backdrop close, Escape close, focus return, scroll lock and dialog stacking behavior.
- Preserve the existing desktop header and breakpoint behavior.
- Respect `prefers-reduced-motion: reduce` through the existing global reduced-motion rule.

---

### Task 1: Make the toggle the only menu control

**Files:**
- Modify: `tests/templates/site-chrome.test.js`
- Modify: `tests/templates/render-page.test.js`
- Modify: `tests/js/interactions.test.js`
- Modify: `src/templates/site-chrome.js`
- Modify: `src/js/components/mobile-menu.js`
- Regenerate: `*.html`

**Interfaces:**
- Consumes: `.menu-toggle`, `[data-menu-toggle-label]`, `[data-menu-backdrop]`, `#main-menu`.
- Produces: one `.menu-toggle` containing `.menu-toggle__icon[aria-hidden="true"]`; no `[data-menu-close]` element.

- [ ] **Step 1: Write failing template tests**

Update the header assertions in `tests/templates/site-chrome.test.js`:

```js
const toggle = document.querySelector('.menu-toggle[aria-controls="main-menu"]');
expect(toggle).not.toBeNull();
expect(document.querySelectorAll('.menu-toggle')).toHaveLength(1);
expect(toggle.querySelector('.menu-toggle__icon')?.getAttribute('aria-hidden')).toBe('true');
expect(document.querySelector('[data-menu-close]')).toBeNull();
```

Update the mobile-menu assertions in `tests/templates/render-page.test.js`:

```js
expect(html).toContain('data-menu-backdrop');
expect(html).not.toContain('data-menu-close');
expect(html).toContain('<span class="menu-toggle__icon" aria-hidden="true"></span>');
expect(html).toContain('<span class="sr-only" data-menu-toggle-label>Открыть меню</span>');
```

- [ ] **Step 2: Write the failing interaction test**

Replace the separate-close-button case in `tests/js/interactions.test.js` with production-shaped markup and close the menu by pressing the same toggle:

```js
it('opens and closes the mobile menu with the same toggle', () => {
  document.body.innerHTML = '<button class="menu-toggle" aria-expanded="false" aria-controls="main-menu"><span class="menu-toggle__icon" aria-hidden="true"></span><span data-menu-toggle-label>Открыть меню</span></button><div data-menu-backdrop></div><nav id="main-menu"><a href="#page">Страница</a></nav>';
  initMobileMenu();
  const toggle = document.querySelector('.menu-toggle');
  const label = document.querySelector('[data-menu-toggle-label]');

  toggle.click();
  expect(toggle.getAttribute('aria-expanded')).toBe('true');
  expect(label.textContent).toBe('Закрыть меню');
  expect(document.activeElement).toBe(document.querySelector('#main-menu a'));

  toggle.click();
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  expect(label.textContent).toBe('Открыть меню');
  expect(document.activeElement).toBe(toggle);

  toggle.click();
  document.querySelector('[data-menu-backdrop]').click();
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(toggle);
});
```

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```powershell
pnpm test tests/templates/site-chrome.test.js tests/templates/render-page.test.js tests/js/interactions.test.js
```

Expected: failures because the current renderer still emits `[data-menu-close]`, does not emit `.menu-toggle__icon`, and the old focus path targets the in-panel close button.

- [ ] **Step 4: Implement the single-control markup**

Change the button in `src/templates/site-chrome.js` to:

```js
'<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-menu"><span class="menu-toggle__icon" aria-hidden="true"></span><span class="sr-only" data-menu-toggle-label>Открыть меню</span></button>',
```

Change the nav rendering to remove the close button:

```js
`<nav id="main-menu" aria-label="Основная навигация">${renderNavigationLinks(activeFile)}<a class="button button-primary nav-appointment" href="${primaryPhone.href}" data-appointment-open>${renderIcon('calendar', 'button-icon')}Запись на приём</a></nav>`,
```

- [ ] **Step 5: Remove the separate JavaScript close branch**

In `src/js/components/mobile-menu.js`, remove:

```js
const closeButton = menu?.querySelector('[data-menu-close]');
closeButton?.addEventListener('click', close);
```

Keep the existing toggle handler as the single direct control:

```js
toggle.addEventListener('click', () => (isOpen ? close() : open()));
```

The existing first-focus query then resolves to the first navigation link:

```js
menu.querySelector('a[href], button:not([disabled])')?.focus();
```

- [ ] **Step 6: Regenerate pages and run focused tests**

Run:

```powershell
pnpm generate
pnpm test tests/templates/site-chrome.test.js tests/templates/render-page.test.js tests/js/interactions.test.js
```

Expected: generated pages contain one toggle and no `[data-menu-close]`; focused tests pass.

- [ ] **Step 7: Commit Task 1**

```powershell
git add src/templates/site-chrome.js src/js/components/mobile-menu.js tests/templates/site-chrome.test.js tests/templates/render-page.test.js tests/js/interactions.test.js *.html
git commit -m "feat: use one mobile menu control"
```

---

### Task 2: Animate three lines into a cross

**Files:**
- Modify: `tests/styles/home-redesign.test.js`
- Modify: `src/styles/layout.css`

**Interfaces:**
- Consumes: `.menu-toggle__icon`, `.menu-toggle[aria-expanded="true"]`, `--icon-size`, `--border-width-strong`, `--space-1`, `--menu-toggle-angle`, `--transition-interactive`.
- Produces: a stationary three-line-to-cross morph with no `.menu-close` styling.

- [ ] **Step 1: Replace the obsolete CSS assertion with failing morph assertions**

In `tests/styles/home-redesign.test.js`, replace the test that expects the open toggle to be hidden:

```js
it('morphs one stationary menu toggle into a cross', () => {
  expect(layout).toMatch(/\.menu-toggle__icon\s*{[^}]*background:\s*currentColor[^}]*transition:\s*var\(--transition-interactive\)/s);
  expect(layout).toMatch(/\.menu-toggle__icon::before,\s*\.menu-toggle__icon::after\s*{/s);
  expect(layout).toMatch(/\.menu-toggle\[aria-expanded="true"\]\s+\.menu-toggle__icon\s*{[^}]*background:\s*transparent/s);
  expect(layout).toMatch(/\.menu-toggle\[aria-expanded="true"\]\s+\.menu-toggle__icon::before\s*{[^}]*rotate\(var\(--menu-toggle-angle\)\)/s);
  expect(layout).toMatch(/\.menu-toggle\[aria-expanded="true"\]\s+\.menu-toggle__icon::after\s*{[^}]*rotate\(calc\(var\(--menu-toggle-angle\)\s*\*\s*-1\)\)/s);
  expect(layout).not.toMatch(/\.menu-open\s+\.menu-toggle\s*{[^}]*visibility:\s*hidden/s);
  expect(layout).not.toContain('.menu-close {');
});
```

- [ ] **Step 2: Run the style test and verify RED**

Run:

```powershell
pnpm test tests/styles/home-redesign.test.js
```

Expected: failure because the current pseudo-elements belong to the button, the middle line is absent, the open button is hidden and `.menu-close` still has styles.

- [ ] **Step 3: Implement the decorative three-line icon**

Replace the current `.menu-toggle::before`/`::after` rules in `src/styles/layout.css` with:

```css
.menu-toggle__icon {
  position: relative;
  inline-size: var(--icon-size);
  block-size: var(--border-width-strong);
  border-radius: var(--radius-pill);
  color: inherit;
  background: currentColor;
  transition: var(--transition-interactive);
}

.menu-toggle__icon::before,
.menu-toggle__icon::after {
  content: "";
  position: absolute;
  inset-block-start: var(--space-0);
  inset-inline-start: var(--space-0);
  inline-size: 100%;
  block-size: 100%;
  border-radius: inherit;
  background: currentColor;
  transition: var(--transition-interactive);
}

.menu-toggle__icon::before {
  transform: translateY(calc(var(--space-1) * -1));
}

.menu-toggle__icon::after {
  transform: translateY(var(--space-1));
}

.menu-toggle[aria-expanded="true"] .menu-toggle__icon {
  background: transparent;
}

.menu-toggle[aria-expanded="true"] .menu-toggle__icon::before {
  transform: translateY(var(--space-0)) rotate(var(--menu-toggle-angle));
}

.menu-toggle[aria-expanded="true"] .menu-toggle__icon::after {
  transform: translateY(var(--space-0)) rotate(calc(var(--menu-toggle-angle) * -1));
}
```

Delete the `.menu-open .menu-toggle` hiding rule and all `.menu-close` rules. Remove `.menu-close` from the no-JS and desktop selector lists while keeping `.menu-toggle` hidden for no-JS and desktop exactly as before.

- [ ] **Step 4: Run focused and full style tests**

Run:

```powershell
pnpm test tests/styles/home-redesign.test.js tests/styles/design-system.test.js
```

Expected: both files pass; the existing global reduced-motion rule still covers the icon and its pseudo-elements.

- [ ] **Step 5: Commit Task 2**

```powershell
git add src/styles/layout.css tests/styles/home-redesign.test.js
git commit -m "feat: morph menu toggle into close icon"
```

---

### Task 3: Verify production behavior

**Files:**
- Create: `.superpowers/sdd/task-animated-menu-toggle-report.md`

**Interfaces:**
- Consumes: completed Task 1 and Task 2 output.
- Produces: production verification evidence for the single animated control.

- [ ] **Step 1: Run the full automated gate**

Run:

```powershell
pnpm verify
git diff --check
```

Expected: all tests pass, Vite builds 21 pages, the site verifier accepts all 21 pages and both diff checks exit 0.

- [ ] **Step 2: Run design-system scripts**

Run:

```powershell
& 'C:\Users\bahti\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\lint_hardcodes.py' src/styles
& 'C:\Users\bahti\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\validate_theme_refs.py' src/styles/tokens.css src/styles
```

Expected: no hardcoded values and no unresolved token references.

- [ ] **Step 3: Browser QA at 390 px and 768 px**

For each viewport, verify:

```text
- toggle rectangle before/open/closed has identical x, y, width and height;
- closed state exposes three horizontal lines;
- open state exposes one centered cross;
- the same button closes the menu;
- backdrop and Escape also close it;
- aria-expanded and accessible label match the state;
- scroll lock and focus return work;
- document horizontal overflow and clipped visible controls equal zero;
- browser console has zero warnings/errors.
```

- [ ] **Step 4: Write and commit the verification report**

Create `.superpowers/sdd/task-animated-menu-toggle-report.md` with RED evidence, focused/full results and exact Browser measurements, then run:

```powershell
git add -f .superpowers/sdd/task-animated-menu-toggle-report.md
git commit -m "docs: verify animated menu toggle"
```

- [ ] **Step 5: Run the final fresh gate**

Run:

```powershell
pnpm verify
git diff --check
git status --short
```

Expected: full green gate and an empty worktree.
