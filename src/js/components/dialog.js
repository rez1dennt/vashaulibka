import { createFocusTrap } from '../core/focus-trap.js';
import { lockScroll, unlockScroll } from '../core/scroll-lock.js';

export function initDialog({ provider } = {}) {
  const dialog = document.querySelector('#appointment-dialog');
  const openers = [...document.querySelectorAll('[data-appointment-open]')];
  const closer = dialog?.querySelector('[data-dialog-close]');
  if (!dialog || !openers.length || !provider) return;

  let isOpen = false;
  let returnFocus = null;
  const trap = createFocusTrap(dialog);

  const close = () => {
    if (!isOpen) return;

    isOpen = false;
    dialog.hidden = true;
    unlockScroll();
    returnFocus?.focus();
  };

  const open = (event) => {
    if (isOpen) return;

    provider.open?.();
    isOpen = true;
    returnFocus = event.currentTarget;
    dialog.hidden = false;
    lockScroll();
    (closer || dialog.querySelector('a[href], button:not([disabled]), [tabindex]'))?.focus();
  };

  openers.forEach((button) => button.addEventListener('click', open));
  closer?.addEventListener('click', close);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener('keydown', trap);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isOpen) return;

    // The dialog is the topmost overlay, so it consumes Escape before the menu.
    event.stopImmediatePropagation();
    close();
  }, true);
}
