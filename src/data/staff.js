const credentialNotice = 'Сведения об образовании, аккредитации и стаже будут опубликованы после получения подтверждающих документов.';

export const STAFF = Object.freeze([
  { name: 'Демидова Инна Владимировна', role: 'Директор, главный врач', initials: 'ДИ', photo: null, credentials: null, credentialNotice },
  { name: 'Демидов Андрей Фёдорович', role: 'Стоматолог-терапевт, стоматолог-ортопед', initials: 'ДА', photo: null, credentials: null, credentialNotice },
  { name: 'Рощина Любовь Ивановна', role: 'Фельдшер стоматологический', initials: 'РЛ', photo: null, credentials: null, credentialNotice },
  { name: 'Ненько Софья Максимовна', role: 'Медицинская сестра', initials: 'НС', photo: null, credentials: null, credentialNotice },
  { name: 'Мясоедова Анастасия Андреевна', role: 'Медицинская сестра', initials: 'МА', photo: null, credentials: null, credentialNotice },
]);

export const INCOMPLETE_CONTENT = Object.freeze({
  specialists: { noindex: true, reason: credentialNotice },
  prices: { noindex: true, reason: 'Утверждённый прейскурант будет опубликован после получения от клиники.' },
});
