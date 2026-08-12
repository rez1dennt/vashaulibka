import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PAGES } from '../src/content/page-manifest.js';
import { SERVICES } from '../src/data/services.js';
import { STAFF } from '../src/data/staff.js';
import { renderPage } from '../src/templates/render-page.js';
import { buildSearchIndex, serializeSearchIndex } from './generate-search-index.mjs';
import { generateSeo } from './generate-seo.mjs';

for (const page of PAGES) {
  await writeFile(resolve(import.meta.dirname, '..', page.file), renderPage(page), 'utf8');
}

const publicDirectory = resolve(import.meta.dirname, '..', 'public');
const seo = generateSeo(PAGES, { origin: process.env.SITE_ORIGIN });
const searchIndex = buildSearchIndex({ pages: PAGES, services: SERVICES, staff: STAFF });
await mkdir(publicDirectory, { recursive: true });
await Promise.all([
  writeFile(resolve(publicDirectory, 'robots.txt'), seo.robots, 'utf8'),
  writeFile(resolve(publicDirectory, 'sitemap.xml'), seo.sitemap, 'utf8'),
  writeFile(resolve(publicDirectory, 'search-index.json'), serializeSearchIndex(searchIndex), 'utf8'),
]);
