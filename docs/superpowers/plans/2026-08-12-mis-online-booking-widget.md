# MIS 32top Online Booking Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the clinic’s existing appointment actions to the approved MIS 32top widget while retaining an explicit-consent boundary, telephone fallback, accurate privacy/cookie copy, and the existing accessibility guarantees.

**Architecture:** A frozen configuration module supplies the approved 32top identifiers and URLs. A stateful provider lazily injects `widget.js`, initializes it with `buttonType: 'none'`, and calls the verified public `openModal` API only after functional consent; the existing appointment dialog remains the clinic-owned consent/fallback surface. Cookie consent stores a versioned choice object and emits a single event consumed by the appointment controller. Generated HTML contains no remote script or iframe before consent.

**Tech Stack:** Static ES modules, Vite 8, Vitest 4 + JSDOM, generated semantic HTML/CSS, MIS 32top `widget.js`.

## Global Constraints

- Widget ID is exactly `144e96ac-dbc8-4f44-a6c2-e27f96a783a6`.
- Approved provider URLs are exactly `https://book-app.32top.ru/widget.js`, `https://book-app.32top.ru/144e96ac-dbc8-4f44-a6c2-e27f96a783a6`, `https://app.32top.ru/soglasie-na-obrabotku-personalnyh-dannyh`, and `https://app.32top.ru/privacy-policy`.
- Never add the provider’s floating button; initialize with `buttonType: 'none'` and use the verified `BookMis32Top.openModal()` API.
- Do not load any 32top resource before explicit functional consent.
- Telephone appointment links remain usable without JavaScript and after every widget error.
- The clinic site never reads, stores, logs, or proxies the name, telephone number, appointment time, doctor selection, or consent values entered inside the provider iframe.
- Do not add jQuery, analytics, advertising pixels, remote fonts, or any host beyond the four approved 32top endpoints.
- Legal copy must describe the factual integration and must not claim that the processor agreement, localization, retention, or production legal approval has already been verified.
- All behavior changes use a witnessed RED → GREEN TDD cycle.
- Production generation remains byte-stable across two consecutive `pnpm generate` runs.

---

### Task 1: Versioned Functional Consent

**Files:**
- Create: `src/js/core/cookie-preferences.js`
- Modify: `src/js/components/cookie-consent.js`
- Modify: `src/templates/render-page.js`
- Modify: `src/styles/components.css`
- Test: `tests/js/cookie-consent.test.js`
- Test: `tests/templates/render-page.test.js`

**Interfaces:**
- Produces: `COOKIE_PREFERENCES_KEY`, `COOKIE_PREFERENCES_VERSION`, `readCookiePreferences(storage)`, `writeCookiePreferences(storage, preferences)`, and `COOKIE_PREFERENCES_CHANGED_EVENT`.
- Produces DOM contract: `[data-cookie-online-booking]`, `[data-cookie-save]`, `[data-cookie-reject]`, `[data-cookie-settings]`.
- Emits `CustomEvent('cookie-preferences-changed', { detail: { onlineBooking: boolean } })` after every saved choice.

- [ ] **Step 1: Write failing consent tests**

Add focused tests proving that an unknown/legacy value migrates to an undecided state, rejection stores `{version: 2, onlineBooking: false}`, selected consent stores `{version: 2, onlineBooking: true}`, settings reopen with the checkbox reflecting storage, malformed JSON fails closed, and the change event carries only the boolean preference.

```js
expect(JSON.parse(storage.set.mock.calls[0][1])).toEqual({ version: 2, onlineBooking: true });
expect(changed.detail).toEqual({ onlineBooking: true });
```

- [ ] **Step 2: Run tests and witness RED**

Run: `pnpm test tests/js/cookie-consent.test.js tests/templates/render-page.test.js`

Expected: failures for the missing versioned preference module and missing checkbox/save controls.

- [ ] **Step 3: Implement the minimal versioned preference module and UI**

Use strict parsing and fail closed:

```js
export const COOKIE_PREFERENCES_KEY = 'cookie-consent';
export const COOKIE_PREFERENCES_VERSION = 2;
export const COOKIE_PREFERENCES_CHANGED_EVENT = 'cookie-preferences-changed';
export const DEFAULT_COOKIE_PREFERENCES = Object.freeze({ version: 2, onlineBooking: false });
```

Render a compact fieldset that explains that online booking loads 32top only when enabled. Keep “Отклонить необязательные” and replace the ambiguous accept action with “Сохранить выбор”.

- [ ] **Step 4: Run focused GREEN and inspect the diff**

Run: `pnpm test tests/js/cookie-consent.test.js tests/templates/render-page.test.js`

Expected: all focused tests pass and no unrelated markup changes appear.

- [ ] **Step 5: Commit**

```bash
git add src/js/core/cookie-preferences.js src/js/components/cookie-consent.js src/templates/render-page.js src/styles/components.css tests/js/cookie-consent.test.js tests/templates/render-page.test.js
git commit -m "feat: add online booking consent preference"
```

### Task 2: MIS 32top Lazy Provider

**Files:**
- Create: `src/data/online-booking.js`
- Modify: `src/js/core/appointment-provider.js`
- Test: `tests/js/appointment-provider.test.js`
- Test: `tests/data/content-safety.test.js`

**Interfaces:**
- Produces frozen `ONLINE_BOOKING` with `widgetId`, `scriptUrl`, `bookingUrl`, `consentUrl`, `privacyUrl`, and `providerName`.
- Produces `createAppointmentProvider({ windowRef, documentRef, timeoutMs })` with `mode: 'mis-32top'`, `getState()`, `open()`, and `destroy()`.
- `open()` resolves `{ mode: 'online', state: 'ready' }` or rejects with a stable `OnlineBookingError` code (`load`, `timeout`, or `api`).

- [ ] **Step 1: Write provider RED tests**

Cover HTTPS constants, no script before `open`, one script and one init under concurrent opens, exact init configuration, `openModal` after initialization, timeout/error rejection, retry after failure, and `destroy()` forwarding to the provider without touching patient data.

```js
expect(windowRef.BookMis32Top).toContainEqual(['init', {
  widgetId: ONLINE_BOOKING.widgetId,
  buttonType: 'none',
  buttonTitle: 'Запись',
  buttonColor: '#1567c8',
}]);
```

- [ ] **Step 2: Run and witness RED**

Run: `pnpm test tests/js/appointment-provider.test.js tests/data/content-safety.test.js`

Expected: missing configuration and provider state-machine failures.

- [ ] **Step 3: Implement lazy loading and the verified API contract**

Append the configuration command before adding an async script, register `BookMis32TopInitCallbacks`, and call `window.BookMis32Top.openModal()` only after `initialized()` returns true. Reuse an in-flight promise and remove a failed script before allowing retry.

- [ ] **Step 4: Run focused GREEN**

Run: `pnpm test tests/js/appointment-provider.test.js tests/data/content-safety.test.js`

Expected: all focused tests pass with no timers or unhandled rejections left behind.

- [ ] **Step 5: Commit**

```bash
git add src/data/online-booking.js src/js/core/appointment-provider.js tests/js/appointment-provider.test.js tests/data/content-safety.test.js
git commit -m "feat: add lazy MIS booking provider"
```

### Task 3: Appointment Dialog and Error Recovery

**Files:**
- Modify: `src/templates/render-page.js`
- Modify: `src/js/components/dialog.js`
- Modify: `src/js/main.js`
- Modify: `src/styles/components.css`
- Modify: `src/styles/accessibility.css`
- Test: `tests/js/interactions.test.js`
- Test: `tests/js/accessibility-settings-dialog.test.js`
- Test: `tests/styles/design-system.test.js`

**Interfaces:**
- Consumes: `readCookiePreferences`, `COOKIE_PREFERENCES_CHANGED_EVENT`, `createAppointmentProvider().open()`.
- Produces DOM contract: `[data-booking-online]`, `[data-booking-status]`, `[data-booking-error]`, `[data-booking-consent-open]`, plus existing phone links.

- [ ] **Step 1: Write production-shaped RED tests**

Prove that every existing CTA still opens the clinic dialog; consented “Записаться онлайн” invokes the provider; unconsented use opens cookie settings without loading the provider; loading disables only the online button; error reveals a direct external link and both phones; Escape/focus/modal-stack/menu behavior remains correct.

- [ ] **Step 2: Run and witness RED**

Run: `pnpm test tests/js/interactions.test.js tests/js/accessibility-settings-dialog.test.js tests/styles/design-system.test.js`

Expected: failures for missing online controls/status/error and provider coordination.

- [ ] **Step 3: Implement controller coordination and responsive states**

Keep the clinic dialog open while requesting consent; after successful provider opening, close the clinic dialog without stealing focus from the provider iframe. Use `aria-live="polite"` for loading and `role="alert"` for errors. Never disable telephone links.

- [ ] **Step 4: Run focused GREEN**

Run: `pnpm test tests/js/interactions.test.js tests/js/accessibility-settings-dialog.test.js tests/styles/design-system.test.js`

Expected: all focused tests pass, including nested menu/dialog and accessibility modal order.

- [ ] **Step 5: Commit**

```bash
git add src/templates/render-page.js src/js/components/dialog.js src/js/main.js src/styles/components.css src/styles/accessibility.css tests/js/interactions.test.js tests/js/accessibility-settings-dialog.test.js tests/styles/design-system.test.js
git commit -m "feat: connect appointment dialog to MIS"
```

### Task 4: Accurate Privacy, Cookie, and Handoff Copy

**Files:**
- Modify: `src/content/legal-pages.js`
- Modify: `src/data/search-keywords.js`
- Modify: `README.md`
- Modify: `CONTENT_CHECKLIST.md`
- Test: `tests/content/legal-pages.test.js`
- Test: `tests/project/handoff.test.js`
- Test: `tests/scripts/search-index.test.js`

**Interfaces:**
- Consumes: `ONLINE_BOOKING` public provider constants.
- Produces published facts that the clinic site loads 32top only after consent, the provider form requests doctor/date/time plus surname/name/patronymic/telephone and its own consent checkbox, and phone recording remains available.

- [ ] **Step 1: Write legal-copy RED tests**

Assert the exact provider legal name and domains, factual observed form-field categories, direct links to provider consent/privacy, opt-out and phone alternative, the absence of “МИС не подключена”, and explicit unresolved checklist entries for processing agreement, localization, retention, incidents, and final legal approval.

- [ ] **Step 2: Run and witness RED**

Run: `pnpm test tests/content/legal-pages.test.js tests/project/handoff.test.js tests/scripts/search-index.test.js`

Expected: current “МИС не подключена” and “сторонних виджетов нет” assertions fail.

- [ ] **Step 3: Update public and handoff copy**

Rewrite only the sections whose facts changed. Do not claim verified storage location, retention period, processor contract, or transborder status. Keep the clinic as the site operator and identify ООО «Айкомплекс» as the online-booking service provider based on its official public policy.

- [ ] **Step 4: Run focused GREEN**

Run: `pnpm test tests/content/legal-pages.test.js tests/project/handoff.test.js tests/scripts/search-index.test.js`

Expected: all focused tests pass and generated search content includes “онлайн-запись”, “МИС”, and “32top”.

- [ ] **Step 5: Commit**

```bash
git add src/content/legal-pages.js src/data/search-keywords.js README.md CONTENT_CHECKLIST.md tests/content/legal-pages.test.js tests/project/handoff.test.js tests/scripts/search-index.test.js
git commit -m "docs: describe MIS booking data flow"
```

### Task 5: Production Verifier Allowlist and 21-Page Conformance

**Files:**
- Modify: `scripts/verify-site.mjs`
- Modify: `tests/scripts/site-verifier.test.js`
- Modify: `tests/project/accessibility-conformance.test.js`
- Modify: `tests/templates/render-page.test.js`

**Interfaces:**
- Consumes: generated 21-page HTML contract and approved provider constants.
- Produces verifier rule: no static 32top script/iframe in HTML; outbound links only to approved booking/privacy/consent URLs; all other external active resources remain rejected.

- [ ] **Step 1: Write verifier/conformance RED tests**

Add tests that reject a static `book-app.32top.ru/widget.js` script or iframe, accept the three approved outbound anchors, reject deceptive sibling/subdomain/HTTP variants, and require the consent/status/error relationships on every generated page.

- [ ] **Step 2: Run and witness RED**

Run: `pnpm test tests/scripts/site-verifier.test.js tests/project/accessibility-conformance.test.js tests/templates/render-page.test.js`

Expected: missing approved-anchor contract and missing 21-page booking relationships.

- [ ] **Step 3: Implement exact allowlist validation**

Compare parsed URL protocol, hostname, pathname, username, password, port, search, and hash against the frozen approved values. Keep remote scripts and iframes forbidden in generated HTML because runtime loading is consent-gated.

- [ ] **Step 4: Generate twice and run focused GREEN**

Run:

```bash
pnpm generate
git diff --exit-code -- '*.html' public/search-index.json
pnpm generate
git diff --exit-code -- '*.html' public/search-index.json
pnpm test tests/scripts/site-verifier.test.js tests/project/accessibility-conformance.test.js tests/templates/render-page.test.js
```

Expected: the second generation is byte-stable and all focused tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/verify-site.mjs tests/scripts/site-verifier.test.js tests/project/accessibility-conformance.test.js tests/templates/render-page.test.js *.html public/search-index.json
git commit -m "test: verify consent-gated MIS integration"
```

### Task 6: Full Verification and Browser QA

**Files:**
- Create: `docs/superpowers/reports/2026-08-12-mis-online-booking-widget-qa.md`
- Modify only through separate RED → GREEN cycles if browser QA demonstrates a defect.

**Interfaces:**
- Consumes: production build and live 32top endpoint.
- Produces: auditable automated and live QA evidence plus a clean working tree.

- [ ] **Step 1: Run the fresh automated release gate**

Run: `pnpm verify`

Expected: all tests pass, Vite builds 21 HTML pages, and the production verifier reports all 21 pages verified.

- [ ] **Step 2: Start production preview and verify pre-consent network isolation**

Open a fresh origin/storage state at 320, 390, 768, 1280, and 1440 px. Before consent, verify zero requests to `32top.ru`, no provider iframe/script, no horizontal overflow, and working telephone fallback without JavaScript.

- [ ] **Step 3: Verify consented online booking**

Enable online booking, open the clinic appointment dialog, activate “Записаться онлайн”, and verify exactly one provider script, one iframe titled “Онлайн-запись”, visible doctor/calendar/time flow, and the final provider form showing surname, name, patronymic, telephone, and provider consent links. Do not enter or submit personal data.

- [ ] **Step 4: Verify rejection, settings, failure, and coexistence**

Verify refusal leaves phone recording functional; settings can enable/disable future loads; a blocked script produces the error/direct-link/phone fallback; menu, cookie panel, search, accessibility panel, and appointment dialog do not overlap; keyboard, focus return, Escape, reduced motion, and special display modes remain usable.

- [ ] **Step 5: Record network/console and responsive evidence**

Document route/viewport totals, requests before/after consent, console errors, focus/keyboard results, external-widget limitations, and the unresolved processor-contract launch gate in the QA report.

- [ ] **Step 6: Run final clean gates and commit**

Run:

```bash
pnpm verify
git diff --check
git status --short
```

Expected: fresh full gate passes, diff check is clean, and only the QA report/focused fixes are staged.

```bash
git add docs/superpowers/reports/2026-08-12-mis-online-booking-widget-qa.md
git commit -m "test: verify MIS online booking widget"
```

