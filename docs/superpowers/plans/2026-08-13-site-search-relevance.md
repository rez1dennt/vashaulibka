# Site Search Relevance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the clinic's local search so Russian inflections, patient phrasing, safe typos, and multi-word intents return accurate published pages without inventing services.

**Architecture:** Keep `searchItems()` as the pure ranking boundary, add a small pure query-language module for Russian stop words and reviewed intent aliases, and keep reviewed clinic terms in `src/data/search-keywords.js`. The UI continues to render the existing anchored combobox dropdown and receives only ranked, safe index items.

**Tech Stack:** Node.js ESM, vanilla JavaScript, generated JSON search index, Vitest 4 with jsdom, Vite 8.

## Global Constraints

- No remote search service, analytics, tracker, or runtime dependency.
- Never infer an unpublished service, price, clinician fact, or medical promise.
- Preserve the existing dropdown, keyboard model, live status region, progressive enhancement, and same-origin links.
- Generated `public/search-index.json` must be reproducible from source.

---

### Task 1: Russian query language

**Files:**
- Create: `src/js/core/search-language.js`
- Modify: `src/data/search-keywords.js`
- Test: `tests/js/search-language.test.js`
- Test: `tests/scripts/search-index.test.js`

**Interfaces:**
- Produces: `analyzeSearchQuery(query)` returning normalized phrase, meaningful tokens, and expanded reviewed variants.
- Produces: reviewed keywords attached to existing page/service entries by the index generator.

- [ ] **Step 1: Write failing tests for stop words, inflections, colloquial intents, and confirmed service boundaries**

```js
expect(analyzeSearchQuery('как можно оплатить')).toMatchObject({ tokens: ['оплатить'] });
expect(analyzeSearchQuery('врачи клиники').variants).toContain('врач');
expect(searchItems(build().items, 'удалить зуб')).toEqual([]);
```

- [ ] **Step 2: Run RED tests**

Run: `pnpm test tests/js/search-language.test.js tests/scripts/search-index.test.js`

Expected: failures because the query-language module and reviewed variants do not exist.

- [ ] **Step 3: Implement pure normalization and reviewed aliases**

The module must remove only Russian conversational stop words, reduce reviewed word families to canonical forms, preserve numbers/abbreviations, and return deterministic de-duplicated variants.

- [ ] **Step 4: Run focused GREEN tests**

Run: `pnpm test tests/js/search-language.test.js tests/scripts/search-index.test.js`

Expected: all focused tests pass.

### Task 2: Relevance and safe partial coverage

**Files:**
- Modify: `src/js/core/search-engine.js`
- Test: `tests/js/search-engine.test.js`
- Test: `tests/scripts/search-index.test.js`

**Interfaces:**
- Consumes: `analyzeSearchQuery(query)`.
- Produces: existing `searchItems(items, query, { limit })` match objects with accurate ordering and highlight terms.

- [ ] **Step 1: Write failing ranking tests**

```js
expect(searchItems(index, 'как оплатить')[0].item.href).toBe('payment.html');
expect(searchItems(index, 'цена лечения')[0].item.href).toBe('prices.html');
expect(searchItems(index, 'детский стоматолог')).toEqual([]);
expect(searchItems(index, 'кариез')[0].item.href).toBe('services.html#service-therapy');
```

- [ ] **Step 2: Run RED tests**

Run: `pnpm test tests/js/search-engine.test.js tests/scripts/search-index.test.js`

Expected: patient phrasing and safe partial-coverage expectations fail on the current literal matcher.

- [ ] **Step 3: Implement weighted coverage**

Exact phrases and titles stay strongest. Reviewed aliases and literal keywords outrank summaries/content. Multi-token queries may return partial matches only when a result covers a meaningful token, with coverage ratio and item specificity used as penalties/tie-breakers. Fuzzy matching remains limited to long title/keyword tokens.

- [ ] **Step 4: Run focused GREEN tests**

Run: `pnpm test tests/js/search-engine.test.js tests/scripts/search-index.test.js`

Expected: all ranking and safety tests pass.

### Task 3: Helpful, accessible result feedback

**Files:**
- Modify: `src/js/components/site-search.js`
- Modify: `src/templates/site-search.js`
- Modify: `src/styles/site-search.css`
- Test: `tests/js/site-search.test.js`
- Test: `tests/templates/site-search.test.js`
- Test: `tests/styles/site-search.test.js`

**Interfaces:**
- Consumes: ranked matches from `searchItems()`.
- Preserves: existing combobox/listbox IDs, ARIA state, keyboard behavior, and quick links.

- [ ] **Step 1: Write failing tests for Russian count grammar and no-result recovery links**

```js
expect(status.textContent).toBe('Найден 1 результат');
expect(status.textContent).toBe('Найдено 2 результата');
expect(emptyLinks.map((link) => link.href)).toEqual(expect.arrayContaining(['services.html', 'prices.html', 'contacts.html']));
```

- [ ] **Step 2: Run RED tests**

Run: `pnpm test tests/js/site-search.test.js tests/templates/site-search.test.js tests/styles/site-search.test.js`

Expected: count grammar and no-result recovery UI tests fail.

- [ ] **Step 3: Implement feedback without layout jumps**

Render a compact empty-state block only when a completed query has zero results, keep results content-sized, retain reduced-motion behavior, and use the existing design tokens and focus styles.

- [ ] **Step 4: Run focused GREEN tests**

Run: `pnpm test tests/js/site-search.test.js tests/templates/site-search.test.js tests/styles/site-search.test.js`

Expected: all focused interaction/template/style tests pass.

### Task 4: Generated index, browser QA, and release

**Files:**
- Modify: `public/search-index.json` (generated)
- Modify: generated root HTML only through `pnpm generate`

**Interfaces:**
- Consumes: all source changes.
- Produces: reproducible production artifacts and verified local search behavior.

- [ ] **Step 1: Generate twice and prove stability**

Run: `pnpm generate && git diff --exit-code -- public/search-index.json '*.html'` after the second generation.

Expected: second generation produces no additional diff.

- [ ] **Step 2: Run the complete gate**

Run: `pnpm verify`

Expected: all tests, Vite build, and the 21-page site verifier pass with no errors.

- [ ] **Step 3: Run browser QA**

At 320px and 1280px, verify the approved queries, dropdown height, keyboard navigation, no horizontal overflow, correct same-origin navigation, no console errors, and no remote search requests.

- [ ] **Step 4: Commit and push**

```bash
git add docs/superpowers/specs/2026-08-13-site-search-relevance-design.md docs/superpowers/plans/2026-08-13-site-search-relevance.md src tests public/search-index.json *.html
git commit -m "feat: improve clinic site search relevance"
git push origin HEAD:main
```
