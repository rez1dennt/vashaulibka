# Accessibility Action Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the compact accessibility action icons horizontally with their labels and place the collapse chevron after its text.

**Architecture:** Keep the existing semantic buttons and SVG renderer. Add deterministic label wrappers and shared modifier classes in the template, then consume existing spacing tokens in the final accessibility CSS layer.

**Tech Stack:** Static HTML templates, vanilla CSS custom properties, Vitest/JSDOM, Vite.

## Global Constraints

- Preserve current ARIA names, button behavior, 44px targets, themes, 200% reflow, and reduced-motion behavior.
- Use existing tokens only; add no dependencies or remote resources.

---

### Task 1: Align action icons

**Files:**
- Modify: `src/templates/accessibility-panel.js`
- Modify: `src/styles/accessibility.css`
- Modify: `tests/templates/accessibility-panel.test.js`
- Modify: `tests/styles/accessibility.test.js`

**Interfaces:**
- Consumes: `renderIcon(name, className)` and existing `data-accessibility-*` hooks.
- Produces: `.accessibility-action-button`, `.accessibility-action-button__label`, and `.accessibility-action-button--collapse` styling hooks.

- [ ] **Step 1: Write failing template and CSS tests**

Assert speaker/gear order is SVG then label, collapse order is label then SVG, and shared CSS uses explicit two-column grid alignment with the collapse modifier reversing the columns.

- [ ] **Step 2: Run RED**

Run `pnpm test tests/templates/accessibility-panel.test.js tests/styles/accessibility.test.js` and confirm the new assertions fail because the hooks and layout are absent.

- [ ] **Step 3: Implement minimal markup and CSS**

Add the three hooks to icon-bearing action buttons and style them with existing spacing/size tokens. Keep text wrapping inside the label column.

- [ ] **Step 4: Run GREEN and production verification**

Run the focused tests, `pnpm verify`, `git diff --check`, then inspect mobile and desktop production preview screenshots.

- [ ] **Step 5: Commit**

Commit the exact template, CSS, tests, generated HTML, design, and plan files.
