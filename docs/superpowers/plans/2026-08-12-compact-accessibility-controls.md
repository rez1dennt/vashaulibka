# Compact Accessibility Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the implemented accessibility toolbar into the approved compact clinic-themed control bar, move advanced typography choices into an accessible settings dialog, and replace page reading with optional spoken confirmations of user actions.

**Architecture:** Preserve the verified theme, image-alternative, persistence, and root-attribute layers. Upgrade preferences to schema version 2, render a compact primary toolbar plus a dedicated advanced dialog, isolate dialog focus/scroll behavior in one component, and reduce the speech adapter to short local-only announcements. The controller remains the single state owner and coordinates persistence, visual application, image state, the settings dialog, and speech confirmations.

**Tech Stack:** Vanilla JavaScript ES modules, generated static HTML, CSS custom properties, local Web Speech API, Vitest 4, JSDOM 26, Vite 8, pnpm 11.

## Global Constraints

- No Lidrekon, jQuery, remote CSS, remote images, remote fonts, remote TTS, analytics, trackers, or new runtime network dependency.
- Keep the existing eye SVG and visible label «Версия для слабовидящих».
- The primary toolbar is normal flow and never locks document scroll; only the advanced `aria-modal="true"` dialog traps focus and uses the existing ref-counted scroll lock.
- The main toolbar always exposes text size, four themes, images, speech confirmation, advanced-settings gear, «Обычная версия сайта», and collapse.
- Full-page reading, pause, resume, stop controls, readable-content extraction, and long utterance chunking must be removed.
- Speech confirmations default off, use only a local Russian voice (`localService === true`, `ru-*`), interrupt the previous phrase, and never speak during hydration or panel opening.
- Preferences use one strictly validated version-2 JSON record. A valid version-1 record migrates to version 2 with `speechAnnouncements: false`; malformed and unknown versions fail safely.
- Text scales remain exactly 100%, 125%, 150%, and 200%; all four themes retain normal-text contrast ≥4.5:1 and essential UI/focus contrast ≥3:1.
- At 320–768 CSS px and 200% text, logo, «Ваша улыбка», search, and burger remain visible and usable without document horizontal overflow or breakpoint cliffs.
- Fix the known typography cascade gap: spacing modes must reach headings/labels with explicit base declarations while explicitly excluding controls, brand, and icons.
- Use semantic/component tokens outside `tokens.css`; primitives and raw theme colors stay in `tokens.css`.
- Generated HTML remains deterministic across two `pnpm generate` runs.
- Public copy must not claim certified ГОСТ compliance before the completed 21-page audit and clinic/legal sign-off.

---

## Task 1: Upgrade preferences to schema version 2

**Files:**

- Modify: `src/js/core/accessibility-preferences.js`
- Modify: `src/templates/accessibility-bootstrap.js`
- Modify: `tests/js/accessibility-preferences.test.js`
- Modify: `tests/templates/render-page.test.js`

**Interfaces:**

- Produces `ACCESSIBILITY_PREFERENCES_VERSION === 2`.
- Adds `speechAnnouncements: boolean` to `DEFAULT_ACCESSIBILITY_PREFERENCES` and every normalized record.
- `loadAccessibilityPreferences(storage)` returns a fresh version-2 record and persists valid v1/legacy migrations.
- `parseAccessibilityPreferences(raw)` accepts only the exact version-2 shape.

- [ ] **Step 1: Add RED tests for v2 validation and migration**

Add exact cases:

```js
expect(ACCESSIBILITY_PREFERENCES_VERSION).toBe(2);
expect(DEFAULT_ACCESSIBILITY_PREFERENCES).toMatchObject({
  version: 2,
  speechAnnouncements: false,
});

const v1 = {
  version: 1,
  enabled: true,
  scale: '150',
  theme: 'white-black',
  font: 'sans',
  letterSpacing: 'medium',
  lineHeight: 'large',
  paragraphSpacing: 'large',
  images: 'hidden',
};
expect(loadAccessibilityPreferences(storageWith(v1))).toEqual({
  ...v1,
  version: 2,
  speechAnnouncements: false,
});
```

Also assert a v2 record with missing/non-boolean `speechAnnouncements`, a v1 record with extra keys, version 3, array, and malformed JSON fail safely. Assert successful v1 migration writes one v2 record and legacy `vision-mode=on` migrates directly to v2/125%/speech off.

- [ ] **Step 2: Run RED**

```powershell
pnpm test tests/js/accessibility-preferences.test.js tests/templates/render-page.test.js
```

Expected: version/default/migration assertions fail against schema v1.

- [ ] **Step 3: Implement exact v1-to-v2 migration**

Use separate exact key lists:

```js
const V1_KEYS = Object.freeze([
  'version', 'enabled', 'scale', 'theme', 'font', 'letterSpacing',
  'lineHeight', 'paragraphSpacing', 'images',
]);
const V2_KEYS = Object.freeze([...V1_KEYS, 'speechAnnouncements']);
```

Validate v1 with its original closed lists and boolean `enabled`, then return:

```js
const migrateV1 = (value) => ({
  ...Object.fromEntries(V1_KEYS.map((key) => [key, value[key]])),
  version: 2,
  speechAnnouncements: false,
});
```

In `loadAccessibilityPreferences`, parse the raw object once. Return valid v2. For valid v1 or legacy `vision-mode=on`, create v2, call `saveAccessibilityPreferences`, and return the migrated object even when storage write is blocked. Malformed or unknown input returns fresh v2 defaults without writing.

- [ ] **Step 4: Update the pre-CSS bootstrap**

The bootstrap accepts only exact v2 for early presentation. A v1 record is deliberately left for the module controller to migrate because `speechAnnouncements` changes no pre-CSS presentation. It still applies only enabled visual attributes and performs no page writes/resource loads.

- [ ] **Step 5: Run GREEN and commit**

```powershell
pnpm test tests/js/accessibility-preferences.test.js tests/templates/render-page.test.js
pnpm test
git diff --check
git add src/js/core/accessibility-preferences.js src/templates/accessibility-bootstrap.js tests/js/accessibility-preferences.test.js tests/templates/render-page.test.js
git commit -m "feat: migrate accessibility preferences to v2"
```

---

## Task 2: Render the compact toolbar and advanced dialog

**Files:**

- Modify: `src/templates/accessibility-panel.js`
- Modify: `src/templates/site-chrome.js`
- Modify: `src/templates/icons.js`
- Modify: `tests/templates/accessibility-panel.test.js`
- Modify: `tests/templates/site-chrome.test.js`
- Modify: `tests/templates/icons.test.js`

**Interfaces:**

- Primary hooks: `data-accessibility-scale-decrease`, `data-accessibility-scale-value`, `data-accessibility-scale-increase`, theme/image setting buttons, `data-speech-announcements`, `data-accessibility-advanced-open`, `data-accessibility-standard`, `data-accessibility-close`.
- Dialog hooks: `#accessibility-settings-dialog`, `data-accessibility-dialog-backdrop`, `data-accessibility-dialog-close`, advanced setting buttons, `data-accessibility-reset`.

- [ ] **Step 1: Write RED template tests**

Assert the primary panel has exactly five labeled groups: size, colors, images, voice confirmation, settings/actions. Assert it has no font/letter/line/paragraph fieldsets and no `data-speech-read`, `data-speech-pause`, or `data-speech-stop`.

Assert scale controls are:

```html
<button type="button" data-accessibility-scale-decrease aria-label="Уменьшить размер текста">A−</button>
<output data-accessibility-scale-value aria-live="polite">100%</output>
<button type="button" data-accessibility-scale-increase aria-label="Увеличить размер текста">A+</button>
```

Assert the speech button starts `disabled aria-pressed="false"`, gear has `aria-controls="accessibility-settings-dialog" aria-expanded="false"`, and standard/collapse controls have visible labels.

Assert the advanced sibling dialog has `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, hidden state, backdrop, close, four advanced groups, reset, and no form/data-entry input.

- [ ] **Step 2: Run RED**

```powershell
pnpm test tests/templates/accessibility-panel.test.js tests/templates/site-chrome.test.js tests/templates/icons.test.js
```

Expected: old seven-group panel and page-reading buttons violate the new structure.

- [ ] **Step 3: Add local SVG icons**

Extend the existing icon map with inline stroke-only `gear`, `speaker`, `image`, `contrast`, and `collapse` paths. Continue using `renderIcon`; add no image URLs or icon package.

- [ ] **Step 4: Render compact main controls**

Use one `section.accessibility-panel` with an `.accessibility-toolbar` grid. Theme buttons retain exact `data-accessibility-setting="theme"`/values and expose visually distinguishable swatches plus accessible names. Images remain a two-choice pressed group. The dynamic speaker button is not a generic setting button; it uses `data-speech-announcements`.

- [ ] **Step 5: Render the advanced settings dialog**

Return it from the shared header immediately after the toolbar:

```html
<div id="accessibility-settings-dialog" class="accessibility-settings-dialog"
  role="dialog" aria-modal="true" aria-labelledby="accessibility-settings-title" hidden>
  <div class="accessibility-settings-dialog__backdrop"
    data-accessibility-dialog-backdrop aria-hidden="true"></div>
  <div class="accessibility-settings-dialog__panel">
    <button type="button" data-accessibility-dialog-close aria-label="Закрыть расширенные настройки">×</button>
    <h2 id="accessibility-settings-title">Расширенные настройки</h2>
    <!-- exact font/letterSpacing/lineHeight/paragraphSpacing groups -->
    <button type="button" data-accessibility-reset>Сбросить настройки</button>
  </div>
</div>
```

- [ ] **Step 6: Run GREEN, generate, and commit**

```powershell
pnpm test tests/templates/accessibility-panel.test.js tests/templates/site-chrome.test.js tests/templates/icons.test.js
pnpm generate
pnpm test
git diff --check
git add src/templates/accessibility-panel.js src/templates/site-chrome.js src/templates/icons.js tests/templates/accessibility-panel.test.js tests/templates/site-chrome.test.js tests/templates/icons.test.js *.html
git commit -m "feat: render compact accessibility controls"
```

---

## Task 3: Implement advanced-dialog focus and overlay behavior

**Files:**

- Create: `src/js/components/accessibility-settings-dialog.js`
- Create: `tests/js/accessibility-settings-dialog.test.js`
- Modify: `src/js/components/accessibility-mode.js`
- Modify: `tests/js/accessibility-mode.test.js`

**Interfaces:**

```js
export function initAccessibilitySettingsDialog({ root = document } = {}) {
  return { open() {}, close({ restoreFocus = true } = {}) {}, isOpen() {} };
}
```

- [ ] **Step 1: Write RED dialog tests**

Cover gear click/open/`aria-expanded`, close button, backdrop, capture-phase Escape with `stopImmediatePropagation`, focus trap in both directions, scroll-lock reference count, and focus return to gear. Assert closing the main toolbar closes the advanced dialog first and returns final focus to the eye toggle. Assert the settings dialog is layered above menu/cookie but does not disturb an already ref-counted lock.

- [ ] **Step 2: Run RED**

```powershell
pnpm test tests/js/accessibility-settings-dialog.test.js tests/js/accessibility-mode.test.js
```

Expected: new component missing; current controller knows no gear/dialog.

- [ ] **Step 3: Implement with existing primitives**

Use `createFocusTrap(dialog)`, `lockScroll()`, and `unlockScroll()`. `open()` stores the gear as return target, unhides dialog, sets gear `aria-expanded=true`, locks once, and focuses close/first control. `close()` is idempotent, hides, unlocks once, sets false, and returns focus. Escape listens in capture phase so the topmost settings dialog closes before menu/panel handlers.

- [ ] **Step 4: Integrate toolbar lifecycle**

Initialize once in `initAccessibilityMode`. Before collapsing the main panel, call exactly `settingsDialog.close({ restoreFocus: false })`, then return focus to the eye toggle. Do not close the main panel when only the advanced dialog closes.

- [ ] **Step 5: Run GREEN and commit**

```powershell
pnpm test tests/js/accessibility-settings-dialog.test.js tests/js/accessibility-mode.test.js tests/js/interactions.test.js
pnpm test
git diff --check
git add src/js/components/accessibility-settings-dialog.js src/js/components/accessibility-mode.js tests/js/accessibility-settings-dialog.test.js tests/js/accessibility-mode.test.js
git commit -m "feat: add accessibility settings dialog"
```

---

## Task 4: Replace page reading with short action confirmations

**Files:**

- Rewrite: `src/js/components/accessibility-speech.js`
- Rewrite: `tests/js/accessibility-speech.test.js`
- Modify: `src/js/components/accessibility-mode.js`
- Modify: `tests/js/accessibility-mode.test.js`

**Interfaces:**

```js
export function createAccessibilitySpeechController({
  synth = window.speechSynthesis,
  Utterance = window.SpeechSynthesisUtterance,
  root = document,
} = {}) {
  return {
    init() {},
    setEnabled(enabled) {},
    announce(message) {},
    confirmAndDisable(message) {},
    stop() {},
    destroy() {},
  };
}
```

- [ ] **Step 1: Write RED speech tests for the new scope**

Assert there are no readable selectors, main traversal, chunks, page-read buttons, pause/resume, or page-reading messages. Cover absent API, remote Russian/local non-Russian rejection, async `voiceschanged`, speaker enabled state, exact short utterance text/`ru-RU`/local voice, rapid second announcement calls `cancel()` and speaks only the new utterance, disable/pagehide/beforeunload/reset cancellation, synchronous/asynchronous errors, stale callback guards, and no network/script fallback.

- [ ] **Step 2: Run RED**

```powershell
pnpm test tests/js/accessibility-speech.test.js tests/js/accessibility-mode.test.js
```

Expected: old controller exposes page reading and lacks `announce(message)`/speaker persistence.

- [ ] **Step 3: Implement the minimal announcement adapter**

Select only:

```js
const voice = synth.getVoices().find((item) =>
  item.localService === true && /^ru(?:-|$)/i.test(item.lang),
);
```

`announce(message)` normalizes a short non-empty string, returns if disabled/unavailable, increments a generation, cancels existing speech, creates one utterance, sets `lang='ru-RU'` and the local voice, then speaks it. `confirmAndDisable(message)` is used only for reset: while currently enabled it cancels stale speech, queues the one final confirmation, immediately marks the adapter disabled for further announcements, and does not cancel that final utterance. No queue/chunks/content lookup. The speaker button is disabled when no qualifying voice and reflects stored `speechAnnouncements` only when available.

- [ ] **Step 4: Wire exact controller announcements**

Use a closed message map:

```js
const ANNOUNCEMENTS = {
  scale: { '100': 'Размер шрифта — 100 процентов', '125': 'Размер шрифта — 125 процентов', '150': 'Размер шрифта — 150 процентов', '200': 'Размер шрифта — 200 процентов' },
  theme: { standard: 'Цветовая схема — стандартная', 'black-white': 'Цветовая схема — чёрный текст на белом фоне', 'white-black': 'Цветовая схема — белый текст на чёрном фоне', 'blue-light': 'Цветовая схема — тёмно-синий текст на светло-голубом фоне' },
  images: { visible: 'Изображения показаны', hidden: 'Изображения скрыты' },
  font: { site: 'Шрифт — фирменный', sans: 'Шрифт — без засечек' },
  letterSpacing: { standard: 'Межбуквенный интервал — стандартный', medium: 'Межбуквенный интервал — средний', large: 'Межбуквенный интервал — увеличенный' },
  lineHeight: { standard: 'Межстрочный интервал — стандартный', medium: 'Межстрочный интервал — полуторный', large: 'Межстрочный интервал — двойной' },
  paragraphSpacing: { standard: 'Интервал между абзацами — стандартный', large: 'Интервал между абзацами — увеличенный' },
};
```

Every user change updates `aria-live` regardless of speaker state. Hydration/panel opening stays silent. Turning speaker on says «Голосовые подтверждения включены». Turning it off immediately stops and reports only through `aria-live`. On reset, capture the previous `speechAnnouncements` value, persist/apply exact defaults without calling the ordinary cancelling `setEnabled(false)` path, and call `confirmAndDisable('Настройки сброшены')` only when the previous value was true. «Обычная версия сайта» calls `stop()` and never speaks.

- [ ] **Step 5: Implement scale stepping and normal-version action**

Use `['100','125','150','200']`; decrease/increase clamp to endpoints and disable at limits. Output reflects `${scale}%`. «Обычная версия сайта» stores `{...preferences, enabled:false}`, stops speech, removes visual attributes, keeps chosen values including `speechAnnouncements`, and leaves the panel open so the state change is visible.

- [ ] **Step 6: Run GREEN and commit**

```powershell
pnpm test tests/js/accessibility-speech.test.js tests/js/accessibility-mode.test.js tests/js/accessibility-settings-dialog.test.js
pnpm test
git diff --check
git add src/js/components/accessibility-speech.js src/js/components/accessibility-mode.js tests/js/accessibility-speech.test.js tests/js/accessibility-mode.test.js
git commit -m "feat: announce accessibility setting changes"
```

---

## Task 5: Restyle the compact toolbar/dialog and close reflow gaps

**Files:**

- Modify: `src/styles/tokens.css`
- Modify: `src/styles/accessibility.css`
- Modify: `tests/styles/accessibility.test.js`
- Modify: `tests/styles/design-system.test.js`

**Interfaces:** Consumes Task 2 hooks/classes and Task 3 dialog state. Preserves the four existing theme token chains.

- [ ] **Step 1: Write RED compact-layout/dialog tests**

Assert desktop main toolbar uses intrinsic wrapping groups and compact controls; advanced groups are absent from it. Assert mobile has no horizontal scroller/fixed panel height. Assert the dialog uses fixed full-viewport container, semantic overlay, centered/max-height scrollable panel, safe-area-aware mobile inset, z-index above cookie/menu, and reduced-motion transitions.

- [ ] **Step 2: Add RED reflow regression over the whole range**

Model header budgets at 320, 390, 480, 481, 600, 768 CSS px with 200% text. Assert the scale-neutral accessibility header rule applies throughout the failing range, with no discontinuity at 480/481 and ≥44px essential control targets. Use `@media (max-width: 48rem)` rather than the old `30rem` cutoff unless measured budgets prove a smaller continuous boundary.

- [ ] **Step 3: Add RED computed-cascade typography tests**

Assert spacing modes override explicit base declarations for `h1`–`h6`, footer headings, search categories, about fact headings, paragraphs, lists, definitions, table cells, address, status/spans. Assert `.button`, native controls, ARIA buttons/tabs, brand, and icons reset letter/line properties.

- [ ] **Step 4: Run RED**

```powershell
pnpm test tests/styles/accessibility.test.js tests/styles/design-system.test.js
```

- [ ] **Step 5: Implement the clinic-themed compact visual system**

Use white/soft-blue/ink semantic surfaces, existing radii/borders/focus, icon + visible label, compact segmented controls, pressed-state fill, and no imitation of the reference’s black palette. Add component aliases for toolbar group sizing, swatches, dialog width/inset/max-height, and z-layer. Keep raw values in tokens only.

- [ ] **Step 6: Fix typography cascade and 320–768 header reflow**

Apply accessibility spacing directly to the complete readable selector set after all base/page CSS because the accessibility layer imports last. Follow it with explicit control/brand/icon resets. Extend scale-neutral header selectors continuously through 48rem; test closed and open search surfaces at 200%.

- [ ] **Step 7: Recalculate actual consumer contrast**

For standard/black-white/white-black/blue-light, calculate text/page, link/page, primary button, regular border/page+raised, strong border/dialog+notice, focus/page+dialog, selected/unselected segments. All must meet the stated 4.5/3 thresholds.

- [ ] **Step 8: Run GREEN/build and commit**

```powershell
pnpm test tests/styles/accessibility.test.js tests/styles/design-system.test.js tests/styles/home-redesign.test.js tests/styles/site-search.test.js
pnpm test
pnpm build
git diff --check
git add src/styles/tokens.css src/styles/accessibility.css tests/styles/accessibility.test.js tests/styles/design-system.test.js
git commit -m "feat: style compact accessibility controls"
```

---

## Task 6: Update legal copy, search metadata, and cross-page verification

**Files:**

- Modify: `src/content/legal-pages.js`
- Modify: `src/data/search-keywords.js`
- Modify: `README.md`
- Modify: `CONTENT_CHECKLIST.md`
- Modify: `scripts/verify-site.mjs`
- Modify: `tests/content/legal-pages.test.js`
- Modify: `tests/project/handoff.test.js`
- Modify: `tests/project/accessibility-conformance.test.js` if already created, otherwise create it
- Modify: `tests/scripts/search-index.test.js`
- Modify: `tests/scripts/site-verifier.test.js`

- [ ] **Step 1: Write RED factual-copy tests**

Require `accessibility-preferences` v2, local-only short action confirmations, no stored utterance/action history, no full-page reading, no remote service, and reset/clear behavior. Search synonyms include «версия для слабовидящих», «увеличить текст», «контраст», «скрыть изображения», «голосовые подтверждения», and «расширенные настройки».

- [ ] **Step 2: Write RED all-page/verifier tests**

Across all 21 pages assert exactly one compact panel/dialog, valid ARIA references, no page-read/pause/stop hooks or copy, no positive tabindex/duplicate IDs, all images alt, and no Lidrekon/ResponsiveVoice/Yandex TTS/runtime remote resources. Verifier must reject banned hosts and broken advanced-dialog relationships.

- [ ] **Step 3: Run RED**

```powershell
pnpm test tests/content/legal-pages.test.js tests/project/handoff.test.js tests/project/accessibility-conformance.test.js tests/scripts/search-index.test.js tests/scripts/site-verifier.test.js
```

- [ ] **Step 4: Update exact public copy and documentation**

State that localStorage stores `cookie-consent` and version-2 `accessibility-preferences`; the latter contains display preferences plus a speech-confirmation boolean, no medical/contact data, no text/history. Speech confirms only actions with a local Russian browser voice. No third-party widget/TTS is loaded. Keep the existing hosting/server-log launch caveat and no certification claim.

- [ ] **Step 5: Run GREEN, generate twice, and commit**

```powershell
pnpm test tests/content/legal-pages.test.js tests/project/handoff.test.js tests/project/accessibility-conformance.test.js tests/scripts/search-index.test.js tests/scripts/site-verifier.test.js
pnpm generate
pnpm generate
pnpm verify
git diff --check
git add src/content/legal-pages.js src/data/search-keywords.js README.md CONTENT_CHECKLIST.md scripts/verify-site.mjs tests/content/legal-pages.test.js tests/project/handoff.test.js tests/project/accessibility-conformance.test.js tests/scripts/search-index.test.js tests/scripts/site-verifier.test.js public/search-index.json *.html
git commit -m "docs: describe compact accessibility controls"
```

---

## Task 7: Complete browser QA, fix the image-caption Minor, and record evidence

**Files:**

- Modify: `src/js/components/accessibility-images.js`
- Modify: `tests/js/accessibility-images.test.js`
- Create: `docs/superpowers/reports/2026-08-12-compact-accessibility-controls-qa.md`
- Modify only for demonstrated RED→GREEN defects: files from Tasks 1–6 and covering tests

- [ ] **Step 1: Resolve the carried Task 4 Minor through TDD**

Add punctuation/case/whitespace-normalized equivalence tests so `alt="Лицензия клиники"` and `figcaption="Лицензия клиники."` do not duplicate. Preserve genuinely additional captions. Run focused GREEN and commit with final QA changes.

- [ ] **Step 2: Run the fresh automated gate**

```powershell
pnpm generate
pnpm verify
git diff --check
rg -n "lidrekon|responsivevoice|voicetech|jquery|vision-mode|data-speech-read|data-speech-pause|data-speech-stop|Читать страницу|Озвучивание страницы" src tests dist *.html
```

Expected prohibited/stale runtime matches: zero; approved historical documentation references must be reviewed separately and not ship in HTML.

- [ ] **Step 3: Run 21-route viewport matrix**

Production preview in the in-app Browser: all 21 routes at 320 and 1280; representative home/services/specialists/patients/privacy/contacts at 390, 480, 481, 600, 768, and 1440. Check document overflow, clipped controls, header logo/wordmark/search/burger, one H1, skip link, same-origin assets, and zero console errors.

- [ ] **Step 4: Run mode/interaction matrix**

Test 100/125/150/200; all themes; large letter/line/paragraph spacing; hidden/visible images; persisted reload; v1 migration; malformed/unknown records; standard-version retention; complete reset. Open/collapse toolbar by eye/close/Escape. Open advanced dialog by gear, trap Tab/Shift+Tab, close by button/backdrop/Escape, verify scroll lock and focus return. Test coexistence with burger, search dropdown, appointment dialog, cookie banner, tabs/disclosures, coverflow, and tables.

- [ ] **Step 5: Run speech paths**

With a local Russian voice: enable speaker, change each setting family, verify exact latest-only short phrase, hydration/open silence, and cancellation on disable/standard/reset/navigation. Without a qualifying voice: speaker disabled with understandable status and no network request. Do not add or invoke remote fallback.

- [ ] **Step 6: Fix only demonstrated defects via individual RED tests**

For every observed defect, add the smallest focused regression, observe RED, implement the minimal fix, observe focused GREEN, rerun the affected Browser scenario, then run the fresh full gate once.

- [ ] **Step 7: Write report and commit**

Record exact commands/counts, routes/viewports/modes, contrast ratios, focus/keyboard/dialog/speech/network/console results, browser limitations, and the separate legal-certification boundary.

```powershell
pnpm verify
git diff --check
git status --short
git add src/js/components/accessibility-images.js tests/js/accessibility-images.test.js docs/superpowers/reports/2026-08-12-compact-accessibility-controls-qa.md
git commit -m "test: verify compact accessibility controls"
git status --short
```

---

## Acceptance Checklist

- [ ] Version-1 preferences migrate safely to exact schema v2 with speech confirmations off.
- [ ] Main toolbar is compact and exposes only approved frequent actions.
- [ ] Gear opens a fully accessible clinic-themed advanced dialog.
- [ ] No full-page reading code, controls, copy, chunks, or content extraction remains.
- [ ] Voice confirms only current user actions, defaults off, interrupts stale speech, and is local-Russian-only.
- [ ] «Обычная версия сайта» disables presentation but retains chosen values; reset returns exact defaults and speech off.
- [ ] All four themes and actual UI consumers meet 4.5:1 text and 3:1 UI/focus contrast.
- [ ] 320–768px at 200% has no header collision, breakpoint cliff, clipped control, or document horizontal overflow.
- [ ] Spacing applies to all readable content including explicitly styled headings and excludes controls/brand/icons.
- [ ] Images hide/restore reversibly without duplicate punctuation-equivalent alternatives.
- [ ] Legal/cookies/search/docs describe the real v2/local-confirmation behavior.
- [ ] All 21 pages pass automated verifier and Browser QA with no remote active resource or console error.
- [ ] Public copy makes no premature ГОСТ certification claim.
