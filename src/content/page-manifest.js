import { CLINIC } from '../data/clinic.js';

export const PAGES = [
  {
    file: 'index.html',
    title: 'Стоматологическая клиника в Белгороде',
    description: 'ООО «Стоматология Ваша улыбка»: лицензированная стоматологическая помощь в Белгороде.',
    heading: 'Стоматология Ваша улыбка',
    lead: 'Забота о здоровье зубов в пределах действующей медицинской лицензии.',
    heroImage: 'home',
    body: `<section class="section"><div class="container"><h2>О клинике</h2><p>${CLINIC.legalName} зарегистрировано ${CLINIC.registeredSince}.</p></div></section>`,
    noindex: false,
  },
  {
    file: 'about.html',
    title: 'О клинике',
    description: 'Реквизиты, лицензия и принципы работы ООО «Стоматология Ваша улыбка».',
    heading: 'О клинике',
    lead: 'Подтверждённые сведения о клинике и медицинской деятельности.',
    heroImage: 'about',
    body: '<section class="section"><div class="container"><h2>Наша миссия</h2><p>Оказывать понятную и ответственную стоматологическую помощь.</p></div></section>',
    noindex: false,
  },
];
