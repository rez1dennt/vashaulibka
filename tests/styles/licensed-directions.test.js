import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pages = readFileSync('src/styles/pages.css', 'utf8');
const accessibility = readFileSync('src/styles/accessibility.css', 'utf8');

describe('licensed directions navigation', () => {
  it('renders as a contained tokenized navigation surface', () => {
    expect(pages).toMatch(/\.licensed-directions\s*{[^}]*min-inline-size:\s*var\(--space-0\)[^}]*border:[^}]*background:/s);
    expect(pages).toMatch(/\.licensed-directions ul\s*{[^}]*display:\s*grid[^}]*grid-template-columns:\s*minmax\(var\(--space-0\),\s*1fr\)/s);
    expect(pages).toMatch(/\.licensed-directions a\s*{[^}]*min-block-size:\s*var\(--control-block-size\)[^}]*overflow-wrap:\s*anywhere/s);
    expect(pages).toMatch(/\.licensed-directions a:hover/);
    expect(pages).toMatch(/\.licensed-directions a:active/);
  });

  it('adds responsive columns and keeps 200 percent reflow contained', () => {
    expect(pages).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*?\.licensed-directions ul\s*{[^}]*repeat\(3,/s);
    expect(accessibility).toContain('.licensed-directions');
    expect(accessibility).toMatch(/\.licensed-directions ul[^}]*grid-template-columns:\s*minmax\(var\(--space-0\),\s*1fr\)/s);
  });

  it('removes decorative motion with reduced motion', () => {
    const reduced = pages.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*{([\s\S]*)}\s*$/)?.[1] ?? '';
    expect(reduced).toMatch(/\.licensed-directions a\s*{[^}]*transition:\s*none/s);
  });
});
