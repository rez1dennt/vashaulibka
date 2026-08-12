import { ONLINE_BOOKING } from '../../data/online-booking.js';

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
    async open() {
      await load();
      if (!isReady()) throw new OnlineBookingError('api');
      widget().openModal();
      return { mode: 'online', state: 'ready' };
    },
    destroy() {
      if (!Array.isArray(widget())) widget()?.destroy?.();
      documentRef.querySelector(`script[src="${ONLINE_BOOKING.scriptUrl}"]`)?.remove();
      state = 'idle';
      loading = null;
    },
  });
}
