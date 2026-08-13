import { describe, expect, it } from 'vitest';
import { analyzeSearchQuery } from '../../src/js/core/search-language.js';

describe('Russian clinic search language', () => {
  it('removes conversational filler without losing the patient intent', () => {
    expect(analyzeSearchQuery('Как можно оплатить?').tokens).toEqual(['оплата']);
    expect(analyzeSearchQuery('Где посмотреть режим работы').tokens).toEqual(['режим', 'работа']);
  });

  it.each([
    ['врачи', 'врач'],
    ['доктора', 'врач'],
    ['лицензию', 'лицензия'],
    ['записаться', 'запись'],
    ['цены', 'цена'],
    ['лечить', 'лечение'],
  ])('maps the reviewed word form %j to %j', (query, expected) => {
    expect(analyzeSearchQuery(query).tokens).toEqual([expected]);
  });

  it('preserves unsupported medical modifiers instead of silently discarding them', () => {
    expect(analyzeSearchQuery('детский стоматолог').tokens).toEqual(['детский', 'врач']);
    expect(analyzeSearchQuery('удалить зуб').tokens).toEqual(['удалить', 'зуб']);
  });
});
