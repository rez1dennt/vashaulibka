# Compact accessibility controls: QA report

Date: 12 August 2026

Scope: Compact Accessibility Tasks 1–7

Build under test: production output generated from `eb6654ffeb4d395033a4b234e96f65e7e13ab57a` plus the Task 7 image-caption change recorded below.

## Result and evidence boundary

The automated Task 7 gate passed. The required in-app Browser instance was unavailable after the complete supported reconnection workflow, so no viewport, visual, live console/network, live focus, or live speech result is represented as a pass in this report. Automated checks are recorded separately from the unexecuted Browser matrix.

This report is implementation and QA evidence only. It does not certify compliance with WCAG, ГОСТ, or another accessibility standard. Any public conformance statement still requires the completed manual 21-page audit and written clinic/legal approval recorded in `CONTENT_CHECKLIST.md`.

## Carried image-caption Minor: RED to GREEN

Root cause: caption equivalence collapsed whitespace and compared case-insensitively, but retained punctuation. Consequently, `alt="Лицензия клиники"` and a whitespace/case variant ending with `ЛИЦЕНЗИЯ клиники.` were treated as different.

RED command:

```powershell
pnpm test tests/js/accessibility-images.test.js
```

Observed result: exit 1; 1 failed and 10 passed. The failing regression received `ЛИЦЕНЗИЯ клиники.` instead of the equivalent alt text `Лицензия клиники`.

Implementation: equivalence comparison now applies Unicode NFKC normalization, replaces Unicode punctuation runs with spaces, collapses whitespace, and compares Russian text with base sensitivity. Display text is not destructively normalized. A caption with genuinely additional information, `Лицензия клиники. Выписка из реестра`, remains intact.

GREEN command: the same focused command exited 0 with 11/11 tests passed.

## Automated production gate

Commands executed before the Browser attempt:

```powershell
pnpm generate
pnpm verify
git diff --check
```

Results:

- generation: exit 0;
- full test suite: 36 files, 401/401 tests passed;
- production build: exit 0; 43 modules transformed and all 21 HTML entries emitted;
- generated-site verifier: `Verified 21 HTML pages`;
- diff whitespace check: exit 0.

Focused accessibility matrix:

```powershell
pnpm test tests/js/accessibility-preferences.test.js tests/js/accessibility-mode.test.js tests/js/accessibility-settings-dialog.test.js tests/js/accessibility-speech.test.js tests/js/accessibility-images.test.js tests/js/dialog.test.js tests/templates/accessibility-panel.test.js tests/project/accessibility-conformance.test.js tests/styles/accessibility.test.js tests/styles/design-system.test.js
```

`tests/js/dialog.test.js` is not present and was reported as a missing path by the file-discovery scan; Vitest ran the nine existing requested files and passed 124/124 tests. Their production-shaped coverage includes:

- exact v2 defaults, persistence, v1 and legacy migration, malformed/unknown/failing storage, and reset removal;
- 100/125/150/200 stepping and boundaries, four themes, font/letter/line/paragraph choices, image hide/restore, ordinary-version retention, and final reset semantics;
- hydration and panel-opening silence, exact action messages, latest-only cancellation, pagehide/beforeunload/standard/reset cancellation, local-Russian-only voice selection, disabled unavailable state, and no network fallback;
- normal toolbar focus without a trap/scroll lock; advanced-dialog open/close, Tab and Shift+Tab wrapping, backdrop/button/Escape, ref-counted lock, focus return, and nested appointment/accessibility Escape ordering;
- one compact toolbar and one advanced dialog, unique IDs, valid static ARIA references, no positive tabindex, all image alt attributes, no reader controls/copy, and local active resources across all 21 rendered pages;
- continuous 320–768 reflow rules at 200%, 44px targets, compact intrinsic wrapping, safe-area dialog layout, reduced motion, readable typography cascade, and four-theme consumer contrast.

## Prohibited and stale runtime scan

The requested terms were scanned across `src`, `tests`, and `dist` after the production build. Every match was reviewed:

- Lidrekon, ResponsiveVoice, and Yandex VoiceTech occur only as verifier/test rejection fixtures or banned-host patterns;
- `data-speech-read`, `data-speech-pause`, and `data-speech-stop` occur only in negative assertions;
- `vision-mode` occurs only in the intentional backwards-compatible migration path and migration/absence tests;
- generated HTML contains none of those hooks, hosts, or stale copy;
- no `jquery`, `Читать страницу`, or `Озвучивание страницы` match was found.

The only `vision-mode` string in the production JavaScript bundle is the deliberate one-time migration key. It is removed after a successful v2 save; it is not a current preference schema or UI hook.

## Contrast evidence encoded in the automated suite

These ratios are calculated from the final theme declarations and their actual text, control, border, notice, dialog, and focus consumers. Text thresholds are 4.5:1 and essential UI/focus thresholds are 3:1.

| Theme | Text/page | Link/page | Primary | Selected | Unselected | Border/page | Border/raised | Strong/dialog | Strong/notice | Focus/page | Focus/dialog |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| standard | 15.75 | 5.69 | 5.77 | 5.77 | 5.77 | 3.57 | 3.62 | 3.62 | 3.29 | 5.69 | 5.77 |
| black-white | 21.00 | 21.00 | 21.00 | 21.00 | 21.00 | 21.00 | 21.00 | 21.00 | 21.00 | 21.00 | 21.00 |
| white-black | 21.00 | 15.81 | 21.00 | 21.00 | 15.81 | 21.00 | 21.00 | 21.00 | 21.00 | 15.81 | 15.81 |
| blue-light | 14.01 | 9.50 | 10.84 | 10.84 | 10.39 | 6.28 | 6.87 | 6.87 | 5.34 | 9.50 | 10.39 |

## Production preview and Browser connection

A fresh Vite production preview was started in a hidden process. Ports 4173–4175 were already occupied by unrelated listeners, so this task's preview selected `http://127.0.0.1:4176/`. Its log confirmed the local URL. The exact listener process was inspected and stopped after the Browser connection attempt; port 4176 was no longer listening.

The in-app Browser connection sequence was:

1. explicit selection of the required in-app Browser: unavailable;
2. built-in Browser connection troubleshooting consulted;
3. one supported discovery check: no browser instances (`[]`);
4. explicit in-app Browser retry: unavailable.

No Chrome, standalone Playwright, external browser-control server, screenshot parser, or source-code approximation was substituted for the requested in-app Browser.

## Required route/viewport matrix

Status: **not executed — in-app Browser unavailable**.

The 21 routes scheduled at both 320px and 1280px were:

`index.html`, `about.html`, `contacts.html`, `services.html`, `specialists.html`, `prices.html`, `reviews.html`, `vacancies.html`, `patients.html`, `license.html`, `payment.html`, `benefits.html`, `waiting-periods.html`, `oms.html`, `informed-consent.html`, `guarantees.html`, `complaints.html`, `standards.html`, `personal-data-consent.html`, `privacy.html`, and `cookies.html`.

The representative routes scheduled at 390, 480, 481, 600, 768, and 1440px were `index.html`, `services.html`, `specialists.html`, `patients.html`, `privacy.html`, and `contacts.html`.

The following live observations remain unverified: document horizontal overflow; visible clipping; header logo/wordmark/search/burger; rendered H1 and skip-link behavior; live same-origin requests; and browser console errors. The static/generated verifier covers one H1, working skip targets, local active resources, and generated structure, but those results are not presented as Browser observations.

## Required interaction matrix

Status: **not executed — in-app Browser unavailable**.

No live claim is made for:

- visual behavior at 100/125/150/200 and all four themes;
- large letter, line, and paragraph spacing; hidden/visible images;
- reload persistence, v1 migration, malformed/unknown records, ordinary-version retention, and complete reset in an actual browser profile;
- eye/collapse/Escape toolbar flows;
- gear, focus trap, Shift+Tab, backdrop, Escape, ref-counted lock, and focus return;
- coexistence with burger, search dropdown, appointment dialog, cookie banner, tabs, disclosures, specialists coverflow, and horizontally scrollable tables;
- nested modal Escape ordering in the live event loop.

The corresponding automated results are enumerated above and passed, but do not replace this matrix.

## Speech matrix

Status: **not executed — in-app Browser unavailable**.

The environment therefore did not establish whether a qualifying local Russian voice was installed. No live utterance, cancellation, hydration silence, navigation cancellation, disabled button/status, or network trace was observed. Unit tests passed for both qualifying local-voice and unavailable-voice paths, exact short phrases, latest-only cancellation, silence, reset final confirmation, and absence of remote fallback. No remote speech service was invoked or added.

## Browser-demonstrated defects

None were available to diagnose because no in-app Browser session could be established. Consequently, Task 7 made no speculative CSS/template/controller change. The only production change is the separately reproduced image-caption normalization fix.

## Remaining limitation and follow-up

The complete route/viewport, live interaction, live console/network, and live speech matrices must be rerun in the in-app Browser when an instance is connected. Until then, this report supports automated implementation confidence but not a completed manual accessibility audit or certification claim.
