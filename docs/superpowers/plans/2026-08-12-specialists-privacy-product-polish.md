# Specialists and Privacy Product Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the specialists coverflow and replace the provisional privacy copy with a structured, truthful personal-data policy for the current phone-only website.

**Architecture:** Keep the existing static page manifest and vanilla CSS/JS architecture. Change the specialists renderer contract so visible technical hints disappear while the screen-reader instruction remains, then express the wider stage and compact top-right controls entirely through existing semantic tokens. Extract the privacy body into a focused renderer inside the legal content module, sourcing every operator value from `CLINIC` and `CONTACTS` and describing only the current non-MIS behavior.

**Tech Stack:** Node.js, Vite, vanilla JavaScript, semantic CSS custom properties, Vitest, JSDOM.

## Global Constraints

- MИС is not connected and must not be described as connected.
- The website has no form, input field, or website-side appointment-data collection.
- Appointment actions remain official `tel:` links enhanced by the existing phone dialog.
- Publish only confirmed clinic, staff, and contact facts.
- Preserve cyclic controls, swipe, keyboard support, focus states, progressive enhancement, and reduced motion.
- Use the existing shared token theme and no external dependencies.

---

### Task 1: Specialists coverflow product polish

**Files:**
- Modify: `src/content/specialists-page.js`
- Modify: `src/js/components/specialists-coverflow.js`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/pages.css`
- Modify: `tests/content/specialists-page.test.js`
- Modify: `tests/js/specialists-coverflow.test.js`
- Modify: `tests/styles/specialists-coverflow.test.js`

**Interfaces:**
- Consumes: `STAFF`, existing `data-specialist-*` selectors, semantic tokens.
- Produces: a counter-free wide coverflow with `.specialists-coverflow__toolbar`, two accessible arrow buttons, a hidden screen-reader instruction, and unchanged `initSpecialistsCoverflow()` behavior.

- [ ] **Step 1: Write failing content and style tests**

Assert that rendered content has no `[data-specialist-counter]`, no `.specialists-coverflow__gesture`, no visible “Выберите карточку” copy, exactly two controls inside `.specialists-coverflow__toolbar`, and that CSS positions the toolbar at the stage top-end with a wider desktop card/offset contract.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `pnpm test tests/content/specialists-page.test.js tests/styles/specialists-coverflow.test.js tests/js/specialists-coverflow.test.js`

Expected: failures for the existing counter, gesture copy, heading copy, toolbar structure, and style placement.

- [ ] **Step 3: Implement the minimal markup, JS, token, and CSS changes**

Remove the visual counter and gesture nodes, remove counter writes from `initSpecialistsCoverflow()`, introduce the toolbar wrapper, center the heading shell, widen the stage through coverflow tokens, and place controls at the top-end without overlapping cards at 320px.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `pnpm test tests/content/specialists-page.test.js tests/styles/specialists-coverflow.test.js tests/js/specialists-coverflow.test.js`

Expected: all focused tests pass.

### Task 2: Structured privacy policy

**Files:**
- Modify: `src/content/legal-pages.js`
- Modify: `src/styles/pages.css`
- Modify: `tests/content/legal-pages.test.js`

**Interfaces:**
- Consumes: `CLINIC`, `CONTACTS`, the existing patient page layout, `escapeHtml()`.
- Produces: `.privacy-policy` with an operator summary, anchor navigation, 12 numbered sections, active `mailto:`/`tel:` links, a current-version date, and no unsupported MIS/hosting claims.

- [ ] **Step 1: Write a failing privacy contract test**

Assert exact operator identifiers and contact values, the 12 required section headings, usable anchor links, mention of possible infrastructure request metadata, the current absence of forms and MIS, and absence of developer-facing copy such as “требуется завершить”, “будут уточнены” or a claim that hosting facts are known.

- [ ] **Step 2: Run focused test and verify RED**

Run: `pnpm test tests/content/legal-pages.test.js`

Expected: the current four-paragraph privacy body does not satisfy the structured policy contract.

- [ ] **Step 3: Implement the policy renderer and responsive editorial styles**

Build the policy from data-derived strings and semantic sections. Use a two-column summary/contents layout on wide screens, one column on mobile, comfortable prose measure, numbered section markers, active contacts, and a specific boundary note for future MIS activation.

- [ ] **Step 4: Run focused test and verify GREEN**

Run: `pnpm test tests/content/legal-pages.test.js`

Expected: all legal content tests pass.

### Task 3: Generation, full verification, and responsive QA

**Files:**
- Regenerate: `specialists.html`
- Regenerate: `privacy.html`
- Regenerate other manifest HTML only when byte output changes through shared generation.

**Interfaces:**
- Consumes: `PAGES`, `renderPage()`, Vite production build, site verifier.
- Produces: byte-stable committed HTML and a locally viewable production preview.

- [ ] **Step 1: Generate and run the full gate**

Run: `pnpm verify`

Expected: all tests pass, Vite builds 21 HTML pages, and the verifier accepts all 21.

- [ ] **Step 2: Run diff and artifact checks**

Run: `git diff --check` and confirm the generated pages contain no forms/inputs, no remote active resources, and no internal placeholder wording.

- [ ] **Step 3: Browser QA**

Check `specialists.html` and `privacy.html` at 320, 390, 768, and 1280px. Assert document overflow is zero, controls are not clipped or overlapping, specialists switching/focus still works, privacy anchors focus and scroll correctly, and console errors are zero.

- [ ] **Step 4: Commit the implementation**

Stage only the plan, source, tests, and generated HTML changed by this feature. Commit as `feat: polish specialists and privacy pages`.
