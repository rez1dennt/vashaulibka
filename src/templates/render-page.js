import { CLINIC, CONTACTS, HOURS, LICENSE } from '../data/clinic.js';

const nav = [
  ['index.html', 'Главная'],
  ['about.html', 'О клинике'],
  ['services.html', 'Наши услуги'],
  ['specialists.html', 'Специалисты'],
  ['prices.html', 'Цены'],
  ['reviews.html', 'Отзывы'],
  ['vacancies.html', 'Вакансии'],
  ['patients.html', 'Информация для пациентов'],
  ['contacts.html', 'Контакты'],
];

const HERO_ILLUSTRATION_NOTE = 'Иллюстративное изображение — не фотография помещений клиники.';

const esc = (value) => String(value).replace(/[&<>"]/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}[char]));

export function renderPage(page) {
  const robots = page.noindex
    ? '<meta name="robots" content="noindex, follow">'
    : '<meta name="robots" content="index, follow">';
  const active = page.file;
  const navHtml = nav
    .map(([href, label]) => `<a href="${href}"${href === active ? ' aria-current="page"' : ''}>${label}</a>`)
    .join('');
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    name: CLINIC.name,
    legalName: CLINIC.legalName,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'ул. Макаренко, д. 1г',
      addressLocality: 'Белгород',
      addressRegion: 'Белгородская область',
      addressCountry: 'RU',
    },
    telephone: CONTACTS.phones.map((item) => item.label),
    email: CONTACTS.email,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '10:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '10:00',
        closes: '14:00',
      },
    ],
    identifier: [
      { '@type': 'PropertyValue', propertyID: 'ОГРН', value: CLINIC.ogrn },
      { '@type': 'PropertyValue', propertyID: 'Лицензия', value: LICENSE.number },
    ],
  });
  const appointmentHours = [HOURS.weekdays, HOURS.saturday, HOURS.sunday]
    .map((entry) => `<div><dt>${esc(entry.label)}</dt><dd>${esc(entry.value)}</dd></div>`)
    .join('');

  return [
    '<!doctype html><html class="no-js" lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">',
    robots,
    `<title>${esc(page.title)} — ${esc(CLINIC.name)}</title><meta name="description" content="${esc(page.description)}">`,
    `<meta property="og:type" content="website"><meta property="og:title" content="${esc(page.title)}"><meta property="og:description" content="${esc(page.description)}">`,
    '<link rel="icon" href="assets/icons/favicon.svg" type="image/svg+xml"><script>document.documentElement.classList.replace(\'no-js\',\'js\')</script><link rel="stylesheet" href="/src/styles/main.css">',
    `<script type="application/ld+json">${schema}</script></head><body data-page="${esc(page.file)}">`,
    '<a class="skip-link" href="#main-content">К основному содержимому</a><header class="site-header"><div class="topbar"><button type="button" data-vision-toggle>Версия для слабовидящих</button>',
    `<span>${esc(CLINIC.activityAddress)}</span><span>${esc(HOURS.weekdays.value)}</span></div><div class="header-main">`,
    `<a class="brand" href="index.html" aria-label="${esc(CLINIC.name)}, главная"><img src="assets/icons/logo.svg" alt="" width="56" height="56"><span>${esc(CLINIC.name)}</span></a>`,
    '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-menu"><span class="sr-only" data-menu-toggle-label>Открыть меню</span></button><div class="menu-backdrop" data-menu-backdrop aria-hidden="true"></div>',
    `<nav id="main-menu" aria-label="Основная навигация"><button class="menu-close" type="button" data-menu-close aria-label="Закрыть меню">×</button>${navHtml}<a class="button button-primary" href="${CONTACTS.phones[0].href}" data-appointment-open>Запись на приём</a></nav></div></header>`,
    `<main id="main-content"><section class="page-hero page-hero--${esc(page.heroImage)}"><div class="container"><nav aria-label="Хлебные крошки"><a href="index.html">Главная</a><span aria-hidden="true">/</span><span>${esc(page.heading)}</span></nav><h1>${esc(page.heading)}</h1>${page.lead ? `<p>${esc(page.lead)}</p>` : ''}<p class="hero-illustration-note">${HERO_ILLUSTRATION_NOTE}</p></div></section>${page.body}</main>`,
    `<footer class="site-footer"><div class="container footer-grid"><section><h2>${esc(CLINIC.name)}</h2><p>Стоматологическая помощь в пределах действующей лицензии.</p></section><section><h2>Пациентам</h2><a href="patients.html">Информация для пациентов</a><a href="privacy.html">Политика конфиденциальности</a><button type="button" data-cookie-settings>Настройки cookies</button></section><section><h2>Контакты</h2>${CONTACTS.phones.map((phone) => `<a href="${phone.href}">${esc(phone.label)}</a>`).join('')}<a href="${CONTACTS.emailHref}">${esc(CONTACTS.email)}</a></section></div></footer>`,
    `<a class="mobile-appointment button button-primary" href="${CONTACTS.phones[0].href}" data-appointment-open>Запись на приём</a>`,
    '<div id="appointment-dialog" class="dialog" role="dialog" aria-modal="true" aria-labelledby="appointment-title" hidden><div class="dialog__backdrop" data-dialog-backdrop aria-hidden="true"></div><div class="dialog__panel"><button type="button" data-dialog-close aria-label="Закрыть">×</button><h2 id="appointment-title">Запись на приём</h2><p>Онлайн-запись подключается. Пока запишитесь по телефону:</p>',
    CONTACTS.phones.map((phone) => `<a class="button button-secondary" href="${phone.href}">${esc(phone.label)}</a>`).join(''),
    `<h3>Режим работы</h3><dl class="definition-list definition-list--compact">${appointmentHours}</dl><p><strong>${esc(HOURS.breakNote)}</strong></p></div></div>`,
    '<div class="cookie-banner" data-cookie-banner hidden><p>Сайт использует необходимые технологии хранения настроек. Необязательные технологии отключены.</p><button type="button" data-cookie-reject>Отклонить необязательные</button><button type="button" data-cookie-accept>Разрешить выбранные</button></div><script type="module" src="/src/js/main.js"></script></body></html>',
  ].join('');
}
