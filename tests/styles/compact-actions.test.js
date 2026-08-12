import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync('src/styles/tokens.css', 'utf8');
const components = readFileSync('src/styles/components.css', 'utf8');
const pages = readFileSync('src/styles/pages.css', 'utf8');

describe('compact responsive action layouts', () => {
  it('keeps the cookie banner compact with responsive equal actions', () => {
    expect(tokens).toMatch(/--primitive-size-cookie:\s*28rem/);
    expect(components).toMatch(/\.cookie-banner\s*{[^}]*display:\s*grid[^}]*padding:\s*var\(--space-5\)/s);
    expect(components).toMatch(/\.cookie-banner button\s*{[^}]*margin:\s*var\(--space-0\)/s);
    expect(components).toMatch(/@media\s*\(min-width:\s*24rem\)[\s\S]*?\.cookie-banner\s*{[^}]*grid-template-columns:\s*repeat\(2,/s);
  });

  it('centers a dominant home action above the secondary action', () => {
    expect(pages).toMatch(/\.home-hero__actions\s*{[^}]*display:\s*grid[^}]*justify-items:\s*center[^}]*margin-inline:\s*auto/s);
    expect(pages).toMatch(/\.home-hero__actions\s*>\s*\.button-primary\s*{[^}]*inline-size:\s*100%/s);
  });

  it('uses one dominant CTA row and responsive two-column phones', () => {
    expect(pages).toMatch(/\.about-cta__actions\s*{[^}]*display:\s*grid/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*24rem\)[\s\S]*?\.about-cta__phones\s*{[^}]*grid-template-columns:\s*repeat\(2,/s);
    expect(components).toMatch(/@media\s*\(min-width:\s*24rem\)[\s\S]*?\.dialog__phones\s*{[^}]*grid-template-columns:\s*repeat\(2,/s);
  });
});
