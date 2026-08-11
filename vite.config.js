import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const htmlInputs = Object.fromEntries(
  readdirSync(import.meta.dirname)
    .filter((name) => name.endsWith('.html'))
    .map((name) => [name.replace('.html', ''), resolve(import.meta.dirname, name)]),
);

export default defineConfig({
  base: './',
  build: { rollupOptions: { input: htmlInputs } },
});
