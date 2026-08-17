import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pagesCss = readFileSync('src/styles/pages.css', 'utf8');
const accessibilityCss = readFileSync('src/styles/accessibility.css', 'utf8');

describe('documents, prices and staff visual contract', () => {
  it('uses contained mobile-first grids and wrapping actions', () => {
    expect(pagesCss).toMatch(/\.documents-centre \.patient-content\s*{[^}]*grid-template-columns:\s*minmax\(var\(--space-0\),\s*1fr\)/s);
    expect(pagesCss).toMatch(/\.documents-directory\s*{[^}]*display:\s*grid/s);
    expect(pagesCss).toMatch(/\.document-item\s*{[^}]*min-inline-size:\s*var\(--space-0\)/s);
    expect(pagesCss).toMatch(/\.document-item__actions\s*{[^}]*flex-wrap:\s*wrap/s);
    expect(pagesCss).toMatch(/\.price-source\s*{[^}]*grid-template-columns:\s*minmax\(var\(--space-0\),\s*1fr\)/s);
    expect(pagesCss).toMatch(/\.specialist-profile\s*{[^}]*overflow-wrap:\s*anywhere/s);
  });

  it('adds two-column breathing room only from the existing tablet breakpoint', () => {
    expect(pagesCss).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*?\.documents-directory\s*{[^}]*repeat\(2,/s);
    expect(pagesCss).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*?\.price-source\s*{[^}]*repeat\(2,/s);
  });

  it('contains all new surfaces in the 200 percent accessibility mode', () => {
    for (const selector of ['.documents-categories', '.documents-directory', '.documents-group', '.document-item', '.price-source', '.price-source__card', '.price-source__notice', '.specialist-profile']) {
      expect(accessibilityCss, selector).toContain(selector);
    }
    expect(accessibilityCss).toMatch(/\.documents-categories a[^}]*overflow-wrap:\s*anywhere/s);
  });

  it('keeps category anchors clear of the persistent desktop header', () => {
    expect(pagesCss).toMatch(/\.documents-group\s*{[^}]*scroll-margin-block-start:\s*calc\(var\(--space-30\) \+ var\(--space-16\)\)/s);
  });

  it('removes decorative movement when reduced motion is requested', () => {
    const reducedMotion = pagesCss.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*{([\s\S]*)}\s*$/)?.[1] ?? '';
    expect(reducedMotion).toMatch(/\.document-item\s*{[^}]*transition:\s*none/s);
    expect(reducedMotion).toMatch(/\.specialists-coverflow__slide\s*{[^}]*transition-duration:\s*var\(--motion-duration-instant\)/s);
  });

  it('keeps primitive tokens isolated to the token layer', () => {
    expect(pagesCss).not.toMatch(/var\(--primitive-/);
    expect(accessibilityCss).not.toMatch(/var\(--primitive-/);
  });
});
