import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { PAGES } from '../../src/content/page-manifest.js';
import { STAFF } from '../../src/data/staff.js';
import { renderPage } from '../../src/templates/render-page.js';

const renderSpecialists = () => new JSDOM(renderPage(
  PAGES.find((page) => page.file === 'specialists.html'),
)).window.document;

describe('specialists coverflow content', () => {
  it('renders every confirmed person and source-backed profile once', () => {
    const document = renderSpecialists();
    const slides = [...document.querySelectorAll('[data-specialist-slide]')];

    expect(slides).toHaveLength(STAFF.length);
    expect(slides.map((slide) => slide.querySelector('.specialist-card__name').textContent.trim()))
      .toEqual(STAFF.map((person) => person.name));
    expect(slides.map((slide) => slide.querySelector('.specialist-card__role').textContent.trim()))
      .toEqual(STAFF.map((person) => person.role));
    expect(document.querySelector('.specialists-coverflow img')).toBeNull();
    const profiles = [...document.querySelectorAll('[data-specialist-profile]')];
    expect(profiles).toHaveLength(STAFF.length);
    expect(profiles.every((profile) => !profile.hidden && !profile.hasAttribute('aria-hidden'))).toBe(true);
    expect(document.body.textContent).toContain('7725033711135');
    expect(document.body.textContent).toContain('Белгородский медицинский колледж');
    expect(document.body.textContent).not.toMatch(/сертификат действителен|аккредитация действительна/i);
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
    const profiles = [...root.querySelectorAll('[data-specialist-profile]')];
    expect(profiles).toHaveLength(STAFF.length);
    expect(slides.every((slide, index) => slide.querySelector('[data-specialist-select]')
      ?.getAttribute('aria-controls') === profiles[index].id)).toBe(true);
    expect(root.querySelector('[data-appointment-open]')).not.toBeNull();
  });
});
