const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const normalizeOrigin = (origin) => {
  if (origin === undefined || origin === null || String(origin).trim() === '') return null;

  let parsed;
  try {
    parsed = new URL(String(origin).trim());
  } catch {
    throw new TypeError('SITE_ORIGIN must be a valid HTTP(S) origin');
  }

  const isOriginOnly = parsed.pathname === '/'
    && parsed.search === ''
    && parsed.hash === ''
    && parsed.username === ''
    && parsed.password === '';
  if (!['http:', 'https:'].includes(parsed.protocol) || !isOriginOnly) {
    throw new TypeError('SITE_ORIGIN must be a valid HTTP(S) origin without a path, query, or fragment');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  const reservedSuffixes = ['invalid', 'test', 'example', 'localhost'];
  const reservedExamples = ['example.com', 'example.net', 'example.org'];
  const isReserved = reservedSuffixes.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`))
    || reservedExamples.some((example) => hostname === example || hostname.endsWith(`.${example}`))
    || hostname === '0.0.0.0'
    || hostname === '[::1]'
    || /^127(?:\.\d{1,3}){3}$/.test(hostname);
  if (isReserved) {
    throw new TypeError('SITE_ORIGIN must be a real production origin, not localhost or a placeholder domain');
  }

  return parsed.origin;
};

const pagePath = (file) => (file === 'index.html' ? '/' : `/${file}`);

export function generateSeo(pages, { origin } = {}) {
  const normalizedOrigin = normalizeOrigin(origin);
  const noindexPages = pages.filter((page) => page.noindex);
  const robotsLines = [
    'User-agent: *',
    'Allow: /',
    ...noindexPages.map((page) => `Disallow: ${pagePath(page.file)}`),
  ];

  if (normalizedOrigin) robotsLines.push(`Sitemap: ${normalizedOrigin}/sitemap.xml`);

  const sitemapEntries = normalizedOrigin
    ? pages
      .filter((page) => !page.noindex)
      .map((page) => `  <url><loc>${escapeXml(new URL(pagePath(page.file), `${normalizedOrigin}/`).href)}</loc></url>`)
      .join('\n')
    : '  <!-- SITE_ORIGIN не задан: абсолютные адреса будут добавлены после настройки домена. -->';

  return {
    robots: `${robotsLines.join('\n')}\n`,
    sitemap: `${XML_HEADER}\n<urlset xmlns="${SITEMAP_NAMESPACE}">\n${sitemapEntries}\n</urlset>\n`,
  };
}
