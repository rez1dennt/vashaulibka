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
  it('renders semantic content and accessibility anchors', () => {
    const html = renderPage(page);

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('href="#main-content"');
    expect(html).toContain('<main id="main-content"');
    expect(html).toContain('<h1>О клинике</h1>');
    expect(html).toContain('data-appointment-open');
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

    expect(html).toContain('<html class="no-js" lang="ru">');
    expect(html).toMatch(/<script>document\.documentElement\.classList\.replace\('no-js','js'\)<\/script><link rel="stylesheet"/);
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
