import { CONTACTS } from '../data/clinic.js';
import { STAFF } from '../data/staff.js';
import { renderIcon } from '../templates/icons.js';

const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}[character]));

const initialPosition = (index, length) => {
  if (index === 0) return 'active';
  if (index === 1) return 'next';
  if (index === length - 1) return 'previous';
  return index < length / 2 ? 'far-next' : 'far-previous';
};

const staffSlides = STAFF.map((person, index) => `
  <li class="specialists-coverflow__slide" id="specialist-${index + 1}" data-specialist-slide data-specialist-index="${index}" data-position="${initialPosition(index, STAFF.length)}"${index === 0 ? ' aria-current="true"' : ''}>
    <article class="specialist-card">
      <div class="specialist-card__portrait" aria-hidden="true">
        <span class="specialist-card__tooth">${renderIcon('tooth')}</span>
        <span class="specialist-card__initials">${escapeHtml(person.initials)}</span>
      </div>
      <div class="specialist-card__copy">
        <h3 class="specialist-card__name">${escapeHtml(person.name)}</h3>
        <p class="specialist-card__role">${escapeHtml(person.role)}</p>
      </div>
      <button class="specialist-card__select" type="button" data-specialist-select aria-controls="specialist-profile-${index + 1}" aria-label="Показать сведения: ${escapeHtml(person.name)}">
        <span class="sr-only">Показать сведения о сотруднике</span>
      </button>
    </article>
  </li>`).join('');

const renderParagraphList = (items) => `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;

const renderRecords = (records) => records.map((record) => `
  <div class="specialist-profile__record">
    <dt>Документ / реестровая запись</dt><dd>${escapeHtml(record.identifier)}</dd>
    <dt>Год выдачи</dt><dd>${escapeHtml(record.issueYear)}</dd>
    <dt>Уровень образования</dt><dd>${escapeHtml(record.educationLevel)}</dd>
    <dt>Специальность</dt><dd>${escapeHtml(record.specialty)}</dd>
  </div>`).join('');

const staffProfiles = STAFF.map((person, index) => `
  <article class="specialist-profile" id="specialist-profile-${index + 1}" data-specialist-profile>
    <header class="specialist-profile__header">
      <p class="eyebrow">Сведения о сотруднике</p>
      <h3>${escapeHtml(person.name)}</h3>
      <p class="specialist-profile__role">${escapeHtml(person.role)}</p>
      <p>${escapeHtml(person.experience)}</p>
    </header>
    <div class="specialist-profile__facts">
      <section><h4>Образование</h4>${renderParagraphList(person.education)}</section>
${person.professionalTraining.length ? `      <section><h4>Профессиональная переподготовка</h4>${renderParagraphList(person.professionalTraining)}</section>` : ''}
      <section><h4>Сведения документов</h4><dl class="specialist-profile__records">${renderRecords(person.records)}</dl></section>
    </div>
  </article>`).join('');

export const SPECIALISTS_PAGE = Object.freeze({
  file: 'specialists.html',
  title: 'Сотрудники стоматологии',
  description: 'Сотрудники ООО «Стоматология Ваша улыбка»: должности, образование, стаж и сведения документов из предоставленных материалов.',
  heading: 'Сотрудники клиники',
  lead: 'Пять сотрудников: подтверждённые должности, образование, стаж и сведения документов.',
  heroImage: 'specialists',
  noindex: false,
  body: `<section class="section specialists-section"><div class="container">
    <div class="specialists-section__heading"><p class="eyebrow">Наша команда</p><h2>Познакомьтесь с сотрудниками клиники</h2></div>
    <div class="specialists-coverflow" data-specialists-coverflow aria-label="Специалисты клиники" aria-describedby="specialists-coverflow-instructions">
      <p class="sr-only" id="specialists-coverflow-instructions">Используйте стрелки, клавиши влево и вправо или свайп, чтобы выбрать сотрудника.</p>
      <div class="specialists-coverflow__stage">
        <div class="specialists-coverflow__viewport" data-specialist-viewport tabindex="0"><ol class="specialists-coverflow__track">${staffSlides}</ol></div>
        <div class="specialists-coverflow__toolbar">
          <div class="specialists-coverflow__controls">
            <button type="button" class="specialists-coverflow__arrow specialists-coverflow__arrow--previous" data-specialist-prev aria-label="Предыдущий специалист">${renderIcon('arrow')}</button>
            <button type="button" class="specialists-coverflow__arrow" data-specialist-next aria-label="Следующий специалист">${renderIcon('arrow')}</button>
          </div>
        </div>
      </div>
      <div class="specialist-profiles">${staffProfiles}</div>
      <div class="specialist-profile-cta"><a class="button button-primary" href="${CONTACTS.phones[0].href}" data-appointment-open>Записаться на приём</a></div>
    </div>
  </div></section>`,
});
