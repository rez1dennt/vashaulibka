import { CLINIC, CONTACTS, HOURS, LICENSE } from '../data/clinic.js';
import { ONLINE_BOOKING } from '../data/online-booking.js';
import { renderAccessibilityBootstrap } from './accessibility-bootstrap.js';
import { renderHero } from './render-hero.js';
import { renderFooter, renderHeader } from './site-chrome.js';

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
  const mainClass = page.layout === 'patient' ? ' class="main--patient"' : '';

  return [
    '<!doctype html><html class="no-js" lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">',
    robots,
    `<title>${esc(page.title)} — ${esc(CLINIC.name)}</title><meta name="description" content="${esc(page.description)}">`,
    `<meta property="og:type" content="website"><meta property="og:title" content="${esc(page.title)}"><meta property="og:description" content="${esc(page.description)}">`,
    `<link rel="icon" href="assets/icons/favicon.svg" type="image/svg+xml">${renderAccessibilityBootstrap()}<link rel="stylesheet" href="/src/styles/main.css">`,
    `<script type="application/ld+json">${schema}</script></head><body data-page="${esc(page.file)}">`,
    '<a class="skip-link" href="#main-content">К основному содержимому</a>',
    renderHeader(page.file),
    `<main id="main-content"${mainClass}>${renderHero(page)}${page.body}</main>`,
    renderFooter(),
    `<a class="mobile-appointment button button-primary" href="${CONTACTS.phones[0].href}" data-appointment-open>Запись на приём</a>`,
    '<div id="appointment-dialog" class="dialog" role="dialog" aria-modal="true" aria-labelledby="appointment-title" aria-describedby="appointment-description" hidden><div class="dialog__backdrop" data-dialog-backdrop aria-hidden="true"></div><div class="dialog__panel"><button type="button" data-dialog-close aria-label="Закрыть">×</button><h2 id="appointment-title">Запись на приём</h2>',
    `<p id="appointment-description">Запишитесь онлайн через ${esc(ONLINE_BOOKING.providerName)} или позвоните в клинику. Данные, которые вы введёте в форме, получат сервис 32top и клиника для организации приёма.</p>`,
    '<div class="dialog__actions"><button class="button button-primary" type="button" data-booking-online>Записаться онлайн</button><button class="button button-secondary" type="button" data-booking-consent-open data-cookie-settings>Настроить онлайн-запись</button><p class="dialog__status" data-booking-status aria-live="polite" aria-atomic="true"></p><div class="dialog__error" data-booking-error role="alert" hidden>',
    `<p>Если сервис временно недоступен, <a href="${esc(ONLINE_BOOKING.bookingUrl)}" target="_blank" rel="noopener noreferrer">откройте форму 32top напрямую</a> или позвоните нам.</p></div><div class="dialog__phones">`,
    CONTACTS.phones.map((phone) => `<a class="button button-secondary" href="${phone.href}">${esc(phone.label)}</a>`).join(''),
    '</div></div>',
    `<h3>Режим работы</h3><dl class="definition-list definition-list--compact">${appointmentHours}</dl><p><strong>${esc(HOURS.breakNote)}</strong></p></div></div>`,
    '<div class="cookie-banner" data-cookie-banner hidden><p>Сайт хранит необходимые настройки в браузере. Онлайн-запись 32top загружается только с вашего разрешения.</p><label class="cookie-banner__choice"><input type="checkbox" data-cookie-online-booking><span><strong>Разрешить онлайн-запись</strong><small>Подключает внешний сервис МИС 32top при выборе записи через интернет.</small></span></label><button type="button" data-cookie-reject>Отклонить необязательные</button><button type="button" data-cookie-save>Сохранить выбор</button></div><script type="module" src="/src/js/main.js"></script></body></html>',
  ].join('');
}
