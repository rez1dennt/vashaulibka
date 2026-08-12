import { describe, expect, it, vi } from 'vitest';
import {
  COOKIE_PREFERENCES_CHANGED_EVENT,
  COOKIE_PREFERENCES_KEY,
  readCookiePreferences,
} from '../../src/js/core/cookie-preferences.js';
import { initCookieConsent } from '../../src/js/components/cookie-consent.js';

const markup = `
  <div data-cookie-banner hidden>
    <input type="checkbox" data-cookie-online-booking>
    <button type="button" data-cookie-reject>Отклонить необязательные</button>
    <button type="button" data-cookie-save>Сохранить выбор</button>
  </div>
  <button type="button" data-cookie-settings>Настройки cookies</button>
`;

const storageWith = (value = null) => ({
  get: vi.fn(() => value),
  set: vi.fn(() => true),
});

describe('online booking cookie preferences', () => {
  it('fails closed for absent, legacy, and malformed values', () => {
    expect(readCookiePreferences({ get: () => null })).toEqual({ decided: false, onlineBooking: false });
    expect(readCookiePreferences({ get: () => 'accepted-essential-only' })).toEqual({ decided: false, onlineBooking: false });
    expect(readCookiePreferences({ get: () => '{broken' })).toEqual({ decided: false, onlineBooking: false });
  });

  it('stores a versioned rejection and emits only the functional preference', () => {
    document.body.innerHTML = markup;
    const storage = storageWith();
    const changed = vi.fn();
    document.addEventListener(COOKIE_PREFERENCES_CHANGED_EVENT, changed);
    initCookieConsent({ storage });

    document.querySelector('[data-cookie-reject]').click();

    expect(JSON.parse(storage.set.mock.calls[0][1])).toEqual({ version: 2, onlineBooking: false });
    expect(storage.set.mock.calls[0][0]).toBe(COOKIE_PREFERENCES_KEY);
    expect(changed.mock.calls[0][0].detail).toEqual({ onlineBooking: false });
    expect(document.querySelector('[data-cookie-banner]').hidden).toBe(true);
  });

  it('stores selected online booking consent', () => {
    document.body.innerHTML = markup;
    const storage = storageWith();
    initCookieConsent({ storage });
    document.querySelector('[data-cookie-online-booking]').checked = true;

    document.querySelector('[data-cookie-save]').click();

    expect(JSON.parse(storage.set.mock.calls[0][1])).toEqual({ version: 2, onlineBooking: true });
  });

  it('reopens settings with the stored choice reflected', () => {
    document.body.innerHTML = markup;
    const storage = storageWith(JSON.stringify({ version: 2, onlineBooking: true }));
    initCookieConsent({ storage });

    expect(document.querySelector('[data-cookie-banner]').hidden).toBe(true);
    document.querySelector('[data-cookie-online-booking]').checked = false;
    document.querySelector('[data-cookie-settings]').click();

    expect(document.querySelector('[data-cookie-banner]').hidden).toBe(false);
    expect(document.querySelector('[data-cookie-online-booking]').checked).toBe(true);
  });
});
