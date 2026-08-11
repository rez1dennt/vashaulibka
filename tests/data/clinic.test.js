import { describe, expect, it } from 'vitest';
import { CLINIC, CONTACTS, HOURS, LICENSE } from '../../src/data/clinic.js';

describe('verified clinic data', () => {
  it('exposes the current registry identity and license', () => {
    expect(CLINIC.legalName).toBe('Общество с ограниченной ответственностью «Стоматология Ваша улыбка»');
    expect(CLINIC.ogrn).toBe('1123123003299');
    expect(CLINIC.inn).toBe('3123296829');
    expect(LICENSE.number).toBe('Л041-01154-31/00551666');
    expect(JSON.stringify({ CLINIC, LICENSE })).not.toContain('ЛО-31-01-001157');
  });

  it('keeps contact channels machine-readable', () => {
    expect(CONTACTS.phones.map((phone) => phone.href)).toEqual([
      'tel:+74722215356',
      'tel:+79087864848',
    ]);
    expect(HOURS.sunday.closed).toBe(true);
  });
});
