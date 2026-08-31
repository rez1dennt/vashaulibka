import { CLINIC_PHOTOS } from '../data/clinic-photos.js';
import { CONTACTS, LICENSE } from '../data/clinic.js';
import { renderHomeDecoration } from './home-decoration.js';
import { renderIcon } from './icons.js';

const escapeHtml = (value) => String(value).replace(/[&<>\"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}[character]));

export function renderHero(page) {
  if (page.heroVariant === 'home') {
    return [
      '<section class="home-hero">',
      renderHomeDecoration('hero-smile'),
      renderHomeDecoration('hero-tooth'),
      '<div class="container home-hero__inner">',
      '<div class="home-hero__copy">',
      '<p class="eyebrow">Стоматологическая клиника в Белгороде</p>',
      `<h1>${escapeHtml(page.heading)}</h1>`,
      `<p class="home-hero__lead">${escapeHtml(page.lead)}</p>`,
      '<div class="home-hero__actions">',
      `<a class="button button-primary" href="${CONTACTS.phones[0].href}" data-appointment-open>${renderIcon('calendar', 'button-icon')}Записаться на приём</a>`,
      `<a class="button button-secondary" href="services.html">Посмотреть услуги${renderIcon('arrow', 'button-icon')}</a>`,
      '</div>',
      `<p class="home-hero__trust">${renderIcon('shield', 'ui-icon')}<span>Лицензия ${escapeHtml(LICENSE.number)}. Статус: ${escapeHtml(LICENSE.status)}.</span></p>`,
      '</div>',
      '<figure class="home-hero__media">',
      `<picture><source srcset="assets/images/clinic-home.avif" type="image/avif"><img src="assets/images/clinic-home.webp" alt="${escapeHtml(CLINIC_PHOTOS.home.alt)}" width="1280" height="720" fetchpriority="high"></picture>`,
      '</figure>',
      '</div>',
      '</section>',
    ].join('');
  }

  return `<section class="page-hero page-hero--${escapeHtml(page.heroImage)}"><div class="container"><nav aria-label="Хлебные крошки"><a href="index.html">Главная</a><span aria-hidden="true">/</span><span>${escapeHtml(page.heading)}</span></nav><h1>${escapeHtml(page.heading)}</h1>${page.lead ? `<p>${escapeHtml(page.lead)}</p>` : ''}</div></section>`;
}
