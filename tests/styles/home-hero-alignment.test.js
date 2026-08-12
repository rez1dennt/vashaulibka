import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pagesCss = readFileSync('src/styles/pages.css', 'utf8');

describe('responsive home hero alignment', () => {
  it('aligns the action group left at every viewport', () => {
    expect(pagesCss).toMatch(/\.home-hero__actions\s*\{[^}]*justify-items:\s*start;[^}]*margin-inline:\s*var\(--space-0\);/s);
    expect(pagesCss).not.toMatch(/@media \(min-width:\s*64rem\)[\s\S]*?\.home-hero__actions\s*\{/);
  });

  it('does not change text or license alignment', () => {
    expect(pagesCss).not.toMatch(/\.home-hero__copy\s*\{[^}]*text-align:/s);
    expect(pagesCss).not.toMatch(/\.home-hero__lead\s*\{[^}]*margin-inline:/s);
    expect(pagesCss).not.toMatch(/\.home-hero__trust\s*\{[^}]*(?:justify-content|text-align):/s);
  });
});
