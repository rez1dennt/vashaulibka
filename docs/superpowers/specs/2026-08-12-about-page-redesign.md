# About Page Redesign Specification

## Goal

Turn `about.html` from a legal-reference page into a patient-oriented trust page that explains the clinic, licensed directions, published team and official documents while preserving only confirmed facts.

## Approved direction

Use an editorial trust narrative with a few tightly composed bento elements. The page should feel calm, premium and medically credible rather than promotional or startup-like.

- Domain: private dental clinic in Belgorod.
- Audience: prospective patients comparing clinics and existing patients checking official information.
- Tone: clear, calm, factual and welcoming.
- Mood: confident, light and trustworthy.
- Motion: subtle interactive feedback only.
- Layout sequence: split hero, asymmetric mission/values, full-width facts band, editorial gallery, three-column service index, compact team list, document-led license section, legal details, appointment CTA.
- Reference anchor: the supplied light medical editorial layout, translated into the site's existing single token theme.

## Current-page audit

### Baseline score

| Dimension | Score | Reason |
|---|---:|---|
| Visual hierarchy | 6/10 | The hero is clear, but the body becomes two similarly weighted information blocks. |
| Consistency | 8/10 | Existing shared tokens and components are used correctly. |
| Accessibility | 8/10 | Semantic headings, landmarks and responsive foundations are present. |
| Usability | 6/10 | Official facts are available, but patient-oriented paths and next actions are weak. |
| Responsiveness | 8/10 | The generic layout reflows, though it does not create an intentional mobile narrative. |
| Performance | 9/10 | Local optimized assets and a static renderer keep the page lightweight. |

Weighted baseline: 7.3/10.

### Prioritized findings

| # | Severity | Finding | Resolution |
|---|---|---|---|
| 1 | Major | The page goal is dominated by legal details instead of answering why a patient can trust the clinic. | Lead with mission, verified strengths, licensed care and the published team. |
| 2 | Major | Two repeated generic content blocks create a flat, templated rhythm. | Use distinct adjacent archetypes and one clear focal point per section. |
| 3 | Major | There are no contextual routes to services, specialists, documents or appointment after the hero. | Add descriptive links and a final appointment block without introducing a personal-data form. |
| 4 | Minor | Confirmed facts are difficult to scan. | Present four concise fact cells with icons and exact source-derived labels. |
| 5 | Enhancement | Existing optimized interior visualizations are underused. | Create an editorial three-image gallery with one honest visualization caption. |

No critical accessibility or functional defect is being addressed by this redesign.

## Content boundary

Every factual statement must come from existing source modules:

- `CLINIC`, `CONTACTS`, `HOURS` and `LICENSE` from `src/data/clinic.js`;
- `SERVICES` from `src/data/services.js`;
- `STAFF` from `src/data/staff.js`.

The page must not claim:

- years of clinical operation based on the legal-entity registration date;
- patient counts, treatment counts, ratings or awards;
- equipment, technology, accessibility features or room conditions that are not documented;
- staff education, experience, qualifications or accreditations that are still unconfirmed;
- published prices that are not in the approved price list.

The registration fact is labelled explicitly as legal-entity registration. Team count means entries in the published staff list. The license status and three licensed service directions are rendered from data, not duplicated literals.

## Information architecture

### 1. Hero

Preserve the existing responsive `about` hero image and breadcrumb pattern. Change the heading to `О клинике` and the lead to a concise patient-oriented sentence about licensed dental care in Belgorod. Keep the small `Визуализация интерьера` disclosure.

### 2. Mission and values

Use an asymmetric 4/8 split:

- left: `Наша задача` with concise factual copy and a secondary link to the license page;
- right: four value cells with local SVG icons: transparent information, licensed care, documented team information and patient rights.

Values describe how the website presents information; they must not invent clinical outcomes or amenities.

### 3. Verified facts band

Render four equal cells on desktop and a 2×2 grid below the desktop breakpoint:

1. `2012` / `Регистрация юридического лица` derived from `CLINIC.registeredSince`;
2. `3` / `Лицензированных направления помощи` derived from `SERVICES.length`;
3. `5` / `Сотрудников в опубликованном списке` derived from `STAFF.length`;
4. `Действует` / `Статус медицинской лицензии` derived from `LICENSE.status`.

### 4. Space and appointment

Use an editorial split with copy/checklist on the left and a three-image mosaic on the right. Reuse optimized local AVIF/WebP sources from the existing clinic visualization set. Use one quiet shared caption `Визуализация интерьера`; do not represent the images as photographs of the real premises. Include the existing appointment opener and a link to contacts.

### 5. Licensed care index

Render one section from `SERVICES` with three differently composed but system-consistent items. Each item contains the service title, summary, one local SVG icon and a descriptive link to `services.html`.

### 6. Published team

Render all `STAFF` entries from data. Use initials, names and roles only. Do not generate portraits or credentials. The section includes a link to `specialists.html` and a concise notice that qualification documents are awaiting verified publication.

### 7. License and documents

Make the approved license extract the focal visual. Show its real WebP preview linked to the PDF, the current license number/status/authority/order from `LICENSE`, and a clear link to `license.html`. Include the OGRN certificate as a secondary document link, not an equal competing card.

### 8. Legal details

Place compact legal-entity details after the trust narrative:

- legal name;
- OGRN;
- INN;
- registered address;
- activity address.

Use a semantic definition list. Do not hide the details behind JavaScript.

### 9. Final appointment CTA

Use a full-width soft brand surface containing:

- `Запишитесь на приём`;
- both clinic telephone links;
- verified hours from `HOURS`;
- the shared `data-appointment-open` action.

No form or personal-data field is added before MIS integration is approved.

## Visual system

- Reuse the current single token theme, heading serif, body sans family, primary blue and warm/cool white surfaces.
- No new raw colors, shadows, font sizes, radii or breakpoints.
- Outer section spacing must exceed card padding and internal gaps.
- Most surfaces stay flat with hairline borders; use the existing card shadow only for the main document/media focal surfaces.
- Avoid consecutive equal three-card rows, centered-everything layouts and decorative pills.
- Keep body copy within the existing readable measure.
- Use only local inline SVG icons from `src/templates/icons.js`; no emoji.

## Responsive behavior

- Mobile first at 320px: every section becomes a single reading column except the 2×2 facts grid; gallery becomes one wide image plus two equal secondary images.
- Tablet at 768px: mission/value cells and gallery use two-column compositions where space permits.
- Desktop from the existing `75rem` breakpoint: approved asymmetric grids and four-cell facts band appear.
- The fixed mobile appointment action remains unchanged and the new final CTA must leave its reserved clearance intact.
- Long organization, authority and address strings must wrap without clipping or document overflow.
- Vision mode at 320px must retain all content and controls without horizontal scrolling.

## Accessibility and semantics

- Exactly one page `<h1>`; section headings follow logical order.
- Semantic `<section>`, `<article>`, `<figure>`, `<figcaption>`, `<dl>`, `<dt>`, `<dd>`, `<ul>` and descriptive links.
- Conceptual interior images use empty alt text when decorative; the shared caption carries the disclosure.
- Document preview alt text identifies the actual document.
- All interactive targets use existing button/link primitives and focus-visible treatment.
- No new interaction requires JavaScript. Existing dialog, cookie, navigation and vision-mode behavior remains unchanged.
- Existing reduced-motion rules cover the small hover/press transitions.

## Code architecture

- Create `src/content/about-page.js` exporting a frozen `ABOUT_PAGE` object and small pure render helpers local to that page.
- Replace the inline about object in `src/content/core-pages.js` with `ABOUT_PAGE`.
- Keep facts in `src/data`; do not duplicate clinic facts in CSS, generated HTML or tests.
- Add page-scoped rules to `src/styles/pages.css` under `.about-*` selectors, consuming existing tokens only.
- Regenerate `about.html`; generated root HTML is never edited directly.
- Reuse the existing responsive raster assets; do not add remote media, fonts or trackers.

## Verification contract

### Automated

- New content tests verify section order, exact derived facts, all service titles, all staff entries, license/document links, telephone appointment action and absence of forms or fabricated claims.
- New style tests verify mobile-first grids, the `75rem` desktop contract, token-only values and scoped `.about-*` selectors.
- Existing renderer, asset, SEO, accessibility and site-verifier tests remain green.
- `pnpm generate`, focused tests, `pnpm verify`, `git diff --check`, hardcode lint and theme-reference validation must pass.

### In-app Browser

Check `about.html` at 320, 390, 768 and 1280px:

- no document overflow or clipped visible controls;
- one H1 and logical section order;
- facts are 2×2 below desktop and four columns at desktop;
- gallery, document preview and team list remain legible;
- appointment dialog still opens, traps focus and returns focus correctly;
- vision mode at 320px preserves reflow;
- console has no errors and active assets remain same-origin.

## Definition of done

The redesigned page gives a prospective patient a clear sequence from clinic identity to verified strengths, licensed care, team, documents and appointment. It matches the supplied reference's light medical editorial language without copying its placeholder facts, photographs or branding, and it remains legally honest, accessible, responsive and consistent with the rest of the site.
