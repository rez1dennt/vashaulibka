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
    const visionToggle = document.querySelector('[data-vision-toggle]');
    expect(visionToggle).not.toBeNull();
    expect(visionToggle?.getAttribute('aria-controls')).toBe('accessibility-panel');
    expect(visionToggle?.getAttribute('aria-expanded')).toBe('false');
    expect(visionToggle?.hasAttribute('aria-pressed')).toBe(false);
    expect(visionToggle?.querySelector('.vision-icon')).not.toBeNull();
    expect(visionToggle?.textContent).toContain('Версия для слабовидящих');
    expect(document.querySelectorAll('[data-vision-toggle]')).toHaveLength(1);
    expect(document.querySelectorAll('#accessibility-panel[data-accessibility-panel]')).toHaveLength(1);
    expect(document.querySelectorAll('#accessibility-settings-dialog[role="dialog"]')).toHaveLength(1);
    expect(document.querySelector('.utility-bar')?.nextElementSibling?.id).toBe('accessibility-panel');
    expect(document.querySelector('#accessibility-panel')?.nextElementSibling?.id).toBe('accessibility-settings-dialog');
    expect(document.querySelector('#accessibility-settings-dialog')?.nextElementSibling?.classList.contains('brand-row')).toBe(true);
    expect(document.querySelector('.brand__wordmark')?.textContent).toContain('Ваша');
    expect(document.querySelector('.brand__wordmark')?.textContent).toContain('улыбка');
    expect(document.querySelector('.brand__prefix')?.textContent).toBe('Ваша');
    expect(document.querySelector('.brand__accent')?.textContent).toBe('улыбка');
    expect(document.querySelector('.brand__smile[aria-hidden="true"]')).not.toBeNull();
    expect(document.querySelector('.brand img[src="assets/icons/logo.svg"]')).not.toBeNull();
    expect(document.querySelector('.brand__full-name')).toBeNull();
    expect(document.querySelector('.brand small')).toBeNull();
    expect(document.querySelector('[data-menu-backdrop]')).not.toBeNull();
    const toggle = document.querySelector('.menu-toggle[aria-controls="main-menu"]');
    expect(toggle).not.toBeNull();
    expect(document.querySelectorAll('.menu-toggle')).toHaveLength(1);
    expect(toggle.querySelector('.menu-toggle__icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(document.querySelector('[data-menu-close]')).toBeNull();
    const brandRow = document.querySelector('.brand-row__inner');
    expect(brandRow.children[0].classList.contains('brand')).toBe(true);
    expect(brandRow.children[1].matches('[data-site-search]')).toBe(true);
    expect(brandRow.children[2].classList.contains('brand-row__actions')).toBe(true);
    expect(brandRow.children[3].classList.contains('menu-toggle')).toBe(true);
    expect(brandRow.querySelectorAll('[data-search-input]')).toHaveLength(1);
    expect(brandRow.querySelector('[role="dialog"], [data-search-backdrop]')).toBeNull();

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
