import {
  analyzeSearchQuery,
  normalizeSearchText,
  tokenizeSearchText,
} from './search-language.js';

export { normalizeSearchText } from './search-language.js';

const SCORE = Object.freeze({
  exactTitle: 4000,
  exactReviewedPhrase: 1600,
  titlePhrase: 700,
  titleToken: 180,
  keywordPhrase: 900,
  keywordToken: 140,
  summaryPhrase: 320,
  summaryToken: 90,
  contentPhrase: 160,
  contentToken: 40,
  fuzzyTitleOrKeyword: 24,
  overview: 60,
  partialContextPenalty: 260,
  singleIntentOverview: 500,
  contactIntent: 900,
});

const OPTIONAL_CONTEXT_TOKENS = new Set(['клиника', 'лечение', 'помощь', 'услуга']);

export const tokenizeSearchQuery = (query) => analyzeSearchQuery(query).tokens;

const canonicalText = (value) => tokenizeSearchText(value).join(' ');
const tokenSet = (value) => new Set(tokenizeSearchText(value));

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

const fieldScore = (field, tokens, phrase, phraseScore, tokenScore, rawField = '', rawPhrase = '') => {
  let score = (phrase && field.includes(phrase)) || (rawPhrase && rawField.includes(rawPhrase))
    ? phraseScore
    : 0;
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
  const analyzed = analyzeSearchQuery(query);
  if (analyzed.normalized.replace(/\s+/g, '').length < 2 || !analyzed.tokens.length) return [];
  const { phrase, tokens: queryTokens } = analyzed;

  const matches = items.flatMap((item, order) => {
    const rawTitle = normalizeSearchText(item.title);
    const rawKeywords = normalizeSearchText((item.keywords ?? []).join(' '));
    const rawSummary = normalizeSearchText(item.summary);
    const rawContent = normalizeSearchText(item.content);
    const title = canonicalText(item.title);
    const keywords = canonicalText((item.keywords ?? []).join(' '));
    const summary = canonicalText(item.summary);
    const content = canonicalText(item.content);
    const titleTokens = tokenSet(title);
    const keywordTokens = tokenSet(keywords);
    const summaryTokens = tokenSet(summary);
    const contentTokens = tokenSet(content);

    const tokenMatches = queryTokens.map((token) => {
      const literal = hasTokenOrPrefix(titleTokens, token)
        || hasTokenOrPrefix(keywordTokens, token)
        || hasTokenOrPrefix(summaryTokens, token)
        || hasTokenOrPrefix(contentTokens, token);
      const fuzzyTitle = token.length >= 4 && [...titleTokens]
        .some((candidate) => isWithinOneEdit(token, candidate));
      const fuzzyKeyword = token.length >= 4 && [...keywordTokens]
        .some((candidate) => isWithinOneEdit(token, candidate));
      return { token, literal, fuzzy: fuzzyTitle || fuzzyKeyword, fuzzyTitle };
    });

    const unmatched = tokenMatches.filter(({ literal, fuzzy }) => !literal && !fuzzy);
    const allowsContextOnlyGap = unmatched.length > 0
      && unmatched.every(({ token }) => OPTIONAL_CONTEXT_TOKENS.has(token));
    if (unmatched.length && !allowsContextOnlyGap) return [];

    let score = title === phrase ? SCORE.exactTitle : 0;
    if (analyzed.normalized && rawKeywords.includes(analyzed.normalized)) score += SCORE.exactReviewedPhrase;
    score += fieldScore(title, queryTokens, phrase, SCORE.titlePhrase, SCORE.titleToken, rawTitle, analyzed.normalized);
    score += fieldScore(keywords, queryTokens, phrase, SCORE.keywordPhrase, SCORE.keywordToken, rawKeywords, analyzed.normalized);
    score += fieldScore(summary, queryTokens, phrase, SCORE.summaryPhrase, SCORE.summaryToken, rawSummary, analyzed.normalized);
    score += fieldScore(content, queryTokens, phrase, SCORE.contentPhrase, SCORE.contentToken, rawContent, analyzed.normalized);
    score += tokenMatches.filter(({ literal, fuzzy }) => !literal && fuzzy).length * SCORE.fuzzyTitleOrKeyword;
    score += tokenMatches.filter(({ literal, fuzzyTitle }) => !literal && fuzzyTitle).length * SCORE.titleToken;
    score += item.href.includes('#') ? 0 : SCORE.overview;
    if (item.href === 'contacts.html' && queryTokens.includes('запись')) score += SCORE.contactIntent;
    if (queryTokens.length === 1 && item.id.startsWith('page-')) score += SCORE.singleIntentOverview;
    score -= unmatched.length * SCORE.partialContextPenalty;

    return [{
      item,
      score,
      snippet: makeSnippet(item, queryTokens),
      matchedTerms: analyzed.variants,
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
