import { CONTACTS, LICENSE } from '../data/clinic.js';
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
      '<picture><source srcset="assets/images/hero-home.avif" type="image/avif"><img src="assets/images/hero-home.webp" alt="" width="1920" height="1080" fetchpriority="high"></picture>',
      '<figcaption class="hero-visualization-label">Визуализация интерьера</figcaption>',
      '</figure>',
      '</div>',
      '</section>',
    ].join('');
  }

  return `<section class="page-hero page-hero--${escapeHtml(page.heroImage)}"><div class="container"><nav aria-label="Хлебные крошки"><a href="index.html">Главная</a><span aria-hidden="true">/</span><span>${escapeHtml(page.heading)}</span></nav><h1>${escapeHtml(page.heading)}</h1>${page.lead ? `<p>${escapeHtml(page.lead)}</p>` : ''}<span class="hero-visualization-label">Визуализация интерьера</span></div></section>`;
}
