import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pages = readFileSync('src/styles/pages.css', 'utf8');

describe('about page visual contract', () => {
  it('defines every approved about-page block', () => {
    for (const selector of ['about-mission', 'about-values', 'about-facts', 'about-space', 'about-gallery', 'about-services', 'about-team', 'about-license', 'about-legal', 'about-cta']) {
      expect(pages).toContain(`.${selector}`);
    }
  });

  it('uses a two-by-two fact grid and four desktop columns', () => {
    expect(pages).toMatch(/\.about-facts__grid\s*{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(var\(--space-0\),\s*1fr\)\)/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.about-facts__grid\s*{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(var\(--space-0\),\s*1fr\)\)/s);
  });

  it('creates asymmetric desktop layouts and the featured service', () => {
    expect(pages).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.about-mission__grid\s*{[^}]*grid-template-columns:\s*minmax\(var\(--space-0\),\s*4fr\)\s+minmax\(var\(--space-0\),\s*8fr\)/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.about-services__grid\s*{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(var\(--space-0\),\s*1fr\)\)/s);
    expect(pages).toMatch(/\.about-service--featured\s*{[^}]*grid-column:\s*span\s+2/s);
  });

  it('builds a two-column gallery with a wide primary image', () => {
    expect(pages).toMatch(/\.about-gallery\s*{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(var\(--space-0\),\s*1fr\)\)/s);
    expect(pages).toMatch(/\.about-gallery__item--primary\s*{[^}]*grid-column:\s*1\s*\/\s*-1/s);
  });

  it('lets long Russian headings reflow in vision mode without widening the page', () => {
    expect(pages).toMatch(/\.about-section__heading\s*>\s*div\s*{[^}]*min-inline-size:\s*var\(--space-0\)/s);
    expect(pages).toMatch(/\.about-section__heading\s+h2\s*{[^}]*overflow-wrap:\s*anywhere/s);
  });
});
