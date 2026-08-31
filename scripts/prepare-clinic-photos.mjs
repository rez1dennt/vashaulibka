import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CLINIC_PHOTOS, CLINIC_PHOTO_SOURCES } from '../src/data/clinic-photos.js';

const sourceDirectory = process.argv[2];
if (!sourceDirectory) throw new Error('Pass the directory containing the six clinic JPEG originals.');
const outputDirectory = resolve(import.meta.dirname, '../public/assets/images');

// Validate all originals before writing any derived image.
for (const source of Object.values(CLINIC_PHOTO_SOURCES)) {
  const file = resolve(sourceDirectory, source.file);
  const hash = createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase();
  if (hash !== source.sha256) throw new Error(`Unexpected original: ${source.file}`);
}
mkdirSync(outputDirectory, { recursive: true });
for (const [role, photo] of Object.entries(CLINIC_PHOTOS)) {
  const source = resolve(sourceDirectory, CLINIC_PHOTO_SOURCES[photo.source].file);
  for (const [format, quality] of [['webp', '86'], ['avif', '58']]) {
    const output = resolve(outputDirectory, `clinic-${role}.${format}`);
    execFileSync('magick', [source, '-auto-orient', '-crop', photo.crop, '+repage', '-strip', '-quality', quality, output], { stdio: 'inherit' });
  }
  console.log(`Prepared real clinic photograph: ${role}`);
}
