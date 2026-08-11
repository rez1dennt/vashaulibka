import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pages = readFileSync('src/styles/pages.css', 'utf8');

describe('patient information page visual contract', () => {
  it('uses one spacious editorial surface for patient content', () => {
    expect(pages).toMatch(/\.main--patient\s*{[^}]*background:\s*var\(--color-surface-subtle\)/s);
    expect(pages).toMatch(/\.patient-content\s*{[^}]*padding:\s*var\(--patient-content-padding\)[^}]*border:\s*var\(--border-width\)[^}]*border-radius:\s*var\(--radius-lg\)/s);
    expect(pages).toMatch(/\.patient-content\s+:where\(p,\s*li\)\s*{[^}]*max-inline-size:\s*var\(--text-body-measure\)/s);
    expect(pages).toMatch(/\.patient-content\s*>\s*:last-child\s*{[^}]*margin-block-end:\s*var\(--space-0\)/s);
  });

  it('lays hub cards out in one, two, then three columns', () => {
    expect(pages).toMatch(/\.patient-hub__grid\s*{[^}]*grid-template-columns:\s*minmax\(var\(--space-0\),\s*1fr\)/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*?\.patient-hub__grid\s*{[^}]*grid-template-columns:\s*repeat\(2,/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.patient-hub__grid\s*{[^}]*grid-template-columns:\s*repeat\(3,/s);
  });

  it('gives icon link cards complete visual and interaction states', () => {
    expect(pages).toMatch(/\.patient-link-card\s*{[^}]*display:\s*grid[^}]*grid-template-columns:\s*var\(--control-block-size\)\s+minmax\(var\(--space-0\),\s*1fr\)\s+var\(--icon-size\)/s);
    expect(pages).toMatch(/\.patient-link-card:hover\s*{/s);
    expect(pages).toMatch(/\.patient-link-card:active\s*{/s);
    expect(pages).toMatch(/\.patient-link-card__icon,\s*\.patient-link-card > \.ui-icon:first-child\s*{[^}]*place-items:\s*center/s);
    expect(pages).toMatch(/\.patient-hub \.patient-link-card__copy\s*{[^}]*grid-column:\s*1 \/ -1/s);
    expect(pages).toMatch(/\.patient-hub \.patient-link-card__arrow\s*{[^}]*grid-column:\s*3[^}]*grid-row:\s*1/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*?\.patient-hub \.patient-link-card__copy\s*{[^}]*grid-column:\s*auto/s);
  });

  it('uses compact icon notices and a responsive related-navigation band', () => {
    expect(pages).toMatch(/\.patient-notice\s*{[^}]*display:\s*grid[^}]*grid-template-columns:\s*minmax\(var\(--space-0\),\s*1fr\)/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*?\.patient-notice\s*{[^}]*grid-template-columns:\s*var\(--control-block-size\)\s+minmax\(var\(--space-0\),\s*1fr\)/s);
    expect(pages).toMatch(/\.patient-notice__icon\s*{[^}]*place-items:\s*center/s);
    expect(pages).toMatch(/\.patient-related\s*{[^}]*display:\s*grid/s);
    expect(pages).toMatch(/\.patient-related nav\s*{[^}]*display:\s*flex[^}]*flex-wrap:\s*wrap/s);
  });

  it('preserves the existing table internals while adding surrounding rhythm', () => {
    expect(pages).toMatch(/\.patient-content\s+\.table-scroll\s*{[^}]*margin-block-start:\s*var\(--space-2\)/s);
    expect(pages).toMatch(/\.table-scroll table\s*{[^}]*min-inline-size:\s*44rem/s);
  });
});
