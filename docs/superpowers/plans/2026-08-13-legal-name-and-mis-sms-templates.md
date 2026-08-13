# Legal Name and MIS SMS Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unsupported graphic identity with the clinic's official short legal name and add an exact, test-protected source of truth for the two MegaFon-approved MIS SMS templates.

**Architecture:** Shared site chrome continues to render all 21 pages from central clinic data, but its brand link becomes text-only. SMS templates live in a frozen data module with an exact-match validator; an operations document explains the provider-side configuration that the static site cannot perform.

**Tech Stack:** Vanilla JavaScript, generated HTML, CSS custom properties, Vitest/JSDOM, Vite.

## Global Constraints

- Public identity: only `ООО «Стоматология Ваша улыбка»` or the full registered legal name in legal contexts.
- Do not expose the SMS templates in public page content.
- Do not claim that the website sends SMS or can guarantee provider billing.
- The two approved strings must not be normalized or edited.
- Follow RED → GREEN TDD for every production change.

---

### Task 1: Text-only legal identity

**Files:**
- Modify: `tests/templates/site-chrome.test.js`
- Modify: `tests/styles/home-redesign.test.js`
- Modify: `tests/styles/accessibility.test.js`
- Modify: `tests/assets/assets.test.js`
- Modify: `src/data/clinic.js`
- Modify: `src/templates/site-chrome.js`
- Modify: `src/templates/render-page.js`
- Modify: `src/content/home-page.js`
- Modify: `src/styles/layout.css`
- Modify: `src/styles/accessibility.css`
- Delete: `public/assets/icons/logo.svg`
- Delete: `public/assets/icons/favicon.svg`

**Interfaces:**
- Consumes: `CLINIC.shortLegalName`.
- Produces: `.brand__legal-name` text link and official clinic name in metadata.

- [ ] Write failing tests asserting the official name and absence of image/decorative logo markup and assets.
- [ ] Run `pnpm test tests/templates/site-chrome.test.js tests/styles/home-redesign.test.js tests/styles/accessibility.test.js tests/assets/assets.test.js` and confirm failures describe the old logo.
- [ ] Replace the shared brand markup and styles, update central display name and homepage heading, remove the favicon reference and obsolete assets.
- [ ] Re-run the focused command and confirm all focused tests pass.

### Task 2: Immutable approved SMS templates

**Files:**
- Create: `tests/data/mis-sms-templates.test.js`
- Create: `src/data/mis-sms-templates.js`
- Create: `docs/operations/mis-sms-templates.md`
- Modify: `CONTENT_CHECKLIST.md`
- Modify: `README.md`

**Interfaces:**
- Produces: `MIS_SMS_TEMPLATES`, `isApprovedMisSmsTemplate(text)`.
- `isApprovedMisSmsTemplate` returns `true` only for exact equality with one of the two approved strings.

- [ ] Write a failing test with the two exact messages and rejection cases for changed punctuation, spaces, variables, and appended copy.
- [ ] Run `pnpm test tests/data/mis-sms-templates.test.js` and confirm it fails because the data module does not exist.
- [ ] Add the frozen template records and exact-match validator.
- [ ] Add copy-ready provider instructions, ordinary-tariff warning, and prelaunch confirmation items.
- [ ] Re-run `pnpm test tests/data/mis-sms-templates.test.js` and confirm it passes.

### Task 3: Generate, verify, and publish

**Files:**
- Regenerate: all 21 root HTML entry files.

- [ ] Run `pnpm generate` twice and confirm the second run produces no diff.
- [ ] Run `pnpm verify` and confirm all tests, build, and the 21-page verifier pass.
- [ ] Search generated output for `logo.svg`, `favicon.svg`, and standalone decorative wordmark markup; expect zero matches.
- [ ] Run `git diff --check`, review the scoped diff, commit, and push the current branch to `origin/main` as previously authorized by the user.
