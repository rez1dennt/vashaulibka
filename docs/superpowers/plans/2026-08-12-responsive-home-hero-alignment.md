# Responsive Home Hero Actions Alignment Plan

**Goal:** Держать весь hero, включая кнопки, слева на всех ширинах.

## Task 1: RED→GREEN

- Обновить `tests/styles/home-hero-alignment.test.js`: потребовать `margin-inline: var(--space-0)` и `justify-items: start` у `.home-hero__actions` без media override.
- Добавить отрицательный контракт: `.home-hero__copy`, `.home-hero__lead` и `.home-hero__trust` не получают новых правил выравнивания.
- Запустить focused-тест и подтвердить RED на текущем ошибочном CSS.
- Удалить правила, затрагивающие текст и лицензию; перенести левое выравнивание `.home-hero__actions` в базовое правило.
- Повторить focused suite до GREEN.

## Task 2: Проверка

- Запустить `pnpm verify`.
- Проверить главную в Browser на 320, 390, 1024 и 1280px.
- Подтвердить: кнопки, текст и лицензия слева на всех ширинах; overflow отсутствует.
- Зафиксировать исправление отдельным commit.
