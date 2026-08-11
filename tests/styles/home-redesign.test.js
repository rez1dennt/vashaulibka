import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync('src/styles/tokens.css', 'utf8');
const layout = readFileSync('src/styles/layout.css', 'utf8');
const pages = readFileSync('src/styles/pages.css', 'utf8');
const components = readFileSync('src/styles/components.css', 'utf8');

describe('premium light visual contract', () => {
  it('uses the compact approved typography and wider content measure', () => {
    expect(tokens).toMatch(/--text-h1-size:\s*clamp\(2\.35rem,\s*4\.2vw,\s*3\.4rem\)/);
    expect(tokens).toMatch(/--text-h2-size:\s*clamp\(1\.75rem,\s*2\.6vw,\s*2\.35rem\)/);
    expect(tokens).toMatch(/--text-h3-size:\s*clamp\(1\.125rem,\s*1\.7vw,\s*1\.35rem\)/);
    expect(tokens).toMatch(/--primitive-container-max:\s*77\.5rem/);
    expect(tokens).toMatch(/--text-body-weight:\s*var\(--primitive-font-weight-regular\)/);
    expect(tokens).toMatch(/--hero-image:\s*none/);
  });

  it('implements three desktop header bands without the old cramped row', () => {
    expect(layout).toMatch(/\.utility-bar\s*{/);
    expect(layout).toMatch(/\.brand-row\s*{/);
    expect(layout).toMatch(/\.nav-row\s*{/);
    expect(layout).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.nav-row/);
    expect(layout).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?a\.nav-appointment,\s*\.menu-backdrop\s*{[^}]*display:\s*none/s);
  });

  it('aligns utility metadata inline and separates quick links from the hero', () => {
    expect(tokens).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?--layout-topbar-info-display:\s*inline-flex/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.quick-links\s*{[^}]*margin-block-start:\s*var\(--space-0\)[^}]*padding-block-start:\s*var\(--space-6\)/s);
  });

  it('morphs one stationary menu toggle into a cross', () => {
    expect(layout).toMatch(/\.menu-toggle__icon\s*{[^}]*background:\s*currentColor[^}]*transition:\s*var\(--transition-interactive\)/s);
    expect(layout).toMatch(/\.menu-toggle__icon::before,\s*\.menu-toggle__icon::after\s*{/s);
    expect(layout).toMatch(/\.menu-toggle\[aria-expanded="true"\]\s+\.menu-toggle__icon\s*{[^}]*background:\s*transparent/s);
    expect(layout).toMatch(/\.menu-toggle\[aria-expanded="true"\]\s+\.menu-toggle__icon::before\s*{[^}]*rotate\(var\(--menu-toggle-angle\)\)/s);
    expect(layout).toMatch(/\.menu-toggle\[aria-expanded="true"\]\s+\.menu-toggle__icon::after\s*{[^}]*rotate\(calc\(var\(--menu-toggle-angle\)\s*\*\s*-1\)\)/s);
    expect(layout).not.toMatch(/\.menu-open\s+\.menu-toggle\s*{[^}]*visibility:\s*hidden/s);
    expect(layout).not.toContain('.menu-close {');
  });

  it('uses one icon-and-text grid for homepage contacts', () => {
    expect(pages).toMatch(/\.home-contact__row\s*{[^}]*display:\s*grid[^}]*grid-template-columns:\s*var\(--icon-size\)\s+minmax\(var\(--space-0\),\s*1fr\)/s);
    expect(pages).toMatch(/\.home-contact__hours\s*{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(var\(--space-0\),\s*1fr\)\)[^}]*gap:\s*var\(--border-width\)/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.home-contact__hours\s*{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(var\(--space-0\),\s*1fr\)\)/s);
  });

  it('styles all rich homepage sections and local icons', () => {
    for (const selector of [
      'home-hero',
      'quick-links',
      'home-about',
      'home-services',
      'home-staff-prices',
      'home-patients',
      'home-documents',
      'home-contact',
    ]) {
      expect(pages).toContain(`.${selector}`);
    }

    expect(components).toMatch(/\.ui-icon\s*{[^}]*stroke:\s*currentColor/s);
    expect(pages).toMatch(/\.quick-links__grid\s*{[^}]*grid-template-columns:/s);
  });

  it('uses a compact micro-label rather than the removed large pill', () => {
    expect(layout).toMatch(/\.hero-visualization-label\s*{[^}]*font-size:\s*var\(--text-caption-size\)/s);
    expect(layout).not.toContain('.hero-illustration-note');
    expect(components).not.toContain('.hero-illustration-note');
  });

  it('keeps responsive grids mobile-first and preserves reduced motion', () => {
    expect(pages).toMatch(/\.quick-links__grid\s*{[^}]*grid-template-columns:\s*minmax\(var\(--space-0\),\s*1fr\)/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*?\.quick-links__grid/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?repeat\(5,/s);
    expect(components).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/s);
  });
});
