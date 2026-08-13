import { describe, expect, it } from 'vitest';
import {
  normalizeSearchText,
  searchItems,
  tokenizeSearchQuery,
} from '../../src/js/core/search-engine.js';

const items = [
  {
    id: 'therapy',
    href: 'services.html#service-therapy',
    category: 'Услуги',
    title: 'Терапевтическая стоматология',
    summary: 'Лечение кариеса',
    content: 'Консультация стоматолога-терапевта',
    keywords: ['болит зуб', 'лечение зубов'],
  },
  {
    id: 'prices',
    href: 'prices.html',
    category: 'Цены',
    title: 'Стоимость услуг',
    summary: 'Статус прейскуранта',
    content: 'Стоимость уточняется у администратора',
    keywords: ['цена', 'сколько стоит'],
  },
  {
    id: 'license',
    href: 'license.html',
    category: 'Документы',
    title: 'Лицензия и документы',
    summary: 'Выписка из реестра лицензий',
    content: 'ОГРН и реквизиты',
    keywords: ['лицензия', 'ОГРН'],
  },
];

describe('Russian local search engine', () => {
  it('normalizes ё, case, punctuation and repeated whitespace', () => {
    expect(normalizeSearchText('  ПРИЁМ,  врача! ')).toBe('прием врача');
    expect(tokenizeSearchQuery('ЗУБ, зуб; болит')).toEqual(['зуб', 'болит']);
  });

  it.each([
    ['болит зуб', 'therapy'],
    ['сколько стоит', 'prices'],
    ['огрн', 'license'],
  ])('ranks the intended result first for "%s"', (query, expectedId) => {
    expect(searchItems(items, query)[0].item.id).toBe(expectedId);
  });

  it('prefers exact titles over keyword-only matches', () => {
    const ranked = searchItems([
      ...items,
      {
        id: 'exact',
        href: 'exact.html',
        category: 'Документы',
        title: 'Лицензия',
        summary: 'Документ',
        content: 'Документ',
        keywords: ['документ'],
      },
    ], 'лицензия');

    expect(ranked[0].item.id).toBe('exact');
  });

  it('allows one typo in a long title or keyword but not in body-only text', () => {
    expect(searchItems(items, 'лицензияя')[0].item.id).toBe('license');
    expect(searchItems(items, 'кариез').some((match) => match.item.id === 'therapy')).toBe(false);
  });

  it('requires every query token to match the result', () => {
    expect(searchItems(items, 'лицензия кариес')).toEqual([]);
  });

  it('returns nothing for fewer than two characters and obeys the limit', () => {
    expect(searchItems(items, 'з')).toEqual([]);
    expect(searchItems(items, 'и', { limit: 1 })).toEqual([]);
    expect(searchItems(items, 'ст', { limit: 1 })).toHaveLength(1);
  });

  it('returns plain matched terms and a bounded snippet, never markup', () => {
    const [match] = searchItems(items, 'лицензия');

    expect(match.matchedTerms).toEqual(['лицензия']);
    expect(match.snippet).toBe('Выписка из реестра лицензий');
    expect(match.snippet).not.toContain('<mark>');
  });

  it('understands reviewed Russian word forms and conversational filler', () => {
    expect(searchItems(items, 'как можно посмотреть цены')[0].item.id).toBe('prices');
    expect(searchItems(items, 'лечить зуб')[0].item.id).toBe('therapy');
  });

  it('allows safe partial coverage for price intent but not unsupported medical requests', () => {
    expect(searchItems(items, 'цена лечения')[0].item.id).toBe('prices');
    expect(searchItems(items, 'детский стоматолог')).toEqual([]);
    expect(searchItems(items, 'удалить зуб')).toEqual([]);
  });
});
