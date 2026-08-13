import { afterEach, describe, expect, it, vi } from 'vitest';
import { ONLINE_BOOKING } from '../../src/data/online-booking.js';
import { createAppointmentProvider } from '../../src/js/core/appointment-provider.js';
import { unlockScroll } from '../../src/js/core/scroll-lock.js';

const initializeWidget = (windowRef) => {
  const commands = windowRef.BookMis32Top;
  const widget = {
    destroy: vi.fn(),
    initialized: vi.fn(() => true),
    openModal: vi.fn(),
  };
  windowRef.BookMis32Top = widget;
  return { commands, widget };
};

afterEach(() => {
  unlockScroll();
  delete window.BookMis32Top;
  delete window.BookMis32TopInitCallbacks;
  vi.useRealTimers();
});

describe('MIS 32top appointment provider', () => {
  it('keeps the approved booking configuration frozen and HTTPS-only', () => {
    expect(Object.isFrozen(ONLINE_BOOKING)).toBe(true);
    expect(ONLINE_BOOKING.widgetId).toBe('144e96ac-dbc8-4f44-a6c2-e27f96a783a6');
    for (const key of ['scriptUrl', 'bookingUrl', 'consentUrl', 'privacyUrl']) {
      expect(new URL(ONLINE_BOOKING[key]).protocol).toBe('https:');
    }
  });

  it('loads once, initializes without a floating button, and opens through the public API', async () => {
    const provider = createAppointmentProvider({ windowRef: window, documentRef: document, timeoutMs: 1000 });
    expect(document.querySelector('script[src*="32top"]')).toBeNull();

    const first = provider.open();
    const second = provider.open();
    expect(document.querySelectorAll(`script[src="${ONLINE_BOOKING.scriptUrl}"]`)).toHaveLength(1);
    const { commands, widget } = initializeWidget(window);
    document.querySelector(`script[src="${ONLINE_BOOKING.scriptUrl}"]`).dispatchEvent(new Event('load'));

    await expect(Promise.all([first, second])).resolves.toEqual([
      { mode: 'online', state: 'ready' },
      { mode: 'online', state: 'ready' },
    ]);
    expect(commands).toContainEqual(['init', expect.objectContaining({
      widgetId: ONLINE_BOOKING.widgetId,
      buttonType: 'none',
      buttonTitle: 'Запись',
    })]);
    expect(widget.openModal).toHaveBeenCalledTimes(2);
  });

  it('adds accessible dialog controls to the injected vendor modal and restores focus', async () => {
    document.body.innerHTML = `
      <button id="booking-return">Вернуться к записи</button>
      <div id="modalContainer" style="display: block">
        <button type="button"></button>
        <iframe title="Онлайн-запись"></iframe>
      </div>`;
    const returnFocus = document.querySelector('#booking-return');
    const closeButton = document.querySelector('#modalContainer > button');
    closeButton.addEventListener('click', () => {
      document.querySelector('#modalContainer').style.display = 'none';
    });
    window.BookMis32Top = {
      initialized: () => true,
      openModal: vi.fn(),
    };
    const provider = createAppointmentProvider({ windowRef: window, documentRef: document });

    await provider.open({ returnFocus });

    const modal = document.querySelector('#modalContainer');
    expect(modal.getAttribute('role')).toBe('dialog');
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(modal.getAttribute('aria-label')).toBe('Онлайн-запись');
    expect(closeButton.getAttribute('aria-label')).toBe('Закрыть онлайн-запись');
    expect(closeButton.classList.contains('mis-booking-modal__close')).toBe(true);
    expect(document.body.classList.contains('is-locked')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(modal.style.display).toBe('none');
    expect(document.body.classList.contains('is-locked')).toBe(false);
    expect(document.activeElement).toBe(returnFocus);
  });

  it('releases the vendor modal scroll lock when the close button or destroy is used', async () => {
    document.body.innerHTML = '<div id="modalContainer" style="display: block"><button type="button"></button><iframe title="Онлайн-запись"></iframe></div>';
    const modal = document.querySelector('#modalContainer');
    const closeButton = modal.querySelector(':scope > button');
    closeButton.addEventListener('click', () => { modal.style.display = 'none'; });
    window.BookMis32Top = { initialized: () => true, openModal: vi.fn(), destroy: vi.fn() };
    const provider = createAppointmentProvider({ windowRef: window, documentRef: document });

    await provider.open();
    expect(document.body.classList.contains('is-locked')).toBe(true);
    closeButton.click();
    expect(document.body.classList.contains('is-locked')).toBe(false);

    modal.style.display = 'block';
    await provider.open();
    expect(document.body.classList.contains('is-locked')).toBe(true);
    provider.destroy();
    expect(document.body.classList.contains('is-locked')).toBe(false);
  });

  it('rejects a failed load and can retry with a fresh script', async () => {
    const provider = createAppointmentProvider({ windowRef: window, documentRef: document, timeoutMs: 1000 });
    const failed = provider.open();
    document.querySelector(`script[src="${ONLINE_BOOKING.scriptUrl}"]`).dispatchEvent(new Event('error'));

    await expect(failed).rejects.toMatchObject({ code: 'load' });
    expect(provider.getState()).toBe('error');
    expect(document.querySelector(`script[src="${ONLINE_BOOKING.scriptUrl}"]`)).toBeNull();

    const retry = provider.open();
    expect(document.querySelectorAll(`script[src="${ONLINE_BOOKING.scriptUrl}"]`)).toHaveLength(1);
    initializeWidget(window);
    document.querySelector(`script[src="${ONLINE_BOOKING.scriptUrl}"]`).dispatchEvent(new Event('load'));
    await expect(retry).resolves.toEqual({ mode: 'online', state: 'ready' });
  });

  it('times out cleanly and forwards destroy to an initialized widget', async () => {
    vi.useFakeTimers();
    const provider = createAppointmentProvider({ windowRef: window, documentRef: document, timeoutMs: 50 });
    const pending = provider.open();
    const timedOut = expect(pending).rejects.toMatchObject({ code: 'timeout' });
    await vi.advanceTimersByTimeAsync(51);
    await timedOut;
    vi.useRealTimers();

    const next = provider.open();
    const { widget } = initializeWidget(window);
    document.querySelector(`script[src="${ONLINE_BOOKING.scriptUrl}"]`).dispatchEvent(new Event('load'));
    await next;
    provider.destroy();
    expect(widget.destroy).toHaveBeenCalledTimes(1);
  });
});
