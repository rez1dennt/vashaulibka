# Responsive Home Hero Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Центрировать всю текстовую колонку главного hero до 64rem и выравнивать её целиком по левому краю на компьютерах от 64rem.

**Architecture:** Изменение ограничивается responsive CSS существующего `.home-hero__copy`; HTML, данные и интерактивность не меняются. Mobile-first правило задаёт центрирование, а уже существующий desktop breakpoint `64rem` переопределяет выравнивание текста, действий и строки лицензии.

**Tech Stack:** Vanilla HTML/CSS, CSS custom properties, Vitest 4, Vite 8, pnpm 11.

## Global Constraints

- На экранах до `64rem` eyebrow, H1, описание, кнопки и строка лицензии центрируются внутри текстовой колонки.
- От `64rem / 1024px` все элементы текстовой колонки имеют общий левый край.
- Изображение, HTML, тексты, ссылки, данные клиники, JavaScript и остальные CTA не меняются.
- Используются только существующие semantic spacing tokens и breakpoint `64rem`.
- На 320px не допускается горизонтальный overflow; зоны нажатия и `:focus-visible` сохраняются.

---

### Task 1: Responsive-выравнивание hero через RED→GREEN

**Files:**
- Create: `tests/styles/home-hero-alignment.test.js`
- Modify: `src/styles/pages.css:1150-1195,2366-2370`

**Interfaces:**
- Consumes: `.home-hero__copy`, `.home-hero__lead`, `.home-hero__actions`, `.home-hero__trust`, существующие `--space-0` и breakpoint `64rem`.
- Produces: центрированный mobile/tablet hero и общий левый край desktop hero без изменения DOM.

- [ ] **Step 1: Написать падающий CSS-контракт**

Создать `tests/styles/home-hero-alignment.test.js`:

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pages = readFileSync('src/styles/pages.css', 'utf8');

describe('responsive home hero alignment', () => {
  it('centers the complete copy stack before the desktop breakpoint', () => {
    expect(pages).toMatch(/\.home-hero__copy\s*{[^}]*text-align:\s*center/s);
    expect(pages).toMatch(/\.home-hero__lead\s*{[^}]*margin-inline:\s*auto/s);
    expect(pages).toMatch(/\.home-hero__trust\s*{[^}]*justify-content:\s*center[^}]*text-align:\s*start/s);
  });

  it('aligns the complete copy stack left from 64rem', () => {
    expect(pages).toMatch(/@media\s*\(min-width:\s*64rem\)[\s\S]*?\.home-hero__copy\s*{[^}]*text-align:\s*start/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*64rem\)[\s\S]*?\.home-hero__lead,\s*\.home-hero__actions\s*{[^}]*margin-inline:\s*var\(--space-0\)/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*64rem\)[\s\S]*?\.home-hero__actions\s*{[^}]*justify-items:\s*start/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*64rem\)[\s\S]*?\.home-hero__trust\s*{[^}]*justify-content:\s*flex-start/s);
  });
});
```

- [ ] **Step 2: Запустить тест и подтвердить RED**

Run:

```powershell
pnpm test tests/styles/home-hero-alignment.test.js
```

Expected: 2 теста FAIL, потому что mobile copy ещё не центрирован целиком, а desktop overrides отсутствуют.

- [ ] **Step 3: Добавить минимальные mobile-first стили**

В `src/styles/pages.css` дополнить существующие правила:

```css
.home-hero__copy {
  min-inline-size: var(--space-0);
  text-align: center;
}

.home-hero__lead {
  max-inline-size: var(--text-body-measure);
  margin-inline: auto;
  color: var(--color-text-muted);
  font-size: var(--text-lead-size);
}

.home-hero__trust {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: var(--space-3);
  margin-block-start: var(--space-6);
  margin-block-end: var(--space-0);
  color: var(--color-text-muted);
  font-size: var(--text-small-size);
  text-align: start;
}
```

- [ ] **Step 4: Добавить desktop override в существующий `64rem` media block**

В тот же `@media (min-width: 64rem)`, где задаются колонки `.home-hero__inner`, добавить:

```css
.home-hero__copy {
  text-align: start;
}

.home-hero__lead,
.home-hero__actions {
  margin-inline: var(--space-0);
}

.home-hero__actions {
  justify-items: start;
}

.home-hero__trust {
  justify-content: flex-start;
}
```

- [ ] **Step 5: Подтвердить GREEN и отсутствие соседней регрессии**

Run:

```powershell
pnpm test tests/styles/home-hero-alignment.test.js tests/styles/compact-actions.test.js tests/styles/home-redesign.test.js
```

Expected: все три файла PASS; вертикальная иерархия кнопок сохранена.

- [ ] **Step 6: Зафиксировать исходники и тест**

```powershell
git add src/styles/pages.css tests/styles/home-hero-alignment.test.js
git commit -m "style: adapt home hero alignment by viewport"
```

---

### Task 2: Production gate и реальный responsive QA

**Files:**
- Verify: `src/styles/pages.css`
- Verify: `tests/styles/home-hero-alignment.test.js`
- Verify: generated `index.html`

**Interfaces:**
- Consumes: Task 1.
- Produces: проверенный responsive hero и синхронизированную production-сборку.

- [ ] **Step 1: Перегенерировать страницы и проверить diff**

Run:

```powershell
pnpm generate
git diff --check
```

Expected: генерация завершается успешно; `git diff --check` exit 0. Поскольку меняется только CSS, содержимое `index.html` остаётся стабильным.

- [ ] **Step 2: Запустить полный gate**

Run:

```powershell
pnpm verify
```

Expected: все Vitest-тесты PASS, Vite build успешен, verifier подтверждает 21 HTML-страницу.

- [ ] **Step 3: Проверить hero во встроенном Browser**

На `index.html` после завершения layout transition проверить:

```text
320×900 и 390×844:
- center X eyebrow, H1, lead и action group совпадает с center X text column;
- trust group центрирована, её внутренний текст читается слева;
- horizontal overflow = 0.

1024×900 и 1280×900:
- left X eyebrow, H1, lead, action group и trust group совпадают с допуском 1px;
- media остаётся в правой колонке и не перекрывает copy;
- horizontal overflow = 0;
- console errors = 0.
```

- [ ] **Step 4: Если найден дефект, выполнить отдельный RED→GREEN**

Зафиксировать продемонстрированный дефект минимальным падающим тестом, подтвердить RED, внести одну корневую правку и повторить затронутый Browser-сценарий и `pnpm verify`.

- [ ] **Step 5: Финальная проверка и commit при наличии generated delta**

Run:

```powershell
git status --short
git diff --check
pnpm verify
```

Если генератор изменил tracked HTML, выполнить:

```powershell
git add *.html
git commit -m "build: refresh generated clinic pages"
```

Не добавлять `dist/`, `.serena/`, временные скриншоты или preview-журналы.
