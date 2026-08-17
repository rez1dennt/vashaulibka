import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { initSpecialistsCoverflow } from '../../src/js/components/specialists-coverflow.js';

const names = ['Первый', 'Второй', 'Третий', 'Четвёртый', 'Пятый'];
const fixture = () => `<section data-specialists-coverflow><div data-specialist-viewport tabindex="0"><ol>${names.map((name, index) => `
  <li id="specialist-${index + 1}" data-specialist-slide data-specialist-index="${index}"><article><h3 class="specialist-card__name">${name}</h3><p class="specialist-card__role">Должность ${index + 1}</p><button type="button" data-specialist-select aria-controls="specialist-profile-${index + 1}">Выбрать</button></article></li>`).join('')}</ol></div>
  <button type="button" data-specialist-prev>Назад</button><button type="button" data-specialist-next>Вперёд</button>
  <div class="specialist-profiles">${names.map((name, index) => `<article id="specialist-profile-${index + 1}" data-specialist-profile><h3>${name}</h3><p>Профиль ${index + 1}</p></article>`).join('')}</div></section>`;

beforeEach(() => {
  document.body.innerHTML = fixture();
});

const root = () => document.querySelector('[data-specialists-coverflow]');
const activeIndex = () => Number(root().querySelector('[aria-current="true"]').dataset.specialistIndex);

describe('specialists coverflow', () => {
  it('establishes the initial positions and synchronized detail', () => {
    initSpecialistsCoverflow();

    expect(root().classList.contains('is-enhanced')).toBe(true);
    expect([...root().querySelectorAll('[data-specialist-slide]')].map((slide) => slide.dataset.position))
      .toEqual(['active', 'next', 'far-next', 'far-previous', 'previous']);
    expect([...root().querySelectorAll('[data-specialist-profile]')].map((profile) => profile.hidden))
      .toEqual([false, true, true, true, true]);
  });

  it('keeps only the active front card exposed and tabbable while arrows remain controls', () => {
    initSpecialistsCoverflow();
    const slides = [...root().querySelectorAll('[data-specialist-slide]')];
    const selects = [...root().querySelectorAll('[data-specialist-select]')];
    const previous = root().querySelector('[data-specialist-prev]');
    const next = root().querySelector('[data-specialist-next]');

    expect(selects.map((button) => button.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    expect(slides.map((slide) => slide.getAttribute('aria-hidden'))).toEqual([null, 'true', 'true', 'true', 'true']);
    expect([...root().querySelectorAll('[data-specialist-profile]')].map((profile) => profile.getAttribute('aria-hidden')))
      .toEqual([null, 'true', 'true', 'true', 'true']);
    expect(previous.tabIndex).toBe(0);
    expect(next.tabIndex).toBe(0);

    next.click();

    expect(selects.map((button) => button.tabIndex)).toEqual([-1, 0, -1, -1, -1]);
    expect(slides.map((slide) => slide.getAttribute('aria-hidden'))).toEqual(['true', null, 'true', 'true', 'true']);
    expect([...root().querySelectorAll('[data-specialist-profile]')].map((profile) => profile.hidden))
      .toEqual([true, false, true, true, true]);
  });

  it('does not carry a visual counter contract in the interaction module', () => {
    expect(readFileSync('src/js/components/specialists-coverflow.js', 'utf8'))
      .not.toContain('[data-specialist-counter]');
  });

  it('wraps in both directions without moving control focus', () => {
    initSpecialistsCoverflow();
    const previous = root().querySelector('[data-specialist-prev]');
    previous.focus();
    previous.click();

    expect(activeIndex()).toBe(4);
    expect(document.activeElement).toBe(previous);
    root().querySelector('[data-specialist-next]').click();
    expect(activeIndex()).toBe(0);
  });

  it('supports Arrow keys, Home, End, and a visible-card selection', () => {
    initSpecialistsCoverflow();
    const viewport = root().querySelector('[data-specialist-viewport]');
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(activeIndex()).toBe(1);
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(activeIndex()).toBe(4);
    viewport.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(activeIndex()).toBe(0);
    root().querySelectorAll('[data-specialist-select]')[4].click();
    expect(activeIndex()).toBe(4);
  });

  it('changes one card after a horizontal pointer swipe', () => {
    initSpecialistsCoverflow();
    const viewport = root().querySelector('[data-specialist-viewport]');
    const start = new Event('pointerdown', { bubbles: true });
    const end = new Event('pointerup', { bubbles: true });
    Object.defineProperty(start, 'clientX', { value: 220 });
    Object.defineProperty(end, 'clientX', { value: 120 });

    viewport.dispatchEvent(start);
    viewport.dispatchEvent(end);

    expect(activeIndex()).toBe(1);
  });

  it('does not let the synthetic click after a swipe restore the original card', () => {
    initSpecialistsCoverflow();
    const viewport = root().querySelector('[data-specialist-viewport]');
    const originalCard = root().querySelectorAll('[data-specialist-select]')[0];
    const start = new Event('pointerdown', { bubbles: true });
    const end = new Event('pointerup', { bubbles: true });
    Object.defineProperty(start, 'clientX', { value: 220 });
    Object.defineProperty(end, 'clientX', { value: 120 });

    originalCard.dispatchEvent(start);
    originalCard.dispatchEvent(end);
    originalCard.click();

    expect(activeIndex()).toBe(1);
  });

  it('activates the specialist named by a safe location fragment', () => {
    window.history.replaceState({}, '', '#specialist-4');

    initSpecialistsCoverflow();

    expect(activeIndex()).toBe(3);
  });
});
