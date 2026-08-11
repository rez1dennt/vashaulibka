import { CLINIC, CONTACTS, LICENSE } from '../data/clinic.js';
import {
  BENEFITS,
  GUARANTEES,
  OFFICIAL_SOURCES,
  PAID_SERVICES_DATE_NOTICE,
  PERSONAL_DATA_SAMPLE,
  PUBLIC_DOCUMENTS,
  REGULATORS,
} from '../data/legal.js';

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

const patientLinks = [
  ['services.html', 'Медицинская деятельность и услуги'],
  ['license.html', 'Лицензия и регистрационные документы'],
  ['payment.html', 'Оплата услуг'],
  ['benefits.html', 'Льготы и скидки клиники'],
  ['waiting-periods.html', 'Сроки ожидания'],
  ['oms.html', 'Участие в программе ОМС'],
  ['informed-consent.html', 'Информированное добровольное согласие'],
  ['guarantees.html', 'Гарантийные сроки'],
  ['complaints.html', 'Обращения и жалобы'],
  ['standards.html', 'Стандарты и нормативные источники'],
  ['personal-data-consent.html', 'Образец согласия на обработку персональных данных'],
  ['privacy.html', 'Политика конфиденциальности'],
  ['cookies.html', 'Технические настройки и cookies'],
];

const benefitsList = BENEFITS
  .map((benefit) => `<li><span>${escapeHtml(benefit.category)}</span><strong>${escapeHtml(benefit.discount)}</strong></li>`)
  .join('');

const guaranteeRows = GUARANTEES
  .map((item) => `<tr><th scope="row">${escapeHtml(item.work)}</th><td>${escapeHtml(item.warranty)}</td><td>${escapeHtml(item.serviceLife)}</td></tr>`)
  .join('');

const regulatorCards = REGULATORS
  .map((regulator) => `<article class="card"><h2>${escapeHtml(regulator.name)}</h2><p>${escapeHtml(regulator.address)}</p><p>${escapeHtml(regulator.phone)}</p><p><a href="${escapeHtml(regulator.url)}">Официальный сайт ведомства</a></p></article>`)
  .join('');

const makePage = (page) => Object.freeze({ heroImage: 'about', noindex: false, ...page });

export const LEGAL_PAGES = Object.freeze([
  makePage({
    file: 'patients.html',
    title: 'Информация для пациентов',
    description: 'Документы, правила, гарантии, обращения и сведения о конфиденциальности для пациентов клиники.',
    heading: 'Информация для пациентов',
    lead: 'Проверенные сведения клиники, документы и официальные источники.',
    body: `<section class="section"><div class="container"><h2>Разделы</h2><div class="info-grid patient-links">${patientLinks.map(([href, label]) => `<a class="card" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join('')}</div></div></section>`,
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
    body: '<section class="section"><div class="container"><article class="notice"><h2>Способы оплаты</h2><p>Оплата платных медицинских услуг осуществляется наличным и безналичным расчётом по выбору потребителя.</p></article><p>Утверждённый прейскурант пока не опубликован. До его публикации стоимость услуг уточняйте по официальным телефонам клиники.</p></div></section>',
  }),
  makePage({
    file: 'benefits.html',
    title: 'Льготы и скидки клиники',
    description: 'Скидки, предоставляемые клиникой отдельным категориям пациентов по внутреннему приказу.',
    heading: 'Льготы и скидки',
    lead: 'Скидки клиники по приказу от 13 января 2025 года.',
    body: `<section class="section"><div class="container"><div class="notice"><h2>Условия предоставления</h2><p>Это скидки, предоставляемые клиникой по её приказу от 13 января 2025 года, а не универсальные установленные законом скидки. Принадлежность к льготной категории и возможность применения скидки необходимо подтвердить в клинике до лечения.</p></div><h2>Категории пациентов</h2><ul class="benefit-list">${benefitsList}</ul></div></section>`,
  }),
  makePage({
    file: 'waiting-periods.html',
    title: 'Сроки ожидания медицинских услуг',
    description: 'Предельный и фактический сроки ожидания услуг после записи в клинику.',
    heading: 'Сроки ожидания',
    lead: 'Максимальный срок отсчитывается от момента записи.',
    body: '<section class="section"><div class="container"><article class="notice"><h2>Максимальный срок</h2><p>Максимальный срок ожидания составляет 30 дней с момента записи на приём.</p></article><h2>От чего зависит фактический срок</h2><p>Фактический срок зависит от выбранной услуги, клинической ситуации и других обстоятельств, указанных в документе клиники. Уточнить доступную дату можно по официальным телефонам.</p></div></section>',
  }),
  makePage({
    file: 'oms.html',
    title: 'Участие клиники в программе ОМС',
    description: 'Официальное уведомление об участии ООО «Стоматология Ваша улыбка» в территориальной программе.',
    heading: 'Участие в программе ОМС',
    lead: 'Сведения из предоставленного уведомления клиники.',
    body: '<section class="section"><div class="container"><article class="notice"><h2>Статус участия</h2><p>ООО «Стоматология Ваша улыбка» не участвует в реализации территориальной программы государственных гарантий бесплатного оказания гражданам медицинской помощи.</p></article></div></section>',
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
    body: `<section class="section"><div class="container"><div class="notice"><h2>Условия рассмотрения</h2><p>Указанные сроки могут быть сокращены или прекращены при документированных клинических условиях и при несоблюдении пациентом рекомендаций и иных обязанностей. Требования рассматриваются по письменному заявлению пациента. Таблица не обещает автоматическое покрытие во всех случаях: решение зависит от условий положения клиники и установленных обстоятельств.</p></div><h2>Таблица сроков</h2><div class="table-scroll" tabindex="0" role="region" aria-label="Гарантийные сроки и сроки службы"><table><thead><tr><th scope="col">Работа</th><th scope="col">Гарантийный срок</th><th scope="col">Срок службы</th></tr></thead><tbody>${guaranteeRows}</tbody></table></div></div></section>`,
  }),
  makePage({
    file: 'complaints.html',
    title: 'Обращения и жалобы',
    description: 'Способы направить обращение в клинику и контакты надзорных органов Белгородской области.',
    heading: 'Обращения и жалобы',
    lead: 'Контакты клиники и территориальных надзорных органов.',
    heroImage: 'contacts',
    body: `<section class="section"><div class="container"><article class="notice"><h2>Обращение в клинику</h2><p>Почтовый адрес: ${escapeHtml(CLINIC.complaintsPostalAddress)}.</p><p>Электронная почта: <a href="${escapeHtml(CONTACTS.emailHref)}">${escapeHtml(CONTACTS.email)}</a>.</p><p>Если способ направления обращения не предусмотрен, потребитель или заказчик может направить жалобу в любой форме и любым способом.</p></article></div></section><section class="section"><div class="container info-grid">${regulatorCards}</div></section>`,
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
    file: 'personal-data-consent.html',
    title: 'Образец согласия на обработку персональных данных',
    description: 'Информационный образец будущего согласия для записи на приём без действующей веб-формы.',
    heading: 'Образец согласия на обработку данных',
    lead: 'Только информационный образец для возможной будущей формы.',
    body: `<section class="section"><div class="container"><div class="notice"><h2>Статус образца</h2><p>Этот информационный образец не является акцептом или принятием согласия. На сайте нет действующей формы, которая использует этот текст или собирает персональные данные.</p></div><h2>Параметры возможной будущей формы</h2><dl class="definition-list"><div><dt>Категории данных</dt><dd>${PERSONAL_DATA_SAMPLE.categories.map(escapeHtml).join(', ')}</dd></div><div><dt>Цель</dt><dd>${escapeHtml(PERSONAL_DATA_SAMPLE.purpose)}</dd></div><div><dt>Допустимые операции</dt><dd>${PERSONAL_DATA_SAMPLE.operations.map(escapeHtml).join(', ')}</dd></div><div><dt>Срок хранения по образцу</dt><dd>До окончания обработки запроса, а при подтверждении записи — до заключения договора.</dd></div><div><dt>Отзыв</dt><dd>Отзыв согласия направляется оператору письменным заявлением.</dd></div></dl><p>Поставщик МИС и получатели данных не указываются, поскольку МИС не подключена.</p></div></section>`,
  }),
  makePage({
    file: 'privacy.html',
    title: 'Политика конфиденциальности сайта',
    description: 'Фактическая обработка данных на текущем сайте и способы связи с оператором.',
    heading: 'Политика конфиденциальности',
    lead: 'Описание только тех действий с данными, которые доступны на сайте сейчас.',
    body: `<section class="section"><div class="container"><h2>Оператор</h2><p>Оператор: ${escapeHtml(CLINIC.legalName)}, ОГРН ${escapeHtml(CLINIC.ogrn)}, ИНН ${escapeHtml(CLINIC.inn)}.</p><h2>Что происходит сейчас</h2><p>На сайте нет активной МИС и нет формы или поля ввода, собирающих персональные данные. Кнопка записи открывает телефонный диалог без передачи данных сайту. Ссылки на телефон и электронную почту передают дальнейшее действие приложению на устройстве пользователя.</p><p>В браузере сохраняются только технические настройки, описанные на странице <a href="cookies.html">«Технические настройки и cookies»</a>.</p><h2>Права и обращение</h2><p>По вопросам обработки данных, уточнения, блокирования, удаления или отзыва согласия можно обратиться письменно по адресу ${escapeHtml(CLINIC.complaintsPostalAddress)} или по электронной почте <a href="${escapeHtml(CONTACTS.emailHref)}">${escapeHtml(CONTACTS.email)}</a>.</p><h2>Что требуется завершить до запуска</h2><p>Поставщик хостинга, параметры реального домена и особенности серверных журналов или технических логов зависят от будущей инфраструктуры и будут уточнены в этой политике до публикации сайта на реальном домене. Эта страница не утверждает, что развёрнутая инфраструктура не создаёт технические журналы.</p></div></section>`,
  }),
  makePage({
    file: 'cookies.html',
    title: 'Технические настройки и cookies',
    description: 'Какие локальные настройки хранит сайт и как пользователь может изменить выбор.',
    heading: 'Технические настройки и cookies',
    lead: 'Сейчас баннер управляет только локальными техническими предпочтениями.',
    body: '<section class="section"><div class="container"><h2>Что хранится</h2><p>Сайт использует localStorage с ключами <code>cookie-consent</code> и <code>vision-mode</code>. Значения сохраняются, пока пользователь не изменит настройку или не очистит данные браузера или сайта. localStorage — это не HTTP-cookie и не файл cookie.</p><h2>Чего на сайте нет</h2><p>Не загружаются аналитика, рекламные идентификаторы или пиксели, удалённые шрифты, карты и сторонние виджеты.</p><h2>Управление настройками</h2><p>Традиционный баннер cookies сегодня управляет только этими техническими предпочтениями.</p><button class="button button-secondary" type="button" data-cookie-settings>Открыть настройки cookies</button></div></section>',
  }),
]);
