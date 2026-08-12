import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { PAGES } from '../../src/content/page-manifest.js';
import { INCOMPLETE_CONTENT, STAFF } from '../../src/data/staff.js';
import { renderPage } from '../../src/templates/render-page.js';

const renderSpecialists = () => new JSDOM(renderPage(
  PAGES.find((page) => page.file === 'specialists.html'),
)).window.document;

describe('specialists coverflow content', () => {
  it('renders every confirmed person once and no fabricated profile fields', () => {
    const document = renderSpecialists();
    const slides = [...document.querySelectorAll('[data-specialist-slide]')];

    expect(slides).toHaveLength(STAFF.length);
    expect(slides.map((slide) => slide.querySelector('.specialist-card__name').textContent.trim()))
      .toEqual(STAFF.map((person) => person.name));
    expect(slides.map((slide) => slide.querySelector('.specialist-card__role').textContent.trim()))
      .toEqual(STAFF.map((person) => person.role));
    expect(document.querySelector('.specialists-coverflow img')).toBeNull();
    expect(document.body.textContent).not.toMatch(/лет опыта|образовани.+университет|сертификат действителен/i);
  });

  it('ships a complete progressive-enhancement and accessibility contract', () => {
    const document = renderSpecialists();
    const root = document.querySelector('[data-specialists-coverflow]');
    const slides = [...root.querySelectorAll('[data-specialist-slide]')];

    expect(root.getAttribute('aria-label')).toBe('Специалисты клиники');
    expect(root.getAttribute('aria-describedby')).toBe('specialists-coverflow-instructions');
    expect(slides[0].getAttribute('aria-current')).toBe('true');
    expect(slides.slice(1).every((slide) => !slide.hasAttribute('aria-current'))).toBe(true);
    expect(root.querySelector('[data-specialist-prev]').getAttribute('aria-label')).toBe('Предыдущий специалист');
    expect(root.querySelector('[data-specialist-next]').getAttribute('aria-label')).toBe('Следующий специалист');
    expect(root.querySelector('[data-specialist-counter]')).toBeNull();
    expect(root.querySelector('.specialists-coverflow__gesture')).toBeNull();
    expect(root.querySelector('.specialists-coverflow__toolbar')?.querySelectorAll('button')).toHaveLength(2);
    const viewport = root.querySelector('.specialists-coverflow__viewport');
    expect(viewport?.nextElementSibling?.classList.contains('specialists-coverflow__toolbar')).toBe(true);
    expect(document.body.textContent).not.toContain('Выберите карточку');
    expect(document.body.textContent).not.toContain('Листайте карточки');
    expect(document.querySelector('#specialists-coverflow-instructions')?.classList.contains('sr-only')).toBe(true);
    expect(root.querySelector('[data-specialist-detail-name]').textContent.trim()).toBe(STAFF[0].name);
    expect(root.querySelector('[data-specialist-detail-role]').textContent.trim()).toBe(STAFF[0].role);
    expect(document.body.textContent).toContain(INCOMPLETE_CONTENT.specialists.reason);
    expect(root.querySelector('[data-appointment-open]')).not.toBeNull();
  });
});
