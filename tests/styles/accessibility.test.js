import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readStyle = (name) => {
  const path = `src/styles/${name}.css`;
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
};

const tokensCss = readStyle('tokens');
const accessibilityCss = readStyle('accessibility');
const componentsCss = readStyle('components');
const layoutCss = readStyle('layout');

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

  it('reflows the accessibility header safely at 320px and 200% text', () => {
    const values = declarations(tokensCss);
    const pixelValue = (name) => {
      const value = resolveToken(values, name);
      expect(value).toMatch(/^\d+(?:\.\d+)?px$/);
      return Number.parseFloat(value);
    };
    const viewport = 320;
    const gutter = pixelValue('--accessibility-header-inline-gutter');
    const mark = pixelValue('--accessibility-header-mark-size');
    const brandGap = pixelValue('--accessibility-header-brand-gap');
    const wordmark = pixelValue('--accessibility-header-wordmark-inline-size');
    const control = pixelValue('--accessibility-header-control-size');
    const rowGap = pixelValue('--accessibility-header-row-gap');
    const available = viewport - (gutter * 2);
    const occupied = mark + brandGap + wordmark + (control * 2) + (rowGap * 2);

    expect(control).toBeGreaterThanOrEqual(44);
    expect(occupied).toBeLessThanOrEqual(available);
    expect(accessibilityCss).toMatch(/@media\s*\(max-width:\s*30rem\)[\s\S]*?html\[data-accessibility-enabled="true"\]\s+\.site-header\s+\.header-shell\s*\{[^}]*width:\s*min\(calc\(100%\s*-\s*\(var\(--accessibility-header-inline-gutter\)\s*\*\s*2\)\),\s*var\(--header-container-max\)\)/s);
    expect(accessibilityCss).toMatch(/@media\s*\(max-width:\s*30rem\)[\s\S]*?html\[data-accessibility-enabled="true"\]\s+\.brand-row__inner\s*\{[^}]*grid-template-columns:\s*minmax\(var\(--space-0\),\s*1fr\)\s+repeat\(2,\s*var\(--accessibility-header-control-size\)\)[^}]*gap:\s*var\(--accessibility-header-row-gap\)/s);
    expect(accessibilityCss).toMatch(/html\[data-accessibility-enabled="true"\]\s+\.brand__wordmark\s*\{[^}]*inline-size:\s*var\(--accessibility-header-wordmark-inline-size\)[^}]*font-size:\s*var\(--accessibility-header-wordmark-font-size\)/s);
    expect(accessibilityCss).toMatch(/html\[data-accessibility-enabled="true"\]\s+:where\(\.site-search__toggle, \.menu-toggle\)\s*\{[^}]*inline-size:\s*var\(--accessibility-header-control-size\)[^}]*block-size:\s*var\(--accessibility-header-control-size\)/s);
    expect(accessibilityCss).toMatch(/html\[data-accessibility-enabled="true"\]\s+\.site-search__field\s*\{[^}]*grid-template-columns:\s*var\(--accessibility-header-icon-size\)\s+minmax\(var\(--space-0\),\s*1fr\)\s+repeat\(2,\s*var\(--accessibility-header-control-size\)\)/s);
    expect(accessibilityCss).not.toMatch(/@media\s*\(max-width:\s*30rem\)[\s\S]*?html\[data-accessibility-enabled="true"\][\s\S]*?overflow-x:\s*(?:hidden|clip)/s);
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

  it.each(['standard', 'black-white', 'white-black', 'blue-light'])(
    'keeps regular and strong UI boundaries at three to one in the %s theme',
    (theme) => {
      const themeTokens = themeDeclarations(theme);
      const values = new Map([...declarations(tokensCss), ...themeTokens]);
      const color = (name) => resolveToken(values, name);

      expect(contrastRatio(color('--color-border'), color('--color-surface-page'))).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(color('--color-border'), color('--color-surface-raised'))).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(color('--color-border-strong'), color('--notice-background'))).toBeGreaterThanOrEqual(3);
      expect(componentsCss).toMatch(/\[role="tab"\]\s*\{[^}]*border:\s*var\(--border-width\)\s+solid\s+var\(--color-border\)[^}]*background:\s*var\(--color-surface-raised\)/s);
      expect(accessibilityCss).toMatch(/\.accessibility-image-alternative\s*\{[^}]*border:\s*var\(--border-width-strong\)\s+solid\s+var\(--color-border-strong\)[^}]*background:\s*var\(--notice-background\)/s);
    },
  );

  it.each(['standard', 'black-white', 'white-black', 'blue-light'])(
    'makes the actual hero scrim chain contrast-safe in the %s theme',
    (theme) => {
      const themeTokens = themeDeclarations(theme);
      const values = new Map([...declarations(tokensCss), ...themeTokens]);
      const color = (name) => resolveToken(values, name);

      expect(layoutCss).toMatch(/\.page-hero\s*\{[^}]*background-image:\s*var\(--layout-hero-scrim\),\s*var\(--hero-image, none\)/s);
      expect(themeTokens.get('--layout-hero-scrim')).toBe('linear-gradient(var(--color-surface-page), var(--color-surface-page))');
      expect(contrastRatio(color('--color-text'), color('--color-surface-page'))).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(color('--color-text-muted'), color('--color-surface-page'))).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('inherits readable typography through addresses and status copy while resetting controls', () => {
    const readableRegion = accessibilityCss.match(/\[data-accessibility-enabled="true"\]\s+:where\(main, \.site-footer, \[role="dialog"\], \.site-search__dropdown, \.cookie-banner, \.accessibility-panel\)\s*\{([^}]*)\}/)?.[1] ?? '';
    const controlReset = accessibilityCss.match(/\[data-accessibility-enabled="true"\]\s+:where\(\.button, button, input, select, textarea, \[role="button"\], \[role="tab"\], \[data-disclosure-button\]\)\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(accessibilityCss).toMatch(/\[data-accessibility-font="sans"\]\s*\{[^}]*--font-body:\s*var\(--accessibility-font-sans\)[^}]*--font-heading:\s*var\(--accessibility-font-sans\)/s);
    expect(accessibilityCss).toMatch(/\[data-accessibility-letter-spacing="medium"\]\s*\{[^}]*--accessibility-letter-spacing:/s);
    expect(accessibilityCss).toMatch(/\[data-accessibility-letter-spacing="large"\]\s*\{[^}]*--accessibility-letter-spacing:/s);
    expect(readableRegion).toMatch(/letter-spacing:\s*var\(--accessibility-letter-spacing\)/);
    expect(readableRegion).toMatch(/line-height:\s*var\(--accessibility-line-height\)/);
    expect(accessibilityCss).toMatch(/\[data-accessibility-line-height="medium"\]\s*\{[^}]*--accessibility-line-height:/s);
    expect(accessibilityCss).toMatch(/\[data-accessibility-line-height="large"\]\s*\{[^}]*--accessibility-line-height:/s);
    expect(accessibilityCss).toMatch(/\[data-accessibility-paragraph-spacing="large"\]\s*\{[^}]*--accessibility-paragraph-spacing:/s);
    expect(accessibilityCss).toMatch(/:where\(main, \.site-footer, \[role="dialog"\], \.site-search__dropdown, \.cookie-banner, \.accessibility-panel\)[\s\S]*margin-block-end:\s*var\(--accessibility-paragraph-spacing\)/);
    expect(controlReset).toMatch(/letter-spacing:\s*normal/);
    expect(controlReset).toMatch(/line-height:\s*var\(--button-line-height\)/);
    expect(controlReset).not.toContain('var(--accessibility-line-height)');
    expect(accessibilityCss).toMatch(/\.brand[^}]*letter-spacing:\s*normal[^}]*line-height:\s*var\(--brand-line-height\)/s);
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
