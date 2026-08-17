import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DOCUMENT_GROUPS, OFFICIAL_DOCUMENT_URLS, PRICE_LIST, PUBLIC_DOCUMENTS } from '../../src/data/documents.js';
import { REGULATORY_DOCUMENTS } from '../../src/data/regulatory-documents.js';

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex').toUpperCase();

describe('published clinic documents', () => {
  it('describes the approved price list without inventing a contract', () => {
    expect(PRICE_LIST).toMatchObject({
      approvedAt: '2026-05-05',
      approvedLabel: '5 мая 2026 года',
      pageCount: 19,
      href: 'documents/price-list-2026-05-05.pdf',
    });
    expect(PRICE_LIST).not.toHaveProperty('itemCount');
    expect(PRICE_LIST.notices.join(' ')).toContain('не является публичной офертой');
    expect(PRICE_LIST.notices.join(' ')).toContain('после консультации и составления плана лечения');
    expect(JSON.stringify(DOCUMENT_GROUPS)).not.toMatch(/образец договора/i);
  });

  it('keeps the supplied PDFs byte-identical', () => {
    expect(sha256(`public/${PUBLIC_DOCUMENTS.priceList2026}`)).toBe('FA85F2FD939C6A6E799932FB4C14FBF1CE05919A41CB2261A6C27E9ECFB16538');
    expect(sha256(`public/${PUBLIC_DOCUMENTS.soutSummary2024}`)).toBe('58552C0CFC157373A140F4082154DBCDAF79D99C7D6CAD33E1717BF5146035D9');
  });

  it('labels current, future, and archived government acts exactly', () => {
    const documents = DOCUMENT_GROUPS.flatMap((group) => group.items);
    expect(documents.find(({ id }) => id === 'paid-services-736')?.status).toBe('Действует до 31.08.2026');
    expect(documents.find(({ id }) => id === 'paid-services-659')?.status).toBe('С 01.09.2026');
    expect(documents.find(({ id }) => id === 'state-guarantees-2188')?.status).toBe('Действует');
    expect(documents.find(({ id }) => id === 'state-guarantees-1940')?.status).toBe('Архив');
  });

  it('uses resilient official pages for acts with government copies', () => {
    expect(OFFICIAL_DOCUMENT_URLS.paidServices736).toBe('https://government.ru/docs/all/147526/');
    expect(OFFICIAL_DOCUMENT_URLS.stateGuarantees2188).toBe('https://government.ru/docs/all/163114/');
    expect(OFFICIAL_DOCUMENT_URLS.stateGuarantees1940).toBe('https://government.ru/docs/all/157366/');
    expect(OFFICIAL_DOCUMENT_URLS.healthLaw323).toBe('https://government.ru/docs/all/100186/');
  });

  it('connects every supplied regulation to its local PDF and official fallback', () => {
    const documents = DOCUMENT_GROUPS.flatMap((group) => group.items);
    for (const regulation of REGULATORY_DOCUMENTS) {
      expect(documents.find(({ id }) => id === regulation.id)).toMatchObject({
        href: regulation.href,
        officialHref: regulation.officialHref,
        localPdf: true,
      });
    }
  });

  it('keeps document groups and nested records immutable', () => {
    expect(Object.isFrozen(DOCUMENT_GROUPS)).toBe(true);
    expect(DOCUMENT_GROUPS.every((group) => Object.isFrozen(group) && Object.isFrozen(group.items))).toBe(true);
    expect(DOCUMENT_GROUPS.flatMap((group) => group.items).every(Object.isFrozen)).toBe(true);
  });
});
