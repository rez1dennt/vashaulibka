# Clinic Documents, Prices, Services, and Staff Design

**Date:** 17 August 2026
**Status:** Approved in conversation
**Project:** ООО «Стоматология Ваша улыбка» public website

## Goal

Replace the remaining placeholder content with a source-based, publication-ready documents area, an approved price-list page, corrected licensed-service wording, and complete staff information without inventing facts or presenting outdated regulations as current.

## Confirmed source material

| Source | Confirmed contents | Public use |
| --- | --- | --- |
| `Прайс.pdf` | 19-page price list, 328 numbered positions, approved 5 May 2026 | Publish the original unchanged; expose clear view and download actions |
| `Комментарий  прайса.docx` | Order No. 804n basis; informational/non-public-offer notice; final cost after consultation and treatment plan; prices may change with material costs | Edit grammar without changing meaning and render as accessible HTML |
| `Охрана труда.pdf` | Three-page summary of the special assessment of working conditions | Publish unchanged under the full document title |
| `Список сотрудников.pdf` | Five employees, positions, document/registry identifiers, education levels, issue years, and specialties | Use as the structured source for staff data; retain the original only if explicitly required later |
| `рассказ о сотрудниках где будет фото.docx` | Biographies, education, retraining, and experience for five employees | Render as edited, source-faithful staff biographies |

The price-list comment requests a model paid-services contract, but no contract file has been supplied. The public site must not show a broken link or fabricated contract. The missing file remains a documented launch input.

## Content architecture

### New documents centre

Create a dedicated indexable `documents.html` page rather than overloading `license.html`. It contains visible, non-collapsed sections:

1. **Clinic registration and licence**
   - licence registry extract;
   - OGRN certificate.
2. **Prices and paid medical services**
   - approved price list dated 5 May 2026;
   - payment information;
   - warranty terms;
   - benefits and discounts;
   - model-contract item only after the source file is supplied.
3. **Rules and patient rights**
   - Government Resolution No. 736, labelled as applicable through 31 August 2026;
   - Government Resolution No. 659, labelled as applicable from 1 September 2026;
   - Ministry of Health Order No. 118n;
   - Federal Law No. 323-FZ and other already source-backed patient-information pages.
4. **State guarantees and medicines**
   - Government Resolution No. 2188 as the current 2026 state-guarantees programme;
   - Government Resolution No. 1940 only in a clearly labelled archive subsection for the 2025 programme;
   - Resolution No. 890 and medicine-list sources only through verified official/current links, with no unsupported claim that the private clinic participates in OMC.
5. **Standards and recommendations**
   - current official publication for the nomenclature of medical services, including Order No. 804n where applicable;
   - Ministry of Health clinical-recommendations registry.
6. **Local and labour documents**
   - special-assessment-of-working-conditions PDF;
   - privacy, consent, cookies, complaints, waiting-period, OMC, and other existing clinic pages.

Every document item displays a human-readable title, document type, date or applicability period when known, status, and one primary action. Local PDFs also offer a download action. External legal links must point to official sources whenever an official publication is available.

### Price page

Replace the placeholder and remove controlled `noindex` status. The indexable page contains:

- the exact approval date, 5 May 2026;
- an accessible summary of the price-list scope;
- primary actions to open and download the unchanged 19-page PDF;
- the price-list comment, corrected only for grammar and punctuation;
- a statement that the final price is determined after consultation and preparation of a treatment plan;
- no manually invented or selectively copied prices;
- search metadata for common price queries and the two source categories: orthopaedic and therapeutic treatment.

The signed/scanned PDF is the authoritative complete price list. The site does not manually retype all 328 rows because that would create a material transcription-risk boundary. A future structured price dataset can be added only from a machine-readable or independently verified source.

### Services page

Retain three public directions, with corrected wording:

1. Therapeutic dentistry.
2. Orthopaedic dentistry.
3. Dentistry — primary pre-medical health care in dentistry performed by a dental practitioner.

Remove the public service title “Доврачебная помощь”, all public references to paid nursing services, “Сестринское сопровождение”, and matching search synonyms. Do not remove the two nurses from the clinic team.

### Staff page

Keep all five people on the “Команда” page:

- Демидова Инна Владимировна — director and chief physician;
- Демидов Андрей Фёдорович — dentist-therapist and dentist-orthopaedist;
- Рощина Любовь Ивановна — dental practitioner (`Зубной врач`), never “фельдшер стоматологический”;
- Ненько Софья Максимовна — medical nurse;
- Мясоедова Анастасия Андреевна — medical nurse.

Use the supplied sources for each biography, education, retraining, experience, education level, document/registry identifier, issue year, and specialty. Preserve source distinctions: only the relevant clinicians are described as participating in paid medical services; listing nurses as team members must not imply that nursing is a paid service direction.

Until real portraits and publishing rights are supplied, show the established neutral initials-based placeholders. Missing photos do not block indexing because qualifications and employee facts are now source-backed.

Retain the accessible coverflow interaction. The active card shows the concise identity and role; a stable detail area below shows the full source-backed information. With JavaScript unavailable, every employee’s information remains reachable in document order.

## Navigation and discovery

- Add “Документы” to the patient hub, footer, homepage document entry, sitemap, and search index.
- Preserve the existing primary-navigation fit; do not add another full-width desktop item if it causes crowding. A patient-information or footer route is acceptable for secondary navigation.
- Search must match staff surnames, confirmed roles, “зубной врач”, document titles and numbers, “СОУТ”, “охрана труда”, “прайс”, “прейскурант”, and common service-price terms.
- Search results lead to the relevant page or stable in-page document anchor.

## Visual design

The documents centre uses the existing premium-light clinic system rather than copying another clinic’s branding.

- Desktop: two-column category grid with consistent card heights where content permits.
- Mobile: one-column flow with no horizontal page overflow.
- Each category has a compact heading and document rows/cards with restrained icons, status badges, metadata, and actions.
- Status vocabulary is exact: `Действует`, `Действует до 31.08.2026`, `С 01.09.2026`, and `Архив`.
- Do not hide legally relevant content behind hover-only interactions.
- Controls keep visible focus, at least 44-pixel primary targets where applicable, and reduced-motion support.
- Price and staff pages reuse current spacing, typography, and responsive tokens; no remote fonts, trackers, maps, or new third-party runtime dependencies.

## Legal and factual boundaries

- Government Resolution No. 659 takes effect on 1 September 2026; until then No. 736 remains the applicable paid-services rules.
- Government Resolution No. 1940 is not presented as the current 2026 programme. No. 2188 is the current federal state-guarantees programme for 2026 and the planned period 2027–2028.
- The clinic’s existing non-participation statement for the territorial OMC programme remains unchanged unless the clinic supplies a newer official statement.
- The supplied PDFs are copied byte-for-byte and never modified.
- No contract, price, qualification, accreditation status, photograph, review, or service is invented.
- Public copy distinguishes a document/registry identifier from a claim of currently valid accreditation unless the source expressly supports the latter.

## Data and implementation boundaries

- Confirmed facts live in focused `src/data` modules.
- Page composition stays in `src/content`; generated root HTML is never edited manually.
- Public documents use stable ASCII filenames under `public/documents`.
- Document metadata and search metadata are generated from the same source objects to prevent drift.
- Existing renderer escaping and verifier rules remain mandatory.

## Verification design

Implementation follows strict red-green-refactor cycles. Automated checks cover:

- exact employee names, corrected roles, source-backed biographies, and identifiers;
- absence of nursing and old pre-medical wording from public paid-service content and search synonyms;
- price approval date, comment text, indexability, and both local PDF actions;
- byte identity of the copied price and labour PDFs;
- document-centre categories, exact regulation statuses, official URLs, and archive/current distinction;
- sitemap/search-index inclusion and absence of broken local links;
- stable regeneration of all root HTML;
- full site verifier, privacy/security scans, and no new remote active resources.

Browser QA covers `documents.html`, `prices.html`, `services.html`, and `specialists.html` at 320 and 1280 pixels, plus:

- horizontal overflow and clipped controls;
- menu, search, appointment dialog, cookie banner, and accessibility-mode coexistence;
- keyboard/focus behaviour and coverflow accessibility;
- PDF open/download targets;
- console errors and same-origin runtime resources.

## Completion criteria

The change is complete only when all supplied source material is represented in its approved destination; old placeholder/noindex states are removed where source data is now complete; date-sensitive acts are accurately labelled; generated pages, tests, build, verifier, and browser QA pass; and the final commit is pushed to the configured GitHub `main` branch.
