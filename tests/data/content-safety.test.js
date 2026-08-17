import { describe, expect, it } from 'vitest';
import { SERVICES } from '../../src/data/services.js';
import { SEARCH_SERVICE_KEYWORDS } from '../../src/data/search-keywords.js';
import { INCOMPLETE_CONTENT, STAFF } from '../../src/data/staff.js';

describe('published content safety', () => {
  it('contains only license-backed service groups', () => {
    expect(SERVICES.map((item) => item.slug)).toEqual(['therapy', 'orthopedics', 'dentistry']);
    expect(JSON.stringify(SERVICES)).not.toMatch(/имплант|хирург|ортодонт|детск/i);
    expect(SERVICES.every((item) => item.priceStatus === 'Стоимость указана в утверждённом прейскуранте от 5 мая 2026 года.')).toBe(true);

    const dentistry = SERVICES.find(({ slug }) => slug === 'dentistry');
    expect(dentistry).toEqual({
      slug: 'dentistry',
      title: 'Стоматология',
      summary: 'Первичная доврачебная медико-санитарная помощь по стоматологии, оказываемая зубным врачом.',
      items: ['Первичная доврачебная медико-санитарная помощь по стоматологии'],
      priceStatus: 'Стоимость указана в утверждённом прейскуранте от 5 мая 2026 года.',
    });
    expect(JSON.stringify(SERVICES)).not.toMatch(/сестрин|фельдшер|Доврачебная помощь/i);
    expect(SEARCH_SERVICE_KEYWORDS.dentistry).toEqual(expect.arrayContaining([
      'стоматология',
      'зубной врач',
      'стоматологическая помощь',
    ]));
    expect(SEARCH_SERVICE_KEYWORDS).not.toHaveProperty('premedical');
  });

  it('contains exactly the five supplied employees without fabricated credentials', () => {
    expect(STAFF).toHaveLength(5);
    expect(STAFF.map((person) => person.name)).toContain('Демидов Андрей Фёдорович');
    expect(STAFF.every((person) => person.photo === null && person.credentials === null)).toBe(true);
    expect(INCOMPLETE_CONTENT.specialists.noindex).toBe(true);
    expect(INCOMPLETE_CONTENT.prices.noindex).toBe(true);
  });
});
