import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { PAGES } from '../../src/content/page-manifest.js';
import { renderPage } from '../../src/templates/render-page.js';

const BANNED_RUNTIME_HOST = /(?:^|\.)lidrekon\.ru$|(?:^|\.)responsivevoice\.(?:org|com)$|(?:^|\.)(?:tts|speechkit)(?:\.[a-z\d-]+)*\.yandex\.(?:net|ru|com)$/i;
const READER_CONTROL_COPY = /(?:читать|озвучить) страницу|приостановить чтение|остановить чтение/i;

const documents = () => PAGES.map((page) => ({
  file: page.file,
  document: new JSDOM(renderPage(page), { url: `https://local.test/${page.file}` }).window.document,
}));

describe('generated-page accessibility conformance', () => {
  it('publishes consent-gated MIS booking relationships on all 22 pages', () => {
    expect(PAGES).toHaveLength(22);
    for (const { file, document } of documents()) {
      const dialog = document.querySelector('#appointment-dialog');
      expect(dialog?.getAttribute('aria-describedby'), file).toBe('appointment-description');
      expect(dialog?.querySelector('[data-booking-status][aria-live="polite"]'), file).not.toBeNull();
      expect(dialog?.querySelector('[data-booking-error][role="alert"]'), file).not.toBeNull();
      expect(document.querySelector('[data-cookie-online-booking]'), file).not.toBeNull();
      expect(document.querySelector('script[src*="32top"], iframe[src*="32top"]'), file).toBeNull();
    }
  });

  it('renders one compact toolbar and one semantically related advanced dialog on all 22 pages', () => {
    expect(PAGES).toHaveLength(22);

    for (const { file, document } of documents()) {
      expect(document.querySelectorAll('#accessibility-panel[data-accessibility-panel]'), file).toHaveLength(1);
      expect(document.querySelectorAll('#accessibility-panel .accessibility-toolbar'), file).toHaveLength(1);
      expect(document.querySelectorAll('#accessibility-settings-dialog[role="dialog"][aria-modal="true"]'), file).toHaveLength(1);
      expect(document.querySelectorAll('[data-accessibility-advanced-open][aria-controls="accessibility-settings-dialog"]'), file).toHaveLength(1);
      expect(document.querySelectorAll('#accessibility-settings-dialog [data-accessibility-dialog-backdrop]'), file).toHaveLength(1);
      expect(document.querySelectorAll('#accessibility-settings-dialog [data-accessibility-dialog-close]'), file).toHaveLength(1);
      const speaker = document.querySelector('[data-speech-announcements]');
      const availability = document.querySelector('#accessibility-speech-availability[data-speech-availability]');
      expect(speaker?.getAttribute('aria-describedby'), file).toBe('accessibility-speech-availability');
      expect(availability?.hidden, file).toBe(false);
      expect(availability?.textContent, file).toBe('Локальный русский голос недоступен в этом браузере');
    }
  });

  it('keeps every static ARIA id reference valid and every id unique', () => {
    for (const { file, document } of documents()) {
      const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
      expect(new Set(ids).size, `${file}: duplicate ids`).toBe(ids.length);

      for (const element of document.querySelectorAll('[aria-controls], [aria-labelledby], [aria-describedby]')) {
        for (const id of ['aria-controls', 'aria-labelledby', 'aria-describedby']
          .flatMap((attribute) => (element.getAttribute(attribute) ?? '').trim().split(/\s+/))
          .filter(Boolean)) {
          expect(document.getElementById(id), `${file}: missing ARIA target #${id}`).not.toBeNull();
        }
      }
    }
  });

  it('has no full-page reader controls, positive tabindex values, missing image alt, or remote runtime assets', () => {
    for (const { file, document } of documents()) {
      expect(document.querySelector('[data-speech-read], [data-speech-pause], [data-speech-stop]'), file).toBeNull();
      expect(document.body.textContent, file).not.toMatch(READER_CONTROL_COPY);
      expect([...document.querySelectorAll('[tabindex]')].filter((element) => Number(element.getAttribute('tabindex')) > 0), file).toEqual([]);
      expect([...document.images].filter((image) => !image.hasAttribute('alt')), file).toEqual([]);

      for (const element of document.querySelectorAll('script[src], link[href], img[src], source[src], iframe[src], audio[src], video[src], [srcset]')) {
        const references = [element.getAttribute('src'), element.getAttribute('href'), element.getAttribute('srcset')]
          .filter(Boolean);
        for (const reference of references) {
          expect(reference, `${file}: external runtime reference`).not.toMatch(/^https?:|^\/\//i);
          const absolute = new URL(reference.split(/\s+/)[0], `https://local.test/${file}`);
          expect(BANNED_RUNTIME_HOST.test(absolute.hostname), `${file}: banned runtime host`).toBe(false);
        }
      }
    }
  });
});
