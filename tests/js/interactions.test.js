import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppointmentProvider } from '../../src/js/core/appointment-provider.js';
import { lockScroll, unlockScroll } from '../../src/js/core/scroll-lock.js';
import { safeStorage } from '../../src/js/core/storage.js';
import { initCookieConsent } from '../../src/js/components/cookie-consent.js';
import { initDialog } from '../../src/js/components/dialog.js';
import { initDisclosures } from '../../src/js/components/disclosures.js';
import { initMobileMenu } from '../../src/js/components/mobile-menu.js';
import { initTabs } from '../../src/js/components/tabs.js';

afterEach(() => {
  unlockScroll();
});

describe('progressive interactions', () => {
  it('activates matching service tab and disclosure from a safe search fragment', () => {
    window.history.replaceState({}, '', '#service-therapy');
    document.body.innerHTML = '<div role="tablist"><button role="tab" id="services-tab-therapy" aria-selected="false" aria-controls="services-panel-therapy">Терапия</button><button role="tab" id="services-tab-other" aria-selected="true" aria-controls="services-panel-other">Другое</button></div><section id="services-panel-therapy"></section><section id="services-panel-other"></section><button data-disclosure-button id="services-disclosure-therapy" aria-controls="services-disclosure-panel-therapy">Терапия</button><div id="services-disclosure-panel-therapy"></div>';

    initTabs();
    initDisclosures();

    expect(document.querySelector('#services-tab-therapy').getAttribute('aria-selected')).toBe('true');
    expect(document.querySelector('#services-panel-therapy').hidden).toBe(false);
    expect(document.querySelector('#services-disclosure-therapy').getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('#services-disclosure-panel-therapy').hidden).toBe(false);
  });

  it('opens and closes the appointment dialog without submitting data', () => {
    document.body.innerHTML = '<button data-appointment-open>Запись</button><div id="appointment-dialog" role="dialog" hidden><div data-dialog-backdrop></div><button data-dialog-close>Закрыть</button></div>';
    const provider = createAppointmentProvider();
    initDialog({ provider });

    document.querySelector('[data-appointment-open]').click();

    expect(document.querySelector('#appointment-dialog').hidden).toBe(false);
    expect(provider.submit).toBeUndefined();
    document.querySelector('[data-dialog-close]').click();
    expect(document.querySelector('#appointment-dialog').hidden).toBe(true);
  });

  it('opens MIS booking only with consent and exposes recoverable loading errors', async () => {
    document.body.innerHTML = `
      <button data-appointment-open>Запись</button>
      <div id="appointment-dialog" role="dialog" hidden>
        <div data-dialog-backdrop></div><button data-dialog-close>Закрыть</button>
        <button data-booking-online>Записаться онлайн</button>
        <button data-booking-consent-open>Настроить онлайн-запись</button>
        <p data-booking-status></p><div data-booking-error hidden><a href="https://book-app.32top.ru/test">Открыть напрямую</a></div>
      </div>
      <div data-cookie-banner hidden><input data-cookie-online-booking><button data-cookie-reject>Нет</button><button data-cookie-save>Сохранить</button></div>
      <button data-cookie-settings>Настройки cookies</button>`;
    const provider = { open: vi.fn(() => Promise.reject(new Error('blocked'))) };
    const storage = { get: vi.fn(() => null), set: vi.fn() };
    initCookieConsent({ storage });
    initDialog({ provider, storage });

    document.querySelector('[data-appointment-open]').click();
    document.querySelector('[data-booking-online]').click();
    expect(provider.open).not.toHaveBeenCalled();
    expect(document.querySelector('#appointment-dialog').hidden).toBe(true);
    expect(document.querySelector('[data-cookie-banner]').hidden).toBe(false);

    storage.get.mockReturnValue(JSON.stringify({ version: 2, onlineBooking: true }));
    document.querySelector('[data-booking-online]').click();
    expect(document.querySelector('[data-booking-online]').disabled).toBe(true);
    await vi.waitFor(() => expect(document.querySelector('[data-booking-error]').hidden).toBe(false));
    expect(document.querySelector('[data-booking-status]').textContent).toMatch(/не удалось/i);
    expect(document.querySelector('[data-booking-online]').disabled).toBe(false);
    document.querySelector('[data-dialog-close]').click();
  });

  it('closes the clinic dialog after the MIS modal opens successfully', async () => {
    document.body.innerHTML = '<button data-appointment-open>Запись</button><div id="appointment-dialog" role="dialog" hidden><button data-dialog-close>Закрыть</button><button data-booking-online>Записаться онлайн</button><p data-booking-status></p><div data-booking-error hidden></div></div>';
    const provider = { open: vi.fn(() => Promise.resolve({ mode: 'online', state: 'ready' })) };
    initDialog({ provider, storage: { get: () => JSON.stringify({ version: 2, onlineBooking: true }) } });
    document.querySelector('[data-appointment-open]').click();

    document.querySelector('[data-booking-online]').click();
    await vi.waitFor(() => expect(document.querySelector('#appointment-dialog').hidden).toBe(true));
    expect(provider.open).toHaveBeenCalledTimes(1);
  });

  it('closes the appointment dialog from its real backdrop and returns focus', () => {
    document.body.innerHTML = '<button data-appointment-open>Запись</button><div id="appointment-dialog" role="dialog" hidden><div data-dialog-backdrop></div><button data-dialog-close>Закрыть</button></div>';
    initDialog({ provider: createAppointmentProvider() });
    const opener = document.querySelector('[data-appointment-open]');
    opener.click();

    document.querySelector('[data-dialog-backdrop]').click();

    expect(document.querySelector('#appointment-dialog').hidden).toBe(true);
    expect(document.activeElement).toBe(opener);
  });

  it('intercepts the mobile telephone fallback only after dialog enhancement', () => {
    document.body.innerHTML = '<a href="tel:+74722215356" data-appointment-open>Запись</a><div id="appointment-dialog" role="dialog" hidden><button data-dialog-close>Закрыть</button></div>';
    initDialog({ provider: createAppointmentProvider() });
    const opener = document.querySelector('[data-appointment-open]');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    opener.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.querySelector('#appointment-dialog').hidden).toBe(false);
    document.querySelector('[data-dialog-close]').click();
  });

  it('opens and closes the mobile menu with the same toggle', () => {
    document.body.innerHTML = '<button class="menu-toggle" aria-expanded="false" aria-controls="main-menu"><span class="menu-toggle__icon" aria-hidden="true"></span><span data-menu-toggle-label>Открыть меню</span></button><div data-menu-backdrop></div><nav id="main-menu"><a href="#page">Страница</a></nav>';
    initMobileMenu();
    const toggle = document.querySelector('.menu-toggle');
    const label = document.querySelector('[data-menu-toggle-label]');

    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(label.textContent).toBe('Закрыть меню');
    expect(document.activeElement).toBe(document.querySelector('#main-menu a'));

    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(label.textContent).toBe('Открыть меню');
    expect(document.activeElement).toBe(toggle);

    toggle.click();
    document.querySelector('[data-menu-backdrop]').click();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
  });

  it('provides the MIS appointment mode without a form-submission API', () => {
    const provider = createAppointmentProvider();

    expect(provider.mode).toBe('mis-32top');
    expect(provider.submit).toBeUndefined();
    expect(provider.open).toEqual(expect.any(Function));
    expect(Object.isFrozen(provider)).toBe(true);
  });

  it('stores an explicit rejection and hides the cookie banner', () => {
    document.body.innerHTML = '<div data-cookie-banner><input type="checkbox" data-cookie-online-booking><button data-cookie-reject>Нет</button><button data-cookie-save>Да</button></div>';
    const storage = { get: vi.fn(() => null), set: vi.fn() };
    initCookieConsent({ storage });

    document.querySelector('[data-cookie-reject]').click();

    expect(JSON.parse(storage.set.mock.calls[0][1])).toEqual({ version: 2, onlineBooking: false });
    expect(document.querySelector('[data-cookie-banner]').hidden).toBe(true);
  });

  it('shows the cookie banner for an unrecognized stored value', () => {
    document.body.innerHTML = '<div data-cookie-banner hidden><input type="checkbox" data-cookie-online-booking><button data-cookie-reject>Нет</button><button data-cookie-save>Да</button></div>';
    initCookieConsent({ storage: { get: () => 'legacy-accepted', set: vi.fn() } });

    expect(document.querySelector('[data-cookie-banner]').hidden).toBe(false);
  });

  it('switches service tabs with the expected ARIA state', () => {
    document.body.innerHTML = '<div role="tablist"><button role="tab" aria-selected="true" aria-controls="therapy">Терапия</button><button role="tab" aria-selected="false" aria-controls="orthopedics">Ортопедия</button></div><section id="therapy" role="tabpanel"></section><section id="orthopedics" role="tabpanel" hidden></section>';
    initTabs();

    document.querySelectorAll('[role="tab"]')[1].click();

    expect(document.querySelector('#therapy').hidden).toBe(true);
    expect(document.querySelector('#orthopedics').hidden).toBe(false);
    expect(document.querySelectorAll('[role="tab"]')[1].getAttribute('aria-selected')).toBe('true');
  });

  it('establishes the collapsed tab state when enhancing raw visible panels', () => {
    document.body.innerHTML = '<div role="tablist"><button role="tab" aria-selected="true" aria-controls="therapy">Терапия</button><button role="tab" aria-selected="false" aria-controls="orthopedics">Ортопедия</button></div><section id="therapy" role="tabpanel"></section><section id="orthopedics" role="tabpanel"></section>';

    initTabs();

    expect(document.querySelector('#therapy').hidden).toBe(false);
    expect(document.querySelector('#orthopedics').hidden).toBe(true);
    expect(document.querySelectorAll('[role="tab"]')[0].tabIndex).toBe(0);
    expect(document.querySelectorAll('[role="tab"]')[1].tabIndex).toBe(-1);
  });

  it('toggles a disclosure and its controlled panel', () => {
    document.body.innerHTML = '<button data-disclosure-button aria-expanded="true" aria-controls="details">Подробнее</button><section id="details">Сведения</section>';
    initDisclosures();

    document.querySelector('[data-disclosure-button]').click();

    expect(document.querySelector('[data-disclosure-button]').getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('#details').hidden).toBe(true);
  });

  it('establishes one expanded disclosure when enhancing raw visible panels', () => {
    document.body.innerHTML = '<button data-disclosure-button aria-expanded="true" aria-controls="first">Первое</button><section id="first"></section><button data-disclosure-button aria-expanded="true" aria-controls="second">Второе</button><section id="second"></section>';

    initDisclosures();

    expect(document.querySelector('#first').hidden).toBe(false);
    expect(document.querySelector('#second').hidden).toBe(true);
    expect(document.querySelectorAll('[data-disclosure-button]')[1].getAttribute('aria-expanded')).toBe('false');
  });

  it('degrades safely when local storage throws', () => {
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => { throw new Error('blocked'); },
        setItem: () => { throw new Error('blocked'); },
        removeItem: () => { throw new Error('blocked'); },
      },
    });

    expect(safeStorage.get('setting')).toBeNull();
    expect(safeStorage.set('setting', 'value')).toBe(false);
    expect(safeStorage.remove('setting')).toBe(false);

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
    document.querySelector('[data-dialog-close]').click();
  });

  it('closes the topmost dialog before the mobile menu on Escape', () => {
    document.body.innerHTML = '<button class="menu-toggle" aria-expanded="false" aria-controls="main-menu">Меню</button><nav id="main-menu"><button data-appointment-open>Запись</button></nav><div id="appointment-dialog" role="dialog" hidden><button data-dialog-close>Закрыть</button></div>';
    initMobileMenu();
    initDialog({ provider: createAppointmentProvider() });
    const toggle = document.querySelector('.menu-toggle');
    const opener = document.querySelector('[data-appointment-open]');
    toggle.click();
    opener.click();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(document.querySelector('#appointment-dialog').hidden).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(document.body.classList.contains('is-locked')).toBe(true);
    expect(document.activeElement).toBe(opener);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.body.classList.contains('is-locked')).toBe(false);
    expect(document.activeElement).toBe(toggle);
  });

  it('keeps the production menu open behind its telephone appointment dialog', () => {
    document.body.innerHTML = '<button class="menu-toggle" aria-expanded="false" aria-controls="main-menu"><span class="menu-toggle__icon" aria-hidden="true"></span><span data-menu-toggle-label>Открыть меню</span></button><div data-menu-backdrop></div><nav id="main-menu"><a href="index.html">Главная</a><a href="tel:+74722215356" data-appointment-open>Запись на приём</a></nav><div id="appointment-dialog" role="dialog" hidden><div data-dialog-backdrop></div><button data-dialog-close>Закрыть диалог</button><a href="tel:+74722215356">Позвонить</a></div>';
    initMobileMenu();
    initDialog({ provider: createAppointmentProvider() });
    const toggle = document.querySelector('.menu-toggle');
    const opener = document.querySelector('[data-appointment-open]');
    const dialog = document.querySelector('#appointment-dialog');

    toggle.click();
    const firstClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    opener.dispatchEvent(firstClick);

    expect(firstClick.defaultPrevented).toBe(true);
    expect(dialog.hidden).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(document.body.classList.contains('is-locked')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(dialog.hidden).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(document.body.classList.contains('is-locked')).toBe(true);
    expect(document.activeElement).toBe(opener);

    opener.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    document.querySelector('[data-dialog-backdrop]').click();

    expect(dialog.hidden).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(document.body.classList.contains('is-locked')).toBe(true);
    expect(document.activeElement).toBe(opener);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.body.classList.contains('is-locked')).toBe(false);
    expect(document.activeElement).toBe(toggle);
  });

  it('wraps keyboard focus inside an open appointment dialog', () => {
    document.body.innerHTML = '<button data-appointment-open>Запись</button><div id="appointment-dialog" role="dialog" hidden><button data-dialog-close>Закрыть</button><a href="tel:+74722215356">Позвонить</a></div>';
    initDialog({ provider: createAppointmentProvider() });
    document.querySelector('[data-appointment-open]').click();
    const last = document.querySelector('#appointment-dialog a');
    last.focus();

    last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));

    expect(document.activeElement).toBe(document.querySelector('[data-dialog-close]'));
    document.querySelector('[data-dialog-close]').click();
  });
});
