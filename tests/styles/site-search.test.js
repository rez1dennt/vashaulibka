import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const searchCss = readFileSync('src/styles/site-search.css', 'utf8');
const layoutCss = readFileSync('src/styles/layout.css', 'utf8');
const tokensCss = readFileSync('src/styles/tokens.css', 'utf8');
const mainCss = readFileSync('src/styles/main.css', 'utf8');

describe('responsive site search styles', () => {
  it('uses a fullscreen mobile surface and a central tablet/desktop panel', () => {
    expect(searchCss).toMatch(/\.site-search__panel[\s\S]*block-size:\s*var\(--search-viewport-block-size\)/);
    expect(searchCss).toMatch(/@media \(min-width: 48rem\)/);
    expect(searchCss).toMatch(/max-inline-size:\s*var\(--search-panel-max-inline-size\)/);
  });

  it('centers a labelled trigger on desktop and keeps the compact icon before the burger', () => {
    expect(layoutCss).toMatch(/grid-template-columns:\s*minmax\([^;]+auto auto/);
    expect(layoutCss).toMatch(/@media \(min-width: 75rem\)[\s\S]*grid-template-columns:\s*auto minmax/);
    expect(searchCss).toMatch(/@media \(min-width: 75rem\)[\s\S]*site-search-trigger__label/);
    expect(searchCss).toMatch(/@media \(max-width: 74\.999rem\)[\s\S]*site-search-trigger kbd/);
  });

  it('honors no-JS, reduced motion and vision mode with semantic tokens', () => {
    expect(searchCss).toMatch(/\.no-js \.site-search-trigger/);
    expect(searchCss).toMatch(/\.js \.site-search-fallback/);
    expect(searchCss).toMatch(/prefers-reduced-motion: reduce/);
    expect(searchCss).toMatch(/\.vision-mode \.site-search__panel/);
    expect(searchCss).not.toMatch(/var\(--primitive-/);
    expect(tokensCss).toContain('--z-search:');
    expect(mainCss).toContain("@import './site-search.css';");
  });
});
