import { beforeEach, describe, expect, it } from 'vitest';
import { createAccessibilityImageController } from '../../src/js/components/accessibility-images.js';

function mainMarkup(content) {
  document.body.innerHTML = `<header><img id="logo" alt="Логотип"></header><main>${content}</main><footer><img id="footer-image" alt="Изображение в подвале"></footer>`;
}

function alternativeFor(image) {
  return image.nextElementSibling?.matches('[data-accessibility-image-alternative]')
    ? image.nextElementSibling
    : null;
}

describe('accessibility image alternatives', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('hides an informative main image and supplies its alt text as a visible alternative', () => {
    mainMarkup('<img id="treatment" src="implant-plan.webp" alt="План имплантации">');
    const image = document.querySelector('#treatment');
    const controller = createAccessibilityImageController();

    controller.setHidden(true);

    const alternative = alternativeFor(image);
    expect(image.hidden).toBe(true);
    expect(image.getAttribute('aria-hidden')).toBe('true');
    expect(alternative).not.toBeNull();
    expect(alternative.textContent).toBe('План имплантации');
    expect(alternative.getAttribute('role')).toBe('img');
    expect(alternative.classList.contains('accessibility-image-alternative')).toBe(true);
  });

  it('uses a non-duplicative figure caption before alt text', () => {
    mainMarkup('<figure><img id="licence" alt="Лицензия клиники"><figcaption>Лицензия на медицинскую деятельность</figcaption></figure>');
    const image = document.querySelector('#licence');

    createAccessibilityImageController().setHidden(true);

    expect(alternativeFor(image).textContent).toBe('Лицензия на медицинскую деятельность');
  });

  it('uses alt text when the figure caption repeats it', () => {
    mainMarkup('<figure><img id="licence" alt="Лицензия клиники"><figcaption>Лицензия клиники</figcaption></figure>');
    const image = document.querySelector('#licence');

    createAccessibilityImageController().setHidden(true);

    expect(alternativeFor(image).textContent).toBe('Лицензия клиники');
  });

  it('treats punctuation, case, and whitespace variants as the same caption', () => {
    mainMarkup('<figure><img id="licence" alt="Лицензия клиники"><figcaption>  ЛИЦЕНЗИЯ\n клиники.  </figcaption></figure>');
    const image = document.querySelector('#licence');

    createAccessibilityImageController().setHidden(true);

    expect(alternativeFor(image).textContent).toBe('Лицензия клиники');
  });

  it('preserves a caption that adds genuine information after equivalent alt text', () => {
    mainMarkup('<figure><img id="licence" alt="Лицензия клиники"><figcaption>Лицензия клиники. Выписка из реестра</figcaption></figure>');
    const image = document.querySelector('#licence');

    createAccessibilityImageController().setHidden(true);

    expect(alternativeFor(image).textContent).toBe('Лицензия клиники. Выписка из реестра');
  });

  it('hides decorative images without creating an empty alternative', () => {
    mainMarkup('<img id="decoration" src="flourish.svg" alt="">');
    const image = document.querySelector('#decoration');

    createAccessibilityImageController().setHidden(true);

    expect(image.hidden).toBe(true);
    expect(alternativeFor(image)).toBeNull();
  });

  it('does not modify images outside main', () => {
    mainMarkup('<img id="content" alt="Схема лечения">');
    const controller = createAccessibilityImageController();

    controller.setHidden(true);

    expect(document.querySelector('#logo').hidden).toBe(false);
    expect(document.querySelector('#logo').getAttribute('aria-hidden')).toBeNull();
    expect(document.querySelector('#footer-image').hidden).toBe(false);
    expect(document.querySelector('#footer-image').getAttribute('aria-hidden')).toBeNull();
  });

  it('uses a safe generic description when an informative image has no usable text', () => {
    mainMarkup('<img id="unknown" src="private-scan-2026.webp" alt="   ">');
    const image = document.querySelector('#unknown');

    createAccessibilityImageController().setHidden(true);

    expect(alternativeFor(image).textContent).toBe('Изображение к разделу');
  });

  it('does not duplicate alternatives across repeated hiding', () => {
    mainMarkup('<img id="treatment" alt="План имплантации">');
    const controller = createAccessibilityImageController();

    controller.setHidden(true);
    controller.setHidden(true);

    expect(document.querySelectorAll('[data-accessibility-image-alternative]').length).toBe(1);
  });

  it('restores original hidden and aria-hidden state and removes generated alternatives', () => {
    mainMarkup('<img id="existing-hidden" alt="Рентгеновский снимок" hidden aria-hidden="false"><img id="visible" alt="План лечения">');
    const hiddenImage = document.querySelector('#existing-hidden');
    const visibleImage = document.querySelector('#visible');
    const controller = createAccessibilityImageController();

    controller.setHidden(true);
    controller.setHidden(false);

    expect(hiddenImage.hidden).toBe(true);
    expect(hiddenImage.getAttribute('aria-hidden')).toBe('false');
    expect(visibleImage.hidden).toBe(false);
    expect(visibleImage.hasAttribute('aria-hidden')).toBe(false);
    expect(document.querySelectorAll('[data-accessibility-image-alternative]').length).toBe(0);
  });

  it('destroy restores all state after images are hidden', () => {
    mainMarkup('<img id="treatment" alt="План имплантации">');
    const image = document.querySelector('#treatment');
    const controller = createAccessibilityImageController();

    controller.setHidden(true);
    controller.destroy();

    expect(image.hidden).toBe(false);
    expect(image.hasAttribute('aria-hidden')).toBe(false);
    expect(alternativeFor(image)).toBeNull();
  });
});
