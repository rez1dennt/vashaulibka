import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync('src/styles/tokens.css', 'utf8');
const pages = readFileSync('src/styles/pages.css', 'utf8');

describe('specialists coverflow styles', () => {
  it('defines tokenized depth and all projected positions', () => {
    expect(tokens).toMatch(/--coverflow-card-inline-size:/);
    expect(tokens).toMatch(/--coverflow-side-scale:/);
    for (const position of ['active', 'previous', 'next', 'far-previous', 'far-next']) {
      expect(pages).toContain(`[data-position="${position}"]`);
    }
    expect(pages).toMatch(/\.specialists-coverflow\.is-enhanced\s+\.specialists-coverflow__slide\[data-position="active"\][^{]*{[^}]*z-index:/s);
    expect(pages).toMatch(/\.specialists-coverflow\.is-enhanced\s+\.specialists-coverflow__slide\[data-position="previous"\][^{]*{[^}]*scale\(var\(--coverflow-side-scale\)\)/s);
    expect(pages).not.toMatch(/^\.specialists-coverflow__slide\[data-position=/m);
  });

  it('keeps a readable no-JS list and hides only enhancement controls', () => {
    expect(pages).toMatch(/\.no-js\s+\.specialists-coverflow__track\s*{[^}]*display:\s*grid/s);
    expect(pages).toMatch(/\.no-js\s+\.specialists-coverflow__slide\s*{[^}]*position:\s*static/s);
    expect(pages).toMatch(/\.no-js\s+\.specialist-card__select,[\s\S]*?display:\s*none/s);
  });

  it('centers the heading and places a compact toolbar below at the end edge', () => {
    expect(pages).toMatch(/\.specialists-section__heading\s*{[^}]*inline-size:\s*100%[^}]*display:\s*grid[^}]*justify-items:\s*center[^}]*text-align:\s*center/s);
    expect(pages).toMatch(/\.specialists-coverflow__toolbar\s*{[^}]*display:\s*flex[^}]*justify-content:\s*flex-end[^}]*margin-block-start:\s*var\(--space-4\)/s);
    expect(pages).not.toMatch(/\.specialists-coverflow__toolbar\s*{[^}]*position:\s*absolute/s);
    expect(pages).toMatch(/\.specialists-coverflow__controls\s*{[^}]*display:\s*none[^}]*gap:\s*var\(--space-3\)/s);
    expect(tokens).toMatch(/--primitive-size-coverflow-card-desktop:\s*min\(34vw,\s*26rem\)/);
    expect(tokens).toMatch(/--primitive-offset-coverflow-side-desktop:\s*92%/);
  });

  it('contains transformed slides during resize transitions', () => {
    expect(pages).toMatch(/\.specialists-coverflow__viewport\s*{[^}]*overflow:\s*hidden/s);
  });

  it('provides mobile edge hints, wider three-card depth, and instant reduced motion', () => {
    expect(tokens).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*--coverflow-card-inline-size:/);
    expect(tokens).toMatch(/@media\s*\(min-width:\s*64rem\)[\s\S]*--coverflow-side-offset:/);
    expect(pages).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.specialists-coverflow__slide[^{]*{[^}]*transition-duration:\s*var\(--motion-duration-instant\)/s);
    const coverflowStyles = pages.match(/\.specialists-section\s*{[\s\S]*?(?=\.definition-list\s*{)/)?.[0] ?? '';
    expect(coverflowStyles).not.toMatch(/animation:\s*[^;]*(infinite|linear)/);
  });
});
