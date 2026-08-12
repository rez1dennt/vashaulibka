# Local Accessibility Mode Implementation Plan

> **Superseded on 12 August 2026:** Tasks 1–6 were partially implemented before the interaction design changed. Continue with `docs/superpowers/plans/2026-08-12-compact-accessibility-controls.md`; do not execute the remaining tasks in this file.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current one-switch visually-impaired mode with a fully local, persistent accessibility toolbar that targets WCAG 2.1 AA requirements adopted by ГОСТ Р 52872-2019 across all 21 generated pages, without third-party scripts, remote speech services, or unverified public conformance claims.

**Architecture:** The shared page renderer emits an early, strictly validated settings bootstrap and one reusable toolbar in the site header. A small state module owns a versioned localStorage record, while focused components apply display preferences, image alternatives, and browser-local speech. CSS consumes semantic tokens and `data-accessibility-*` attributes on `<html>` so all generated pages receive the same behavior. Existing page generation, privacy copy, tests, the production verifier, and browser QA are updated together.

**Tech Stack:** Vanilla JavaScript ES modules, static HTML generators, CSS custom properties, Web Speech API (`speechSynthesis` with local Russian voices only), Vitest 4, JSDOM 26, Vite 8, pnpm 11.

## Global Constraints

- Do not add Lidrekon, jQuery, remote CSS, remote images, remote fonts, remote TTS, analytics, trackers, or any new runtime network dependency.
- Do not write «сайт соответствует ГОСТ» in public copy until the final 21-page automated and browser audit has passed and clinic/legal sign-off has been recorded.
- Keep the existing eye SVG and the visible label «Версия для слабовидящих».
- The toolbar must not use a modal, backdrop, scroll lock, focus trap, URL navigation, or duplicated accessible pages.
- Every implementation change follows RED → minimal GREEN → refactor → focused GREEN. Run the full gate only after focused tests pass.
- Preserve progressive enhancement: page content and navigation remain readable without JavaScript; only the interactive preferences toolbar is unavailable.
- Preserve the three-tier token discipline: primitives only in `tokens.css`; feature CSS consumes semantic or component aliases.
- All generated HTML remains byte-stable after `pnpm generate`.

---

## Task 1: Add a closed-list, versioned preference model

**Files:**

- Create: `src/js/core/accessibility-preferences.js`
- Modify: `src/js/core/storage.js`
- Create: `tests/js/accessibility-preferences.test.js`
- Modify: `tests/js/interactions.test.js`

- [ ] **Step 1: Write failing model and storage tests**

Add tests covering:

1. exact defaults;
2. round-trip serialization;
3. rejection of unknown versions, unknown enum values, extra types, arrays, `null`, and malformed JSON;
4. migration of legacy `vision-mode=on` to enabled mode with 125% scale;
5. removal of the legacy key after the first successful new-format save;
6. graceful behavior when localStorage throws for get, set, or remove.

The public contract must be:

```js
export const ACCESSIBILITY_STORAGE_KEY = 'accessibility-preferences';
export const ACCESSIBILITY_PREFERENCES_VERSION = 1;
export const DEFAULT_ACCESSIBILITY_PREFERENCES = Object.freeze({
  version: 1,
  enabled: false,
  scale: '100',
  theme: 'standard',
  font: 'site',
  letterSpacing: 'standard',
  lineHeight: 'standard',
  paragraphSpacing: 'standard',
  images: 'visible',
});

export function parseAccessibilityPreferences(raw) {}
export function loadAccessibilityPreferences(storage) {}
export function saveAccessibilityPreferences(storage, preferences) {}
export function resetAccessibilityPreferences(storage) {}
```

Extend the storage adapter with:

```js
remove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Run the focused RED tests**

Run:

```powershell
pnpm test tests/js/accessibility-preferences.test.js tests/js/interactions.test.js
```

Expected RED: missing module exports and missing `safeStorage.remove`.

- [ ] **Step 3: Implement strict parsing and migration**

Use closed sets for each choice:

```js
const CHOICES = Object.freeze({
  scale: new Set(['100', '125', '150', '200']),
  theme: new Set(['standard', 'black-white', 'white-black', 'blue-light']),
  font: new Set(['site', 'sans']),
  letterSpacing: new Set(['standard', 'medium', 'large']),
  lineHeight: new Set(['standard', 'medium', 'large']),
  paragraphSpacing: new Set(['standard', 'large']),
  images: new Set(['visible', 'hidden']),
});
```

`parseAccessibilityPreferences` must return a fresh normalized object only when every required key has the exact expected type and allowed value. Otherwise it returns `null`. `loadAccessibilityPreferences` returns valid new settings, otherwise migrates legacy `vision-mode=on`, otherwise returns a fresh default. `saveAccessibilityPreferences` validates before writing and removes `vision-mode` only after a successful write. `resetAccessibilityPreferences` removes both keys and returns a fresh default.

- [ ] **Step 4: Run focused GREEN tests**

Run the same focused command. Expected: all preference and storage cases pass.

- [ ] **Step 5: Commit Task 1**

```powershell
git add src/js/core/accessibility-preferences.js src/js/core/storage.js tests/js/accessibility-preferences.test.js tests/js/interactions.test.js
git commit -m "feat: add accessibility preference model"
```

---

## Task 2: Render the toolbar and early settings bootstrap on every page

**Files:**

- Create: `src/templates/accessibility-panel.js`
- Create: `src/templates/accessibility-bootstrap.js`
- Modify: `src/templates/site-chrome.js`
- Modify: `src/templates/render-page.js`
- Create: `tests/templates/accessibility-panel.test.js`
- Modify: `tests/templates/site-chrome.test.js`
- Modify: `tests/templates/render-page.test.js`

- [ ] **Step 1: Write failing template tests**

Assert that every rendered page has exactly one:

- toggle with `aria-controls="accessibility-panel"` and `aria-expanded="false"`;
- `<section id="accessibility-panel" data-accessibility-panel hidden>`;
- labeled control group for text size, color theme, font, letter spacing, line height, paragraph spacing, and images;
- reset and close buttons;
- speech group with read, pause/resume, and stop controls;
- polite live region;
- early bootstrap script before the stylesheet link.

Assert that all choices are native buttons with `aria-pressed`, that the toolbar has no dialog role, and that it contains no forms or user-data inputs.

- [ ] **Step 2: Run the focused RED tests**

```powershell
pnpm test tests/templates/accessibility-panel.test.js tests/templates/site-chrome.test.js tests/templates/render-page.test.js
```

Expected RED: toolbar and bootstrap templates do not exist; the current toggle uses `aria-pressed` as a single switch.

- [ ] **Step 3: Implement reusable toolbar markup**

`renderAccessibilityPanel()` returns a single normal-flow section after the utility bar. Use this exact semantic structure:

```html
<section class="accessibility-panel" id="accessibility-panel"
  data-accessibility-panel aria-labelledby="accessibility-panel-title" hidden>
  <div class="header-shell accessibility-panel__inner">
    <div class="accessibility-panel__heading">
      <h2 id="accessibility-panel-title">Настройки доступности</h2>
      <button type="button" data-accessibility-close aria-label="Закрыть настройки">×</button>
    </div>
    <div class="accessibility-panel__groups">
      <!-- fieldsets generated from closed configuration arrays -->
    </div>
    <div class="accessibility-panel__actions">
      <button type="button" data-accessibility-reset>Сбросить настройки</button>
    </div>
    <p class="sr-only" data-accessibility-status role="status" aria-live="polite"></p>
  </div>
</section>
```

Each setting button uses `data-accessibility-setting` and `data-accessibility-value`. Speech buttons use `data-speech-read`, `data-speech-pause`, and `data-speech-stop` and start disabled until capability detection succeeds.

Change the existing eye button to:

```html
<button type="button" data-vision-toggle
  aria-controls="accessibility-panel" aria-expanded="false">
  <!-- existing eye SVG -->Версия для слабовидящих
</button>
```

- [ ] **Step 4: Implement the pre-CSS bootstrap**

`renderAccessibilityBootstrap()` must return a small inline script that:

1. swaps `no-js` to `js`;
2. reads only `accessibility-preferences`;
3. validates version and closed-list choices without `eval`;
4. applies only validated `data-accessibility-*` attributes to `<html>`;
5. catches storage and JSON errors;
6. never loads a resource or writes page content.

Insert it before `<link rel="stylesheet" href="/src/styles/main.css">`. Keep the module script at the end of `<body>`.

- [ ] **Step 5: Run focused GREEN tests and regenerate**

```powershell
pnpm test tests/templates/accessibility-panel.test.js tests/templates/site-chrome.test.js tests/templates/render-page.test.js
pnpm generate
git diff --check
```

Expected: tests pass and all 21 generated pages contain one toolbar and one early bootstrap.

- [ ] **Step 6: Commit Task 2**

```powershell
git add src/templates/accessibility-panel.js src/templates/accessibility-bootstrap.js src/templates/site-chrome.js src/templates/render-page.js tests/templates/accessibility-panel.test.js tests/templates/site-chrome.test.js tests/templates/render-page.test.js *.html
git commit -m "feat: render local accessibility toolbar"
```

---

## Task 3: Replace the legacy switch with a stateful accessibility controller

**Files:**

- Create: `src/js/components/accessibility-mode.js`
- Delete: `src/js/components/vision-mode.js`
- Modify: `src/js/main.js`
- Modify: `tests/js/interactions.test.js`
- Create: `tests/js/accessibility-mode.test.js`

- [ ] **Step 1: Write failing controller tests**

Build production-shaped JSDOM markup from `renderHeader()` and cover:

- opening by eye button updates `hidden`, `aria-expanded`, and focus;
- repeat toggle, close button, and Escape close and restore focus to the eye button;
- closing does not reset active settings;
- setting buttons update one field, persist one JSON object, and update `aria-pressed` roving state;
- enabling happens when a non-default setting is selected;
- reset restores defaults, removes both storage keys, updates the DOM, and keeps the panel open;
- malformed storage is ignored;
- legacy `vision-mode=on` migrates to enabled 125%;
- no backdrop, modal role, body scroll lock, or focus trap is introduced.

The initializer contract is:

```js
export function initAccessibilityMode({
  storage = safeStorage,
  imageController,
  speechController,
} = {}) {}
```

- [ ] **Step 2: Run focused RED**

```powershell
pnpm test tests/js/accessibility-mode.test.js tests/js/interactions.test.js
```

Expected RED: missing initializer and legacy test expectations no longer match the approved design.

- [ ] **Step 3: Implement one-way state application**

The controller owns one `preferences` object and exposes an internal `apply(preferences)` that sets or removes only:

```text
data-accessibility-enabled
data-accessibility-scale
data-accessibility-theme
data-accessibility-font
data-accessibility-letter-spacing
data-accessibility-line-height
data-accessibility-paragraph-spacing
data-accessibility-images
```

Use `enabled="true"` only when the mode is active. Synchronize every choice button from state. Update the live region with concise messages such as «Размер текста: 150 процентов». Do not announce initial hydration.

When disabling the mode, retain the chosen values in storage but remove all active presentation attributes except the persisted record. The next enable reapplies them. Reset returns all values to defaults and disables the mode.

- [ ] **Step 4: Wire main entry and remove legacy code**

Replace `initVisionMode()` with `initAccessibilityMode()` in `src/js/main.js`. Delete the old module and old assertions for `.vision-mode`/`aria-pressed` single-switch behavior.

- [ ] **Step 5: Run focused GREEN and full interaction regression**

```powershell
pnpm test tests/js/accessibility-mode.test.js tests/js/interactions.test.js
```

Expected: controller tests and all existing menu/dialog/cookie interaction tests pass.

- [ ] **Step 6: Commit Task 3**

```powershell
git add src/js/components/accessibility-mode.js src/js/components/vision-mode.js src/js/main.js tests/js/accessibility-mode.test.js tests/js/interactions.test.js
git commit -m "feat: control persistent accessibility settings"
```

---

## Task 4: Add reversible image alternatives

**Files:**

- Create: `src/js/components/accessibility-images.js`
- Create: `tests/js/accessibility-images.test.js`
- Modify: `src/js/components/accessibility-mode.js`
- Modify: `tests/js/accessibility-mode.test.js`

- [ ] **Step 1: Write failing image-mode tests**

Cover these production cases:

- informative image with `alt` gets hidden and a visible compact text alternative with that `alt`;
- informative image in `<figure>` prefers its non-empty `figcaption` only when it adds useful context, otherwise uses `alt`;
- decorative `alt=""` image is hidden without an empty placeholder;
- brand logo and images outside `<main>` are never changed;
- originally hidden images remain hidden after restoration;
- repeat hide/show calls create no duplicate alternatives;
- restoring removes generated alternatives and restores original image state.

Public contract:

```js
export function createAccessibilityImageController({ root = document } = {}) {
  return {
    setHidden(hidden) {},
    destroy() {},
  };
}
```

- [ ] **Step 2: Run focused RED**

```powershell
pnpm test tests/js/accessibility-images.test.js tests/js/accessibility-mode.test.js
```

Expected RED: missing controller.

- [ ] **Step 3: Implement reversible DOM annotations**

Only inspect `main img`. Track original `hidden` and `aria-hidden` state in a `WeakMap`. Generate:

```html
<span class="accessibility-image-alternative"
  data-accessibility-image-alternative role="img">Описание изображения</span>
```

Sanitize by assigning `textContent`, never `innerHTML`. Mark generated nodes so repeat calls are idempotent. For an informative image with no usable text use «Изображение к разделу» rather than exposing the filename. Decorative images receive no replacement. `destroy()` restores and clears every managed image.

- [ ] **Step 4: Integrate with the main controller**

Create the image controller once in `initAccessibilityMode`, call `setHidden(preferences.enabled && preferences.images === 'hidden')` from `apply`, and restore on reset/disable.

- [ ] **Step 5: Run focused GREEN and commit**

```powershell
pnpm test tests/js/accessibility-images.test.js tests/js/accessibility-mode.test.js
git add src/js/components/accessibility-images.js src/js/components/accessibility-mode.js tests/js/accessibility-images.test.js tests/js/accessibility-mode.test.js
git commit -m "feat: add accessible image alternatives"
```

---

## Task 5: Add browser-local Russian speech controls

**Files:**

- Create: `src/js/components/accessibility-speech.js`
- Create: `tests/js/accessibility-speech.test.js`
- Modify: `src/js/components/accessibility-mode.js`
- Modify: `tests/js/accessibility-mode.test.js`

- [ ] **Step 1: Write failing speech tests with a fake synthesis adapter**

Cover:

- controls remain disabled when Web Speech API is absent;
- controls remain disabled when no `ru-*` voice with `localService === true` exists;
- `voiceschanged` enables controls when a qualifying voice arrives asynchronously;
- reading extracts ordered text from headings, paragraphs, list items, definitions, and table cells inside `<main>`;
- hidden, `aria-hidden`, `.sr-only`, toolbar, navigation, cookie, script, style, and decorative nodes are excluded;
- the selected utterance has `lang="ru-RU"` and the selected local voice;
- pause/resume reflects synthesis state and updates button text/pressed state;
- stop cancels speech;
- mode disable, `pagehide`, and `beforeunload` cancel speech;
- no fetch, XHR, script injection, URL, or network fallback exists.

Public contract:

```js
export function createAccessibilitySpeechController({
  synth = window.speechSynthesis,
  Utterance = window.SpeechSynthesisUtterance,
  root = document,
} = {}) {
  return {
    init() {},
    setEnabled(enabled) {},
    stop() {},
    destroy() {},
  };
}
```

- [ ] **Step 2: Run focused RED**

```powershell
pnpm test tests/js/accessibility-speech.test.js tests/js/accessibility-mode.test.js
```

Expected RED: missing speech controller.

- [ ] **Step 3: Implement local-only capability selection**

Select a voice only with:

```js
const voice = synth.getVoices().find((item) =>
  item.localService === true && /^ru(?:-|$)/i.test(item.lang),
);
```

If no voice qualifies, keep controls disabled and announce «Локальный русский голос недоступен в этом браузере». Do not fall back to a non-local voice.

Extract text from leaf-level readable blocks using `textContent`, normalize whitespace, and join with sentence pauses. Split very long content into bounded utterance chunks without changing order. Update the live region for start, pause, resume, finish, stop, and error.

- [ ] **Step 4: Integrate lifecycle with the accessibility controller**

Initialize once. Call `setEnabled(preferences.enabled)` during apply. Disabling or resetting calls `stop()`. Closing the toolbar alone must not stop active speech.

- [ ] **Step 5: Run focused GREEN and commit**

```powershell
pnpm test tests/js/accessibility-speech.test.js tests/js/accessibility-mode.test.js
git add src/js/components/accessibility-speech.js src/js/components/accessibility-mode.js tests/js/accessibility-speech.test.js tests/js/accessibility-mode.test.js
git commit -m "feat: add local speech controls"
```

---

## Task 6: Build the responsive AA-oriented visual system

**Files:**

- Modify: `src/styles/tokens.css`
- Create: `src/styles/accessibility.css`
- Modify: `src/styles/main.css`
- Modify: `src/styles/components.css`
- Modify: `src/styles/site-search.css`
- Modify: `src/styles/pages.css`
- Create: `tests/styles/accessibility.test.js`
- Modify: `tests/styles/design-system.test.js`
- Modify: `tests/styles/home-redesign.test.js`
- Modify: `tests/styles/site-search.test.js`

- [ ] **Step 1: Write failing CSS contract and contrast tests**

Assert:

- `accessibility.css` is imported last;
- every toolbar control has at least the current 24px project minimum and visible focus, while the primary toolbar actions retain 44–48px comfortable targets;
- scale selectors exist for 100/125/150/200;
- all four themes override semantic foreground, background, link, border, focus, button, notice, and overlay tokens;
- theme ratios calculate to at least 4.5:1 for normal text and 3:1 for large/UI graphics;
- font, letter spacing, line height, paragraph spacing, and image-alternative selectors exist;
- no `.vision-mode` selector remains;
- no primitive token is consumed outside `tokens.css`;
- reduced-motion disables toolbar animation;
- panel switches from compact desktop grid to vertically scroll-free mobile wrapping without fixed height;
- 200% mode and 320px rules do not assign fixed inline widths to content controls.

- [ ] **Step 2: Run focused RED**

```powershell
pnpm test tests/styles/accessibility.test.js tests/styles/design-system.test.js tests/styles/home-redesign.test.js tests/styles/site-search.test.js
```

Expected RED: missing stylesheet and legacy `.vision-mode` selectors remain.

- [ ] **Step 3: Add semantic accessibility tokens**

In `tokens.css`, add semantic/component aliases for toolbar geometry and preference effects, including:

```css
--accessibility-text-scale: 100%;
--accessibility-letter-spacing: normal;
--accessibility-line-height: var(--text-body-line-height);
--accessibility-paragraph-spacing: var(--space-4);
--accessibility-panel-background: var(--color-surface-raised);
--accessibility-panel-border: var(--color-border-strong);
--accessibility-panel-shadow: var(--shadow-header);
```

Add any new primitive colors only in the primitive section, then expose semantic aliases. Do not hardcode raw theme colors in component/page files.

- [ ] **Step 4: Implement preference selectors**

Use exact root selectors:

```css
html[data-accessibility-enabled="true"][data-accessibility-scale="125"] { font-size: 125%; }
html[data-accessibility-enabled="true"][data-accessibility-scale="150"] { font-size: 150%; }
html[data-accessibility-enabled="true"][data-accessibility-scale="200"] { font-size: 200%; }
```

Theme selectors override semantic variables rather than individual page declarations. The sans option sets both body and heading font aliases to the system stack. Letter-spacing choices apply to readable content but exclude logos and icons. Line-height and paragraph-spacing choices apply to `main`, footer, dialog, search dropdown, cookie banner, and toolbar copy without breaking controls.

The hidden-image mode styles generated alternatives as compact bordered blocks and hides no logo or functional SVG icon.

- [ ] **Step 5: Style the normal-flow toolbar**

Desktop: use a compact wrapping grid beneath the utility bar, clear group labels, segmented controls, and one aligned action row. Mobile: one-column groups with horizontally wrapping buttons. Use intrinsic block size, no viewport overlay, no fixed height, no horizontal page scroll, and no sticky obstruction. Opening/closing uses opacity plus a small block-axis transform only when motion is allowed.

- [ ] **Step 6: Replace legacy selectors**

Convert current `.vision-mode` rules in `components.css`, `site-search.css`, `pages.css`, and related tests to the corresponding `[data-accessibility-enabled="true"]` selectors. Preserve intended reduced shadows, stronger visualization labels, search contrast, and reduced decorative opacity.

- [ ] **Step 7: Run focused GREEN and commit**

```powershell
pnpm test tests/styles/accessibility.test.js tests/styles/design-system.test.js tests/styles/home-redesign.test.js tests/styles/site-search.test.js
git add src/styles/tokens.css src/styles/accessibility.css src/styles/main.css src/styles/components.css src/styles/site-search.css src/styles/pages.css tests/styles/accessibility.test.js tests/styles/design-system.test.js tests/styles/home-redesign.test.js tests/styles/site-search.test.js
git commit -m "feat: style responsive accessibility modes"
```

---

## Task 7: Update privacy, cookies, public wording, and search metadata

**Files:**

- Modify: `src/content/legal-pages.js`
- Modify: `src/data/search-keywords.js`
- Modify: `README.md`
- Modify: `CONTENT_CHECKLIST.md`
- Modify: `tests/content/legal-pages.test.js`
- Modify: `tests/project/handoff.test.js`
- Modify: `tests/scripts/search-index.test.js`

- [ ] **Step 1: Write failing legal and documentation tests**

Assert public pages state accurately that:

- localStorage uses `accessibility-preferences`, not `vision-mode`;
- the record contains display preferences only and no medical or contact data;
- text being read is not stored;
- speech is available only through a qualifying local browser voice;
- no third-party accessibility widget or remote TTS is loaded;
- users can reset preferences in the toolbar or clear site storage;
- the site targets AA but makes no certified legal/conformance claim before the final audit and clinic sign-off.

Assert search metadata includes Russian queries and synonyms for «версия для слабовидящих», «доступность», «увеличить текст», «контраст», «скрыть изображения», and «озвучить страницу» and routes them to the relevant public page or the current page accessibility control.

- [ ] **Step 2: Run focused RED**

```powershell
pnpm test tests/content/legal-pages.test.js tests/project/handoff.test.js tests/scripts/search-index.test.js
```

Expected RED: old `vision-mode` key remains and new accessibility behavior is undocumented.

- [ ] **Step 3: Update factual public copy**

Replace the cookies section with the exact factual model:

```text
Сайт хранит в localStorage ключ cookie-consent и один версионированный ключ
accessibility-preferences с выбранными параметрами отображения. Эти значения
не содержат медицинских сведений, имени, телефона или электронной почты.
Текст для озвучивания не сохраняется. Озвучивание доступно только при наличии
локального русского голоса в браузере; сторонний сервис синтеза речи не используется.
```

Update privacy section 11 consistently. Keep the existing separate caveat that server/hosting logs depend on the production host and must be finalized before launch.

- [ ] **Step 4: Update handoff documentation**

README describes how to use and test the toolbar. `CONTENT_CHECKLIST.md` adds a release gate for the 21-page accessibility audit and clinic/legal approval before any public conformance statement.

- [ ] **Step 5: Run focused GREEN, regenerate search index, and commit**

```powershell
pnpm test tests/content/legal-pages.test.js tests/project/handoff.test.js tests/scripts/search-index.test.js
pnpm generate
git add src/content/legal-pages.js src/data/search-keywords.js README.md CONTENT_CHECKLIST.md tests/content/legal-pages.test.js tests/project/handoff.test.js tests/scripts/search-index.test.js public/search-index.json *.html
git commit -m "docs: describe local accessibility preferences"
```

---

## Task 8: Add project-wide accessibility regression checks

**Files:**

- Create: `tests/project/accessibility-conformance.test.js`
- Modify: `scripts/verify-site.mjs`
- Modify: `tests/scripts/site-verifier.test.js`

- [ ] **Step 1: Write failing all-page and verifier tests**

For every generated page, assert:

- `lang="ru"`, one H1, skip link, `main` target, named landmarks, and unique IDs;
- one eye toggle and one matching toolbar relationship;
- every `img` has an `alt` attribute;
- controls have accessible names;
- heading levels do not skip because of the toolbar insertion;
- no positive `tabindex`;
- no inline remote resource, remote stylesheet/script/font, or accessibility widget;
- no legacy `vision-mode` storage string or selector;
- bootstrap precedes stylesheet and module script remains deferred at body end;
- panel is not a modal and starts hidden;
- search, burger, dialog, tabs, disclosures, coverflow, cookie, and mobile appointment hooks remain present where expected.

Extend the production verifier to reject:

- duplicate IDs and broken `aria-controls`/`aria-labelledby` references;
- `<script src>`/`<link rel=stylesheet>` outside the built same-origin asset set;
- the banned hosts `lidrekon.ru`, `responsivevoice.org`, and `tts.voicetech.yandex.net`;
- any public phrase claiming certified ГОСТ compliance before the release checklist flag exists.

- [ ] **Step 2: Run focused RED**

```powershell
pnpm test tests/project/accessibility-conformance.test.js tests/scripts/site-verifier.test.js
```

Expected RED: new project test and verifier checks are absent.

- [ ] **Step 3: Implement the static audit and verifier hardening**

Reuse existing page manifest/render helpers. Keep verifier errors deterministic and include the file plus failing relationship/host. Do not introduce a dependency for DOM inspection; use the project’s existing JSDOM test environment and the verifier’s current parsing strategy.

- [ ] **Step 4: Run focused GREEN and commit**

```powershell
pnpm test tests/project/accessibility-conformance.test.js tests/scripts/site-verifier.test.js
git add tests/project/accessibility-conformance.test.js scripts/verify-site.mjs tests/scripts/site-verifier.test.js
git commit -m "test: audit accessibility across generated pages"
```

---

## Task 9: Run the complete build and manual browser audit

**Files:**

- Modify after evidence only: `docs/superpowers/specs/2026-08-12-accessibility-panel-design.md`
- Create: `docs/superpowers/reports/2026-08-12-accessibility-panel-qa.md`
- Modify only if a demonstrated defect requires it: files from Tasks 1–8 and their focused tests

- [ ] **Step 1: Run the complete automated gate**

```powershell
pnpm generate
pnpm verify
git diff --check
git status --short
```

Expected: all tests pass, Vite builds 21 pages, verifier accepts all 21, generated files are stable, and only intended report/spec changes remain.

- [ ] **Step 2: Scan built artifacts for prohibited runtime dependencies and stale mode strings**

```powershell
rg -n "lidrekon|responsivevoice|voicetech|jquery|vision-mode|https?://" dist src *.html
```

Review every match. Allowed absolute URLs are only inert structured/legal links already approved by the site verifier; active runtime resources and `vision-mode` must be zero.

- [ ] **Step 3: Run the viewport/page browser matrix**

Use the production preview and the in-app Browser. Test all 21 routes at 320px and 1280px; additionally test representative home, services, specialists, patients, privacy, and contacts routes at 390px, 768px, and 1440px.

For each route verify:

- no document horizontal overflow;
- no clipped visible interactive control;
- one visible H1 and working skip link;
- toolbar opens below the header and closes via repeat toggle, close, and Escape;
- focus returns to the eye button;
- burger, search dropdown, appointment dialog, cookie banner, tabs/disclosures, coverflow, and tables still work;
- console errors are zero and active network resources remain same-origin.

- [ ] **Step 4: Run the preference matrix**

At minimum test:

1. standard 100%;
2. standard 200%;
3. black on white 200%;
4. white on black 150%;
5. blue on light blue 150%;
6. sans + large spacing + line-height 2;
7. images hidden and restored;
8. reload persistence;
9. malformed storage recovery;
10. reset.

At 320px and 200%, verify no two-dimensional page scroll except intentional internally scrollable data tables. At all themes verify focus, borders, icons, buttons, links, notices, search results, and dialog controls remain perceivable.

- [ ] **Step 5: Audit keyboard and motion**

Tab through every visible control. Verify logical order, no focus loss, no keyboard trap, visible focus, Escape behavior, arrow-key widgets, and that the toolbar itself is fully operable without a pointer. Emulate `prefers-reduced-motion: reduce` when the browser supports it; otherwise record the API limitation and retain CSSOM plus automated evidence.

- [ ] **Step 6: Audit speech capability paths**

Verify both:

- a browser/profile with a local Russian voice: read, pause, resume, stop, end, page navigation, and mode disable;
- no qualifying local voice: controls disabled with an understandable message and no network request.

Do not bypass a browser safety control and do not enable a remote fallback.

- [ ] **Step 7: Fix only demonstrated defects through new RED tests**

For each defect: add the smallest focused regression test, observe RED, implement the smallest fix, observe focused GREEN, then repeat affected browser checks. Do not change unrelated design or content during this task.

- [ ] **Step 8: Write the QA report and record the conformance boundary**

The report must include exact commands/results, tested routes/viewports/modes, automated contrast ratios, keyboard results, speech availability, console/network results, any browser limitations, and remaining launch inputs. Update the design spec from «target» to «audited implementation» only if every planned check passes. Still state that legal certification/sign-off is separate.

- [ ] **Step 9: Run a fresh final gate and commit**

```powershell
pnpm verify
git diff --check
git status --short
git add docs/superpowers/specs/2026-08-12-accessibility-panel-design.md docs/superpowers/reports/2026-08-12-accessibility-panel-qa.md
git commit -m "docs: record accessibility mode verification"
git status --short
```

Expected final state: fresh full gate passes, report is complete, generated output matches source, and the worktree is clean.

---

## Acceptance Checklist

- [ ] No external accessibility widget, jQuery, remote CSS, remote image, remote voice, or runtime tracking resource was introduced.
- [ ] One local toolbar is rendered and usable on all 21 pages.
- [ ] Preferences persist in one strictly validated versioned JSON record and old `vision-mode` migrates safely.
- [ ] Text scales through 200% without loss of content/function.
- [ ] All four themes meet planned text and UI contrast thresholds.
- [ ] Letter spacing, line height, paragraph spacing, and sans font modes remain usable at 320px.
- [ ] Informative images receive useful visible alternatives when hidden; decorative images do not create noise.
- [ ] Speech works only with a local Russian browser voice and fails closed when unavailable.
- [ ] Keyboard focus, Escape, reduced motion, search, menu, dialogs, tabs, disclosures, coverflow, cookie controls, and tables remain correct.
- [ ] Privacy/cookies/search/README/checklist describe actual behavior and no longer mention `vision-mode`.
- [ ] `pnpm verify` passes and the production verifier accepts exactly 21 HTML pages.
- [ ] Public copy makes no premature certification or legal-guarantee claim.
