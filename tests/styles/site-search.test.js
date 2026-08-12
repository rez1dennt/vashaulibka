import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const searchCss = readFileSync('src/styles/site-search.css', 'utf8');
const layoutCss = readFileSync('src/styles/layout.css', 'utf8');
const tokensCss = readFileSync('src/styles/tokens.css', 'utf8');
const mainCss = readFileSync('src/styles/main.css', 'utf8');

describe('responsive site search styles', () => {
  it('anchors a hidden dropdown instead of rendering a fullscreen fixed modal', () => {
    expect(searchCss).not.toMatch(/\.site-search\s*\{[\s\S]*?position:\s*fixed/);
    expect(searchCss).not.toMatch(/site-search__backdrop|site-search__panel|search-viewport-block-size/);
    expect(searchCss).toMatch(/\.site-search__dropdown[\s\S]*visibility:\s*hidden/);
    expect(searchCss).toMatch(/\.site-search\.is-open[\s\S]*site-search__dropdown[\s\S]*visibility:\s*visible/);
    expect(searchCss).toMatch(/site-search__results[\s\S]*overflow-y:\s*auto/);
    expect(searchCss).not.toMatch(/\.site-search__dropdown\s*\{[^}]*min-block-size/s);
    expect(tokensCss).not.toContain('--search-dropdown-min-block-size:');
  });

  it('keeps a compact mobile toggle and a persistent central desktop field', () => {
    expect(layoutCss).toMatch(/grid-template-columns:\s*minmax\([^;]+auto auto/);
    expect(layoutCss).toMatch(/@media \(min-width: 75rem\)[\s\S]*grid-template-columns:\s*auto minmax/);
    expect(layoutCss).toMatch(/\.brand-row__inner[\s\S]*position:\s*relative/);
    expect(searchCss).toMatch(/@media \(max-width: 74\.999rem\)[\s\S]*site-search__surface[\s\S]*position:\s*absolute/);
    expect(searchCss).toMatch(/@media \(min-width: 75rem\)[\s\S]*site-search__toggle[\s\S]*display:\s*none/);
    expect(searchCss).toMatch(/@media \(min-width: 75rem\)[\s\S]*site-search__surface[\s\S]*visibility:\s*visible/);
  });

  it('uses delayed visibility motion without changing page overflow or layout', () => {
    expect(searchCss).toMatch(/\.site-search__dropdown[\s\S]*opacity:\s*0[\s\S]*transform:/);
    expect(searchCss).toMatch(/transition:\s*var\(--transition-navigation-close\)/);
    expect(searchCss).toMatch(/transition:\s*var\(--transition-navigation-open\)/);
    expect(searchCss).toMatch(/@keyframes\s+site-search-content-enter/);
    expect(searchCss).toMatch(/\.site-search__result,[\s\S]*\.site-search__content[\s\S]*animation:\s*site-search-content-enter/);
    expect(searchCss).not.toMatch(/body[^}]*overflow/);
  });

  it('honors no-JS, reduced motion and accessibility mode with semantic tokens', () => {
    expect(searchCss).toMatch(/\.no-js \.site-search__toggle/);
    expect(searchCss).toMatch(/\.js \.site-search-fallback/);
    expect(searchCss).toMatch(/prefers-reduced-motion: reduce/);
    expect(searchCss).toMatch(/\[data-accessibility-enabled="true"\] \.site-search__dropdown/);
    expect(searchCss).not.toMatch(/var\(--primitive-/);
    expect(tokensCss).toContain('--z-search:');
    expect(tokensCss).toContain('--search-closed-scale:');
    expect(mainCss).toContain("@import './site-search.css';");
  });

  it('removes the browser-native search clear control in favor of the labelled SVG button', () => {
    expect(searchCss).toMatch(/input::?-webkit-search-cancel-button[\s\S]*appearance:\s*none/);
  });
});
