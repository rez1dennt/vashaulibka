import { CLINIC, CONTACTS, HOURS, LICENSE } from '../data/clinic.js';
import { renderIcon } from './icons.js';

export const NAV_ITEMS = Object.freeze([
  { href: 'index.html', label: 'Главная' },
  { href: 'about.html', label: 'О клинике' },
  { href: 'services.html', label: 'Наши услуги' },
  { href: 'specialists.html', label: 'Специалисты' },
  { href: 'prices.html', label: 'Цены' },
  { href: 'reviews.html', label: 'Отзывы' },
  { href: 'vacancies.html', label: 'Вакансии' },
  { href: 'patients.html', label: 'Информация для пациентов' },
  { href: 'contacts.html', label: 'Контакты' },
]);

const PATIENT_LINKS = Object.freeze([
  { href: 'license.html', label: 'Лицензия и документы' },
  { href: 'payment.html', label: 'Оплата услуг' },
  { href: 'benefits.html', label: 'Льготы' },
  { href: 'guarantees.html', label: 'Гарантии' },
  { href: 'complaints.html', label: 'Обращения и жалобы' },
  { href: 'standards.html', label: 'Стандарты и клинические рекомендации' },
]);

const escapeHtml = (value) => String(value).replace(/[&<>\"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}[character]));

const renderNavigationLinks = (activeFile) => NAV_ITEMS
  .map(({ href, label }) => `<a href="${href}"${href === activeFile ? ' aria-current="page"' : ''}>${label}</a>`)
  .join('');

export function renderHeader(activeFile) {
  const primaryPhone = CONTACTS.phones[0];
  const phoneLinks = CONTACTS.phones
    .map((phone) => `<a href="${phone.href}">${renderIcon('phone', 'header-icon')}${escapeHtml(phone.label)}</a>`)
    .join('');

  return [
    '<header class="site-header">',
    '<div class="utility-bar"><div class="header-shell utility-bar__inner">',
    `<button type="button" data-vision-toggle>${renderIcon('eye', 'ui-icon vision-icon')}Версия для слабовидящих</button>`,
    `<span class="utility-bar__address">${renderIcon('pin', 'header-icon')}${escapeHtml(CLINIC.activityAddress)}</span>`,
    `<span class="utility-bar__hours">${renderIcon('clock', 'header-icon')}${escapeHtml(HOURS.weekdays.value)} · ${escapeHtml(HOURS.saturday.label)} ${escapeHtml(HOURS.saturday.value)}</span>`,
    `<a class="utility-bar__phone" href="${primaryPhone.href}">${renderIcon('phone', 'header-icon')}${escapeHtml(primaryPhone.label)}</a>`,
    '</div></div>',
    '<div class="brand-row"><div class="header-shell brand-row__inner">',
    `<a class="brand" href="index.html" aria-label="${escapeHtml(CLINIC.name)}, главная"><img src="assets/icons/logo.svg" alt="" width="56" height="56"><span class="brand__wordmark"><span class="brand__prefix">Ваша</span><span class="brand__accent">улыбка</span><svg class="brand__smile" viewBox="0 0 64 8" aria-hidden="true" focusable="false"><path d="M2 2c16 6 44 6 60 0"/></svg></span></a>`,
    `<div class="brand-row__actions"><div class="brand-phone-group">${phoneLinks}</div><a class="button button-primary header-appointment" href="${primaryPhone.href}" data-appointment-open>${renderIcon('calendar', 'button-icon')}Запись на приём</a></div>`,
    '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-menu"><span class="menu-toggle__icon" aria-hidden="true"></span><span class="sr-only" data-menu-toggle-label>Открыть меню</span></button>',
    '</div></div>',
    '<div class="menu-backdrop" data-menu-backdrop aria-hidden="true"></div>',
    '<div class="nav-row"><div class="header-shell nav-row__inner">',
    `<nav id="main-menu" aria-label="Основная навигация">${renderNavigationLinks(activeFile)}<a class="button button-primary nav-appointment" href="${primaryPhone.href}" data-appointment-open>${renderIcon('calendar', 'button-icon')}Запись на приём</a></nav>`,
    '</div></div>',
    '</header>',
  ].join('');
}

export function renderFooter() {
  const navigationLinks = NAV_ITEMS
    .filter(({ href }) => !['index.html', 'patients.html', 'vacancies.html'].includes(href))
    .map(({ href, label }) => `<a href="${href}">${label}</a>`)
    .join('');
  const patientLinks = PATIENT_LINKS
    .map(({ href, label }) => `<a href="${href}">${label}</a>`)
    .join('');
  const phoneLinks = CONTACTS.phones
    .map((phone) => `<a href="${phone.href}">${renderIcon('phone', 'footer-icon')}${escapeHtml(phone.label)}</a>`)
    .join('');

  return [
    '<footer class="site-footer">',
    '<div class="container footer-grid">',
    `<section class="footer-brand"><h2>${escapeHtml(CLINIC.name)}</h2><p>Стоматологическая помощь в пределах действующей лицензии.</p><p>Лицензия ${escapeHtml(LICENSE.number)}<br>ОГРН ${escapeHtml(CLINIC.ogrn)}</p></section>`,
    `<section><h2>Навигация</h2>${navigationLinks}</section>`,
    `<section><h2>Пациентам</h2>${patientLinks}</section>`,
    `<section class="footer-contacts"><h2>Контакты</h2><p>${renderIcon('pin', 'footer-icon')}${escapeHtml(CLINIC.activityAddress)}</p>${phoneLinks}<a href="${CONTACTS.emailHref}">${renderIcon('mail', 'footer-icon')}${escapeHtml(CONTACTS.email)}</a><p>${renderIcon('clock', 'footer-icon')}${escapeHtml(HOURS.weekdays.label)}: ${escapeHtml(HOURS.weekdays.value)}<br>${escapeHtml(HOURS.saturday.label)}: ${escapeHtml(HOURS.saturday.value)}<br>${escapeHtml(HOURS.sunday.label)}: ${escapeHtml(HOURS.sunday.value)}</p><button class="button button-secondary" type="button" data-appointment-open>Запись на приём</button></section>`,
    '</div>',
    `<div class="container footer-bottom"><span>© 2026 ${escapeHtml(CLINIC.name)}</span><div class="footer-bottom__links"><a href="privacy.html">Политика конфиденциальности</a><a href="cookies.html">Cookies</a><a href="patients.html">Карта сайта</a><button type="button" data-cookie-settings>Настройки cookies</button></div></div>`,
    '</footer>',
  ].join('');
}
