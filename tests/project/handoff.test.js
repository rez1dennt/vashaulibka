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

  it('keeps site search queries local and memory-only', () => {
    const source = read('src/js/components/site-search.js');

    for (const forbidden of [
      'localStorage',
      'sessionStorage',
      'document.cookie',
      'URLSearchParams',
      'sendBeacon',
      'XMLHttpRequest',
      'analytics',
    ]) expect(source).not.toContain(forbidden);
    expect(source).toContain("const INDEX_URL = 'search-index.json'");
    expect(source).toContain("credentials: 'same-origin'");
    expect(source).not.toMatch(/https?:\/\//);
  });

  it('documents the exact local accessibility-storage and speech boundary', () => {
    const readme = read('README.md');
    const checklist = read('CONTENT_CHECKLIST.md');

    expect(readme).toContain('`cookie-consent`');
    expect(readme).toContain('`accessibility-preferences`');
    expect(readme).toMatch(/accessibility-preferences.*верси[яи]\s*2/i);
    expect(readme).toMatch(/настройк.*отображен.*speechAnnouncements/i);
    expect(readme).toMatch(/не хран.*медицинск.*контактн.*текст.*истори/i);
    expect(readme).toMatch(/коротк.*подтвержд.*изменен.*настро.*локальн.*русск.*голос.*браузер/i);
    expect(readme).toMatch(/не читает.*страниц.*целиком/i);
    expect(readme).toMatch(/не загруж.*сторонн.*(?:TTS|синтез.*реч)/i);
    expect(readme).toMatch(/сброс.*настроек.*очистк.*данн.*браузер/i);
    expect(checklist).toMatch(/\[ \].*заявлен.*соответств.*(?:WCAG|ГОСТ).*аудит/i);
  });
});
