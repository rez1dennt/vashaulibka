import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { PAGES } from '../../src/content/page-manifest.js';
import { DOCUMENT_GROUPS } from '../../src/data/documents.js';
import { CONTACTS } from '../../src/data/clinic.js';
import { SERVICES } from '../../src/data/services.js';
import { STAFF } from '../../src/data/staff.js';
import { renderPage } from '../../src/templates/render-page.js';
import { buildSearchIndex } from '../../scripts/generate-search-index.mjs';
import { searchItems } from '../../src/js/core/search-engine.js';

const retired = ['personal-data-consent.html', 'waiting-periods.html'];
const contractHref = 'documents/paid-services-contract-2026-09-01.pdf';
const getPage = (file) => new JSDOM(renderPage(PAGES.find((page) => page.file === file))).window.document;

describe('September contract and patient information update', () => {
  it('removes both retired routes and all navigational references', () => {
    for (const file of retired) {
      expect(PAGES.some((page) => page.file === file)).toBe(false);
      expect(existsSync(file), `${file} must not survive as a stale build input`).toBe(false);
    }
    for (const page of PAGES) {
      const doc = new JSDOM(renderPage(page)).window.document;
      for (const file of retired) expect(doc.querySelector(`a[href="${file}"]`), page.file).toBeNull();
    }
    const items = DOCUMENT_GROUPS.flatMap((group) => group.items);
    expect(items.some((item) => retired.includes(item.href))).toBe(false);
  });

  it('publishes the supplied contract with its date and appendix, with open and download actions', () => {
    const card = getPage('documents.html').querySelector('#document-paid-services-contract');
    expect(card).not.toBeNull();
    expect(card.textContent).toContain('Договор на оказание платных медицинских услуг');
    expect(card.textContent).toContain('С 01.09.2026');
    expect(card.textContent).toContain('12 страниц');
    expect(card.textContent).toContain('приложение № 5');
    expect(card.querySelector(`a[href="${contractHref}"]:not([download])`)?.textContent).toBe('Открыть PDF');
    expect(card.querySelector(`a[href="${contractHref}"][download]`)?.textContent).toBe('Скачать PDF');
    expect(getPage('patients.html').querySelector(`a[href="${contractHref}"]`)).not.toBeNull();
  });

  it('keeps the original contract PDF byte-identical', () => {
    expect(existsSync(`public/${contractHref}`)).toBe(true);
    const hash = createHash('sha256').update(readFileSync(`public/${contractHref}`)).digest('hex').toUpperCase();
    expect(hash).toBe('0378CB3D931401901896045225655B65B903F68AE86D9287CC2A5C7D5707EEEF');
  });

  it('shows both callable clinic phones inside the complaints notice itself', () => {
    const notice = getPage('complaints.html').querySelector('main .patient-notice');
    expect(notice.querySelector('.contact-actions')?.tagName).toBe('P');
    for (const phone of CONTACTS.phones) {
      expect(notice.querySelector(`a[href="${phone.href}"]`)?.textContent).toBe(phone.label);
    }
    expect(notice.querySelector(`a[href="${CONTACTS.emailHref}"]`)).not.toBeNull();
  });

  it('keeps the contract discoverable without retired results or removal of MIS privacy', () => {
    const index = buildSearchIndex({ pages: PAGES, services: SERVICES, staff: STAFF });
    expect(index.items.some((item) => retired.includes(item.href))).toBe(false);
    expect(searchItems(index.items, 'договор')[0]?.item.href).toBe('documents.html');
    const privacy = getPage('privacy.html');
    expect(privacy.body.textContent).toContain('32top');
    expect(PAGES.some((page) => page.file === 'informed-consent.html')).toBe(true);
  });
});
