import { describe, expect, it } from 'vitest';
import { SERVICES } from '../../src/data/services.js';
import { INCOMPLETE_CONTENT, STAFF } from '../../src/data/staff.js';

describe('published content safety', () => {
  it('contains only license-backed service groups', () => {
    expect(SERVICES.map((item) => item.slug)).toEqual(['therapy', 'orthopedics', 'premedical']);
    expect(JSON.stringify(SERVICES)).not.toMatch(/имплант|хирург|ортодонт|детск/i);
    expect(SERVICES.every((item) => item.priceStatus === 'Стоимость уточняется у администратора')).toBe(true);
  });

  it('contains exactly the five supplied employees without fabricated credentials', () => {
    expect(STAFF).toHaveLength(5);
    expect(STAFF.map((person) => person.name)).toContain('Демидов Андрей Фёдорович');
    expect(STAFF.every((person) => person.photo === null && person.credentials === null)).toBe(true);
    expect(INCOMPLETE_CONTENT.specialists.noindex).toBe(true);
    expect(INCOMPLETE_CONTENT.prices.noindex).toBe(true);
  });
});
