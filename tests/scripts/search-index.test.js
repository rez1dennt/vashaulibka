import { describe, expect, it } from 'vitest';
import { PAGES } from '../../src/content/page-manifest.js';
import { SERVICES } from '../../src/data/services.js';
import { STAFF } from '../../src/data/staff.js';
import {
  buildSearchIndex,
  isSafeSearchHref,
  serializeSearchIndex,
} from '../../scripts/generate-search-index.mjs';
import { searchItems } from '../../src/js/core/search-engine.js';

const build = () => buildSearchIndex({
  pages: PAGES,
  services: SERVICES,
  staff: STAFF,
});

describe('generated local search index', () => {
  it('contains every page, service and confirmed staff member', () => {
    const { version, items } = build();

    expect(version).toBe(1);
    expect(items).toHaveLength(PAGES.length + SERVICES.length + STAFF.length);
    expect(PAGES.every((page) => items.some((item) => item.href === page.file))).toBe(true);
    expect(SERVICES.every((service) => items.some((item) => item.href === `services.html#service-${service.slug}`))).toBe(true);
    expect(STAFF.every((person, index) => items.some((item) => (
      item.href === `specialists.html#specialist-${index + 1}`
      && item.title === person.name
    )))).toBe(true);
  });

  it('is deterministic, unique and restricted to local HTML targets', () => {
    const first = build();
    const second = build();

    expect(serializeSearchIndex(first)).toBe(serializeSearchIndex(second));
    expect(new Set(first.items.map((item) => item.id)).size).toBe(first.items.length);
    expect(first.items.every((item) => isSafeSearchHref(item.href))).toBe(true);
    expect(isSafeSearchHref('https://example.com')).toBe(false);
    expect(isSafeSearchHref('javascript:alert(1)')).toBe(false);
    expect(isSafeSearchHref('../private.html')).toBe(false);
  });

  it.each([
    ['врач', 'specialists.html'],
    ['сколько стоит', 'prices.html'],
    ['болит зуб', 'services.html#service-therapy'],
    ['лицензия', 'license.html'],
    ['ОГРН', 'license.html'],
    ['график', 'contacts.html'],
    ['жалоба', 'complaints.html'],
    ['ОМС', 'oms.html'],
    ['куки', 'cookies.html'],
  ])('stores reviewed keywords for "%s"', (keyword, expectedHref) => {
    const item = build().items.find((candidate) => candidate.href === expectedHref);
    const corpus = [item.title, item.summary, item.content, ...item.keywords]
      .join(' ')
      .toLocaleLowerCase('ru-RU');

    expect(corpus).toContain(keyword.toLocaleLowerCase('ru-RU'));
  });

  it('does not advertise unconfirmed services', () => {
    const corpus = serializeSearchIndex(build()).toLocaleLowerCase('ru-RU');

    for (const unsupported of ['имплантация', 'ортодонтия', 'хирургия', 'детская стоматология']) {
      expect(corpus).not.toContain(unsupported);
    }
  });

  it('indexes every reviewed compact-accessibility synonym on the settings page', () => {
    const item = build().items.find((candidate) => candidate.href === 'cookies.html');

    expect(item.keywords).toEqual(expect.arrayContaining([
      'версия для слабовидящих',
      'увеличить текст',
      'контраст',
      'скрыть изображения',
      'голосовые подтверждения',
      'расширенные настройки',
    ]));
  });

  it('ranks a concrete licensed service above the generic services overview', () => {
    const matches = searchItems(build().items, 'болит зуб');

    expect(matches[0].item.href).toBe('services.html#service-therapy');
  });

  it.each([
    ['как оплатить', 'payment.html'],
    ['цена лечения', 'prices.html'],
    ['врачи', 'specialists.html'],
    ['лицензию', 'license.html'],
    ['записаться на прием', 'contacts.html'],
    ['записаться онлайн', 'contacts.html'],
    ['онлайн запись', 'contacts.html'],
    ['когда работаете', 'contacts.html'],
    ['часы работы', 'contacts.html'],
    ['номер телефона', 'contacts.html'],
    ['как доехать', 'contacts.html'],
    ['как пожаловаться', 'complaints.html'],
    ['протезы', 'services.html#service-orthopedics'],
  ])('resolves the patient phrasing %j to the intended published page', (query, expectedHref) => {
    expect(searchItems(build().items, query)[0]?.item.href).toBe(expectedHref);
  });

  it.each([
    ['лицензияя', 'license.html'],
    ['кариез', 'services.html#service-therapy'],
  ])('keeps a safe typo closest to its concrete title or reviewed keyword', (query, expectedHref) => {
    expect(searchItems(build().items, query)[0]?.item.href).toBe(expectedHref);
  });

  it.each(['детский стоматолог', 'удалить зуб', 'имплантация']) (
    'does not turn the unsupported request %j into a generic result',
    (query) => {
      expect(searchItems(build().items, query)).toEqual([]);
    },
  );

  it('rejects missing metadata and empty public fields', () => {
    expect(() => buildSearchIndex({
      pages: [{ file: 'unknown.html', heading: '', lead: '', body: '' }],
      services: [],
      staff: [],
    })).toThrow(/search metadata|non-empty/i);
  });
});
