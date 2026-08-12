import { readFileSync } from 'node:fs';
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

function renderFixture() {
  document.body.innerHTML = `
    <section data-accessibility-panel>
      <button type="button" data-speech-announcements aria-pressed="false" disabled>Голосовые подтверждения</button>
      <p data-accessibility-status role="status" aria-live="polite"></p>
    </section>
  `;

  return {
    speaker: document.querySelector('[data-speech-announcements]'),
    status: document.querySelector('[data-accessibility-status]'),
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

describe('browser-local Russian action announcements', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    for (const controller of controllers.splice(0)) controller.destroy();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('exposes only the short-announcement controller surface', () => {
    const { controller } = setup();

    expect(Object.keys(controller).sort()).toEqual([
      'announce',
      'confirmAndDisable',
      'destroy',
      'init',
      'setEnabled',
      'stop',
    ]);
  });

  it('keeps the speaker unavailable when Web Speech is absent', () => {
    const { controller, controls } = setup({ synth: null, Utterance: null });

    controller.setEnabled(true);
    controller.announce('Изображения скрыты');

    expect(controls.speaker.disabled).toBe(true);
    expect(controls.speaker.getAttribute('aria-pressed')).toBe('false');
    expect(controls.speaker.getAttribute('aria-label')).toContain('Локальный русский голос недоступен');
    expect(controls.status.textContent).toBe('Изображения скрыты');
  });

  it('rejects remote Russian and local non-Russian voices', () => {
    const synth = createSynth([
      { lang: 'ru-RU', localService: false, name: 'Remote Russian' },
      { lang: 'en-US', localService: true, name: 'Local English' },
    ]);
    const { controller, controls } = setup({ synth });

    controller.setEnabled(true);
    controller.announce('Цветовая схема — стандартная');

    expect(controls.speaker.disabled).toBe(true);
    expect(controls.speaker.getAttribute('aria-pressed')).toBe('false');
    expect(synth.speak).not.toHaveBeenCalled();
  });

  it('reflects a stored enabled state after voiceschanged supplies a local Russian voice', () => {
    const synth = createSynth([]);
    const { controller, controls } = setup({ synth });
    controller.setEnabled(true);

    synth.setVoices([LOCAL_RUSSIAN_VOICE]);
    synth.emit('voiceschanged');

    expect(controls.speaker.disabled).toBe(false);
    expect(controls.speaker.getAttribute('aria-pressed')).toBe('true');
    expect(controls.speaker.hasAttribute('aria-label')).toBe(false);
    expect(controls.status.textContent).toBe('');
  });

  it('speaks one normalized short phrase with the qualifying local voice', () => {
    const { controller, controls, synth } = setup();
    controller.setEnabled(true);

    controller.announce('  Размер   шрифта — 150 процентов  ');

    expect(synth.cancel).toHaveBeenCalledTimes(1);
    expect(synth.speak).toHaveBeenCalledTimes(1);
    const utterance = synth.speak.mock.calls[0][0];
    expect(utterance.text).toBe('Размер шрифта — 150 процентов');
    expect(utterance.lang).toBe('ru-RU');
    expect(utterance.voice).toBe(LOCAL_RUSSIAN_VOICE);
    expect(controls.status.textContent).toBe('Размер шрифта — 150 процентов');
  });

  it('cancels a stale phrase and ignores its callbacks when a newer phrase wins', () => {
    const { controller, controls, synth } = setup();
    controller.setEnabled(true);
    controller.announce('Первая фраза');
    const stale = synth.speak.mock.calls[0][0];

    controller.announce('Вторая фраза');
    stale.onerror();
    stale.onend();

    expect(synth.cancel).toHaveBeenCalledTimes(2);
    expect(synth.speak).toHaveBeenCalledTimes(2);
    expect(synth.speak.mock.calls[1][0].text).toBe('Вторая фраза');
    expect(controls.status.textContent).toBe('Вторая фраза');
  });

  it('stops immediately on disable and ignores announcements until re-enabled', () => {
    const { controller, controls, synth } = setup();
    controller.setEnabled(true);
    controller.announce('До выключения');

    controller.setEnabled(false);
    controller.announce('После выключения');

    expect(synth.cancel).toHaveBeenCalledTimes(2);
    expect(synth.speak).toHaveBeenCalledTimes(1);
    expect(controls.speaker.getAttribute('aria-pressed')).toBe('false');
    expect(controls.status.textContent).toBe('После выключения');
  });

  it('cancels on explicit stop, pagehide, beforeunload, and destroy', () => {
    const { controller, synth } = setup();
    controller.setEnabled(true);
    controller.announce('Фраза');
    expect(synth.cancel).toHaveBeenCalledTimes(1);

    controller.stop();
    window.dispatchEvent(new Event('pagehide'));
    window.dispatchEvent(new Event('beforeunload'));
    controller.destroy();

    expect(synth.cancel).toHaveBeenCalledTimes(5);
  });

  it('speaks one final reset confirmation, disables immediately, and does not cancel it afterward', () => {
    const { controller, controls, synth } = setup();
    controller.setEnabled(true);
    controller.announce('Старая фраза');

    controller.confirmAndDisable('Настройки сброшены');
    controller.announce('Не должна прозвучать');

    expect(synth.cancel).toHaveBeenCalledTimes(2);
    expect(synth.speak).toHaveBeenCalledTimes(2);
    expect(synth.speak.mock.calls[1][0].text).toBe('Настройки сброшены');
    expect(controls.speaker.getAttribute('aria-pressed')).toBe('false');
    expect(controls.status.textContent).toBe('Не должна прозвучать');
  });

  it('fails closed on a synchronous synthesis error', () => {
    const synth = createSynth([LOCAL_RUSSIAN_VOICE]);
    synth.speak.mockImplementation(() => {
      throw new Error('synthesis failed');
    });
    const { controller, controls } = setup({ synth });
    controller.setEnabled(true);

    controller.announce('Фраза');

    expect(synth.cancel).toHaveBeenCalledTimes(2);
    expect(controls.status.textContent).toBe('Не удалось озвучить подтверждение');
    expect(controls.speaker.getAttribute('aria-pressed')).toBe('true');
  });

  it('fails closed on a current asynchronous error and ignores it after stop', () => {
    const { controller, controls, synth } = setup();
    controller.setEnabled(true);
    controller.announce('Фраза');
    const current = synth.speak.mock.calls[0][0];

    current.onerror();
    expect(synth.cancel).toHaveBeenCalledTimes(2);
    expect(controls.status.textContent).toBe('Не удалось озвучить подтверждение');

    controller.announce('Новая фраза');
    const stale = synth.speak.mock.calls[1][0];
    controller.stop();
    const stoppedStatus = controls.status.textContent;
    stale.onerror();
    expect(controls.status.textContent).toBe(stoppedStatus);
  });

  it('does not create a network or script fallback', () => {
    const fetchSpy = vi.fn();
    const xhrSpy = vi.fn();
    const socketSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('XMLHttpRequest', xhrSpy);
    vi.stubGlobal('WebSocket', socketSpy);
    const createElement = vi.spyOn(document, 'createElement');
    const { controller } = setup();
    controller.setEnabled(true);

    controller.announce('Изображения показаны');

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();
    expect(socketSpy).not.toHaveBeenCalled();
    expect(createElement.mock.calls.some(([tagName]) => String(tagName).toLowerCase() === 'script')).toBe(false);
    expect(document.querySelector('script[src], link[href]')).toBeNull();
  });

  it('contains no page-reading selectors, extraction, chunks, or playback controls', () => {
    const source = readFileSync('src/js/components/accessibility-speech.js', 'utf8');

    expect(source).not.toMatch(/data-speech-(?:read|pause|stop)/);
    expect(source).not.toMatch(/READABLE_SELECTOR|readableBlocks|chunksFor|MAX_CHUNK_LENGTH/);
    expect(source).not.toMatch(/querySelector\(['"]main|\.pause\?\.|\.resume\?\./);
    expect(source).not.toMatch(/Читать страницу|Озвучивание страницы|Пауза\/Продолжить/);
  });
});
