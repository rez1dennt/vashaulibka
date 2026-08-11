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
    expect(layout).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?a\.nav-appointment,\s*\.menu-backdrop,\s*\.menu-close\s*{[^}]*display:\s*none/s);
  });

  it('aligns utility metadata inline and separates quick links from the hero', () => {
    expect(tokens).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?--layout-topbar-info-display:\s*inline-flex/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.quick-links\s*{[^}]*margin-block-start:\s*var\(--space-0\)[^}]*padding-block-start:\s*var\(--space-6\)/s);
  });

  it('shows only the in-panel close control while the mobile menu is open', () => {
    expect(layout).toMatch(/\.menu-open\s+\.menu-toggle\s*{[^}]*visibility:\s*hidden[^}]*pointer-events:\s*none/s);
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
