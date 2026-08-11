import { describe, expect, it } from 'vitest';
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

describe('renderPage', () => {
  it('renders semantic content and accessibility anchors', () => {
    const html = renderPage(page);

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('href="#main-content"');
    expect(html).toContain('<main id="main-content"');
    expect(html).toContain('<h1>О клинике</h1>');
    expect(html).toContain('data-appointment-open');
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
});
