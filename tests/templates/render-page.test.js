import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { PAGES } from '../../src/content/page-manifest.js';
import { renderPage } from '../../src/templates/render-page.js';

const page = {
  file: 'about.html',
  title: 'О клинике',
  description: 'Информация о стоматологической клинике в Белгороде.',
  heading: 'О клинике',
  heroImage: 'about',
  body: '<section aria-labelledby="mission"><h2 id="mission">Наша миссия</h2></section>',
  noindex: false,
};

const HERO_VISUALIZATION_LABEL = 'Визуализация интерьера';

describe('renderPage', () => {
  it('renders one accessibility toolbar and toggle on every page', () => {
    for (const publicPage of PAGES) {
      const document = new JSDOM(renderPage(publicPage)).window.document;

      expect(document.querySelectorAll('[data-vision-toggle][aria-controls="accessibility-panel"][aria-expanded="false"]')).toHaveLength(1);
      expect(document.querySelectorAll('section#accessibility-panel[data-accessibility-panel][hidden]')).toHaveLength(1);
      expect(document.querySelectorAll('[data-accessibility-reset]')).toHaveLength(1);
      expect(document.querySelectorAll('[data-accessibility-close]')).toHaveLength(1);
      expect(document.querySelectorAll('[data-accessibility-status][aria-live="polite"]')).toHaveLength(1);
    }
  });

  it('renders semantic content and accessibility anchors', () => {
    const html = renderPage(page);

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('href="#main-content"');
    expect(html).toContain('<main id="main-content"');
    expect(html).toContain('<h1>О клинике</h1>');
    expect(html).toContain('data-appointment-open');
  });

  it('adds a page-level layout class only when the manifest requests one', () => {
    const standard = new JSDOM(renderPage(page)).window.document;
    const patient = new JSDOM(renderPage({ ...page, layout: 'patient' })).window.document;

    expect(standard.querySelector('main')?.getAttribute('class')).toBeNull();
    expect(patient.querySelector('main')?.classList.contains('main--patient')).toBe(true);
  });

  it('renders complete mobile menu and phone-fallback appointment controls', () => {
    const html = renderPage(page);

    expect(html).toContain('data-menu-backdrop');
    expect(html).not.toContain('data-menu-close');
    expect(html).toContain('<span class="menu-toggle__icon" aria-hidden="true"></span>');
    expect(html).toContain('<span class="sr-only" data-menu-toggle-label>Открыть меню</span>');
    expect(html).toContain('class="mobile-appointment button button-primary"');
    expect(html).toContain('href="tel:+74722215356"');
    expect(html).toContain('data-dialog-backdrop');
    const document = new JSDOM(html).window.document;
    expect(document.querySelector('#main-menu a[data-appointment-open]')?.getAttribute('href')).toBe('tel:+74722215356');
  });

  it('marks the raw document as no-js and switches the class before styles load', () => {
    const html = renderPage(page);
    const document = new JSDOM(html).window.document;
    const bootstrap = document.querySelector('script[data-accessibility-bootstrap]');
    const stylesheet = document.querySelector('link[rel="stylesheet"][href="/src/styles/main.css"]');

    expect(html).toContain('<html class="no-js" lang="ru">');
    expect(bootstrap).not.toBeNull();
    expect(stylesheet).not.toBeNull();
    expect(bootstrap.compareDocumentPosition(stylesheet) & 4).toBeTruthy();
    expect(document.querySelector('body > script[type="module"][src="/src/js/main.js"]:last-child')).not.toBeNull();
    expect(bootstrap.textContent).not.toMatch(/eval|document\.write|innerHTML|createElement|fetch|XMLHttpRequest|WebSocket|\.src\s*=|\.href\s*=/);
  });

  it('applies only exact validated version-2 preferences before styles execute', () => {
    const validPreferences = {
      version: 2,
      enabled: true,
      scale: '150',
      theme: 'blue-light',
      font: 'sans',
      letterSpacing: 'medium',
      lineHeight: 'large',
      paragraphSpacing: 'large',
      images: 'hidden',
      speechAnnouncements: false,
    };
    const reads = [];
    const dom = new JSDOM(renderPage(page), {
      runScripts: 'dangerously',
      beforeParse(window) {
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem(key) {
              reads.push(key);
              return JSON.stringify(validPreferences);
            },
          },
        });
      },
    });
    const root = dom.window.document.documentElement;

    expect(reads).toEqual(['accessibility-preferences']);
    expect(root.classList.contains('js')).toBe(true);
    expect(root.classList.contains('no-js')).toBe(false);
    expect([...root.attributes]
      .filter((attribute) => attribute.name.startsWith('data-accessibility-'))
      .map((attribute) => [attribute.name, attribute.value])).toEqual([
      ['data-accessibility-enabled', 'true'],
      ['data-accessibility-scale', '150'],
      ['data-accessibility-theme', 'blue-light'],
      ['data-accessibility-font', 'sans'],
      ['data-accessibility-letter-spacing', 'medium'],
      ['data-accessibility-line-height', 'large'],
      ['data-accessibility-paragraph-spacing', 'large'],
      ['data-accessibility-images', 'hidden'],
    ]);
  });

  it('does not apply retained choices while the accessibility mode is disabled', () => {
    const disabledPreferences = {
      version: 2,
      enabled: false,
      scale: '200',
      theme: 'white-black',
      font: 'sans',
      letterSpacing: 'large',
      lineHeight: 'large',
      paragraphSpacing: 'large',
      images: 'hidden',
      speechAnnouncements: true,
    };
    const dom = new JSDOM(renderPage(page), {
      runScripts: 'dangerously',
      beforeParse(window) {
        Object.defineProperty(window, 'localStorage', {
          value: { getItem: () => JSON.stringify(disabledPreferences) },
        });
      },
    });

    expect([...dom.window.document.documentElement.attributes]
      .filter((attribute) => attribute.name.startsWith('data-accessibility-'))
      .map((attribute) => [attribute.name, attribute.value])).toEqual([]);
  });

  it.each([
    ['unknown version', { version: 3 }],
    ['unknown choice', { theme: 'sepia' }],
    ['missing speech announcements', ({ speechAnnouncements, ...preferences }) => preferences],
    ['non-boolean speech announcements', { speechAnnouncements: 'false' }],
    ['extra key', { extra: 'value' }],
    ['malformed JSON', null],
    ['blocked storage', 'throw'],
  ])('fails safely for %s in the early accessibility record', (_, mutation) => {
    const base = {
      version: 2,
      enabled: true,
      scale: '150',
      theme: 'black-white',
      font: 'sans',
      letterSpacing: 'medium',
      lineHeight: 'large',
      paragraphSpacing: 'large',
      images: 'hidden',
      speechAnnouncements: false,
    };
    const dom = new JSDOM(renderPage(page), {
      runScripts: 'dangerously',
      beforeParse(window) {
        Object.defineProperty(window, 'localStorage', {
          value: {
            getItem() {
              if (mutation === 'throw') throw new Error('blocked');
              if (mutation === null) return '{';
              return JSON.stringify(typeof mutation === 'function' ? mutation(base) : { ...base, ...mutation });
            },
          },
        });
      },
    });
    const root = dom.window.document.documentElement;

    expect(root.classList.contains('js')).toBe(true);
    expect(root.classList.contains('no-js')).toBe(false);
    expect([...root.attributes].filter((attribute) => attribute.name.startsWith('data-accessibility-'))).toEqual([]);
  });

  it('leaves exact version-1 preferences for the module migration', () => {
    const version1Preferences = {
      version: 1,
      enabled: true,
      scale: '150',
      theme: 'black-white',
      font: 'sans',
      letterSpacing: 'medium',
      lineHeight: 'large',
      paragraphSpacing: 'large',
      images: 'hidden',
    };
    const dom = new JSDOM(renderPage(page), {
      runScripts: 'dangerously',
      beforeParse(window) {
        Object.defineProperty(window, 'localStorage', {
          value: { getItem: () => JSON.stringify(version1Preferences) },
        });
      },
    });

    expect([...dom.window.document.documentElement.attributes]
      .filter((attribute) => attribute.name.startsWith('data-accessibility-'))).toEqual([]);
  });

  it('publishes the complete primary information architecture', () => {
    const document = new JSDOM(renderPage(page)).window.document;
    const labels = [...document.querySelectorAll('#main-menu > a:not([data-appointment-open])')].map((link) => link.textContent);

    expect(labels).toEqual([
      'Главная',
      'О клинике',
      'Наши услуги',
      'Специалисты',
      'Цены',
      'Отзывы',
      'Вакансии',
      'Информация для пациентов',
      'Контакты',
    ]);
  });

  it('describes the pending online booking and verified structured opening hours', () => {
    const document = new JSDOM(renderPage(page)).window.document;
    const dialog = document.querySelector('#appointment-dialog');
    const schema = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);

    expect(dialog.textContent).toContain('Онлайн-запись подключается');
    expect(schema.openingHoursSpecification).toEqual([
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '10:00',
        closes: '19:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '10:00',
        closes: '14:00',
      },
    ]);
  });

  it('groups official appointment phones for responsive layout', () => {
    const document = new JSDOM(renderPage(page)).window.document;
    const actions = document.querySelector('#appointment-dialog .dialog__actions');
    const phones = actions?.querySelector('.dialog__phones');

    expect(actions).not.toBeNull();
    expect(phones?.querySelectorAll('a[href^="tel:"]')).toHaveLength(2);
    expect(actions?.querySelector('form, input, textarea')).toBeNull();
  });

  it('adds robots noindex only for controlled incomplete pages', () => {
    expect(renderPage({ ...page, noindex: true })).toContain('content="noindex, follow"');
    expect(renderPage(page)).not.toContain('content="noindex, follow"');
  });

  it('states the verified legal-entity registration date on the home page', () => {
    const home = PAGES.find((item) => item.file === 'index.html');
    const html = renderPage(home);

    expect(html).toContain('Общество с ограниченной ответственностью «Стоматология Ваша улыбка» зарегистрировано 17 февраля 2012 года.');
    expect(html).not.toContain('работает в Белгороде с 2012 года');
  });

  it('labels every generated interior without the rejected large disclaimer', () => {
    for (const publicPage of PAGES) {
      const html = renderPage(publicPage);
      const document = new JSDOM(html).window.document;

      expect(document.querySelectorAll('main > section:first-child .hero-visualization-label')).toHaveLength(1);
      expect(document.querySelector('main > section:first-child .hero-visualization-label')?.textContent).toBe(HERO_VISUALIZATION_LABEL);
      expect(html).not.toContain('Иллюстративное изображение — не фотография помещений клиники.');
    }
  });
});
