# Compact Home Schedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tall homepage schedule list with a compact 2×2 mobile grid and four-column desktop strip.

**Architecture:** Keep the existing semantic `<dl>` and verified `HOURS` data, but render the break note as a fourth definition item. Scope all layout rules to `.home-contact__hours` so other definition lists remain unchanged.

**Tech Stack:** Static HTML renderer, vanilla CSS custom properties, JSDOM, Vitest, Vite, in-app Browser QA.

## Global Constraints

- Preserve the exact verified hours and `HOURS.breakNote`.
- Use four items in DOM order: weekdays, Saturday, Sunday, break.
- Base layout is 2×2; desktop from `75rem` is four columns.
- Use only existing semantic tokens, no new colors, shadows or raw values.
- Preserve the clock icon, contact-section structure, phones, email, image and appointment button.
- Preserve semantic `<dl>`, `<dt>` and `<dd>` markup.
- Do not change `.definition-list` behavior elsewhere.

---

### Task 1: Render and style the compact schedule grid

**Files:**
- Modify: `tests/content/home-page.test.js`
- Modify: `tests/styles/home-redesign.test.js`
- Modify: `src/content/home-page.js`
- Modify: `src/styles/pages.css`
- Regenerate: `index.html`

**Interfaces:**
- Consumes: `HOURS.weekdays`, `HOURS.saturday`, `HOURS.sunday`, `HOURS.breakNote`.
- Produces: `.home-contact__hours` containing four direct `div > dt + dd` definition items.

- [ ] **Step 1: Write failing content and style tests**

Add to `tests/content/home-page.test.js`:

```js
it('renders the schedule as four verified definition cells', () => {
  const document = render();
  const cells = [...document.querySelectorAll('.home-contact__hours > div')];

  expect(cells).toHaveLength(4);
  expect(cells.map((cell) => [cell.querySelector('dt')?.textContent, cell.querySelector('dd')?.textContent])).toEqual([
    [HOURS.weekdays.label, HOURS.weekdays.value],
    [HOURS.saturday.label, HOURS.saturday.value],
    [HOURS.sunday.label, HOURS.sunday.value],
    ['Перерыв', HOURS.breakNote],
  ]);
  expect(document.querySelector('.home-contact__break')).toBeNull();
});
```

Replace the schedule assertion in `tests/styles/home-redesign.test.js` with:

```js
expect(pages).toMatch(/\.home-contact__hours\s*{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(var\(--space-0\),\s*1fr\)\)[^}]*gap:\s*var\(--border-width\)/s);
expect(pages).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.home-contact__hours\s*{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(var\(--space-0\),\s*1fr\)\)/s);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
pnpm test tests/content/home-page.test.js tests/styles/home-redesign.test.js
```

Expected: failures because `.home-contact__hours` does not exist, the break note is still a separate paragraph and no responsive grid contract exists.

- [ ] **Step 3: Render four definition cells**

Replace the `hours` construction in `src/content/home-page.js` with:

```js
const hours = [
  HOURS.weekdays,
  HOURS.saturday,
  HOURS.sunday,
  { label: 'Перерыв', value: HOURS.breakNote },
]
  .map((entry) => `<div><dt>${escapeHtml(entry.label)}</dt><dd>${escapeHtml(entry.value)}</dd></div>`)
  .join('');
```

Replace the schedule row with:

```js
`<div class="home-contact__row home-contact__schedule">${renderIcon('clock')}<dl class="home-contact__hours">${hours}</dl></div>`,
```

- [ ] **Step 4: Add the token-driven grid styles**

Replace the old schedule/break rules in `src/styles/pages.css` with:

```css
.home-contact__hours {
  min-inline-size: var(--space-0);
  display: grid;
  grid-template-columns: repeat(2, minmax(var(--space-0), 1fr));
  gap: var(--border-width);
  margin: var(--space-0);
  padding: var(--border-width);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-border);
}

.home-contact__hours > div {
  min-inline-size: var(--space-0);
  padding: var(--space-3);
  overflow-wrap: anywhere;
  background: var(--color-surface-raised);
}

.home-contact__hours dt {
  color: var(--color-text-muted);
  font-size: var(--text-caption-size);
  font-weight: var(--text-label-weight);
}

.home-contact__hours dd {
  margin: var(--space-1) var(--space-0) var(--space-0);
  color: var(--color-text);
  font-weight: var(--text-label-weight);
  font-variant-numeric: tabular-nums;
}
```

Inside the existing `@media (min-width: 75rem)` block add:

```css
.home-contact__hours {
  grid-template-columns: repeat(4, minmax(var(--space-0), 1fr));
}
```

- [ ] **Step 5: Regenerate and verify GREEN**

Run:

```powershell
pnpm generate
pnpm test tests/content/home-page.test.js tests/styles/home-redesign.test.js
```

Expected: both files pass and only `index.html` changes among generated pages.

- [ ] **Step 6: Commit Task 1**

```powershell
git add src/content/home-page.js src/styles/pages.css tests/content/home-page.test.js tests/styles/home-redesign.test.js index.html
git commit -m "feat: compact homepage schedule"
```

---

### Task 2: Verify responsive presentation

**Files:**
- Create: `.superpowers/sdd/task-home-schedule-grid-report.md`

**Interfaces:**
- Consumes: Task 1 output.
- Produces: responsive and release verification evidence.

- [ ] **Step 1: Run project and design-system gates**

Run:

```powershell
pnpm verify
git diff --check
& 'C:\Users\bahti\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\lint_hardcodes.py' src/styles
& 'C:\Users\bahti\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'C:\Users\bahti\.codex\skills\ux-ui-agent-skills\scripts\validate_theme_refs.py' src/styles/tokens.css src/styles
```

Expected: full test/build/site verifier passes; no hardcoded values or unresolved tokens.

- [ ] **Step 2: Browser QA**

At 320, 390, 768 and 1280 px verify:

```text
- 4 schedule cells are visible;
- grid has 2 columns below 75rem and 4 columns at 1280px;
- no document horizontal overflow;
- no schedule text is clipped or overlaps;
- the clock icon remains aligned with the block;
- adjacent contact content and image remain intact.
```

At 320 px enable vision mode and repeat overflow/clipping checks.

- [ ] **Step 3: Write and commit the report**

Create `.superpowers/sdd/task-home-schedule-grid-report.md`, then run:

```powershell
git add -f .superpowers/sdd/task-home-schedule-grid-report.md
git commit -m "docs: verify compact home schedule"
```

- [ ] **Step 4: Run the final fresh gate**

Run:

```powershell
pnpm verify
git diff --check
git status --short
```

Expected: full green gate and empty worktree.
