# Clinic Documents, Prices, Services, and Staff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the supplied price list, labour document, regulations, and complete employee facts while correcting the paid-service taxonomy and preserving the site’s responsive, accessible design.

**Architecture:** Add a focused document metadata module and a dedicated generated documents page, keep original PDFs as immutable public artifacts, enrich the existing staff and service data models, and render every affected page from centralized source data. Extend the current Vitest/JSDOM, verifier, search-index, and CSS-contract tests before changing production code.

**Tech Stack:** Node.js ESM, Vite 8, Vitest 4, JSDOM, vanilla semantic HTML/CSS/JavaScript, generated multi-page static HTML, PowerShell for binary copy/hash verification.

## Global Constraints

- Work only in `C:\Users\bahti\Documents\стоматологическая клиника МИС заказ\.worktrees\clinic-site` on `feature/clinic-site`.
- Do not hand-edit generated root HTML, `public/search-index.json`, `public/sitemap.xml`, or `public/robots.txt`; run `pnpm generate`.
- Follow strict RED -> GREEN -> REFACTOR for every product-code task.
- Preserve the source PDFs byte-for-byte with SHA-256 hashes specified in Task 1.
- Do not invent a paid-services contract, price, employee qualification, accreditation status, photograph, review, vacancy, or medical service.
- Keep all five supplied employees on the team page; remove nursing only from the public paid-service taxonomy.
- Label Рощина Любовь Ивановна exactly as `Зубной врач`.
- Label Government Resolution No. 736 `Действует до 31.08.2026`, No. 659 `С 01.09.2026`, No. 2188 `Действует`, and No. 1940 `Архив`.
- Use only local runtime assets; no remote fonts, analytics, trackers, map embeds, or new runtime dependency.
- Preserve visible focus, keyboard access, reduced motion, no-JS access, and the compact accessibility mode through 200% scaling.
- Before CSS implementation, read the UX/UI internal workflows for `design-code`, `design-tokens`, `a11y-audit`, and `design-qa` completely.
- Final verification requires `pnpm verify`, double generation stability, `git diff --check`, proportional in-app Browser QA, a clean worktree, and push to `origin/main`.

---

## File Structure

### New files

- `src/data/documents.js` — public artifact paths, price-list metadata/comment, official regulation metadata, and grouped document catalogue.
- `src/content/documents-page.js` — semantic renderer for `documents.html`.
- `tests/data/documents.test.js` — exact metadata and artifact-hash tests.
- `tests/content/documents-page.test.js` — catalogue semantics, statuses, links, and actions.
- `tests/styles/documents-prices-staff.test.js` — responsive visual contracts for the three revised experiences.
- `public/documents/price-list-2026-05-05.pdf` — byte-identical copy of `Прайс.pdf`.
- `public/documents/sout-summary-2024.pdf` — byte-identical copy of `Охрана труда.pdf`.

### Modified files

- `src/data/legal.js` — retain legal copy while importing/re-exporting shared document paths only where compatibility requires it.
- `src/data/services.js` — replace the third paid-service direction.
- `src/data/staff.js` — replace incomplete placeholders with source-backed structured staff facts.
- `src/data/search-keywords.js` — add documents metadata and corrected service/staff/price queries.
- `src/content/page-manifest.js` — add the documents page.
- `src/content/legal-pages.js` — add the documents route to the patient hub and related navigation; consume shared document paths.
- `src/content/service-pages.js` — publish the approved price-list experience and remove both controlled noindex states.
- `src/content/specialists-page.js` — render source-backed profile panels.
- `src/content/home-page.js` — route document discovery to the new centre and describe the published price list.
- `src/templates/site-chrome.js` — add the documents centre to the footer/patient links without crowding primary desktop navigation.
- `src/js/components/specialists-coverflow.js` — switch pre-rendered profile panels with the selected card.
- `scripts/generate-search-index.mjs` — index biography, education, specialty, and document terms.
- `src/styles/pages.css` and `src/styles/accessibility.css` — documents, prices, and staff-detail layouts.
- Existing tests under `tests/content`, `tests/js`, `tests/project`, `tests/scripts`, `tests/styles`, and `tests/templates` — update 21-page assumptions to 22 and lock the new behavior.
- `README.md` and `CONTENT_CHECKLIST.md` — record the published source artifacts and the one missing model-contract input.

---

### Task 1: Ingest immutable source artifacts and document metadata

**Files:**
- Create: `src/data/documents.js`
- Create: `tests/data/documents.test.js`
- Copy: `C:\Users\bahti\Downloads\Прайс.pdf` -> `public/documents/price-list-2026-05-05.pdf`
- Copy: `C:\Users\bahti\Downloads\Охрана труда.pdf` -> `public/documents/sout-summary-2024.pdf`
- Modify: `src/data/legal.js`
- Modify: `src/content/home-page.js`
- Modify: `src/content/legal-pages.js`

**Interfaces:**
- Produces: `PUBLIC_DOCUMENTS`, `PRICE_LIST`, `DOCUMENT_GROUPS` from `src/data/documents.js`.
- `PUBLIC_DOCUMENTS.priceList2026` is `documents/price-list-2026-05-05.pdf`.
- `PUBLIC_DOCUMENTS.soutSummary2024` is `documents/sout-summary-2024.pdf`.
- `PRICE_LIST` exposes `approvedAt`, `approvedLabel`, `pageCount`, `title`, `href`, and `notices`; it exposes no total item count because the supplied numbering skips 158 through 171.
- `DOCUMENT_GROUPS` is an immutable array of groups containing immutable document items with `id`, `title`, `kind`, `href`, `meta`, `status`, `statusTone`, and optional `download`.

- [ ] **Step 1: Write the failing metadata and hash tests**

Create `tests/data/documents.test.js`:

```js
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DOCUMENT_GROUPS, PRICE_LIST, PUBLIC_DOCUMENTS } from '../../src/data/documents.js';

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex').toUpperCase();

describe('published clinic documents', () => {
  it('describes the approved price list without inventing a contract', () => {
    expect(PRICE_LIST).toMatchObject({
      approvedAt: '2026-05-05',
      approvedLabel: '5 мая 2026 года',
      pageCount: 19,
      href: 'documents/price-list-2026-05-05.pdf',
    });
    expect(PRICE_LIST.notices.join(' ')).toContain('не является публичной офертой');
    expect(PRICE_LIST.notices.join(' ')).toContain('после консультации и составления плана лечения');
    expect(JSON.stringify(DOCUMENT_GROUPS)).not.toMatch(/образец договора/i);
  });

  it('keeps the supplied PDFs byte-identical', () => {
    expect(sha256(`public/${PUBLIC_DOCUMENTS.priceList2026}`)).toBe('FA85F2FD939C6A6E799932FB4C14FBF1CE05919A41CB2261A6C27E9ECFB16538');
    expect(sha256(`public/${PUBLIC_DOCUMENTS.soutSummary2024}`)).toBe('58552C0CFC157373A140F4082154DBCDAF79D99C7D6CAD33E1717BF5146035D9');
  });

  it('labels current, future, and archived government acts exactly', () => {
    const documents = DOCUMENT_GROUPS.flatMap((group) => group.items);
    expect(documents.find(({ id }) => id === 'paid-services-736')?.status).toBe('Действует до 31.08.2026');
    expect(documents.find(({ id }) => id === 'paid-services-659')?.status).toBe('С 01.09.2026');
    expect(documents.find(({ id }) => id === 'state-guarantees-2188')?.status).toBe('Действует');
    expect(documents.find(({ id }) => id === 'state-guarantees-1940')?.status).toBe('Архив');
  });
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```powershell
pnpm test tests/data/documents.test.js
```

Expected: FAIL because `src/data/documents.js` and the two public PDF targets do not exist.

- [ ] **Step 3: Copy the original PDFs and verify both hashes immediately**

Run:

```powershell
Copy-Item -LiteralPath 'C:\Users\bahti\Downloads\Прайс.pdf' -Destination 'public/documents/price-list-2026-05-05.pdf'
Copy-Item -LiteralPath 'C:\Users\bahti\Downloads\Охрана труда.pdf' -Destination 'public/documents/sout-summary-2024.pdf'
Get-FileHash -Algorithm SHA256 -LiteralPath 'public/documents/price-list-2026-05-05.pdf','public/documents/sout-summary-2024.pdf'
```

Expected hashes:

```text
FA85F2FD939C6A6E799932FB4C14FBF1CE05919A41CB2261A6C27E9ECFB16538
58552C0CFC157373A140F4082154DBCDAF79D99C7D6CAD33E1717BF5146035D9
```

- [ ] **Step 4: Implement the immutable document catalogue**

Create `src/data/documents.js` with these exact primary sources:

```js
export const PUBLIC_DOCUMENTS = Object.freeze({
  licenseRegistryExtract: 'documents/license-registry-extract.pdf',
  ogrnCertificate: 'documents/ogrn-certificate.pdf',
  priceList2026: 'documents/price-list-2026-05-05.pdf',
  soutSummary2024: 'documents/sout-summary-2024.pdf',
  legalResourcesQr: 'assets/qr/legal-resources.png',
});

export const PRICE_LIST = Object.freeze({
  title: 'Прейскурант платных стоматологических услуг',
  approvedAt: '2026-05-05',
  approvedLabel: '5 мая 2026 года',
  pageCount: 19,
  href: PUBLIC_DOCUMENTS.priceList2026,
  notices: Object.freeze([
    'Прайс-лист разработан в соответствии с приказом Минздрава России от 13 октября 2017 года № 804н «Об утверждении номенклатуры медицинских услуг».',
    'Настоящий прайс-лист носит информационный характер и не является публичной офертой. Стоимость лечения или протезирования зависит от нескольких параметров. Окончательную стоимость определяет врач после консультации и составления плана лечения.',
    'Цены могут изменяться в связи с изменением стоимости материалов.',
  ]),
});
```

Add `DOCUMENT_GROUPS` using these verified URLs:

```js
export const OFFICIAL_DOCUMENT_URLS = Object.freeze({
  order118n: 'https://publication.pravo.gov.ru/document/0001202504110006',
  paidServices736: 'https://publication.pravo.gov.ru/document/0001202305120025',
  paidServices659: 'https://publication.pravo.gov.ru/document/0001202606010083',
  stateGuarantees2188: 'https://publication.pravo.gov.ru/document/0001202512300036',
  stateGuarantees1940: 'https://publication.pravo.gov.ru/document/0001202412290002',
  healthLaw323: 'https://publication.pravo.gov.ru/Document/View/0001201111220007',
  nomenclature804n: 'https://publication.pravo.gov.ru/Document/View/0001201711080036',
  medicines890: 'https://minzdrav.gov.ru/documents/8713-postanovlenie-pravitelstva-rossiyskoy-federatsii-ot-30-iyulya-1994-g-890-o-gosudarstvennoy-podderzhke-razvitiya-meditsinskoy-promyshlennosti-i-uluchshenii-obespecheniya-naseleniya-i-uchrezhdeniy-zdravoohraneniya-lekarstvennymi-sredstvami-i-izdeliyami-meditsinskogo-naznacheniya',
  clinicalRecommendations: 'https://cr.minzdrav.gov.ru/',
});
```

Build `DOCUMENT_GROUPS` with the following exact catalogue. `kind` is `PDF`, `Страница сайта`, or `Официальная публикация`; local PDF items set `download: true`, all other items set `download: false`.

Use these exact group titles: `registration` -> `Лицензия и регистрация`; `prices` -> `Цены и платные услуги`; `patient-rights` -> `Правила и права пациентов`; `state-guarantees` -> `Государственные гарантии и лекарства`; `standards` -> `Стандарты и рекомендации`; `local-labour` -> `Документы клиники и охрана труда`.

| Group id | Item id | Title | href | meta | status | statusTone |
| --- | --- | --- | --- | --- | --- | --- |
| `registration` | `license-extract` | Выписка из реестра лицензий | `PUBLIC_DOCUMENTS.licenseRegistryExtract` | Оригинал документа клиники | Документ клиники | `neutral` |
| `registration` | `ogrn-certificate` | Свидетельство ОГРН | `PUBLIC_DOCUMENTS.ogrnCertificate` | Оригинал регистрационного документа | Документ клиники | `neutral` |
| `prices` | `price-list-2026` | Прейскурант платных стоматологических услуг | `PUBLIC_DOCUMENTS.priceList2026` | Утверждён 5 мая 2026 года · 19 страниц | Утверждён | `success` |
| `prices` | `payment` | Оплата медицинских услуг | `payment.html` | Способы оплаты и порядок расчётов | Информация клиники | `neutral` |
| `prices` | `guarantees` | Гарантийные сроки и сроки службы | `guarantees.html` | Положение и таблица сроков | Информация клиники | `neutral` |
| `prices` | `benefits` | Льготы и скидки | `benefits.html` | Условия предоставления льгот | Информация клиники | `neutral` |
| `patient-rights` | `paid-services-736` | Постановление Правительства РФ от 11.05.2023 № 736 | `OFFICIAL_DOCUMENT_URLS.paidServices736` | Правила предоставления платных медицинских услуг | Действует до 31.08.2026 | `warning` |
| `patient-rights` | `paid-services-659` | Постановление Правительства РФ от 30.05.2026 № 659 | `OFFICIAL_DOCUMENT_URLS.paidServices659` | Новые правила предоставления платных медицинских услуг | С 01.09.2026 | `accent` |
| `patient-rights` | `order-118n` | Приказ Минздрава России от 13.03.2025 № 118н | `OFFICIAL_DOCUMENT_URLS.order118n` | Требования к информации на сайтах медицинских организаций | Действует | `success` |
| `patient-rights` | `health-law-323` | Федеральный закон от 21.11.2011 № 323-ФЗ | `OFFICIAL_DOCUMENT_URLS.healthLaw323` | Основы охраны здоровья граждан | Официальная публикация | `neutral` |
| `state-guarantees` | `state-guarantees-2188` | Постановление Правительства РФ от 29.12.2025 № 2188 | `OFFICIAL_DOCUMENT_URLS.stateGuarantees2188` | Программа государственных гарантий на 2026 год и плановый период 2027–2028 годов | Действует | `success` |
| `state-guarantees` | `state-guarantees-1940` | Постановление Правительства РФ от 27.12.2024 № 1940 | `OFFICIAL_DOCUMENT_URLS.stateGuarantees1940` | Программа государственных гарантий на 2025 год и плановый период 2026–2027 годов | Архив | `muted` |
| `state-guarantees` | `medicines-890` | Постановление Правительства РФ от 30.07.1994 № 890 | `OFFICIAL_DOCUMENT_URLS.medicines890` | Лекарственное обеспечение отдельных категорий граждан | Официальный источник | `neutral` |
| `standards` | `nomenclature-804n` | Приказ Минздрава России от 13.10.2017 № 804н | `OFFICIAL_DOCUMENT_URLS.nomenclature804n` | Номенклатура медицинских услуг | Официальная публикация | `neutral` |
| `standards` | `clinical-recommendations` | Клинические рекомендации Минздрава России | `OFFICIAL_DOCUMENT_URLS.clinicalRecommendations` | Официальный рубрикатор | Официальный источник | `neutral` |
| `local-labour` | `sout-summary-2024` | Сводная ведомость результатов проведения специальной оценки условий труда | `PUBLIC_DOCUMENTS.soutSummary2024` | Документ клиники · 3 страницы | Документ клиники | `neutral` |
| `local-labour` | `complaints` | Обращения и жалобы | `complaints.html` | Способы обращения и контакты надзорных органов | Информация клиники | `neutral` |
| `local-labour` | `privacy` | Политика обработки персональных данных | `privacy.html` | Политика оператора | Действует | `success` |
| `local-labour` | `personal-data-consent` | Образец согласия на обработку персональных данных | `personal-data-consent.html` | Информационный образец сайта | Информация клиники | `neutral` |
| `local-labour` | `cookies` | Технические настройки и cookies | `cookies.html` | Локальные настройки и разрешение онлайн-записи | Информация сайта | `neutral` |
| `local-labour` | `waiting-periods` | Сроки ожидания медицинских услуг | `waiting-periods.html` | Максимальный и фактический сроки ожидания | Информация клиники | `neutral` |
| `local-labour` | `oms-status` | Участие в программе ОМС | `oms.html` | Подтверждённый статус клиники | Информация клиники | `neutral` |

Do not include the missing model contract.

- [ ] **Step 5: Move consumers to the focused data module**

Update `home-page.js` and `legal-pages.js` to import `PUBLIC_DOCUMENTS` from `../data/documents.js`. Remove `PUBLIC_DOCUMENTS` from `legal.js` after all references have moved. Import `OFFICIAL_DOCUMENT_URLS` in `legal.js` and derive the existing `OFFICIAL_SOURCES` compatibility object from it so URLs have one source of truth.

- [ ] **Step 6: Run focused GREEN and content safety tests**

Run:

```powershell
pnpm test tests/data/documents.test.js tests/data/content-safety.test.js tests/content/legal-pages.test.js
```

Expected: PASS.

- [ ] **Step 7: Commit Task 1**

```powershell
git add public/documents/price-list-2026-05-05.pdf public/documents/sout-summary-2024.pdf src/data/documents.js src/data/legal.js src/content/home-page.js src/content/legal-pages.js tests/data/documents.test.js
git diff --cached --check
git commit -m "feat: add verified clinic document sources"
```

---

### Task 2: Correct the public paid-service taxonomy

**Files:**
- Modify: `src/data/services.js`
- Modify: `src/data/search-keywords.js`
- Modify: `src/content/service-pages.js`
- Modify: `tests/data/content-safety.test.js`
- Modify: `tests/content/public-pages.test.js`
- Modify: `tests/scripts/search-index.test.js`

**Interfaces:**
- Replaces service slug `premedical` with `dentistry`.
- `SEARCH_SERVICE_KEYWORDS.dentistry` replaces `SEARCH_SERVICE_KEYWORDS.premedical`.
- Public service copy contains no “Доврачебная помощь”, “Сестринское дело”, “Сестринское сопровождение”, “медицинская сестра”, or “фельдшер”.

- [ ] **Step 1: Write the exact failing service and search tests**

Add assertions:

```js
const dentistry = SERVICES.find(({ slug }) => slug === 'dentistry');
expect(dentistry).toEqual({
  slug: 'dentistry',
  title: 'Стоматология',
  summary: 'Первичная доврачебная медико-санитарная помощь по стоматологии, оказываемая зубным врачом.',
  items: ['Первичная доврачебная медико-санитарная помощь по стоматологии'],
  priceStatus: 'Стоимость указана в утверждённом прейскуранте от 5 мая 2026 года.',
});
expect(JSON.stringify(SERVICES)).not.toMatch(/сестрин|фельдшер|Доврачебная помощь/i);
expect(SEARCH_SERVICE_KEYWORDS.dentistry).toEqual(expect.arrayContaining([
  'стоматология',
  'зубной врач',
  'стоматологическая помощь',
]));
expect(SEARCH_SERVICE_KEYWORDS).not.toHaveProperty('premedical');
```

- [ ] **Step 2: Run focused tests and confirm RED**

```powershell
pnpm test tests/data/content-safety.test.js tests/content/public-pages.test.js tests/scripts/search-index.test.js
```

Expected: FAIL on the old `premedical` service and nursing search terms.

- [ ] **Step 3: Implement the minimal corrected service object**

Replace only the third `SERVICES` item with:

```js
{
  slug: 'dentistry',
  title: 'Стоматология',
  summary: 'Первичная доврачебная медико-санитарная помощь по стоматологии, оказываемая зубным врачом.',
  items: ['Первичная доврачебная медико-санитарная помощь по стоматологии'],
  priceStatus: controlledPrice,
}
```

Replace the shared status text with:

```js
const controlledPrice = 'Стоимость указана в утверждённом прейскуранте от 5 мая 2026 года.';
```

Update the services page lead to:

```text
Терапевтическая и ортопедическая стоматология, а также стоматология в рамках работы зубного врача.
```

Replace `premedical` search metadata with the exact three confirmed dentistry terms from Step 1.

- [ ] **Step 4: Run focused GREEN**

```powershell
pnpm test tests/data/content-safety.test.js tests/content/public-pages.test.js tests/scripts/search-index.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```powershell
git add src/data/services.js src/data/search-keywords.js src/content/service-pages.js tests/data/content-safety.test.js tests/content/public-pages.test.js tests/scripts/search-index.test.js
git diff --cached --check
git commit -m "fix: publish the dental practitioner service"
```

---

### Task 3: Publish complete source-backed staff profiles

**Files:**
- Modify: `src/data/staff.js`
- Modify: `src/content/specialists-page.js`
- Modify: `src/js/components/specialists-coverflow.js`
- Modify: `scripts/generate-search-index.mjs`
- Modify: `src/data/search-keywords.js`
- Modify: `tests/data/content-safety.test.js`
- Modify: `tests/content/specialists-page.test.js`
- Modify: `tests/js/specialists-coverflow.test.js`
- Modify: `tests/scripts/search-index.test.js`

**Interfaces:**
- Every staff object exposes `id`, `name`, `role`, `initials`, `participatesInPaidServices`, `experience`, `education`, `professionalTraining`, `records`, and `photo`.
- Each `records` item exposes `identifier`, `issueYear`, `educationLevel`, and `specialty`.
- Each slide controls one pre-rendered `[data-specialist-profile]` panel via `aria-controls`.
- With JavaScript disabled, every profile is visible; after enhancement, only the active profile is visible.

- [ ] **Step 1: Write source-fact tests before replacing placeholders**

Assert these exact records in `tests/data/content-safety.test.js`:

```js
expect(STAFF.map(({ name, role }) => [name, role])).toEqual([
  ['Демидова Инна Владимировна', 'Директор, главный врач'],
  ['Демидов Андрей Федорович', 'Стоматолог-терапевт, стоматолог-ортопед'],
  ['Рощина Любовь Ивановна', 'Зубной врач'],
  ['Ненько Софья Максимовна', 'Медицинская сестра'],
  ['Мясоедова Анастасия Андреевна', 'Медицинская сестра'],
]);

expect(STAFF[0].records).toEqual([{
  identifier: '7725033298407', issueYear: 2025,
  educationLevel: 'Высшее', specialty: 'Организация здравоохранения и общественное здоровье',
}]);
expect(STAFF[1].records.map(({ identifier }) => identifier)).toEqual(['7725033633023', '7725033848178']);
expect(STAFF[2].records[0]).toEqual({
  identifier: '7725033711135', issueYear: 2025,
  educationLevel: 'Среднее профессиональное', specialty: 'Стоматология',
});
expect(STAFF.filter(({ participatesInPaidServices }) => participatesInPaidServices).map(({ name }) => name)).toEqual([
  'Демидова Инна Владимировна', 'Демидов Андрей Федорович', 'Рощина Любовь Ивановна',
]);
```

Assert biography phrases from the two supplied sources, including `23 года`, `18 лет`, `30 лет`, `Крымский медицинский институт`, `Тверскую государственную медицинскую академию`, `Белгородский медицинский колледж`, `акушерское дело`, and `сестринское дело` only inside team biography content.

- [ ] **Step 2: Write production-shaped profile-switching RED test**

Create markup with two production-shaped slides and two visible profile articles, run `initSpecialistsCoverflow()`, click Next, and assert:

```js
expect(profile1.hidden).toBe(true);
expect(profile2.hidden).toBe(false);
expect(profile2.getAttribute('aria-hidden')).toBeNull();
expect(slide2.getAttribute('aria-current')).toBe('true');
```

Also assert raw rendered HTML contains five visible profile articles before JavaScript enhancement.

- [ ] **Step 3: Run focused tests and confirm RED**

```powershell
pnpm test tests/data/content-safety.test.js tests/content/specialists-page.test.js tests/js/specialists-coverflow.test.js tests/scripts/search-index.test.js
```

Expected: FAIL because staff facts and profile panels do not exist and Рощина has the old role.

- [ ] **Step 4: Implement the structured staff data exactly from the sources**

Use arrays rather than prose blobs. Replace `STAFF` with these complete source-backed objects:

```js
export const STAFF = Object.freeze([
  Object.freeze({
    id: 'demidova-inna-vladimirovna',
    name: 'Демидова Инна Владимировна',
    role: 'Директор, главный врач',
    initials: 'ДИ',
    participatesInPaidServices: true,
    experience: 'Директор и главный врач клиники с 2012 года.',
    education: Object.freeze([
      'В 1997 году окончила Крымский медицинский институт им. С. И. Георгиевского по специальности «Педиатрия».',
    ]),
    professionalTraining: Object.freeze([
      'В 2012 году прошла профессиональную переподготовку по специальности «Организация здравоохранения и общественное здоровье».',
    ]),
    records: Object.freeze([Object.freeze({ identifier: '7725033298407', issueYear: 2025, educationLevel: 'Высшее', specialty: 'Организация здравоохранения и общественное здоровье' })]),
    photo: null,
  }),
  Object.freeze({
    id: 'demidov-andrey-fedorovich',
    name: 'Демидов Андрей Федорович',
    role: 'Стоматолог-терапевт, стоматолог-ортопед',
    initials: 'ДА',
    participatesInPaidServices: true,
    experience: 'Стаж работы врачом-стоматологом-терапевтом — 23 года; по специальности «Стоматология ортопедическая» — 18 лет.',
    education: Object.freeze([
      'В 2003 году окончил Тверскую государственную медицинскую академию по специальности «Стоматология».',
    ]),
    professionalTraining: Object.freeze([
      'В 2008 году прошёл профессиональную переподготовку в ГОУ ВПО ВГМА им. Н. Н. Бурденко по специальности «Стоматология ортопедическая».',
      'В 2009 году прошёл профессиональную переподготовку в ГОУ ВПО ВГМА им. Н. Н. Бурденко по специальности «Стоматология терапевтическая».',
    ]),
    records: Object.freeze([
      Object.freeze({ identifier: '7725033633023', issueYear: 2025, educationLevel: 'Высшее', specialty: 'Стоматология терапевтическая' }),
      Object.freeze({ identifier: '7725033848178', issueYear: 2025, educationLevel: 'Высшее', specialty: 'Стоматология ортопедическая' }),
    ]),
    photo: null,
  }),
  Object.freeze({
    id: 'roshchina-lyubov-ivanovna',
    name: 'Рощина Любовь Ивановна',
    role: 'Зубной врач',
    initials: 'РЛ',
    participatesInPaidServices: true,
    experience: 'Стаж работы по специальности — 30 лет.',
    education: Object.freeze([
      'В 1996 году окончила Белгородский медицинский колледж по специальности «Зубной врач».',
    ]),
    professionalTraining: Object.freeze([]),
    records: Object.freeze([Object.freeze({ identifier: '7725033711135', issueYear: 2025, educationLevel: 'Среднее профессиональное', specialty: 'Стоматология' })]),
    photo: null,
  }),
  Object.freeze({
    id: 'nenko-sofya-maksimovna',
    name: 'Ненько Софья Максимовна',
    role: 'Медицинская сестра',
    initials: 'НС',
    participatesInPaidServices: false,
    experience: 'Стаж работы в должности медицинской сестры — 2 года.',
    education: Object.freeze([
      'В 2021 году окончила ФГАОУ ВО «НИУ БелГУ» по специальности «Акушерское дело».',
      'На момент предоставления сведений обучается на VI курсе медицинского института НИУ БелГУ.',
    ]),
    professionalTraining: Object.freeze([
      'В 2024 году прошла профессиональную переподготовку в ФГАОУ ВО «НИУ БелГУ» по специальности «Сестринское дело».',
    ]),
    records: Object.freeze([Object.freeze({ identifier: 'Выписка из протокола № 2 заседания экзаменационной комиссии от 29.10.2024', issueYear: 2024, educationLevel: 'Среднее профессиональное', specialty: 'Сестринское дело' })]),
    photo: null,
  }),
  Object.freeze({
    id: 'myasoedova-anastasiya-andreevna',
    name: 'Мясоедова Анастасия Андреевна',
    role: 'Медицинская сестра',
    initials: 'МА',
    participatesInPaidServices: false,
    experience: 'Работает медицинской сестрой с 2026 года.',
    education: Object.freeze([
      'В 2024 году окончила ФГАОУ ВО «НИУ БелГУ» по специальности «Сестринское дело».',
    ]),
    professionalTraining: Object.freeze([]),
    records: Object.freeze([Object.freeze({ identifier: '3125033615891', issueYear: 2025, educationLevel: 'Среднее профессиональное', specialty: 'Сестринское дело' })]),
    photo: null,
  }),
]);
```

Do not convert any record into an unsupported “valid accreditation” claim.

- [ ] **Step 5: Render all profiles progressively and switch them in JavaScript**

Render:

```html
<div class="specialist-profiles" aria-live="polite">
  <article id="specialist-profile-1" class="specialist-profile" data-specialist-profile>...</article>
  <!-- all five profiles remain visible in raw HTML -->
</div>
```

In `initSpecialistsCoverflow()`, collect profiles and, inside `activate`, set `profile.hidden = !isActive` only after adding `.is-enhanced`. Keep each active profile exposed and all inactive profiles `aria-hidden="true"`; remove `aria-hidden` from the active profile. Preserve the existing slide focus and swipe behavior.

- [ ] **Step 6: Enrich search content without adding unsafe targets**

Change the staff search item `content` to join these existing values:

```js
[
  person.role,
  person.experience,
  ...person.education,
  ...person.professionalTraining,
  ...person.records.flatMap(({ identifier, specialty, educationLevel, issueYear }) => [identifier, specialty, educationLevel, issueYear]),
].join(' ')
```

Add every surname, `зубной врач`, `главный врач`, `стоматолог-терапевт`, and `стоматолог-ортопед` to staff keywords through the structured records rather than a separate fabricated list.

- [ ] **Step 7: Run focused GREEN**

```powershell
pnpm test tests/data/content-safety.test.js tests/content/specialists-page.test.js tests/js/specialists-coverflow.test.js tests/scripts/search-index.test.js
```

Expected: PASS.

- [ ] **Step 8: Commit Task 3**

```powershell
git add src/data/staff.js src/content/specialists-page.js src/js/components/specialists-coverflow.js scripts/generate-search-index.mjs src/data/search-keywords.js tests/data/content-safety.test.js tests/content/specialists-page.test.js tests/js/specialists-coverflow.test.js tests/scripts/search-index.test.js
git diff --cached --check
git commit -m "feat: publish verified staff profiles"
```

---

### Task 4: Replace the price placeholder with the approved source

**Files:**
- Modify: `src/content/service-pages.js`
- Modify: `src/data/staff.js`
- Modify: `src/data/search-keywords.js`
- Modify: `tests/content/public-pages.test.js`
- Modify: `tests/scripts/search-index.test.js`

**Interfaces:**
- `prices.html` consumes `PRICE_LIST` from `src/data/documents.js`.
- Both `prices.html` and `specialists.html` are indexable.
- The price page exposes one standard open link and one local link with the `download` attribute.
- `INCOMPLETE_CONTENT` is removed when it has no remaining consumers.

- [ ] **Step 1: Write the price-page RED assertions**

Add to `tests/content/public-pages.test.js`:

```js
const prices = pageDocument('prices.html');
expect(page('prices.html').noindex).toBe(false);
expect(page('specialists.html').noindex).toBe(false);
expect(prices.body.textContent).toContain('5 мая 2026 года');
expect(prices.body.textContent).toContain('не является публичной офертой');
expect(prices.querySelector(`a[href="documents/price-list-2026-05-05.pdf"]:not([download])`)).not.toBeNull();
expect(prices.querySelector(`a[href="documents/price-list-2026-05-05.pdf"][download]`)).not.toBeNull();
expect(prices.body.textContent).not.toContain('Прейскурант готовится к публикации');
```

Update the existing indexability test so no source-complete page is expected to have `noindex`.

- [ ] **Step 2: Run focused RED**

```powershell
pnpm test tests/content/public-pages.test.js tests/scripts/search-index.test.js
```

Expected: FAIL on the controlled placeholder and noindex state.

- [ ] **Step 3: Render the approved price-list page**

Use semantic markup with these stable classes:

```html
<section class="section price-source-section">
  <div class="container price-source">
    <article class="price-source__card">
      <p class="eyebrow">Утверждённый прейскурант</p>
      <h2>Прейскурант платных стоматологических услуг</h2>
      <dl class="price-source__meta">...</dl>
      <div class="price-source__actions">
        <a class="button button-primary" href="documents/price-list-2026-05-05.pdf">Открыть прейскурант</a>
        <a class="button button-secondary" href="documents/price-list-2026-05-05.pdf" download>Скачать PDF</a>
      </div>
    </article>
    <aside class="price-source__notice">...</aside>
  </div>
</section>
```

Render the three `PRICE_LIST.notices` as HTML paragraphs. Do not duplicate the scanned price rows in HTML or claim a total item count. Remove `INCOMPLETE_CONTENT.prices` and `INCOMPLETE_CONTENT.specialists`, then remove the object and obsolete `credentialNotice` if no consumer remains.

- [ ] **Step 4: Add complete price-search metadata**

Add price keywords:

```js
[
  'цены', 'стоимость', 'прайс', 'прайс-лист', 'прейскурант',
  'ортопедическое лечение', 'протезирование', 'терапевтическое лечение',
  'лечение зубов', 'консультация', 'пломба', 'коронка', 'протез',
]
```

Do not add an amount unless it appears in a future structured source.

- [ ] **Step 5: Run focused GREEN**

```powershell
pnpm test tests/content/public-pages.test.js tests/scripts/search-index.test.js tests/data/documents.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

```powershell
git add src/content/service-pages.js src/data/staff.js src/data/search-keywords.js tests/content/public-pages.test.js tests/scripts/search-index.test.js
git diff --cached --check
git commit -m "feat: publish the approved clinic price list"
```

---

### Task 5: Build the dedicated documents centre and connect discovery

**Files:**
- Create: `src/content/documents-page.js`
- Create: `tests/content/documents-page.test.js`
- Modify: `src/content/page-manifest.js`
- Modify: `src/content/legal-pages.js`
- Modify: `src/content/home-page.js`
- Modify: `src/templates/site-chrome.js`
- Modify: `src/data/search-keywords.js`
- Modify: `tests/content/public-pages.test.js`
- Modify: `tests/content/legal-pages.test.js`
- Modify: `tests/templates/site-chrome.test.js`
- Modify: `tests/scripts/search-index.test.js`
- Modify: `tests/project/accessibility-conformance.test.js`

**Interfaces:**
- Produces `DOCUMENTS_PAGE`, an indexable patient-layout page at `documents.html`.
- Page count changes from 21 to 22 everywhere.
- Each group uses a stable `id="documents-<group.id>"` anchor.
- Secondary navigation and search expose `documents.html`; primary desktop navigation remains unchanged.

- [ ] **Step 1: Write the dedicated documents-page test**

Create `tests/content/documents-page.test.js`:

```js
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { DOCUMENTS_PAGE } from '../../src/content/documents-page.js';
import { DOCUMENT_GROUPS } from '../../src/data/documents.js';
import { renderPage } from '../../src/templates/render-page.js';

describe('documents centre', () => {
  it('renders every approved document once with exact status and action semantics', () => {
    const document = new JSDOM(renderPage(DOCUMENTS_PAGE)).window.document;
    expect(DOCUMENTS_PAGE).toMatchObject({ file: 'documents.html', noindex: false, layout: 'patient' });
    const expectedItems = DOCUMENT_GROUPS.flatMap((group) => group.items);
    expect(document.querySelectorAll('[data-document-item]')).toHaveLength(expectedItems.length);
    for (const item of expectedItems) {
      const row = document.querySelector(`#document-${item.id}`);
      expect(row?.textContent).toContain(item.title);
      expect(row?.textContent).toContain(item.status);
      expect(row?.querySelector(`a[href="${item.href}"]`)).not.toBeNull();
    }
  });

  it('keeps the price and labour originals downloadable and the missing contract absent', () => {
    const document = new JSDOM(renderPage(DOCUMENTS_PAGE)).window.document;
    expect(document.querySelector('a[href="documents/price-list-2026-05-05.pdf"][download]')).not.toBeNull();
    expect(document.querySelector('a[href="documents/sout-summary-2024.pdf"][download]')).not.toBeNull();
    expect(document.body.textContent).not.toMatch(/образец договора/i);
  });
});
```

- [ ] **Step 2: Update route-count and discovery tests, then confirm RED**

Add `documents.html` to `approvedFiles`, expect 22 pages, keep `LEGAL_PAGES` at its existing 13 routes, and assert `DOCUMENTS_PAGE` is separately included once. Change accessibility test wording and counts from 21 to 22. Add footer, patient-hub, homepage, and search assertions for `documents.html`.

Run:

```powershell
pnpm test tests/content/documents-page.test.js tests/content/public-pages.test.js tests/content/legal-pages.test.js tests/templates/site-chrome.test.js tests/scripts/search-index.test.js tests/project/accessibility-conformance.test.js
```

Expected: FAIL because the page and links do not exist and the manifest still has 21 routes.

- [ ] **Step 3: Implement semantic document rendering**

Create small pure helpers inside `documents-page.js`:

```js
const renderDocumentItem = (item) => `
  <article class="document-item" id="document-${escapeHtml(item.id)}" data-document-item>
    <div class="document-item__copy">
      <span class="document-status" data-tone="${escapeHtml(item.statusTone)}">${escapeHtml(item.status)}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.meta)}</p>
    </div>
    <div class="document-item__actions">
      <a class="button button-secondary" href="${escapeHtml(item.href)}">Открыть</a>
      ${item.download ? `<a class="text-link" href="${escapeHtml(item.href)}" download>Скачать PDF</a>` : ''}
    </div>
  </article>`;
```

`DOCUMENTS_PAGE.body` contains a compact in-page category navigation followed by every group in a two-column-capable `.documents-directory` grid. External acts remain normal links; do not add `target="_blank"` surprises.

- [ ] **Step 4: Connect the page without crowding primary navigation**

- Add `DOCUMENTS_PAGE` once in `PAGES`.
- Add a `Документы` card to the patient hub.
- Replace the footer’s combined `license.html` destination with `documents.html` labelled `Документы`; keep `license.html` reachable inside the centre and patient hub.
- Change the homepage quick card `Лицензии и документы` to point to `documents.html` and describe licences, price list, and original clinic documents.
- Add a visible `Смотреть все документы` link after the homepage document previews.
- Add `SEARCH_PAGE_META['documents.html']` with regulation numbers, СОУТ, price, licence, OGRN, patient rights, and standards keywords.

- [ ] **Step 5: Run focused GREEN and generate once**

```powershell
pnpm test tests/content/documents-page.test.js tests/content/public-pages.test.js tests/content/legal-pages.test.js tests/templates/site-chrome.test.js tests/scripts/search-index.test.js tests/project/accessibility-conformance.test.js
pnpm generate
```

Expected: PASS and generated `documents.html` plus 21 existing pages.

- [ ] **Step 6: Commit Task 5**

```powershell
git add src/content/documents-page.js src/content/page-manifest.js src/content/legal-pages.js src/content/home-page.js src/templates/site-chrome.js src/data/search-keywords.js tests/content/documents-page.test.js tests/content/public-pages.test.js tests/content/legal-pages.test.js tests/templates/site-chrome.test.js tests/scripts/search-index.test.js tests/project/accessibility-conformance.test.js *.html public/search-index.json public/sitemap.xml public/robots.txt
git diff --cached --check
git commit -m "feat: add the clinic documents centre"
```

---

### Task 6: Implement responsive documents, price, and staff-profile styling

**Files:**
- Create: `tests/styles/documents-prices-staff.test.js`
- Modify: `src/styles/pages.css`
- Modify: `src/styles/accessibility.css`
- Modify: `tests/styles/specialists-coverflow.test.js`
- Modify: `tests/styles/patient-pages-polish.test.js`

**Interfaces:**
- New stable CSS roots: `.documents-directory`, `.documents-group`, `.document-item`, `.document-status`, `.price-source`, `.price-source__card`, `.price-source__notice`, `.specialist-profiles`, `.specialist-profile`.
- One-column mobile layout; two-column documents and price layout at the existing tablet/desktop breakpoint.
- Enhanced inactive staff profiles rely on `[hidden]`; raw no-JS profiles stay visible.

- [ ] **Step 1: Read the required UX/UI internal workflows**

Read completely:

```text
C:\Users\bahti\.codex\skills\ux-ui-agent-skills\.claude\skills\design-code\SKILL.md
C:\Users\bahti\.codex\skills\ux-ui-agent-skills\.claude\skills\design-tokens\SKILL.md
C:\Users\bahti\.codex\skills\ux-ui-agent-skills\.claude\skills\a11y-audit\SKILL.md
C:\Users\bahti\.codex\skills\ux-ui-agent-skills\.claude\skills\design-qa\SKILL.md
```

Resolve any referenced design-system paths against `C:\Users\bahti\.codex\skills\ux-ui-agent-skills`.

- [ ] **Step 2: Write the focused CSS-contract RED tests**

Create tests asserting:

```js
expect(pagesCss).toMatch(/\.documents-directory\s*\{[^}]*display:\s*grid/s);
expect(pagesCss).toMatch(/\.document-item\s*\{[^}]*min-inline-size:\s*var\(--space-0\)/s);
expect(pagesCss).toMatch(/\.document-item__actions\s*\{[^}]*flex-wrap:\s*wrap/s);
expect(pagesCss).toMatch(/\.price-source\s*\{[^}]*grid-template-columns:\s*minmax\(var\(--space-0\), 1fr\)/s);
expect(pagesCss).toMatch(/\.specialist-profile\s*\{[^}]*overflow-wrap:\s*anywhere/s);
expect(pagesCss).toMatch(/@media[^}]+min-width:[^)]+[\s\S]*\.documents-directory\s*\{[^}]*repeat\(2,/s);
expect(accessibilityCss).toContain('.document-item');
expect(accessibilityCss).toContain('.specialist-profile');
```

Also assert `prefers-reduced-motion` removes document-card transforms and existing coverflow motion.

- [ ] **Step 3: Run focused RED**

```powershell
pnpm test tests/styles/documents-prices-staff.test.js tests/styles/specialists-coverflow.test.js tests/styles/patient-pages-polish.test.js
```

Expected: FAIL because the new visual contracts do not exist.

- [ ] **Step 4: Implement token-consumer CSS**

Use only semantic/component tokens already declared in `tokens.css`. The key layout rules are:

```css
.documents-directory,
.price-source,
.specialist-profiles {
  min-inline-size: var(--space-0);
  display: grid;
  grid-template-columns: minmax(var(--space-0), 1fr);
  gap: var(--space-6);
}

.document-item {
  min-inline-size: var(--space-0);
  display: grid;
  gap: var(--space-5);
  padding: var(--space-6);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);
  box-shadow: var(--shadow-sm);
}

.document-item__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}
```

Add restrained status-tone styles using existing success, accent, neutral, and muted semantic colors. Extend the existing 200%-scale containment selector to `.documents-directory`, `.documents-group`, `.document-item`, `.price-source`, `.price-source__card`, `.price-source__notice`, and `.specialist-profile`.

- [ ] **Step 5: Run focused GREEN and full style tests**

```powershell
pnpm test tests/styles/documents-prices-staff.test.js tests/styles/specialists-coverflow.test.js tests/styles/patient-pages-polish.test.js tests/styles/design-system.test.js tests/styles/accessibility.test.js
```

Expected: PASS with no primitive-token leakage outside `tokens.css`.

- [ ] **Step 6: Commit Task 6**

```powershell
git add src/styles/pages.css src/styles/accessibility.css tests/styles/documents-prices-staff.test.js tests/styles/specialists-coverflow.test.js tests/styles/patient-pages-polish.test.js
git diff --cached --check
git commit -m "style: polish clinic documents and profiles"
```

---

### Task 7: Regenerate, verify, visually inspect, document, and publish

**Files:**
- Modify: `README.md`
- Modify: `CONTENT_CHECKLIST.md`
- Modify: all 22 generated root HTML pages through `pnpm generate`
- Modify: `public/search-index.json`, `public/sitemap.xml`, `public/robots.txt` through generators
- Create: `docs/superpowers/reports/2026-08-17-clinic-documents-prices-staff-qa.md`

**Interfaces:**
- Final generated page set contains exactly 22 HTML files.
- The QA report records commands, route/viewport evidence, document hashes, console/network results, and remaining source boundary.

- [ ] **Step 1: Update operator documentation**

README must name the new `documents.html` route, approved price-list source, and immutable public artifact paths. `CONTENT_CHECKLIST.md` must mark price list, staff facts, and СОУТ as received/published and keep exactly this unresolved input:

```text
- [ ] Получить утверждённый образец договора на оказание платных медицинских услуг; до получения не публиковать ссылку или самостоятельно составленный договор.
```

- [ ] **Step 2: Run generation twice and prove stability**

```powershell
$generated = @((Get-ChildItem -LiteralPath . -Filter '*.html' -File)) + @(Get-Item 'public/search-index.json','public/sitemap.xml','public/robots.txt')
pnpm generate
$before = $generated | Get-FileHash -Algorithm SHA256 | ForEach-Object { "$($_.Path)|$($_.Hash)" }
pnpm generate
$after = $generated | Get-FileHash -Algorithm SHA256 | ForEach-Object { "$($_.Path)|$($_.Hash)" }
if (Compare-Object $before $after) { throw 'Generated artifacts are not byte-stable' }
git diff --check
```

Expected: the two generated hash lists are identical and the diff check is clean.

- [ ] **Step 3: Run the fresh automated release gate**

```powershell
pnpm verify
git diff --check
Get-FileHash -Algorithm SHA256 -LiteralPath 'public/documents/price-list-2026-05-05.pdf','public/documents/sout-summary-2024.pdf'
```

Expected: all Vitest files pass, Vite builds 22 HTML entries, the site verifier reports 22 valid HTML pages, diff check is clean, and hashes equal the Task 1 constants.

- [ ] **Step 4: Run explicit prohibited-content scans**

```powershell
rg -n -i "Доврачебная помощь|Сестринское сопровождение|фельдшер стоматологический|Прейскурант готовится к публикации" --glob '*.html' --glob 'public/search-index.json'
rg -n -i "образец договора" --glob '*.html' --glob 'public/search-index.json'
```

Expected: zero matches. Separately verify `Сестринское дело` occurs only in the biographies/records for the two nurses, never in services or price metadata.

- [ ] **Step 5: Run in-app Browser QA on the production preview**

Start or refresh the production preview, then inspect:

| Route | 320 px | 1280 px | Checks |
| --- | --- | --- | --- |
| `documents.html` | Yes | Yes | category flow, status badges, open/download links, overflow, focus |
| `prices.html` | Yes | Yes | approval date, two PDF actions, disclaimer rhythm, no placeholder |
| `services.html` | Yes | Yes | corrected third direction, no nursing content, tabs/disclosures |
| `specialists.html` | Yes | Yes | five slides, five raw profiles, active profile switching, arrows/swipe/keyboard |
| `index.html` | Yes | Yes | documents discovery, header/footer fit, search result |

Also verify:

- accessibility mode at 200% on `documents.html` and `specialists.html` with no page overflow;
- keyboard focus order and visible focus;
- site search for `Рощина`, `зубной врач`, `659`, `2188`, `СОУТ`, `охрана труда`, and `прайс`;
- PDF navigation reaches the local artifact;
- menu, appointment dialog, cookie banner, and accessibility dialog retain correct layer/focus behavior;
- console errors are zero and active runtime resources stay local except the existing consent-gated MIS flow.

- [ ] **Step 6: Write the QA report with exact evidence**

Record:

- final commit range;
- test/build/verifier counts;
- both SHA-256 hashes;
- every route/viewport checked;
- search queries and selected targets;
- console/network observations;
- the missing model-contract file as the only content input in this scope;
- any Browser-runtime limitation as unverified, never as a pass.

- [ ] **Step 7: Final review and scoped release commit**

```powershell
git status --short
git diff --check
git add README.md CONTENT_CHECKLIST.md docs/superpowers/reports/2026-08-17-clinic-documents-prices-staff-qa.md *.html public/search-index.json public/sitemap.xml public/robots.txt
git diff --cached --check
git commit -m "docs: verify clinic content publication"
pnpm verify
git status --short
```

Expected: final verification passes and the tracked worktree is clean.

- [ ] **Step 8: Push the verified branch to GitHub main**

```powershell
git push origin HEAD:main
```

Expected: `origin/main` advances to the final verified commit without force push.

---

## Plan Self-Review

- **Spec coverage:** Every supplied PDF/DOCX has a destination: price PDF and comment -> price page; labour PDF -> documents centre; staff list and biography -> team page. New and archived regulations, search, navigation, indexing, accessibility, and GitHub publication each have an explicit task.
- **No-source boundary:** The model paid-services contract remains a checklist item and never appears as a public link.
- **Type consistency:** `PUBLIC_DOCUMENTS`, `PRICE_LIST`, `DOCUMENT_GROUPS`, the enriched `STAFF` shape, `DOCUMENTS_PAGE`, and the `data-specialist-profile` contract are named consistently across producer, consumer, and test tasks.
- **Route consistency:** Only `DOCUMENTS_PAGE` adds a route; total pages increase from 21 to 22 while `LEGAL_PAGES` remains 13.
- **Legal-date consistency:** No. 736, No. 659, No. 2188, and No. 1940 use the exact approved status labels in data, rendered content, search, and tests.
