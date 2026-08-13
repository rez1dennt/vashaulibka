import { ONLINE_BOOKING } from '../../data/online-booking.js';
import { lockScroll, unlockScroll } from './scroll-lock.js';

const WIDGET_NAME = 'BookMis32Top';

export class OnlineBookingError extends Error {
  constructor(code) {
    super(`Online booking failed: ${code}`);
    this.name = 'OnlineBookingError';
    this.code = code;
  }
}

export function createAppointmentProvider({
  windowRef = window,
  documentRef = document,
  timeoutMs = 10000,
} = {}) {
  let state = 'idle';
  let loading = null;
  let returnFocus = null;
  let enhancedModal = null;
  let scrollLocked = false;

  const widget = () => windowRef[WIDGET_NAME];
  const isReady = () => !Array.isArray(widget())
    && widget()?.initialized?.() === true
    && typeof widget()?.openModal === 'function';

  const queueInitialization = () => {
    if (!Array.isArray(widget())) windowRef[WIDGET_NAME] = [];
    const queue = windowRef[WIDGET_NAME];
    if (!queue.some?.((command) => command?.[0] === 'init')) {
      queue.push(['init', {
        widgetId: ONLINE_BOOKING.widgetId,
        buttonType: 'none',
        buttonTitle: 'Запись',
      }]);
    }
  };

  const enhanceModal = () => {
    const modal = documentRef.querySelector('#modalContainer');
    const closeButton = modal?.querySelector(':scope > button');
    if (!modal || !closeButton) return;

    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Онлайн-запись');
    modal.classList.add('mis-booking-modal');
    closeButton.setAttribute('aria-label', 'Закрыть онлайн-запись');
    closeButton.classList.add('mis-booking-modal__close');
    if (enhancedModal === modal) return;

    enhancedModal = modal;
    closeButton.addEventListener('click', () => {
      if (scrollLocked) {
        scrollLocked = false;
        unlockScroll();
      }
      returnFocus?.focus();
    });
  };

  const acquireScrollLock = () => {
    if (scrollLocked || !enhancedModal) return;
    scrollLocked = true;
    lockScroll();
  };

  const releaseScrollLock = () => {
    if (!scrollLocked) return;
    scrollLocked = false;
    unlockScroll();
  };

  const closeOnEscape = (event) => {
    if (event.key !== 'Escape' || !enhancedModal || getComputedStyle(enhancedModal).display === 'none') return;
    enhancedModal.querySelector(':scope > button')?.click();
  };
  documentRef.addEventListener('keydown', closeOnEscape, true);

  const load = () => {
    if (isReady()) {
      state = 'ready';
      return Promise.resolve();
    }
    if (loading) return loading;

    state = 'loading';
    queueInitialization();
    loading = new Promise((resolve, reject) => {
      const script = documentRef.createElement('script');
      script.async = true;
      script.src = ONLINE_BOOKING.scriptUrl;

      let settled = false;
      const finish = (error) => {
        if (settled) return;
        settled = true;
        windowRef.clearTimeout(timer);
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
        loading = null;
        if (error) {
          state = 'error';
          script.remove();
          reject(error);
          return;
        }
        state = 'ready';
        resolve();
      };
      const onLoad = () => finish(isReady() ? null : new OnlineBookingError('api'));
      const onError = () => finish(new OnlineBookingError('load'));
      const timer = windowRef.setTimeout(() => finish(new OnlineBookingError('timeout')), timeoutMs);

      script.addEventListener('load', onLoad);
      script.addEventListener('error', onError);
      documentRef.head.appendChild(script);
    });
    return loading;
  };

  return Object.freeze({
    mode: 'mis-32top',
    getState: () => state,
    async open({ returnFocus: focusTarget } = {}) {
      await load();
      if (!isReady()) throw new OnlineBookingError('api');
      returnFocus = focusTarget || documentRef.activeElement;
      widget().openModal();
      enhanceModal();
      acquireScrollLock();
      documentRef.querySelector('#modalContainer iframe')?.focus();
      return { mode: 'online', state: 'ready' };
    },
    destroy() {
      releaseScrollLock();
      if (!Array.isArray(widget())) widget()?.destroy?.();
      documentRef.querySelector(`script[src="${ONLINE_BOOKING.scriptUrl}"]`)?.remove();
      state = 'idle';
      loading = null;
      documentRef.removeEventListener('keydown', closeOnEscape, true);
      enhancedModal = null;
      returnFocus = null;
    },
  });
}
