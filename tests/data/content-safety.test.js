import { describe, expect, it } from 'vitest';
import { SERVICES } from '../../src/data/services.js';
import { SEARCH_SERVICE_KEYWORDS } from '../../src/data/search-keywords.js';
import { STAFF } from '../../src/data/staff.js';

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

  it('contains exactly the five supplied employees with source-backed records', () => {
    expect(STAFF).toHaveLength(5);
    expect(STAFF.map(({ name, role }) => [name, role])).toEqual([
      ['Демидова Инна Владимировна', 'Директор, главный врач'],
      ['Демидов Андрей Федорович', 'Стоматолог-терапевт, стоматолог-ортопед'],
      ['Рощина Любовь Ивановна', 'Зубной врач'],
      ['Ненько Софья Максимовна', 'Медицинская сестра'],
      ['Мясоедова Анастасия Андреевна', 'Медицинская сестра'],
    ]);
    expect(STAFF.every((person) => person.photo === null)).toBe(true);
    expect(STAFF[0].records).toEqual([{
      identifier: '7725033298407',
      issueYear: 2025,
      educationLevel: 'Высшее',
      specialty: 'Организация здравоохранения и общественное здоровье',
    }]);
    expect(STAFF[1].records.map(({ identifier }) => identifier)).toEqual(['7725033633023', '7725033848178']);
    expect(STAFF[2].records[0]).toEqual({
      identifier: '7725033711135',
      issueYear: 2025,
      educationLevel: 'Среднее профессиональное',
      specialty: 'Стоматология',
    });
    expect(STAFF.filter(({ participatesInPaidServices }) => participatesInPaidServices).map(({ name }) => name)).toEqual([
      'Демидова Инна Владимировна',
      'Демидов Андрей Федорович',
      'Рощина Любовь Ивановна',
    ]);

    const copy = JSON.stringify(STAFF);
    for (const fact of [
      '23 года', '18 лет', '30 лет', 'Крымский медицинский институт',
      'Тверскую государственную медицинскую академию', 'Белгородский медицинский колледж',
      'Акушерское дело', 'Сестринское дело',
    ]) expect(copy).toContain(fact);
  });
});
