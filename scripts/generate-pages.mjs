import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PAGES } from '../src/content/page-manifest.js';
import { renderPage } from '../src/templates/render-page.js';
import { generateSeo } from './generate-seo.mjs';

for (const page of PAGES) {
  await writeFile(resolve(import.meta.dirname, '..', page.file), renderPage(page), 'utf8');
}

const publicDirectory = resolve(import.meta.dirname, '..', 'public');
const seo = generateSeo(PAGES, { origin: process.env.SITE_ORIGIN });
await mkdir(publicDirectory, { recursive: true });
await Promise.all([
  writeFile(resolve(publicDirectory, 'robots.txt'), seo.robots, 'utf8'),
  writeFile(resolve(publicDirectory, 'sitemap.xml'), seo.sitemap, 'utf8'),
]);
