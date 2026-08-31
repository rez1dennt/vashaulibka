import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { CLINIC, CONTACTS, HOURS, LICENSE } from '../../src/data/clinic.js';
import { SERVICES } from '../../src/data/services.js';
import { STAFF } from '../../src/data/staff.js';
import { ABOUT_PAGE } from '../../src/content/about-page.js';
import { renderPage } from '../../src/templates/render-page.js';

describe('patient-oriented about page', () => {
  const render = () => new JSDOM(renderPage(ABOUT_PAGE)).window.document;

  it('renders the approved editorial section sequence and one heading', () => {
    const document = render();
    expect([...document.querySelectorAll('main > section')].map((node) => node.className)).toEqual([
      'page-hero page-hero--about',
      'about-section about-mission',
      'about-facts',
      'about-section about-space',
      'about-section about-services',
      'about-section about-team',
      'about-section about-license',
      'about-section about-legal',
      'about-section about-cta',
    ]);
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    expect(document.querySelector('h1')?.textContent).toBe('О клинике');
  });

  it('derives the four trust facts from confirmed data', () => {
    const document = render();
    const facts = [...document.querySelectorAll('.about-fact')].map((node) => node.textContent);
    expect(facts).toHaveLength(4);
    expect(facts[0]).toContain(CLINIC.registeredSince.match(/\d{4}/)?.[0]);
    expect(facts[1]).toContain(String(SERVICES.length));
    expect(facts[2]).toContain(String(STAFF.length));
    expect(facts[3]).toContain(LICENSE.status);
  });

  it('renders every licensed service and published staff member', () => {
    const document = render();
    expect([...document.querySelectorAll('.about-service h3')].map((node) => node.textContent)).toEqual(
      SERVICES.map((service) => service.title),
    );
    expect([...document.querySelectorAll('.about-team__person h3')].map((node) => node.textContent)).toEqual(
      STAFF.map((person) => person.name),
    );
    expect([...document.querySelectorAll('.about-team__role')].map((node) => node.textContent)).toEqual(
      STAFF.map((person) => person.role),
    );
    expect(document.querySelector('.about-team img')).toBeNull();
  });

  it('uses three real clinic photographs with descriptive alt text', () => {
    const document = render();
    expect([...document.querySelectorAll('.about-gallery img')].map((node) => node.getAttribute('src'))).toEqual([
      'assets/images/clinic-services.webp',
      'assets/images/clinic-home.webp',
      'assets/images/clinic-contacts.webp',
    ]);
    expect(document.querySelectorAll('.about-gallery figcaption')).toHaveLength(0);
    expect([...document.querySelectorAll('.about-gallery img')].every((img) => img.alt.length > 10)).toBe(true);
  });

  it('links the approved license and registration documents', () => {
    const document = render();
    expect(document.querySelector('.about-license__preview')?.getAttribute('href')).toBe(
      'documents/license-registry-extract.pdf',
    );
    expect(document.querySelector('.about-license__preview img')?.getAttribute('src')).toBe(
      'assets/documents/license-registry-extract.webp',
    );
    expect(document.querySelector('.about-license__secondary')?.getAttribute('href')).toBe(
      'documents/ogrn-certificate.pdf',
    );
    expect(document.querySelector('.about-license')?.textContent).toContain(LICENSE.number);
  });

  it('keeps legal and appointment facts exact without collecting personal data', () => {
    const document = render();
    for (const value of [CLINIC.legalName, CLINIC.ogrn, CLINIC.inn, CLINIC.registryAddress, CLINIC.activityAddress]) {
      expect(document.querySelector('.about-legal')?.textContent).toContain(value);
    }
    expect(document.querySelector('.about-cta [data-appointment-open]')?.getAttribute('href')).toBe(CONTACTS.phones[0].href);
    expect(document.querySelectorAll('.about-cta a[href^="tel:"]')).toHaveLength(CONTACTS.phones.length + 1);
    expect(document.querySelector('.about-cta form, .about-cta input, .about-cta textarea')).toBeNull();
    const actions = document.querySelector('.about-cta__actions');
    const phones = actions?.querySelector('.about-cta__phones');
    expect(actions?.querySelector(':scope > [data-appointment-open]')).not.toBeNull();
    expect(phones?.querySelectorAll('a[href^="tel:"]')).toHaveLength(CONTACTS.phones.length);
  });

  it('renders the confirmed schedule as four compact semantic cells', () => {
    const document = render();
    const cells = [...document.querySelectorAll('.about-hours > div')];

    expect(cells).toHaveLength(4);
    expect(cells.map((cell) => cell.querySelector('dt')?.textContent)).toEqual([
      HOURS.weekdays.label,
      HOURS.saturday.label,
      HOURS.sunday.label,
      'Режим',
    ]);
    expect(cells.map((cell) => cell.querySelector('dd')?.textContent)).toEqual([
      HOURS.weekdays.value,
      HOURS.saturday.value,
      HOURS.sunday.value,
      HOURS.breakNote,
    ]);
    expect(document.querySelector('.about-cta__schedule-heading .ui-icon')).not.toBeNull();
  });

  it('does not publish unsupported claims', () => {
    const text = render().body.textContent;
    expect(text).not.toMatch(/5\s?000|15\+|довольн\w* пациент|лет работы|современн\w* оборудован/i);
  });
});
