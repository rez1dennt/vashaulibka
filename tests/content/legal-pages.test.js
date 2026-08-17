import { existsSync, readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { LEGAL_PAGES } from '../../src/content/legal-pages.js';
import { PAGES } from '../../src/content/page-manifest.js';
import { CLINIC, CONTACTS, LICENSE } from '../../src/data/clinic.js';
import { BENEFITS, GUARANTEES } from '../../src/data/legal.js';
import { ONLINE_BOOKING } from '../../src/data/online-booking.js';
import { renderPage } from '../../src/templates/render-page.js';

const legalFiles = [
  'patients.html',
  'license.html',
  'payment.html',
  'benefits.html',
  'waiting-periods.html',
  'oms.html',
  'informed-consent.html',
  'guarantees.html',
  'complaints.html',
  'standards.html',
  'personal-data-consent.html',
  'privacy.html',
  'cookies.html',
];

const expectedBenefits = [
  { category: 'Инвалиды войны', discount: '10 %' },
  { category: 'Участники Великой Отечественной войны', discount: '10 %' },
  { category: 'Ветераны боевых действий в категориях, указанных в приказе клиники', discount: '10 %' },
  { category: 'Военнослужащие 1941–1945 годов в категориях, указанных в приказе клиники', discount: '10 %' },
  { category: 'Жители блокадного Ленинграда и осаждённого Севастополя', discount: '10 %' },
  { category: 'Работники объектов обороны и члены экипажей транспортного флота в категориях, указанных в приказе клиники', discount: '10 %' },
  { category: 'Члены семей погибших инвалидов войны, участников Великой Отечественной войны и ветеранов боевых действий в категориях, указанных в приказе клиники', discount: '10 %' },
  { category: 'Лица с инвалидностью', discount: '5 %' },
  { category: 'Ветераны и участники специальной военной операции', discount: '10 %' },
];

const expectedGuarantees = [
  { work: 'Стеклоиономерная пломба, I класс по Блэку', warranty: '6 месяцев', serviceLife: '1 год' },
  { work: 'Стеклоиономерная пломба, II–V классы по Блэку', warranty: '9 месяцев', serviceLife: '1 год' },
  { work: 'Светоотверждаемая пломба, I класс по Блэку', warranty: '1 год', serviceLife: '2 года' },
  { work: 'Светоотверждаемая пломба, II–V классы по Блэку', warranty: '9 месяцев', serviceLife: '1 год' },
  { work: 'Керамические виниры', warranty: '1 год', serviceLife: '2 года' },
  { work: 'Временные пластмассовые коронки', warranty: '3 месяца', serviceLife: '6 месяцев' },
  { work: 'Керамические коронки, коронки и вкладки E-max', warranty: '1 год', serviceLife: '2 года' },
  { work: 'Металлокерамические коронки и мостовидные протезы', warranty: '2 года', serviceLife: '5 лет' },
  { work: 'Циркониевые коронки и мостовидные протезы', warranty: '2 года', serviceLife: '5 лет' },
  { work: 'Съёмный пластиночный протез', warranty: '1 год', serviceLife: '2 года' },
  { work: 'Бюгельные и условно-съёмные протезы', warranty: '2 года', serviceLife: '5 лет' },
];

const pageDocument = (file) => {
  const page = LEGAL_PAGES.find((item) => item.file === file);
  expect(page, `${file} is present in LEGAL_PAGES`).toBeDefined();
  return new JSDOM(renderPage(page)).window.document;
};

const normalizedText = (document) => document.body.textContent.replace(/\s+/g, ' ').trim();

describe('patient and legal page manifest', () => {
  it('contains all 13 patient routes exactly once and exposes them from the patient hub', () => {
    expect(LEGAL_PAGES.map((page) => page.file)).toEqual(legalFiles);
    expect(new Set(LEGAL_PAGES.map((page) => page.file))).toHaveLength(legalFiles.length);
    expect(PAGES).toHaveLength(22);

    const hub = pageDocument('patients.html');
    for (const target of legalFiles.filter((file) => file !== 'patients.html')) {
      expect(hub.querySelector(`a[href="${target}"]`), `${target} is linked from patients.html`).not.toBeNull();
    }
    expect(hub.querySelector('.patient-links a[href="services.html"]')?.textContent).toContain('Медицинская деятельность и услуги');
    expect(hub.querySelector('a[href="documents.html"]')?.textContent).toContain('Документы');
  });

  it('groups the patient hub into scannable icon cards without losing destinations', () => {
    const hub = pageDocument('patients.html');
    const groups = [...hub.querySelectorAll('.patient-hub__group')];
    const cards = [...hub.querySelectorAll('.patient-link-card')];

    expect(groups).toHaveLength(3);
    expect(groups.map((group) => group.querySelector('h2')?.textContent)).toEqual([
      'Лечение и оплата',
      'Документы и гарантии',
      'Права и персональные данные',
    ]);
    expect(cards).toHaveLength(14);
    expect(cards.every((card) => card.querySelector('.ui-icon') && card.querySelector('.patient-link-card__arrow'))).toBe(true);
    expect(new Set(cards.map((card) => card.getAttribute('href'))).size).toBe(14);
  });

  it('uses one editorial layout and related navigation across every patient route', () => {
    for (const page of LEGAL_PAGES) {
      expect(page.layout, `${page.file} has the patient layout marker`).toBe('patient');
      const document = pageDocument(page.file);

      expect(document.querySelector('main')?.classList.contains('main--patient')).toBe(true);
      expect(document.querySelector('.patient-content'), `${page.file} has an editorial content shell`).not.toBeNull();
      expect(document.querySelector('.patient-related a[href="patients.html"]')).not.toBeNull();
      expect(document.querySelector('.patient-related a[href="services.html"]')).not.toBeNull();
      expect(document.querySelector(`.patient-related a[href="${CONTACTS.phones[0].href}"][data-appointment-open]`)).not.toBeNull();
    }
  });

  it('adds a decorative SVG marker to every highlighted patient notice', () => {
    for (const file of ['payment.html', 'benefits.html', 'waiting-periods.html', 'oms.html', 'guarantees.html', 'complaints.html', 'personal-data-consent.html']) {
      const document = pageDocument(file);
      const notices = [...document.querySelectorAll('.patient-notice')];

      expect(notices.length, `${file} has a notice`).toBeGreaterThan(0);
      expect(notices.every((notice) => notice.querySelector('.patient-notice__icon .ui-icon'))).toBe(true);
    }
  });

  it('publishes centralized registration and license facts plus only the approved originals', () => {
    const document = pageDocument('license.html');
    const text = normalizedText(document);

    expect(text).toContain(LICENSE.number);
    expect(text).toContain('16 ноября 2012 года');
    expect(text).toContain(LICENSE.authority);
    expect(text).toContain(CLINIC.ogrn);
    expect(text).toContain(CLINIC.inn);
    expect(document.querySelector('a[href="documents/license-registry-extract.pdf"]')).not.toBeNull();
    expect(document.querySelector('a[href="documents/ogrn-certificate.pdf"]')).not.toBeNull();
    expect(existsSync('public/documents/license-registry-extract.pdf')).toBe(true);
    expect(existsSync('public/documents/ogrn-certificate.pdf')).toBe(true);
    expect(existsSync('public/assets/qr/legal-resources.png')).toBe(true);
  });

  it('states the exact payment, waiting-period, OMS, benefit, and informed-consent boundaries', () => {
    const payment = normalizedText(pageDocument('payment.html'));
    const waiting = normalizedText(pageDocument('waiting-periods.html'));
    const oms = normalizedText(pageDocument('oms.html'));
    const benefitsDocument = pageDocument('benefits.html');
    const benefits = normalizedText(benefitsDocument);
    const consent = normalizedText(pageDocument('informed-consent.html'));

    expect(payment).toContain('Оплата платных медицинских услуг осуществляется наличным и безналичным расчётом по выбору потребителя.');
    expect(payment).toMatch(/прейскурант.*пока не опубликован.*стоимость.*телефон/i);
    expect(payment).not.toContain('CONTENT_CHECKLIST.md');
    expect(waiting).toContain('30 дней');
    expect(waiting).toMatch(/фактическ.*зависит.*услуг.*клиническ.*ситуац/i);
    expect(oms).toContain('ООО «Стоматология Ваша улыбка» не участвует в реализации территориальной программы государственных гарантий бесплатного оказания гражданам медицинской помощи.');
    expect(consent).toMatch(/стать[еи] 20.*323-ФЗ/i);
    expect(consent).toMatch(/метод.*риск.*альтернатив.*последств.*ожидаем/i);
    expect(consent).toMatch(/действующ.*веб-форм.*нет/i);

    expect(benefits).toContain('13 января 2025 года');
    expect(benefits).toMatch(/не.*универсальн.*закон/i);
    expect(benefits).toMatch(/подтверд.*клиник.*до.*лечен/i);
    expect(BENEFITS).toEqual(expectedBenefits);
    expect([...benefitsDocument.querySelectorAll('.benefit-list li')].map((item) => ({
      category: item.querySelector('span')?.textContent,
      discount: item.querySelector('strong')?.textContent,
    }))).toEqual(expectedBenefits);
  });

  it('renders the complete guarantee table with visible qualifications', () => {
    const document = pageDocument('guarantees.html');
    const text = normalizedText(document);
    const table = document.querySelector('.table-scroll table');

    expect(table?.querySelector('thead')).not.toBeNull();
    expect(table?.querySelector('tbody')).not.toBeNull();
    expect(table?.querySelectorAll('thead th[scope="col"]')).toHaveLength(3);
    expect(GUARANTEES).toEqual(expectedGuarantees);
    expect([...table.querySelectorAll('tbody tr')].map((row) => ({
      work: row.cells[0]?.textContent,
      warranty: row.cells[1]?.textContent,
      serviceLife: row.cells[2]?.textContent,
    }))).toEqual(expectedGuarantees);
    expect(text).toMatch(/срок.*сокращ|прекращ/i);
    expect(text).toMatch(/клиническ.*услов|соблюден.*пациент/i);
    expect(text).toMatch(/письменн.*заявлен/i);
    expect(text).toMatch(/не.*обещает.*автоматическ.*покрыт/i);
  });

  it('uses the date-aware paid-services wording and official legal sources', () => {
    const document = pageDocument('standards.html');
    const text = normalizedText(document);

    expect(text).toContain('До 31 августа 2026 года применяются Правила предоставления платных медицинских услуг, утверждённые постановлением Правительства РФ от 11 мая 2023 года № 736. С 1 сентября 2026 года применяются Правила, утверждённые постановлением Правительства РФ от 30 мая 2026 года № 659.');
    for (const href of [
      'https://publication.pravo.gov.ru/document/0001202504110006',
      'https://publication.pravo.gov.ru/document/0001202305120025',
      'https://publication.pravo.gov.ru/document/0001202606010083',
      'https://pravo.gov.ru/',
      'https://cr.minzdrav.gov.ru/',
    ]) {
      expect(document.querySelector(`a[href="${href}"]`), href).not.toBeNull();
    }
    expect(document.querySelector('img[src="assets/qr/legal-resources.png"][alt]:not([alt=""])')).not.toBeNull();
    expect(text).toContain('Информация для независимой оценки качества');
    expect(text).toContain('требования к содержанию и форме информации о медицинских организациях, размещаемой на официальных сайтах');
    expect(text).not.toContain('Порядок оказания помощи');
  });

  it('publishes the clinic and regulator complaint paths', () => {
    const document = pageDocument('complaints.html');
    const text = normalizedText(document);

    expect(text).toContain(CLINIC.complaintsPostalAddress);
    expect(text).toContain(CONTACTS.email);
    expect(text).toMatch(/люб.*форм.*люб.*способ/i);
    expect(text).toContain('Управление Роспотребнадзора по Белгородской области');
    expect(text).toContain('308023, г. Белгород, ул. Железнякова, д. 2');
    expect(text).toContain('+7 (4722) 34-03-16');
    expect(text).toContain('Территориальный орган Росздравнадзора по Белгородской области');
    expect(text).toContain('308007, г. Белгород, ул. Мичурина, д. 56');
    expect(text).not.toContain('308000, г. Белгород, ул. Мичурина, д. 56, 5 этаж');
    expect(text).toContain('+7 (4722) 31-05-11');
    expect(document.querySelector('a[href="https://31.rospotrebnadzor.ru/kontakty/"]')).not.toBeNull();
    expect(document.querySelector('a[href="https://31reg.roszdravnadzor.gov.ru/"]')).not.toBeNull();
  });

  it('describes only actual personal-data and browser-storage behavior', () => {
    const sampleDocument = pageDocument('personal-data-consent.html');
    const sample = normalizedText(sampleDocument);
    const privacy = normalizedText(pageDocument('privacy.html'));
    const cookieDocument = pageDocument('cookies.html');
    const cookies = normalizedText(cookieDocument);

    expect(sample).toMatch(/информационн.*образец/i);
    expect(sample).toMatch(/не.*акцепт|не.*принят/i);
    expect(sample).toMatch(/нет.*действующ.*форм|форм.*не.*использ/i);
    for (const value of ['имя', 'телефон', 'электронная почта', 'запись на приём', 'сбор', 'запись', 'систематизация', 'накопление', 'хранение', 'уточнение', 'извлечение', 'использование', 'блокирование', 'удаление', 'уничтожение']) {
      expect(sample.toLowerCase()).toContain(value);
    }
    expect(sample).toMatch(/до окончания обработки запроса.*до заключения договора/i);
    expect(sample).toMatch(/отзыв.*письменн.*заявлен/i);

    expect(privacy).toContain(CLINIC.legalName);
    expect(privacy).toContain(CONTACTS.email);
    expect(privacy).toContain(ONLINE_BOOKING.providerName);
    expect(privacy).toContain('book-app.32top.ru');
    expect(privacy).toMatch(/фамили.*имя.*отчеств.*телефон/i);
    expect(privacy).toMatch(/врач.*дат.*врем/i);
    expect(privacy).toMatch(/сервисн.*SMS.*запис.*дат.*врем.*назван.*клиник/i);
    expect(privacy).toMatch(/сайт.*не.*формир.*не.*отправ.*SMS/i);
    expect(privacy).not.toContain('Здравствуйте, {Имя пациента}');
    expect(privacy).toMatch(/только.*разрешен|явн.*выбор/i);
    expect(privacy).toMatch(/запис.*телефон/i);
    expect(privacy).not.toMatch(/МИС не подключена|нет подключ[её]нной МИС/i);
    expect(privacy).toMatch(/серверн.*журнал|техническ.*лог/i);
    expect(privacy).not.toContain('CONTENT_CHECKLIST.md');
    expect(privacy).not.toMatch(/что требуется завершить|будут.*уточнены.*до публикации/i);

    expect(cookies).toContain('localStorage');
    expect(cookies).toContain('cookie-consent');
    expect(cookies).toContain('accessibility-preferences');
    expect(cookies).toContain('32top');
    expect(cookies).toMatch(/onlineBooking.*верси[яи]\s*2/i);
    expect(cookieDocument.querySelector(`a[href="${ONLINE_BOOKING.privacyUrl}"]`)).not.toBeNull();
    expect(cookies).toMatch(/accessibility-preferences.*верси[яи]\s*2/i);
    expect(cookies).toMatch(/настройк.*отображен.*логическ.*голосов.*подтвержд/i);
    expect(cookies).toMatch(/не сохраняются.*медицинск.*контактн.*текст.*фраз.*истори.*действ/i);
    expect(cookies).toMatch(/коротк.*подтвержд.*изменен.*настро/i);
    expect(cookies).toMatch(/локальн.*русск.*голос.*браузер/i);
    expect(cookies).toMatch(/страниц.*целиком.*не чита/i);
    expect(cookies).toMatch(/сторонн.*виджет.*(?:TTS|синтез.*реч).*не загруж/i);
    expect(cookies).toMatch(/сброс.*100.*стандартн.*схем.*фирменн.*шрифт.*обычн.*интервал.*показ.*изображ.*выключ.*голос.*специальн.*режим/i);
    expect(cookies).toMatch(/очист.*данн.*браузер.*cookie-consent.*accessibility-preferences/i);
    expect(cookies).not.toContain('vision-mode');
    expect(cookies).toMatch(/не.*HTTP-cookie|не.*файл.*cookie/i);
    expect(cookies).toMatch(/пока.*пользователь.*измен|очист.*данн/i);
    expect(cookies).toMatch(/аналитик.*реклам.*идентификатор.*пиксел/i);
    expect(cookies).toMatch(/аналитик.*реклам.*пиксел.*не загруж/i);
    expect(cookieDocument.querySelector('[data-cookie-settings]')).not.toBeNull();

    expect(privacy).toContain('accessibility-preferences');
    expect(privacy).not.toContain('vision-mode');
    expect(`${privacy} ${cookies}`).not.toMatch(/сайт (?:полностью )?соответствует.*(?:WCAG|ГОСТ)/i);

    for (const file of legalFiles) {
      const document = pageDocument(file);
      expect(document.querySelector('form, textarea, select, input:not([data-search-input]):not([data-cookie-online-booking])')).toBeNull();
      expect(document.querySelectorAll('input[data-search-input]:not([name])')).toHaveLength(1);
    }
  });

  it('publishes a structured operator policy with confirmed details and no invented MIS processing', () => {
    const document = pageDocument('privacy.html');
    const text = normalizedText(document);
    const expectedSections = [
      'privacy-general',
      'privacy-operator',
      'privacy-principles',
      'privacy-current-site',
      'privacy-technical-data',
      'privacy-purposes',
      'privacy-processing',
      'privacy-third-parties',
      'privacy-security',
      'privacy-rights',
      'privacy-storage',
      'privacy-updates',
    ];

    expect(document.querySelector('.privacy-policy')).not.toBeNull();
    expect([...document.querySelectorAll('.privacy-policy__section[id]')].map((section) => section.id))
      .toEqual(expectedSections);
    expect([...document.querySelectorAll('.privacy-policy__contents a')].map((link) => link.getAttribute('href')))
      .toEqual(expectedSections.map((id) => `#${id}`));

    for (const value of [
      CLINIC.legalName,
      CLINIC.ogrn,
      CLINIC.inn,
      CLINIC.activityAddress,
      CLINIC.complaintsPostalAddress,
      CONTACTS.email,
      ...CONTACTS.phones.map((phone) => phone.label),
    ]) expect(text).toContain(value);

    expect(document.querySelector(`a[href="${CONTACTS.emailHref}"]`)).not.toBeNull();
    for (const phone of CONTACTS.phones) {
      expect(document.querySelector(`a[href="${phone.href}"]`)).not.toBeNull();
    }

    expect(text).toContain('Редакция от 13 августа 2026 года');
    expect(text).toMatch(/МИС 32top.*явн.*разреш|явн.*разреш.*МИС 32top/i);
    expect(text).toMatch(/IP-адрес.*дат.*врем.*запрос.*адрес.*страниц.*браузер.*устройств/i);
    expect(text).toMatch(/биометрическ.*не.*собира/i);
    expect(text).toMatch(/уточнен.*блокирован.*удален.*отзыв.*соглас/i);
    expect(text).toMatch(/Роскомнадзор|уполномоченн.*орган/i);
    expect(text).toMatch(/договорн.*рол.*локализац.*срок.*инцидент/i);
    expect(text).not.toMatch(/что требуется завершить|будут.*уточнены.*до публикации|CONTENT_CHECKLIST/i);
    expect(document.querySelector('form, textarea, select, input:not([data-search-input]):not([data-cookie-online-booking])')).toBeNull();
    expect(document.querySelectorAll('input[data-search-input]:not([name])')).toHaveLength(1);
  });

  it('introduces no unsupported service claims or broken internal page/document links', () => {
    const copy = LEGAL_PAGES.map((page) => page.body).join(' ');
    expect(copy).not.toMatch(/имплант|хирург|ортодонт/i);

    const routeSet = new Set(PAGES.map((page) => page.file));
    for (const page of PAGES) {
      const document = new JSDOM(renderPage(page)).window.document;
      for (const link of document.querySelectorAll('a[href]')) {
        const href = link.getAttribute('href');
        if (/^(?:https?:|mailto:|tel:|#)/.test(href)) continue;
        if (href.startsWith('documents/')) {
          expect(existsSync(`public/${href}`), `${page.file} -> ${href}`).toBe(true);
        } else {
          expect(routeSet.has(href), `${page.file} -> ${href}`).toBe(true);
        }
      }
    }
  });

  it('allows long legal headings to wrap without expanding the mobile page', () => {
    const css = readFileSync('src/styles/layout.css', 'utf8');

    expect(css).toMatch(/\.page-hero \.container\s*\{[^}]*min-inline-size:\s*0/s);
    expect(css).toMatch(/\.page-hero h1\s*\{[^}]*overflow-wrap:\s*anywhere/s);
  });
});
