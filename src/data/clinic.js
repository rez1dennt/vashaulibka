export const CLINIC = Object.freeze({
  name: 'Стоматология Ваша улыбка',
  legalName: 'Общество с ограниченной ответственностью «Стоматология Ваша улыбка»',
  shortLegalName: 'ООО «Стоматология Ваша улыбка»',
  ogrn: '1123123003299',
  inn: '3123296829',
  registeredSince: '17 февраля 2012 года',
  activityAddress: 'Белгородская область, г. Белгород, ул. Макаренко, д. 1г',
  registryAddress: '308000, Белгородская область, г. Белгород, ул. Макаренко, д. 1г',
  complaintsPostalAddress: '308013, Белгородская обл., г. Белгород, ул. Макаренко, д. 1-Г',
});

export const LICENSE = Object.freeze({
  number: 'Л041-01154-31/00551666',
  grantedAt: '16.11.2012',
  authority: 'Министерство здравоохранения Белгородской области',
  status: 'Действует',
  order: '№ 167-л от 22.02.2022',
});

export const CONTACTS = Object.freeze({
  email: 'stomdemidov@mail.ru',
  emailHref: 'mailto:stomdemidov@mail.ru',
  phones: [
    { label: '+7 (4722) 21-53-56', href: 'tel:+74722215356' },
    { label: '+7 (908) 786-48-48', href: 'tel:+79087864848' },
  ],
});

export const HOURS = Object.freeze({
  weekdays: { label: 'Пн–Пт', value: '10:00–19:00', closed: false },
  saturday: { label: 'Сб', value: '10:00–14:00', closed: false },
  sunday: { label: 'Вс', value: 'Выходной', closed: true },
  breakNote: 'Без перерыва',
});
