import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const HERO_NAMES = [
  'home',
  'about',
  'services',
  'specialists',
  'prices',
  'reviews',
  'vacancies',
  'contacts',
];
const IMAGE_ROOT = 'public/assets/images';
const ICON_ROOT = 'public/assets/icons';
const DOCUMENT_ASSET_ROOT = 'public/assets/documents';
const DOCUMENT_PREVIEWS = ['license-registry-extract', 'ogrn-certificate'];
const HOME_DECORATIONS = [
  'home-hero-smile',
  'home-hero-tooth',
  'home-quick-tooth',
  'home-services-dental',
  'home-staff-jaw',
  'home-patients-docs',
];
const DECOR_ROOT = 'public/assets/decor';

const imagePath = (name, format) => `${IMAGE_ROOT}/hero-${name}.${format}`;
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

describe('original clinic visual assets', () => {
  it.each(['webp', 'avif'])('provides all eight non-trivial %s heroes', (format) => {
    for (const name of HERO_NAMES) {
      const file = imagePath(name, format);

      expect(existsSync(file), `${file} should exist`).toBe(true);
      expect(statSync(file).size, `${file} should exceed 20 KB`).toBeGreaterThan(20 * 1024);
    }
  });

  it.each(HERO_NAMES)('uses valid WebP and AVIF containers for %s', (name) => {
    const webp = readFileSync(imagePath(name, 'webp'));
    const avif = readFileSync(imagePath(name, 'avif'));

    expect(webp.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(webp.subarray(8, 12).toString('ascii')).toBe('WEBP');
    expect(avif.subarray(4, 8).toString('ascii')).toBe('ftyp');
    expect(avif.subarray(8, 32).toString('ascii')).toMatch(/avif|avis|mif1/);
  });

  it.each(['webp', 'avif'])('keeps all eight %s compositions distinct', (format) => {
    const hashes = HERO_NAMES.map((name) => sha256(imagePath(name, format)));

    expect(new Set(hashes).size).toBe(HERO_NAMES.length);
  });

  it.each(['logo.svg', 'favicon.svg'])('provides safe square vector identity in %s', (name) => {
    const file = `${ICON_ROOT}/${name}`;

    expect(existsSync(file), `${file} should exist`).toBe(true);
    const svg = readFileSync(file, 'utf8');
    const viewBox = svg.match(/viewBox=["']([^"']+)["']/)?.[1].trim().split(/\s+/).map(Number);

    expect(viewBox).toHaveLength(4);
    expect(viewBox[2]).toBe(viewBox[3]);
    expect(svg).toMatch(/<path\b/);
    expect(svg).not.toMatch(/<(?:text|image|script)\b/i);
    expect(svg).not.toMatch(/(?:href|src)\s*=\s*["'](?:https?:|data:|\/\/)/i);
    expect(svg).not.toMatch(/url\(\s*["']?(?:https?:|data:|\/\/)/i);
    expect(svg).not.toMatch(/\son[a-z]+\s*=/i);
  });

  it.each(HOME_DECORATIONS)('provides safe local editorial decoration in %s.svg', (name) => {
    const file = `${DECOR_ROOT}/${name}.svg`;

    expect(existsSync(file), `${file} should exist`).toBe(true);
    const svg = readFileSync(file, 'utf8');
    expect(svg).toMatch(/<svg\b[^>]*viewBox=["'][^"']+["']/i);
    expect(svg).toMatch(/<(?:path|circle|rect|line|polyline|ellipse)\b/i);
    expect(svg).not.toMatch(/<(?:text|image|script|foreignObject)\b/i);
    expect(svg).not.toMatch(/(?:href|src)\s*=\s*["'](?:https?:|data:|\/\/)/i);
    expect(svg).not.toMatch(/url\(\s*["']?(?:https?:|data:|\/\/)/i);
    expect(svg).not.toMatch(/\son[a-z]+\s*=/i);
  });

  it('resolves every local CSS image-set reference', () => {
    const css = readFileSync('src/styles/pages.css', 'utf8');

    for (const name of HERO_NAMES) {
      for (const format of ['avif', 'webp']) {
        const publicPath = `/assets/images/hero-${name}.${format}`;

        expect(css).toContain(`url("${publicPath}") type("image/${format}")`);
        expect(existsSync(`public${publicPath}`), `${publicPath} should resolve`).toBe(true);
      }
    }
  });

  it.each(DOCUMENT_PREVIEWS)('provides a real WebP preview for %s', (name) => {
    const source = `public/documents/${name}.pdf`;
    const preview = `${DOCUMENT_ASSET_ROOT}/${name}.webp`;

    expect(existsSync(source), `${source} should exist`).toBe(true);
    expect(existsSync(preview), `${preview} should exist`).toBe(true);
    expect(statSync(preview).size, `${preview} should exceed 20 KB`).toBeGreaterThan(20 * 1024);

    const webp = readFileSync(preview);
    expect(webp.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(webp.subarray(8, 12).toString('ascii')).toBe('WEBP');
  });
});
