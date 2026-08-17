import { describe, expect, it } from 'vitest';
import { LICENSED_DIRECTIONS, SERVICES } from '../../src/data/services.js';

describe('licensed dental directions', () => {
  it('publishes exactly the three directions confirmed by the registry extract', () => {
    expect(LICENSED_DIRECTIONS).toEqual([
      { slug: 'dentistry', label: 'Стоматология' },
      { slug: 'orthopedics', label: 'Стоматология ортопедическая' },
      { slug: 'therapy', label: 'Стоматология терапевтическая' },
    ]);
    expect(LICENSED_DIRECTIONS.every(({ slug }) => SERVICES.some((service) => service.slug === slug))).toBe(true);
    expect(Object.isFrozen(LICENSED_DIRECTIONS)).toBe(true);
    expect(LICENSED_DIRECTIONS.every(Object.isFrozen)).toBe(true);
  });

  it('does not publish unconfirmed or nursing directions', () => {
    expect(JSON.stringify({ LICENSED_DIRECTIONS, SERVICES })).not.toMatch(/рентген|общей практики|профилактическ|хирургическ|сестринск/i);
  });
});
