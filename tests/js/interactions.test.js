import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppointmentProvider } from '../../src/js/core/appointment-provider.js';
import { lockScroll, unlockScroll } from '../../src/js/core/scroll-lock.js';
import { safeStorage } from '../../src/js/core/storage.js';
import { initCookieConsent } from '../../src/js/components/cookie-consent.js';
import { initDialog } from '../../src/js/components/dialog.js';
import { initDisclosures } from '../../src/js/components/disclosures.js';
import { initMobileMenu } from '../../src/js/components/mobile-menu.js';
import { initTabs } from '../../src/js/components/tabs.js';
import { initVisionMode } from '../../src/js/components/vision-mode.js';

afterEach(() => {
  unlockScroll();
});

describe('progressive interactions', () => {
  it('opens and closes the appointment dialog without submitting data', () => {
    document.body.innerHTML = '<button data-appointment-open>Запись</button><div id="appointment-dialog" role="dialog" hidden><button data-dialog-close>Закрыть</button></div>';
    const provider = createAppointmentProvider();
    initDialog({ provider });

    document.querySelector('[data-appointment-open]').click();

    expect(document.querySelector('#appointment-dialog').hidden).toBe(false);
    expect(provider.submit).toBeUndefined();
    document.querySelector('[data-dialog-close]').click();
    expect(document.querySelector('#appointment-dialog').hidden).toBe(true);
  });

  it('provides only the phone-based appointment mode', () => {
    const provider = createAppointmentProvider();

    expect(provider.mode).toBe('phone-only');
    expect(provider.open()).toEqual({ mode: 'phone-only' });
    expect(Object.isFrozen(provider)).toBe(true);
  });

  it('stores an explicit rejection and hides the cookie banner', () => {
    document.body.innerHTML = '<div data-cookie-banner><button data-cookie-reject>Нет</button><button data-cookie-accept>Да</button></div>';
    const storage = { get: vi.fn(() => null), set: vi.fn() };
    initCookieConsent({ storage });

    document.querySelector('[data-cookie-reject]').click();

    expect(storage.set).toHaveBeenCalledWith('cookie-consent', 'rejected');
    expect(document.querySelector('[data-cookie-banner]').hidden).toBe(true);
  });

  it('switches service tabs with the expected ARIA state', () => {
    document.body.innerHTML = '<div role="tablist"><button role="tab" aria-selected="true" aria-controls="therapy">Терапия</button><button role="tab" aria-selected="false" aria-controls="orthopedics">Ортопедия</button></div><section id="therapy" role="tabpanel"></section><section id="orthopedics" role="tabpanel" hidden></section>';
    initTabs();

    document.querySelectorAll('[role="tab"]')[1].click();

    expect(document.querySelector('#therapy').hidden).toBe(true);
    expect(document.querySelector('#orthopedics').hidden).toBe(false);
    expect(document.querySelectorAll('[role="tab"]')[1].getAttribute('aria-selected')).toBe('true');
  });

  it('toggles a disclosure and its controlled panel', () => {
    document.body.innerHTML = '<button data-disclosure-button aria-expanded="false" aria-controls="details">Подробнее</button><section id="details" hidden>Сведения</section>';
    initDisclosures();

    document.querySelector('[data-disclosure-button]').click();

    expect(document.querySelector('[data-disclosure-button]').getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('#details').hidden).toBe(false);
  });

  it('persists the vision-mode setting and reflects it in ARIA', () => {
    document.body.innerHTML = '<button data-vision-toggle>Версия для слабовидящих</button>';
    initVisionMode();

    document.querySelector('[data-vision-toggle]').click();

    expect(document.documentElement.classList.contains('vision-mode')).toBe(true);
    expect(document.querySelector('[data-vision-toggle]').getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('vision-mode')).toBe('on');
  });

  it('degrades safely when local storage throws', () => {
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } },
    });

    expect(safeStorage.get('setting')).toBeNull();
    expect(safeStorage.set('setting', 'value')).toBe(false);

    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original });
  });

  it('compensates scrollbar width while locking the page', () => {
    Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: 1000 });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1016 });

    lockScroll();

    expect(document.body.style.paddingRight).toBe('16px');
    unlockScroll();
    expect(document.body.style.paddingRight).toBe('');
  });

  it('does not unlock an open dialog when a closed mobile menu link closes', () => {
    document.body.innerHTML = '<button class="menu-toggle" aria-expanded="false" aria-controls="main-menu">Меню</button><nav id="main-menu"><a href="#page">Страница</a></nav><button data-appointment-open>Запись</button><div id="appointment-dialog" role="dialog" hidden><button data-dialog-close>Закрыть</button></div>';
    initMobileMenu();
    initDialog({ provider: createAppointmentProvider() });
    const opener = document.querySelector('[data-appointment-open]');
    opener.focus();
    opener.click();

    document.querySelector('#main-menu a').click();

    expect(document.body.classList.contains('is-locked')).toBe(true);
    expect(document.querySelector('#appointment-dialog').hidden).toBe(false);
  });

  it('wraps keyboard focus inside an open appointment dialog', () => {
    document.body.innerHTML = '<button data-appointment-open>Запись</button><div id="appointment-dialog" role="dialog" hidden><button data-dialog-close>Закрыть</button><a href="tel:+74722215356">Позвонить</a></div>';
    initDialog({ provider: createAppointmentProvider() });
    document.querySelector('[data-appointment-open]').click();
    const last = document.querySelector('#appointment-dialog a');
    last.focus();

    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));

    expect(document.activeElement).toBe(document.querySelector('[data-dialog-close]'));
  });
});
