import { OFFICIAL_DOCUMENT_URLS } from './documents.js';

export const OFFICIAL_SOURCES = Object.freeze({
  order118n: OFFICIAL_DOCUMENT_URLS.order118n,
  paidServices736: OFFICIAL_DOCUMENT_URLS.paidServices736,
  paidServices659: OFFICIAL_DOCUMENT_URLS.paidServices659,
  legalInformation: OFFICIAL_DOCUMENT_URLS.legalInformation,
  clinicalRecommendations: OFFICIAL_DOCUMENT_URLS.clinicalRecommendations,
});

export const PAID_SERVICES_DATE_NOTICE = 'До 31 августа 2026 года применяются Правила предоставления платных медицинских услуг, утверждённые постановлением Правительства РФ от 11 мая 2023 года № 736. С 1 сентября 2026 года применяются Правила, утверждённые постановлением Правительства РФ от 30 мая 2026 года № 659.';

export const BENEFITS = Object.freeze([
  Object.freeze({ category: 'Инвалиды войны', discount: '10 %' }),
  Object.freeze({ category: 'Участники Великой Отечественной войны', discount: '10 %' }),
  Object.freeze({ category: 'Ветераны боевых действий в категориях, указанных в приказе клиники', discount: '10 %' }),
  Object.freeze({ category: 'Военнослужащие 1941–1945 годов в категориях, указанных в приказе клиники', discount: '10 %' }),
  Object.freeze({ category: 'Жители блокадного Ленинграда и осаждённого Севастополя', discount: '10 %' }),
  Object.freeze({ category: 'Работники объектов обороны и члены экипажей транспортного флота в категориях, указанных в приказе клиники', discount: '10 %' }),
  Object.freeze({ category: 'Члены семей погибших инвалидов войны, участников Великой Отечественной войны и ветеранов боевых действий в категориях, указанных в приказе клиники', discount: '10 %' }),
  Object.freeze({ category: 'Лица с инвалидностью', discount: '5 %' }),
  Object.freeze({ category: 'Ветераны и участники специальной военной операции', discount: '10 %' }),
]);

export const GUARANTEES = Object.freeze([
  Object.freeze({ work: 'Стеклоиономерная пломба, I класс по Блэку', warranty: '6 месяцев', serviceLife: '1 год' }),
  Object.freeze({ work: 'Стеклоиономерная пломба, II–V классы по Блэку', warranty: '9 месяцев', serviceLife: '1 год' }),
  Object.freeze({ work: 'Светоотверждаемая пломба, I класс по Блэку', warranty: '1 год', serviceLife: '2 года' }),
  Object.freeze({ work: 'Светоотверждаемая пломба, II–V классы по Блэку', warranty: '9 месяцев', serviceLife: '1 год' }),
  Object.freeze({ work: 'Керамические виниры', warranty: '1 год', serviceLife: '2 года' }),
  Object.freeze({ work: 'Временные пластмассовые коронки', warranty: '3 месяца', serviceLife: '6 месяцев' }),
  Object.freeze({ work: 'Керамические коронки, коронки и вкладки E-max', warranty: '1 год', serviceLife: '2 года' }),
  Object.freeze({ work: 'Металлокерамические коронки и мостовидные протезы', warranty: '2 года', serviceLife: '5 лет' }),
  Object.freeze({ work: 'Циркониевые коронки и мостовидные протезы', warranty: '2 года', serviceLife: '5 лет' }),
  Object.freeze({ work: 'Съёмный пластиночный протез', warranty: '1 год', serviceLife: '2 года' }),
  Object.freeze({ work: 'Бюгельные и условно-съёмные протезы', warranty: '2 года', serviceLife: '5 лет' }),
]);

export const REGULATORS = Object.freeze([
  Object.freeze({
    name: 'Управление Роспотребнадзора по Белгородской области',
    address: '308023, г. Белгород, ул. Железнякова, д. 2',
    phone: '+7 (4722) 34-03-16',
    phoneHref: 'tel:+74722340316',
    url: 'https://31.rospotrebnadzor.ru/kontakty/',
  }),
  Object.freeze({
    name: 'Территориальный орган Росздравнадзора по Белгородской области',
    address: '308007, г. Белгород, ул. Мичурина, д. 56',
    phone: '+7 (4722) 31-05-11',
    phoneHref: 'tel:+74722310511',
    url: 'https://31reg.roszdravnadzor.gov.ru/',
  }),
]);

export const PERSONAL_DATA_SAMPLE = Object.freeze({
  categories: Object.freeze(['имя', 'телефон', 'электронная почта']),
  purpose: 'запись на приём',
  operations: Object.freeze([
    'сбор',
    'запись',
    'систематизация',
    'накопление',
    'хранение',
    'уточнение',
    'извлечение',
    'использование',
    'блокирование',
    'удаление',
    'уничтожение',
  ]),
});
