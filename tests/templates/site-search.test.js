import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { renderSearchTrigger, renderSiteSearch } from '../../src/templates/site-search.js';

describe('site search markup', () => {
  it('renders one labelled responsive trigger with a real SVG icon', () => {
    const document = new JSDOM(`<body>${renderSearchTrigger()}</body>`).window.document;
    const trigger = document.querySelector('button[data-search-open]');

    expect(trigger.getAttribute('aria-controls')).toBe('site-search-dialog');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-label')).toBe('Поиск по сайту');
    expect(trigger.textContent).toContain('Поиск по сайту');
    expect(trigger.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(document.querySelector('.site-search-fallback[href="patients.html"]')).not.toBeNull();
  });

  it('renders a hidden modal combobox without a form or submit control', () => {
    const document = new JSDOM(`<body>${renderSiteSearch()}</body>`).window.document;
    const dialog = document.querySelector('#site-search-dialog[role="dialog"][aria-modal="true"][hidden]');
    const input = dialog.querySelector('[data-search-input][role="combobox"]');

    expect(input.getAttribute('aria-controls')).toBe('site-search-results');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.hasAttribute('name')).toBe(false);
    expect(dialog.querySelector('#site-search-results[role="listbox"]')).not.toBeNull();
    expect(dialog.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(dialog.querySelector('form')).toBeNull();
    expect(dialog.querySelector('[type="submit"]')).toBeNull();
  });
});
