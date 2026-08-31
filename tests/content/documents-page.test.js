import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { DOCUMENTS_PAGE } from '../../src/content/documents-page.js';
import { HOME_PAGE } from '../../src/content/home-page.js';
import { PAGES } from '../../src/content/page-manifest.js';
import { DOCUMENT_GROUPS } from '../../src/data/documents.js';
import { REGULATORY_DOCUMENTS } from '../../src/data/regulatory-documents.js';
import { renderFooter } from '../../src/templates/site-chrome.js';
import { renderPage } from '../../src/templates/render-page.js';

describe('documents centre', () => {
  it('omits the removed 736 card and keeps the replacement 659 document', () => {
    const document = new JSDOM(renderPage(DOCUMENTS_PAGE)).window.document;
    expect(document.querySelectorAll('#document-paid-services-736')).toHaveLength(0);
    expect(document.querySelectorAll('a[href="documents/regulations/paid-services-736.pdf"]')).toHaveLength(0);
    expect(document.querySelector('#document-paid-services-659 a[href="documents/regulations/paid-services-659.pdf"]')).not.toBeNull();
  });

  it('does not emit whitespace-only lines for optional document actions', () => {
    expect(renderPage(DOCUMENTS_PAGE)).not.toMatch(/^[\t ]+$/m);
  });

  it('renders every approved document once with exact status and action semantics', () => {
    const document = new JSDOM(renderPage(DOCUMENTS_PAGE)).window.document;
    expect(DOCUMENTS_PAGE).toMatchObject({ file: 'documents.html', noindex: false, layout: 'patient' });
    const expectedItems = DOCUMENT_GROUPS.flatMap((group) => group.items);
    expect(document.querySelectorAll('[data-document-item]')).toHaveLength(expectedItems.length);
    for (const group of DOCUMENT_GROUPS) {
      expect(document.querySelector(`#documents-${group.id}`)).not.toBeNull();
    }
    for (const item of expectedItems) {
      const row = document.querySelector(`#document-${item.id}`);
      expect(row?.textContent).toContain(item.title);
      expect(row?.textContent).toContain(item.status);
      expect(row?.querySelector(`a[href="${item.href}"]`)).not.toBeNull();
    }
  });

  it('keeps the price, labour and supplied contract originals downloadable', () => {
    const document = new JSDOM(renderPage(DOCUMENTS_PAGE)).window.document;
    expect(document.querySelector('a[href="documents/price-list-2026-05-05.pdf"][download]')).not.toBeNull();
    expect(document.querySelector('a[href="documents/sout-summary-2024.pdf"][download]')).not.toBeNull();
    expect(document.querySelector('a[href="documents/paid-services-contract-2026-09-01.pdf"][download]')).not.toBeNull();
  });

  it('names local, internal, and external actions by their real destination', () => {
    const document = new JSDOM(renderPage(DOCUMENTS_PAGE)).window.document;
    const localPdf = document.querySelector('#document-price-list-2026');
    const internalPage = document.querySelector('#document-payment');
    const officialResource = document.querySelector('#document-clinical-recommendations');

    expect(localPdf?.querySelector('.button')?.textContent).toContain('Открыть PDF');
    expect(localPdf?.querySelector('a[download]')?.textContent).toContain('Скачать PDF');
    expect(internalPage?.querySelectorAll('a')).toHaveLength(1);
    expect(internalPage?.querySelector('.button')?.textContent).toBe('Открыть');
    expect(officialResource?.querySelectorAll('a')).toHaveLength(1);
    expect(officialResource?.querySelector('.button')?.textContent).toBe('Перейти к официальному ресурсу');
  });

  it('opens, downloads, and preserves the official source for every listed local regulation', () => {
    const document = new JSDOM(renderPage(DOCUMENTS_PAGE)).window.document;
    for (const regulation of REGULATORY_DOCUMENTS.filter(({ id }) => id !== 'paid-services-736')) {
      const row = document.querySelector(`#document-${regulation.id}`);
      expect(row?.querySelector(`a[href="${regulation.href}"]:not([download])`)?.textContent).toContain('Открыть PDF');
      expect(row?.querySelector(`a[href="${regulation.href}"][download]`)?.textContent).toContain('Скачать PDF');
      const official = row?.querySelector(`a[href="${regulation.officialHref}"]`);
      expect(official?.textContent).toContain('Официальный источник');
      expect(official?.getAttribute('target')).toBe('_blank');
      expect(official?.getAttribute('rel')).toBe('noopener');
    }
  });

  it('exposes the centre from the manifest, homepage and footer without crowding primary navigation', () => {
    expect(PAGES.filter((page) => page === DOCUMENTS_PAGE)).toHaveLength(1);
    expect(HOME_PAGE.body).toContain('href="documents.html"');
    const footer = new JSDOM(`<body>${renderFooter()}</body>`).window.document;
    expect(footer.querySelector('a[href="documents.html"]')?.textContent).toContain('Документы');
  });
});
