import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pagesCss = readFileSync('src/styles/pages.css', 'utf8');

describe('responsive home hero alignment', () => {
  it('centers the complete hero copy before the desktop breakpoint', () => {
    expect(pagesCss).toMatch(/\.home-hero__copy\s*\{[^}]*text-align:\s*center;/s);
    expect(pagesCss).toMatch(/\.home-hero__lead\s*\{[^}]*margin-inline:\s*auto;/s);
    expect(pagesCss).toMatch(/\.home-hero__trust\s*\{[^}]*justify-content:\s*center;[^}]*text-align:\s*start;/s);
  });

  it('uses one shared left axis from 64rem', () => {
    expect(pagesCss).toMatch(/@media \(min-width:\s*64rem\)[\s\S]*?\.home-hero__copy\s*\{[^}]*text-align:\s*start;/);
    expect(pagesCss).toMatch(/@media \(min-width:\s*64rem\)[\s\S]*?\.home-hero__lead,\s*\.home-hero__actions\s*\{[^}]*margin-inline:\s*var\(--space-0\);/);
    expect(pagesCss).toMatch(/@media \(min-width:\s*64rem\)[\s\S]*?\.home-hero__actions\s*\{[^}]*justify-items:\s*start;/);
    expect(pagesCss).toMatch(/@media \(min-width:\s*64rem\)[\s\S]*?\.home-hero__trust\s*\{[^}]*justify-content:\s*flex-start;/);
  });
});
