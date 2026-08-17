import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
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
import { ONLINE_BOOKING } from '../src/data/online-booking.js';

const LOCAL_ORIGIN = 'https://local.test';
const PASSIVE_SCHEMES = /^(?:mailto|tel|data):/i;
const UNSAFE_SCHEMES = /^(?:javascript|vbscript):/i;
const ABSOLUTE_SCHEME = /^[a-z][a-z\d+.-]*:/i;
const ACTIVE_LINK_RELS = new Set(['stylesheet', 'icon', 'preload', 'modulepreload', 'manifest']);
const SEARCH_ITEM_FIELDS = Object.freeze(['id', 'href', 'category', 'title', 'summary', 'content', 'keywords']);
const REGULATION_INTEGRITY_FIELDS = Object.freeze(['id', 'href', 'size', 'sha256', 'pages']);
const SEARCH_INDEX_MAX_BYTES = 250 * 1024;
const BANNED_RUNTIME_HOST = /(?:^|\.)lidrekon\.ru$|(?:^|\.)responsivevoice\.(?:org|com)$|(?:^|\.)(?:tts|speechkit)(?:\.[a-z\d-]+)*\.yandex\.(?:net|ru|com)$/i;
const READER_CONTROL_COPY = /(?:читать|озвучить) страницу|приостановить чтение|остановить чтение/i;
const APPROVED_32TOP_LINKS = new Set([
  ONLINE_BOOKING.bookingUrl,
  ONLINE_BOOKING.consentUrl,
  ONLINE_BOOKING.privacyUrl,
]);

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
  if (UNSAFE_SCHEMES.test(value)) return { kind: 'unsafe' };
  if (PASSIVE_SCHEMES.test(value)) return { kind: 'passive' };
  if (value.startsWith('//') || ABSOLUTE_SCHEME.test(value)) return { kind: 'external' };

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
  const value = String(srcset ?? '');
  const references = [];
  let position = 0;

  while (position < value.length) {
    while (position < value.length && /[\t\n\f\r ,]/.test(value[position])) position += 1;
    if (position >= value.length) break;

    const urlStart = position;
    while (position < value.length && !/[\t\n\f\r ]/.test(value[position])) position += 1;
    let url = value.slice(urlStart, position);

    if (url.endsWith(',')) {
      url = url.replace(/,+$/, '');
      if (url) references.push(url);
      continue;
    }
    if (url) references.push(url);

    let parentheses = 0;
    while (position < value.length) {
      const character = value[position];
      if (character === '(') parentheses += 1;
      else if (character === ')' && parentheses > 0) parentheses -= 1;
      else if (character === ',' && parentheses === 0) {
        position += 1;
        break;
      }
      position += 1;
    }
  }

  return references;
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

const isBannedRuntimeReference = (reference) => {
  const value = String(reference ?? '').trim();
  if (!value || value.startsWith('data:')) return false;
  try {
    const url = new URL(value.startsWith('//') ? `https:${value}` : value, LOCAL_ORIGIN);
    return BANNED_RUNTIME_HOST.test(url.hostname);
  } catch {
    return false;
  }
};

const isUnapproved32TopLink = (reference) => {
  const value = String(reference ?? '').trim();
  if (!/32top\.ru/i.test(value)) return false;
  try {
    const url = new URL(value);
    return url.href !== value || !APPROVED_32TOP_LINKS.has(url.href);
  } catch {
    return true;
  }
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
    if (isBannedRuntimeReference(reference)) {
      add('resource.banned-host', `banned accessibility runtime host is not allowed: ${reference}`, { file: fromFile, reference });
    }
    if (kind === 'link' && isUnapproved32TopLink(reference)) {
      add('link.external-unapproved', `unapproved 32top link is not allowed: ${reference}`, { file: fromFile, reference });
    }
    const resolvedReference = resolveReference(reference, fromFile);
    if (resolvedReference.kind === 'passive') return;
    if (resolvedReference.kind === 'unsafe') {
      const code = kind === 'link' ? 'link.unsafe-scheme' : 'resource.external';
      add(code, `unsafe executable reference is not allowed: ${reference}`, { file: fromFile, reference });
      return;
    }
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

    if (kind === 'link' && resolvedReference.pathname.toLowerCase().endsWith('.pdf')) {
      const signature = readFileSync(target).subarray(0, 4).toString('ascii');
      if (signature !== '%PDF') {
        add('link.pdf.invalid', `local PDF target has an invalid signature: ${reference}`, { file: fromFile, reference });
        return;
      }
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

    if (document.querySelector('base')) {
      add('html.base', 'base elements are not allowed because they can redirect local references', { file });
    }

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

    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
    if (new Set(ids).size !== ids.length) {
      add('html.id.duplicate', 'element ids must be unique within a page', { file });
    }

    for (const element of document.querySelectorAll('[aria-controls], [aria-labelledby], [aria-describedby]')) {
      for (const attribute of ['aria-controls', 'aria-labelledby', 'aria-describedby']) {
        for (const id of (element.getAttribute(attribute) ?? '').trim().split(/\s+/).filter(Boolean)) {
          if (!document.getElementById(id)) {
            add('html.aria.reference', `ARIA reference does not target an element: ${attribute}="${id}"`, { file, reference: id });
          }
        }
      }
    }

    if ([...document.querySelectorAll('[tabindex]')].some((element) => Number(element.getAttribute('tabindex')) > 0)) {
      add('html.tabindex.positive', 'positive tabindex values are not allowed', { file });
    }

    if ([...document.images].some((image) => !image.hasAttribute('alt'))) {
      add('html.image.alt', 'every image must have an alt attribute', { file });
    }

    if (document.querySelector('[data-speech-read], [data-speech-pause], [data-speech-stop]')
      || READER_CONTROL_COPY.test(document.body.textContent)) {
      add('accessibility.reader.removed', 'full-page reading controls and copy are not allowed', { file });
    }

    const panels = document.querySelectorAll('#accessibility-panel[data-accessibility-panel]');
    const toolbars = document.querySelectorAll('#accessibility-panel .accessibility-toolbar');
    if (panels.length !== 1 || toolbars.length !== 1) {
      add('accessibility.panel.count', 'expected exactly one compact accessibility panel and toolbar', { file });
    }

    const speakers = document.querySelectorAll('[data-speech-announcements]');
    const speakerDescriptionId = speakers[0]?.getAttribute('aria-describedby');
    const speakerAvailability = speakerDescriptionId ? document.getElementById(speakerDescriptionId) : null;
    const validSpeechRelationship = speakers.length === 1
      && speakerAvailability?.matches('[data-speech-availability]')
      && !speakerAvailability.hidden
      && speakerAvailability.textContent.trim() === 'Локальный русский голос недоступен в этом браузере';
    if (!validSpeechRelationship) {
      add('accessibility.speech.relationship', 'speech control must reference its visible local-voice availability message', { file });
    }

    const dialogs = document.querySelectorAll('#accessibility-settings-dialog');
    if (dialogs.length !== 1) {
      add('accessibility.dialog.count', 'expected exactly one advanced accessibility dialog', { file });
    } else {
      const dialog = dialogs[0];
      const opener = document.querySelectorAll('[data-accessibility-advanced-open]');
      const labelId = dialog.getAttribute('aria-labelledby');
      const validRelationship = opener.length === 1
        && opener[0].getAttribute('aria-controls') === dialog.id
        && dialog.getAttribute('role') === 'dialog'
        && dialog.getAttribute('aria-modal') === 'true'
        && Boolean(labelId && document.getElementById(labelId)?.textContent.trim())
        && Boolean(dialog.querySelector('[data-accessibility-dialog-backdrop]'))
        && Boolean(dialog.querySelector('[data-accessibility-dialog-close]'));
      if (!validRelationship) {
        add('accessibility.dialog.relationship', 'advanced dialog relationships and required controls must be valid', { file });
      }
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

    const robotsMeta = [...document.querySelectorAll('meta[name]')]
      .filter((meta) => meta.getAttribute('name').trim().toLowerCase() === 'robots');
    if (robotsMeta.length !== 1) {
      add('seo.robots-meta.count', 'expected exactly one robots meta directive', { file });
    }
    const hasNoindex = robotsMeta.some((meta) => meta.content
      .toLowerCase()
      .split(/[\s,]+/)
      .includes('noindex'));
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

  const regulationIntegrityName = 'documents/regulations/integrity.json';
  const regulationIntegrityFile = resolve(root, regulationIntegrityName);
  if (existsSync(regulationIntegrityFile)) {
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(regulationIntegrityFile, 'utf8'));
    } catch {
      add('documents.integrity.parse', 'regulation integrity manifest is not valid JSON', {
        file: regulationIntegrityName,
      });
    }

    if (manifest) {
      if (manifest.version !== 1 || !Array.isArray(manifest.items)) {
        add('documents.integrity.schema', 'regulation integrity manifest must contain version 1 and an items array', {
          file: regulationIntegrityName,
        });
      } else {
        const seenHrefs = new Set();
        for (const item of manifest.items) {
          const exactFields = item && typeof item === 'object'
            && REGULATION_INTEGRITY_FIELDS.every((field) => Object.hasOwn(item, field))
            && Object.keys(item).every((field) => REGULATION_INTEGRITY_FIELDS.includes(field));
          const validValues = exactFields
            && typeof item.id === 'string' && item.id.trim()
            && typeof item.href === 'string' && item.href.match(/^documents\/regulations\/[a-z0-9-]+\.pdf$/)
            && Number.isSafeInteger(item.size) && item.size > 4
            && typeof item.sha256 === 'string' && item.sha256.match(/^[A-F0-9]{64}$/)
            && Number.isSafeInteger(item.pages) && item.pages > 0;

          if (!validValues || seenHrefs.has(item?.href)) {
            add('documents.integrity.schema', 'regulation integrity item has an invalid shape, value, or duplicate href', {
              file: regulationIntegrityName,
              reference: item?.href,
            });
            continue;
          }
          seenHrefs.add(item.href);

          const resolvedReference = resolveReference(item.href, 'index.html');
          if (resolvedReference.kind !== 'local' || resolvedReference.pathname !== item.href) {
            add('documents.integrity.schema', `regulation integrity href is not a safe local PDF: ${item.href}`, {
              file: regulationIntegrityName,
              reference: item.href,
            });
            continue;
          }

          const target = resolve(root, resolvedReference.pathname);
          const relativeTarget = relative(root, target);
          if (relativeTarget === '..' || relativeTarget.startsWith(`..${sep}`) || isAbsolute(relativeTarget)) {
            add('documents.integrity.schema', `regulation integrity href escapes the verified directory: ${item.href}`, {
              file: regulationIntegrityName,
              reference: item.href,
            });
            continue;
          }
          if (!existsSync(target) || !statSync(target).isFile()) {
            add('documents.integrity.missing', `regulation PDF is missing: ${item.href}`, {
              file: regulationIntegrityName,
              reference: item.href,
            });
            continue;
          }

          const bytes = readFileSync(target);
          const signature = bytes.subarray(0, 4).toString('ascii');
          const sha256 = createHash('sha256').update(bytes).digest('hex').toUpperCase();
          if (signature !== '%PDF' || bytes.length !== item.size || sha256 !== item.sha256) {
            add('documents.integrity.mismatch', `regulation PDF does not match its integrity record: ${item.href}`, {
              file: regulationIntegrityName,
              reference: item.href,
            });
          }
        }
      }
    }
  }

  const searchIndexFile = resolve(root, 'search-index.json');
  if (!existsSync(searchIndexFile)) {
    add('search-index.missing', 'search-index.json is missing', { file: 'search-index.json' });
  } else if (statSync(searchIndexFile).size > SEARCH_INDEX_MAX_BYTES) {
    add('search-index.schema', 'search-index.json exceeds the 250 KiB limit', { file: 'search-index.json' });
  } else {
    let searchIndex;
    try {
      searchIndex = JSON.parse(readFileSync(searchIndexFile, 'utf8'));
    } catch {
      add('search-index.parse', 'search-index.json is not valid JSON', { file: 'search-index.json' });
    }

    if (searchIndex) {
      if (searchIndex.version !== 1 || !Array.isArray(searchIndex.items)) {
        add('search-index.schema', 'search-index.json must contain version 1 and an items array', { file: 'search-index.json' });
      } else {
        const ids = new Set();
        const pageHrefs = new Set();

        for (const item of searchIndex.items) {
          const exactFields = item && typeof item === 'object'
            && SEARCH_ITEM_FIELDS.every((field) => Object.hasOwn(item, field))
            && Object.keys(item).every((field) => SEARCH_ITEM_FIELDS.includes(field));
          const validStrings = exactFields
            && SEARCH_ITEM_FIELDS.filter((field) => field !== 'keywords')
              .every((field) => typeof item[field] === 'string' && item[field].trim());
          const validKeywords = exactFields
            && Array.isArray(item.keywords)
            && item.keywords.length > 0
            && item.keywords.every((keyword) => typeof keyword === 'string' && keyword.trim());

          if (!exactFields || !validStrings || !validKeywords) {
            add('search-index.schema', 'search index item has an invalid shape or empty field', { file: 'search-index.json' });
            continue;
          }
          if (ids.has(item.id)) {
            add('search-index.duplicate', `duplicate search item id: ${item.id}`, { file: 'search-index.json' });
          }
          ids.add(item.id);

          const resolved = resolveReference(item.href, 'index.html');
          if (resolved.kind !== 'local' || !item.href.match(/^[a-z0-9-]+\.html(?:#[a-z][a-z0-9-]*)?$/)) {
            add('search-index.href', `search item href must be a safe local HTML target: ${item.href}`, { file: 'search-index.json' });
            continue;
          }
          if (!existsSync(resolve(root, resolved.pathname))) {
            add('search-index.href', `search item target does not exist: ${item.href}`, { file: 'search-index.json' });
            continue;
          }
          if (resolved.fragment && !documents.get(resolved.pathname)?.getElementById(resolved.fragment)) {
            add('search-index.fragment', `search item fragment does not exist: ${item.href}`, { file: 'search-index.json' });
          }
          if (!resolved.fragment) pageHrefs.add(resolved.pathname);
        }

        for (const page of pages) {
          if (!pageHrefs.has(page.file)) {
            add('search-index.page', `search index lacks a page-level item for ${page.file}`, { file: 'search-index.json' });
          }
        }
      }
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
