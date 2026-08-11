import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pages = readFileSync('src/styles/pages.css', 'utf8');

describe('contacts page visual contract', () => {
  it('uses a distinct asymmetric contact composition', () => {
    expect(pages).toMatch(/\.contact-page__grid\s*{[^}]*display:\s*grid/s);
    expect(pages).toMatch(/\.contact-location\s*{[^}]*background:\s*var\(--color-surface-brand-soft\)/s);
    expect(pages).toMatch(/\.contact-channels\s*{[^}]*background:\s*var\(--color-surface-raised\)/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*?\.contact-page__grid\s*{[^}]*grid-template-columns:\s*minmax\(var\(--space-0\),\s*7fr\)\s+minmax\(var\(--space-0\),\s*5fr\)/s);
  });

  it('turns every contact method into a complete action row', () => {
    expect(pages).toMatch(/\.contact-channel\s*{[^}]*min-block-size:\s*var\(--control-block-size\)[^}]*display:\s*grid/s);
    expect(pages).toMatch(/\.contact-channel:hover\s*{/s);
    expect(pages).toMatch(/\.contact-channel:active\s*{/s);
    expect(pages).toMatch(/\.contact-channel__copy\s*{[^}]*overflow-wrap:\s*anywhere/s);
    expect(pages).not.toMatch(/\.contact-channel:hover\s*{[^}]*padding/s);
  });

  it('keeps the schedule compact on mobile and wide on desktop', () => {
    expect(pages).toMatch(/\.contact-hours\s*{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(var\(--space-0\),\s*1fr\)\)/s);
    expect(pages).toMatch(/\.contact-schedule\s*{[^}]*display:\s*grid/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*?\.contact-schedule\s*{[^}]*grid-template-columns:\s*minmax\(var\(--space-0\),\s*1fr\)\s+minmax\(var\(--contact-action-column-min\),\s*auto\)/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*?\.contact-schedule__heading\s*{[^}]*grid-column:\s*1\s*\/\s*-1/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.contact-schedule\s*{[^}]*grid-template-columns:\s*minmax\(var\(--space-0\),\s*auto\)\s+minmax\(var\(--space-0\),\s*1fr\)\s+minmax\(var\(--space-0\),\s*auto\)/s);
    expect(pages).toMatch(/\.contact-schedule__action p\s*{[^}]*max-inline-size:\s*var\(--contact-action-copy-measure\)/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.contact-hours\s*{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(var\(--space-0\),\s*1fr\)\)\s+minmax\(var\(--space-0\),\s*1\.35fr\)/s);
  });
});
