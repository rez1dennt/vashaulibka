import { JSDOM } from 'jsdom';
import {
  SEARCH_PAGE_META,
  SEARCH_SERVICE_KEYWORDS,
  SEARCH_STAFF_KEYWORDS,
} from '../src/data/search-keywords.js';

const SAFE_HREF = /^[a-z0-9-]+\.html(?:#[a-z][a-z0-9-]*)?$/;
const REMOVED_SELECTORS = [
  'script',
  'style',
  'button',
  'nav',
  'footer',
  'dialog',
  '[hidden]',
  '[aria-hidden="true"]',
  '.sr-only',
].join(',');

export const isSafeSearchHref = (href) => SAFE_HREF.test(String(href));

const compact = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const extractText = (markup) => {
  const document = new JSDOM(`<main>${markup}</main>`).window.document;
  document.querySelectorAll(REMOVED_SELECTORS).forEach((node) => node.remove());
  return compact(document.querySelector('main')?.textContent);
};

const createItem = ({ id, href, category, title, summary, content, keywords }) => {
  const item = {
    id: compact(id),
    href: compact(href),
    category: compact(category),
    title: compact(title),
    summary: compact(summary),
    content: compact(content),
    keywords: [...new Set((keywords ?? []).map(compact).filter(Boolean))],
  };

  if (!item.id || !item.category || !item.title || !item.summary || !item.content || !item.keywords.length) {
    throw new Error(`Search item ${item.id || '<unknown>'} requires non-empty public fields`);
  }
  if (!isSafeSearchHref(item.href)) {
    throw new Error(`Search item ${item.id} contains an unsafe href`);
  }

  return Object.freeze({ ...item, keywords: Object.freeze(item.keywords) });
};

export function buildSearchIndex({ pages, services, staff }) {
  const pageItems = pages.map((page) => {
    const meta = SEARCH_PAGE_META[page.file];
    if (!meta) throw new Error(`Missing search metadata for ${page.file}`);

    return createItem({
      id: `page-${page.file.replace(/\.html$/, '')}`,
      href: page.file,
      category: meta.category,
      title: page.heading,
      summary: page.lead,
      content: extractText(page.body),
      keywords: meta.keywords,
    });
  });

  const serviceItems = services.map((service) => createItem({
    id: `service-${service.slug}`,
    href: `services.html#service-${service.slug}`,
    category: 'Услуги',
    title: service.title,
    summary: service.summary,
    content: service.items.join(' '),
    keywords: SEARCH_SERVICE_KEYWORDS[service.slug],
  }));

  const staffItems = staff.map((person, index) => createItem({
    id: `specialist-${index + 1}`,
    href: `specialists.html#specialist-${index + 1}`,
    category: 'Специалисты',
    title: person.name,
    summary: person.role,
    content: [
      person.role,
      person.experience,
      ...person.education,
      ...person.professionalTraining,
      ...person.records.flatMap(({ identifier, specialty, educationLevel, issueYear }) => [
        identifier,
        specialty,
        educationLevel,
        issueYear,
      ]),
    ].join(' '),
    keywords: [
      ...SEARCH_STAFF_KEYWORDS,
      person.name,
      person.role,
      ...person.records.map(({ specialty }) => specialty),
    ],
  }));

  const items = [...pageItems, ...serviceItems, ...staffItems];
  if (new Set(items.map((item) => item.id)).size !== items.length) {
    throw new Error('Search index contains duplicate ids');
  }

  return Object.freeze({ version: 1, items: Object.freeze(items) });
}

export const serializeSearchIndex = (index) => `${JSON.stringify(index, null, 2)}\n`;
