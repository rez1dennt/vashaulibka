# Patient Information Pages Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the shared mobile header and all patient-information pages without changing verified legal content or working interactions.

**Architecture:** Extend the existing SVG registry and shared renderer rather than adding external assets. Give legal pages a renderer-level layout marker, generate the patient hub and related navigation from structured link metadata, and apply one token-driven responsive CSS layer to all patient routes.

**Tech Stack:** Vanilla JavaScript modules, semantic HTML, CSS custom properties, Vitest, JSDOM, Vite.

## Global Constraints

- Preserve all verified legal text, clinic facts, routes, tables, downloadable documents, and noindex behavior.
- Add no dependency, remote font, tracker, form, or personal-data field.
- Use only existing semantic tokens or new three-tier component tokens.
- Keep keyboard, vision-mode, reduced-motion, no-JS, menu, dialog, and cookie behavior working.
- Ensure no page-level horizontal overflow at 320px.

---

### Task 1: Shared Header and SVG Eye

**Files:**
- Modify: `src/templates/icons.js`
- Modify: `src/templates/site-chrome.js`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/layout.css`
- Test: `tests/templates/icons.test.js`
- Test: `tests/templates/site-chrome.test.js`
- Test: `tests/styles/home-redesign.test.js`

**Interfaces:**
- Produces: `renderIcon('eye')`, `.brand__full-name`, `.brand__short-name`, and `--menu-toggle-line-offset`.
- Preserves: one `.menu-toggle`, existing `aria-controls`, and existing menu morph selectors.

- [ ] **Step 1: Write failing markup and CSS contract tests**

```js
expect(renderIcon('eye')).toContain('<svg');
expect(header.querySelector('[data-vision-toggle] .ui-icon')).not.toBeNull();
expect(header.querySelector('.brand__short-name')?.textContent).toBe('Ваша улыбка');
expect(tokens).toMatch(/--menu-toggle-line-offset:/);
expect(layout).toMatch(/translateY\(calc\(var\(--menu-toggle-line-offset\) \* -1\)\)/);
```

- [ ] **Step 2: Run RED**

Run: `pnpm test tests/templates/icons.test.js tests/templates/site-chrome.test.js tests/styles/home-redesign.test.js`

Expected: failures for the missing eye icon, short brand label, and line-offset token.

- [ ] **Step 3: Implement the shared header contract**

Add the eye path to `ICONS`, render it inside the vision button, split the brand labels into explicit spans, add a 0.375rem primitive/component line-offset token, and use it for the hamburger pseudo-elements. Hide the full mark/subtitle on mobile and show only `.brand__short-name`; reverse that at the desktop breakpoint.

- [ ] **Step 4: Run GREEN**

Run: `pnpm test tests/templates/icons.test.js tests/templates/site-chrome.test.js tests/styles/home-redesign.test.js`

Expected: all focused tests pass.

---

### Task 2: Structured Patient Hub and Legal Page Contract

**Files:**
- Modify: `src/content/legal-pages.js`
- Modify: `src/templates/render-page.js`
- Test: `tests/content/legal-pages.test.js`
- Test: `tests/templates/render-page.test.js`

**Interfaces:**
- Produces: `page.layout === 'patient'`, `<main class="main--patient">`, `.patient-hub__group`, `.patient-link-card`, `.patient-notice`, and `.patient-related`.
- Consumes: `renderIcon(name)` and the existing patient route metadata.

- [ ] **Step 1: Write failing content contract tests**

```js
expect(document.querySelector('main')?.classList.contains('main--patient')).toBe(true);
expect(document.querySelectorAll('.patient-hub__group')).toHaveLength(3);
expect(document.querySelectorAll('.patient-link-card .ui-icon')).toHaveLength(14);
expect(document.querySelector('.patient-related a[href="patients.html"]')).not.toBeNull();
expect(document.querySelector('.table-scroll table')).not.toBeNull();
```

- [ ] **Step 2: Run RED**

Run: `pnpm test tests/content/legal-pages.test.js tests/templates/render-page.test.js`

Expected: failures for the missing layout marker and new hub/page components.

- [ ] **Step 3: Add structured rendering helpers**

Define immutable patient link metadata with group, icon, label, and verified descriptor. Build helpers for the hub groups, icon notices, editorial section shell, and related navigation. Set `layout: 'patient'` in `makePage` and have `renderPage` emit `main--patient`. Preserve every existing content string, link target, table, definition list, and document URL.

- [ ] **Step 4: Regenerate HTML and run GREEN**

Run: `pnpm generate; pnpm test tests/content/legal-pages.test.js tests/templates/render-page.test.js`

Expected: all focused tests pass and 21 HTML pages regenerate.

---

### Task 3: Token-Driven Patient Page Styling

**Files:**
- Modify: `src/styles/pages.css`
- Modify: `src/styles/tokens.css`
- Create: `tests/styles/patient-pages-polish.test.js`

**Interfaces:**
- Consumes: `.main--patient`, `.patient-hub__group`, `.patient-link-card`, `.patient-content`, `.patient-notice`, `.patient-related`.
- Produces: mobile-first one/two/three-column reflow and editorial content spacing.

- [ ] **Step 1: Write failing CSS contract tests**

```js
expect(css).toMatch(/\.patient-hub__grid\s*{[^}]*grid-template-columns:\s*minmax/s);
expect(css).toMatch(/@media \(min-width: 48rem\)[\s\S]*\.patient-hub__grid\s*{[^}]*repeat\(2,/s);
expect(css).toMatch(/@media \(min-width: 75rem\)[\s\S]*\.patient-hub__grid\s*{[^}]*repeat\(3,/s);
expect(css).toMatch(/\.patient-content\s*{[^}]*padding:/s);
expect(css).toMatch(/\.patient-content :where\(p, li\)\s*{[^}]*max-inline-size:/s);
```

- [ ] **Step 2: Run RED**

Run: `pnpm test tests/styles/patient-pages-polish.test.js`

Expected: the new stylesheet-contract tests fail.

- [ ] **Step 3: Implement responsive styling**

Use the existing warm page, raised surface, border, primary, radius, shadow, typography, motion, and spacing tokens. Give cards complete hover/focus/active states. Keep `.table-scroll table` rules unchanged and style only its surrounding patient content spacing.

- [ ] **Step 4: Run GREEN and token audits**

Run: `pnpm test tests/styles/patient-pages-polish.test.js; python C:/Users/bahti/.codex/skills/ux-ui-agent-skills/scripts/lint_hardcodes.py src/styles; python C:/Users/bahti/.codex/skills/ux-ui-agent-skills/scripts/validate_theme_refs.py src/styles/tokens.css src/styles`

Expected: focused tests pass, zero hardcoded values, and every theme reference resolves.

---

### Task 4: Generation, Browser QA, and Release Gate

**Files:**
- Modify: generated root `*.html` files through `pnpm generate`
- Modify: `.superpowers/sdd/task-about-page-redesign-report.md` only if the project report tracks the new full-suite count

**Interfaces:**
- Verifies: generated HTML, responsive layouts, keyboard states, vision mode, and repository cleanliness.

- [ ] **Step 1: Generate and run the complete project gate**

Run: `pnpm verify`

Expected: all Vitest files pass, Vite builds 21 pages, and the site verifier accepts all 21 pages.

- [ ] **Step 2: Run static quality gates**

Run: `git diff --check; node verify_states.mjs patients.html; node verify_states.mjs payment.html; node verify_states.mjs guarantees.html; node taste_audit.mjs patients.html; node accuracy_report.mjs`

Expected: diff check passes; helper limitations, if any, are recorded exactly rather than treated as project failures.

- [ ] **Step 3: Run browser QA**

Inspect `patients.html`, `payment.html`, `guarantees.html`, `privacy.html`, and `cookies.html` at 320, 390, 768, 1280, and 1440px. Confirm no page overflow, no clipped controls, the 1/2/3-column card reflow, preserved table scrolling, visible focus, mobile brand, eye icon, burger morph, vision-mode reflow, and zero console errors.

- [ ] **Step 4: Commit the verified implementation**

```powershell
git add docs src tests *.html .superpowers/sdd/task-about-page-redesign-report.md
git commit -m "feat: polish patient information pages"
```

- [ ] **Step 5: Re-run the final release gate after commit**

Run: `pnpm verify; git diff --check; git diff --cached --check; git status --short`

Expected: the full gate passes and the worktree is clean.

