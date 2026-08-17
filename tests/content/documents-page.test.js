import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { DOCUMENTS_PAGE } from '../../src/content/documents-page.js';
import { HOME_PAGE } from '../../src/content/home-page.js';
import { PAGES } from '../../src/content/page-manifest.js';
import { DOCUMENT_GROUPS } from '../../src/data/documents.js';
import { renderFooter } from '../../src/templates/site-chrome.js';
import { renderPage } from '../../src/templates/render-page.js';

describe('documents centre', () => {
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

  it('keeps the price and labour originals downloadable and the missing contract absent', () => {
    const document = new JSDOM(renderPage(DOCUMENTS_PAGE)).window.document;
    expect(document.querySelector('a[href="documents/price-list-2026-05-05.pdf"][download]')).not.toBeNull();
    expect(document.querySelector('a[href="documents/sout-summary-2024.pdf"][download]')).not.toBeNull();
    expect(document.body.textContent).not.toMatch(/образец договора/i);
  });

  it('exposes the centre from the manifest, homepage and footer without crowding primary navigation', () => {
    expect(PAGES.filter((page) => page === DOCUMENTS_PAGE)).toHaveLength(1);
    expect(HOME_PAGE.body).toContain('href="documents.html"');
    const footer = new JSDOM(`<body>${renderFooter()}</body>`).window.document;
    expect(footer.querySelector('a[href="documents.html"]')?.textContent).toContain('Документы');
  });
});
