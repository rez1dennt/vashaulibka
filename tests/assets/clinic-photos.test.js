import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { PAGES } from '../../src/content/page-manifest.js';
import { renderPage } from '../../src/templates/render-page.js';

const roles = ['home', 'about', 'services', 'specialists', 'prices', 'reviews', 'vacancies', 'contacts'];

describe('real photographs supplied by the clinic', () => {
  it('replaces every former photo asset with a cache-distinct real-photo file', () => {
    for (const role of roles) for (const format of ['webp', 'avif']) {
      expect(existsSync(`public/assets/images/clinic-${role}.${format}`)).toBe(true);
      expect(existsSync(`public/assets/images/hero-${role}.${format}`)).toBe(false);
    }
    expect(readdirSync('public/assets/images').filter(name => /\.(webp|avif)$/.test(name))).toHaveLength(16);
  });

  it('never describes real photos as visualizations and supplies useful photo alt text', () => {
    for (const page of PAGES) {
      const html = renderPage(page);
      const doc = new JSDOM(html).window.document;
      expect(html).not.toContain('Визуализация интерьера');
      expect(html).not.toContain('assets/images/hero-');
      for (const img of doc.querySelectorAll('img[src*="assets/images/"]')) {
        expect(img.getAttribute('src')).toMatch(/assets\/images\/clinic-/);
        expect(img.getAttribute('alt')?.length).toBeGreaterThan(10);
        expect(img.getAttribute('width')).toBe('1280');
        expect(img.getAttribute('height')).toBe('720');
      }
    }
  });

  it('switches every background-photo variant away from the old URLs', () => {
    const css = readFileSync('src/styles/pages.css', 'utf8');
    expect(css).not.toContain('/assets/images/hero-');
    for (const role of roles) expect(css).toContain(`/assets/images/clinic-${role}.webp`);
  });

  it('fits desktop background photos by height instead of cutting off the entrance sign', () => {
    const css = readFileSync('src/styles/layout.css', 'utf8');
    const tokens = readFileSync('src/styles/tokens.css', 'utf8');
    expect(css).toMatch(/\.page-hero::before\s*\{[^}]*block-size:\s*100%/s);
    expect(css).toMatch(/aspect-ratio:\s*var\(--hero-photo-aspect\)/);
    expect(tokens).toContain('--hero-photo-aspect: 16 / 9');
    expect(tokens).toContain('--hero-photo-inline-size: auto');
  });

  it('softens edges relative to the photo itself without blurring the photograph', () => {
    const css = readFileSync('src/styles/layout.css', 'utf8');
    const layer = css.match(/\.page-hero::before\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(layer).toContain('mask-image: var(--hero-photo-mask)');
    expect(layer).toContain('mask-composite: intersect');
    expect(layer).toContain('pointer-events: none');
    expect(layer).not.toContain('blur(');
    expect(css).toMatch(/\.page-hero \.container\s*\{[^}]*z-index:\s*var\(--hero-content-layer\)/s);
  });

  it('lets photo descriptions reflow when accessibility mode hides the images', () => {
    const css = readFileSync('src/styles/accessibility.css', 'utf8');
    expect(css).toMatch(/html\[data-accessibility-enabled="true"\]\[data-accessibility-images="hidden"\][^{]*\.about-gallery__item[^}]*aspect-ratio:\s*auto/s);
    expect(css).toMatch(/html\[data-accessibility-enabled="true"\]\[data-accessibility-images="hidden"\]\s+\.about-gallery\s*\{[^}]*grid-template-columns:\s*minmax\(var\(--space-0\),\s*1fr\)/s);
  });

  it('shows the mobile hero photograph below its text without an opaque scrim', () => {
    const css = readFileSync('src/styles/layout.css', 'utf8');
    const mobile = css.slice(css.indexOf('@media (width < 75rem)'));
    const photo = mobile.match(/\.page-hero::before\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(photo).toContain('position: relative');
    expect(photo).toContain('grid-row: 2');
    expect(photo).toContain('block-size: auto');
    expect(photo).toContain('background-image: var(--hero-image, none)');
    expect(mobile).toMatch(/\.page-hero \.container\s*\{[^}]*grid-row:\s*1/s);
    const accessibility = readFileSync('src/styles/accessibility.css', 'utf8');
    expect(accessibility).toMatch(/html\[data-accessibility-enabled="true"\]\[data-accessibility-images="hidden"\] \.page-hero::before\s*\{\s*display:\s*none/s);
  });
});
