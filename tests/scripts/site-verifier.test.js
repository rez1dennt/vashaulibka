import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { generateSeo } from '../../scripts/generate-seo.mjs';
import { verifyDirectory } from '../../scripts/verify-site.mjs';

const INDEXABLE_PAGE = Object.freeze({ file: 'index.html', noindex: false });
const EXPLICIT_ORIGIN = 'https://provided-domain.ru';

const makeDirectory = () => mkdtempSync(join(tmpdir(), 'clinic-site-'));

const write = (directory, file, contents = '') => {
  const target = join(directory, file);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents, 'utf8');
};

const pageHtml = ({
  title = 'Главная',
  description = 'Описание главной страницы',
  h1 = '<h1>Главная</h1>',
  head = '',
  body = '',
  robots = 'index, follow',
} = {}) => `<!doctype html>
<html lang="ru">
  <head>
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="robots" content="${robots}">
    ${head}
  </head>
  <body>
    <a class="skip-link" href="#main-content">К содержимому</a>
    <main id="main-content">${h1}${body}</main>
    <section id="accessibility-panel" data-accessibility-panel aria-labelledby="accessibility-panel-title" hidden>
      <h2 id="accessibility-panel-title">Настройки доступности</h2>
      <div class="accessibility-toolbar">
        <button type="button" data-accessibility-advanced-open aria-controls="accessibility-settings-dialog" aria-expanded="false">Расширенные настройки</button>
      </div>
    </section>
    <div id="accessibility-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="accessibility-settings-title" hidden>
      <div data-accessibility-dialog-backdrop aria-hidden="true"></div>
      <div><button type="button" data-accessibility-dialog-close>Закрыть</button><h2 id="accessibility-settings-title">Расширенные настройки</h2></div>
    </div>
  </body>
</html>`;

const writeSeo = (directory, pages, origin) => {
  const seo = generateSeo(pages, { origin });
  write(directory, 'robots.txt', seo.robots);
  write(directory, 'sitemap.xml', seo.sitemap);
};

const searchItemFor = (page) => ({
  id: `page-${page.file.replace(/\.html$/, '')}`,
  href: page.file,
  category: 'Страницы',
  title: `Страница ${page.file}`,
  summary: 'Краткое описание страницы',
  content: 'Опубликованное содержание страницы',
  keywords: ['страница'],
});

const writeSearchIndex = (directory, pages, items = pages.map(searchItemFor)) => {
  write(directory, 'search-index.json', `${JSON.stringify({ version: 1, items }, null, 2)}\n`);
};

const writeValidFixture = ({
  pages = [INDEXABLE_PAGE],
  origin,
  htmlByFile = {},
} = {}) => {
  const directory = makeDirectory();
  for (const [index, page] of pages.entries()) {
    write(directory, page.file, htmlByFile[page.file] ?? pageHtml({
      title: `Страница ${index + 1}`,
      description: `Описание страницы ${index + 1}`,
      h1: `<h1>Страница ${index + 1}</h1>`,
      robots: page.noindex ? 'noindex, follow' : 'index, follow',
    }));
  }
  writeSeo(directory, pages, origin);
  writeSearchIndex(directory, pages);
  return directory;
};

describe('SEO output generation', () => {
  it('keeps the sitemap valid but empty when no origin is supplied', () => {
    const seo = generateSeo([
      INDEXABLE_PAGE,
      { file: 'prices.html', noindex: true },
    ]);

    expect(seo.sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(seo.sitemap).not.toContain('<url>');
    expect(seo.robots).not.toMatch(/^Sitemap:/m);
  });

  it('disallows every noindex page even when the origin is absent', () => {
    const seo = generateSeo([
      INDEXABLE_PAGE,
      { file: 'prices.html', noindex: true },
      { file: 'specialists.html', noindex: true },
    ]);

    expect(seo.robots).toContain('Disallow: /prices.html');
    expect(seo.robots).toContain('Disallow: /specialists.html');
  });

  it('emits absolute indexable-only URLs for an explicit HTTP(S) origin', () => {
    const seo = generateSeo([
      INDEXABLE_PAGE,
      { file: 'services.html', noindex: false },
      { file: 'prices.html', noindex: true },
    ], { origin: EXPLICIT_ORIGIN });

    expect(seo.sitemap).toContain(`<loc>${EXPLICIT_ORIGIN}/</loc>`);
    expect(seo.sitemap).toContain(`<loc>${EXPLICIT_ORIGIN}/services.html</loc>`);
    expect(seo.sitemap).not.toContain('prices.html');
    expect(seo.robots).toContain(`Sitemap: ${EXPLICIT_ORIGIN}/sitemap.xml`);
  });

  it('XML-escapes sitemap locations', () => {
    const seo = generateSeo([
      { file: 'care&help.html', noindex: false },
    ], { origin: EXPLICIT_ORIGIN });

    expect(seo.sitemap).toContain(`<loc>${EXPLICIT_ORIGIN}/care&amp;help.html</loc>`);
  });

  it.each([
    'ftp://clinic.test',
    'https://clinic.test/path',
    'not-a-url',
    'http://localhost:4173',
    'https://clinic.invalid',
    'https://example.com',
    'https://printer.local',
    'https://localhost.localdomain',
    'http://10.0.0.1',
    'http://172.16.0.1',
    'http://172.31.255.255',
    'http://192.168.1.1',
    'http://169.254.1.1',
    'http://100.64.0.1',
    'http://100.127.255.254',
    'http://192.0.2.1',
    'http://198.51.100.10',
    'http://203.0.113.254',
    'http://[::ffff:127.0.0.1]',
    'http://[::ffff:192.168.1.10]',
    'http://[::ffff:192.0.2.1]',
    'http://[fc00::1]',
    'http://[fd12::1]',
    'http://[fe80::1]',
    'http://[2001:db8::1]',
  ])('rejects an invalid explicit origin: %s', (origin) => {
    expect(() => generateSeo([INDEXABLE_PAGE], { origin })).toThrow(/origin/i);
  });
});

describe('production site verifier', () => {
  it('requires a generated search index', () => {
    const directory = writeValidFixture();
    unlinkSync(join(directory, 'search-index.json'));

    const codes = verifyDirectory(directory, { pages: [INDEXABLE_PAGE] }).errors.map((error) => error.code);

    expect(codes).toContain('search-index.missing');
  });

  it('rejects invalid search JSON and invalid schema', () => {
    const malformed = writeValidFixture();
    write(malformed, 'search-index.json', '{broken');
    expect(verifyDirectory(malformed, { pages: [INDEXABLE_PAGE] }).errors.map((error) => error.code))
      .toContain('search-index.parse');

    const wrongSchema = writeValidFixture();
    write(wrongSchema, 'search-index.json', JSON.stringify({ version: 2, items: 'no' }));
    expect(verifyDirectory(wrongSchema, { pages: [INDEXABLE_PAGE] }).errors.map((error) => error.code))
      .toContain('search-index.schema');
  });

  it('rejects duplicate search ids and external result links', () => {
    const directory = writeValidFixture();
    const valid = searchItemFor(INDEXABLE_PAGE);
    writeSearchIndex(directory, [INDEXABLE_PAGE], [
      valid,
      { ...valid, href: 'https://example.com' },
    ]);

    const codes = verifyDirectory(directory, { pages: [INDEXABLE_PAGE] }).errors.map((error) => error.code);

    expect(codes).toContain('search-index.duplicate');
    expect(codes).toContain('search-index.href');
  });

  it('rejects missing search fragments and missing page-level records', () => {
    const pages = [INDEXABLE_PAGE, { file: 'about.html', noindex: false }];
    const directory = writeValidFixture({ pages });
    writeSearchIndex(directory, pages, [
      { ...searchItemFor(INDEXABLE_PAGE), href: 'index.html#absent' },
      searchItemFor(pages[1]),
    ]);

    const codes = verifyDirectory(directory, { pages }).errors.map((error) => error.code);

    expect(codes).toContain('search-index.fragment');
    expect(codes).toContain('search-index.page');
  });

  it('rejects a directory without generated HTML pages', () => {
    const directory = makeDirectory();
    writeSeo(directory, []);

    const result = verifyDirectory(directory, { pages: [] });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'html.missing' }),
    ]));
  });

  it('requires exactly one non-empty h1', () => {
    const directory = writeValidFixture({
      htmlByFile: { 'index.html': pageHtml({ h1: '<h1> </h1><h1>Второй</h1>' }) },
    });

    const result = verifyDirectory(directory, { pages: [INDEXABLE_PAGE] });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'html.h1', file: 'index.html' }),
    ]));
  });

  it('requires Russian language, one main, and a working same-page skip link', () => {
    const directory = writeValidFixture({
      htmlByFile: {
        'index.html': pageHtml()
          .replace('lang="ru"', 'lang="en"')
          .replace('href="#main-content"', 'href="#missing"')
          .replace('</main>', '</main><main></main>'),
      },
    });

    const result = verifyDirectory(directory, { pages: [INDEXABLE_PAGE] });
    const codes = result.errors.map((error) => error.code);

    expect(codes).toContain('html.lang');
    expect(codes).toContain('html.main');
    expect(codes).toContain('html.skip-link');
  });

  it('requires non-empty unique titles and descriptions on indexable pages', () => {
    const pages = [INDEXABLE_PAGE, { file: 'about.html', noindex: false }];
    const duplicated = pageHtml({ title: 'Одинаково', description: 'Одинаковое описание' });
    const directory = writeValidFixture({
      pages,
      htmlByFile: {
        'index.html': duplicated,
        'about.html': duplicated.replace('<h1>Главная</h1>', '<h1>О клинике</h1>'),
      },
    });

    const result = verifyDirectory(directory, { pages });
    const codes = result.errors.map((error) => error.code);

    expect(codes).toContain('seo.title.duplicate');
    expect(codes).toContain('seo.description.duplicate');
  });

  it('resolves root-relative pages, query strings, and cross-page fragments', () => {
    const pages = [INDEXABLE_PAGE, { file: 'about.html', noindex: false }];
    const directory = writeValidFixture({
      pages,
      htmlByFile: {
        'index.html': pageHtml({ body: '<a href="/about.html?from=home#team">Команда</a>' }),
        'about.html': pageHtml({
          title: 'О клинике',
          description: 'Описание страницы о клинике',
          h1: '<h1>О клинике</h1>',
          body: '<section id="team">Команда</section>',
        }),
      },
    });

    expect(verifyDirectory(directory, { pages }).errors).toEqual([]);
  });

  it('reports broken local page links and missing fragment targets', () => {
    const directory = writeValidFixture({
      htmlByFile: {
        'index.html': pageHtml({ body: '<a href="missing.html">Нет страницы</a><a href="#absent">Нет якоря</a>' }),
      },
    });

    const result = verifyDirectory(directory, { pages: [INDEXABLE_PAGE] });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'link.missing' }),
      expect.objectContaining({ code: 'link.fragment' }),
    ]));
  });

  it('rejects local references that escape the verified directory', () => {
    const directory = writeValidFixture({
      htmlByFile: {
        'index.html': pageHtml({ body: '<a href="/%2e%2e%2foutside.pdf">Вне сборки</a>' }),
      },
    });
    writeFileSync(join(directory, '..', 'outside.pdf'), 'outside', 'utf8');

    const result = verifyDirectory(directory, { pages: [INDEXABLE_PAGE] });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'link.outside' }),
    ]));
  });

  it('ignores outbound anchors, telephone, email, data, and valid same-page fragments', () => {
    const directory = writeValidFixture({
      htmlByFile: {
        'index.html': pageHtml({ body: '<span id="details"></span><a href="#details">Детали</a><a href="https://minzdrav.gov.ru/">Минздрав</a><a href="tel:+74722215356">Телефон</a><a href="mailto:test@example.test">Почта</a><a href="data:text/plain,ok">Данные</a>' }),
      },
    });

    expect(verifyDirectory(directory, { pages: [INDEXABLE_PAGE] }).errors).toEqual([]);
  });

  it('rejects unsafe executable anchor schemes', () => {
    const directory = writeValidFixture({
      htmlByFile: {
        'index.html': pageHtml({ body: '<a href="javascript:alert(1)">Опасная ссылка</a>' }),
      },
    });

    const result = verifyDirectory(directory, { pages: [INDEXABLE_PAGE] });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'link.unsafe-scheme', reference: 'javascript:alert(1)' }),
    ]));
  });

  it('resolves local images, srcset, stylesheets, scripts, favicon, PDFs, and downloads', () => {
    const directory = writeValidFixture({
      htmlByFile: {
        'index.html': pageHtml({
          head: '<link rel="stylesheet" href="/assets/site.css"><link rel="icon" href="assets/favicon.svg"><script src="assets/app.js"></script>',
          body: '<picture><source srcset="assets/photo.avif 1x, assets/photo@2x.avif 2x"><img src="assets/photo.webp" alt=""></picture><a href="/documents/license.pdf" download>Лицензия</a>',
        }),
      },
    });
    for (const file of [
      'assets/site.css',
      'assets/favicon.svg',
      'assets/app.js',
      'assets/photo.avif',
      'assets/photo@2x.avif',
      'assets/photo.webp',
      'documents/license.pdf',
    ]) write(directory, file);

    expect(verifyDirectory(directory, { pages: [INDEXABLE_PAGE] }).errors).toEqual([]);
  });

  it('parses a mixed data and remote srcset candidate-by-candidate', () => {
    const directory = writeValidFixture({
      htmlByFile: {
        'index.html': pageHtml({
          body: '<picture><source srcset="data:image/gif;base64,R0lGODlhAQABAIAAAAUEBA== 1x, https://cdn.example.test/photo.webp 2x"></picture>',
        }),
      },
    });

    const errors = verifyDirectory(directory, { pages: [INDEXABLE_PAGE] }).errors;

    expect(errors.filter((error) => error.code === 'resource.external')).toHaveLength(1);
    expect(errors.filter((error) => error.code === 'resource.missing')).toHaveLength(0);
  });

  it('reports missing local active resources', () => {
    const directory = writeValidFixture({
      htmlByFile: {
        'index.html': pageHtml({
          head: '<link rel="stylesheet" href="missing.css"><script src="missing.js"></script>',
          body: '<img src="missing.webp" alt="">',
        }),
      },
    });

    const errors = verifyDirectory(directory, { pages: [INDEXABLE_PAGE] }).errors;

    expect(errors.filter((error) => error.code === 'resource.missing')).toHaveLength(3);
  });

  it('rejects external active resources but allows ordinary outbound anchors', () => {
    const directory = writeValidFixture({
      htmlByFile: {
        'index.html': pageHtml({
          head: '<link rel="stylesheet" href="https://cdn.example.test/site.css"><link rel="preload" as="font" href="//fonts.example.test/font.woff2"><script src="https://cdn.example.test/app.js"></script>',
          body: '<img src="https://cdn.example.test/photo.webp" alt=""><iframe src="https://maps.example.test/"></iframe><a href="https://minzdrav.gov.ru/">Разрешённая ссылка</a>',
        }),
      },
    });

    const errors = verifyDirectory(directory, { pages: [INDEXABLE_PAGE] }).errors;

    expect(errors.filter((error) => error.code === 'resource.external')).toHaveLength(5);
  });

  it.each([
    'https://lidrekon.ru/assets/widget.js',
    'https://code.responsivevoice.org/responsivevoice.js',
    'https://tts.yandex.net/generate?text=test',
    'https://speechkit.yandex.ru/synthesize',
    'https://tts.voicetech.yandex.net/generate?text=test',
    'https://speechkit.api.cloud.yandex.net/synthesize',
  ])('rejects a banned accessibility runtime host even in an outbound anchor: %s', (reference) => {
    const directory = writeValidFixture({
      htmlByFile: {
        'index.html': pageHtml({ body: `<a href="${reference}">Удалённый сервис</a>` }),
      },
    });

    expect(verifyDirectory(directory, { pages: [INDEXABLE_PAGE] }).errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'resource.banned-host', file: 'index.html', reference }),
    ]));
  });

  it.each([
    'https://yandex.ru/',
    'https://maps.yandex.ru/',
    'https://mytts.yandex.net/',
    'https://tts.yandex.net.example.test/',
  ])('does not broadly reject a non-TTS Yandex-like outbound anchor: %s', (reference) => {
    const directory = writeValidFixture({
      htmlByFile: {
        'index.html': pageHtml({ body: `<a href="${reference}">Обычная ссылка</a>` }),
      },
    });

    expect(verifyDirectory(directory, { pages: [INDEXABLE_PAGE] }).errors)
      .not.toEqual(expect.arrayContaining([expect.objectContaining({ code: 'resource.banned-host' })]));
  });

  it('rejects missing and broken advanced-dialog relationships', () => {
    const directory = writeValidFixture({
      htmlByFile: {
        'index.html': pageHtml()
          .replace('aria-controls="accessibility-settings-dialog"', 'aria-controls="missing-settings-dialog"')
          .replace('aria-labelledby="accessibility-settings-title"', 'aria-labelledby="missing-settings-title"'),
      },
    });

    expect(verifyDirectory(directory, { pages: [INDEXABLE_PAGE] }).errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'accessibility.dialog.relationship', file: 'index.html' }),
    ]));
  });

  it('rejects base elements that can redirect otherwise relative resources', () => {
    const directory = writeValidFixture({
      htmlByFile: {
        'index.html': pageHtml({
          head: '<base href="https://cdn.example.test/subdirectory/"><script src="assets/app.js"></script>',
        }),
      },
    });
    write(directory, 'assets/app.js');

    const result = verifyDirectory(directory, { pages: [INDEXABLE_PAGE] });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'html.base', file: 'index.html' }),
    ]));
  });

  it('treats raw absolute sentinel-origin resources as external', () => {
    const directory = writeValidFixture({
      htmlByFile: {
        'index.html': pageHtml({
          head: '<link rel="stylesheet" href="https://local.test/assets/site.css">',
        }),
      },
    });
    write(directory, 'assets/site.css');

    const errors = verifyDirectory(directory, { pages: [INDEXABLE_PAGE] }).errors;

    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'resource.external', reference: 'https://local.test/assets/site.css' }),
    ]));
  });

  it('rejects remote imports and URLs inside local stylesheets', () => {
    const directory = writeValidFixture({
      htmlByFile: {
        'index.html': pageHtml({ head: '<link rel="stylesheet" href="assets/site.css">' }),
      },
    });
    write(directory, 'assets/site.css', '@import "https://fonts.example.test/font.css"; .hero { background: url(//cdn.example.test/photo.webp); }');

    const errors = verifyDirectory(directory, { pages: [INDEXABLE_PAGE] }).errors;

    expect(errors.filter((error) => error.code === 'resource.external')).toHaveLength(2);
  });

  it('rejects remote resources in style blocks and style attributes', () => {
    const directory = writeValidFixture({
      htmlByFile: {
        'index.html': pageHtml({
          head: '<style>.hero { background: url(https://cdn.example.test/hero.webp); }</style>',
          body: '<div style="background-image: url(//cdn.example.test/card.webp)"></div>',
        }),
      },
    });

    const errors = verifyDirectory(directory, { pages: [INDEXABLE_PAGE] }).errors;

    expect(errors.filter((error) => error.code === 'resource.external')).toHaveLength(2);
  });

  it('parses every JSON-LD block', () => {
    const directory = writeValidFixture({
      htmlByFile: {
        'index.html': pageHtml({ head: '<script type="application/ld+json">{"broken":}</script>' }),
      },
    });

    const result = verifyDirectory(directory, { pages: [INDEXABLE_PAGE] });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'jsonld.invalid', file: 'index.html' }),
    ]));
  });

  it('enforces manifest noindex state in both directions', () => {
    const pages = [
      INDEXABLE_PAGE,
      { file: 'prices.html', noindex: true },
    ];
    const directory = writeValidFixture({
      pages,
      htmlByFile: {
        'index.html': pageHtml({ robots: 'noindex, follow' }),
        'prices.html': pageHtml({
          title: 'Цены',
          description: 'Описание страницы цен',
          h1: '<h1>Цены</h1>',
          robots: 'index, follow',
        }),
      },
    });

    const errors = verifyDirectory(directory, { pages }).errors;

    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'seo.noindex.unexpected', file: 'index.html' }),
      expect.objectContaining({ code: 'seo.noindex.missing', file: 'prices.html' }),
    ]));
  });

  it('rejects duplicate and conflicting robots meta directives', () => {
    const directory = writeValidFixture({
      htmlByFile: {
        'index.html': pageHtml().replace(
          '</head>',
          '<meta name="ROBOTS" content="noindex, follow"></head>',
        ),
      },
    });

    const errors = verifyDirectory(directory, { pages: [INDEXABLE_PAGE] }).errors;

    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'seo.robots-meta.count', file: 'index.html' }),
      expect.objectContaining({ code: 'seo.noindex.unexpected', file: 'index.html' }),
    ]));
  });

  it('requires robots and sitemap to match domain-unset mode', () => {
    const directory = writeValidFixture();
    write(directory, 'robots.txt', `${readFileSync(join(directory, 'robots.txt'), 'utf8')}Sitemap: https://clinic.test/sitemap.xml\n`);
    write(directory, 'sitemap.xml', '<?xml version="1.0"?><urlset><url><loc>/</loc></url></urlset>');

    const errors = verifyDirectory(directory, { pages: [INDEXABLE_PAGE] }).errors;

    expect(errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'seo.robots.inconsistent' }),
      expect.objectContaining({ code: 'seo.sitemap.inconsistent' }),
    ]));
  });

  it('accepts origin-aware robots and an absolute populated sitemap', () => {
    const origin = EXPLICIT_ORIGIN;
    const directory = writeValidFixture({ origin });

    expect(verifyDirectory(directory, { pages: [INDEXABLE_PAGE], origin }).errors).toEqual([]);
  });

  it('sets CLI exit code 1 when verification fails', () => {
    const directory = makeDirectory();
    const script = join(import.meta.dirname, '..', '..', 'scripts', 'verify-site.mjs');

    const result = spawnSync(process.execPath, [script, directory], { encoding: 'utf8' });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('html.missing');
  });
});
