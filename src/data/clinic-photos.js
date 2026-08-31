// Original photographs supplied by the clinic on 31 August 2026.
export const CLINIC_PHOTO_SOURCES = Object.freeze({
  'entrance-close': Object.freeze({ file: 'ZP_cWALM-pXcqJqPcVsbxUDolfE1wT6lOdCJVvRlijS2iWwuksuNUWOOuHcjlnudEcVCAN4a6jb1XxDb5e700oMi.jpg', sha256: '90DDA7C2C7C7B0DF076355EE60F29049D390AE14E7FAD6172357C99B6CC14E1B' }),
  'entrance-wide': Object.freeze({ file: 'xeOv9vXmQuPvEzPJiQfTseCdiU2R9u_MCLmAptmbVtAUaIp_UP_QiZGWcQZVMtiKpAWwvv_-zAZ86Jxb6_95lazQ.jpg', sha256: '66A57C44314569D4F070A63D6E5BE70B07C43F9DFA499620F605E6141C9ED6CA' }),
  'treatment-room': Object.freeze({ file: 'VRhwp55p74-KU8-yyhGJhzMtsv2jYs1edhYVPGFPKHK0cJYgmb2UcePnxAyD1dHXnP6dOVLD0-g90x6tCwV2V8Ne.jpg', sha256: '632B397C17B807666CF7D483DD10A5849333AF6FF91757C894F9D95DDC198917' }),
  'treatment-chair': Object.freeze({ file: 'ISJVsvy-x6t85xCdKcttAO_TDhkd3HiIeYgWVZTHkZNDYFt9-TdTOqi00pDHBQfr8yEnLc7Fr7v-QwdW2kelEzdD.jpg', sha256: 'D5A0705FD33035D65DF6529F2AD386E12A9A1BB960C9316389FB9E98594DEAED' }),
  'facade-wide': Object.freeze({ file: 'ZmdKlJdLjUFssNla0ivV8AP22i5rNLCFKqqUegOTcNqBIlRGknIrFUhIBtObDr3TGrwSZRi0fnSOovad6MjoJtpO.jpg', sha256: '6D94C314B91A236F14FC4D24D69B5DC5572DD8CE78CA34AAFEC6BE656D6D4634' }),
  'building': Object.freeze({ file: 'hxqOCWAwIggnjpvyJtJCJ1rJO-zQnITEoTx8vEzpgH5ah4EbQHTqY3VVTGj_HvAmGOt7IvwMF-xF1ChXnBd1J0TO.jpg', sha256: 'EAC6DA18261F10514573628F2B7E55352B038AE6151640F1F428B98CAC8CF139' }),
});

export const CLINIC_PHOTOS = Object.freeze({
  home: Object.freeze({ source: 'treatment-room', crop: '1280x720+0+200', alt: 'Стоматологический кабинет клиники с двумя креслами', width: 1280, height: 720 }),
  about: Object.freeze({ source: 'facade-wide', crop: '1280x720+0+190', alt: 'Фасад стоматологической клиники на улице Макаренко, 1г', width: 1280, height: 720 }),
  services: Object.freeze({ source: 'treatment-chair', crop: '1280x720+0+600', alt: 'Стоматологическое кресло и рабочее место врача в кабинете клиники', width: 1280, height: 720 }),
  specialists: Object.freeze({ source: 'treatment-room', crop: '1280x720+0+160', alt: 'Рабочие места специалистов в стоматологическом кабинете клиники', width: 1280, height: 720 }),
  prices: Object.freeze({ source: 'treatment-chair', crop: '1280x720+0+500', alt: 'Кабинет стоматологии с креслом и инструментальным блоком', width: 1280, height: 720 }),
  reviews: Object.freeze({ source: 'entrance-close', crop: '1280x720+0+500', alt: 'Вход в клинику с вывеской стоматологии', width: 1280, height: 720 }),
  vacancies: Object.freeze({ source: 'building', crop: '1280x720+0+760', alt: 'Здание и вход в стоматологическую клинику на улице Макаренко', width: 1280, height: 720 }),
  contacts: Object.freeze({ source: 'entrance-wide', crop: '1280x720+0+220', alt: 'Вход в стоматологию со стороны улицы Макаренко', width: 1280, height: 720 }),
});
