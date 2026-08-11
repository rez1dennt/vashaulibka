# Task 10 report — handoff, release gate and Browser QA

## Status

Подготовлен русскоязычный технический handoff и уточнён чек-лист недостающего контента. После первичной release-проверки выполнен отдельный review-remediation цикл: выявленные замечания закрыты отдельными RED→GREEN тестами, а продемонстрированный в Browser каскадный дефект мобильной CTA исправлен и перепроверен на затронутой матрице.

Сайт не считается юридически гарантированно полным: недостающие входные данные и обязательная предпубликационная проверка юристом зафиксированы в `CONTENT_CHECKLIST.md`.

## Handoff-документы

- Создан `README.md`: архитектура, команды, `dist/`, карта данных/контента, поведение `SITE_ORIGIN`, граница МИС, приватность, `noindex`, иллюстративные hero и правовой disclaimer.
- Обновлён существовавший `CONTENT_CHECKLIST.md`, без удаления ранее нерешённых пунктов.
- Реальный домен и canonical URL не выдуманы.
- Прямо зафиксировано, что `prices.html` и `specialists.html` остаются с `noindex` и вне наполненного sitemap до получения обязательных данных.

## Fresh automated release gate

Финальный запуск выполнен после всех handoff-правок, без `SITE_ORIGIN`:

- `pnpm verify` — exit 0;
- Vitest: 10 files passed, 141 tests passed;
- Vite 8.2.1: 35 modules transformed, build exit 0, warnings/errors нет;
- production verifier: `Verified 21 HTML pages`;
- фактическое число `dist/*.html`: 21;
- `git diff --check` — exit 0; напечатаны только имеющиеся предупреждения Git о LF/CRLF;
- canonical и localhost/loopback/example/`.invalid`/`.test` production-hosts в `public` и `dist`: 0;
- forms: 0; iframes: 0; внешние active script/style/font/image/iframe ссылки: 0;
- маркеры analytics/trackers/pixels: 0;
- ожидаемые ассеты в `dist`: AVIF 8, WebP 8, SVG 2, PDF 2, PNG 1; пропусков относительно `public`: 0.

## In-app Browser production-preview QA

Встроенный Codex In-app Browser подключился успешно. Основная матрица пройдена на production preview `http://127.0.0.1:4173`; для чистого первичного cookie-состояния и финальных интеракций использован отдельный локальный origin `http://127.0.0.1:43127` с той же production-сборкой.

### Route/viewport matrix

Пройдено 45/45 проверок, failed 0:

- 7 обязательных routes (`index`, `services`, `specialists`, `contacts`, `patients`, `guarantees`, `privacy`) на 1440×900, 1024×768, 768×1024, 390×844 и 360×800: 35;
- 5 spot routes (`prices`, `reviews`, `vacancies`, `complaints`, `standards`) на 1440×900 и 360×800: 10.

Для каждой точки проверены загрузка, title, точный H1, hero-класс/фон, точный видимый disclaimer об иллюстративном изображении, 1 `main`, 1 H1, именованные navigation/dialog, duplicate IDs, горизонтальное переполнение, обрезанные видимые контролы, наличие кнопки записи, отсутствие form/input и внешних active DOM resources. Browser console errors после матрицы и после финальных интеракций: 0 в обеих QA-вкладках.

В Browser зафиксированы репрезентативные viewport-скриншоты главной на 1440×900 и услуг на 360×800. На обоих видимы корректные hero, disclaimer, header/navigation и адаптивная компоновка.

### Interaction evidence

- Mobile menu: `aria-expanded` false → true → false; переход 0.28 s; видимая геометрия в пределах viewport; body scroll lock; фокус переходит на внутреннюю кнопку закрытия; Shift+Tab/Tab замыкают фокус между первым и последним контролами; Escape закрывает и возвращает фокус toggle.
- Scroll-lock geometry: системный scrollbar меняет `clientWidth` 375 → 390, но body получает `padding-right: 15px`; rect-координаты brand, H1, hero container и footer container до/во время/после совпадают. Визуального width jump нет.
- Appointment dialog: modal/named, 2 точных `tel:`-ссылки, будни 10:00–19:00, суббота 10:00–14:00, воскресенье выходной, form/input 0, focus trap/return и Escape проходят.
- Cookie banner: на чистом origin первично видим текст об отключённых необязательных технологиях; reject скрывает и сохраняется после navigation; settings повторно открывает; accept скрывает и сохраняется; settings снова открывает.
- Vision mode: class/`aria-pressed` включаются, body font 19.2 px, overflow 0; состояние сохраняется между страницами и корректно выключается.
- Services: desktop показывает tabs и скрывает disclosures; click, ArrowRight и Home меняют selected tab/panel и фокус. Mobile скрывает tabs, показывает disclosures; вторая панель открывается, document overflow 0.
- Narrow table at 360 px: регион 319 px client width / 704 px scroll width, `overflow-x: auto`, document overflow 0, `role="region"`, имя и `tabindex=0`.
- Keyboard: 17/17 видимых ссылок/кнопок представительной desktop-страницы получили keyboard focus; roving tabs имеют `tabindex` 0/-1/-1 и переключаются стрелками. Skip link при focus-visible находится в viewport, `transform: none`, outline solid 3 px; его href `#main-content` существует и активация прокручивает main к верху viewport.

### Assets, accessibility and privacy evidence

- Browser `pageAssets` на services наблюдал только 3 same-origin ассета: 1 JS, 1 CSS, 1 SVG; fonts 0, remote 0.
- DOM-аудит матрицы и production verifier не нашли аналитики, трекеров, удалённых шрифтов, automatic maps, forms, iframe или других remote active resources.
- Accessibility snapshot подтверждает именованную основную навигацию, breadcrumbs, dialog, tablist/tabs/panel и semantic headings. Матрица подтвердила один `main`, один H1 и отсутствие duplicate IDs.
- Обнаружено 8 различных hero-вариантов (`home`, `about`, `services`, `specialists`, `prices`, `reviews`, `vacancies`, `contacts`), каждый со своим AVIF/WebP и одинаковым точным видимым disclaimer.

## Reduced-motion boundary

Встроенный Browser в этой сессии предоставил только browser capabilities `visibility` и `viewport`; API для смены `prefers-reduced-motion` отсутствует. В текущей среде `matchMedia("(prefers-reduced-motion: reduce)")` равен false, поэтому переключённое состояние не было интерактивно эмулировано.

Как доступная проверка загруженного production CSS в Browser CSSOM подтвердила реально присутствующее media-правило, которое ставит `scroll-behavior: auto`, мгновенную длительность animation/transition, одну итерацию анимации и нулевую задержку. Тот же контракт проверен автотестом `design-system.test.js` в составе 141 зелёного теста. Невозможность Browser-эмуляции остаётся QA-ограничением; это не является выявленным дефектом сайта.

## Release-review remediation

Все review-замечания проведены через отдельные RED→GREEN серии до реализации:

- mobile menu/appointment overlays: 6 ожидаемых падений → backdrops, закрытие по подложке, внутренняя кнопка закрытия, динамическое имя toggle, безопасная нижняя CTA и `tel:` fallback → focused green;
- progressive enhancement/no-JS: 5 ожидаемых падений → сырой HTML со всеми видимыми панелями, стартовое сворачивание в `initTabs`/`initDisclosures`, ранний `no-js` → `js` switch и доступная статическая навигация → focused green;
- information architecture/header: 5 ожидаемых падений → точные ссылки «Главная» и «Информация для пациентов», карточка услуг в patient hub и адаптивная шапка для 1024/1280/1440 → focused green;
- legal/operations handoff: 5 ожидаемых падений → честный статус онлайн-записи, подтверждённые часы в JSON-LD, публичные формулировки без внутреннего имени файла, checklist хостинга/логов, Node/pnpm pin → focused green;
- дополнительные review-уточнения: 2 ожидаемых падения → header action как raw `tel:`-ссылка и opacity в переходе подложки → focused green;
- Browser продемонстрировал, что поздний `.button` перекрывал скрытие нижней CTA после 768 px; отдельный RED-тест на специфичность воспроизвёл дефект, `a.mobile-appointment` исправил каскад, focused тест и Browser rerun стали зелёными;
- динамическая no-JS проверка выявила краткий переход из старого drawer-state; отдельный RED-тест и `transition: none` обеспечили немедленное доступное состояние.

### Affected Browser rerun

Production preview: `http://127.0.0.1:43129`.

- Главная на 360×800, 390×844, 768×1024, 1024×768, 1280×900 и 1440×900: document/nav overflow 0, clipped controls 0; CTA видима ровно до 768 px включительно, burger используется на 1024 px, двухрядная desktop-шапка не переполняется на 1280 px, однорядная — на 1440 px.
- `services.html`, `patients.html`, `privacy.html` на 360×800 и 1280×900: 6/6 точек с правильным H1, overflow 0, clipped controls 0, девятью основными ссылками; patient hub содержит карточку `services.html`, публичная privacy-страница не содержит `CONTENT_CHECKLIST.md`.
- Raw HTML `services.html`: класс `no-js`, 6 service/tab panels, hidden 0, все disclosure controls исходно expanded. Immediate computed no-JS state на 360 px: `position: static`, `visibility: visible`, `transform: none`, `pointer-events: auto`, `transition: none`, 10/10 ссылок видимы, document overflow 0; header appointment остаётся `tel:+74722215356`.
- Mobile menu на 390 px: label «Открыть меню» → «Закрыть меню» → «Открыть меню»; фокус на внутренней кнопке закрытия и возврат на toggle; backdrop покрывает 390×844, opacity 1, transition включает opacity 0.16 s, z 90 ниже drawer z 100; клик по реально найденной в точке подложке закрывает меню; внутренняя кнопка и Escape также закрывают; body получает 15 px scroll compensation, brand остаётся на x=12, overflow 0.
- Cookie/overlay coexistence: cookie banner расположен выше нижней CTA; вычисленные слои dialog 300, cookie 250, CTA 30; reject сохраняет `rejected`, settings повторно открывает banner.
- Console: 0 errors/warnings. Network последней страницы: только same-origin HTML, JS, CSS, SVG и AVIF; удалённых active resources нет.

После превращения appointment actions в raw `tel:` fallback встроенный Browser отклонил прямой клик как потенциальный внешний звонок. Ограничение не обходилось. Свежий автотест `intercepts the mobile telephone fallback only after dialog enhancement` подтверждает `preventDefault`, открытие dialog и закрытие; отдельные автотесты подтверждают backdrop close, focus return/trap, Escape и отсутствие формы. Browser дополнительно подтвердил новый текст dialog и порядок слоёв, но прямой post-conversion click в Browser остаётся непроверенным из-за safety-ограничения инструмента.

## Self-review

- Scoped diff содержит release-review изменения шаблона, контента, интеракций, стилей, тестов, сгенерированных 21 HTML-страниц и handoff-документов.
- Пути в README сверены с фактической структурой, включая `src/styles/` и `public/documents/`.
- Все требуемые нерешённые пункты сохранены и уточнены.
- Данные клиники и ассеты не менялись; публичные legal-тексты изменены только для удаления внутреннего имени файла и честного описания ещё не выбранной инфраструктуры.
- Production-домен, прейскурант, квалификации, отзывы, вакансии и параметры МИС не выдуманы.
