import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (file) => readFileSync(file, 'utf8');

describe('release handoff contract', () => {
  it('pins the supported Node and pnpm toolchain and documents it exactly', () => {
    const packageJson = JSON.parse(read('package.json'));
    const readme = read('README.md');

    expect(packageJson.engines).toEqual({ node: '^20.19.0 || >=22.12.0' });
    expect(packageJson.packageManager).toBe('pnpm@11.16.0');
    expect(readme).toContain('Node.js `^20.19.0 || >=22.12.0`');
    expect(readme).toContain('pnpm `11.16.0`');
    expect(readme).toContain('`src/styles/`');
    expect(readme).not.toContain('`src/css/`');
  });

  it('tracks unresolved hosting and server-log facts without inventing them', () => {
    const checklist = read('CONTENT_CHECKLIST.md');

    expect(checklist).toMatch(/\[ \].*поставщик хостинга.*стран.*регион/i);
    expect(checklist).toMatch(/\[ \].*серверн.*журнал.*IP-адрес.*срок.*хранен/i);
    expect(checklist).not.toContain('медициского');
  });

  it('documents the rich homepage and its local visual sources', () => {
    const readme = read('README.md');

    expect(readme).toContain('## Главная страница и визуальные материалы');
    expect(readme).toContain('`src/content/home-page.js`');
    expect(readme).toContain('`src/templates/site-chrome.js`');
    expect(readme).toContain('`src/templates/icons.js`');
    expect(readme).toContain('`public/assets/documents/`');
    expect(readme).toContain('«Визуализация интерьера»');
  });
});
