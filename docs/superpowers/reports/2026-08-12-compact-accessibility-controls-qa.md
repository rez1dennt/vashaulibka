# Compact accessibility controls: QA report

Date: 12 August 2026

Scope: Compact Accessibility Tasks 1–7, including the Task 7 live Browser follow-up.

Build under test: production output from Task 7 commit `424a7bd926c05d3c9feb180eb931844275612cc7` plus the Browser-demonstrated fixes and regressions recorded below.

## Result and evidence boundary

The automated production gate and required in-app Browser route, viewport, interaction, console, and network checks passed after four Browser-demonstrated defects were fixed. Speech state and the exact latest action phrase were observed with an available local Russian voice; the Browser surface could not capture audible output, so this report does not claim that sound was heard.

This is implementation and QA evidence, not certification of WCAG, ГОСТ, or another accessibility standard. Any public conformance statement still requires the clinic/legal approval and manual audit recorded in `CONTENT_CHECKLIST.md`.

## Image-caption Minor: RED to GREEN

Caption equivalence previously collapsed whitespace and compared case-insensitively but retained punctuation. Consequently, `alt="Лицензия клиники"` and a whitespace/case variant ending with `ЛИЦЕНЗИЯ клиники.` were treated as different.

`pnpm test tests/js/accessibility-images.test.js` was RED with 1 failed and 10 passed. Equivalence comparison now applies Unicode NFKC normalization, replaces Unicode punctuation runs with spaces, collapses whitespace, and compares Russian text with base sensitivity. Display text is not destructively normalized. The same command was GREEN with 11/11; a genuinely additive caption, `Лицензия клиники. Выписка из реестра`, remains intact.

## Browser-demonstrated defects: RED to GREEN

Four defects were reproduced in the production preview. Each received a production-shaped failing test before the minimal implementation.

1. At `specialists.html` / 320px, partially off-screen side-card controls remained tabbable. The failing coverflow state was `[0, 0, -1, -1, 0]`. Only the active front card is now exposed and tabbable; every non-active slide has `aria-hidden="true"` and its selection button has `tabindex="-1"`. Carousel arrows remain controls. The focused coverflow suite passes 8/8, and the live rerun confirmed one active `tabindex=0` control and four hidden/non-tabbable slides.
2. At `index.html` / 320px / 200%, eight visible actions or footer links crossed the viewport. The scale-200 consumer rule now permits intrinsic shrinkage, caps inline size, and wraps long labels without changing their minimum block target. The live rerun reported document overflow 0 and no clipped controls.
3. At the maximum combination—200% text plus large letter, line, and paragraph spacing—cards, list content, footer content, and rem-scaled decoration caused overflow at mobile and desktop widths. Scale-200 layout tokens now use single-column reflow; maximum-spacing grids/cards/readable descendants collapse intrinsic widths; decorative elements are size/offset constrained without hiding page overflow. The exact combination passed at 320, 390, 480, 481, 600, 768, 1280, and 1440px with document overflow 0. The fixed 320, 1280, and 1440 reruns also reported no clipped controls.
4. At 320px under the same maximum combination, the advanced dialog panel had `clientWidth=249` and `scrollWidth=318`, a horizontal scrollbar, and an impractically narrow title. The dialog now has vertical-only internal scrolling, constrained fieldsets/groups, reduced extreme-mode padding, and normal control-surface heading/legend spacing. Live reruns showed panel `scrollWidth === clientWidth` at 320 (249/249), 1280 (1224/1224), and 1440 (1384/1384); the title and controls remained contained and readable through aggressive but expected wrapping.

The combined changed-scope command is:

```powershell
pnpm test tests/styles/accessibility.test.js tests/js/specialists-coverflow.test.js
```

It passes 39/39 tests across 2 files. No rule hides horizontal overflow on the root page or body; horizontal containment is limited to the dialog's own scroll panel.

## Route and viewport matrix

A production preview at `http://127.0.0.1:4176/` was tested only through the in-app Browser, with a fresh navigation/reload for route checks.

- All 21 routes were checked at both 320 and 1280px: 42 checks, 0 failures.
- `index.html`, `services.html`, `specialists.html`, `patients.html`, `privacy.html`, and `contacts.html` were checked at 390, 480, 481, 600, 768, and 1440px: 36 checks, 0 failures.
- The maximum typography-spacing combination on `index.html` was additionally checked at 320, 390, 480, 481, 600, 768, 1280, and 1440px: document overflow 0 at every width.

The 21-route set was `index.html`, `about.html`, `contacts.html`, `services.html`, `specialists.html`, `prices.html`, `reviews.html`, `vacancies.html`, `patients.html`, `license.html`, `payment.html`, `benefits.html`, `waiting-periods.html`, `oms.html`, `informed-consent.html`, `guarantees.html`, `complaints.html`, `standards.html`, `personal-data-consent.html`, `privacy.html`, and `cookies.html`.

Each route check inspected document overflow, the rendered H1, visible/clipped tabbable controls, and remote DOM resources. No route failure remained. The final Browser tab had 0 console warnings and 0 console errors. Its asset inventory was 13 page assets—1 script, 1 stylesheet, 11 images, 0 fonts—plus 70 inline SVGs and 0 external resources. No remote request was observed.

Screenshots were visually inspected for the 320px normal compact panel; the reproduced 320px maximum-spacing overflow; the reproduced 320px dialog horizontal overflow; the fixed 320px maximum-spacing vertical-only dialog; and the reproduced 1280px maximum-spacing overflow. The post-fix geometry checks at 320, 1280, and 1440 confirm those overflow defects are removed.

## Live interaction and state matrix

- Size progression 100/125/150/200 was checked; the initial 320px route stayed contained at 100/125/150, and the 200% defects above were fixed and rerun.
- All four themes transitioned with the correct pressed state. A persisted `blue-light` state hydrated correctly.
- A 150% setting persisted across reload.
- Search for `лицензия` returned 2 results, caused no overflow, and Escape closed the search.
- The advanced dialog initially focused its close control; Shift+Tab wrapped to reset; Escape hid the dialog, released the scroll lock, and returned focus to the gear control.
- Reset left the dialog open, disabled accessibility mode, removed presentation attributes, set speech to false, announced exactly `Настройки сброшены`, and kept document overflow at 0.
- Ordinary-version behavior after 125% removed presentation attributes, retained the 125% output/value, announced the expected status, and intentionally left the toolbar open.
- The mobile menu opened with its lock. Opening accessibility controls while the menu is open is not exposed, so the live coexistence path is safe. Appointment/accessibility nested modal ownership and two-stage Escape ordering remain covered by the production-shaped automated regression.
- The specialists coverflow live rerun confirmed active-only tabbing and hidden side/back slides.

Automated coverage additionally passes for v1/legacy migration, malformed and unknown storage, image hide/restore, toolbar nonmodal focus behavior, backdrop close, tabs, disclosures, cookie controls, horizontally scrollable tables, appointment/accessibility reference-counted locking, and focus restoration.

## Speech matrix and limitation

The in-app Browser exposed a qualifying local Russian voice, so the speech button was enabled. After enabling confirmations, a scale action produced the exact live status `Размер шрифта — 150 процентов`; no Browser errors or remote assets/requests appeared. The Browser surface cannot capture audible output, so actual sound was not asserted.

Unit tests pass for qualifying and unavailable local-voice paths, exact short phrases, hydration and panel-opening silence, latest-only cancellation, pagehide/beforeunload/ordinary/reset cancellation, reset's final confirmation, and absence of remote fallback. No third-party TTS resource or page-reading control was added.

## Automated production gate

Final verification after the Browser fixes:

```powershell
pnpm test
pnpm generate
pnpm generate
pnpm build
pnpm verify:site
git diff --check
```

The fresh full test run passes 36 files and 407/407 tests. Both generation runs are stable. The production build transforms 43 modules and emits all 21 HTML entries. The site verifier reports `Verified 21 HTML pages`. The diff whitespace check passes.

One earlier full-suite run under transient load timed out in the unrelated public-page visualization-label test at its 5-second limit. Its immediate isolated rerun passed 13/13 in 2.18 seconds, and the fresh final full run passed 407/407; no production change was made for the timing event.

The generated `dist` scan finds no Lidrekon, ResponsiveVoice, Yandex VoiceTech, jQuery, `data-speech-read`, `data-speech-pause`, `data-speech-stop`, `Читать страницу`, or `Озвучивание страницы` match.

## Contrast evidence

The automated suite calculates actual consumer chains with 4.5:1 text and 3:1 essential UI/focus thresholds.

| Theme | Text/page | Link/page | Primary | Selected | Unselected | Border/page | Border/raised | Strong/dialog | Strong/notice | Focus/page | Focus/dialog |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| standard | 15.75 | 5.69 | 5.77 | 5.77 | 5.77 | 3.57 | 3.62 | 3.62 | 3.29 | 5.69 | 5.77 |
| black-white | 21.00 | 21.00 | 21.00 | 21.00 | 21.00 | 21.00 | 21.00 | 21.00 | 21.00 | 21.00 | 21.00 |
| white-black | 21.00 | 15.81 | 21.00 | 21.00 | 15.81 | 21.00 | 21.00 | 21.00 | 21.00 | 15.81 | 15.81 |
| blue-light | 14.01 | 9.50 | 10.84 | 10.84 | 10.39 | 6.28 | 6.87 | 6.87 | 5.34 | 9.50 | 10.39 |

## Remaining limitations

The Browser could not capture audible speech, so only voice availability, enabled state, exact phrase/state, error absence, and no-network behavior were observed live. The live nested appointment/accessibility modal stack was not recreated during the resumed Browser session; its production-shaped automated regression passed. These limitations do not justify a public WCAG or ГОСТ certification claim.
