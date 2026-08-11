import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readStyle = (name) => readFileSync(`src/styles/${name}.css`, 'utf8');

const tokenValues = (css) => new Map(
  [...css.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]),
);

const resolveColor = (tokens, name) => {
  let value = tokens.get(name);
  const visited = new Set();

  while (value?.startsWith('var(')) {
    if (visited.has(value)) throw new Error(`Circular token reference for ${name}`);
    visited.add(value);
    value = tokens.get(value.slice(4, -1));
  }

  return value;
};

const luminance = (hex) => {
  const channels = hex.slice(1).match(/../g).map((channel) => Number.parseInt(channel, 16) / 255);
  const [red, green, blue] = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
};

const contrastRatio = (foreground, background) => {
  const values = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
};

describe('design system contract', () => {
  it('loads the style layers in dependency order', () => {
    const css = readStyle('main');

    expect([...css.matchAll(/@import\s+['"]\.\/(.+?)\.css['"]/g)].map((match) => match[1])).toEqual([
      'tokens',
      'base',
      'layout',
      'components',
      'pages',
    ]);
  });

  it('declares the approved palette and three token tiers', () => {
    const css = readStyle('tokens');

    for (const value of ['#2879d8', '#1665be', '#132238', '#536173', '#eef6ff', '#f8f3ed', '#dfe7f0']) {
      expect(css.toLowerCase()).toContain(value);
    }
    expect(css).toMatch(/--primitive-color-brand:/);
    expect(css).toMatch(/--color-primary:\s*var\(--primitive-color-brand\)/);
    expect(css).toMatch(/--card-background:\s*var\(--color-surface-raised\)/);
    expect(css).toMatch(/--z-menu:/);
    expect(css).toMatch(/--z-cookie:/);
    expect(css).toMatch(/--z-dialog:/);
  });

  it('maps primary controls to the approved contrast-safe brand state', () => {
    const css = readStyle('tokens');

    expect(css).toMatch(/--button-primary-background:\s*var\(--color-primary-strong\)/);
    expect(css).toMatch(/--button-primary-background-hover:\s*var\(--color-primary-active\)/);
  });

  it('keeps text, focus, and essential borders above their contrast thresholds', () => {
    const tokens = tokenValues(readStyle('tokens'));
    const color = (name) => resolveColor(tokens, name);

    expect(contrastRatio(color('--button-primary-text'), color('--button-primary-background'))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(color('--color-focus'), color('--color-surface-page'))).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(color('--color-border-strong'), color('--color-surface-page'))).toBeGreaterThanOrEqual(3);
  });

  it('keeps focus and hidden states accessible', () => {
    const css = `${readStyle('base')}\n${readStyle('components')}`;

    expect(css).toMatch(/:focus-visible\s*{[^}]*outline:\s*var\(--focus-ring-width\)\s+solid\s+var\(--color-focus\)/s);
    expect(css).toMatch(/\[hidden\]\s*{[^}]*display:\s*none\s*!important/s);
    expect(css).toMatch(/:hover/);
    expect(css).toMatch(/:active/);
    expect(css).toMatch(/:disabled|\[aria-disabled=['"]true['"]\]/);
    expect(css).toMatch(/\[aria-selected=['"]true['"]\][^{]*{[^}]*(border|box-shadow|text-decoration)/s);
  });

  it('uses current interaction state classes and tokenized overlay layers', () => {
    const css = `${readStyle('layout')}\n${readStyle('components')}`;

    expect(css).toMatch(/\.menu-open\s+\.site-header\s+nav/);
    expect(css).toMatch(/body\.is-locked/);
    expect(css).toMatch(/\.dialog[^{]*{[^}]*z-index:\s*var\(--z-dialog\)/s);
    expect(css).toMatch(/\.cookie-banner[^{]*{[^}]*z-index:\s*var\(--z-cookie\)/s);
    expect(css).toMatch(/\.vision-mode/);
  });

  it('enhances a mobile-first layout at wider viewports', () => {
    const css = `${readStyle('tokens')}\n${readStyle('layout')}\n${readStyle('pages')}`;

    expect(css).toMatch(/width:\s*min\(calc\(100%\s*-\s*\(?var\(--container-gutter\)\s*\*\s*2\)?\),\s*var\(--container-max\)\)/);
    expect(css).toMatch(/@media\s*\(min-width:/);
    expect(css).not.toMatch(/@media\s*\(max-width:/);
    expect(css).toMatch(/--layout-tablist-overflow:\s*auto/);
    expect(css).toMatch(/\.service-tabs\s+\[role=['"]tablist['"]\][^{]*{[^}]*overflow-x:\s*var\(--layout-tablist-overflow\)/s);
  });

  it('reserves hero space and references every planned image format', () => {
    const css = `${readStyle('layout')}\n${readStyle('pages')}`;

    expect(css).toMatch(/\.page-hero[^{]*{[^}]*(min-block-size|aspect-ratio):/s);
    for (const name of ['home', 'about', 'services', 'specialists', 'reviews', 'vacancies', 'contacts']) {
      expect(css).toContain(`hero-${name}.avif`);
      expect(css).toContain(`hero-${name}.webp`);
    }
  });

  it('provides a reduced-motion mode without removing focus treatment', () => {
    const css = `${readStyle('base')}\n${readStyle('layout')}\n${readStyle('components')}`;
    const reducedMotion = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*{([\s\S]+)}\s*$/)?.[1] ?? '';

    expect(reducedMotion).toContain('scroll-behavior: auto');
    expect(reducedMotion).toMatch(/animation-duration:\s*var\(--motion-duration-instant\)/);
    expect(reducedMotion).toMatch(/transition-duration:\s*var\(--motion-duration-instant\)/);
    expect(reducedMotion).not.toContain('outline: none');
  });
});
