const STOP_WORDS = new Set([
  'а',
  'в',
  'во',
  'где',
  'для',
  'как',
  'ли',
  'мне',
  'можно',
  'на',
  'найти',
  'нужен',
  'нужна',
  'нужно',
  'о',
  'об',
  'по',
  'пожалуйста',
  'показать',
  'посмотреть',
  'сайте',
  'узнать',
  'хочу',
]);

const WORD_FAMILIES = Object.freeze({
  врач: [
    'врач', 'врача', 'врачам', 'врачами', 'врачах', 'врачи', 'врачей', 'врачу',
    'доктор', 'доктора', 'докторам', 'докторов', 'доктору',
    'специалист', 'специалиста', 'специалисты', 'специалистов',
    'стоматолог', 'стоматолога', 'стоматологи', 'стоматологов', 'стоматологу',
  ],
  запись: [
    'записаться', 'запись', 'записи', 'записаться', 'записываются', 'записываться',
  ],
  лицензия: ['лицензией', 'лицензии', 'лицензий', 'лицензию', 'лицензия'],
  лечение: ['лечат', 'лечение', 'лечением', 'лечении', 'лечить', 'лечу', 'лечения', 'лечению'],
  оплата: [
    'заплатить', 'оплатить', 'оплата', 'оплатой', 'оплате', 'оплату', 'оплаты',
    'платить', 'расплатиться',
  ],
  прием: ['прием', 'приема', 'приеме', 'приемом', 'приему'],
  цена: ['прайс', 'прейскурант', 'стоимость', 'стоимости', 'стоит', 'цена', 'ценах', 'ценой', 'цену', 'цены'],
  зуб: ['зуб', 'зуба', 'зубам', 'зубами', 'зубах', 'зубов', 'зубы'],
  жалоба: ['жалоба', 'жалобой', 'жалобу', 'жалобы', 'пожаловаться'],
  проезд: ['доехать', 'маршрут', 'проезд', 'проехать'],
  протез: ['протез', 'протеза', 'протезам', 'протезами', 'протезов', 'протезы'],
  работа: ['время', 'график', 'работа', 'работает', 'работаете', 'работают', 'работы', 'часы'],
  телефон: ['номер', 'номера', 'номеру', 'телефон', 'телефона', 'телефоны'],
});

const CANONICAL_BY_FORM = new Map(
  Object.entries(WORD_FAMILIES).flatMap(([canonical, forms]) => (
    forms.map((form) => [form, canonical])
  )),
);

export const normalizeSearchText = (value) => String(value ?? '')
  .normalize('NFKC')
  .toLocaleLowerCase('ru-RU')
  .replaceAll('ё', 'е')
  .replace(/[^a-zа-я0-9]+/giu, ' ')
  .trim()
  .replace(/\s+/g, ' ');

export const canonicalizeSearchToken = (token) => CANONICAL_BY_FORM.get(token) ?? token;

export const tokenizeSearchText = (value, { removeStopWords = false } = {}) => [
  ...new Set(
    normalizeSearchText(value)
      .split(' ')
      .filter(Boolean)
      .filter((token) => !removeStopWords || !STOP_WORDS.has(token))
      .map(canonicalizeSearchToken),
  ),
];

export function analyzeSearchQuery(query) {
  const normalized = normalizeSearchText(query);
  const originalTokens = normalized
    .split(' ')
    .filter(Boolean)
    .filter((token) => !STOP_WORDS.has(token));
  const tokens = [...new Set(originalTokens.map(canonicalizeSearchToken))];

  return {
    normalized,
    phrase: tokens.join(' '),
    originalTokens,
    tokens,
    variants: [...new Set([...originalTokens, ...tokens])],
  };
}
