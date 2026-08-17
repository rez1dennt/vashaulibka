import { CONTACTS } from '../data/clinic.js';
import { SERVICES } from '../data/services.js';
import { INCOMPLETE_CONTENT } from '../data/staff.js';
import { SPECIALISTS_PAGE } from './specialists-page.js';

const serviceDetails = (service) => `<p>${service.summary}</p><ul>${service.items.map((item) => `<li>${item}</li>`).join('')}</ul><p class="service-price-status"><strong>${service.priceStatus}</strong></p>`;

const serviceTabs = `<div class="services-tabs-view"><div class="service-tabs"><div role="tablist" aria-label="Лицензированные направления">${SERVICES.map((service, index) => `<button type="button" role="tab" id="services-tab-${service.slug}" aria-selected="${index === 0}" tabindex="${index === 0 ? 0 : -1}" aria-controls="services-panel-${service.slug}">${service.title}</button>`).join('')}</div><div>${SERVICES.map((service) => `<section class="card" id="services-panel-${service.slug}" role="tabpanel" aria-labelledby="services-tab-${service.slug}"><h2>${service.title}</h2>${serviceDetails(service)}</section>`).join('')}</div></div></div>`;

const serviceDisclosures = `<div class="services-disclosures-view">${SERVICES.map((service) => `<article class="card service-disclosure"><h2><button type="button" data-disclosure-button id="services-disclosure-${service.slug}" aria-expanded="true" aria-controls="services-disclosure-panel-${service.slug}">${service.title}</button></h2><div class="disclosure-panel" id="services-disclosure-panel-${service.slug}" role="region" aria-labelledby="services-disclosure-${service.slug}">${serviceDetails(service)}</div></article>`).join('')}</div>`;

const serviceAnchors = SERVICES
  .map((service) => `<span class="search-anchor" id="service-${service.slug}" aria-hidden="true"></span>`)
  .join('');

const priceDisclosures = SERVICES.map((service) => `<article class="card price-disclosure"><h2><button type="button" data-disclosure-button id="price-disclosure-${service.slug}" aria-expanded="true" aria-controls="price-panel-${service.slug}">${service.title}</button></h2><div class="disclosure-panel" id="price-panel-${service.slug}" role="region" aria-labelledby="price-disclosure-${service.slug}">${serviceDetails(service)}</div></article>`).join('');

const officialContactActions = `<div class="contact-actions">${CONTACTS.phones.map((phone) => `<a class="button button-secondary" href="${phone.href}">${phone.label}</a>`).join('')}<a class="button button-secondary" href="${CONTACTS.emailHref}">${CONTACTS.email}</a></div>`;

export const SERVICE_PAGES = Object.freeze([
  {
    file: 'services.html',
    title: 'Лицензированные услуги',
    description: 'Три лицензированных направления стоматологической помощи ООО «Стоматология Ваша улыбка».',
    heading: 'Лицензированные услуги',
    lead: 'Терапевтическая и ортопедическая стоматология, а также стоматология в рамках работы зубного врача.',
    heroImage: 'services',
    noindex: false,
    body: `<section class="section"><div class="container">${serviceAnchors}${serviceTabs}${serviceDisclosures}</div></section>`,
  },
  SPECIALISTS_PAGE,
  {
    file: 'prices.html',
    title: 'Стоимость стоматологических услуг',
    description: 'Статус публикации стоимости по лицензированным направлениям стоматологической помощи.',
    heading: 'Стоимость услуг',
    lead: 'Стоимость по каждому направлению уточняется у администратора.',
    heroImage: 'prices',
    noindex: INCOMPLETE_CONTENT.prices.noindex,
    body: `<section class="section"><div class="container"><div class="notice"><h2>Прейскурант готовится к публикации</h2><p>${INCOMPLETE_CONTENT.prices.reason}</p></div><div class="price-disclosures">${priceDisclosures}</div></div></section>`,
  },
  {
    file: 'reviews.html',
    title: 'Отзывы о стоматологии',
    description: 'Статус публикации подтверждённых отзывов о стоматологической клинике.',
    heading: 'Отзывы',
    lead: 'В предоставленных материалах нет подтверждённых отзывов для публикации.',
    heroImage: 'reviews',
    noindex: false,
    body: `<section class="section"><div class="container"><article class="notice empty-state"><h2>Отзывы пока не опубликованы</h2><p>Вместо неподтверждённых публикаций оставляем официальные способы связи с клиникой.</p>${officialContactActions}</article></div></section>`,
  },
  {
    file: 'vacancies.html',
    title: 'Работа в стоматологии',
    description: 'Статус публикации открытых вакансий ООО «Стоматология Ваша улыбка».',
    heading: 'Работа в клинике',
    lead: 'В предоставленных данных нет открытых вакансий.',
    heroImage: 'vacancies',
    noindex: false,
    body: `<section class="section"><div class="container"><article class="notice empty-state"><h2>Открытые вакансии не указаны</h2><p>Резюме можно самостоятельно направить на официальный электронный адрес клиники.</p><a class="button button-secondary" href="${CONTACTS.emailHref}">Отправить резюме по электронной почте</a></article></div></section>`,
  },
]);
