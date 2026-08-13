import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const MODULE_PATH = '../../src/data/mis-sms-templates.js';

describe('MegaFon-approved MIS SMS templates', () => {
  it('provides an immutable exact source of truth', async () => {
    expect(existsSync('src/data/mis-sms-templates.js')).toBe(true);
    const { MIS_SMS_TEMPLATES } = await import(MODULE_PATH);

    expect(Object.isFrozen(MIS_SMS_TEMPLATES)).toBe(true);
    expect(Object.keys(MIS_SMS_TEMPLATES)).toEqual(['appointmentCreated', 'upcomingVisit']);
    expect(MIS_SMS_TEMPLATES.appointmentCreated).toBe(
      'Здравствуйте, {Имя пациента}. Напоминаем о записи в стоматологию {Название клиники} {Дата приема} {Время приема}',
    );
    expect(MIS_SMS_TEMPLATES.upcomingVisit).toBe(
      'Вы записаны на прием {Дата приема} {Время приема}. {Название клиники}',
    );
  });

  it('accepts only exact approved strings without normalization', async () => {
    expect(existsSync('src/data/mis-sms-templates.js')).toBe(true);
    const { MIS_SMS_TEMPLATES, isApprovedMisSmsTemplate } = await import(MODULE_PATH);

    for (const template of Object.values(MIS_SMS_TEMPLATES)) {
      expect(isApprovedMisSmsTemplate(template)).toBe(true);
    }

    for (const changed of [
      `${MIS_SMS_TEMPLATES.appointmentCreated}.`,
      MIS_SMS_TEMPLATES.appointmentCreated.replace('Здравствуйте,', 'Здравствуйте!'),
      MIS_SMS_TEMPLATES.appointmentCreated.replace(' ', '  '),
      MIS_SMS_TEMPLATES.appointmentCreated.replace('{Имя пациента}', '{ФИО пациента}'),
      MIS_SMS_TEMPLATES.upcomingVisit.replace('прием', 'приём'),
      `${MIS_SMS_TEMPLATES.upcomingVisit} Телефон клиники: +7`,
      '',
      null,
    ]) {
      expect(isApprovedMisSmsTemplate(changed)).toBe(false);
    }
  });

  it('documents provider-side controls without promising zero billing', async () => {
    expect(existsSync('docs/operations/mis-sms-templates.md')).toBe(true);
    const { MIS_SMS_TEMPLATES } = await import(MODULE_PATH);
    const guide = readFileSync('docs/operations/mis-sms-templates.md', 'utf8');

    expect(guide).toContain(MIS_SMS_TEMPLATES.appointmentCreated);
    expect(guide).toContain(MIS_SMS_TEMPLATES.upcomingVisit);
    expect(guide).toMatch(/отключить.*произвольн.*SMS/is);
    expect(guide).toMatch(/обычн.*стоимост.*SMS.*может.*спис/is);
    expect(guide).toMatch(/32top.*письменн.*подтверд/is);
    expect(guide).toMatch(/детализац.*тарификац/is);
  });
});
