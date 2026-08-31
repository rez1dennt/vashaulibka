# Real clinic photographs and soft hero edges — 31 August 2026

## Delivered scope

- Replaced all eight photo roles (home, about, services, specialists, prices, reviews, vacancies, contacts) using the six JPEG originals supplied by the clinic. No generated interior/facade photographs remain in the served photo directory.
- Preserved document previews, QR assets, icons and code-native decorative artwork.
- Created 16 WebP/AVIF assets, each 1280 × 720; combined size 1,234,629 bytes. Conversion auto-orients, crops and strips metadata. Downloads originals are unchanged.
- Used new `clinic-*` URLs to prevent reuse of cached `hero-*` photographs. Deleted 16 obsolete photo files; their previous versions remain recoverable through Git history.
- Recorded source hashes, crop coordinates, photo roles and descriptive alternatives in `src/data/clinic-photos.js`; added a repeatable ImageMagick conversion script.
- Removed the obsolete “Визуализация интерьера” labels from templates and CSS. Updated generated pages and search index.
- Following the additional screenshot request, placed page-hero photographs on a photo-sized decorative layer with intersecting horizontal/vertical opacity masks. Edges blend into the page; no blur filter is applied to the photograph. Desktop sizing retains the selected 16:9 composition.
- Fixed clipped text alternatives in the hidden-images accessibility mode: photo frames now grow with their text and the about gallery becomes a single column.
- Addressed the user's subsequent mobile-visibility report: the previous mobile scrim covered 88–100% of the image. Below 1200 px, page-hero photographs now occupy their own 16:9 row below the text, without the opaque scrim. A narrow edge mask remains; desktop composition is unchanged. Explicitly hiding images in accessibility settings removes the decorative photo row.

## Verification

- Final `pnpm verify`: 49 test files / 527 tests passed; production build succeeded; all 20 HTML pages passed the site verifier.
- Seven new regression tests cover replacement assets, obsolete references/captions, descriptive alternatives, background mappings, hero sizing/feathering, hidden-image reflow and visible mobile photo rows. Relevant tests were observed failing before implementation.
- Browser: all 20 public routes at 1280, 768, 360 and 320 px (80 route/viewport checks). No horizontal overflow, duplicate/missing H1, broken loaded image, obsolete photo reference or obsolete visualization label was found.
- Repeated the complete 80-check matrix after the mobile correction, additionally checking mobile photo height (at least 160 px), absence of the opaque gradient and a full photo-height space below the text. All checks passed. At 360 px the patients-page photo measured 345 × 194.06 px and remained separate from the text; screenshots confirmed photo visibility at 320, 360 and 768 px.
- Inspected real-photo outputs and desktop/mobile page screenshots, including the about hero at 1600 px. Its decorative photo layer measured approximately 762.66 × 429 px, with mask gradients enabled and `filter: none`; settled layout had no horizontal overflow.
- Accessibility: at 320 px, hidden-photo descriptions on about fit their frames at 100% and 150% text size. Home hidden-photo frames were checked at 150%. Returned the preview to the ordinary site version.
- Browser error log was empty. One browser-control navigation timed out; state inspection and a repeat completed the remaining mobile checks without a site code change. Measurements immediately during viewport resizing were excluded in favour of the settled layout.
- `git diff --check`: passed.

## Boundaries

- Browser checks use the in-app Chromium environment, not physical iOS/Android devices or every browser engine.
- No changes were made to MIS booking, SMS templates, legal documents or clinic identity in this photo task.
- A GitHub push does not by itself verify deployment to a public website; deployment is outside this report's evidence.
