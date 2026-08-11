import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { CLINIC, CONTACTS, HOURS, LICENSE } from '../../src/data/clinic.js';
import { NAV_ITEMS, renderFooter, renderHeader } from '../../src/templates/site-chrome.js';

describe('premium light site chrome', () => {
  it('renders three spacious header bands and preserves mobile interaction hooks', () => {
    const document = new JSDOM(`<body>${renderHeader('services.html')}</body>`).window.document;

    expect(document.querySelector('.utility-bar')).not.toBeNull();
    expect(document.querySelector('.brand-row')).not.toBeNull();
    expect(document.querySelector('.nav-row')).not.toBeNull();
    expect(document.querySelector('[data-vision-toggle]')).not.toBeNull();
    expect(document.querySelector('[data-menu-backdrop]')).not.toBeNull();
    expect(document.querySelector('[data-menu-close]')).not.toBeNull();
    expect(document.querySelector('.menu-toggle[aria-controls="main-menu"]')).not.toBeNull();

    const navLinks = [...document.querySelectorAll('#main-menu > a:not([data-appointment-open])')];
    expect(navLinks.map((link) => link.textContent.trim())).toEqual(NAV_ITEMS.map((item) => item.label));
    expect(navLinks.filter((link) => link.getAttribute('aria-current') === 'page')).toHaveLength(1);
    expect(navLinks.find((link) => link.getAttribute('aria-current') === 'page')?.getAttribute('href')).toBe('services.html');
    expect(document.querySelector('#main-menu [data-appointment-open]')?.getAttribute('href')).toBe(CONTACTS.phones[0].href);
  });

  it('keeps only verified contacts and schedule in the header', () => {
    const document = new JSDOM(`<body>${renderHeader('index.html')}</body>`).window.document;

    expect(document.body.textContent).toContain(CLINIC.activityAddress);
    expect(document.body.textContent).toContain(HOURS.weekdays.value);
    expect(document.body.textContent).toContain(HOURS.saturday.value);
    for (const phone of CONTACTS.phones) {
      expect(document.querySelector(`a[href="${phone.href}"]`)?.textContent).toContain(phone.label);
    }
  });

  it('renders a complete four-column footer from approved routes and facts', () => {
    const document = new JSDOM(`<body>${renderFooter()}</body>`).window.document;
    const columns = [...document.querySelectorAll('.footer-grid > section')];

    expect(columns).toHaveLength(4);
    expect(columns.map((column) => column.querySelector('h2')?.textContent)).toEqual([
      CLINIC.name,
      'Навигация',
      'Пациентам',
      'Контакты',
    ]);
    expect(columns[0].textContent).toContain(LICENSE.number);
    expect(columns[0].textContent).toContain(CLINIC.ogrn);
    expect(document.querySelector('a[href="license.html"]')).not.toBeNull();
    expect(document.querySelector('a[href="privacy.html"]')).not.toBeNull();
    expect(document.querySelector('[data-cookie-settings]')).not.toBeNull();
    expect(document.querySelectorAll('.footer-icon').length).toBeGreaterThanOrEqual(4);
  });
});
