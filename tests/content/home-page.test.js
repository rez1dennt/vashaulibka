import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { CLINIC, CONTACTS, LICENSE } from '../../src/data/clinic.js';
import { SERVICES } from '../../src/data/services.js';
import { STAFF } from '../../src/data/staff.js';
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

  it('keeps price and appointment publishing controlled', () => {
    const document = render();

    expect(document.querySelector('.home-price-panel')?.textContent).toContain('Стоимость уточняется у администратора');
    expect(document.querySelector('.home-price-panel')?.textContent).not.toMatch(/\d[\d\s]*\s(?:₽|руб)/i);
    expect(document.querySelector('.home-contact form, .home-contact input')).toBeNull();
    expect(document.querySelector('.home-contact [data-appointment-open]')?.getAttribute('href')).toBe(CONTACTS.phones[0].href);
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
});
