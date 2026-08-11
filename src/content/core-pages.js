import { CLINIC, CONTACTS, HOURS } from '../data/clinic.js';
import { renderIcon } from '../templates/icons.js';
import { ABOUT_PAGE } from './about-page.js';
import { HOME_PAGE } from './home-page.js';

const escapeHtml = (value) => String(value).replace(/[&<>\"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}[character]));

const contactChannels = [
  ...CONTACTS.phones.map((phone) => ({
    href: phone.href,
    caption: 'Позвонить в клинику',
    value: phone.label,
    icon: 'phone',
  })),
  {
    href: CONTACTS.emailHref,
    caption: 'Электронная почта',
    value: CONTACTS.email,
    icon: 'mail',
  },
]
  .map((channel) => [
    `<a class="contact-channel" href="${escapeHtml(channel.href)}">`,
    `<span class="contact-channel__icon">${renderIcon(channel.icon)}</span>`,
    `<span class="contact-channel__copy"><small>${escapeHtml(channel.caption)}</small><strong>${escapeHtml(channel.value)}</strong></span>`,
    `<span class="contact-channel__arrow">${renderIcon('arrow')}</span>`,
    '</a>',
  ].join(''))
  .join('');

const contactHours = [
  HOURS.weekdays,
  HOURS.saturday,
  HOURS.sunday,
  { label: 'Перерыв', value: HOURS.breakNote },
]
  .map((entry) => `<div><dt>${entry.label}</dt><dd>${entry.value}</dd></div>`)
  .join('');

const routeHref = `https://yandex.ru/maps/?text=${encodeURIComponent(CLINIC.activityAddress)}`;

const contactsBody = [
  '<section class="section contact-page"><div class="container">',
  '<div class="contact-page__grid">',
  '<article class="contact-location">',
  `<span class="contact-location__icon">${renderIcon('pin')}</span>`,
  '<div class="contact-location__copy"><p class="eyebrow">Адрес клиники</p><h2>Как нас найти</h2>',
  `<address>${escapeHtml(CLINIC.activityAddress)}</address></div>`,
  `<a class="button button-secondary contact-location__route" href="${escapeHtml(routeHref)}" target="_blank" rel="noopener">Построить маршрут${renderIcon('arrow', 'button-icon')}</a>`,
  '</article>',
  '<section class="contact-channels" aria-labelledby="contact-channels-title">',
  '<p class="eyebrow">Связь</p><h2 id="contact-channels-title">Позвонить или написать</h2>',
  `<div class="contact-channels__list">${contactChannels}</div>`,
  '</section>',
  '</div>',
  '<section class="contact-schedule" aria-labelledby="contact-schedule-title">',
  '<div class="contact-schedule__heading">',
  `<span class="contact-schedule__icon">${renderIcon('clock')}</span>`,
  '<div><p class="eyebrow">Режим работы</p><h2 id="contact-schedule-title">Когда мы принимаем</h2></div>',
  '</div>',
  `<dl class="contact-hours">${contactHours}</dl>`,
  '<div class="contact-schedule__action"><p>Для записи используйте официальные телефоны клиники.</p>',
  `<a class="button button-primary" href="${escapeHtml(CONTACTS.phones[0].href)}" data-appointment-open>${renderIcon('calendar', 'button-icon')}Записаться на приём</a></div>`,
  '</section>',
  '</div></section>',
].join('');

export const CORE_PAGES = Object.freeze([
  HOME_PAGE,
  ABOUT_PAGE,
  {
    file: 'contacts.html',
    title: 'Контакты стоматологии',
    description: 'Адрес, телефоны, электронная почта и режим работы стоматологии в Белгороде.',
    heading: 'Контакты клиники',
    lead: 'Официальные способы связи и подтверждённый режим работы.',
    heroImage: 'contacts',
    noindex: false,
    body: contactsBody,
  },
]);
