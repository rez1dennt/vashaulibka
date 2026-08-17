import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REGULATORY_DOCUMENTS } from '../../src/data/regulatory-documents.js';

const expectedPaths = Object.freeze({
  'nomenclature-804n': 'documents/regulations/nomenclature-804n.pdf',
  'medicines-890': 'documents/regulations/medicines-890.pdf',
  'state-guarantees-1940': 'documents/regulations/state-guarantees-1940.pdf',
  'state-guarantees-2188': 'documents/regulations/state-guarantees-2188.pdf',
  'health-law-323': 'documents/regulations/health-law-323.pdf',
  'order-118n': 'documents/regulations/order-118n.pdf',
  'paid-services-659': 'documents/regulations/paid-services-659.pdf',
  'paid-services-736': 'documents/regulations/paid-services-736.pdf',
});

const expectedSourceHashes = Object.freeze({
  'nomenclature-804n': 'EF7C95DA20A8F2D0736205CCAFF44C3028A6A5F9280211229F3073E6B8C76DC0',
  'medicines-890': '24F3789D214B9397D9A66C152540B6D13AFAE4EC76DB0E29FB3D0A2CD4B5DCFB',
  'state-guarantees-1940': '00E1C58C48EF8E7602D391B9AE9AD2A81F2FCB7B454A9D519BB9AA87155140D6',
  'state-guarantees-2188': '2CAAFA72E4481F373222949F7F533668A5CAC5C78A1DC72F925F414CB42FC45C',
  'health-law-323': '43B167C46061DC694905250E983629EB9EADACE73C57B0AB749ED94BA3450ABA',
  'order-118n': '846A50A67AEB674986E5046EFB66B56413EAE6D6E69ACCC58CC272C4CA264758',
  'paid-services-659': '7AF320A12723F96F934DFCD231E3971D80560ADEEB385DB058255FB1712497C2',
  'paid-services-736': 'D4A3F220449370FC3969C9855A9822EB247B8F7C4E9171951C6C6A1390FB4816',
});

describe('local regulatory document contract', () => {
  it('maps exactly eight approved records to stable local PDF paths', () => {
    expect(Object.fromEntries(REGULATORY_DOCUMENTS.map(({ id, href }) => [id, href]))).toEqual(expectedPaths);
    expect(REGULATORY_DOCUMENTS).toHaveLength(8);
    expect(new Set(REGULATORY_DOCUMENTS.map(({ id }) => id)).size).toBe(8);
  });

  it('pins every supplied source by its exact SHA-256', () => {
    expect(Object.fromEntries(REGULATORY_DOCUMENTS.map(({ id, sourceSha256 }) => [id, sourceSha256])))
      .toEqual(expectedSourceHashes);
  });

  it('keeps official fallbacks, page contracts, and records immutable', () => {
    expect(Object.isFrozen(REGULATORY_DOCUMENTS)).toBe(true);
    expect(REGULATORY_DOCUMENTS.every(Object.isFrozen)).toBe(true);
    expect(REGULATORY_DOCUMENTS.every(({ officialHref }) => /^https:\/\//.test(officialHref))).toBe(true);
    expect(Object.fromEntries(REGULATORY_DOCUMENTS.map(({ id, expectedPages }) => [id, expectedPages])))
      .toMatchObject({
        'state-guarantees-1940': 698,
        'state-guarantees-2188': 872,
        'paid-services-659': 18,
      });
  });

  it('matches every committed PDF to the generated integrity manifest', () => {
    const manifest = JSON.parse(readFileSync('public/documents/regulations/integrity.json', 'utf8'));
    expect(manifest.version).toBe(1);
    expect(manifest.items).toHaveLength(8);
    expect(new Set(manifest.items.map(({ href }) => href)).size).toBe(8);

    for (const item of manifest.items) {
      expect(REGULATORY_DOCUMENTS.some(({ id, href }) => id === item.id && href === item.href)).toBe(true);
      const path = `public/${item.href}`;
      expect(existsSync(path), item.id).toBe(true);
      const bytes = readFileSync(path);
      expect(bytes.subarray(0, 4).toString('ascii'), item.id).toBe('%PDF');
      expect(bytes.length, item.id).toBe(item.size);
      expect(createHash('sha256').update(bytes).digest('hex').toUpperCase(), item.id).toBe(item.sha256);
      expect(item.pages, item.id).toBeGreaterThan(0);
    }
  });
});
