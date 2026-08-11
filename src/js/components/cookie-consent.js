import { safeStorage } from '../core/storage.js';

export function initCookieConsent({ storage = safeStorage } = {}) {
  const banner = document.querySelector('[data-cookie-banner]');
  if (!banner) return;

  const choice = storage.get('cookie-consent');
  banner.hidden = Boolean(choice);
  const choose = (value) => {
    storage.set('cookie-consent', value);
    banner.hidden = true;
  };

  banner.querySelector('[data-cookie-reject]')?.addEventListener('click', () => choose('rejected'));
  banner.querySelector('[data-cookie-accept]')?.addEventListener('click', () => choose('accepted-essential-only'));
  document.querySelectorAll('[data-cookie-settings]').forEach((button) => {
    button.addEventListener('click', () => {
      banner.hidden = false;
    });
  });
}
