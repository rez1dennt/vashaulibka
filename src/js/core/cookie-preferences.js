export const COOKIE_PREFERENCES_KEY = 'cookie-consent';
export const COOKIE_PREFERENCES_VERSION = 2;
export const COOKIE_PREFERENCES_CHANGED_EVENT = 'cookie-preferences-changed';

const undecided = Object.freeze({ decided: false, onlineBooking: false });

export function readCookiePreferences(storage) {
  try {
    const parsed = JSON.parse(storage.get(COOKIE_PREFERENCES_KEY));
    if (parsed?.version !== COOKIE_PREFERENCES_VERSION || typeof parsed.onlineBooking !== 'boolean') {
      return undecided;
    }
    return { decided: true, onlineBooking: parsed.onlineBooking };
  } catch {
    return undecided;
  }
}

export function writeCookiePreferences(storage, { onlineBooking }) {
  const value = { version: COOKIE_PREFERENCES_VERSION, onlineBooking: onlineBooking === true };
  storage.set(COOKIE_PREFERENCES_KEY, JSON.stringify(value));
  return value;
}
