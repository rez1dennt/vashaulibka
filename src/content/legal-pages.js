import { CLINIC, CONTACTS, LICENSE } from '../data/clinic.js';
import { PRICE_LIST, PUBLIC_DOCUMENTS } from '../data/documents.js';
import { SITE_ORIGIN } from '../data/site.js';
import {
  BENEFITS,
  GUARANTEES,
  OFFICIAL_SOURCES,
  PAID_SERVICES_DATE_NOTICE,
  REGULATORS,
} from '../data/legal.js';
import { renderIcon } from '../templates/icons.js';
import { ONLINE_BOOKING } from '../data/online-booking.js';

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const formatRussianDate = (date) => {
  const [day, month, year] = date.split('.').map(Number);
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(Date.UTC(year, month - 1, day)))
    .replace(/\sг\.$/, ' года');
};

const PATIENT_LINK_GROUPS = Object.freeze([
  Object.freeze({
    title: 'Лечение и оплата',
    links: Object.freeze([
      Object.freeze({ href: 'services.html', label: 'Медицинская деятельность и услуги', description: 'Направления помощи в пределах действующей лицензии.', icon: 'tooth' }),
      Object.freeze({ href: 'payment.html', label: 'Оплата услуг', description: 'Наличный и безналичный расчёт по выбору пациента.', icon: 'ruble' }),
      Object.freeze({ href: 'benefits.html', label: 'Льготы и скидки клиники', description: 'Скидки, предоставляемые по приказу клиники.', icon: 'shield' }),
      Object.freeze({ href: 'oms.html', label: 'Участие в программе ОМС', description: 'Официальный статус участия клиники в программе.', icon: 'info' }),
    ]),
  }),
  Object.freeze({
    title: 'Документы и гарантии',
    links: Object.freeze([
      Object.freeze({ href: 'documents.html', label: 'Документы клиники', description: 'Прайс-лист, лицензия, нормативные акты и охрана труда.', icon: 'document' }),
      Object.freeze({ href: PUBLIC_DOCUMENTS.paidServicesContract2026, label: 'Договор на платные медицинские услуги', description: 'Форма с 1 сентября 2026 года. Согласие на обработку данных — в приложении № 5.', icon: 'document' }),
      Object.freeze({ href: 'license.html', label: 'Лицензия и регистрационные документы', description: 'Лицензия, ОГРН и предоставленные оригиналы.', icon: 'document' }),
      Object.freeze({ href: 'informed-consent.html', label: 'Информированное добровольное согласие', description: 'Порядок оформления согласия до вмешательства.', icon: 'document' }),
      Object.freeze({ href: 'guarantees.html', label: 'Гарантийные сроки', description: 'Условия, гарантийные сроки и сроки службы.', icon: 'shield' }),
      Object.freeze({ href: 'standards.html', label: 'Стандарты и нормативные источники', description: 'Официальные публикации и базы рекомендаций.', icon: 'document' }),
    ]),
  }),
  Object.freeze({
    title: 'Права и персональные данные',
    links: Object.freeze([
      Object.freeze({ href: 'complaints.html', label: 'Обращения и жалобы', description: 'Контакты клиники и территориальных ведомств.', icon: 'mail' }),
      Object.freeze({ href: 'privacy.html', label: 'Политика конфиденциальности', description: 'Фактическая обработка данных на текущем сайте.', icon: 'shield' }),
      Object.freeze({ href: 'cookies.html', label: 'Технические настройки и cookies', description: 'Локальные технические предпочтения браузера.', icon: 'info' }),
    ]),
  }),
]);

const renderPatientLink = ({ href, label, description, icon }) => [
  `<a class="patient-link-card" href="${escapeHtml(href)}">`,
  `<span class="patient-link-card__icon">${renderIcon(icon)}</span>`,
  `<span class="patient-link-card__copy"><strong>${escapeHtml(label)}</strong><small>${escapeHtml(description)}</small></span>`,
  `<span class="patient-link-card__arrow">${renderIcon('arrow')}</span>`,
  '</a>',
].join('');

const renderPatientHub = () => PATIENT_LINK_GROUPS
  .map((group) => `<section class="patient-hub__group"><h2>${escapeHtml(group.title)}</h2><div class="patient-hub__grid">${group.links.map(renderPatientLink).join('')}</div></section>`)
  .join('');

const patientNotice = (title, content, icon = 'info') => [
  '<article class="notice patient-notice">',
  `<span class="patient-notice__icon">${renderIcon(icon)}</span>`,
  `<div class="patient-notice__body"><h2>${escapeHtml(title)}</h2>${content}</div>`,
  '</article>',
].join('');

const renderPatientRelated = () => [
  '<section class="section patient-related-section"><div class="container patient-related">',
  '<div><p class="eyebrow">Полезные разделы</p><h2>Продолжить знакомство с клиникой</h2></div>',
  '<nav aria-label="Связанные разделы для пациентов">',
  '<a class="button button-secondary" href="patients.html">Информация для пациентов</a>',
  '<a class="button button-secondary" href="services.html">Наши услуги</a>',
  `<a class="button button-primary" href="${escapeHtml(CONTACTS.phones[0].href)}" data-appointment-open>${renderIcon('calendar', 'button-icon')}Запись на приём</a>`,
  '</nav></div></section>',
].join('');

const decoratePatientContent = (body) => body.replaceAll(
  '<div class="container',
  '<div class="container patient-content',
);

const benefitsList = BENEFITS
  .map((benefit) => `<li><span>${escapeHtml(benefit.category)}</span><strong>${escapeHtml(benefit.discount)}</strong></li>`)
  .join('');

const guaranteeRows = GUARANTEES
  .map((item) => `<tr><th scope="row">${escapeHtml(item.work)}</th><td>${escapeHtml(item.warranty)}</td><td>${escapeHtml(item.serviceLife)}</td></tr>`)
  .join('');

const regulatorCards = REGULATORS
  .map((regulator) => `<article class="card"><h2>${escapeHtml(regulator.name)}</h2><p>${escapeHtml(regulator.address)}</p><p>${escapeHtml(regulator.phone)}</p><p><a href="${escapeHtml(regulator.url)}">Официальный сайт ведомства</a></p></article>`)
  .join('');

const PRIVACY_SECTIONS = Object.freeze([
  Object.freeze({ id: 'privacy-general', label: 'Общие положения' }),
  Object.freeze({ id: 'privacy-operator', label: 'Сведения об операторе' }),
  Object.freeze({ id: 'privacy-principles', label: 'Принципы обработки' }),
  Object.freeze({ id: 'privacy-current-site', label: 'Обработка на сайте' }),
  Object.freeze({ id: 'privacy-technical-data', label: 'Технические данные' }),
  Object.freeze({ id: 'privacy-purposes', label: 'Цели и основания' }),
  Object.freeze({ id: 'privacy-processing', label: 'Сроки и удаление' }),
  Object.freeze({ id: 'privacy-third-parties', label: 'Передача данных' }),
  Object.freeze({ id: 'privacy-security', label: 'Защита данных' }),
  Object.freeze({ id: 'privacy-rights', label: 'Права пользователя' }),
  Object.freeze({ id: 'privacy-storage', label: 'Настройки браузера' }),
  Object.freeze({ id: 'privacy-updates', label: 'Изменение политики' }),
]);

const privacySection = (id, number, title, content) => [
  `<section class="privacy-policy__section" id="${escapeHtml(id)}">`,
  `<span class="privacy-policy__number" aria-hidden="true">${String(number).padStart(2, '0')}</span>`,
  `<div><h2>${escapeHtml(title)}</h2>${content}</div>`,
  '</section>',
].join('');

const renderPrivacyPolicy = () => {
  const phoneLinks = CONTACTS.phones
    .map((phone) => `<a href="${escapeHtml(phone.href)}">${escapeHtml(phone.label)}</a>`)
    .join('');
  const contents = PRIVACY_SECTIONS
    .map((section) => `<li><a href="#${escapeHtml(section.id)}">${escapeHtml(section.label)}</a></li>`)
    .join('');

  const sections = [
    privacySection('privacy-general', 1, 'Общие положения', `<p>Настоящая Политика определяет порядок обработки и защиты персональных данных посетителей сайта <a href="${SITE_ORIGIN}/">${SITE_ORIGIN}</a> и лиц, которые обращаются в клинику по опубликованным контактам. Политика применяется к обработке, которую осуществляет оператор, и подготовлена с учётом Федерального закона от 27 июля 2006 года № 152-ФЗ «О персональных данных».</p><p>Использование сайта означает ознакомление с настоящей Политикой. Предоставление согласия на отдельную обработку, когда оно требуется законом, оформляется самостоятельным действием и не заменяется простым просмотром страниц.</p>`),
    privacySection('privacy-operator', 2, 'Сведения об операторе', `<dl class="privacy-policy__details"><div><dt>Оператор</dt><dd>${escapeHtml(CLINIC.legalName)}</dd></div><div><dt>ОГРН</dt><dd>${escapeHtml(CLINIC.ogrn)}</dd></div><div><dt>ИНН</dt><dd>${escapeHtml(CLINIC.inn)}</dd></div><div><dt>Адрес деятельности</dt><dd>${escapeHtml(CLINIC.activityAddress)}</dd></div><div><dt>Почтовый адрес для обращений</dt><dd>${escapeHtml(CLINIC.complaintsPostalAddress)}</dd></div><div><dt>Электронная почта</dt><dd><a href="${escapeHtml(CONTACTS.emailHref)}">${escapeHtml(CONTACTS.email)}</a></dd></div></dl>`),
    privacySection('privacy-principles', 3, 'Принципы обработки', '<p>Оператор обрабатывает данные законно и добросовестно, только для заранее определённых целей. Состав данных ограничивается необходимым объёмом. Данные не объединяются для несовместимых целей, поддерживаются точными и удаляются либо обезличиваются после достижения цели, если их дальнейшее хранение не требуется по закону.</p>'),
    privacySection('privacy-current-site', 4, 'Обработка на текущем сайте', `<p>Для онлайн-записи сайт подключает ${escapeHtml(ONLINE_BOOKING.providerName)} с домена <code>book-app.32top.ru</code> только после явного разрешения пользователя. До разрешения внешний скрипт и форма не загружаются. В форме пользователь выбирает врача, дату и время приёма, затем может указать фамилию, имя, отчество и номер телефона. Данные вводятся непосредственно в интерфейсе 32top и передаются сервису и клинике для организации записи; собственный код сайта не читает и не сохраняет содержимое полей.</p><p>Если соответствующие сценарии включены в кабинете МИС, номер телефона может использоваться для сервисных SMS о создании записи и предстоящем визите. Такие уведомления содержат сведения, необходимые для напоминания: имя пациента, дату и время приёма и название клиники. Сайт не формирует и не отправляет SMS; рассылкой управляет МИС 32top, а доставку выполняет оператор связи.</p><p>Перед отправкой форма 32top предлагает отдельное согласие на обработку персональных данных и ссылку на <a href="${escapeHtml(ONLINE_BOOKING.privacyUrl)}">политику поставщика</a>. Пользователь также может открыть <a href="${escapeHtml(ONLINE_BOOKING.consentUrl)}">текст согласия 32top</a>. Онлайн-запись можно отключить в настройках cookies; запись по телефону остаётся доступной независимо от выбора.</p><div class="privacy-policy__contact-list">${phoneLinks}<a href="${escapeHtml(CONTACTS.emailHref)}">${escapeHtml(CONTACTS.email)}</a></div><p>После звонка или отправки письма пользователь взаимодействует с оператором по выбранному каналу. Данные, добровольно сообщённые при таком обращении, могут обрабатываться для ответа, записи на приём, заключения и исполнения договора, исполнения обязанностей медицинской организации и защиты законных прав.</p><p>Биометрические персональные данные средствами сайта клиники не собираются. Не сообщайте в свободной форме сведения о здоровье, которые не нужны для организации записи.</p>`),
    privacySection('privacy-technical-data', 5, 'Технические данные при обращении к сайту', '<p>Инфраструктура, обеспечивающая доступ к размещённой версии сайта, может автоматически получать IP-адрес, дату и время запроса, адрес запрошенной страницы, сведения о браузере и устройстве, код ответа и источник перехода. Эти сведения могут входить в технические журналы или серверные логи.</p><p>Такие данные используются только для доставки страниц, обеспечения работоспособности и безопасности, диагностики ошибок и предотвращения неправомерного доступа. Сайт клиники не подключает внешнюю аналитику, рекламные пиксели, удалённые шрифты или карты. После разрешения онлайн-записи браузер обращается к 32top; технические данные такого обращения могут обрабатываться инфраструктурой поставщика по его политике.</p>'),
    privacySection('privacy-purposes', 6, 'Цели и правовые основания', '<ul><li>предоставление посетителям информации о клинике и обеспечение работы сайта;</li><li>ответ на обращение, запись на приём и подготовка к заключению договора по инициативе пользователя;</li><li>исполнение договора, требований законодательства и обязанностей медицинской организации;</li><li>обеспечение информационной безопасности, предупреждение нарушений и защита законных прав оператора и пользователей;</li><li>обработка на основании согласия в случаях, когда иного законного основания нет.</li></ul><p>Федеральный закон № 152-ФЗ устанавливает требования к обработке, но сам по себе не используется как самостоятельное правовое основание конкретной цели.</p>'),
    privacySection('privacy-processing', 7, 'Способы, сроки обработки и удаление', '<p>Обработка может включать получение, запись, систематизацию, накопление, хранение, уточнение, извлечение, использование, передачу в предусмотренных законом случаях, блокирование, удаление и уничтожение данных с применением автоматизированных средств или без них.</p><p>Данные хранятся не дольше, чем этого требуют цель обработки, договор или законодательство. Обращение хранится до его рассмотрения и завершения связанных действий, затем удаляется или включается в документацию, обязательный срок хранения которой установлен законом. Технические журналы хранятся только в течение срока, необходимого для безопасности и диагностики, после чего удаляются или обезличиваются, если иной срок не установлен законом.</p><p>При достижении цели, истечении обязательного срока либо наступлении законного основания для прекращения обработки оператор прекращает обработку и уничтожает данные в установленном порядке.</p>'),
    privacySection('privacy-third-parties', 8, 'Передача и поручение обработки', `<p>Оператор не распространяет персональные данные неопределённому кругу лиц. Передача допускается с согласия субъекта, для исполнения договора, по требованию закона или уполномоченного органа, а также для защиты прав в предусмотренных законом пределах.</p><p>Онлайн-запись предоставляет ${escapeHtml(ONLINE_BOOKING.providerName)}. Договорные роли сторон, поручение обработки, локализация баз, сроки хранения и порядок реагирования на инциденты проверяются оператором до production-публикации. Настоящий текст не подтверждает завершение такой проверки.</p>`),
    privacySection('privacy-security', 9, 'Защита персональных данных', '<p>Оператор применяет необходимые правовые, организационные и технические меры с учётом характера данных, угроз и требований законодательства. В их числе разграничение доступа, назначение ответственных лиц, учёт носителей и операций, резервирование, контроль защищённости, обучение работников и реагирование на инциденты.</p><p>Состав конкретных мер не публикуется в объёме, который может снизить безопасность информационных систем.</p>'),
    privacySection('privacy-rights', 10, 'Права пользователя и обращения', `<p>Субъект персональных данных вправе получить сведения об обработке, потребовать уточнения, блокирования или удаления неполных, устаревших, неточных, незаконно полученных либо ненужных данных, направить отзыв согласия и обжаловать действия оператора в уполномоченный орган по защите прав субъектов персональных данных, Роскомнадзор, или в суд.</p><p>Обращение должно позволять установить заявителя и предмет запроса. Его можно направить почтой по адресу ${escapeHtml(CLINIC.complaintsPostalAddress)} или электронной почтой <a href="${escapeHtml(CONTACTS.emailHref)}">${escapeHtml(CONTACTS.email)}</a>. Оператор отвечает в сроки и порядке, установленные законодательством Российской Федерации.</p>`),
    privacySection('privacy-storage', 11, 'Локальные настройки браузера', '<p>Сайт сохраняет в localStorage только записи <code>cookie-consent</code> и <code>accessibility-preferences</code>. <code>cookie-consent</code> версии 2 содержит логический выбор <code>onlineBooking</code>. Запись <code>accessibility-preferences</code> версии 2 содержит только настройки отображения и логическое значение голосовых подтверждений. Полный состав и способы удаления описаны на странице <a href="cookies.html">«Технические настройки и cookies»</a>.</p>'),
    privacySection('privacy-updates', 12, 'Изменение политики', '<p>Актуальная редакция постоянно доступна на этой странице. Оператор обновляет Политику при изменении законодательства, целей, состава данных, поставщиков или способов обработки.</p><p><strong>Редакция от 13 августа 2026 года.</strong></p>'),
  ].join('');

  return `<section class="section privacy-policy"><div class="container privacy-policy__layout"><div class="privacy-policy__overview"><article class="privacy-policy__summary"><span class="privacy-policy__summary-icon">${renderIcon('shield')}</span><div><p class="eyebrow">Оператор персональных данных</p><h2>${escapeHtml(CLINIC.shortLegalName)}</h2><p>Документ описывает сайт, телефонные обращения и подключаемую с разрешения онлайн-запись МИС 32top.</p></div></article><nav class="privacy-policy__contents" aria-labelledby="privacy-contents-title"><h2 id="privacy-contents-title">Содержание</h2><ol>${contents}</ol></nav></div><article class="privacy-policy__body">${sections}</article></div></section>`;
};

const makePage = (page) => Object.freeze({
  heroImage: 'about',
  noindex: false,
  ...page,
  layout: 'patient',
  body: `${decoratePatientContent(page.body)}${renderPatientRelated()}`,
});

export const LEGAL_PAGES = Object.freeze([
  makePage({
    file: 'patients.html',
    title: 'Информация для пациентов',
    description: 'Документы, правила, гарантии, обращения и сведения о конфиденциальности для пациентов клиники.',
    heading: 'Информация для пациентов',
    lead: 'Проверенные сведения клиники, документы и официальные источники.',
    body: `<section class="section patient-hub"><div class="container patient-content patient-links">${renderPatientHub()}</div></section>`,
  }),
  makePage({
    file: 'license.html',
    title: 'Лицензия и регистрационные сведения',
    description: 'Сведения о медицинской лицензии, ОГРН и ИНН ООО «Стоматология Ваша улыбка».',
    heading: 'Лицензия и регистрационные сведения',
    lead: 'Сведения из централизованных данных клиники и предоставленные оригиналы документов.',
    body: `<section class="section"><div class="container split"><article><h2>Медицинская лицензия</h2><dl class="definition-list"><div><dt>Номер</dt><dd>${escapeHtml(LICENSE.number)}</dd></div><div><dt>Дата предоставления</dt><dd>${escapeHtml(formatRussianDate(LICENSE.grantedAt))}</dd></div><div><dt>Лицензирующий орган</dt><dd>${escapeHtml(LICENSE.authority)}</dd></div><div><dt>Статус</dt><dd>${escapeHtml(LICENSE.status)}</dd></div></dl></article><article class="card"><h2>Регистрационные сведения</h2><dl class="definition-list"><div><dt>Наименование</dt><dd>${escapeHtml(CLINIC.legalName)}</dd></div><div><dt>ОГРН</dt><dd>${escapeHtml(CLINIC.ogrn)}</dd></div><div><dt>ИНН</dt><dd>${escapeHtml(CLINIC.inn)}</dd></div></dl></article></div></section><section class="section"><div class="container"><h2>Оригиналы документов</h2><div class="contact-actions"><a class="button button-secondary" href="${escapeHtml(PUBLIC_DOCUMENTS.licenseRegistryExtract)}">Выписка из реестра лицензий (PDF)</a><a class="button button-secondary" href="${escapeHtml(PUBLIC_DOCUMENTS.ogrnCertificate)}">Свидетельство ОГРН (PDF)</a></div></div></section>`,
  }),
  makePage({
    file: 'payment.html',
    title: 'Оплата медицинских услуг',
    description: 'Доступные способы оплаты платных медицинских услуг в клинике.',
    heading: 'Оплата услуг',
    lead: 'Способ расчёта выбирает потребитель.',
    body: `<section class="section"><div class="container">${patientNotice('Способы оплаты', '<p>Оплата платных медицинских услуг осуществляется наличным и безналичным расчётом по выбору потребителя.</p>', 'ruble')}<article class="price-source price-source__card card"><div class="price-source__copy"><p class="eyebrow">Утверждённый документ</p><h2>${escapeHtml(PRICE_LIST.title)}</h2><p class="price-source__meta">Утверждён ${escapeHtml(PRICE_LIST.approvedLabel)} · ${escapeHtml(PRICE_LIST.pageCount)} страниц</p><div class="price-source__actions"><a class="button button-primary" href="${escapeHtml(PRICE_LIST.href)}">Открыть PDF</a><a class="button button-secondary" href="${escapeHtml(PRICE_LIST.href)}" download>Скачать PDF</a><a class="button button-secondary" href="prices.html">Посмотреть цены</a></div></div><div class="price-source__notices">${PRICE_LIST.notices.map((notice) => `<p class="price-source__notice">${escapeHtml(notice)}</p>`).join('')}</div></article></div></section>`,
  }),
  makePage({
    file: 'benefits.html',
    title: 'Льготы и скидки клиники',
    description: 'Скидки, предоставляемые клиникой отдельным категориям пациентов по внутреннему приказу.',
    heading: 'Льготы и скидки',
    lead: 'Скидки клиники по приказу от 13 января 2025 года.',
    body: `<section class="section"><div class="container">${patientNotice('Условия предоставления', '<p>Это скидки, предоставляемые клиникой по её приказу от 13 января 2025 года, а не универсальные установленные законом скидки. Принадлежность к льготной категории и возможность применения скидки необходимо подтвердить в клинике до лечения.</p>', 'shield')}<h2>Категории пациентов</h2><ul class="benefit-list">${benefitsList}</ul></div></section>`,
  }),
  makePage({
    file: 'oms.html',
    title: 'Участие клиники в программе ОМС',
    description: 'Официальное уведомление об участии ООО «Стоматология Ваша улыбка» в территориальной программе.',
    heading: 'Участие в программе ОМС',
    lead: 'Сведения из предоставленного уведомления клиники.',
    body: `<section class="section"><div class="container">${patientNotice('Статус участия', '<p>ООО «Стоматология Ваша улыбка» не участвует в реализации территориальной программы государственных гарантий бесплатного оказания гражданам медицинской помощи.</p>')}</div></section>`,
  }),
  makePage({
    file: 'informed-consent.html',
    title: 'Информированное добровольное согласие',
    description: 'Как оформляется информированное добровольное согласие перед медицинским вмешательством.',
    heading: 'Информированное добровольное согласие',
    lead: 'Согласие оформляется перед медицинским вмешательством.',
    body: '<section class="section"><div class="container"><h2>До начала вмешательства</h2><p>До медицинского вмешательства пациент или его законный представитель подписывает информированное добровольное согласие. В нём раскрываются методы медицинского вмешательства, связанные риски, возможные альтернативы, последствия и ожидаемые результаты.</p><p>Оформление связано с требованиями статьи 20 Федерального закона № 323-ФЗ. Действующей веб-формы согласия на этом сайте нет: документ оформляется клиникой в предусмотренном порядке.</p></div></section>',
  }),
  makePage({
    file: 'guarantees.html',
    title: 'Гарантийные сроки и сроки службы',
    description: 'Таблица гарантийных сроков и сроков службы по отдельным стоматологическим работам.',
    heading: 'Гарантийные сроки',
    lead: 'Сроки из положения клиники с важными условиями применения.',
    body: `<section class="section"><div class="container">${patientNotice('Условия рассмотрения', '<p>Указанные сроки могут быть сокращены или прекращены при документированных клинических условиях и при несоблюдении пациентом рекомендаций и иных обязанностей. Требования рассматриваются по письменному заявлению пациента. Таблица не обещает автоматическое покрытие во всех случаях: решение зависит от условий положения клиники и установленных обстоятельств.</p>', 'shield')}<h2>Таблица сроков</h2><div class="table-scroll" tabindex="0" role="region" aria-label="Гарантийные сроки и сроки службы"><table><thead><tr><th scope="col">Работа</th><th scope="col">Гарантийный срок</th><th scope="col">Срок службы</th></tr></thead><tbody>${guaranteeRows}</tbody></table></div></div></section>`,
  }),
  makePage({
    file: 'complaints.html',
    title: 'Обращения и жалобы',
    description: 'Способы направить обращение в клинику и контакты надзорных органов Белгородской области.',
    heading: 'Обращения и жалобы',
    lead: 'Контакты клиники и территориальных надзорных органов.',
    heroImage: 'contacts',
    body: `<section class="section"><div class="container">${patientNotice('Обращение в клинику', `<p>Почтовый адрес: ${escapeHtml(CLINIC.complaintsPostalAddress)}.</p><p>Электронная почта: <a href="${escapeHtml(CONTACTS.emailHref)}">${escapeHtml(CONTACTS.email)}</a>.</p><p>Телефоны клиники:</p><p class="contact-actions">${CONTACTS.phones.map((phone) => `<a class="button button-secondary" href="${escapeHtml(phone.href)}">${escapeHtml(phone.label)}</a>`).join('')}</p><p>Если способ направления обращения не предусмотрен, потребитель или заказчик может направить жалобу в любой форме и любым способом.</p>`, 'mail')}</div></section><section class="section"><div class="container info-grid">${regulatorCards}</div></section>`,
  }),
  makePage({
    file: 'standards.html',
    title: 'Стандарты и нормативные источники',
    description: 'Официальные источники нормативных актов, стандартов и клинических рекомендаций.',
    heading: 'Стандарты и нормативные источники',
    lead: 'Ссылки на официальные публикации, актуальные на 11 августа 2026 года.',
    body: `<section class="section"><div class="container split"><article><h2>Платные медицинские услуги</h2><p>${escapeHtml(PAID_SERVICES_DATE_NOTICE)}</p><ul><li><a href="${escapeHtml(OFFICIAL_SOURCES.paidServices736)}">Официальная публикация постановления № 736</a></li><li><a href="${escapeHtml(OFFICIAL_SOURCES.paidServices659)}">Официальная публикация постановления № 659</a></li></ul><h2>Информация для независимой оценки качества</h2><p><a href="${escapeHtml(OFFICIAL_SOURCES.order118n)}">Приказ Минздрава России от 13 марта 2025 года № 118н</a> регулирует предоставление информации для проведения независимой оценки качества условий оказания услуг медицинскими организациями и устанавливает требования к содержанию и форме информации о медицинских организациях, размещаемой на официальных сайтах.</p><h2>Официальные базы</h2><ul><li><a href="${escapeHtml(OFFICIAL_SOURCES.legalInformation)}">Официальный интернет-портал правовой информации</a></li><li><a href="${escapeHtml(OFFICIAL_SOURCES.clinicalRecommendations)}">Рубрикатор клинических рекомендаций Минздрава России</a></li></ul></article><aside class="card legal-qr"><h2>QR-код на ресурсы</h2><img src="${escapeHtml(PUBLIC_DOCUMENTS.legalResourcesQr)}" alt="QR-код со ссылками на официальные правовые ресурсы и клинические рекомендации" width="512" height="512"></aside></div></section>`,
  }),
  makePage({
    file: 'privacy.html',
    title: 'Политика в отношении обработки персональных данных',
    description: 'Политика ООО «Стоматология Ваша улыбка» в отношении обработки и защиты персональных данных.',
    heading: 'Политика в отношении обработки персональных данных',
    lead: 'Как клиника обрабатывает и защищает данные пользователей сайта.',
    body: renderPrivacyPolicy(),
  }),
  makePage({
    file: 'cookies.html',
    title: 'Технические настройки и cookies',
    description: 'Какие локальные настройки хранит сайт и как пользователь может изменить выбор.',
    heading: 'Технические настройки и cookies',
    lead: 'Баннер управляет локальными предпочтениями и разрешением на онлайн-запись.',
    body: `<section class="section"><div class="container"><h2>Что хранится</h2><p>Сайт использует localStorage только с ключами <code>cookie-consent</code> и <code>accessibility-preferences</code>. <code>cookie-consent</code> версии 2 содержит только логический выбор <code>onlineBooking</code>. <code>accessibility-preferences</code> — строго проверяемая JSON-запись версии 2. Она содержит только настройки отображения — режим, масштаб, цветовую схему, шрифт, интервалы и показ изображений — и логическое значение голосовых подтверждений.</p><p>В localStorage сайта не сохраняются медицинские или контактные данные, текст произнесённых фраз и история выполненных действий. localStorage — это не HTTP-cookie и не файл cookie.</p><h2>Онлайн-запись 32top</h2><p>При разрешённом <code>onlineBooking</code> сайт загружает виджет с <code>book-app.32top.ru</code> только после нажатия «Записаться онлайн». Внешний сервис может применять собственные технические средства в соответствии со <a href="${escapeHtml(ONLINE_BOOKING.privacyUrl)}">своей политикой</a>. При отказе виджет не загружается, а запись по телефону продолжает работать.</p><h2>Голосовые подтверждения</h2><p>Голос используется только для коротких подтверждений изменения настроек. Для них браузер использует только доступный локальный русский голос браузера. Страница целиком не читается. Сторонние виджеты TTS или удалённые сервисы синтеза речи не загружаются, сетевого резервного сервиса нет.</p><h2>Чего на сайте нет</h2><p>Внешняя аналитика, рекламные идентификаторы и пиксели не загружаются. Также нет удалённых шрифтов и автоматических карт.</p><h2>Управление настройками</h2><p>Кнопка «Сбросить настройки» возвращает масштаб 100%, стандартную цветовую схему, фирменный шрифт и обычные интервалы, показывает изображения, выключает голосовые подтверждения и специальный режим. Если голос был включён, один раз произносится «Настройки сброшены», после чего голос остаётся выключенным. «Обычная версия сайта» отключает специальное отображение, но сохраняет выбранные предпочтения. Очистка данных сайта в браузере удаляет и <code>cookie-consent</code>, и <code>accessibility-preferences</code>. Значения также меняются при новом выборе или сбросе. Сам localStorage не передаёт эти данные клинике.</p><p>После отключения онлайн-записи новые страницы больше не загружают 32top. Если виджет уже был открыт, перезагрузите страницу для полного удаления загруженного стороннего компонента.</p><button class="button button-secondary" type="button" data-cookie-settings>Открыть настройки cookies</button></div></section>`,
  }),
]);
