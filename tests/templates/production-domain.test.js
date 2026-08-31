import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { PAGES } from '../../src/content/page-manifest.js';
import { renderPage } from '../../src/templates/render-page.js';

describe('confirmed production domain', () => {
  it('uses stomdemidov.ru in canonical and social URLs on every page', () => {
    for (const page of PAGES) {
      const doc = new JSDOM(renderPage(page)).window.document;
      const path = page.file === 'index.html' ? '' : page.file;
      const expected = `https://stomdemidov.ru/${path}`;
      expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(expected);
      expect(doc.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(expected);
      expect(JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent).url).toBe('https://stomdemidov.ru/');
    }
  });

  it('identifies the actual website in its privacy policy', () => {
    const privacy = PAGES.find(page => page.file === 'privacy.html');
    expect(privacy.body).toContain('https://stomdemidov.ru');
  });
});
