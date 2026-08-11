# Homepage alignment polish — verification report

Date: 2026-08-11

## Scope

- Removed the homepage quick-link cards from the hero overlap and added a 24 px separation.
- Aligned desktop utility-bar icons and their text on one horizontal axis.
- Rebuilt the homepage contact details as five consistent icon-and-content rows.
- Preserved all clinic, legal, license, SEO and appointment content unchanged.

## TDD evidence

### Header and quick links

- RED: `tests/styles/home-redesign.test.js` failed because the utility metadata still used the old display contract and the quick links still overlapped the hero.
- GREEN: focused suite passed 7/7 after adding the desktop inline-flex contract and 24 px section spacing.
- Commit: `d9f850f fix: align homepage header metadata`.

### Contact block

- RED: focused content/style suite failed 2 tests because the five `.home-contact__row` elements and the schedule icon row did not exist.
- GREEN: focused suite passed 15/15 after rendering address, two phones, email and schedule through one grid contract.
- Commit: `9b5d494 fix: align homepage contact details`.

## Browser QA

Production preview: `http://127.0.0.1:4173/index.html`

Viewports checked: 390×844, 1280×900 and 1440×900.

- Horizontal overflow: 0 at every viewport (`scrollWidth === clientWidth`).
- Visible horizontally clipped links/buttons: 0 at every viewport.
- H1 count: 1 at every viewport.
- Hero-to-first-card distance: exactly 24 px at all three viewports.
- Desktop utility items: address, hours and phone visible as flex rows; icon-to-row vertical center delta was approximately 0.008 px.
- Contact rows: exactly 5; icon left-edge spread was 0 px at all viewports.
- Phone and email icon-to-text vertical center delta: 1 px.
- Address and schedule use intentional top alignment for multiline content.
- Schedule row contains the clock icon and definition list.
- Mobile menu: open, Escape close, scroll unlock and focus return passed.
- Appointment dialog: open, Escape close, scroll unlock and focus return passed.
- Vision mode at 390 px: on/off, no overflow and 0 clipped controls.
- Browser console warnings/errors: 0.

## Design-system gates

- `lint_hardcodes.py src/styles`: passed; 6 files scanned, no hardcoded values.
- `validate_theme_refs.py src/styles/tokens.css src/styles`: passed; 276 tokens, all references resolved.
- Visual inspection completed in the in-app browser; no new color or contrast contract was introduced.

## Final verification

- `pnpm verify`: passed.
- Vitest: 14 files, 166/166 tests passed.
- Vite: 35 modules, production build passed.
- Site verifier: 21/21 HTML pages passed.
- `git diff --check`: passed.

## Result

The requested homepage spacing and alignment polish is complete without changing confirmed clinic facts, legal copy, privacy behavior, appointment behavior or indexing rules.
