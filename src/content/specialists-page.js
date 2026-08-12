import { CONTACTS } from '../data/clinic.js';
import { INCOMPLETE_CONTENT, STAFF } from '../data/staff.js';
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
  <li class="specialists-coverflow__slide" data-specialist-slide data-specialist-index="${index}" data-position="${initialPosition(index, STAFF.length)}"${index === 0 ? ' aria-current="true"' : ''}>
    <article class="specialist-card">
      <div class="specialist-card__portrait" aria-hidden="true">
        <span class="specialist-card__tooth">${renderIcon('tooth')}</span>
        <span class="specialist-card__initials">${escapeHtml(person.initials)}</span>
      </div>
      <div class="specialist-card__copy">
        <h3 class="specialist-card__name">${escapeHtml(person.name)}</h3>
        <p class="specialist-card__role">${escapeHtml(person.role)}</p>
      </div>
      <button class="specialist-card__select" type="button" data-specialist-select aria-label="Показать сведения: ${escapeHtml(person.name)}">
        <span class="sr-only">Показать сведения о сотруднике</span>
      </button>
    </article>
  </li>`).join('');

export const SPECIALISTS_PAGE = Object.freeze({
  file: 'specialists.html',
  title: 'Сотрудники стоматологии',
  description: 'Подтверждённый список сотрудников ООО «Стоматология Ваша улыбка» без неподтверждённых сведений.',
  heading: 'Сотрудники клиники',
  lead: 'Пять сотрудников и их должности из предоставленных данных.',
  heroImage: 'specialists',
  noindex: INCOMPLETE_CONTENT.specialists.noindex,
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
      <article class="specialist-detail" aria-live="polite" aria-atomic="true">
        <div><p class="eyebrow">Выбранный сотрудник</p><h3 data-specialist-detail-name>${escapeHtml(STAFF[0].name)}</h3><p class="specialist-detail__role" data-specialist-detail-role>${escapeHtml(STAFF[0].role)}</p></div>
        <div class="specialist-detail__status"><strong>Опубликованы подтверждённые имя и должность</strong><p>${escapeHtml(INCOMPLETE_CONTENT.specialists.reason)}</p></div>
        <a class="button button-primary" href="${CONTACTS.phones[0].href}" data-appointment-open>Записаться на приём</a>
      </article>
    </div>
  </div></section>`,
});
