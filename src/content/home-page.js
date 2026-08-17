import { CLINIC, CONTACTS, HOURS, LICENSE } from '../data/clinic.js';
import { PUBLIC_DOCUMENTS } from '../data/documents.js';
import { SERVICES } from '../data/services.js';
import { STAFF } from '../data/staff.js';
import { renderHomeDecoration } from '../templates/home-decoration.js';
import { renderIcon } from '../templates/icons.js';

const escapeHtml = (value) => String(value).replace(/[&<>\"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}[character]));

const renderInteriorFigure = (name, className) => [
  `<figure class="${className}">`,
  `<picture><source srcset="assets/images/hero-${name}.avif" type="image/avif"><img src="assets/images/hero-${name}.webp" alt="" width="1920" height="1080" loading="lazy"></picture>`,
  '<figcaption class="hero-visualization-label">Визуализация интерьера</figcaption>',
  '</figure>',
].join('');

const quickLinks = [
  { title: 'Лицензии и документы', text: 'Лицензия, ОГРН и оригиналы документов клиники.', href: 'license.html', icon: 'document' },
  { title: 'Специалисты', text: 'Подтверждённый список сотрудников и должностей.', href: 'specialists.html', icon: 'team' },
  { title: 'Услуги', text: 'Три направления помощи из действующей лицензии.', href: 'services.html', icon: 'tooth' },
  { title: 'Цены', text: 'Статус публикации утверждённого прейскуранта.', href: 'prices.html', icon: 'ruble' },
];

const quickLinksSection = [
  '<section class="quick-links" aria-label="Основные разделы">',
  renderHomeDecoration('quick-tooth'),
  '<div class="container quick-links__grid">',
  ...quickLinks.map((item) => `<article class="quick-card">${renderIcon(item.icon)}<h2>${item.title}</h2><p>${item.text}</p><a href="${item.href}">Перейти${renderIcon('arrow', 'button-icon')}</a></article>`),
  `<article class="quick-card quick-card--appointment">${renderIcon('calendar')}<h2>Запись на приём</h2><p>Позвоните в клинику или откройте окно с номерами и режимом работы.</p><a href="${CONTACTS.phones[0].href}" data-appointment-open>Записаться${renderIcon('arrow', 'button-icon')}</a></article>`,
  '</div>',
  '</section>',
].join('');

const aboutSection = [
  '<section class="home-section home-about">',
  '<div class="container home-about__grid">',
  renderInteriorFigure('about', 'home-about__media'),
  '<div class="home-about__content"><p class="eyebrow">О клинике</p><h2>Проверенные сведения о стоматологии</h2>',
  `<p>${escapeHtml(CLINIC.legalName)} зарегистрировано ${escapeHtml(CLINIC.registeredSince)}.</p>`,
  `<p>Клиника оказывает помощь по лицензии ${escapeHtml(LICENSE.number)}. В лицензии указаны ${SERVICES.length} направления медицинской деятельности.</p>`,
  `<dl class="home-facts"><div><dt>Статус лицензии</dt><dd>${escapeHtml(LICENSE.status)}</dd></div><div><dt>ОГРН</dt><dd>${escapeHtml(CLINIC.ogrn)}</dd></div><div><dt>Дата лицензии</dt><dd>${escapeHtml(LICENSE.grantedAt)}</dd></div></dl>`,
  `<a class="button button-secondary" href="about.html">Подробнее о клинике${renderIcon('arrow', 'button-icon')}</a>`,
  '</div></div></section>',
].join('');

const serviceCards = SERVICES.map((service) => [
  '<article class="home-service-card">',
  `<div class="home-service-card__icon">${renderIcon('tooth')}</div>`,
  `<h3>${escapeHtml(service.title)}</h3>`,
  `<p>${escapeHtml(service.summary)}</p>`,
  `<ul>${service.items.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`,
  `<a href="services.html">Подробнее${renderIcon('arrow', 'button-icon')}</a>`,
  '</article>',
].join('')).join('');

const servicesSection = `<section class="home-section home-services">${renderHomeDecoration('services-dental')}<div class="container"><div class="section-heading"><div><p class="eyebrow">Наши услуги</p><h2>Лицензированные направления помощи</h2></div><a class="text-link" href="services.html">Все услуги${renderIcon('arrow', 'button-icon')}</a></div><div class="home-services__grid">${serviceCards}</div></div></section>`;

const staffCards = STAFF.map((person) => `<article class="home-staff-card"><span class="home-staff-card__avatar" aria-hidden="true">${escapeHtml(person.initials)}</span><div><h3>${escapeHtml(person.name)}</h3><p>${escapeHtml(person.role)}</p></div></article>`).join('');

const staffAndPricesSection = [
  '<section class="home-section home-staff-prices">',
  renderHomeDecoration('staff-jaw'),
  '<div class="container home-staff-prices__grid">',
  `<div class="home-staff"><div class="section-heading"><div><p class="eyebrow">Команда</p><h2>Сотрудники клиники</h2></div><a class="text-link" href="specialists.html">Весь список${renderIcon('arrow', 'button-icon')}</a></div><div class="home-staff__grid">${staffCards}</div></div>`,
  `<aside class="home-price-panel"><div class="home-price-panel__icon">${renderIcon('ruble')}</div><p class="eyebrow">Стоимость услуг</p><h2>Прейскурант готовится к публикации</h2><p><strong>${escapeHtml(SERVICES[0].priceStatus)}</strong></p><p>Утверждённые цены будут размещены после получения прейскуранта от клиники.</p><div class="home-price-panel__actions"><a class="button button-secondary" href="prices.html">Статус цен</a><a class="button button-primary" href="${CONTACTS.phones[0].href}" data-appointment-open>Записаться</a></div></aside>`,
  '</div></section>',
].join('');

const patientLinks = [
  { href: 'payment.html', label: 'Оплата услуг', icon: 'ruble' },
  { href: 'benefits.html', label: 'Льготы и скидки', icon: 'shield' },
  { href: 'waiting-periods.html', label: 'Сроки ожидания', icon: 'clock' },
  { href: 'guarantees.html', label: 'Гарантийные сроки', icon: 'shield' },
  { href: 'complaints.html', label: 'Обращения и жалобы', icon: 'mail' },
  { href: 'standards.html', label: 'Стандарты и рекомендации', icon: 'document' },
];

const patientSection = `<section class="home-section home-patients">${renderHomeDecoration('patients-docs')}<div class="container"><div class="section-heading"><div><p class="eyebrow">Пациентам</p><h2>Документы и полезная информация</h2></div><a class="text-link" href="patients.html">Все разделы${renderIcon('arrow', 'button-icon')}</a></div><div class="home-patients__grid">${patientLinks.map((item) => `<a class="patient-link-card" href="${item.href}">${renderIcon(item.icon)}<span>${item.label}</span>${renderIcon('arrow', 'button-icon')}</a>`).join('')}</div></div></section>`;

const documentCards = [
  {
    href: PUBLIC_DOCUMENTS.licenseRegistryExtract,
    image: 'assets/documents/license-registry-extract.webp',
    alt: 'Первая страница выписки из реестра лицензий',
    title: 'Выписка из реестра лицензий',
  },
  {
    href: PUBLIC_DOCUMENTS.ogrnCertificate,
    image: 'assets/documents/ogrn-certificate.webp',
    alt: 'Свидетельство о государственной регистрации юридического лица',
    title: 'Свидетельство ОГРН',
  },
];

const documentsSection = `<section class="home-section home-documents"><div class="container home-documents__grid"><div class="home-documents__intro"><p class="eyebrow">Документы</p><h2>Оригиналы клиники</h2><p>На сайте размещены предоставленные клиникой регистрационные и лицензионные документы.</p><a class="button button-secondary" href="license.html">Все сведения${renderIcon('arrow', 'button-icon')}</a></div><div class="home-documents__cards">${documentCards.map((document) => `<a class="document-card" href="${document.href}" target="_blank" rel="noopener"><span class="document-card__preview"><img src="${document.image}" alt="${document.alt}" width="720" height="960" loading="lazy"></span><span class="document-card__body">${renderIcon('document')}<span><strong>${document.title}</strong><small>Открыть PDF</small></span>${renderIcon('arrow', 'button-icon')}</span></a>`).join('')}</div></div></section>`;

const hours = [
  HOURS.weekdays,
  HOURS.saturday,
  HOURS.sunday,
  { label: 'Перерыв', value: HOURS.breakNote },
]
  .map((entry) => `<div><dt>${escapeHtml(entry.label)}</dt><dd>${escapeHtml(entry.value)}</dd></div>`)
  .join('');

const contactsSection = [
  '<section class="home-section home-contact">',
  '<div class="container home-contact__grid">',
  '<div class="home-contact__content"><p class="eyebrow">Контакты</p><h2>Запись и режим работы</h2>',
  `<p class="home-contact__row home-contact__address">${renderIcon('pin')}<span>${escapeHtml(CLINIC.activityAddress)}</span></p>`,
  `<div class="home-contact__phones">${CONTACTS.phones.map((phone) => `<a class="home-contact__row" href="${phone.href}">${renderIcon('phone')}<span>${escapeHtml(phone.label)}</span></a>`).join('')}</div>`,
  `<a class="home-contact__row home-contact__email" href="${CONTACTS.emailHref}">${renderIcon('mail')}<span>${escapeHtml(CONTACTS.email)}</span></a>`,
  `<div class="home-contact__row home-contact__schedule">${renderIcon('clock')}<dl class="home-contact__hours">${hours}</dl></div>`,
  `<a class="button button-primary" href="${CONTACTS.phones[0].href}" data-appointment-open>${renderIcon('calendar', 'button-icon')}Записаться на приём</a>`,
  '</div>',
  renderInteriorFigure('contacts', 'home-contact__media'),
  '</div></section>',
].join('');

export const HOME_PAGE = Object.freeze({
  file: 'index.html',
  title: 'Стоматологическая клиника в Белгороде',
  description: 'ООО «Стоматология Ваша улыбка»: лицензированная стоматологическая помощь в Белгороде.',
  heading: CLINIC.shortLegalName,
  lead: 'Стоматологическая помощь в Белгороде в пределах действующей медицинской лицензии.',
  heroImage: 'home',
  heroVariant: 'home',
  noindex: false,
  body: [
    quickLinksSection,
    aboutSection,
    servicesSection,
    staffAndPricesSection,
    patientSection,
    documentsSection,
    contactsSection,
  ].join(''),
});
