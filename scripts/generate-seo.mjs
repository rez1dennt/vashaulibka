import { isIP } from 'node:net';

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';
const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const isPrivateIpv4 = (address) => {
  const [first, second] = address.split('.').map(Number);
  return first === 0
    || first === 10
    || first === 127
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168);
};

const expandIpv6 = (address) => {
  const [left = '', right = ''] = address.split('::');
  const leftParts = left ? left.split(':') : [];
  const rightParts = right ? right.split(':') : [];
  const missing = 8 - leftParts.length - rightParts.length;
  return [
    ...leftParts,
    ...Array(Math.max(0, missing)).fill('0'),
    ...rightParts,
  ].map((part) => Number.parseInt(part || '0', 16));
};

const isPrivateIp = (hostname) => {
  const address = hostname.replace(/^\[|\]$/g, '');
  const version = isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version !== 6) return false;

  const words = expandIpv6(address);
  const isUnspecified = words.every((word) => word === 0);
  const isLoopback = words.slice(0, 7).every((word) => word === 0) && words[7] === 1;
  const isUniqueLocal = (words[0] & 0xfe00) === 0xfc00;
  const isLinkLocal = (words[0] & 0xffc0) === 0xfe80;
  const isMappedIpv4 = words.slice(0, 5).every((word) => word === 0) && words[5] === 0xffff;
  if (isMappedIpv4) {
    const mapped = [
      words[6] >> 8,
      words[6] & 0xff,
      words[7] >> 8,
      words[7] & 0xff,
    ].join('.');
    return isPrivateIpv4(mapped);
  }

  return isUnspecified || isLoopback || isUniqueLocal || isLinkLocal;
};

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
    || hostname === 'local'
    || hostname.endsWith('.local')
    || hostname === 'localdomain'
    || hostname.endsWith('.localdomain')
    || isPrivateIp(hostname);
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
