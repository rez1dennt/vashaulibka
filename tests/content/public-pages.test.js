import { existsSync, readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { LEGAL_PAGES } from '../../src/content/legal-pages.js';
import { PAGES } from '../../src/content/page-manifest.js';
import { CLINIC, CONTACTS, HOURS } from '../../src/data/clinic.js';
import { SERVICES } from '../../src/data/services.js';
import { INCOMPLETE_CONTENT, STAFF } from '../../src/data/staff.js';
import { renderPage } from '../../src/templates/render-page.js';

const approvedFiles = [
  'index.html',
  'about.html',
  'services.html',
  'specialists.html',
  'prices.html',
  'reviews.html',
  'vacancies.html',
  'contacts.html',
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

const HERO_ILLUSTRATION_NOTE = 'Иллюстративное изображение — не фотография помещений клиники.';

const renderedPages = () => PAGES.map((page) => ({
  page,
  html: renderPage(page),
  document: new JSDOM(renderPage(page)).window.document,
}));

describe('public page manifest', () => {
  it('contains exactly the approved public and patient routes once', () => {
    expect(PAGES.map((page) => page.file)).toEqual(expect.arrayContaining(approvedFiles));
    expect(PAGES).toHaveLength(approvedFiles.length);
    expect(new Set(PAGES.map((page) => page.file))).toHaveLength(approvedFiles.length);

    const legalModulePath = 'src/content/legal-pages.js';
    expect(existsSync(legalModulePath)).toBe(true);
    expect(LEGAL_PAGES).toHaveLength(13);
    expect(Object.isFrozen(LEGAL_PAGES)).toBe(true);
  });

  it('publishes the hero illustration distinction in every generated page', () => {
    for (const file of approvedFiles) {
      const document = new JSDOM(readFileSync(file, 'utf8')).window.document;
      const note = document.querySelector('.page-hero .hero-illustration-note');

      expect(note?.textContent, file).toBe(HERO_ILLUSTRATION_NOTE);
    }
  });

  it('uses unique metadata and renders one page heading per route', () => {
    for (const key of ['title', 'description', 'heading']) {
      expect(new Set(PAGES.map((page) => page[key]))).toHaveLength(approvedFiles.length);
    }

    for (const { page, document } of renderedPages()) {
      expect(document.querySelectorAll('h1')).toHaveLength(1);
      expect(document.querySelector('h1')?.textContent).toBe(page.heading);
      expect(document.querySelector('meta[name="description"]')?.content).toBe(page.description);
    }
  });

  it('keeps only specialists and prices out of search indexes', () => {
    expect(PAGES.filter((page) => page.noindex).map((page) => page.file)).toEqual([
      'specialists.html',
      'prices.html',
    ]);
    expect(PAGES.find((page) => page.file === 'specialists.html')?.noindex).toBe(INCOMPLETE_CONTENT.specialists.noindex);
    expect(PAGES.find((page) => page.file === 'prices.html')?.noindex).toBe(INCOMPLETE_CONTENT.prices.noindex);

    for (const { page, document } of renderedPages()) {
      expect(document.querySelector('meta[name="robots"]')?.content).toBe(
        page.noindex ? 'noindex, follow' : 'index, follow',
      );
    }
  });

  it('publishes exactly the supplied staff and licensed service content', () => {
    const specialists = PAGES.find((page) => page.file === 'specialists.html');
    const services = PAGES.find((page) => page.file === 'services.html');
    const specialistDocument = new JSDOM(renderPage(specialists)).window.document;
    const serviceDocument = new JSDOM(renderPage(services)).window.document;

    expect([...specialistDocument.querySelectorAll('.staff-card h2')].map((node) => node.textContent)).toEqual(
      STAFF.map((person) => person.name),
    );
    expect([...specialistDocument.querySelectorAll('.staff-card .staff-role')].map((node) => node.textContent)).toEqual(
      STAFF.map((person) => person.role),
    );
    expect(specialistDocument.querySelectorAll('.staff-card')).toHaveLength(5);
    expect(specialistDocument.querySelector('.staff-list img')).toBeNull();

    const tabLabels = [...serviceDocument.querySelectorAll('.services-tabs-view [role="tab"]')]
      .map((node) => node.textContent.trim());
    const disclosureLabels = [...serviceDocument.querySelectorAll('.services-disclosures-view [data-disclosure-button]')]
      .map((node) => node.textContent.trim());
    expect(tabLabels).toEqual(SERVICES.map((service) => service.title));
    expect(disclosureLabels).toEqual(SERVICES.map((service) => service.title));
  });

  it('shows the controlled price status for every service in both responsive interfaces', () => {
    const page = PAGES.find((item) => item.file === 'services.html');
    const document = new JSDOM(renderPage(page)).window.document;

    for (const view of ['.services-tabs-view', '.services-disclosures-view']) {
      const statuses = [...document.querySelectorAll(`${view} .service-price-status`)]
        .map((node) => node.textContent);
      expect(statuses).toEqual(SERVICES.map((service) => service.priceStatus));
    }
  });

  it('contains no fabricated clinical claims, people, prices, reviews, or vacancies', () => {
    const allCopy = PAGES
      .filter((page) => !LEGAL_PAGES.includes(page))
      .map((page) => `${page.title} ${page.description} ${page.heading} ${page.lead} ${page.body}`)
      .join(' ');
    const reviews = new JSDOM(renderPage(PAGES.find((page) => page.file === 'reviews.html'))).window.document;
    const vacancies = new JSDOM(renderPage(PAGES.find((page) => page.file === 'vacancies.html'))).window.document;

    expect(allCopy).not.toMatch(/имплант|хирург|ортодонт|детск|оборудован|гарант|лет опыта|пациент[а-я]* отзыв/i);
    expect(allCopy).not.toMatch(/Иванова Мария|Мария Иванова|4\s?500\s?₽|\d[\d\s]*\s(?:₽|руб(?:\.|л|лей))/i);
    expect(allCopy).not.toMatch(/undefined|\[object Object\]/);
    expect(reviews.querySelector('blockquote, cite, [itemprop="review"]')).toBeNull();
    expect(vacancies.querySelector('.vacancy-list, [itemtype*="JobPosting"]')).toBeNull();
  });
});

describe('public page accessibility and safety', () => {
  it('wires distinct service tabs and mobile disclosures to labelled panels', () => {
    const page = PAGES.find((item) => item.file === 'services.html');
    const document = new JSDOM(renderPage(page)).window.document;
    const controls = [...document.querySelectorAll('[aria-controls]')]
      .filter((node) => node.matches('[role="tab"], [data-disclosure-button]'));
    const ids = [...document.querySelectorAll('[id]')].map((node) => node.id);

    expect(new Set(ids)).toHaveLength(ids.length);
    expect(controls).toHaveLength(SERVICES.length * 2);
    for (const control of controls) {
      const panel = document.getElementById(control.getAttribute('aria-controls'));
      expect(control.id).not.toBe('');
      expect(panel).not.toBeNull();
      expect(panel?.getAttribute('aria-labelledby')).toBe(control.id);
    }
  });

  it('keeps every service and price panel visible in raw generated HTML', () => {
    for (const file of ['services.html', 'prices.html']) {
      const page = PAGES.find((item) => item.file === file);
      const document = new JSDOM(renderPage(page)).window.document;
      const panels = [...document.querySelectorAll('[role="tabpanel"], .disclosure-panel')];

      expect(panels.length).toBeGreaterThan(0);
      expect(panels.every((panel) => panel.hidden === false)).toBe(true);
    }
  });

  it('derives contacts, hours, phones, and email from verified data', () => {
    const page = PAGES.find((item) => item.file === 'contacts.html');
    const html = renderPage(page);

    expect(html).toContain(CLINIC.activityAddress);
    expect(html).toContain(CONTACTS.email);
    expect(html).toContain(CONTACTS.emailHref);
    for (const phone of CONTACTS.phones) {
      expect(html).toContain(phone.label);
      expect(html).toContain(phone.href);
    }
    for (const entry of [HOURS.weekdays, HOURS.saturday, HOURS.sunday]) {
      expect(html).toContain(entry.label);
      expect(html).toContain(entry.value);
    }
    expect(html).toContain(HOURS.breakNote);
  });

  it('renders no forms, tracking, remote fonts, map embeds, or unapproved contact schemes', () => {
    for (const { document } of renderedPages()) {
      expect(document.querySelector('form, iframe, embed, object')).toBeNull();
      expect(document.querySelector('[src*="analytics"], [src*="tracker"], [href*="fonts.googleapis"]')).toBeNull();

      const contactLinks = [...document.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]')];
      const approvedHrefs = [...CONTACTS.phones.map((phone) => phone.href), CONTACTS.emailHref];
      expect(contactLinks.every((link) => approvedHrefs.includes(link.getAttribute('href')))).toBe(true);
    }
  });

  it('keeps the global appointment action phone-only and shows confirmed hours', () => {
    for (const { document } of renderedPages()) {
      expect(document.querySelector('[data-appointment-open]')).not.toBeNull();
      const dialog = document.querySelector('#appointment-dialog');
      expect(dialog?.getAttribute('role')).toBe('dialog');
      expect(dialog?.querySelector('form, input, textarea, select')).toBeNull();
      expect([...dialog.querySelectorAll('a[href^="tel:"]')].map((link) => link.getAttribute('href'))).toEqual(
        CONTACTS.phones.map((phone) => phone.href),
      );
      expect(dialog.textContent).toContain(HOURS.weekdays.value);
      expect(dialog.textContent).toContain(HOURS.saturday.value);
      expect(dialog.textContent).toContain(HOURS.sunday.value);
      expect(dialog.textContent).toContain(HOURS.breakNote);
    }
  });

  it('provides breakpoint-exclusive service interfaces and a distinct prices hero', () => {
    const css = `${readFileSync('src/styles/tokens.css', 'utf8')}\n${readFileSync('src/styles/pages.css', 'utf8')}`;

    expect(css).toMatch(/--layout-services-tabs-display:\s*none/);
    expect(css).toMatch(/--layout-services-disclosures-display:\s*grid/);
    expect(css).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*--layout-services-tabs-display:\s*grid/);
    expect(css).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*--layout-services-disclosures-display:\s*none/);
    expect(css).toContain('hero-prices.avif');
    expect(css).toContain('hero-prices.webp');
  });
});
