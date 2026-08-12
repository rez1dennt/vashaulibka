import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { initSpecialistsCoverflow } from '../../src/js/components/specialists-coverflow.js';

const names = ['Первый', 'Второй', 'Третий', 'Четвёртый', 'Пятый'];
const fixture = () => `<section data-specialists-coverflow><div data-specialist-viewport tabindex="0"><ol>${names.map((name, index) => `
  <li data-specialist-slide data-specialist-index="${index}"><article><h3 class="specialist-card__name">${name}</h3><p class="specialist-card__role">Должность ${index + 1}</p><button type="button" data-specialist-select>Выбрать</button></article></li>`).join('')}</ol></div>
  <button type="button" data-specialist-prev>Назад</button><button type="button" data-specialist-next>Вперёд</button>
  <h3 data-specialist-detail-name></h3><p data-specialist-detail-role></p></section>`;

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
    expect(root().querySelector('[data-specialist-detail-name]').textContent).toBe('Первый');
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
});
