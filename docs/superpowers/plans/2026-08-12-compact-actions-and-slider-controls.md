# Compact Actions and Slider Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать баннер cookies компактнее, выстроить действия главной и страницы «О клинике» в ясную мобильную иерархию, привести телефонные действия диалога к той же системе и перенести управление слайдером специалистов вниз вправо.

**Architecture:** Существующие данные, маршруты и JavaScript-контракты остаются неизменными. Небольшие семантические обёртки в генераторах дают CSS Grid устойчивые границы для основной кнопки и телефонных действий; визуальные изменения выполняются в существующих слоях `tokens.css`, `components.css` и `pages.css`, а разметка всех 21 HTML-страниц обновляется только через штатный генератор.

**Tech Stack:** HTML, CSS custom properties и responsive CSS Grid/Flexbox, JavaScript ES modules, Vitest 4 + JSDOM, Vite 8, pnpm 11.

## Global Constraints

- Не менять подтверждённые данные клиники, юридический текст, маршруты, логику cookies, диалога и циклического слайдера.
- Не добавлять фиктивную онлайн-запись: до интеграции МИС действия записи ведут к официальным телефонам.
- Использовать существующие семантические токены и локальные ресурсы; не добавлять зависимости, внешние шрифты, аналитику или трекеры.
- Сохранить зоны нажатия не меньше текущего `--control-block-size`, видимый `:focus-visible`, клавиатурное управление и reduced-motion.
- При 320 CSS-пикселях не допускать горизонтального переполнения или обрезки текста.

---

## File Map

- `src/templates/render-page.js` — добавляет устойчивую обёртку для телефонных действий диалога.
- `src/content/about-page.js` — разделяет основную кнопку и два телефона в CTA «Выберите удобный способ связи».
- `src/content/specialists-page.js` — размещает панель управления после viewport слайдера.
- `src/styles/tokens.css` — уменьшает максимальную ширину cookie-баннера через токен.
- `src/styles/components.css` — компактный cookie-баннер и адаптивная сетка телефона в диалоге.
- `src/styles/pages.css` — центрированные действия hero/CTA, точное центрирование заголовка специалистов и нижняя правая панель стрелок.
- `tests/templates/render-page.test.js` — контракт разметки диалога.
- `tests/content/about-page.test.js` — контракт основной кнопки и двух официальных телефонов CTA.
- `tests/content/specialists-page.test.js` — DOM-порядок viewport → toolbar.
- `tests/styles/compact-actions.test.js` — новый целевой CSS-контракт компактных и адаптивных действий.
- `tests/styles/specialists-coverflow.test.js` — обновлённый CSS-контракт нижнего управления и центрированного heading.
- `index.html`, `about.html`, `specialists.html` и остальные сгенерированные root HTML — обновляются командой `pnpm generate`, вручную не редактируются.

---

### Task 1: Семантические группы действий

**Files:**
- Modify: `tests/templates/render-page.test.js`
- Modify: `tests/content/about-page.test.js`
- Modify: `src/templates/render-page.js`
- Modify: `src/content/about-page.js`

**Interfaces:**
- Consumes: `CONTACTS.phones`, существующий атрибут `data-appointment-open`, классы `.button-primary` и `.button-secondary`.
- Produces: `.dialog__actions > .dialog__phones` и `.about-cta__actions > .about-cta__phones`; все телефонные ссылки сохраняют исходные `tel:` href.

- [ ] **Step 1: Написать падающие DOM-тесты структуры действий**

В `tests/templates/render-page.test.js` добавить:

```js
it('groups official appointment phones for responsive layout', () => {
  const document = new JSDOM(renderPage(page)).window.document;
  const actions = document.querySelector('#appointment-dialog .dialog__actions');
  const phones = actions?.querySelector('.dialog__phones');

  expect(actions).not.toBeNull();
  expect(phones?.querySelectorAll('a[href^="tel:"]')).toHaveLength(2);
  expect(actions?.querySelector('form, input, textarea')).toBeNull();
});
```

В `tests/content/about-page.test.js` расширить тест appointment facts:

```js
const actions = document.querySelector('.about-cta__actions');
const phones = actions?.querySelector('.about-cta__phones');
expect(actions?.querySelector(':scope > [data-appointment-open]')).not.toBeNull();
expect(phones?.querySelectorAll('a[href^="tel:"]')).toHaveLength(CONTACTS.phones.length);
```

- [ ] **Step 2: Запустить целевые тесты и подтвердить RED**

Run:

```powershell
pnpm test tests/templates/render-page.test.js tests/content/about-page.test.js
```

Expected: FAIL — `.dialog__actions`, `.dialog__phones`, `.about-cta__actions` и `.about-cta__phones` отсутствуют.

- [ ] **Step 3: Добавить минимальные обёртки без изменения ссылок**

В `src/templates/render-page.js` заменить непосредственный вывод телефонных ссылок:

```js
'<div class="dialog__actions"><div class="dialog__phones">',
CONTACTS.phones.map((phone) => `<a class="button button-secondary" href="${phone.href}">${esc(phone.label)}</a>`).join(''),
'</div></div>',
```

В `src/content/about-page.js` заменить текущий `.about-actions` внутри `.about-cta`:

```js
`<div class="about-cta__actions"><a class="button button-primary" href="${CONTACTS.phones[0].href}" data-appointment-open>${renderIcon('calendar', 'button-icon')}Записаться на приём</a><div class="about-cta__phones">${CONTACTS.phones.map((phone) => `<a class="button button-secondary" href="${phone.href}">${escapeHtml(phone.label)}</a>`).join('')}</div></div>`
```

- [ ] **Step 4: Запустить целевые тесты и подтвердить GREEN**

Run:

```powershell
pnpm test tests/templates/render-page.test.js tests/content/about-page.test.js
```

Expected: PASS для обоих файлов; число ссылок и отсутствие полей ввода сохранены.

- [ ] **Step 5: Зафиксировать задачу**

```powershell
git add src/templates/render-page.js src/content/about-page.js tests/templates/render-page.test.js tests/content/about-page.test.js
git commit -m "refactor: group appointment actions for responsive layout"
```

---

### Task 2: Компактный cookie-баннер и иерархия кнопок

**Files:**
- Create: `tests/styles/compact-actions.test.js`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/components.css`
- Modify: `src/styles/pages.css`

**Interfaces:**
- Consumes: `.cookie-banner`, `.home-hero__actions`, `.about-cta__actions`, `.about-cta__phones`, `.dialog__actions`, `.dialog__phones`, существующие spacing/control/button tokens.
- Produces: cookie max width `28rem`; основная hero/CTA кнопка на отдельной строке; два телефона в равных колонках начиная с `24rem`; одно-колоночный безопасный fallback ниже `24rem`.

- [ ] **Step 1: Создать падающий CSS-контракт**

Создать `tests/styles/compact-actions.test.js`:

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync('src/styles/tokens.css', 'utf8');
const components = readFileSync('src/styles/components.css', 'utf8');
const pages = readFileSync('src/styles/pages.css', 'utf8');

describe('compact responsive action layouts', () => {
  it('keeps the cookie banner compact with responsive equal actions', () => {
    expect(tokens).toMatch(/--primitive-size-cookie:\s*28rem/);
    expect(components).toMatch(/\.cookie-banner\s*{[^}]*display:\s*grid[^}]*padding:\s*var\(--space-5\)/s);
    expect(components).toMatch(/\.cookie-banner button\s*{[^}]*margin:\s*var\(--space-0\)/s);
    expect(components).toMatch(/@media\s*\(min-width:\s*24rem\)[\s\S]*?\.cookie-banner\s*{[^}]*grid-template-columns:\s*repeat\(2,/s);
  });

  it('centers a dominant home action above the secondary action', () => {
    expect(pages).toMatch(/\.home-hero__actions\s*{[^}]*display:\s*grid[^}]*justify-items:\s*center[^}]*margin-inline:\s*auto/s);
    expect(pages).toMatch(/\.home-hero__actions\s*>\s*\.button-primary\s*{[^}]*inline-size:\s*100%/s);
  });

  it('uses one dominant CTA row and responsive two-column phones', () => {
    expect(pages).toMatch(/\.about-cta__actions\s*{[^}]*display:\s*grid/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*24rem\)[\s\S]*?\.about-cta__phones\s*{[^}]*grid-template-columns:\s*repeat\(2,/s);
    expect(components).toMatch(/@media\s*\(min-width:\s*24rem\)[\s\S]*?\.dialog__phones\s*{[^}]*grid-template-columns:\s*repeat\(2,/s);
  });
});
```

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run:

```powershell
pnpm test tests/styles/compact-actions.test.js
```

Expected: FAIL — компактный token и новые grid-контракты отсутствуют.

- [ ] **Step 3: Реализовать токен и component-level стили**

В `src/styles/tokens.css` установить:

```css
--primitive-size-cookie: 28rem;
```

В `src/styles/components.css` заменить раскладку баннера и добавить телефонную сетку диалога:

```css
.dialog__actions,
.dialog__phones {
  min-inline-size: var(--space-0);
  display: grid;
  gap: var(--space-3);
}

.dialog__panel .button {
  inline-size: 100%;
  margin: var(--space-0);
}

.cookie-banner {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-5);
}

.cookie-banner p {
  margin: var(--space-0) var(--space-0) var(--space-2);
  font-size: var(--text-small-size);
}

.cookie-banner button {
  inline-size: 100%;
  margin: var(--space-0);
  padding: var(--space-2) var(--space-3);
}

@media (min-width: 24rem) {
  .dialog__phones,
  .cookie-banner {
    grid-template-columns: repeat(2, minmax(var(--space-0), 1fr));
  }

  .cookie-banner p {
    grid-column: 1 / -1;
  }
}
```

- [ ] **Step 4: Реализовать page-level раскладки hero и CTA**

В `src/styles/pages.css` заменить общий flex hero и добавить scoped CTA-сетку:

```css
.home-hero__actions {
  inline-size: min(100%, 22rem);
  display: grid;
  justify-items: center;
  gap: var(--space-3);
  margin-inline: auto;
}

.home-hero__actions > .button-primary {
  inline-size: 100%;
}

.about-cta__actions,
.about-cta__phones {
  min-inline-size: var(--space-0);
  display: grid;
  gap: var(--space-3);
}

.about-cta__actions {
  max-inline-size: 28rem;
  margin-block-start: var(--space-5);
}

.about-cta__actions > .button-primary,
.about-cta__phones > .button {
  inline-size: 100%;
}

@media (min-width: 24rem) {
  .about-cta__phones {
    grid-template-columns: repeat(2, minmax(var(--space-0), 1fr));
  }
}
```

Сохранить `.home-price-panel__actions` отдельным существующим flex-правилом, чтобы изменение hero не затронуло цены.

- [ ] **Step 5: Запустить целевые стили и соседние контракты**

Run:

```powershell
pnpm test tests/styles/compact-actions.test.js tests/styles/home-redesign.test.js tests/styles/about-redesign.test.js tests/styles/design-system.test.js
```

Expected: PASS; существующие button/focus/layer контракты остаются зелёными.

- [ ] **Step 6: Зафиксировать задачу**

```powershell
git add src/styles/tokens.css src/styles/components.css src/styles/pages.css tests/styles/compact-actions.test.js
git commit -m "style: refine compact responsive actions"
```

---

### Task 3: Нижние стрелки и точное центрирование специалистов

**Files:**
- Modify: `tests/content/specialists-page.test.js`
- Modify: `tests/styles/specialists-coverflow.test.js`
- Modify: `src/content/specialists-page.js`
- Modify: `src/styles/pages.css`

**Interfaces:**
- Consumes: существующие `data-specialist-prev`, `data-specialist-next`, `.specialists-coverflow__viewport` и `.specialists-coverflow__toolbar`.
- Produces: DOM-порядок viewport → toolbar; toolbar в обычном потоке, справа под карточками; heading шириной 100% с `justify-items: center`.

- [ ] **Step 1: Обновить тесты под утверждённую композицию**

В `tests/content/specialists-page.test.js` добавить:

```js
const viewport = root.querySelector('.specialists-coverflow__viewport');
expect(viewport?.nextElementSibling?.classList.contains('specialists-coverflow__toolbar')).toBe(true);
```

В `tests/styles/specialists-coverflow.test.js` заменить тест верхней панели:

```js
it('centers the heading and places a compact toolbar below at the end edge', () => {
  expect(pages).toMatch(/\.specialists-section__heading\s*{[^}]*inline-size:\s*100%[^}]*display:\s*grid[^}]*justify-items:\s*center[^}]*text-align:\s*center/s);
  expect(pages).toMatch(/\.specialists-coverflow__toolbar\s*{[^}]*display:\s*flex[^}]*justify-content:\s*flex-end[^}]*margin-block-start:\s*var\(--space-4\)/s);
  expect(pages).not.toMatch(/\.specialists-coverflow__toolbar\s*{[^}]*position:\s*absolute/s);
  expect(pages).toMatch(/\.specialists-coverflow__controls\s*{[^}]*display:\s*none[^}]*gap:\s*var\(--space-3\)/s);
});
```

- [ ] **Step 2: Запустить тесты и подтвердить RED**

Run:

```powershell
pnpm test tests/content/specialists-page.test.js tests/styles/specialists-coverflow.test.js
```

Expected: FAIL — toolbar стоит перед viewport и абсолютно закреплён сверху; heading не задаёт grid/full width.

- [ ] **Step 3: Переставить toolbar после viewport**

В `src/content/specialists-page.js` внутри `.specialists-coverflow__stage` оставить прежнюю разметку кнопок и перенести весь `.specialists-coverflow__toolbar` сразу после закрывающего тега `.specialists-coverflow__viewport`. Атрибуты обеих кнопок не менять.

- [ ] **Step 4: Обновить стили heading и toolbar**

В `src/styles/pages.css` установить:

```css
.specialists-section__heading {
  inline-size: 100%;
  max-inline-size: var(--text-body-measure);
  display: grid;
  justify-items: center;
  margin-inline: auto;
  text-align: center;
}

.specialists-section__heading .eyebrow {
  margin-inline: auto;
  text-align: center;
}

.specialists-coverflow__toolbar {
  display: flex;
  justify-content: flex-end;
  margin-block-start: var(--space-4);
}
```

Удалить у toolbar `position`, `inset-*` и `z-index`; высоту viewport и transform-позиции карточек не менять.

- [ ] **Step 5: Запустить целевые тесты и подтвердить GREEN**

Run:

```powershell
pnpm test tests/content/specialists-page.test.js tests/styles/specialists-coverflow.test.js
```

Expected: PASS; accessibility labels и циклическая логика остаются без изменений.

- [ ] **Step 6: Зафиксировать задачу**

```powershell
git add src/content/specialists-page.js src/styles/pages.css tests/content/specialists-page.test.js tests/styles/specialists-coverflow.test.js
git commit -m "style: move specialist controls below carousel"
```

---

### Task 4: Генерация, полный gate и браузерная проверка

**Files:**
- Regenerate: root `*.html` through `scripts/generate-pages.mjs`
- Verify: all changed source/test/generated files

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: 21 синхронизированных HTML-файлов и проверенный production build без новых предупреждений.

- [ ] **Step 1: Перегенерировать страницы и проверить стабильность**

Run:

```powershell
pnpm generate
git diff --check
```

Expected: 21 HTML-файл синхронизирован; `git diff --check` завершён с exit 0.

- [ ] **Step 2: Запустить полный автоматический gate**

Run:

```powershell
pnpm verify
```

Expected: все Vitest-тесты PASS; Vite production build успешен; `verify:site` подтверждает 21 HTML-страницу.

- [ ] **Step 3: Проверить rendered UI во встроенном Browser**

На `index.html`, `about.html` и `specialists.html` проверить 320×900, 390×844 и 1280×900:

```text
- document.documentElement.scrollWidth === document.documentElement.clientWidth
- cookie banner: меньше прежнего, полностью виден, кнопки не обрезаны
- home hero: primary находится над centered secondary
- about CTA: primary сверху, два телефона рядом при 390/1280 и в одну колонку при 320
- dialog: два телефонных действия аккуратно выровнены, focus/Escape/backdrop работают
- specialists: eyebrow и h2 имеют общий горизонтальный центр; стрелки под viewport справа; карточки не перекрываются
- console errors: 0
```

Также включить режим для слабовидящих на 390px и убедиться, что кнопки переносятся без overflow.

- [ ] **Step 4: Если Browser выявил дефект, воспроизвести его тестом**

Добавить минимальный падающий тест в ближайший целевой файл, запустить его до исправления, внести минимальную правку и повторить `pnpm verify` и затронутый Browser-сценарий. Не исправлять продемонстрированный дефект без RED.

- [ ] **Step 5: Выполнить итоговую проверку scope и зафиксировать результат**

Run:

```powershell
git status --short
git diff --check
pnpm verify
```

Expected: только запланированные source/test/generated/report files; diff clean; полный gate повторно зелёный.

Commit:

```powershell
git add src tests *.html
git commit -m "feat: polish compact actions and carousel controls"
```

Не добавлять `.serena/`, временные скриншоты, `dist/` или локальные журналы preview.
