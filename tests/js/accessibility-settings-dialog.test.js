import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initAccessibilitySettingsDialog } from '../../src/js/components/accessibility-settings-dialog.js';
import { lockScroll, unlockScroll } from '../../src/js/core/scroll-lock.js';
import { renderHeader } from '../../src/templates/site-chrome.js';

function setup() {
  document.body.innerHTML = renderHeader('index.html');
  const controller = initAccessibilitySettingsDialog();
  return {
    backdrop: document.querySelector('[data-accessibility-dialog-backdrop]'),
    close: document.querySelector('[data-accessibility-dialog-close]'),
    controller,
    dialog: document.querySelector('#accessibility-settings-dialog'),
    opener: document.querySelector('[data-accessibility-advanced-open]'),
    reset: document.querySelector('[data-accessibility-reset]'),
  };
}

describe('accessibility settings dialog', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.className = '';
    document.body.style.paddingRight = '';
  });

  afterEach(() => {
    for (let index = 0; index < 4; index += 1) unlockScroll();
  });

  it('opens from the gear, locks scrolling, and closes back to the gear', () => {
    const { close, controller, dialog, opener } = setup();

    opener.click();

    expect(controller.isOpen()).toBe(true);
    expect(dialog.hidden).toBe(false);
    expect(opener.getAttribute('aria-expanded')).toBe('true');
    expect(document.body.classList.contains('is-locked')).toBe(true);
    expect(document.activeElement).toBe(close);

    close.click();

    expect(controller.isOpen()).toBe(false);
    expect(dialog.hidden).toBe(true);
    expect(opener.getAttribute('aria-expanded')).toBe('false');
    expect(document.body.classList.contains('is-locked')).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it.each([
    ['backdrop', ({ backdrop }) => backdrop.click()],
    ['Escape', () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))],
  ])('closes with %s without closing a background layer', (_, closeDialog) => {
    const controls = setup();
    const backgroundEscape = vi.fn();
    document.addEventListener('keydown', backgroundEscape);
    controls.opener.click();

    closeDialog(controls);

    expect(controls.dialog.hidden).toBe(true);
    expect(controls.opener.getAttribute('aria-expanded')).toBe('false');
    if (_ === 'Escape') expect(backgroundEscape).not.toHaveBeenCalled();
    document.removeEventListener('keydown', backgroundEscape);
  });

  it('wraps focus in both directions while open', () => {
    const { close, opener, reset } = setup();
    opener.click();

    close.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    }));
    expect(document.activeElement).toBe(reset);

    reset.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    }));
    expect(document.activeElement).toBe(close);
  });

  it('owns exactly one ref-counted scroll lock and preserves a background lock', () => {
    const { controller, opener } = setup();
    lockScroll();

    opener.click();
    controller.open();
    controller.close();

    expect(document.body.classList.contains('is-locked')).toBe(true);

    controller.close();
    unlockScroll();
    expect(document.body.classList.contains('is-locked')).toBe(false);
  });
});
