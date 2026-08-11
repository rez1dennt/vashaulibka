# Compact Homepage Schedule — Verification Report

## Scope

- Replaced the tall homepage schedule list with one semantic four-cell definition grid.
- Preserved verified values from `HOURS` and the existing clock icon/contact layout.
- Base presentation is 2×2; from `75rem` it becomes one four-column strip.

## TDD evidence

- Baseline: `pnpm test` — 14 files, 166/166 tests passed.
- RED: `pnpm test tests/content/home-page.test.js tests/styles/home-redesign.test.js` — 3 expected failures because `.home-contact__hours`, its four cells and responsive rules did not exist.
- GREEN: the same focused command — 2 files, 16/16 tests passed.
- Full gate: `pnpm verify` — 14 files, 167/167 tests passed; Vite built 35 modules; production verifier checked 21 HTML pages.

## Design-system gates

- `lint_hardcodes.py src/styles` — scanned 6 files, no hardcoded values.
- `validate_theme_refs.py src/styles/tokens.css src/styles` — 276 tokens, every reference resolves.
- `verify_states.mjs index.html` and `--dark` — skipped by the external skill script because its standalone Playwright dependency is not installed.
- `taste_audit.mjs index.html` — skipped for the same external dependency reason; real in-app Browser review was completed instead.
- `accuracy_report.mjs` from the skill package — 17/25 package self-checks passed; 8 Windows launcher/path checks failed inside the external skill package. This is not a product gate. The project-native build, verifier, token and hardcode gates passed independently.

## In-app Browser QA

Production preview `http://127.0.0.1:4173/index.html` was checked with fresh reloads after every viewport change.

| Viewport | Columns | Cells | Page overflow | Cell clipping | Clock alignment | Contact image |
|---|---:|---:|---|---|---:|---|
| 320×900 | 2 | 4 | none | none | 2px optical offset | visible, 281px |
| 390×900 | 2 | 4 | none | none | 2px optical offset | visible, 351px |
| 768×900 | 2 | 4 | none | none | 2px optical offset | visible, 332.5px |
| 1280×900 | 4 | 4 | none | none | 2px optical offset | visible, 588.5px |

At 320px with vision mode enabled, all four cells remained visible in two columns, body font size was 18px, and neither the cells nor the document overflowed.

A transient `scrollWidth` mismatch appeared after several viewport overrides without reload. Element bounds showed no overflowing node; reloading at 1280px reset both `clientWidth` and `scrollWidth` to 1265px. Repeating the complete matrix with a fresh reload per width produced no overflow.

## Result

The schedule is compact and balanced: two rows on phone/tablet, one even strip on desktop, exact verified clinic hours, semantic `<dl>/<dt>/<dd>` markup, and no change to other definition lists.
