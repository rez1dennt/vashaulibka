export const MIS_SMS_TEMPLATES = Object.freeze({
  appointmentCreated: 'Здравствуйте, {Имя пациента}. Напоминаем о записи в стоматологию {Название клиники} {Дата приема} {Время приема}',
  upcomingVisit: 'Вы записаны на прием {Дата приема} {Время приема}. {Название клиники}',
});

const APPROVED_MIS_SMS_TEXTS = new Set(Object.values(MIS_SMS_TEMPLATES));

export const isApprovedMisSmsTemplate = (text) => (
  typeof text === 'string' && APPROVED_MIS_SMS_TEXTS.has(text)
);
