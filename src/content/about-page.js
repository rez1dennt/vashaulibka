import { CLINIC_PHOTOS } from '../data/clinic-photos.js';
import { CLINIC, CONTACTS, HOURS, LICENSE } from '../data/clinic.js';
import { SERVICES } from '../data/services.js';
import { STAFF } from '../data/staff.js';
import { renderIcon } from '../templates/icons.js';

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const renderPicture = (name, className) => [
  `<picture class="${className}">`,
  `<source srcset="assets/images/clinic-${name}.avif" type="image/avif">`,
  `<img src="assets/images/clinic-${name}.webp" alt="${escapeHtml(CLINIC_PHOTOS[name].alt)}" width="1280" height="720" loading="lazy">`,
  '</picture>',
].join('');

const registrationYear = CLINIC.registeredSince.match(/\d{4}/)?.[0] ?? CLINIC.registeredSince;

const values = [
  ['shield', 'Лицензированная помощь', `Статус медицинской лицензии: ${LICENSE.status.toLowerCase()}.`],
  ['info', 'Понятная информация', 'Направления помощи и документы для пациентов собраны на сайте.'],
  ['team', 'Опубликованная команда', 'Имена и должности сотрудников доступны до записи на приём.'],
  ['document', 'Права пациента', 'Порядок обращений и обязательная информация вынесены в отдельный раздел.'],
];

const valuesMarkup = values.map(([icon, title, text]) => [
  '<article class="about-value">',
  renderIcon(icon),
  `<div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div>`,
  '</article>',
].join('')).join('');

const facts = [
  ['calendar', registrationYear, 'Регистрация юридического лица'],
  ['tooth', SERVICES.length, 'Направления помощи по лицензии'],
  ['team', STAFF.length, 'Сотрудников в опубликованном списке'],
  ['shield', LICENSE.status, 'Статус медицинской лицензии'],
];

const factsMarkup = facts.map(([icon, value, label]) => [
  '<div class="about-fact">',
  renderIcon(icon),
  `<div><dt>${escapeHtml(value)}</dt><dd>${escapeHtml(label)}</dd></div>`,
  '</div>',
].join('')).join('');

const servicesMarkup = SERVICES.map((service, index) => [
  `<article class="about-service${index === 0 ? ' about-service--featured' : ''}">`,
  `<span class="about-service__icon">${renderIcon(index === 2 ? 'team' : 'tooth')}</span>`,
  `<div><h3>${escapeHtml(service.title)}</h3><p>${escapeHtml(service.summary)}</p></div>`,
  `<a class="text-link" href="services.html" aria-label="Подробнее: ${escapeHtml(service.title)}">Подробнее об услугах${renderIcon('arrow', 'button-icon')}</a>`,
  '</article>',
].join('')).join('');

const staffMarkup = STAFF.map((person) => [
  '<article class="about-team__person">',
  `<span class="about-team__avatar" aria-hidden="true">${escapeHtml(person.initials)}</span>`,
  `<div><h3>${escapeHtml(person.name)}</h3><p class="about-team__role">${escapeHtml(person.role)}</p></div>`,
  '</article>',
].join('')).join('');

const hoursMarkup = [HOURS.weekdays, HOURS.saturday, HOURS.sunday]
  .map((entry) => `<div><dt>${escapeHtml(entry.label)}</dt><dd>${escapeHtml(entry.value)}</dd></div>`)
  .join('')
  + `<div class="about-hours__note"><dt>Режим</dt><dd>${escapeHtml(HOURS.breakNote)}</dd></div>`;

const body = [
  '<section class="about-section about-mission"><div class="container about-mission__grid">',
  '<div class="about-mission__copy"><p class="eyebrow">Наша задача</p><h2>Сделать обращение за стоматологической помощью понятным</h2><p>До визита пациент может проверить направления помощи, состав команды, лицензию и порядок обращения в клинику.</p><a class="button button-secondary" href="license.html">Проверить лицензию</a></div>',
  `<div class="about-values">${valuesMarkup}</div></div></section>`,
  `<section class="about-facts"><div class="container"><h2 class="sr-only">Подтверждённые сведения</h2><dl class="about-facts__grid">${factsMarkup}</dl></div></section>`,
  '<section class="about-section about-space"><div class="container about-space__grid"><div class="about-space__copy"><p class="eyebrow">Клиника в Белгороде</p><h2>Вся информация для визита собрана заранее</h2>',
  `<ul class="about-checklist"><li>${escapeHtml(CLINIC.activityAddress)}</li><li>${escapeHtml(HOURS.weekdays.label)}: ${escapeHtml(HOURS.weekdays.value)}</li><li>${escapeHtml(HOURS.saturday.label)}: ${escapeHtml(HOURS.saturday.value)}</li></ul>`,
  `<div class="about-actions"><a class="button button-primary" href="${CONTACTS.phones[0].href}" data-appointment-open>${renderIcon('calendar', 'button-icon')}Записаться на приём</a><a class="button button-secondary" href="contacts.html">Контакты</a></div></div>`,
  `<figure class="about-gallery">${renderPicture('services', 'about-gallery__item about-gallery__item--primary')}${renderPicture('home', 'about-gallery__item')}${renderPicture('contacts', 'about-gallery__item')}</figure></div></section>`,
  `<section class="about-section about-services"><div class="container"><div class="about-section__heading"><div><p class="eyebrow">Направления помощи</p><h2>Стоматологическая помощь по действующей лицензии</h2></div><a class="text-link" href="services.html">Все услуги${renderIcon('arrow', 'button-icon')}</a></div><div class="about-services__grid">${servicesMarkup}</div></div></section>`,
  `<section class="about-section about-team"><div class="container"><div class="about-section__heading"><div><p class="eyebrow">Команда</p><h2>Сотрудники клиники</h2></div><a class="text-link" href="specialists.html">Сведения о специалистах${renderIcon('arrow', 'button-icon')}</a></div><div class="about-team__list">${staffMarkup}</div><p class="about-team__notice">Сведения опубликованы по документам, предоставленным клиникой.</p></div></section>`,
  '<section class="about-section about-license"><div class="container about-license__grid">',
  '<a class="about-license__preview" href="documents/license-registry-extract.pdf" target="_blank" rel="noopener"><img src="assets/documents/license-registry-extract.webp" alt="Выписка из реестра лицензий" width="720" height="960" loading="lazy"><span>Открыть выписку в PDF</span></a>',
  `<div class="about-license__content"><p class="eyebrow">Официальные документы</p><h2>Медицинская лицензия</h2><dl class="about-license__facts"><div><dt>Номер</dt><dd>${escapeHtml(LICENSE.number)}</dd></div><div><dt>Статус</dt><dd>${escapeHtml(LICENSE.status)}</dd></div><div><dt>Лицензирующий орган</dt><dd>${escapeHtml(LICENSE.authority)}</dd></div><div><dt>Приказ</dt><dd>${escapeHtml(LICENSE.order)}</dd></div></dl><div class="about-actions"><a class="button button-primary" href="license.html">Все сведения о лицензии</a><a class="about-license__secondary text-link" href="documents/ogrn-certificate.pdf" target="_blank" rel="noopener">Свидетельство ОГРН${renderIcon('arrow', 'button-icon')}</a></div></div></div></section>`,
  '<section class="about-section about-legal"><div class="container"><div class="about-section__heading"><div><p class="eyebrow">Реквизиты</p><h2>Юридические сведения</h2></div></div>',
  `<dl class="about-legal__grid"><div><dt>Полное наименование</dt><dd>${escapeHtml(CLINIC.legalName)}</dd></div><div><dt>ОГРН</dt><dd>${escapeHtml(CLINIC.ogrn)}</dd></div><div><dt>ИНН</dt><dd>${escapeHtml(CLINIC.inn)}</dd></div><div><dt>Адрес регистрации</dt><dd>${escapeHtml(CLINIC.registryAddress)}</dd></div><div><dt>Адрес клиники</dt><dd>${escapeHtml(CLINIC.activityAddress)}</dd></div></dl></div></section>`,
  '<section class="about-section about-cta"><div class="container about-cta__panel"><div><p class="eyebrow">Запись на приём</p><h2>Выберите удобный способ связи</h2><p>Онлайн-запись подключается. Пока запишитесь по телефону.</p>',
  `<div class="about-cta__actions"><a class="button button-primary" href="${CONTACTS.phones[0].href}" data-appointment-open>${renderIcon('calendar', 'button-icon')}Записаться на приём</a><div class="about-cta__phones">${CONTACTS.phones.map((phone) => `<a class="button button-secondary" href="${phone.href}">${escapeHtml(phone.label)}</a>`).join('')}</div></div></div><div class="about-cta__schedule"><div class="about-cta__schedule-heading">${renderIcon('clock')}<h3>Режим работы</h3></div><dl class="about-hours">${hoursMarkup}</dl></div></div></section>`,
].join('');

export const ABOUT_PAGE = Object.freeze({
  file: 'about.html',
  title: 'О стоматологической клинике',
  description: `О клинике ${CLINIC.name}: лицензированные направления помощи, команда, документы и реквизиты.`,
  heading: 'О клинике',
  lead: 'Лицензированная стоматологическая помощь и подтверждённая информация для пациентов в Белгороде.',
  heroImage: 'about',
  noindex: false,
  body,
});
