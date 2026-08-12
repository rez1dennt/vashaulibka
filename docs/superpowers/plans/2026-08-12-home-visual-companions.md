# Home Visual Companions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add restrained dental editorial SVG decoration to selected homepage sections so the page feels less text-heavy without obscuring content, changing verified copy, or adding remote dependencies.

**Architecture:** Six safe local SVG files provide the decorative vocabulary. A small `renderHomeDecoration()` template helper inserts screen-reader-hidden decoration layers only into the approved homepage sections. Token-driven CSS controls stacking, responsive cropping, opacity, and two slow movements; the existing global reduced-motion rule disables those movements.

**Tech Stack:** Static HTML generation with JavaScript ES modules, vanilla CSS custom properties, local SVG assets, Vitest, JSDOM, Vite.

## Global Constraints

- Use the approved medical editorial direction from `docs/superpowers/specs/2026-08-12-home-visual-companions-design.md`.
- Keep all existing routes, verified clinic data, SEO metadata, legal copy, appointment behavior, and meaningful images unchanged.
- Add no external libraries, fonts, images, trackers, remote resources, emoji, or embedded SVG text.
- Decorations must be `aria-hidden="true"`, non-interactive, and always behind readable content and controls.
- Add decoration only to the hero, quick links, services, staff/prices, and patient-information sections.
- Add no new decoration to the about, documents, or contacts sections.
- At 320 px keep one simplified motif per decorated section, no horizontal overflow, and no clipped controls.
- Animate only the large hero tooth and quick-links tooth by 2–4 px; the existing `prefers-reduced-motion: reduce` rule must make that movement instant.
- Use existing semantic colors and new semantic decoration tokens; do not add raw values to component/page CSS.

---

### Task 1: Safe local editorial SVG assets

**Files:**
- Create: `public/assets/decor/home-hero-smile.svg`
- Create: `public/assets/decor/home-hero-tooth.svg`
- Create: `public/assets/decor/home-quick-tooth.svg`
- Create: `public/assets/decor/home-services-dental.svg`
- Create: `public/assets/decor/home-staff-jaw.svg`
- Create: `public/assets/decor/home-patients-docs.svg`
- Modify: `tests/assets/assets.test.js`

**Interfaces:**
- Consumes: Existing brand colors `#2879d8` and `#eef6ff` from `src/styles/tokens.css`.
- Produces: Six local SVG paths consumed by `.home-decor--*` classes in Task 3.

- [ ] **Step 1: Add a failing asset-safety test**

Add the asset names and test below to `tests/assets/assets.test.js`:

```js
const HOME_DECORATIONS = [
  'home-hero-smile',
  'home-hero-tooth',
  'home-quick-tooth',
  'home-services-dental',
  'home-staff-jaw',
  'home-patients-docs',
];
const DECOR_ROOT = 'public/assets/decor';

it.each(HOME_DECORATIONS)('provides safe local editorial decoration in %s.svg', (name) => {
  const file = `${DECOR_ROOT}/${name}.svg`;
  expect(existsSync(file), `${file} should exist`).toBe(true);

  const svg = readFileSync(file, 'utf8');
  expect(svg).toMatch(/<svg\b[^>]*viewBox=["'][^"']+["']/i);
  expect(svg).toMatch(/<(?:path|circle|rect|line|polyline|ellipse)\b/i);
  expect(svg).not.toMatch(/<(?:text|image|script|foreignObject)\b/i);
  expect(svg).not.toMatch(/(?:href|src)\s*=\s*["'](?:https?:|data:|\/\/)/i);
  expect(svg).not.toMatch(/url\(\s*["']?(?:https?:|data:|\/\/)/i);
  expect(svg).not.toMatch(/\son[a-z]+\s*=/i);
});
```

- [ ] **Step 2: Run the asset test and confirm RED**

Run: `pnpm test tests/assets/assets.test.js --reporter=dot`

Expected: FAIL because all six `public/assets/decor/*.svg` files are absent.

- [ ] **Step 3: Create the six SVG compositions**

Create each file with a `viewBox`, no accessible text, no external references, rounded line caps, `stroke="#2879d8"`, and optional low-area `fill="#eef6ff"`. Use these exact compositions:

```xml
<!-- home-hero-smile.svg; viewBox="0 0 420 160" -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 160" fill="none">
  <path d="M18 42c78 92 296 123 384 12" stroke="#2879d8" stroke-width="3" stroke-linecap="round"/>
  <path d="M72 61c76 57 218 71 282 15" stroke="#2879d8" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="7 12"/>
</svg>
```

```xml
<!-- home-hero-tooth.svg; viewBox="0 0 260 320" -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 320" fill="none">
  <path d="M130 28c-29 0-43-17-70-12C22 23 12 57 20 97c9 46 28 60 34 116 6 51 20 77 40 77 22 0 20-69 36-69s14 69 36 69c20 0 34-26 40-77 6-56 25-70 34-116 8-40-2-74-40-81-27-5-41 12-70 12Z" fill="#eef6ff" stroke="#2879d8" stroke-width="3"/>
  <path d="M78 72c28 17 75 17 104 0" stroke="#2879d8" stroke-width="2" stroke-linecap="round"/>
</svg>
```

```xml
<!-- home-quick-tooth.svg; viewBox="0 0 300 360" -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 360" fill="none">
  <path d="M150 22c-34 0-52-18-82-12C26 18 14 57 25 105c11 49 35 68 40 125 5 63 22 100 47 100 24 0 19-83 38-83s14 83 38 83c25 0 42-37 47-100 5-57 29-76 40-125 11-48-1-87-43-95-30-6-48 12-82 12Z" stroke="#2879d8" stroke-width="3"/>
  <path d="M75 104c38 27 112 32 155 4" stroke="#2879d8" stroke-width="1.5" stroke-dasharray="8 13"/>
</svg>
```

```xml
<!-- home-services-dental.svg; viewBox="0 0 520 300" -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 300" fill="none">
  <path d="M88 26c-30 0-55 26-55 70 0 39 25 52 30 101 4 40 16 65 32 65 18 0 13-58 28-58s10 58 28 58c16 0 28-25 32-65 5-49 30-62 30-101 0-44-25-70-55-70-18 0-30 10-50 10S106 26 88 26Z" fill="#eef6ff" stroke="#2879d8" stroke-width="3"/>
  <path d="M250 63h42v48h-42zM257 111h28l8 121h-44l8-121Z" stroke="#2879d8" stroke-width="3"/>
  <path d="M337 88c52-34 113-29 154 18M342 127c50-28 104-23 144 13" stroke="#2879d8" stroke-width="3" stroke-linecap="round"/>
  <circle cx="358" cy="117" r="7" fill="#eef6ff" stroke="#2879d8" stroke-width="2"/>
  <circle cx="407" cy="101" r="7" fill="#eef6ff" stroke="#2879d8" stroke-width="2"/>
  <circle cx="456" cy="104" r="7" fill="#eef6ff" stroke="#2879d8" stroke-width="2"/>
</svg>
```

```xml
<!-- home-staff-jaw.svg; viewBox="0 0 620 280" -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 280" fill="none">
  <path d="M30 70c85-51 181-59 277-25 96-34 192-26 283 25" stroke="#2879d8" stroke-width="3" stroke-linecap="round"/>
  <path d="M50 105c73 113 175 151 257 151s184-38 263-151" stroke="#2879d8" stroke-width="3" stroke-linecap="round"/>
  <path d="M96 95v47m53-63v79m54-91v106m54-116v126m54-126v126m54-116v106m54-91v79m53-63v47" stroke="#2879d8" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="548" cy="47" r="30" fill="#eef6ff" stroke="#2879d8" stroke-width="3"/>
  <path d="M535 29v36m0-30h12c11 0 17 5 17 14 0 8-6 14-17 14h-12m0-9h30" stroke="#2879d8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

```xml
<!-- home-patients-docs.svg; viewBox="0 0 420 320" -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 320" fill="none">
  <path d="M44 24h198l58 58v214H44V24Z" fill="#eef6ff" stroke="#2879d8" stroke-width="3"/>
  <path d="M242 24v58h58M89 130h130M89 174h130M89 218h88" stroke="#2879d8" stroke-width="3" stroke-linecap="round"/>
  <path d="M328 112c30 17 45 17 70 0v67c0 46-24 78-70 104-46-26-70-58-70-104v-67c25 17 40 17 70 0Z" fill="#eef6ff" stroke="#2879d8" stroke-width="3"/>
  <path d="m300 191 20 20 38-47" stroke="#2879d8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

- [ ] **Step 4: Run the asset test and confirm GREEN**

Run: `pnpm test tests/assets/assets.test.js --reporter=dot`

Expected: PASS, including the six new parameterized cases.

- [ ] **Step 5: Commit the safe assets**

```powershell
git add public/assets/decor tests/assets/assets.test.js
git commit -m "feat: add dental editorial svg assets"
```

---

### Task 2: Decoration markup contract

**Files:**
- Create: `src/templates/home-decoration.js`
- Modify: `src/templates/render-hero.js`
- Modify: `src/content/home-page.js`
- Modify: `tests/content/home-page.test.js`

**Interfaces:**
- Consumes: Decoration names `hero-smile`, `hero-tooth`, `quick-tooth`, `services-dental`, `staff-jaw`, and `patients-docs`.
- Produces: `renderHomeDecoration(name)` returning `<span class="home-decor home-decor--NAME" aria-hidden="true"></span>`.

- [ ] **Step 1: Write failing DOM contract tests**

Add these assertions to `tests/content/home-page.test.js`:

```js
it('adds decorative companions only to the approved homepage sections', () => {
  const document = render();

  expect([...document.querySelectorAll('.home-decor')].map((node) => node.classList[1])).toEqual([
    'home-decor--hero-smile',
    'home-decor--hero-tooth',
    'home-decor--quick-tooth',
    'home-decor--services-dental',
    'home-decor--staff-jaw',
    'home-decor--patients-docs',
  ]);
  expect([...document.querySelectorAll('.home-decor')].every((node) => node.getAttribute('aria-hidden') === 'true')).toBe(true);
  expect(document.querySelector('.home-about .home-decor')).toBeNull();
  expect(document.querySelector('.home-documents .home-decor')).toBeNull();
  expect(document.querySelector('.home-contact .home-decor')).toBeNull();
});

it('keeps decorative companions free of interactive or meaningful content', () => {
  const document = render();

  for (const decoration of document.querySelectorAll('.home-decor')) {
    expect(decoration.children).toHaveLength(0);
    expect(decoration.textContent).toBe('');
    expect(decoration.matches('a, button, img, svg')).toBe(false);
  }
});
```

- [ ] **Step 2: Run the homepage test and confirm RED**

Run: `pnpm test tests/content/home-page.test.js --reporter=dot`

Expected: FAIL because `.home-decor` does not exist.

- [ ] **Step 3: Add the focused template helper**

Create `src/templates/home-decoration.js`:

```js
const SAFE_DECORATIONS = new Set([
  'hero-smile',
  'hero-tooth',
  'quick-tooth',
  'services-dental',
  'staff-jaw',
  'patients-docs',
]);

export function renderHomeDecoration(name) {
  if (!SAFE_DECORATIONS.has(name)) {
    throw new TypeError(`Unknown home decoration: ${name}`);
  }

  return `<span class="home-decor home-decor--${name}" aria-hidden="true"></span>`;
}
```

- [ ] **Step 4: Insert decorations in the approved sections**

Import the helper in both producers:

```js
import { renderHomeDecoration } from './home-decoration.js';
```

In `render-hero.js`, put these two spans immediately after the opening `<section class="home-hero">`:

```js
renderHomeDecoration('hero-smile'),
renderHomeDecoration('hero-tooth'),
```

In `home-page.js`, import from `../templates/home-decoration.js` and insert exactly one decoration immediately after the opening tag of each approved section:

```js
renderHomeDecoration('quick-tooth'),
renderHomeDecoration('services-dental'),
renderHomeDecoration('staff-jaw'),
renderHomeDecoration('patients-docs'),
```

Keep `home-about`, `home-documents`, and `home-contact` unchanged.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run: `pnpm test tests/content/home-page.test.js tests/templates/render-page.test.js --reporter=dot`

Expected: PASS; the homepage still has one H1 and the same section sequence.

- [ ] **Step 6: Commit the markup contract**

```powershell
git add src/templates/home-decoration.js src/templates/render-hero.js src/content/home-page.js tests/content/home-page.test.js
git commit -m "feat: place homepage editorial decorations"
```

---

### Task 3: Token-driven responsive styling and restrained motion

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/pages.css`
- Modify: `src/styles/components.css`
- Modify: `tests/styles/home-redesign.test.js`

**Interfaces:**
- Consumes: `.home-decor--*` elements from Task 2 and local SVG paths from Task 1.
- Produces: Responsive placement, stable stacking, two slow animations, vision-mode reduction, and reduced-motion compatibility.

- [ ] **Step 1: Write failing CSS contract tests**

Append these tests to `tests/styles/home-redesign.test.js`:

```js
it('places editorial decoration behind homepage content with local assets', () => {
  expect(tokens).toMatch(/--home-decor-opacity:\s*var\(--primitive-opacity-decor\)/);
  expect(tokens).toMatch(/--home-decor-size-large:\s*var\(--primitive-size-decor-large\)/);
  expect(pages).toMatch(/\.home-decor\s*{[^}]*position:\s*absolute[^}]*pointer-events:\s*none/s);
  expect(pages).toMatch(/\.home-decor--hero-smile\s*{[^}]*home-hero-smile\.svg/s);
  expect(pages).toMatch(/\.home-decor--hero-tooth\s*{[^}]*home-hero-tooth\.svg/s);
  expect(pages).toMatch(/\.home-decor--quick-tooth\s*{[^}]*home-quick-tooth\.svg/s);
  expect(pages).toMatch(/\.home-decor--services-dental\s*{[^}]*home-services-dental\.svg/s);
  expect(pages).toMatch(/\.home-decor--staff-jaw\s*{[^}]*home-staff-jaw\.svg/s);
  expect(pages).toMatch(/\.home-decor--patients-docs\s*{[^}]*home-patients-docs\.svg/s);
});

it('simplifies decoration on mobile and expands it without covering content', () => {
  expect(pages).toMatch(/\.home-decor--hero-tooth\s*{[^}]*display:\s*none/s);
  expect(pages).toMatch(/\.home-hero__inner,\s*\.quick-links__grid,[\s\S]*?position:\s*relative[^}]*z-index:\s*1/s);
  expect(pages).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*?\.home-decor--hero-tooth\s*{[^}]*display:\s*block/s);
  expect(pages).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.home-decor--services-dental/s);
  expect(components).toMatch(/\.vision-mode\s+\.home-decor\s*{[^}]*opacity:\s*var\(--home-decor-opacity-vision\)/s);
});

it('moves only two decorations and preserves the reduced-motion contract', () => {
  expect(pages).toMatch(/\.home-decor--hero-tooth\s*{[^}]*animation:\s*home-decor-float/s);
  expect(pages).toMatch(/\.home-decor--quick-tooth\s*{[^}]*animation:\s*home-decor-drift/s);
  expect(pages.match(/animation:\s*home-decor-/g)).toHaveLength(2);
  expect(pages).toMatch(/@keyframes\s+home-decor-float/);
  expect(pages).toMatch(/@keyframes\s+home-decor-drift/);
  expect(components).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/s);
});
```

- [ ] **Step 2: Run the CSS test and confirm RED**

Run: `pnpm test tests/styles/home-redesign.test.js --reporter=dot`

Expected: FAIL on missing tokens and `.home-decor` selectors.

- [ ] **Step 3: Add primitive and semantic decoration tokens**

Add these primitives to `:root` in `src/styles/tokens.css`:

```css
--primitive-opacity-decor: 0.1;
--primitive-opacity-decor-vision: 0.035;
--primitive-size-decor-small: 10rem;
--primitive-size-decor-medium: 20rem;
--primitive-size-decor-large: 34rem;
--primitive-motion-decor: 12s;
--primitive-motion-decor-slow: 16s;
--primitive-distance-decor: 0.25rem;
```

Add these semantic aliases:

```css
--home-decor-opacity: var(--primitive-opacity-decor);
--home-decor-opacity-vision: var(--primitive-opacity-decor-vision);
--home-decor-size-small: var(--primitive-size-decor-small);
--home-decor-size-medium: var(--primitive-size-decor-medium);
--home-decor-size-large: var(--primitive-size-decor-large);
--home-decor-motion: var(--primitive-motion-decor);
--home-decor-motion-slow: var(--primitive-motion-decor-slow);
--home-decor-distance: var(--primitive-distance-decor);
```

- [ ] **Step 4: Implement the mobile-first decoration layer**

Add to `src/styles/pages.css` near the homepage section rules:

```css
.home-hero,
.quick-links,
.home-services,
.home-staff-prices,
.home-patients {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.home-hero__inner,
.quick-links__grid,
.home-services > .container,
.home-staff-prices__grid,
.home-patients > .container {
  position: relative;
  z-index: 1;
}

.home-decor {
  position: absolute;
  z-index: 0;
  display: block;
  inline-size: var(--home-decor-size-small);
  block-size: var(--home-decor-size-small);
  opacity: var(--home-decor-opacity);
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  pointer-events: none;
}

.home-decor--hero-smile {
  inset: auto auto var(--space-4) calc(var(--space-8) * -1);
  inline-size: var(--home-decor-size-medium);
  background-image: url("/assets/decor/home-hero-smile.svg");
}

.home-decor--hero-tooth {
  display: none;
  background-image: url("/assets/decor/home-hero-tooth.svg");
  animation: home-decor-float var(--home-decor-motion-slow) var(--motion-easing-standard) infinite alternate;
}

.home-decor--quick-tooth {
  inset: var(--space-4) calc(var(--space-12) * -1) auto auto;
  background-image: url("/assets/decor/home-quick-tooth.svg");
  animation: home-decor-drift var(--home-decor-motion) var(--motion-easing-standard) infinite alternate;
}

.home-decor--services-dental {
  inset: auto calc(var(--space-16) * -1) var(--space-4) auto;
  background-image: url("/assets/decor/home-services-dental.svg");
}

.home-decor--staff-jaw {
  inset: var(--space-4) auto auto calc(var(--space-14) * -1);
  background-image: url("/assets/decor/home-staff-jaw.svg");
}

.home-decor--patients-docs {
  inset: auto calc(var(--space-10) * -1) var(--space-4) auto;
  background-image: url("/assets/decor/home-patients-docs.svg");
}

@keyframes home-decor-float {
  from { transform: translateY(calc(var(--home-decor-distance) * -1)); }
  to { transform: translateY(var(--home-decor-distance)); }
}

@keyframes home-decor-drift {
  from { transform: translateX(calc(var(--home-decor-distance) * -1)); }
  to { transform: translateX(var(--home-decor-distance)); }
}
```

- [ ] **Step 5: Add tablet and desktop placements**

Within the existing `@media (min-width: 48rem)` block, add:

```css
.home-decor {
  inline-size: var(--home-decor-size-medium);
  block-size: var(--home-decor-size-medium);
}

.home-decor--hero-tooth {
  inset: var(--space-8) calc(var(--space-16) * -1) auto auto;
  display: block;
  background-image: url("/assets/decor/home-hero-tooth.svg");
}

.home-decor--hero-smile {
  inset-inline-start: var(--space-0);
}
```

Within the existing `@media (min-width: 75rem)` block, add:

```css
.home-decor--hero-tooth,
.home-decor--quick-tooth,
.home-decor--services-dental,
.home-decor--staff-jaw,
.home-decor--patients-docs {
  inline-size: var(--home-decor-size-large);
  block-size: var(--home-decor-size-large);
}

.home-decor--services-dental { inset-inline-end: calc(var(--space-20) * -1); }
.home-decor--staff-jaw { inset-inline-start: calc(var(--space-20) * -1); }
.home-decor--patients-docs { inset-inline-end: calc(var(--space-16) * -1); }
```

- [ ] **Step 6: Reduce decoration in vision mode**

Add before the reduced-motion block in `src/styles/components.css`:

```css
.vision-mode .home-decor {
  opacity: var(--home-decor-opacity-vision);
}
```

The existing reduced-motion wildcard already replaces both decoration animation durations with `var(--motion-duration-instant)` and limits iteration count to one; do not duplicate that rule.

- [ ] **Step 7: Run focused CSS and content tests**

Run: `pnpm test tests/styles/home-redesign.test.js tests/content/home-page.test.js tests/assets/assets.test.js --reporter=dot`

Expected: PASS with exactly two `home-decor-*` animation declarations.

- [ ] **Step 8: Run token discipline audits**

Run:

```powershell
$python = 'C:\Users\bahti\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $python 'C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\lint_hardcodes.py' src/styles
& $python 'C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\validate_theme_refs.py' src/styles/tokens.css src/styles
& $python 'C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\check_no_emoji.py' src
```

Expected: all three commands exit 0; no hardcoded CSS values, missing token references, or emoji.

- [ ] **Step 9: Commit the visual system**

```powershell
git add src/styles/tokens.css src/styles/pages.css src/styles/components.css tests/styles/home-redesign.test.js
git commit -m "feat: style responsive homepage illustrations"
```

---

### Task 4: Generated output, responsive Browser QA, and release gate

**Files:**
- Regenerate: `index.html`
- Regenerate: Other root HTML files only if the shared generator changes their byte output.
- Test: `tests/content/home-page.test.js`
- Test: `tests/styles/home-redesign.test.js`
- Test: `tests/assets/assets.test.js`

**Interfaces:**
- Consumes: Complete asset, markup, and style contracts from Tasks 1–3.
- Produces: Generated production HTML, verified responsive presentation, and a clean committed worktree.

- [ ] **Step 1: Regenerate static pages**

Run: `pnpm generate`

Expected: exit 0; generated `index.html` contains six `.home-decor` spans and all other page content remains generator-owned.

- [ ] **Step 2: Verify generated decoration boundaries**

Run:

```powershell
rg -o 'home-decor--[a-z-]+' index.html
rg -n 'home-decor' about.html contacts.html
```

Expected: the first command lists the six approved classes once each. The second command produces no matches.

- [ ] **Step 3: Perform live Browser QA at five widths**

Use the existing local preview at `http://127.0.0.1:4173/index.html`. At widths 320, 390, 768, 1280, and 1440 verify:

- `document.documentElement.scrollWidth === document.documentElement.clientWidth`;
- headings, buttons, card text, and images do not intersect `.home-decor` visually;
- 320 and 390 show no `.home-decor--hero-tooth`, while every decorated section retains one subtle motif;
- 768 and wider show the hero tooth and all six approved decorations;
- documents and contacts remain visually unchanged;
- the logo, burger transformation, appointment action, cookie banner, and footer stay usable;
- console errors remain zero and page assets are same-origin only.

Take screenshots at 320, 768, and 1440 for direct visual comparison.

- [ ] **Step 4: Verify vision and motion modes**

In the Browser:

- enable the version for visually impaired users and confirm decoration opacity is reduced while text and controls remain unchanged;
- inspect loaded CSSOM for the `prefers-reduced-motion: reduce` rule and confirm it targets all elements/pseudo-elements with instant duration and one iteration;
- if the Browser supports media emulation, emulate reduced motion and confirm the two decorations do not continuously move; otherwise record the static CSS/test evidence without claiming live emulation.

- [ ] **Step 5: Run the complete project gate**

Run: `pnpm verify`

Expected: all Vitest files pass, Vite builds all 21 HTML pages, and `verify:site` reports `Verified 21 HTML pages`.

- [ ] **Step 6: Run final repository checks**

Run:

```powershell
git diff --check
git status --short
```

Expected: `git diff --check` exits 0. Status contains only intended generated HTML, six SVG files, source files, and focused tests.

- [ ] **Step 7: Commit the generated output and QA-complete feature**

```powershell
git add index.html about.html benefits.html complaints.html contacts.html cookies.html guarantees.html informed-consent.html license.html oms.html patients.html payment.html personal-data-consent.html prices.html privacy.html reviews.html services.html specialists.html standards.html vacancies.html waiting-periods.html
git commit -m "build: regenerate clinic pages with homepage art"
```

If generation changes only `index.html`, stage and commit only `index.html`.

- [ ] **Step 8: Confirm the final state**

Run:

```powershell
pnpm verify
git status --short
git log -5 --oneline
```

Expected: the fresh full gate passes again, `git status --short` is empty, and the five latest commits show the plan plus the four implementation checkpoints.
