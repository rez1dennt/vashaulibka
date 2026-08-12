import { createFocusTrap } from '../core/focus-trap.js';
import { lockScroll, unlockScroll } from '../core/scroll-lock.js';

export function initAccessibilitySettingsDialog({ root = document } = {}) {
  const dialog = root?.querySelector?.('#accessibility-settings-dialog');
  const opener = root?.querySelector?.('[data-accessibility-advanced-open]');
  const closer = dialog?.querySelector('[data-accessibility-dialog-close]');
  const backdrop = dialog?.querySelector('[data-accessibility-dialog-backdrop]');
  const eventRoot = root?.nodeType === 9 ? root : root?.ownerDocument;
  let openState = false;
  let returnFocus = null;

  const isOpen = () => openState;

  if (!dialog || !opener || !eventRoot) {
    return {
      open() {},
      close() {},
      isOpen,
    };
  }

  const trap = createFocusTrap(dialog);

  const close = ({ restoreFocus = true } = {}) => {
    if (!openState) return;

    openState = false;
    dialog.hidden = true;
    opener.setAttribute('aria-expanded', 'false');
    unlockScroll();
    if (restoreFocus) returnFocus?.focus();
    returnFocus = null;
  };

  const open = () => {
    if (openState) return;

    openState = true;
    returnFocus = opener;
    dialog.hidden = false;
    opener.setAttribute('aria-expanded', 'true');
    lockScroll();
    (closer || dialog.querySelector('button:not([disabled]), a[href], [tabindex]'))?.focus();
  };

  opener.addEventListener('click', open);
  closer?.addEventListener('click', () => close());
  backdrop?.addEventListener('click', () => close());
  dialog.addEventListener('keydown', trap);
  eventRoot.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !openState) return;

    event.stopImmediatePropagation();
    close();
  }, true);

  return { open, close, isOpen };
}
