import { CLINIC, CONTACTS, HOURS, LICENSE } from '../data/clinic.js';

const phoneLinks = CONTACTS.phones
  .map((phone) => `<a class="button button-secondary" href="${phone.href}">${phone.label}</a>`)
  .join('');

const hoursList = [HOURS.weekdays, HOURS.saturday, HOURS.sunday]
  .map((entry) => `<div><dt>${entry.label}</dt><dd>${entry.value}</dd></div>`)
  .join('');

export const CORE_PAGES = Object.freeze([
  {
    file: 'index.html',
    title: 'Стоматологическая клиника в Белгороде',
    description: 'ООО «Стоматология Ваша улыбка»: лицензированная стоматологическая помощь в Белгороде.',
    heading: 'Стоматология Ваша улыбка',
    lead: `Медицинская помощь по лицензии ${LICENSE.number}.`,
    heroImage: 'home',
    noindex: false,
    body: `<section class="section"><div class="container feature-grid"><article class="card"><h2>Направления помощи</h2><p>Три направления медицинской деятельности из действующей лицензии.</p><a href="services.html">Посмотреть услуги</a></article><article class="card"><h2>Сотрудники</h2><p>Опубликован подтверждённый список сотрудников и должностей.</p><a href="specialists.html">Посмотреть список</a></article><article class="card"><h2>Контакты</h2><p>${CLINIC.activityAddress}</p><a href="contacts.html">Адрес и режим работы</a></article></div></section><section class="section"><div class="container split"><article><h2>Подтверждённые сведения</h2><p>${CLINIC.legalName} зарегистрировано ${CLINIC.registeredSince}.</p><p>Лицензия ${LICENSE.number} от ${LICENSE.grantedAt}. Статус: ${LICENSE.status}.</p></article><aside class="card" aria-labelledby="home-appointment-title"><h2 id="home-appointment-title">Запись по телефону</h2><p>Выберите удобный номер в окне записи.</p><button class="button button-primary" type="button" data-appointment-open>Записаться на приём</button></aside></div></section>`,
  },
  {
    file: 'about.html',
    title: 'О стоматологической клинике',
    description: 'Подтверждённые реквизиты и сведения о лицензии ООО «Стоматология Ваша улыбка».',
    heading: 'О стоматологии',
    lead: 'Реквизиты юридического лица и сведения о медицинской лицензии.',
    heroImage: 'about',
    noindex: false,
    body: `<section class="section"><div class="container split"><article><h2>Только проверенные сведения</h2><p>На этой странице собраны сведения из предоставленных регистрационных и лицензионных данных.</p><p>Дата ${CLINIC.registeredSince} относится к регистрации юридического лица.</p></article><article class="card"><h2>Реквизиты</h2><dl class="definition-list"><div><dt>Полное наименование</dt><dd>${CLINIC.legalName}</dd></div><div><dt>ОГРН</dt><dd>${CLINIC.ogrn}</dd></div><div><dt>ИНН</dt><dd>${CLINIC.inn}</dd></div><div><dt>Адрес регистрации</dt><dd>${CLINIC.registryAddress}</dd></div></dl></article></div></section><section class="section"><div class="container"><article class="notice"><h2>Медицинская лицензия</h2><dl class="definition-list"><div><dt>Номер</dt><dd>${LICENSE.number}</dd></div><div><dt>Дата предоставления</dt><dd>${LICENSE.grantedAt}</dd></div><div><dt>Статус</dt><dd>${LICENSE.status}</dd></div><div><dt>Лицензирующий орган</dt><dd>${LICENSE.authority}</dd></div><div><dt>Приказ</dt><dd>${LICENSE.order}</dd></div></dl></article></div></section>`,
  },
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
