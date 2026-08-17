# Reliable Documents and Licensed Directions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove empty document-grid gaps, provide verified local PDF fallbacks for fixed official acts, and expose exactly three licensed dental directions.

**Architecture:** Keep `SERVICES` as the detailed treatment-content source and add a small immutable `LICENSED_DIRECTIONS` navigation source that points to existing service anchors. Extend each fixed regulatory document with separate `href` (local PDF) and `officialHref` fields only after a verified official download; render groups in normal document flow and apply columns to each group's item grid instead of to whole groups.

**Tech Stack:** Vite 8, vanilla HTML/CSS/JavaScript, Vitest/JSDOM, Node.js acquisition script, local PDF assets, in-app Browser QA.

## Global Constraints

- Publish only `Стоматология`, `Стоматология ортопедическая`, and `Стоматология терапевтическая` as medical directions.
- Do not publish radiology, general-practice dentistry, preventive dentistry, or surgical dentistry until an updated registry extract confirms them.
- Nursing remains staff information and is not a standalone paid direction.
- Never save HTML, an error page, or a commercial mirror under a `.pdf` filename.
- A local regulatory PDF must originate from `publication.pravo.gov.ru`, `government.ru`, `static.government.ru`, or an official ministry domain.
- Clinical recommendations remain an external link to the live Ministry rubricator.
- Use the existing shared CSS tokens; no new palette, font, external dependency, analytics, or tracker.
- Preserve no-JS content, keyboard navigation, reduced motion, 200% reflow, and the consent-gated MIS behavior.
- Push to `origin/main` without force only after fresh verification.

---

### Task 1: Publish an exact three-direction directory

**Files:**
- Modify: `src/data/services.js`
- Modify: `src/content/service-pages.js`
- Modify: `src/data/search-keywords.js`
- Modify: `tests/data/services.test.js`
- Modify: `tests/content/public-pages.test.js`
- Modify: `tests/scripts/search-index.test.js`

**Interfaces:**
- Produces `LICENSED_DIRECTIONS: ReadonlyArray<{ slug: string, label: string }>`.
- `slug` matches an existing `SERVICES[].slug` and the existing `#service-<slug>` anchor.
- `SERVICES` remains the detailed-content source and contains exactly three records.

- [ ] **Step 1: Write the failing direction contract**

Add to `tests/data/services.test.js`:

```js
import { LICENSED_DIRECTIONS, SERVICES } from '../../src/data/services.js';

expect(LICENSED_DIRECTIONS).toEqual([
  { slug: 'dentistry', label: 'Стоматология' },
  { slug: 'orthopedics', label: 'Стоматология ортопедическая' },
  { slug: 'therapy', label: 'Стоматология терапевтическая' },
]);
expect(LICENSED_DIRECTIONS.every(({ slug }) => SERVICES.some((service) => service.slug === slug))).toBe(true);
expect(JSON.stringify({ LICENSED_DIRECTIONS, SERVICES })).not.toMatch(/рентген|общей практики|профилактическ|хирургическ|сестринск/i);
```

Add a public-page assertion that `services.html` has one `.licensed-directions` navigation, three links with exact labels, and correct `href="#service-..."` targets.

- [ ] **Step 2: Run RED**

```powershell
pnpm test tests/data/services.test.js tests/content/public-pages.test.js tests/scripts/search-index.test.js --reporter=dot
```

Expected: FAIL because `LICENSED_DIRECTIONS` and `.licensed-directions` do not exist.

- [ ] **Step 3: Implement the immutable source and semantic navigation**

Add to `src/data/services.js` after `SERVICES`:

```js
export const LICENSED_DIRECTIONS = Object.freeze([
  Object.freeze({ slug: 'dentistry', label: 'Стоматология' }),
  Object.freeze({ slug: 'orthopedics', label: 'Стоматология ортопедическая' }),
  Object.freeze({ slug: 'therapy', label: 'Стоматология терапевтическая' }),
]);
```

In `service-pages.js`, render before the desktop/mobile details:

```js
const directionLinks = LICENSED_DIRECTIONS.map(({ slug, label }) =>
  `<li><a href="#service-${escapeHtml(slug)}">${escapeHtml(label)}</a></li>`,
).join('');

const licensedDirections = `<nav class="licensed-directions" aria-labelledby="licensed-directions-title"><h2 id="licensed-directions-title">Направления медицинской деятельности</h2><ul>${directionLinks}</ul></nav>`;
```

Keep detailed service anchors visible to navigation and add the exact three labels to reviewed search keywords.

- [ ] **Step 4: Run GREEN and commit**

```powershell
pnpm test tests/data/services.test.js tests/content/public-pages.test.js tests/scripts/search-index.test.js --reporter=dot
git add src/data/services.js src/content/service-pages.js src/data/search-keywords.js tests/data/services.test.js tests/content/public-pages.test.js tests/scripts/search-index.test.js
git diff --cached --check
git commit -m "feat: publish licensed dental directions"
```

---

### Task 2: Acquire and verify official regulatory PDFs

**Files:**
- Create: `src/data/official-document-downloads.js`
- Create: `scripts/acquire-official-pdfs.mjs`
- Create: `tests/data/official-document-downloads.test.js`
- Create: `public/documents/regulations/*.pdf` only for successful official downloads
- Modify: `src/data/documents.js`
- Modify: `package.json`

**Interfaces:**
- Produces `OFFICIAL_DOCUMENT_DOWNLOADS`, frozen records with `id`, `title`, `officialHref`, `pdfCandidates`, and `localHref`.
- `scripts/acquire-official-pdfs.mjs` validates hostname, HTTP success, `application/pdf` or `%PDF` signature, minimum 10 KB size, then writes atomically.
- After acquisition, each committed record also contains exact `sha256` and `size` verified by tests.

- [ ] **Step 1: Add failing source and binary-integrity tests**

Create `tests/data/official-document-downloads.test.js`:

```js
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { OFFICIAL_DOCUMENT_DOWNLOADS } from '../../src/data/official-document-downloads.js';

describe('official regulatory PDF archive', () => {
  it('uses only government sources and exact local PDFs', () => {
    for (const item of OFFICIAL_DOCUMENT_DOWNLOADS.filter(({ localHref }) => localHref)) {
      expect(new URL(item.officialHref).hostname).toMatch(/(?:^|\.)(?:pravo\.gov\.ru|government\.ru|minzdrav\.gov\.ru)$/);
      expect(item.pdfCandidates.every((url) => new URL(url).hostname.match(/(?:^|\.)(?:pravo\.gov\.ru|government\.ru|minzdrav\.gov\.ru)$/))).toBe(true);
      const bytes = readFileSync(`public/${item.localHref}`);
      expect(bytes.subarray(0, 4).toString('ascii')).toBe('%PDF');
      expect(bytes.length).toBe(item.size);
      expect(createHash('sha256').update(bytes).digest('hex').toUpperCase()).toBe(item.sha256);
    }
  });
});
```

- [ ] **Step 2: Run RED**

```powershell
pnpm test tests/data/official-document-downloads.test.js --reporter=dot
```

Expected: FAIL because the manifest and local archive do not exist.

- [ ] **Step 3: Implement the acquisition manifest and downloader**

Use these official page and PDF candidates:

```js
const publicationPdf = (publicationId) =>
  `https://publication.pravo.gov.ru/File/GetFile/${publicationId}?type=pdf`;

export const OFFICIAL_DOCUMENT_DOWNLOADS = Object.freeze([
  { id: 'paid-services-736', publicationId: '0001202305120025', officialHref: 'https://government.ru/docs/all/147526/', pdfCandidates: [publicationPdf('0001202305120025')], localHref: 'documents/regulations/paid-services-736.pdf' },
  { id: 'paid-services-659', publicationId: '0001202606010083', officialHref: 'https://publication.pravo.gov.ru/document/0001202606010083', pdfCandidates: [publicationPdf('0001202606010083')], localHref: 'documents/regulations/paid-services-659.pdf' },
  { id: 'order-118n', publicationId: '0001202504110006', officialHref: 'https://publication.pravo.gov.ru/document/0001202504110006', pdfCandidates: [publicationPdf('0001202504110006')], localHref: 'documents/regulations/order-118n.pdf' },
  { id: 'health-law-323', publicationId: '0001201111220007', officialHref: 'https://publication.pravo.gov.ru/Document/View/0001201111220007', pdfCandidates: [publicationPdf('0001201111220007')], localHref: 'documents/regulations/health-law-323.pdf' },
  { id: 'state-guarantees-2188', publicationId: '0001202512300036', officialHref: 'https://government.ru/docs/57499/', pdfCandidates: ['https://static.government.ru/media/files/jOaAAOJdAT8F5J1VmdvrzeTkw5huazYr.pdf', publicationPdf('0001202512300036')], localHref: 'documents/regulations/state-guarantees-2188.pdf' },
  { id: 'state-guarantees-1940', publicationId: '0001202412290002', officialHref: 'https://government.ru/docs/53947/', pdfCandidates: [publicationPdf('0001202412290002')], localHref: 'documents/regulations/state-guarantees-1940.pdf' },
  { id: 'nomenclature-804n', publicationId: '0001201711080036', officialHref: 'https://publication.pravo.gov.ru/Document/View/0001201711080036', pdfCandidates: [publicationPdf('0001201711080036')], localHref: 'documents/regulations/nomenclature-804n.pdf' },
]);
```

The downloader loops candidates, uses `fetch` with a 30-second abort signal, rejects unapproved hosts, validates `%PDF`, writes to `<path>.tmp`, then renames. It never changes `documents.js`; an item is connected only after its committed binary and hash pass tests.

- [ ] **Step 4: Run acquisition and inspect every successful PDF**

```powershell
pnpm acquire:official-pdfs
Get-ChildItem public/documents/regulations/*.pdf | Get-FileHash -Algorithm SHA256
```

For each file: run `pdfinfo`, render page 1 with Poppler, inspect title/number/date, and delete any file whose content does not match the expected act. If a candidate fails, retain the official web link and omit `localHref` for that act; do not use a commercial mirror.

- [ ] **Step 5: Freeze exact hashes, run GREEN, and commit**

Update successful manifest entries with their measured `size` and uppercase `sha256`, add `"acquire:official-pdfs": "node scripts/acquire-official-pdfs.mjs"` to `package.json`, and connect those local paths in `DOCUMENT_GROUPS`.

```powershell
pnpm test tests/data/official-document-downloads.test.js tests/data/documents.test.js --reporter=dot
git add package.json scripts/acquire-official-pdfs.mjs src/data/official-document-downloads.js src/data/documents.js tests/data/official-document-downloads.test.js tests/data/documents.test.js public/documents/regulations
git diff --cached --check
git commit -m "feat: archive official clinic regulations"
```

---

### Task 3: Render reliable document actions

**Files:**
- Modify: `src/content/documents-page.js`
- Modify: `tests/content/documents-page.test.js`
- Modify: `scripts/verify-site.mjs`
- Modify: `tests/scripts/verify-site.test.js`

**Interfaces:**
- Local document item: `href` is local PDF, `officialHref` is the government page.
- Internal page item: one `Открыть` action.
- External database without a local artifact: one `Перейти к официальному ресурсу` action.

- [ ] **Step 1: Write failing action-semantics tests**

For every local regulation assert:

```js
expect(row.querySelector(`a[href="${item.href}"]`)?.textContent).toContain('Открыть PDF');
expect(row.querySelector(`a[href="${item.href}"][download]`)?.textContent).toContain('Скачать PDF');
expect(row.querySelector(`a[href="${item.officialHref}"]`)?.textContent).toContain('Официальный источник');
```

Add verifier rejection for a local `.pdf` href whose emitted file is absent or lacks a `%PDF` signature.

- [ ] **Step 2: Run RED**

```powershell
pnpm test tests/content/documents-page.test.js tests/scripts/verify-site.test.js --reporter=dot
```

Expected: FAIL because current cards have only generic `Открыть` and verifier does not inspect PDF signatures.

- [ ] **Step 3: Implement one pure action renderer**

```js
const renderDocumentActions = (item) => {
  if (item.localPdf) return [
    `<a class="button button-secondary" href="${escapeHtml(item.href)}">Открыть PDF</a>`,
    `<a class="text-link" href="${escapeHtml(item.href)}" download>Скачать PDF</a>`,
    `<a class="text-link" href="${escapeHtml(item.officialHref)}">Официальный источник</a>`,
  ].join('');
  if (item.kind === 'Страница сайта') return `<a class="button button-secondary" href="${escapeHtml(item.href)}">Открыть</a>`;
  return `<a class="button button-secondary" href="${escapeHtml(item.href)}">Перейти к официальному ресурсу</a>`;
};
```

Derive `localPdf` in `documents.js` rather than inferring it from display copy.

- [ ] **Step 4: Run GREEN and commit**

```powershell
pnpm test tests/content/documents-page.test.js tests/scripts/verify-site.test.js --reporter=dot
git add src/content/documents-page.js scripts/verify-site.mjs tests/content/documents-page.test.js tests/scripts/verify-site.test.js
git diff --cached --check
git commit -m "fix: serve reliable document actions"
```

---

### Task 4: Remove document-page gaps and polish responsive layout

**Files:**
- Modify: `src/styles/pages.css`
- Modify: `src/styles/accessibility.css`
- Modify: `tests/styles/documents-prices-staff.test.js`
- Create: `tests/styles/licensed-directions.test.js`

**Interfaces:**
- `.documents-directory` is one normal-flow column at every width.
- `.documents-group__items` owns responsive columns.
- `.licensed-directions` is a tokenized navigation surface with wrapping links.

- [ ] **Step 1: Write failing layout tests**

```js
expect(pagesCss).toMatch(/\.documents-directory\s*{[^}]*grid-template-columns:\s*minmax\(var\(--space-0\),\s*1fr\)/s);
expect(pagesCss).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*?\.documents-group__items\s*{[^}]*repeat\(2,/s);
expect(pagesCss).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.documents-group__items\s*{[^}]*repeat\(3,/s);
expect(pagesCss).not.toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*?\.documents-directory\s*{[^}]*repeat\(2,/s);
```

The direction test requires a single-column mobile list, wrapped tablet layout, visible hover/focus/active states, and a reduced-motion override.

- [ ] **Step 2: Run RED**

```powershell
pnpm test tests/styles/documents-prices-staff.test.js tests/styles/licensed-directions.test.js --reporter=dot
```

Expected: FAIL because columns currently apply to entire document groups and direction styles do not exist.

- [ ] **Step 3: Implement token-only layout**

Base:

```css
.documents-directory {
  grid-template-columns: minmax(var(--space-0), 1fr);
}

.documents-group__items {
  grid-template-columns: minmax(var(--space-0), 1fr);
}

.licensed-directions,
.licensed-directions ul {
  min-inline-size: var(--space-0);
}
```

At 48rem set two columns only on `.documents-group__items`; at 75rem set three. Keep the 200% accessibility selector on one column. Apply existing card/link tokens and no new raw color, pixel, or duration values.

- [ ] **Step 4: Run style GREEN and commit**

```powershell
pnpm test tests/styles/documents-prices-staff.test.js tests/styles/licensed-directions.test.js tests/styles/accessibility.test.js tests/styles/design-system.test.js --reporter=dot
git add src/styles/pages.css src/styles/accessibility.css tests/styles/documents-prices-staff.test.js tests/styles/licensed-directions.test.js
git diff --cached --check
git commit -m "style: remove clinic document gaps"
```

---

### Task 5: Regenerate, verify, inspect, and publish

**Files:**
- Modify through generation: all root `*.html`, `public/search-index.json`, `public/robots.txt`, `public/sitemap.xml`
- Modify: `README.md`
- Modify: `CONTENT_CHECKLIST.md`
- Create: `docs/superpowers/reports/2026-08-17-reliable-documents-directions-qa.md`

**Interfaces:**
- Generated route count remains 22.
- QA report records every successfully localized act and every act that remains an official web link.

- [ ] **Step 1: Generate twice and prove byte stability**

```powershell
$generated = @((Get-ChildItem -LiteralPath . -Filter '*.html' -File)) + @(Get-Item 'public/search-index.json','public/sitemap.xml','public/robots.txt')
pnpm generate
$before = $generated | Get-FileHash -Algorithm SHA256 | ForEach-Object { "$($_.Path)|$($_.Hash)" }
pnpm generate
$after = $generated | Get-FileHash -Algorithm SHA256 | ForEach-Object { "$($_.Path)|$($_.Hash)" }
if (Compare-Object $before $after) { throw 'Generated artifacts are not byte-stable' }
```

- [ ] **Step 2: Run the complete automated gate**

```powershell
pnpm verify
git diff --check
rg -n -i "рентгенология|стоматология общей практики|стоматология профилактическая|стоматология хирургическая" --glob '*.html' public/search-index.json
```

Expected: `pnpm verify` passes 22 pages; prohibited-direction scan has zero matches.

- [ ] **Step 3: Run production Browser QA**

Start `pnpm preview --host 127.0.0.1 --port 4176` and verify:

- `documents.html` at 320 and 1280: no blank column gaps, groups preserve order, local PDF and official-source actions are visible, overflow 0;
- `services.html` at 320 and 1280: exactly three direction links, all anchors land below the sticky header, tabs/disclosures still work;
- 200% mode on both routes at 320 and 1280: overflow 0 and no clipped controls;
- every committed local regulation opens as a PDF from the local origin;
- keyboard focus, reduced-motion source rule, console errors 0, external runtime resources 0 before MIS consent.

- [ ] **Step 4: Document exact evidence and commit**

Record commands, test counts, Browser matrix, PDF filenames/hashes/pages/sources, failures left as external links, and the three-direction license boundary.

```powershell
git add README.md CONTENT_CHECKLIST.md docs/superpowers/reports/2026-08-17-reliable-documents-directions-qa.md *.html public/search-index.json public/robots.txt public/sitemap.xml
git diff --cached --check
git commit -m "docs: verify reliable clinic documents"
pnpm verify
git status --short
```

- [ ] **Step 5: Push without force**

```powershell
git push origin HEAD:main
```

Expected: `origin/main` advances to the final verified commit.

---

## Plan Self-Review

- **Spec coverage:** The plan covers the three-direction boundary, group-level gap removal, local official PDFs with source fallbacks, action semantics, search, 200% reflow, QA, documentation, and push.
- **Source safety:** No commercial mirror or generated replacement PDF is allowed. Failed official acquisition keeps an honest official web link.
- **Type consistency:** `LICENSED_DIRECTIONS`, `OFFICIAL_DOCUMENT_DOWNLOADS`, `localHref`, `officialHref`, `localPdf`, and the document IDs remain stable across data, renderer, verifier, and tests.
- **Route consistency:** No new route is created; the site remains at 22 pages.
- **No placeholders:** Every conditional outcome is defined: verified official PDF becomes local; unavailable official PDF remains an explicit government web link.
