import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAccessibilitySpeechController } from '../../src/js/components/accessibility-speech.js';

const LOCAL_RUSSIAN_VOICE = Object.freeze({
  lang: 'ru-RU',
  localService: true,
  name: 'Local Russian',
});

class FakeUtterance {
  constructor(text) {
    this.text = text;
  }
}

function createSynth(voices = []) {
  const listeners = new Map();
  let availableVoices = voices;

  return {
    cancel: vi.fn(),
    getVoices: vi.fn(() => availableVoices),
    pause: vi.fn(),
    resume: vi.fn(),
    speak: vi.fn(),
    addEventListener: vi.fn((type, listener) => listeners.set(type, listener)),
    removeEventListener: vi.fn((type, listener) => {
      if (listeners.get(type) === listener) listeners.delete(type);
    }),
    emit(type) {
      listeners.get(type)?.();
    },
    setVoices(nextVoices) {
      availableVoices = nextVoices;
    },
  };
}

function renderFixture(main = '<h1>Заголовок</h1>') {
  document.body.innerHTML = `
    <section data-accessibility-panel>
      <button type="button" data-speech-read disabled>Читать страницу</button>
      <button type="button" data-speech-pause disabled>Пауза/Продолжить</button>
      <button type="button" data-speech-stop disabled>Остановить</button>
      <p data-accessibility-status role="status" aria-live="polite"></p>
    </section>
    <main>${main}</main>
  `;

  return {
    pause: document.querySelector('[data-speech-pause]'),
    read: document.querySelector('[data-speech-read]'),
    status: document.querySelector('[data-accessibility-status]'),
    stop: document.querySelector('[data-speech-stop]'),
  };
}

const controllers = [];

function setup({ synth = createSynth([LOCAL_RUSSIAN_VOICE]), Utterance = FakeUtterance } = {}) {
  const controls = renderFixture();
  const controller = createAccessibilitySpeechController({ synth, Utterance, root: document });
  controllers.push(controller);
  controller.init();
  return { controller, controls, synth };
}

describe('browser-local Russian speech controller', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    for (const controller of controllers.splice(0)) controller.destroy();
    vi.restoreAllMocks();
  });

  it('keeps controls disabled and announces when Web Speech is absent', () => {
    const { controller, controls } = setup({ synth: null, Utterance: null });

    controller.setEnabled(true);

    expect(controls.read.disabled).toBe(true);
    expect(controls.pause.disabled).toBe(true);
    expect(controls.stop.disabled).toBe(true);
    expect(controls.status.textContent).toBe('Локальный русский голос недоступен в этом браузере');
  });

  it('fails closed when voices include remote Russian and local non-Russian options only', () => {
    const synth = createSynth([
      { lang: 'ru-RU', localService: false, name: 'Remote Russian' },
      { lang: 'en-US', localService: true, name: 'Local English' },
    ]);
    const { controller, controls } = setup({ synth });

    controller.setEnabled(true);

    expect(controls.read.disabled).toBe(true);
    expect(controls.status.textContent).toBe('Локальный русский голос недоступен в этом браузере');
    expect(synth.speak).not.toHaveBeenCalled();
  });

  it('enables reading after voiceschanged supplies a qualifying voice', () => {
    const synth = createSynth([]);
    const { controller, controls } = setup({ synth });
    controller.setEnabled(true);

    synth.setVoices([LOCAL_RUSSIAN_VOICE]);
    synth.emit('voiceschanged');

    expect(controls.read.disabled).toBe(false);
    expect(controls.status.textContent).toBe('Локальный русский голос доступен');
  });

  it('reads ordered leaf blocks from main and excludes hidden, decorative, and interface content', () => {
    const controls = renderFixture(`
      <h1> Заголовок </h1>
      <p>Первый <span hidden>скрытый фрагмент</span> абзац</p>
      <ul><li>Пункт списка</li><li><p>Вложенный абзац</p></li></ul>
      <dl><dt>Термин</dt><dd>Определение</dd></dl>
      <table><thead><tr><th>Колонка</th></tr></thead><tbody><tr><td>Значение</td></tr></tbody></table>
      <p hidden>Скрыто атрибутом</p>
      <div aria-hidden="true"><p>Скрыто ARIA</p></div>
      <p class="sr-only">Скрыто визуально</p>
      <nav><p>Навигационный шум</p></nav>
      <div role="toolbar"><p>Панельный шум</p></div>
      <div data-cookie-consent><p>Cookie шум</p></div>
      <div role="presentation"><p>Декоративный шум</p></div>
      <p style="display: none">Скрыто стилем</p>
      <script>Сценарий</script><style>Стили</style>
    `);
    const synth = createSynth([LOCAL_RUSSIAN_VOICE]);
    const controller = createAccessibilitySpeechController({ synth, Utterance: FakeUtterance, root: document });
    controllers.push(controller);
    controller.init();
    controller.setEnabled(true);

    controls.read.click();

    expect(synth.speak).toHaveBeenCalledTimes(1);
    const utterance = synth.speak.mock.calls[0][0];
    expect(utterance.text).toBe(
      'Заголовок. Первый абзац. Пункт списка. Вложенный абзац. Термин. Определение. Колонка. Значение.',
    );
    expect(utterance.lang).toBe('ru-RU');
    expect(utterance.voice).toBe(LOCAL_RUSSIAN_VOICE);
    expect(controls.status.textContent).toBe('Начато озвучивание страницы');
  });

  it('splits long content into bounded chunks and queues every chunk in order', () => {
    const longText = Array.from({ length: 120 }, (_, index) => `слово${index}`).join(' ');
    const controls = renderFixture(`<p>${longText}</p>`);
    const synth = createSynth([LOCAL_RUSSIAN_VOICE]);
    const controller = createAccessibilitySpeechController({ synth, Utterance: FakeUtterance, root: document });
    controllers.push(controller);
    controller.init();
    controller.setEnabled(true);

    controls.read.click();

    const texts = synth.speak.mock.calls.map(([utterance]) => utterance.text);
    expect(texts.length).toBeGreaterThan(1);
    expect(texts.every((text) => text.length <= 240)).toBe(true);
    expect(texts.join(' ').replace(/\.$/, '')).toBe(longText);
  });

  it('exposes pause and resume state, then announces completion', () => {
    const { controller, controls, synth } = setup();
    controller.setEnabled(true);
    controls.read.click();

    controls.pause.click();

    expect(synth.pause).toHaveBeenCalledTimes(1);
    expect(controls.pause.textContent).toBe('Продолжить');
    expect(controls.pause.getAttribute('aria-pressed')).toBe('true');
    expect(controls.status.textContent).toBe('Озвучивание приостановлено');

    controls.pause.click();

    expect(synth.resume).toHaveBeenCalledTimes(1);
    expect(controls.pause.textContent).toBe('Пауза');
    expect(controls.pause.getAttribute('aria-pressed')).toBe('false');
    expect(controls.status.textContent).toBe('Озвучивание продолжено');

    synth.speak.mock.calls.at(-1)[0].onend();

    expect(controls.pause.disabled).toBe(true);
    expect(controls.stop.disabled).toBe(true);
    expect(controls.status.textContent).toBe('Озвучивание страницы завершено');
  });

  it('returns to idle controls and announces a synchronous synthesis error', () => {
    const synth = createSynth([LOCAL_RUSSIAN_VOICE]);
    synth.speak.mockImplementation(() => {
      throw new Error('synthesis failed');
    });
    const { controller, controls } = setup({ synth });
    controller.setEnabled(true);

    controls.read.click();

    expect(controls.read.disabled).toBe(false);
    expect(controls.pause.disabled).toBe(true);
    expect(controls.stop.disabled).toBe(true);
    expect(controls.status.textContent).toBe('Не удалось озвучить страницу');
  });

  it('cancels on stop, mode disable, pagehide, and beforeunload', () => {
    const { controller, controls, synth } = setup();
    controller.setEnabled(true);
    controls.read.click();

    controls.stop.click();
    expect(synth.cancel).toHaveBeenCalledTimes(2);
    expect(controls.status.textContent).toBe('Озвучивание остановлено');

    controls.read.click();
    controller.setEnabled(false);
    expect(synth.cancel).toHaveBeenCalledTimes(4);
    expect(controls.read.disabled).toBe(true);

    controller.setEnabled(true);
    controls.read.click();
    window.dispatchEvent(new Event('pagehide'));
    expect(synth.cancel).toHaveBeenCalledTimes(6);

    controls.read.click();
    window.dispatchEvent(new Event('beforeunload'));
    expect(synth.cancel).toHaveBeenCalledTimes(8);
  });

  it('does not attempt any network or script fallback while reading', () => {
    const fetchSpy = vi.fn();
    const xhrSpy = vi.fn();
    const socketSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('XMLHttpRequest', xhrSpy);
    vi.stubGlobal('WebSocket', socketSpy);
    const createElement = vi.spyOn(document, 'createElement');
    const { controller, controls } = setup();
    controller.setEnabled(true);

    controls.read.click();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();
    expect(socketSpy).not.toHaveBeenCalled();
    expect(createElement.mock.calls.some(([tagName]) => String(tagName).toLowerCase() === 'script')).toBe(false);
    expect(document.querySelector('script[src], link[href]')).toBeNull();
  });
});
