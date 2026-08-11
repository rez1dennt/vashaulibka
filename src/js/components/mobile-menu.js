import { createFocusTrap } from '../core/focus-trap.js';
import { lockScroll, unlockScroll } from '../core/scroll-lock.js';

export function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#main-menu');
  if (!toggle || !menu) return;

  let isOpen = toggle.getAttribute('aria-expanded') === 'true';
  const trap = createFocusTrap(menu);

  const close = () => {
    if (!isOpen) return;

    isOpen = false;
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    unlockScroll();
    toggle.focus();
  };

  const open = () => {
    if (isOpen) return;

    isOpen = true;
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    lockScroll();
    menu.querySelector('a[href], button:not([disabled])')?.focus();
  };

  toggle.addEventListener('click', () => (isOpen ? close() : open()));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
  menu.addEventListener('keydown', trap);
  menu.querySelectorAll('a[href]').forEach((link) => link.addEventListener('click', close));
}
