import { afterEach, describe, expect, it, vi } from 'vitest';
import { ONLINE_BOOKING } from '../../src/data/online-booking.js';
import { createAppointmentProvider } from '../../src/js/core/appointment-provider.js';

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
