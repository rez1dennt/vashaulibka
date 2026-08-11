import { existsSync, readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { LEGAL_PAGES } from '../../src/content/legal-pages.js';
import { PAGES } from '../../src/content/page-manifest.js';
import { CLINIC, CONTACTS, LICENSE } from '../../src/data/clinic.js';
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
    expect(PAGES).toHaveLength(21);

    const hub = pageDocument('patients.html');
    for (const target of legalFiles.filter((file) => file !== 'patients.html')) {
      expect(hub.querySelector(`a[href="${target}"]`), `${target} is linked from patients.html`).not.toBeNull();
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
    const benefits = normalizedText(pageDocument('benefits.html'));
    const consent = normalizedText(pageDocument('informed-consent.html'));

    expect(payment).toContain('Оплата платных медицинских услуг осуществляется наличным и безналичным расчётом по выбору потребителя.');
    expect(waiting).toContain('30 дней');
    expect(waiting).toMatch(/фактическ.*зависит.*услуг.*клиническ.*ситуац/i);
    expect(oms).toContain('ООО «Стоматология Ваша улыбка» не участвует в реализации территориальной программы государственных гарантий бесплатного оказания гражданам медицинской помощи.');
    expect(consent).toMatch(/стать[еи] 20.*323-ФЗ/i);
    expect(consent).toMatch(/метод.*риск.*альтернатив.*последств.*ожидаем/i);
    expect(consent).toMatch(/действующ.*веб-форм.*нет/i);

    expect(benefits).toContain('13 января 2025 года');
    expect(benefits).toMatch(/не.*универсальн.*закон/i);
    expect(benefits).toMatch(/подтверд.*клиник.*до.*лечен/i);
    expect(benefits.match(/10\s?%/g)).toHaveLength(8);
    expect(benefits.match(/5\s?%/g)).toHaveLength(1);
  });

  it('renders the complete guarantee table with visible qualifications', () => {
    const document = pageDocument('guarantees.html');
    const text = normalizedText(document);
    const table = document.querySelector('.table-scroll table');

    expect(table?.querySelector('thead')).not.toBeNull();
    expect(table?.querySelector('tbody')).not.toBeNull();
    expect(table?.querySelectorAll('thead th[scope="col"]')).toHaveLength(3);
    expect(table?.querySelectorAll('tbody tr')).toHaveLength(11);
    expect([...table.querySelectorAll('tbody tr')].map((row) => [...row.cells].map((cell) => cell.textContent))).toContainEqual(
      ['Стеклоиономерная пломба, I класс по Блэку', '6 месяцев', '1 год'],
    );
    expect([...table.querySelectorAll('tbody tr')].map((row) => [...row.cells].map((cell) => cell.textContent))).toContainEqual(
      ['Металлокерамические коронки и мостовидные протезы', '2 года', '5 лет'],
    );
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
    expect(text).toContain('308000, г. Белгород, ул. Мичурина, д. 56, 5 этаж');
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
    expect(privacy).toMatch(/нет.*МИС|МИС.*не.*подключ/i);
    expect(privacy).toMatch(/телефон.*диалог/i);
    expect(privacy).toMatch(/серверн.*журнал|техническ.*лог/i);
    expect(privacy).toContain('CONTENT_CHECKLIST.md');

    expect(cookies).toContain('localStorage');
    expect(cookies).toContain('cookie-consent');
    expect(cookies).toContain('vision-mode');
    expect(cookies).toMatch(/не.*HTTP-cookie|не.*файл.*cookie/i);
    expect(cookies).toMatch(/пока.*пользователь.*измен|очист.*данн/i);
    expect(cookies).toMatch(/аналитик.*реклам.*идентификатор.*пиксел/i);
    expect(cookies).toMatch(/удал[её]нн.*шрифт.*карт.*виджет/i);
    expect(cookieDocument.querySelector('[data-cookie-settings]')).not.toBeNull();

    for (const file of legalFiles) {
      const document = pageDocument(file);
      expect(document.querySelector('form, input, textarea, select')).toBeNull();
    }
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
