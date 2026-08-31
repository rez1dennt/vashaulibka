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
    expect(tokens).toMatch(/--menu-toggle-line-offset:\s*var\(--primitive-menu-toggle-line-offset\)/);
    expect(tokens).toMatch(/--primitive-menu-toggle-line-offset:\s*0\.375rem/);
    expect(layout).toMatch(/\.menu-toggle__icon\s*{[^}]*background:\s*currentColor[^}]*transition:\s*var\(--transition-interactive\)/s);
    expect(layout).toMatch(/\.menu-toggle__icon::before,\s*\.menu-toggle__icon::after\s*{/s);
    expect(layout).toMatch(/\.menu-toggle\[aria-expanded="true"\]\s+\.menu-toggle__icon\s*{[^}]*background:\s*transparent/s);
    expect(layout).toMatch(/\.menu-toggle\[aria-expanded="true"\]\s+\.menu-toggle__icon::before\s*{[^}]*rotate\(var\(--menu-toggle-angle\)\)/s);
    expect(layout).toMatch(/\.menu-toggle\[aria-expanded="true"\]\s+\.menu-toggle__icon::after\s*{[^}]*rotate\(calc\(var\(--menu-toggle-angle\)\s*\*\s*-1\)\)/s);
    expect(layout).not.toMatch(/\.menu-open\s+\.menu-toggle\s*{[^}]*visibility:\s*hidden/s);
    expect(layout).not.toContain('.menu-close {');
    expect(layout).toMatch(/\.menu-toggle__icon::before\s*{[^}]*translateY\(calc\(var\(--menu-toggle-line-offset\) \* -1\)\)/s);
    expect(layout).toMatch(/\.menu-toggle__icon::after\s*{[^}]*translateY\(var\(--menu-toggle-line-offset\)\)/s);
  });

  it('uses a restrained text-only legal identity on every viewport', () => {
    expect(layout).toMatch(/\.brand__legal-name\s*{[^}]*font-family:\s*var\(--font-body\)[^}]*font-weight:\s*var\(--text-heading-weight\)[^}]*overflow-wrap:\s*anywhere/s);
    expect(layout).not.toMatch(/\.brand\s+img|\.brand__wordmark|\.brand__prefix|\.brand__accent|\.brand__smile/s);
    expect(layout).not.toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.brand__legal-name\s*{[^}]*display:\s*none/s);
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

  it('does not retain generated-interior labels after replacement', () => {
    expect(layout).not.toContain('.hero-visualization-label');
    expect(layout).not.toContain('.hero-illustration-note');
    expect(components).not.toContain('.hero-illustration-note');
  });

  it('keeps responsive grids mobile-first and preserves reduced motion', () => {
    expect(pages).toMatch(/\.quick-links__grid\s*{[^}]*grid-template-columns:\s*minmax\(var\(--space-0\),\s*1fr\)/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*?\.quick-links__grid/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?repeat\(5,/s);
    expect(components).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/s);
  });

  it('places editorial decoration behind homepage content with local assets', () => {
    expect(tokens).toMatch(/--home-decor-opacity:\s*var\(--primitive-opacity-decor\)/);
    expect(tokens).toMatch(/--home-decor-size-large:\s*var\(--primitive-size-decor-large\)/);
    expect(tokens).toMatch(/--home-decor-content-layer:\s*var\(--primitive-z-decor-content\)/);
    expect(pages).toMatch(/\.home-decor\s*{[^}]*position:\s*absolute[^}]*pointer-events:\s*none/s);
    expect(pages).toMatch(/\.home-decor--hero-smile\s*{[^}]*home-hero-smile\.svg/s);
    expect(pages).toMatch(/\.home-decor--hero-tooth\s*{[^}]*home-hero-tooth\.svg/s);
    expect(pages).toMatch(/\.home-decor--quick-tooth\s*{[^}]*home-quick-tooth\.svg/s);
    expect(pages).toMatch(/\.home-decor--services-dental\s*{[^}]*home-services-dental\.svg/s);
    expect(pages).toMatch(/\.home-decor--staff-jaw\s*{[^}]*home-staff-jaw\.svg/s);
    expect(pages).toMatch(/\.home-decor--patients-docs\s*{[^}]*home-patients-docs\.svg/s);
  });

  it('simplifies decoration on mobile and expands it without covering content', () => {
    expect(pages).toMatch(/\.home-decor--hero-tooth\s*{[^}]*display:\s*none/s);
    expect(pages).toMatch(/\.home-hero__inner,\s*\.quick-links__grid,[\s\S]*?position:\s*relative[^}]*z-index:\s*var\(--home-decor-content-layer\)/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*?\.home-decor--hero-tooth\s*{[^}]*display:\s*block/s);
    expect(pages).toMatch(/@media\s*\(min-width:\s*75rem\)[\s\S]*?\.home-decor--services-dental/s);
    expect(components).toMatch(/\[data-accessibility-enabled="true"\]\s+\.home-decor\s*{[^}]*opacity:\s*var\(--home-decor-opacity-accessibility\)/s);
  });

  it('moves only two decorations and preserves the reduced-motion contract', () => {
    expect(pages).toMatch(/\.home-decor--hero-tooth\s*{[^}]*animation:\s*home-decor-float/s);
    expect(pages).toMatch(/\.home-decor--quick-tooth\s*{[^}]*animation:\s*home-decor-drift/s);
    expect(pages.match(/animation:\s*home-decor-/g)).toHaveLength(2);
    expect(pages).toMatch(/@keyframes\s+home-decor-float/);
    expect(pages).toMatch(/@keyframes\s+home-decor-drift/);
    expect(components).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/s);
  });
});
