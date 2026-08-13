import { createFocusTrap } from '../core/focus-trap.js';
import { claimModal, isTopModal, releaseModal } from '../core/modal-stack.js';
import { lockScroll, unlockScroll } from '../core/scroll-lock.js';
import { readCookiePreferences } from '../core/cookie-preferences.js';
import { safeStorage } from '../core/storage.js';

export function initDialog({ provider, storage = safeStorage } = {}) {
  const dialog = document.querySelector('#appointment-dialog');
  const openers = [...document.querySelectorAll('[data-appointment-open]')];
  const closer = dialog?.querySelector('[data-dialog-close]');
  const backdrop = dialog?.querySelector('[data-dialog-backdrop]');
  const onlineButton = dialog?.querySelector('[data-booking-online]');
  const consentButton = dialog?.querySelector('[data-booking-consent-open]');
  const status = dialog?.querySelector('[data-booking-status]');
  const error = dialog?.querySelector('[data-booking-error]');
  if (!dialog || !openers.length || !provider) return;

  let isOpen = false;
  let returnFocus = null;
  const trap = createFocusTrap(dialog);

  const close = ({ restoreFocus = true } = {}) => {
    if (!isOpen) return;

    isOpen = false;
    dialog.hidden = true;
    releaseModal(dialog);
    unlockScroll();
    if (restoreFocus) returnFocus?.focus();
  };

  const open = (event) => {
    event.preventDefault();
    if (isOpen) return;

    isOpen = true;
    returnFocus = event.currentTarget;
    dialog.hidden = false;
    claimModal(dialog);
    lockScroll();
    (closer || dialog.querySelector('a[href], button:not([disabled]), [tabindex]'))?.focus();
  };

  const openOnline = async () => {
    if (!readCookiePreferences(storage).onlineBooking) {
      close({ restoreFocus: false });
      consentButton?.click();
      return;
    }

    if (onlineButton) {
      onlineButton.disabled = true;
      onlineButton.setAttribute('aria-busy', 'true');
    }
    if (status) status.textContent = 'Открываем онлайн-запись…';
    if (error) error.hidden = true;

    try {
      await provider.open({ returnFocus });
      if (status) status.textContent = '';
      close({ restoreFocus: false });
      document.querySelector('#modalContainer iframe')?.focus();
    } catch {
      if (status) status.textContent = 'Не удалось открыть онлайн-запись. Попробуйте ещё раз, откройте форму напрямую или позвоните в клинику.';
      if (error) error.hidden = false;
    } finally {
      if (onlineButton) {
        onlineButton.disabled = false;
        onlineButton.removeAttribute('aria-busy');
      }
    }
  };

  openers.forEach((button) => button.addEventListener('click', open));
  closer?.addEventListener('click', close);
  backdrop?.addEventListener('click', close);
  onlineButton?.addEventListener('click', openOnline);
  consentButton?.addEventListener('click', () => close({ restoreFocus: false }));
  dialog.addEventListener('keydown', trap);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isOpen || !isTopModal(dialog)) return;

    // The dialog is the topmost overlay, so it consumes Escape before the menu.
    event.stopImmediatePropagation();
    close();
  }, true);
}
