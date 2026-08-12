import { safeStorage } from '../core/storage.js';
import {
  COOKIE_PREFERENCES_CHANGED_EVENT,
  readCookiePreferences,
  writeCookiePreferences,
} from '../core/cookie-preferences.js';

export function initCookieConsent({ storage = safeStorage } = {}) {
  const banner = document.querySelector('[data-cookie-banner]');
  if (!banner) return;

  const onlineBooking = banner.querySelector('[data-cookie-online-booking]');
  const reflect = () => {
    const preferences = readCookiePreferences(storage);
    if (onlineBooking) onlineBooking.checked = preferences.onlineBooking;
    banner.hidden = preferences.decided;
  };
  const choose = (enabled) => {
    const preferences = writeCookiePreferences(storage, { onlineBooking: enabled });
    banner.hidden = true;
    document.dispatchEvent(new CustomEvent(COOKIE_PREFERENCES_CHANGED_EVENT, {
      detail: { onlineBooking: preferences.onlineBooking },
    }));
  };

  reflect();
  banner.querySelector('[data-cookie-reject]')?.addEventListener('click', () => choose(false));
  banner.querySelector('[data-cookie-save]')?.addEventListener('click', () => choose(onlineBooking?.checked));
  document.querySelectorAll('[data-cookie-settings]').forEach((button) => {
    button.addEventListener('click', () => {
      const preferences = readCookiePreferences(storage);
      if (onlineBooking) onlineBooking.checked = preferences.onlineBooking;
      banner.hidden = false;
    });
  });
}
