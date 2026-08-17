export const STAFF = Object.freeze([
  Object.freeze({
    id: 'demidova-inna-vladimirovna',
    name: 'Демидова Инна Владимировна',
    role: 'Директор, главный врач',
    initials: 'ДИ',
    participatesInPaidServices: true,
    experience: 'Директор и главный врач клиники с 2012 года.',
    education: Object.freeze([
      'В 1997 году окончила Крымский медицинский институт им. С. И. Георгиевского по специальности «Педиатрия».',
    ]),
    professionalTraining: Object.freeze([
      'В 2012 году прошла профессиональную переподготовку по специальности «Организация здравоохранения и общественное здоровье».',
    ]),
    records: Object.freeze([Object.freeze({
      identifier: '7725033298407',
      issueYear: 2025,
      educationLevel: 'Высшее',
      specialty: 'Организация здравоохранения и общественное здоровье',
    })]),
    photo: null,
  }),
  Object.freeze({
    id: 'demidov-andrey-fedorovich',
    name: 'Демидов Андрей Федорович',
    role: 'Стоматолог-терапевт, стоматолог-ортопед',
    initials: 'ДА',
    participatesInPaidServices: true,
    experience: 'Стаж работы врачом-стоматологом-терапевтом — 23 года; по специальности «Стоматология ортопедическая» — 18 лет.',
    education: Object.freeze([
      'В 2003 году окончил Тверскую государственную медицинскую академию по специальности «Стоматология».',
    ]),
    professionalTraining: Object.freeze([
      'В 2008 году прошёл профессиональную переподготовку в ГОУ ВПО ВГМА им. Н. Н. Бурденко по специальности «Стоматология ортопедическая».',
      'В 2009 году прошёл профессиональную переподготовку в ГОУ ВПО ВГМА им. Н. Н. Бурденко по специальности «Стоматология терапевтическая».',
    ]),
    records: Object.freeze([
      Object.freeze({ identifier: '7725033633023', issueYear: 2025, educationLevel: 'Высшее', specialty: 'Стоматология терапевтическая' }),
      Object.freeze({ identifier: '7725033848178', issueYear: 2025, educationLevel: 'Высшее', specialty: 'Стоматология ортопедическая' }),
    ]),
    photo: null,
  }),
  Object.freeze({
    id: 'roshchina-lyubov-ivanovna',
    name: 'Рощина Любовь Ивановна',
    role: 'Зубной врач',
    initials: 'РЛ',
    participatesInPaidServices: true,
    experience: 'Стаж работы по специальности — 30 лет.',
    education: Object.freeze([
      'В 1996 году окончила Белгородский медицинский колледж по специальности «Зубной врач».',
    ]),
    professionalTraining: Object.freeze([]),
    records: Object.freeze([Object.freeze({
      identifier: '7725033711135',
      issueYear: 2025,
      educationLevel: 'Среднее профессиональное',
      specialty: 'Стоматология',
    })]),
    photo: null,
  }),
  Object.freeze({
    id: 'nenko-sofya-maksimovna',
    name: 'Ненько Софья Максимовна',
    role: 'Медицинская сестра',
    initials: 'НС',
    participatesInPaidServices: false,
    experience: 'Стаж работы в должности медицинской сестры — 2 года.',
    education: Object.freeze([
      'В 2021 году окончила ФГАОУ ВО «НИУ БелГУ» по специальности «Акушерское дело».',
      'На момент предоставления сведений обучается на VI курсе медицинского института НИУ БелГУ.',
    ]),
    professionalTraining: Object.freeze([
      'В 2024 году прошла профессиональную переподготовку в ФГАОУ ВО «НИУ БелГУ» по специальности «Сестринское дело».',
    ]),
    records: Object.freeze([Object.freeze({
      identifier: 'Выписка из протокола № 2 заседания экзаменационной комиссии от 29.10.2024',
      issueYear: 2024,
      educationLevel: 'Среднее профессиональное',
      specialty: 'Сестринское дело',
    })]),
    photo: null,
  }),
  Object.freeze({
    id: 'myasoedova-anastasiya-andreevna',
    name: 'Мясоедова Анастасия Андреевна',
    role: 'Медицинская сестра',
    initials: 'МА',
    participatesInPaidServices: false,
    experience: 'Работает медицинской сестрой с 2026 года.',
    education: Object.freeze([
      'В 2024 году окончила ФГАОУ ВО «НИУ БелГУ» по специальности «Сестринское дело».',
    ]),
    professionalTraining: Object.freeze([]),
    records: Object.freeze([Object.freeze({
      identifier: '3125033615891',
      issueYear: 2025,
      educationLevel: 'Среднее профессиональное',
      specialty: 'Сестринское дело',
    })]),
    photo: null,
  }),
]);

export const INCOMPLETE_CONTENT = Object.freeze({
  specialists: { noindex: true },
  prices: { noindex: true, reason: 'Утверждённый прейскурант будет опубликован после получения от клиники.' },
});
