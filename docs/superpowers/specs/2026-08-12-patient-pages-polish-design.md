# Patient Information Pages Polish — Design Specification

## Goal

Make the mobile header and every page in the patient-information section feel calm, spacious, and professionally medical while preserving all verified legal copy, routes, tables, accessibility behavior, and appointment flows.

## Approved Direction

Use an editorial medical layout rather than a dashboard or a narrow document column. White elevated content surfaces sit on the existing warm page background, blue is reserved for navigation and emphasis, and typography keeps the existing serif/sans pairing. The design must feel consistent with the redesigned home and about pages.

## Header

- Add an `eye` icon to the shared SVG icon registry and render it before “Версия для слабовидящих”. The icon is decorative because the visible button text remains the accessible name.
- On viewports below 75rem, the brand row shows the text “Ваша улыбка” and the existing menu toggle. The logo, the word “Стоматология”, and the small subtitle are hidden visually but the full clinic name remains in the link’s accessible label.
- At 75rem and above, retain the complete logo, full clinic name, subtitle, telephone actions, and desktop navigation.
- Increase the resting offset of the three hamburger strokes from 4px to 6px through a component token. The same element must still morph smoothly into the close icon without moving the button.

## Patient Hub

- Keep all 13 existing destinations and the services destination.
- Render the destinations as meaningful link cards with an inline SVG icon, title, compact descriptor, and arrow.
- Group cards under three scannable headings: treatment and payment; documents and guarantees; rights and data.
- Use one column at 320px, two columns from tablet width, and three columns on desktop. No card becomes a generic identical dashboard tile: selected cards may span two columns only when the grid has room and content length benefits.

## Individual Patient Pages

- Mark legal/patient routes through a page-level layout class produced by the shared renderer.
- Each content section receives a consistent editorial shell: generous outer padding, a restrained border, a raised surface, readable 60–75ch text measure, and clear spacing between notice, heading, prose, lists, actions, and tables.
- Notices use a small SVG icon and accent edge, not a large empty beige panel.
- Long pages retain semantic headings, lists, definition lists, links, QR image, and tables. Tables stay visually unchanged inside their scroll container, with additional breathing room around their heading and shell.
- Add a compact related-navigation band at the bottom of every patient/legal page linking back to “Информация для пациентов”, “Услуги”, and the telephone appointment action. It must not collect personal data.
- Do not rewrite, shorten, or infer legal facts. Only wrappers, icons, headings already present, and navigation labels may change.

## Responsive and Accessibility Requirements

- No horizontal page overflow at 320, 390, 768, 1280, or 1440 CSS pixels.
- All interactive targets remain at least 24×24 CSS pixels; primary controls continue using the 48px control size.
- Existing keyboard focus rings, skip link, menu dialog behavior, vision mode, reduced-motion handling, and no-JS navigation remain intact.
- New SVG icons use `currentColor`, are `aria-hidden`, and never replace visible text labels.
- Vision mode must preserve full text, card reflow, table scrolling, and header controls.

## Verification

- Test exact header markup, eye icon registration, mobile-brand class contract, page-level legal layout marker, grouped hub links, notice icons, related navigation, and preserved tables.
- Run focused tests in RED before implementation and GREEN afterward.
- Regenerate all HTML, run the full `pnpm verify` gate, token/hardcode audits, diff checks, and browser QA at the target widths.

