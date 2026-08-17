import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { CLINIC, CONTACTS, HOURS, LICENSE } from '../../src/data/clinic.js';
import { SERVICES } from '../../src/data/services.js';
import { STAFF } from '../../src/data/staff.js';
import { PRICE_LIST } from '../../src/data/documents.js';
import { HOME_PAGE } from '../../src/content/home-page.js';
import { renderPage } from '../../src/templates/render-page.js';

describe('premium light homepage', () => {
  const render = () => new JSDOM(renderPage(HOME_PAGE)).window.document;

  it('offers the five primary patient journeys immediately after the hero', () => {
    const document = render();

    expect([...document.querySelectorAll('.quick-card h2')].map((node) => node.textContent.trim())).toEqual([
      'Лицензии и документы',
      'Специалисты',
      'Услуги',
      'Цены',
      'Запись на приём',
    ]);
    expect(document.querySelectorAll('.quick-card .ui-icon')).toHaveLength(5);
  });

  it('summarizes every licensed service and confirmed staff member only', () => {
    const document = render();

    expect([...document.querySelectorAll('.home-service-card h3')].map((node) => node.textContent.trim())).toEqual(
      SERVICES.map((service) => service.title),
    );
    expect([...document.querySelectorAll('.home-staff-card h3')].map((node) => node.textContent.trim())).toEqual(
      STAFF.map((person) => person.name),
    );
    expect(document.querySelector('.home-staff img')).toBeNull();
  });

  it('links real document previews to the approved PDFs', () => {
    const document = render();
    const cards = [...document.querySelectorAll('.document-card')];

    expect(cards).toHaveLength(2);
    expect(cards.map((card) => card.querySelector('img')?.getAttribute('src'))).toEqual([
      'assets/documents/license-registry-extract.webp',
      'assets/documents/ogrn-certificate.webp',
    ]);
    expect(cards.map((card) => card.getAttribute('href'))).toEqual([
      'documents/license-registry-extract.pdf',
      'documents/ogrn-certificate.pdf',
    ]);
  });

  it('publishes the approved price source without transcribing individual amounts', () => {
    const document = render();
    const pricePanel = document.querySelector('.home-price-panel');

    expect(pricePanel?.textContent).toContain(PRICE_LIST.approvedLabel);
    expect(pricePanel?.textContent).toContain(`${PRICE_LIST.pageCount} страниц`);
    expect(pricePanel?.textContent).not.toContain('Прейскурант готовится к публикации');
    expect(pricePanel?.textContent).not.toMatch(/\d[\d\s]*\s(?:₽|руб)/i);
    expect(document.querySelector('.home-contact form, .home-contact input')).toBeNull();
    expect(document.querySelector('.home-contact [data-appointment-open]')?.getAttribute('href')).toBe(CONTACTS.phones[0].href);
  });

  it('renders contacts as aligned icon-and-text rows', () => {
    const document = render();
    const rows = [...document.querySelectorAll('.home-contact__row')];

    expect(rows).toHaveLength(5);
    expect(document.querySelectorAll('.home-contact__phones .home-contact__row')).toHaveLength(CONTACTS.phones.length);
    expect(document.querySelector('.home-contact__schedule > .ui-icon')).not.toBeNull();
    expect(document.querySelector('.home-contact__hours')).not.toBeNull();
  });

  it('renders the schedule as four verified definition cells', () => {
    const document = render();
    const cells = [...document.querySelectorAll('.home-contact__hours > div')];

    expect(cells).toHaveLength(4);
    expect(cells.map((cell) => [cell.querySelector('dt')?.textContent, cell.querySelector('dd')?.textContent])).toEqual([
      [HOURS.weekdays.label, HOURS.weekdays.value],
      [HOURS.saturday.label, HOURS.saturday.value],
      [HOURS.sunday.label, HOURS.sunday.value],
      ['Перерыв', HOURS.breakNote],
    ]);
    expect(document.querySelector('.home-contact__break')).toBeNull();
  });

  it('uses only verified clinic facts and explicitly labels generated interiors', () => {
    const document = render();

    expect(document.body.textContent).toContain(CLINIC.legalName);
    expect(document.body.textContent).toContain(LICENSE.number);
    expect(document.body.textContent).toContain(CLINIC.activityAddress);
    expect(document.querySelectorAll('.hero-visualization-label')).toHaveLength(3);
    expect([...document.querySelectorAll('.hero-visualization-label')].every((node) => node.textContent === 'Визуализация интерьера')).toBe(true);
  });

  it('keeps the agreed editorial section sequence and one page heading', () => {
    const document = render();
    const sections = [...document.querySelectorAll('main > section')].map((section) => section.className);

    expect(sections).toEqual([
      'home-hero',
      'quick-links',
      'home-section home-about',
      'home-section home-services',
      'home-section home-staff-prices',
      'home-section home-patients',
      'home-section home-documents',
      'home-section home-contact',
    ]);
    expect(document.querySelectorAll('h1')).toHaveLength(1);
  });

  it('adds decorative companions only to the approved homepage sections', () => {
    const document = render();

    expect([...document.querySelectorAll('.home-decor')].map((node) => node.classList[1])).toEqual([
      'home-decor--hero-smile',
      'home-decor--hero-tooth',
      'home-decor--quick-tooth',
      'home-decor--services-dental',
      'home-decor--staff-jaw',
      'home-decor--patients-docs',
    ]);
    expect([...document.querySelectorAll('.home-decor')].every((node) => node.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(document.querySelector('.home-about .home-decor')).toBeNull();
    expect(document.querySelector('.home-documents .home-decor')).toBeNull();
    expect(document.querySelector('.home-contact .home-decor')).toBeNull();
  });

  it('keeps decorative companions free of interactive or meaningful content', () => {
    const document = render();

    for (const decoration of document.querySelectorAll('.home-decor')) {
      expect(decoration.children).toHaveLength(0);
      expect(decoration.textContent).toBe('');
      expect(decoration.matches('a, button, img, svg')).toBe(false);
    }
  });
});
