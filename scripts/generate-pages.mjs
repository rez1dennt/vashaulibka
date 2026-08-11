import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PAGES } from '../src/content/page-manifest.js';
import { renderPage } from '../src/templates/render-page.js';

for (const page of PAGES) {
  await writeFile(resolve(import.meta.dirname, '..', page.file), renderPage(page), 'utf8');
}
