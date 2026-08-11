# Animated menu toggle — verification report

Date: 2026-08-12

## Scope

- Replaced the separate mobile drawer close button with the existing `.menu-toggle`.
- Added three decorative lines inside the same button.
- The middle line fades out while the outer lines rotate into a centered cross.
- Preserved the backdrop, Escape, scroll lock, focus return, dynamic label and appointment-dialog behavior.
- Did not change clinic content, legal copy, SEO, desktop navigation or breakpoints.

## TDD evidence

### Single menu control

- RED command: `pnpm test tests/templates/site-chrome.test.js tests/templates/render-page.test.js tests/js/interactions.test.js`.
- RED result: 2 expected failures, 27 passes. The renderer still emitted `[data-menu-close]` and had no `.menu-toggle__icon`.
- GREEN result after the minimal renderer/JavaScript change: 3 files, 29/29 tests passed.
- Commit: `aec4984 feat: use one mobile menu control`.

### Three-line morph

- RED command: `pnpm test tests/styles/home-redesign.test.js`.
- RED result: 1 expected failure, 7 passes. The button still used two button pseudo-elements, was hidden while open and retained `.menu-close` styles.
- GREEN focused command: `pnpm test tests/styles/home-redesign.test.js tests/styles/design-system.test.js tests/templates/site-chrome.test.js tests/templates/render-page.test.js tests/js/interactions.test.js`.
- GREEN result: 5 files, 58/58 tests passed.
- Commit: `8ca56d3 feat: morph menu toggle into close icon`.

## Automated production gate

- `pnpm verify`: passed.
- Vitest: 14 files, 166/166 tests passed.
- Vite: 35 modules transformed; production build passed.
- Site verifier: 21/21 generated HTML pages passed.
- `git diff --check`: passed.

## Browser QA

Checked in an isolated local Browser tab at `http://127.0.0.1:4173/index.html`.

### 390×844

- Closed toggle: `x=315`, `y=61`, `48×48`.
- Open toggle: `x=315`, `y=61`, `48×48`.
- Closed again with the same toggle: `x=315`, `y=61`, `48×48`.
- Closed state: three horizontal lines; outer transforms are `translateY(-4px)` and `translateY(4px)`.
- Open state: middle background becomes transparent; outer transforms resolve to `+45deg` and `-45deg` rotation matrices.
- `aria-expanded`, «Открыть меню» / «Закрыть меню», focus transfer and body scroll lock match the visual state.
- Horizontal overflow: 0. Clipped visible links/buttons: 0.

### 768×900

- Closed/open/closed toggle: `x=681`, `y=61`, `48×48` in every state.
- Same-toggle close passed.
- Real backdrop click in the exposed dimmed area closed the drawer and returned focus to the toggle.
- Escape closed the drawer and returned focus to the toggle.
- Horizontal overflow: 0. Clipped visible links/buttons: 0.
- Console warnings/errors: 0.

## Motion and design-system gates

- Loaded CSSOM contains the global `@media (prefers-reduced-motion: reduce)` rule for all elements and pseudo-elements, with instant transition duration.
- `lint_hardcodes.py src/styles`: passed; 6 files scanned, no hardcoded values.
- `validate_theme_refs.py src/styles/tokens.css src/styles`: passed; 276 tokens, all references resolved.
- The optional skill-pack `verify_states.mjs` light/dark and `taste_audit.mjs` commands reported `SKIPPED` because their standalone Playwright dependency is not installed. Equivalent live visual/state checks were completed through the in-app Browser; no unsupported percentage or contrast claim is made.

## Result

The burger and cross are now two visual states of one stationary accessible button. No separate close control is rendered or focusable.
