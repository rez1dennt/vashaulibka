import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { renderSiteSearch } from '../../src/templates/site-search.js';

describe('site search markup', () => {
  it('renders one inline responsive combobox with a mobile toggle', () => {
    const document = new JSDOM(`<body>${renderSiteSearch()}</body>`).window.document;
    const root = document.querySelector('[data-site-search]');
    const toggle = root.querySelector('[data-search-toggle][aria-controls="site-search-surface"]');
    const input = root.querySelector('[data-search-input][role="combobox"]');

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-label')).toBe('Открыть поиск по сайту');
    expect(toggle.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(input.getAttribute('aria-controls')).toBe('site-search-results');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.getAttribute('aria-haspopup')).toBe('listbox');
    expect(input.hasAttribute('name')).toBe(false);
    expect(root.querySelector('[data-search-dropdown][aria-hidden="true"]')).not.toBeNull();
    expect(root.querySelector('#site-search-results[role="listbox"]')).not.toBeNull();
    expect(root.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(root.querySelector('[data-search-hint][hidden]')).not.toBeNull();
    expect(root.querySelector('.site-search-fallback[href="patients.html"]')).not.toBeNull();
  });

  it('does not render modal, backdrop, form or submit semantics', () => {
    const document = new JSDOM(`<body>${renderSiteSearch()}</body>`).window.document;
    const root = document.querySelector('[data-site-search]');

    expect(root.querySelector('[role="dialog"], [aria-modal="true"], [data-search-backdrop]')).toBeNull();
    expect(root.querySelector('form, [type="submit"]')).toBeNull();
    expect(root.querySelector('[data-search-close]')).toBeNull();
  });
});
