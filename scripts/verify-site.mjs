import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import {
  isAbsolute,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { PAGES } from '../src/content/page-manifest.js';
import { generateSeo } from './generate-seo.mjs';

const LOCAL_ORIGIN = 'https://local.test';
const PASSIVE_SCHEMES = /^(?:mailto|tel|data):/i;
const ACTIVE_LINK_RELS = new Set(['stylesheet', 'icon', 'preload', 'modulepreload', 'manifest']);

const normalizeNewlines = (value) => value.replaceAll('\r\n', '\n');

const walkFiles = (directory) => {
  if (!existsSync(directory) || !statSync(directory).isDirectory()) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = resolve(directory, entry.name);
    return entry.isDirectory() ? walkFiles(target) : [target];
  });
};

const relativeName = (directory, target) => relative(directory, target).split(sep).join('/');

const error = (code, message, details = {}) => ({ code, message, ...details });

const resolveReference = (reference, fromFile) => {
  const value = String(reference ?? '').trim();
  if (PASSIVE_SCHEMES.test(value)) return { kind: 'passive' };

  let url;
  try {
    url = new URL(value || fromFile, `${LOCAL_ORIGIN}/${fromFile}`);
  } catch {
    return { kind: 'invalid' };
  }

  if (url.origin !== LOCAL_ORIGIN) return { kind: 'external' };

  let pathname;
  let fragment;
  try {
    pathname = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    fragment = url.hash ? decodeURIComponent(url.hash.slice(1)) : '';
  } catch {
    return { kind: 'invalid' };
  }
  if (!pathname || pathname.endsWith('/')) pathname += 'index.html';

  return { kind: 'local', pathname, fragment };
};

const srcsetReferences = (srcset) => {
  const value = String(srcset ?? '').trim();
  if (!value || value.startsWith('data:')) return [];
  return value
    .split(',')
    .map((candidate) => candidate.trim().split(/\s+/, 1)[0])
    .filter(Boolean);
};

const cssReferences = (contents) => {
  const references = [];
  for (const match of contents.matchAll(/@import\s+(?:url\(\s*)?["']?([^"')\s;]+)["']?\s*\)?/gi)) {
    references.push(match[1]);
  }
  for (const match of contents.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    references.push(match[1].trim());
  }
  return [...new Set(references)];
};

export function verifyDirectory(directory, { pages = PAGES, origin } = {}) {
  const root = resolve(directory);
  const errors = [];
  const add = (code, message, details) => errors.push(error(code, message, details));
  const allFiles = walkFiles(root);
  const htmlFiles = allFiles
    .filter((file) => file.toLowerCase().endsWith('.html'))
    .map((file) => relativeName(root, file))
    .sort();

  if (htmlFiles.length === 0) {
    add('html.missing', 'directory does not contain generated HTML pages');
  }

  const expectedPages = new Map(pages.map((page) => [page.file, page]));
  for (const page of pages) {
    if (!existsSync(resolve(root, page.file))) {
      add('html.page.missing', `expected generated page is missing: ${page.file}`, { file: page.file });
    }
  }

  const documents = new Map();
  for (const file of htmlFiles) {
    try {
      const html = readFileSync(resolve(root, file), 'utf8');
      documents.set(file, new JSDOM(html, { url: `${LOCAL_ORIGIN}/${file}` }).window.document);
    } catch (cause) {
      add('html.parse', `could not parse HTML: ${cause.message}`, { file });
    }
  }

  const indexableMetadata = [];

  const checkLocalReference = (reference, fromFile, kind, { validateFragment = false } = {}) => {
    const resolvedReference = resolveReference(reference, fromFile);
    if (resolvedReference.kind === 'passive') return;
    if (resolvedReference.kind === 'invalid') {
      add(`${kind}.invalid`, `invalid local reference: ${reference}`, { file: fromFile, reference });
      return;
    }
    if (resolvedReference.kind === 'external') {
      if (kind === 'resource') {
        add('resource.external', `external active resource is not allowed: ${reference}`, { file: fromFile, reference });
      }
      return;
    }

    const target = resolve(root, resolvedReference.pathname);
    const relativeTarget = relative(root, target);
    if (relativeTarget === '..' || relativeTarget.startsWith(`..${sep}`) || isAbsolute(relativeTarget)) {
      add(`${kind}.outside`, `local target escapes the verified directory: ${reference}`, { file: fromFile, reference });
      return;
    }
    if (!existsSync(target) || !statSync(target).isFile()) {
      add(`${kind}.missing`, `local target does not exist: ${reference}`, { file: fromFile, reference });
      return;
    }

    if (validateFragment && resolvedReference.fragment) {
      const targetDocument = documents.get(resolvedReference.pathname);
      if (!targetDocument?.getElementById(resolvedReference.fragment)) {
        add('link.fragment', `fragment target does not exist: ${reference}`, { file: fromFile, reference });
      }
    }
  };

  for (const [file, document] of documents) {
    const manifestPage = expectedPages.get(file);
    const isIndexable = !manifestPage?.noindex;

    if (document.documentElement.lang.trim().toLowerCase() !== 'ru') {
      add('html.lang', 'html lang must be "ru"', { file });
    }

    const headings = [...document.querySelectorAll('h1')];
    if (headings.length !== 1 || !headings[0]?.textContent.trim()) {
      add('html.h1', 'expected exactly one non-empty h1', { file });
    }

    if (document.querySelectorAll('main').length !== 1) {
      add('html.main', 'expected exactly one main element', { file });
    }

    const skipLink = document.querySelector('a.skip-link[href^="#"]');
    const skipTarget = skipLink?.getAttribute('href')?.slice(1);
    if (!skipTarget || !document.getElementById(skipTarget)) {
      add('html.skip-link', 'skip link must target an element on the same page', { file });
    }

    const title = document.title.trim();
    const description = document.querySelector('meta[name="description"]')?.content.trim() ?? '';
    if (isIndexable) {
      if (!title) add('seo.title.missing', 'indexable page has no title', { file });
      if (!description) add('seo.description.missing', 'indexable page has no meta description', { file });
      indexableMetadata.push({ file, title, description });
    }

    const robots = document.querySelector('meta[name="robots"]')?.content.toLowerCase() ?? '';
    const hasNoindex = robots.split(/[\s,]+/).includes('noindex');
    if (manifestPage?.noindex && !hasNoindex) {
      add('seo.noindex.missing', 'manifest noindex page lacks a noindex directive', { file });
    } else if (manifestPage && !manifestPage.noindex && hasNoindex) {
      add('seo.noindex.unexpected', 'indexable manifest page contains a noindex directive', { file });
    }

    for (const block of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        JSON.parse(block.textContent);
      } catch {
        add('jsonld.invalid', 'JSON-LD block is not valid JSON', { file });
      }
    }

    for (const anchor of document.querySelectorAll('a[href]')) {
      checkLocalReference(anchor.getAttribute('href'), file, 'link', { validateFragment: true });
    }

    const directResources = [
      ['script[src]', 'src'],
      ['img[src]', 'src'],
      ['iframe[src]', 'src'],
      ['source[src]', 'src'],
      ['video[src]', 'src'],
      ['audio[src]', 'src'],
      ['object[data]', 'data'],
      ['embed[src]', 'src'],
      ['input[type="image"][src]', 'src'],
    ];
    for (const [selector, attribute] of directResources) {
      for (const element of document.querySelectorAll(selector)) {
        checkLocalReference(element.getAttribute(attribute), file, 'resource');
      }
    }

    for (const link of document.querySelectorAll('link[href]')) {
      const rels = link.rel.toLowerCase().split(/\s+/).filter(Boolean);
      if (rels.some((rel) => ACTIVE_LINK_RELS.has(rel))) {
        checkLocalReference(link.getAttribute('href'), file, 'resource');
      }
    }

    for (const element of document.querySelectorAll('img[srcset], source[srcset]')) {
      for (const reference of srcsetReferences(element.getAttribute('srcset'))) {
        checkLocalReference(reference, file, 'resource');
      }
    }

    for (const style of document.querySelectorAll('style')) {
      for (const reference of cssReferences(style.textContent)) {
        checkLocalReference(reference, file, 'resource');
      }
    }
    for (const element of document.querySelectorAll('[style]')) {
      for (const reference of cssReferences(element.getAttribute('style'))) {
        checkLocalReference(reference, file, 'resource');
      }
    }
  }

  for (const field of ['title', 'description']) {
    const owners = new Map();
    for (const metadata of indexableMetadata) {
      if (!metadata[field]) continue;
      const normalized = metadata[field].toLocaleLowerCase('ru-RU');
      if (owners.has(normalized)) {
        add(`seo.${field}.duplicate`, `indexable pages share the same ${field}`, {
          file: metadata.file,
          reference: owners.get(normalized),
        });
      } else {
        owners.set(normalized, metadata.file);
      }
    }
  }

  for (const stylesheet of allFiles.filter((file) => file.toLowerCase().endsWith('.css'))) {
    const file = relativeName(root, stylesheet);
    for (const reference of cssReferences(readFileSync(stylesheet, 'utf8'))) {
      checkLocalReference(reference, file, 'resource');
    }
  }

  let expectedSeo;
  try {
    expectedSeo = generateSeo(pages, { origin });
  } catch (cause) {
    add('seo.origin.invalid', cause.message);
  }

  for (const [file, code, field] of [
    ['robots.txt', 'seo.robots', 'robots'],
    ['sitemap.xml', 'seo.sitemap', 'sitemap'],
  ]) {
    const target = resolve(root, file);
    if (!existsSync(target)) {
      add(`${code}.missing`, `${file} is missing`, { file });
    } else if (expectedSeo) {
      const actual = normalizeNewlines(readFileSync(target, 'utf8'));
      if (actual !== expectedSeo[field]) {
        add(`${code}.inconsistent`, `${file} is inconsistent with the page manifest and SITE_ORIGIN mode`, { file });
      }
    }
  }

  return { errors, filesChecked: htmlFiles.length };
}

const modulePath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === modulePath) {
  const result = verifyDirectory(process.argv[2] || 'dist', { origin: process.env.SITE_ORIGIN });
  if (result.errors.length) {
    for (const item of result.errors) {
      console.error(`${item.code}${item.file ? ` [${item.file}]` : ''}: ${item.message}`);
    }
    process.exitCode = 1;
  } else {
    console.log(`Verified ${result.filesChecked} HTML pages`);
  }
}
