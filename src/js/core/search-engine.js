const SCORE = Object.freeze({
  exactTitle: 1000,
  titlePhrase: 700,
  titleToken: 180,
  keywordPhrase: 500,
  keywordToken: 140,
  summaryPhrase: 320,
  summaryToken: 90,
  contentPhrase: 160,
  contentToken: 40,
  fuzzyTitleOrKeyword: 24,
});

export const normalizeSearchText = (value) => String(value ?? '')
  .normalize('NFKC')
  .toLocaleLowerCase('ru-RU')
  .replaceAll('ё', 'е')
  .replace(/[^a-zа-я0-9]+/giu, ' ')
  .trim()
  .replace(/\s+/g, ' ');

export const tokenizeSearchQuery = (query) => [
  ...new Set(normalizeSearchText(query).split(' ').filter(Boolean)),
];

const tokenSet = (value) => new Set(normalizeSearchText(value).split(' ').filter(Boolean));

const hasTokenOrPrefix = (tokens, queryToken) => [...tokens]
  .some((candidate) => candidate === queryToken || candidate.startsWith(queryToken));

const isWithinOneEdit = (left, right) => {
  if (left === right) return true;
  if (Math.abs(left.length - right.length) > 1) return false;

  if (left.length === right.length) {
    let mismatches = 0;
    let firstMismatch = -1;
    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) {
        mismatches += 1;
        if (firstMismatch < 0) firstMismatch = index;
        if (mismatches > 2) return false;
      }
    }
    if (mismatches <= 1) return true;
    return mismatches === 2
      && firstMismatch + 1 < left.length
      && left[firstMismatch] === right[firstMismatch + 1]
      && left[firstMismatch + 1] === right[firstMismatch];
  }

  const shorter = left.length < right.length ? left : right;
  const longer = left.length < right.length ? right : left;
  let shortIndex = 0;
  let longIndex = 0;
  let skipped = false;

  while (shortIndex < shorter.length && longIndex < longer.length) {
    if (shorter[shortIndex] === longer[longIndex]) {
      shortIndex += 1;
      longIndex += 1;
      continue;
    }
    if (skipped) return false;
    skipped = true;
    longIndex += 1;
  }
  return true;
};

const fieldScore = (field, tokens, phrase, phraseScore, tokenScore) => {
  let score = phrase && field.includes(phrase) ? phraseScore : 0;
  for (const token of tokens) {
    if (field.split(' ').includes(token)) score += tokenScore;
  }
  return score;
};

const makeSnippet = (item, queryTokens) => {
  const summary = String(item.summary ?? '').trim();
  if (summary) return summary.slice(0, 160);

  const content = String(item.content ?? '').trim();
  const normalized = normalizeSearchText(content);
  const position = queryTokens.reduce((found, token) => {
    const next = normalized.indexOf(token);
    return next >= 0 && (found < 0 || next < found) ? next : found;
  }, -1);
  const start = Math.max(0, position - 45);
  return content.slice(start, start + 160).trim();
};

export function searchItems(items, query, { limit = 8 } = {}) {
  const phrase = normalizeSearchText(query);
  if (phrase.length < 2) return [];
  const queryTokens = tokenizeSearchQuery(phrase);

  const matches = items.flatMap((item, order) => {
    const title = normalizeSearchText(item.title);
    const keywords = normalizeSearchText((item.keywords ?? []).join(' '));
    const summary = normalizeSearchText(item.summary);
    const content = normalizeSearchText(item.content);
    const titleTokens = tokenSet(title);
    const keywordTokens = tokenSet(keywords);
    const summaryTokens = tokenSet(summary);
    const contentTokens = tokenSet(content);

    const tokenMatches = queryTokens.map((token) => {
      const literal = hasTokenOrPrefix(titleTokens, token)
        || hasTokenOrPrefix(keywordTokens, token)
        || hasTokenOrPrefix(summaryTokens, token)
        || hasTokenOrPrefix(contentTokens, token);
      const fuzzy = token.length >= 4 && [...titleTokens, ...keywordTokens]
        .some((candidate) => isWithinOneEdit(token, candidate));
      return { token, literal, fuzzy };
    });

    if (tokenMatches.some(({ literal, fuzzy }) => !literal && !fuzzy)) return [];

    let score = title === phrase ? SCORE.exactTitle : 0;
    score += fieldScore(title, queryTokens, phrase, SCORE.titlePhrase, SCORE.titleToken);
    score += fieldScore(keywords, queryTokens, phrase, SCORE.keywordPhrase, SCORE.keywordToken);
    score += fieldScore(summary, queryTokens, phrase, SCORE.summaryPhrase, SCORE.summaryToken);
    score += fieldScore(content, queryTokens, phrase, SCORE.contentPhrase, SCORE.contentToken);
    score += tokenMatches.filter(({ literal, fuzzy }) => !literal && fuzzy).length * SCORE.fuzzyTitleOrKeyword;

    return [{
      item,
      score,
      snippet: makeSnippet(item, queryTokens),
      matchedTerms: queryTokens,
      matchedTokenCount: tokenMatches.length,
      order,
    }];
  });

  return matches
    .sort((left, right) => (
      right.score - left.score
      || right.matchedTokenCount - left.matchedTokenCount
      || left.item.title.length - right.item.title.length
      || left.order - right.order
    ))
    .slice(0, Math.max(0, limit))
    .map(({ matchedTokenCount, order, ...match }) => match);
}
