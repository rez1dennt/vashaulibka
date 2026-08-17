# Local Regulatory PDFs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish eight supplied Russian regulatory acts as verified local PDF files with direct open, download, and official-source actions.

**Architecture:** A reproducible PowerShell preparation script verifies the eight source hashes, converts five RTF files through Microsoft Word, copies the small source PDF byte-for-byte, and invokes a focused Python/Pillow optimizer for the two scanned PDFs that exceed GitHub's normal file limit. The preparation pipeline writes an integrity manifest; website data then points each regulatory card to a local artifact while retaining its official page as a fallback.

**Tech Stack:** PowerShell 7, Microsoft Word COM, bundled Python with Pillow and pypdf, Vite 8, vanilla HTML/CSS/JavaScript, Vitest/JSDOM, Poppler rendering, in-app Browser QA.

## Global Constraints

- Publish exactly eight supplied regulatory documents under `public/documents/regulations/`.
- Never rewrite, summarize, reorder, or omit pages of a regulatory act.
- Preserve 698 pages for № 1940, 872 pages for № 2188, and 18 pages for № 659.
- Keep each Git-tracked PDF below 95,000,000 bytes; stop instead of degrading unreadable text.
- Keep the existing official URL as a secondary fallback for every regulation.
- Add no runtime dependency, tracker, external font, form, or automatic third-party request.
- Preserve keyboard focus, 320 px reflow, 200% accessibility mode, reduced motion, and consent-gated MIS behavior.
- Use strict TDD for code and behavior changes; generated PDF artifacts are validated structurally and visually.
- Push to `origin/main` without force only after a fresh full gate.

---

### Task 1: Define the eight-file integrity contract

**Files:**
- Create: `src/data/regulatory-documents.js`
- Create: `tests/data/regulatory-documents.test.js`

**Interfaces:**
- Produces `REGULATORY_DOCUMENTS: ReadonlyArray<{ id, title, href, officialHref, sourceName, sourceSha256, expectedPages }>`.
- The preparation script consumes `sourceName`, `sourceSha256`, `href`, and `expectedPages`.
- Website document records consume `id`, `href`, and `officialHref`.

- [ ] **Step 1: Write the failing manifest test**

Create `tests/data/regulatory-documents.test.js` with assertions for this exact ID/path mapping:

```js
const expected = {
  'nomenclature-804n': 'documents/regulations/nomenclature-804n.pdf',
  'medicines-890': 'documents/regulations/medicines-890.pdf',
  'state-guarantees-1940': 'documents/regulations/state-guarantees-1940.pdf',
  'state-guarantees-2188': 'documents/regulations/state-guarantees-2188.pdf',
  'health-law-323': 'documents/regulations/health-law-323.pdf',
  'order-118n': 'documents/regulations/order-118n.pdf',
  'paid-services-659': 'documents/regulations/paid-services-659.pdf',
  'paid-services-736': 'documents/regulations/paid-services-736.pdf',
};

expect(Object.fromEntries(REGULATORY_DOCUMENTS.map(({ id, href }) => [id, href]))).toEqual(expected);
expect(REGULATORY_DOCUMENTS).toHaveLength(8);
expect(Object.isFrozen(REGULATORY_DOCUMENTS)).toBe(true);
expect(REGULATORY_DOCUMENTS.every(Object.isFrozen)).toBe(true);
```

Also assert the exact source SHA-256 values recorded from the supplied files:

```js
expect(Object.fromEntries(REGULATORY_DOCUMENTS.map(({ id, sourceSha256 }) => [id, sourceSha256]))).toEqual({
  'nomenclature-804n': 'EF7C95DA20A8F2D0736205CCAFF44C3028A6A5F9280211229F3073E6B8C76DC0',
  'medicines-890': '24F3789D214B9397D9A66C152540B6D13AFAE4EC76DB0E29FB3D0A2CD4B5DCFB',
  'state-guarantees-1940': '00E1C58C48EF8E7602D391B9AE9AD2A81F2FCB7B454A9D519BB9AA87155140D6',
  'state-guarantees-2188': '2CAAFA72E4481F373222949F7F533668A5CAC5C78A1DC72F925F414CB42FC45C',
  'health-law-323': '43B167C46061DC694905250E983629EB9EADACE73C57B0AB749ED94BA3450ABA',
  'order-118n': '846A50A67AEB674986E5046EFB66B56413EAE6D6E69ACCC58CC272C4CA264758',
  'paid-services-659': '7AF320A12723F96F934DFCD231E3971D80560ADEEB385DB058255FB1712497C2',
  'paid-services-736': 'D4A3F220449370FC3969C9855A9822EB247B8F7C4E9171951C6C6A1390FB4816',
});
```

- [ ] **Step 2: Run RED**

Run:

```powershell
pnpm test tests/data/regulatory-documents.test.js --reporter=dot
```

Expected: FAIL because `src/data/regulatory-documents.js` does not exist.

- [ ] **Step 3: Implement the frozen source manifest**

Create `src/data/regulatory-documents.js` with the exact eight records from the approved design. Use `Object.freeze` for the array and each record. Set `expectedPages` to `698`, `872`, and `18` for the three supplied PDFs; set it to `null` for RTF conversions until the preparation script produces the measured page counts. Use the existing URLs from `OFFICIAL_DOCUMENT_URLS` as `officialHref`.

- [ ] **Step 4: Run GREEN and commit**

```powershell
pnpm test tests/data/regulatory-documents.test.js --reporter=dot
git add src/data/regulatory-documents.js tests/data/regulatory-documents.test.js
git diff --cached --check
git commit -m "test: define regulatory PDF contract"
```

---

### Task 2: Build a reproducible conversion and optimization pipeline

**Files:**
- Create: `scripts/prepare-regulatory-documents.ps1`
- Create: `scripts/optimize-scanned-regulation.py`
- Create: `tests/scripts/regulatory-document-tools.test.js`
- Create: `public/documents/regulations/*.pdf`
- Create: `public/documents/regulations/integrity.json`
- Modify: `package.json`

**Interfaces:**
- `pnpm prepare:regulations` invokes PowerShell with the user-supplied Downloads directory.
- `optimize-scanned-regulation.py INPUT OUTPUT EXPECTED_PAGES` preserves page count and targets `< 95000000` bytes.
- `integrity.json` contains `{ version: 1, items: [{ id, href, size, sha256, pages }] }`.

- [ ] **Step 1: Mark the PDF operation and write failing tool tests**

Before the first authoring command run exactly once:

```powershell
& 'C:\Users\bahti\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'C:\Users\bahti\.codex\plugins\cache\openai-primary-runtime\pdf\26.813.12317\skills\pdf\container_tools\mark_artifact_operation_started.mjs' --operation-kind create --expected-output-count 8 --output-format pdf
```

Create `tests/scripts/regulatory-document-tools.test.js`. Assert that the PowerShell script contains all eight exact source hashes, Word export format `17`, read-only opening, temporary output followed by atomic move, and a hard 95,000,000-byte limit. Assert that the Python optimizer checks source and output page counts and rejects a mismatched count.

- [ ] **Step 2: Run RED**

```powershell
pnpm test tests/scripts/regulatory-document-tools.test.js --reporter=dot
```

Expected: FAIL because both preparation scripts and the package command are absent.

- [ ] **Step 3: Implement RTF conversion and exact-copy behavior**

In `scripts/prepare-regulatory-documents.ps1`:

1. Resolve all eight source paths under `C:\Users\bahti\Downloads` with `-LiteralPath`.
2. Verify each source SHA-256 before opening it.
3. Start hidden Microsoft Word COM with `Visible = $false` and `DisplayAlerts = 0`.
4. Open each RTF with `ReadOnly = $true` and `AddToRecentFiles = $false`.
5. Call `ExportAsFixedFormat($temporaryPath, 17)` and always close the document in `finally`.
6. Copy `0001202606010083.pdf` byte-for-byte through a temporary path.
7. Invoke the Python optimizer for `0001202412290002.pdf` and `0001202512300036.pdf`.
8. Move each validated temporary file atomically to `public/documents/regulations/`.
9. Quit Word and release COM objects in `finally`.

Add to `package.json`:

```json
"prepare:regulations": "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/prepare-regulatory-documents.ps1"
```

- [ ] **Step 4: Implement page-preserving scanned-PDF optimization**

In `scripts/optimize-scanned-regulation.py`:

- open the source with `pypdf.PdfReader` and require the exact expected page count;
- require exactly one full-page image per page;
- keep page 1 in RGB and encode it as optimized JPEG quality 78;
- convert remaining pages with `ImageOps.grayscale`, `ImageOps.autocontrast`, and a fixed black/white threshold of 190, then save each as a one-page PDF at 300 DPI;
- clone each temporary one-page PDF into one `PdfWriter` in original order;
- write to `<output>.tmp`, reopen it, require the same page count, `%PDF`, nonzero media boxes, and size below 95,000,000 bytes, then rename atomically;
- if validation fails, remove only the temporary output and return nonzero.

- [ ] **Step 5: Run tool GREEN, prepare artifacts, and inspect structure**

```powershell
pnpm test tests/scripts/regulatory-document-tools.test.js --reporter=dot
pnpm prepare:regulations
Get-ChildItem public/documents/regulations/*.pdf | Select-Object Name,Length
Get-FileHash public/documents/regulations/*.pdf -Algorithm SHA256
```

Expected: eight `%PDF` files; both optimized files below 95,000,000 bytes; integrity manifest contains eight matching records.

- [ ] **Step 6: Render and inspect every first and last page**

Render first and last pages of all eight PDFs into `tmp/pdfs/regulations-qa/` with the bundled Poppler executable. Inspect all 16 PNGs at original detail. Reject and regenerate if any title, number, date, page edge, glyph, signature block, or table is clipped or unreadable.

- [ ] **Step 7: Commit the pipeline and artifacts**

```powershell
git add package.json scripts/prepare-regulatory-documents.ps1 scripts/optimize-scanned-regulation.py tests/scripts/regulatory-document-tools.test.js public/documents/regulations
git diff --cached --check
git commit -m "feat: prepare local regulatory PDFs"
```

---

### Task 3: Connect local artifacts to document cards

**Files:**
- Modify: `src/data/documents.js`
- Modify: `src/content/documents-page.js`
- Modify: `tests/data/documents.test.js`
- Modify: `tests/content/documents-page.test.js`

**Interfaces:**
- Each regulatory `DOCUMENT_GROUPS` item receives local `href`, existing `officialHref`, and `localPdf: true`.
- `renderDocumentActions(item)` renders a third official-source action only when `officialHref` exists.

- [ ] **Step 1: Write failing card-action tests**

For each of the eight regulation IDs assert:

```js
expect(item).toMatchObject({
  href: expectedLocalHref,
  officialHref: expect.stringMatching(/^https:\/\//),
  localPdf: true,
});
expect(row.querySelector(`a[href="${expectedLocalHref}"]`)?.textContent).toContain('Открыть PDF');
expect(row.querySelector(`a[href="${expectedLocalHref}"][download]`)?.textContent).toContain('Скачать PDF');
expect(row.querySelector(`a[href="${item.officialHref}"]`)?.textContent).toContain('Официальный источник');
expect(row.querySelector(`a[href="${item.officialHref}"]`)?.getAttribute('rel')).toBe('noopener');
```

- [ ] **Step 2: Run RED**

```powershell
pnpm test tests/data/documents.test.js tests/content/documents-page.test.js --reporter=dot
```

Expected: FAIL because regulation cards still use external URLs as primary actions and local cards omit the official fallback.

- [ ] **Step 3: Implement data mapping and action rendering**

Import `REGULATORY_DOCUMENTS` into `documents.js`, map by `id`, and apply its `href`/`officialHref` to the matching eight items. Update the local-PDF branch in `renderDocumentActions`:

```js
const officialAction = item.officialHref
  ? `<a class="text-link" href="${escapeHtml(item.officialHref)}" target="_blank" rel="noopener">Официальный источник</a>`
  : '';
return `<a class="button button-secondary" href="${escapeHtml(item.href)}">Открыть PDF</a>
  <a class="text-link" href="${escapeHtml(item.href)}" download>Скачать PDF</a>
  ${officialAction}`;
```

- [ ] **Step 4: Run GREEN and commit**

```powershell
pnpm test tests/data/documents.test.js tests/content/documents-page.test.js tests/content/legal-pages.test.js --reporter=dot
git add src/data/documents.js src/content/documents-page.js tests/data/documents.test.js tests/content/documents-page.test.js
git diff --cached --check
git commit -m "feat: open regulations as local PDFs"
```

---

### Task 4: Enforce artifact integrity in automated verification

**Files:**
- Modify: `tests/data/regulatory-documents.test.js`
- Modify: `scripts/verify-site.mjs`
- Modify: `tests/scripts/site-verifier.test.js`

**Interfaces:**
- Integrity tests compare `integrity.json` to actual `size`, uppercase SHA-256, `%PDF`, and the eight declared paths.
- Site verifier continues to reject a missing or non-PDF local link and rejects an integrity entry whose artifact is absent.

- [ ] **Step 1: Write failing integrity regressions**

Extend `regulatory-documents.test.js` to read `public/documents/regulations/integrity.json`, require eight unique records, and compare every record to the actual file. Add a verifier fixture with an integrity record pointing to a missing PDF and require `documents.integrity.missing`.

- [ ] **Step 2: Run RED**

```powershell
pnpm test tests/data/regulatory-documents.test.js tests/scripts/site-verifier.test.js --reporter=dot
```

Expected: the new missing-integrity fixture fails because the verifier does not inspect `documents/regulations/integrity.json`.

- [ ] **Step 3: Implement verifier support**

When `documents/regulations/integrity.json` exists, parse it, require `{ version: 1, items: [...] }`, reject duplicate paths, resolve each path inside the build root, require a file, compare size and SHA-256, and reuse the `%PDF` signature check. Emit codes `documents.integrity.parse`, `documents.integrity.schema`, `documents.integrity.missing`, and `documents.integrity.mismatch`.

- [ ] **Step 4: Run GREEN and commit**

```powershell
pnpm test tests/data/regulatory-documents.test.js tests/scripts/site-verifier.test.js --reporter=dot
git add tests/data/regulatory-documents.test.js scripts/verify-site.mjs tests/scripts/site-verifier.test.js
git diff --cached --check
git commit -m "test: verify regulatory PDF integrity"
```

---

### Task 5: Regenerate, visually verify, document, and publish

**Files:**
- Modify through generation: `documents.html`, `standards.html`, `public/search-index.json`
- Modify: `README.md`
- Modify: `CONTENT_CHECKLIST.md`
- Create: `docs/superpowers/reports/2026-08-17-local-regulatory-pdfs-qa.md`

**Interfaces:**
- Generated route count remains 22.
- QA report records source hash, output hash, size, page count, conversion type, and first/last-page inspection for all eight items.

- [ ] **Step 1: Prove deterministic generation**

Run `pnpm generate`, hash generated HTML/SEO/search artifacts, run `pnpm generate` again, and require identical hashes.

- [ ] **Step 2: Run the complete automated gate**

```powershell
pnpm verify
git diff --check
```

Expected: all tests pass, Vite builds 22 pages, site verifier accepts all eight local PDFs and integrity entries.

- [ ] **Step 3: Run production Browser QA**

At 320 and 1280 px verify `documents.html` has overflow 0, clipped controls 0, and eight regulation cards with visible direct-open, download, and official-source actions. Open every local regulation and confirm the response begins as a PDF from the local preview origin. At 200% text scale verify actions wrap without overlap. Confirm console errors 0 and no new remote active resources.

- [ ] **Step 4: Write release evidence and remove QA intermediates**

Document all eight source/output hashes, exact pages, final sizes, rendered-page inspection, Browser matrix, and any conversion limitations in `docs/superpowers/reports/2026-08-17-local-regulatory-pdfs-qa.md`. Remove only `tmp/pdfs/regulations-qa/` after its evidence is recorded.

- [ ] **Step 5: Commit generated output and documentation**

```powershell
git add README.md CONTENT_CHECKLIST.md docs/superpowers/reports/2026-08-17-local-regulatory-pdfs-qa.md documents.html standards.html public/search-index.json
git diff --cached --check
git commit -m "docs: verify local regulatory PDFs"
pnpm verify
git status --short
```

- [ ] **Step 6: Push without force**

```powershell
git push origin HEAD:main
```

Expected: `origin/main` advances to the final verified commit and local `HEAD` equals `origin/main`.

---

## Plan Self-Review

- **Spec coverage:** All eight mappings, five RTF conversions, three supplied PDFs, two GitHub-size optimizations, three card actions, integrity enforcement, 320/1280/200% QA, documentation, and push are covered.
- **Source safety:** Exact source hashes are hard-coded before conversion. A mismatch stops the pipeline. No commercial mirror or network download is used.
- **Artifact safety:** Every output is temporary until signature, page count, size, and reopen checks pass. Large documents stop rather than ship unreadable output.
- **Type consistency:** IDs and paths are identical in `REGULATORY_DOCUMENTS`, `DOCUMENT_GROUPS`, `integrity.json`, tests, and QA reporting.
- **No placeholders:** Every conditional outcome is defined; measured output hashes and sizes are generated into `integrity.json` by the preparation pipeline rather than left as manual blanks.
