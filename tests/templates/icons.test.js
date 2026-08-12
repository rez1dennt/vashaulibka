import { describe, expect, it } from 'vitest';
import { renderIcon } from '../../src/templates/icons.js';

const names = [
  'document',
  'team',
  'tooth',
  'ruble',
  'calendar',
  'info',
  'shield',
  'phone',
  'pin',
  'clock',
  'mail',
  'arrow',
  'eye',
  'search',
  'close',
  'clear',
];

describe('local UI icons', () => {
  it('renders every approved name as safe decorative inline SVG', () => {
    for (const name of names) {
      const svg = renderIcon(name, 'test-icon');

      expect(svg).toContain('<svg');
      expect(svg).toContain('class="test-icon"');
      expect(svg).toContain('viewBox="0 0 24 24"');
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).toContain('focusable="false"');
      expect(svg).toContain('currentColor');
      expect(svg).not.toMatch(/<script|on\w+=|https?:/i);
    }
  });

  it('fails closed for unknown icon names', () => {
    expect(() => renderIcon('unknown')).toThrow('Unknown icon: unknown');
  });

  it('rejects unsafe class attribute input', () => {
    expect(() => renderIcon('tooth', 'icon\" onload=\"alert(1)')).toThrow('Invalid icon class');
  });
});
