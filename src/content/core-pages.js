import { CLINIC, CONTACTS, HOURS } from '../data/clinic.js';
import { ABOUT_PAGE } from './about-page.js';
import { HOME_PAGE } from './home-page.js';

const phoneLinks = CONTACTS.phones
  .map((phone) => `<a class="button button-secondary" href="${phone.href}">${phone.label}</a>`)
  .join('');

const hoursList = [HOURS.weekdays, HOURS.saturday, HOURS.sunday]
  .map((entry) => `<div><dt>${entry.label}</dt><dd>${entry.value}</dd></div>`)
  .join('');

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
    body: `<section class="section"><div class="container contact-grid"><article class="card"><h2>Адрес</h2><p>${CLINIC.activityAddress}</p></article><article class="card"><h2>Связаться</h2><div class="contact-actions">${phoneLinks}<a class="button button-secondary" href="${CONTACTS.emailHref}">${CONTACTS.email}</a></div></article><article class="card"><h2>Режим работы</h2><dl class="definition-list definition-list--compact">${hoursList}</dl><p><strong>${HOURS.breakNote}</strong></p></article></div></section>`,
  },
]);
