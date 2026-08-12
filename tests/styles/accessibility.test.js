import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readStyle = (name) => {
  const path = `src/styles/${name}.css`;
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
};

const tokensCss = readStyle('tokens');
const accessibilityCss = readStyle('accessibility');

const declarations = (css) => new Map(
  [...css.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]),
);

const themeDeclarations = (theme) => {
  const selector = `html[data-accessibility-enabled="true"][data-accessibility-theme="${theme}"]`;
  const block = accessibilityCss.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
  return declarations(block);
};

const resolveToken = (values, name) => {
  let value = values.get(name);
  const visited = new Set();

  while (value?.startsWith('var(')) {
    if (visited.has(value)) throw new Error(`Circular token reference for ${name}`);
    visited.add(value);
    value = values.get(value.slice(4, -1));
  }

  return value;
};

const luminance = (hex) => {
  const channels = hex.slice(1).match(/../g).map((channel) => Number.parseInt(channel, 16) / 255);
  const [red, green, blue] = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
};

const contrastRatio = (foreground, background) => {
  const values = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
};

describe('responsive accessibility visual system', () => {
  it('loads the accessibility layer after every existing style layer', () => {
    const imports = [...readStyle('main').matchAll(/@import\s+['"]\.\/(.+?)\.css['"]/g)]
      .map((match) => match[1]);

    expect(accessibilityCss).not.toBe('');
    expect(imports.at(-1)).toBe('accessibility');
  });

  it('defines the accessibility semantic and component aliases in the token layer', () => {
    for (const declaration of [
      '--accessibility-text-scale: 100%;',
      '--accessibility-letter-spacing: normal;',
      '--accessibility-line-height: var(--text-body-line-height);',
      '--accessibility-paragraph-spacing: var(--space-4);',
      '--accessibility-panel-background: var(--color-surface-raised);',
      '--accessibility-panel-border: var(--color-border-strong);',
      '--accessibility-panel-shadow: var(--shadow-header);',
    ]) {
      expect(tokensCss).toContain(declaration);
    }
  });

  it('scales the root font for every supported percentage without transforming the page', () => {
    for (const scale of ['100', '125', '150', '200']) {
      expect(accessibilityCss).toMatch(new RegExp(`html\\[data-accessibility-enabled="true"\\]\\[data-accessibility-scale="${scale}"\\]\\s*\\{[^}]*font-size:\\s*${scale}%`, 's'));
    }

    const scaleRules = [...accessibilityCss.matchAll(/html\[data-accessibility-enabled="true"\]\[data-accessibility-scale="(?:100|125|150|200)"\]\s*\{([^}]*)\}/g)]
      .map((match) => match[1]).join('\n');
    expect(scaleRules).not.toMatch(/transform|zoom:/);
  });

  it.each(['standard', 'black-white', 'white-black', 'blue-light'])(
    'overrides the complete semantic palette for the %s theme with AA contrast',
    (theme) => {
      const themeTokens = themeDeclarations(theme);
      const values = new Map([...declarations(tokensCss), ...themeTokens]);
      const color = (name) => resolveToken(values, name);
      const required = [
        '--color-text',
        '--color-surface-page',
        '--color-primary-strong',
        '--color-border-strong',
        '--color-focus',
        '--button-primary-background',
        '--button-primary-text',
        '--notice-background',
        '--color-overlay',
      ];

      for (const token of required) expect(themeTokens.has(token)).toBe(true);
      expect(contrastRatio(color('--color-text'), color('--color-surface-page'))).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(color('--color-primary-strong'), color('--color-surface-page'))).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(color('--color-text'), color('--notice-background'))).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(color('--button-primary-text'), color('--button-primary-background'))).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(color('--color-border-strong'), color('--color-surface-page'))).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(color('--color-focus'), color('--color-surface-page'))).toBeGreaterThanOrEqual(3);
    },
  );

  it('supports sans text, letter spacing, line height, and paragraph spacing in readable regions', () => {
    expect(accessibilityCss).toMatch(/\[data-accessibility-font="sans"\]\s*\{[^}]*--font-body:\s*var\(--accessibility-font-sans\)[^}]*--font-heading:\s*var\(--accessibility-font-sans\)/s);
    expect(accessibilityCss).toMatch(/\[data-accessibility-letter-spacing="medium"\]\s*\{[^}]*--accessibility-letter-spacing:/s);
    expect(accessibilityCss).toMatch(/\[data-accessibility-letter-spacing="large"\]\s*\{[^}]*--accessibility-letter-spacing:/s);
    expect(accessibilityCss).toMatch(/:where\(main, \.site-footer, \[role="dialog"\], \.site-search__dropdown, \.cookie-banner, \.accessibility-panel\)[\s\S]*letter-spacing:\s*var\(--accessibility-letter-spacing\)/);
    expect(accessibilityCss).toMatch(/:where\([^)]*th, td, \.footer-bottom > span[^)]*\)\s*\{[^}]*letter-spacing:\s*var\(--accessibility-letter-spacing\)[^}]*line-height:\s*var\(--accessibility-line-height\)/s);
    expect(accessibilityCss).toMatch(/\[data-accessibility-line-height="medium"\]\s*\{[^}]*--accessibility-line-height:/s);
    expect(accessibilityCss).toMatch(/\[data-accessibility-line-height="large"\]\s*\{[^}]*--accessibility-line-height:/s);
    expect(accessibilityCss).toMatch(/:where\(main, \.site-footer, \[role="dialog"\], \.site-search__dropdown, \.cookie-banner, \.accessibility-panel\)[\s\S]*line-height:\s*var\(--accessibility-line-height\)/);
    expect(accessibilityCss).toMatch(/\[data-accessibility-paragraph-spacing="large"\]\s*\{[^}]*--accessibility-paragraph-spacing:/s);
    expect(accessibilityCss).toMatch(/:where\(main, \.site-footer, \[role="dialog"\], \.site-search__dropdown, \.cookie-banner, \.accessibility-panel\)[\s\S]*margin-block-end:\s*var\(--accessibility-paragraph-spacing\)/);
    expect(accessibilityCss).toMatch(/\.brand[^}]*letter-spacing:\s*normal/s);
  });

  it('renders compact image alternatives while leaving logos and functional SVG alone', () => {
    expect(accessibilityCss).toMatch(/\.accessibility-image-alternative\s*\{[^}]*display:\s*block[^}]*max-inline-size:\s*100%[^}]*border:\s*var\(--border-width-strong\)\s+solid\s+var\(--color-border-strong\)[^}]*overflow-wrap:\s*anywhere/s);
    expect(accessibilityCss).not.toMatch(/(?:\.brand|svg)[^{]*\{[^}]*(?:display:\s*none|visibility:\s*hidden)/s);
  });

  it('keeps toolbar controls reachable, comfortably sized, and visibly focused', () => {
    const values = declarations(tokensCss);
    const minimum = Number.parseFloat(resolveToken(values, '--accessibility-control-min-block-size'));
    const primary = Number.parseFloat(resolveToken(values, '--accessibility-action-min-block-size'));

    expect(minimum).toBeGreaterThanOrEqual(1.5);
    expect(primary).toBeGreaterThanOrEqual(2.75);
    expect(primary).toBeLessThanOrEqual(3);
    expect(accessibilityCss).toMatch(/\.accessibility-panel button\s*\{[^}]*min-block-size:\s*var\(--accessibility-control-min-block-size\)/s);
    expect(accessibilityCss).toMatch(/\.accessibility-panel__heading button,\s*\.accessibility-panel__actions button\s*\{[^}]*min-block-size:\s*var\(--accessibility-action-min-block-size\)/s);
    expect(accessibilityCss).toMatch(/\.accessibility-panel button:focus-visible\s*\{[^}]*outline:\s*var\(--focus-ring-width\)\s+solid\s+var\(--color-focus\)[^}]*outline-offset:\s*var\(--focus-ring-offset\)/s);
  });

  it('uses an intrinsic one-column mobile panel and a compact wrapping desktop grid', () => {
    const panelBlock = accessibilityCss.match(/\.accessibility-panel\s*\{([^}]*)\}/)?.[1] ?? '';
    const panelButtonsBlock = accessibilityCss.match(/\.accessibility-panel button\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(panelBlock).toMatch(/max-inline-size:\s*100%/);
    expect(panelBlock).not.toMatch(/position:\s*(?:fixed|sticky|absolute)|(?:block-size|height):/);
    expect(accessibilityCss).toMatch(/\.accessibility-panel__groups\s*\{[^}]*grid-template-columns:\s*minmax\(var\(--space-0\),\s*1fr\)/s);
    expect(accessibilityCss).toMatch(/\.accessibility-panel__choices\s*\{[^}]*flex-wrap:\s*wrap/s);
    expect(accessibilityCss).toMatch(/@media\s*\(min-width:\s*48rem\)[\s\S]*?\.accessibility-panel__groups\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(var\(--accessibility-panel-group-min-inline-size\),\s*1fr\)\)/s);
    expect(accessibilityCss).not.toMatch(/overflow-x:\s*(?:auto|scroll)|100vw|position:\s*(?:fixed|sticky)/);
    expect(panelButtonsBlock).not.toMatch(/(?:^|\s)inline-size:/m);
  });

  it('releases the sticky header while the in-flow accessibility panel is open', () => {
    expect(accessibilityCss).toMatch(/\.site-header:has\(\.accessibility-panel:not\(\[hidden\]\)\)\s*\{[^}]*position:\s*static/s);
  });

  it('limits panel motion to opacity and a small block-axis transform and disables it when reduced', () => {
    expect(accessibilityCss).toMatch(/@keyframes\s+accessibility-panel-enter\s*\{[\s\S]*opacity:[\s\S]*translateY\(var\(--accessibility-panel-motion-distance\)\)[\s\S]*transform:\s*none/s);
    expect(accessibilityCss).not.toMatch(/@keyframes\s+accessibility-panel-enter\s*\{[\s\S]*translateX|scale\(/s);
    expect(accessibilityCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.accessibility-panel\s*\{[^}]*animation:\s*none[^}]*transform:\s*none/s);
  });

  it('keeps primitives and raw colors private to tokens.css and removes the legacy selector', () => {
    const consumingCss = readdirSync('src/styles')
      .filter((name) => name.endsWith('.css') && name !== 'tokens.css')
      .map((name) => readFileSync(`src/styles/${name}`, 'utf8'))
      .join('\n');

    expect(consumingCss).not.toMatch(/var\(--primitive-/);
    expect(consumingCss).not.toMatch(/#[0-9a-f]{3,8}\b|(?:rgb|hsl|oklch)\(/i);
    expect(consumingCss).not.toContain(['.', 'vision-mode'].join(''));
    expect(accessibilityCss).not.toMatch(/https?:\/\/|@import\s+url/);
  });
});
