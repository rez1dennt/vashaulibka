# Payment Page Price List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the obsolete unpublished-price placeholder on `payment.html` with the clinic's approved local price list and clear access actions.

**Architecture:** Keep `PRICE_LIST` in `src/data/documents.js` as the single source of truth. Render the payment-page document card from that object in `src/content/legal-pages.js`, then regenerate committed HTML and the search index.

**Tech Stack:** JavaScript ES modules, semantic HTML, existing CSS component classes, Vitest, JSDOM, Vite.

## Global Constraints

- Preserve the confirmed cash and cashless payment wording.
- Use `documents/price-list-2026-05-05.pdf`; do not add a second PDF copy.
- Publish the approval date as 5 May 2026 and the document length as 19 pages.
- Include local open/download actions and a link to `prices.html`.
- Reuse all three clinic-supplied notices from `PRICE_LIST.notices`.
- Do not embed a PDF viewer or duplicate the full price table in HTML.

---

### Task 1: Publish the approved price list on the payment page

**Files:**
- Modify: `tests/content/legal-pages.test.js`
- Modify: `src/content/legal-pages.js`
- Modify: `payment.html`
- Modify: `public/search-index.json`

**Interfaces:**
- Consumes: `PRICE_LIST` from `src/data/documents.js`, with `title`, `approvedLabel`, `pageCount`, `href`, and `notices`.
- Produces: semantic payment-page markup with local PDF open/download actions and `prices.html` navigation.

- [ ] **Step 1: Write the failing payment-page regression test**

Add assertions in the existing exact-payment-boundaries test:

```js
const paymentDocument = pageDocument('payment.html');
const payment = normalizedText(paymentDocument);

expect(payment).toContain(PRICE_LIST.title);
expect(payment).toContain(`Утверждён ${PRICE_LIST.approvedLabel}`);
expect(payment).toContain(`${PRICE_LIST.pageCount} страниц`);
expect(paymentDocument.querySelector(`a[href="${PRICE_LIST.href}"]`)).not.toBeNull();
expect(paymentDocument.querySelector(`a[href="${PRICE_LIST.href}"][download]`)).not.toBeNull();
expect(paymentDocument.querySelector('a[href="prices.html"]')).not.toBeNull();
for (const notice of PRICE_LIST.notices) expect(payment).toContain(notice);
expect(payment).not.toMatch(/прейскурант.*пока не опубликован/i);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
pnpm test tests/content/legal-pages.test.js --reporter=dot
```

Expected: FAIL because `payment.html` still says that the price list has not been published and has no price-list document actions.

- [ ] **Step 3: Render the approved price-list card from centralized data**

Import `PRICE_LIST` into `src/content/legal-pages.js` and replace the obsolete payment body with markup equivalent to:

```js
body: `<section class="section"><div class="container">${patientNotice(
  'Способы оплаты',
  '<p>Оплата платных медицинских услуг осуществляется наличным и безналичным расчётом по выбору потребителя.</p>',
  'ruble',
)}<article class="price-source price-source__card card"><div class="price-source__copy"><p class="eyebrow">Утверждённый документ</p><h2>${escapeHtml(PRICE_LIST.title)}</h2><p class="price-source__meta">Утверждён ${escapeHtml(PRICE_LIST.approvedLabel)} · ${escapeHtml(PRICE_LIST.pageCount)} страниц</p><div class="price-source__actions"><a class="button button-primary" href="${escapeHtml(PRICE_LIST.href)}">Открыть PDF</a><a class="button button-secondary" href="${escapeHtml(PRICE_LIST.href)}" download>Скачать PDF</a><a class="button button-secondary" href="prices.html">Посмотреть цены</a></div></div><div class="price-source__notices">${PRICE_LIST.notices.map((notice) => `<p class="price-source__notice">${escapeHtml(notice)}</p>`).join('')}</div></article></div></section>`,
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```powershell
pnpm test tests/content/legal-pages.test.js --reporter=dot
```

Expected: the focused legal-page test file passes.

- [ ] **Step 5: Regenerate and verify the complete site**

Run:

```powershell
pnpm generate
pnpm verify
git diff --check
```

Expected: generated `payment.html` and `public/search-index.json` contain the approved price information; all tests, the Vite build, the 22-page verifier, and whitespace checks pass.

- [ ] **Step 6: Verify responsive and link behavior**

Open `payment.html` from the production preview at 320 px and 1280 px. Confirm no horizontal overflow, all three actions are visible and keyboard-focusable, and both PDF actions resolve to the existing local file.

- [ ] **Step 7: Commit and push**

```powershell
git add -- tests/content/legal-pages.test.js src/content/legal-pages.js payment.html public/search-index.json docs/superpowers/plans/2026-08-17-payment-page-price-list.md
git commit -m "fix: publish price list on payment page"
git push origin HEAD:main
```
