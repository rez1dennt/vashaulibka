const FALLBACK_DESCRIPTION = 'Изображение к разделу';

function normalizedText(value) {
  return value?.replace(/\s+/g, ' ').trim() ?? '';
}

function equivalenceText(value) {
  return normalizedText(value)
    .normalize('NFKC')
    .replace(/\p{P}+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function imageDescription(image) {
  const alt = normalizedText(image.getAttribute('alt'));
  if (image.getAttribute('alt') === '') return null;

  const caption = normalizedText(image.closest('figure')?.querySelector('figcaption')?.textContent);
  if (caption && (!alt || equivalenceText(caption).localeCompare(equivalenceText(alt), 'ru', { sensitivity: 'base' }) !== 0)) {
    return caption;
  }

  return alt || FALLBACK_DESCRIPTION;
}

function mainElement(root) {
  return root?.matches?.('main') ? root : root?.querySelector?.('main');
}

export function createAccessibilityImageController({ root = document } = {}) {
  const states = new WeakMap();
  const images = new Set();

  function stateFor(image) {
    let state = states.get(image);
    if (!state) {
      state = {
        alternative: null,
        ariaHidden: image.getAttribute('aria-hidden'),
        hadAriaHidden: image.hasAttribute('aria-hidden'),
        hadHidden: image.hasAttribute('hidden'),
        hidden: image.getAttribute('hidden'),
      };
      states.set(image, state);
      images.add(image);
    }
    return state;
  }

  function addAlternative(image, state) {
    if (state.alternative?.isConnected) return;

    const description = imageDescription(image);
    if (!description) return;

    const alternative = image.ownerDocument.createElement('span');
    alternative.className = 'accessibility-image-alternative';
    alternative.setAttribute('data-accessibility-image-alternative', '');
    alternative.setAttribute('role', 'img');
    alternative.textContent = description;
    image.insertAdjacentElement('afterend', alternative);
    state.alternative = alternative;
  }

  function restore(image, state) {
    state.alternative?.remove();
    state.alternative = null;

    if (state.hadHidden) image.setAttribute('hidden', state.hidden);
    else image.removeAttribute('hidden');

    if (state.hadAriaHidden) image.setAttribute('aria-hidden', state.ariaHidden);
    else image.removeAttribute('aria-hidden');
  }

  function setHidden(hidden) {
    if (!hidden) {
      for (const image of images) restore(image, states.get(image));
      return;
    }

    const main = mainElement(root);
    if (!main) return;

    for (const image of main.querySelectorAll('img')) {
      const state = stateFor(image);
      image.setAttribute('hidden', '');
      image.setAttribute('aria-hidden', 'true');
      addAlternative(image, state);
    }
  }

  function destroy() {
    for (const image of images) restore(image, states.get(image));
    images.clear();
  }

  return { setHidden, destroy };
}
