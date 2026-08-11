# About Hours Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the about-page vertical hours list with a responsive four-cell grid.

**Architecture:** Keep `HOURS` as the only data source and change only the about-page schedule markup plus page-scoped CSS. The existing renderer, global appointment dialog and other pages remain unchanged.

**Tech Stack:** Static ESM renderer, semantic HTML, vanilla token CSS, Vitest, Vite.

## Global Constraints

- Use only confirmed `HOURS` values.
- Preserve semantic `<dl>`, appointment links and dialog behavior.
- Use existing tokens and breakpoints only.
- Base grid is two columns; desktop grid is four columns at `75rem`.

---

### Task 1: Schedule markup contract

**Files:**
- Modify: `tests/content/about-page.test.js`
- Modify: `src/content/about-page.js`
- Regenerate: `about.html`

**Interfaces:**
- Consumes: `HOURS.weekdays`, `HOURS.saturday`, `HOURS.sunday`, `HOURS.breakNote`, `renderIcon('clock')`.
- Produces: `.about-cta__schedule-heading` and `.about-hours` with four direct cells.

- [ ] Add a failing test that expects four `.about-hours > div` elements, exact labels and values, and one clock icon.
- [ ] Run `pnpm test tests/content/about-page.test.js` and confirm RED because `.about-hours` is absent.
- [ ] Render the existing three schedule entries plus `<div class="about-hours__note"><dt>Режим</dt><dd>${HOURS.breakNote}</dd></div>` and remove the separate note paragraph.
- [ ] Run `pnpm generate` and the focused content test; expect GREEN.

### Task 2: Responsive grid contract

**Files:**
- Modify: `tests/styles/about-redesign.test.js`
- Modify: `src/styles/pages.css`

**Interfaces:**
- Consumes: `.about-cta__schedule-heading`, `.about-hours`, `.about-hours__note`.
- Produces: token-driven 2×2 mobile and four-column desktop schedule.

- [ ] Add a failing style test for `repeat(2, minmax(var(--space-0), 1fr))` in the base rule and four columns inside the `75rem` query.
- [ ] Run the focused style test and confirm RED.
- [ ] Add grid, cell, heading/icon and wrapping styles using existing semantic tokens.
- [ ] Run focused tests, hardcode scan and theme-reference validation; expect GREEN.

### Task 3: Release verification

**Files:**
- Modify: `.superpowers/sdd/task-about-page-redesign-report.md`

- [ ] Run `pnpm verify`, `git diff --check` and inspect the rendered schedule at 320 and 1280 px.
- [ ] Record the new grid evidence in the existing about-page report.
- [ ] Commit the implementation and confirm a clean worktree.
