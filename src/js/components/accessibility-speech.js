const READABLE_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, li, dt, dd, th, td';
const EXCLUDED_SELECTOR = [
  '[hidden]',
  '[aria-hidden="true"]',
  '.sr-only',
  'nav',
  '[role="navigation"]',
  '[role="toolbar"]',
  '[data-accessibility-panel]',
  '[data-cookie-consent]',
  '[data-cookie-banner]',
  '[data-cookie]',
  '[role="presentation"]',
  '[role="none"]',
  'script',
  'style',
  'template',
  'noscript',
].join(', ');
const MAX_CHUNK_LENGTH = 240;
const UNAVAILABLE_MESSAGE = 'Локальный русский голос недоступен в этом браузере';

function normalizedText(value) {
  return value?.replace(/\s+/g, ' ').trim() ?? '';
}

function mainElement(root) {
  return root?.matches?.('main') ? root : root?.querySelector?.('main');
}

function isHidden(element, main) {
  if (element.closest(EXCLUDED_SELECTOR)) return true;

  const view = element.ownerDocument?.defaultView;
  if (!view?.getComputedStyle) return false;

  for (let current = element; current && current !== main.parentElement; current = current.parentElement) {
    const style = view.getComputedStyle(current);
    if (style.display === 'none' || style.visibility === 'hidden') return true;
    if (current === main) break;
  }
  return false;
}

function readableBlocks(root) {
  const main = mainElement(root);
  if (!main) return [];

  const blocks = [];

  function append(text) {
    const normalized = normalizedText(text);
    if (normalized) blocks.push(/[.!?…:;]$/.test(normalized) ? normalized : `${normalized}.`);
  }

  function collectReadable(element) {
    let text = '';

    function flush() {
      append(text);
      text = '';
    }

    function visit(container) {
      for (const child of container.childNodes) {
        if (child.nodeType === 3) {
          text += child.nodeValue;
          continue;
        }
        if (child.nodeType !== 1 || isHidden(child, main)) continue;

        if (child.matches(READABLE_SELECTOR)) {
          flush();
          collectReadable(child);
        } else {
          visit(child);
        }
      }
    }

    visit(element);
    flush();
  }

  function visitMain(container) {
    for (const child of container.children) {
      if (isHidden(child, main)) continue;
      if (child.matches(READABLE_SELECTOR)) collectReadable(child);
      else visitMain(child);
    }
  }

  visitMain(main);
  return blocks;
}

function chunksFor(blocks) {
  const chunks = [];
  let current = '';

  for (const word of blocks.join(' ').split(/\s+/).filter(Boolean)) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= MAX_CHUNK_LENGTH) {
      current = next;
      continue;
    }

    if (current) chunks.push(current);
    if (word.length <= MAX_CHUNK_LENGTH) {
      current = word;
      continue;
    }

    for (let offset = 0; offset < word.length; offset += MAX_CHUNK_LENGTH) {
      const part = word.slice(offset, offset + MAX_CHUNK_LENGTH);
      if (part.length === MAX_CHUNK_LENGTH) chunks.push(part);
      else current = part;
    }
  }

  if (current) chunks.push(current);
  return chunks;
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
  let reading = false;
  let paused = false;
  let voice = null;
  let generation = 0;
  let previousVoicesChanged = null;

  const readButton = root?.querySelector?.('[data-speech-read]');
  const pauseButton = root?.querySelector?.('[data-speech-pause]');
  const stopButton = root?.querySelector?.('[data-speech-stop]');
  const status = root?.querySelector?.('[data-accessibility-status]');
  const view = eventWindow(root);

  function announce(message) {
    if (status) status.textContent = message;
  }

  function setIdleControls() {
    if (readButton) readButton.disabled = !enabled || !voice;
    if (pauseButton) {
      pauseButton.disabled = true;
      pauseButton.textContent = 'Пауза/Продолжить';
      pauseButton.setAttribute('aria-pressed', 'false');
    }
    if (stopButton) stopButton.disabled = true;
  }

  function setReadingControls() {
    if (readButton) readButton.disabled = true;
    if (pauseButton) {
      pauseButton.disabled = false;
      pauseButton.textContent = paused ? 'Продолжить' : 'Пауза';
      pauseButton.setAttribute('aria-pressed', String(paused));
    }
    if (stopButton) stopButton.disabled = false;
  }

  function selectVoice() {
    if (!synth || typeof synth.getVoices !== 'function' || typeof Utterance !== 'function') return null;
    const voice = synth.getVoices().find((item) =>
      item.localService === true && /^ru(?:-|$)/i.test(item.lang),
    );
    return voice ?? null;
  }

  function refreshVoice() {
    const previousVoice = voice;
    voice = selectVoice();

    if (reading && !voice) stop(false);
    else if (!reading) setIdleControls();

    if (!enabled) return;
    if (!voice) announce(UNAVAILABLE_MESSAGE);
    else if (!previousVoice) announce('Локальный русский голос доступен');
  }

  function stop(shouldAnnounce = true) {
    generation += 1;
    synth?.cancel?.();
    const wasReading = reading;
    reading = false;
    paused = false;
    setIdleControls();
    if (shouldAnnounce && wasReading) announce('Озвучивание остановлено');
  }

  function read() {
    refreshVoice();
    if (!enabled || !voice || typeof Utterance !== 'function') {
      announce(UNAVAILABLE_MESSAGE);
      return;
    }

    const chunks = chunksFor(readableBlocks(root));
    if (!chunks.length) {
      announce('На странице нет текста для озвучивания');
      return;
    }

    stop(false);
    reading = true;
    paused = false;
    setReadingControls();
    announce('Начато озвучивание страницы');
    const activeGeneration = generation;

    try {
      chunks.forEach((text, index) => {
        const utterance = new Utterance(text);
        utterance.lang = 'ru-RU';
        utterance.voice = voice;
        utterance.onerror = () => {
          if (!reading || activeGeneration !== generation) return;
          generation += 1;
          synth.cancel?.();
          reading = false;
          paused = false;
          setIdleControls();
          announce('Не удалось озвучить страницу');
        };
        if (index === chunks.length - 1) {
          utterance.onend = () => {
            if (!reading || activeGeneration !== generation) return;
            reading = false;
            paused = false;
            setIdleControls();
            announce('Озвучивание страницы завершено');
          };
        }
        synth.speak(utterance);
      });
    } catch {
      generation += 1;
      synth.cancel?.();
      reading = false;
      paused = false;
      setIdleControls();
      announce('Не удалось озвучить страницу');
    }
  }

  function togglePause() {
    if (!reading) return;
    if (paused) {
      synth.resume?.();
      paused = false;
      announce('Озвучивание продолжено');
    } else {
      synth.pause?.();
      paused = true;
      announce('Озвучивание приостановлено');
    }
    setReadingControls();
  }

  function handleLifecycleEnd() {
    stop(false);
  }

  function init() {
    if (initialized) return;
    initialized = true;

    readButton?.addEventListener('click', read);
    pauseButton?.addEventListener('click', togglePause);
    stopButton?.addEventListener('click', stop);
    if (synth?.addEventListener) {
      synth.addEventListener('voiceschanged', refreshVoice);
    } else if (synth) {
      previousVoicesChanged = synth.onvoiceschanged;
      synth.onvoiceschanged = refreshVoice;
    }
    view?.addEventListener('pagehide', handleLifecycleEnd);
    view?.addEventListener('beforeunload', handleLifecycleEnd);
    refreshVoice();
    setIdleControls();
  }

  function setEnabled(nextEnabled) {
    enabled = nextEnabled === true;
    if (!enabled) {
      stop(reading);
      setIdleControls();
      return;
    }
    refreshVoice();
  }

  function destroy() {
    if (!initialized) return;
    stop(false);
    readButton?.removeEventListener('click', read);
    pauseButton?.removeEventListener('click', togglePause);
    stopButton?.removeEventListener('click', stop);
    if (synth?.removeEventListener) synth.removeEventListener('voiceschanged', refreshVoice);
    else if (synth) synth.onvoiceschanged = previousVoicesChanged;
    view?.removeEventListener('pagehide', handleLifecycleEnd);
    view?.removeEventListener('beforeunload', handleLifecycleEnd);
    initialized = false;
  }

  return { init, setEnabled, stop, destroy };
}
