const UNAVAILABLE_MESSAGE = 'Локальный русский голос недоступен в этом браузере';
const SYNTHESIS_ERROR_MESSAGE = 'Не удалось озвучить подтверждение';

function normalizedText(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function eventWindow(root) {
  return root?.defaultView ?? root?.ownerDocument?.defaultView ?? globalThis.window;
}

export function createAccessibilitySpeechController({
  synth = window.speechSynthesis,
  Utterance = window.SpeechSynthesisUtterance,
  root = document,
} = {}) {
  let initialized = false;
  let enabled = false;
  let voice = null;
  let generation = 0;
  let previousVoicesChanged = null;

  const speaker = root?.querySelector?.('[data-speech-announcements]');
  const availability = root?.querySelector?.('[data-speech-availability]');
  const status = root?.querySelector?.('[data-accessibility-status]');
  const view = eventWindow(root);

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function selectVoice() {
    if (!synth || typeof synth.getVoices !== 'function' || typeof Utterance !== 'function') return null;
    return synth.getVoices().find((item) =>
      item.localService === true && /^ru(?:-|$)/i.test(item.lang),
    ) ?? null;
  }

  function syncSpeaker() {
    if (!speaker) return;

    speaker.disabled = !voice;
    speaker.setAttribute('aria-pressed', String(Boolean(voice && enabled)));
    speaker.removeAttribute('aria-label');
    if (availability) {
      availability.hidden = Boolean(voice);
      availability.textContent = voice ? '' : UNAVAILABLE_MESSAGE;
    }
  }

  function stop() {
    generation += 1;
    synth?.cancel?.();
  }

  function refreshVoice() {
    const previousVoice = voice;
    voice = selectVoice();
    if (previousVoice && !voice) stop();
    syncSpeaker();
  }

  function createUtterance(message, activeGeneration) {
    const utterance = new Utterance(message);
    utterance.lang = 'ru-RU';
    utterance.voice = voice;
    utterance.onend = () => {
      if (activeGeneration !== generation) return;
    };
    utterance.onerror = () => {
      if (activeGeneration !== generation) return;
      generation += 1;
      synth?.cancel?.();
      setStatus(SYNTHESIS_ERROR_MESSAGE);
    };
    return utterance;
  }

  function announce(message) {
    const normalized = normalizedText(message);
    if (!normalized) return false;
    setStatus(normalized);
    if (!enabled || !voice || typeof Utterance !== 'function') return false;

    generation += 1;
    synth?.cancel?.();
    const activeGeneration = generation;

    try {
      synth.speak(createUtterance(normalized, activeGeneration));
      return true;
    } catch {
      if (activeGeneration === generation) generation += 1;
      synth?.cancel?.();
      setStatus(SYNTHESIS_ERROR_MESSAGE);
      return false;
    }
  }

  function confirmAndDisable(message) {
    const normalized = normalizedText(message);
    if (normalized) setStatus(normalized);
    if (!enabled) {
      syncSpeaker();
      return false;
    }

    generation += 1;
    synth?.cancel?.();
    const activeGeneration = generation;
    const canSpeak = Boolean(normalized && voice && typeof Utterance === 'function');
    enabled = false;
    syncSpeaker();
    if (!canSpeak) return false;

    try {
      synth.speak(createUtterance(normalized, activeGeneration));
      return true;
    } catch {
      if (activeGeneration === generation) generation += 1;
      synth?.cancel?.();
      setStatus(SYNTHESIS_ERROR_MESSAGE);
      return false;
    }
  }

  function init() {
    if (initialized) return;
    initialized = true;

    if (synth?.addEventListener) {
      synth.addEventListener('voiceschanged', refreshVoice);
    } else if (synth) {
      previousVoicesChanged = synth.onvoiceschanged;
      synth.onvoiceschanged = refreshVoice;
    }
    view?.addEventListener('pagehide', stop);
    view?.addEventListener('beforeunload', stop);
    refreshVoice();
  }

  function setEnabled(nextEnabled) {
    const wasEnabled = enabled;
    enabled = nextEnabled === true;
    if (wasEnabled && !enabled) stop();
    refreshVoice();
  }

  function destroy() {
    if (!initialized) return;

    stop();
    if (synth?.removeEventListener) synth.removeEventListener('voiceschanged', refreshVoice);
    else if (synth) synth.onvoiceschanged = previousVoicesChanged;
    view?.removeEventListener('pagehide', stop);
    view?.removeEventListener('beforeunload', stop);
    enabled = false;
    voice = null;
    syncSpeaker();
    initialized = false;
  }

  return {
    init,
    setEnabled,
    announce,
    confirmAndDisable,
    stop,
    destroy,
  };
}
