import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readStyle = (name) => {
  const path = `src/styles/${name}.css`;
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
};

const tokensCss = readStyle('tokens');
const accessibilityCss = readStyle('accessibility');
const baseCss = readStyle('base');
const componentsCss = readStyle('components');
const layoutCss = readStyle('layout');
const siteSearchCss = readStyle('site-search');
const pagesCss = readStyle('pages');

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

const effectiveToolbarFlexBasis = (variantClass) => {
  let winner = { specificity: -1, order: -1, value: undefined };
  let order = 0;

  for (const rule of accessibilityCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const rawSelector of rule[1].split(',')) {
      const selector = rawSelector.trim();
      const matchesGeneric = selector === '.accessibility-toolbar > .accessibility-panel__group';
      const matchesVariant = selector.endsWith(`.${variantClass}`);
      if (!matchesGeneric && !matchesVariant) continue;

      const flexBasis = rule[2].match(/(?:^|;)\s*flex-basis:\s*(var\(--[a-z0-9-]+\))/)?.[1]
        ?? rule[2].match(/(?:^|;)\s*flex:\s*[^;]*?(var\(--[a-z0-9-]+\))\s*;?/)?.[1];
      if (!flexBasis) continue;

      const specificity = (selector.match(/\.[a-z0-9_-]+/gi) ?? []).length;
      if (specificity > winner.specificity || (specificity === winner.specificity && order > winner.order)) {
        winner = { specificity, order, value: flexBasis };
      }
      order += 1;
    }
  }

  return winner.value;
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
      '--accessibility-toolbar-group-basis:',
      '--accessibility-dialog-max-inline-size:',
      '--accessibility-dialog-max-block-size:',
      '--accessibility-dialog-z-index:',
      '--accessibility-theme-swatch-size:',
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

  it('reflows the accessibility header continuously from 320px through 768px at 200% text', () => {
    const values = declarations(tokensCss);
    const pixelValue = (name) => {
      const value = resolveToken(values, name);
      expect(value).toMatch(/^\d+(?:\.\d+)?px$/);
      return Number.parseFloat(value);
    };
    const gutter = pixelValue('--accessibility-header-inline-gutter');
    const mark = pixelValue('--accessibility-header-mark-size');
    const brandGap = pixelValue('--accessibility-header-brand-gap');
    const wordmark = pixelValue('--accessibility-header-wordmark-inline-size');
    const control = pixelValue('--accessibility-header-control-size');
    const rowGap = pixelValue('--accessibility-header-row-gap');
    const occupied = mark + brandGap + wordmark + (control * 2) + (rowGap * 2);
    const openSearchMinimum = pixelValue('--accessibility-header-icon-size')
      + (control * 3)
      + (pixelValue('--accessibility-header-field-gap') * 3);

    expect(control).toBeGreaterThanOrEqual(44);
    for (const viewport of [320, 390, 480, 481, 600, 768]) {
      const available = viewport - (gutter * 2);
      expect(occupied, `closed header at ${viewport}px`).toBeLessThanOrEqual(available);
      expect(openSearchMinimum, `open search at ${viewport}px`).toBeLessThanOrEqual(available);
    }

    expect(accessibilityCss).toMatch(/@media\s*\(max-width:\s*48rem\)[\s\S]*?html\[data-accessibility-enabled="true"\]\s+\.site-header\s+\.header-shell\s*\{[^}]*width:\s*min\(calc\(100%\s*-\s*\(var\(--accessibility-header-inline-gutter\)\s*\*\s*2\)\),\s*var\(--header-container-max\)\)/s);
    expect(accessibilityCss).toMatch(/@media\s*\(max-width:\s*48rem\)[\s\S]*?html\[data-accessibility-enabled="true"\]\s+\.brand-row__inner\s*\{[^}]*grid-template-columns:\s*minmax\(var\(--space-0\),\s*1fr\)\s+repeat\(2,\s*var\(--accessibility-header-control-size\)\)[^}]*gap:\s*var\(--accessibility-header-row-gap\)/s);
    expect(accessibilityCss).toMatch(/html\[data-accessibility-enabled="true"\]\s+\.brand__legal-name\s*\{[^}]*min-inline-size:\s*var\(--space-0\)[^}]*max-inline-size:\s*100%[^}]*overflow-wrap:\s*anywhere/s);
    expect(accessibilityCss).toMatch(/html\[data-accessibility-enabled="true"\]\s+:where\(\.site-search__toggle, \.menu-toggle\)\s*\{[^}]*inline-size:\s*var\(--accessibility-header-control-size\)[^}]*block-size:\s*var\(--accessibility-header-control-size\)/s);
    expect(accessibilityCss).toMatch(/html\[data-accessibility-enabled="true"\]\s+\.site-search__field\s*\{[^}]*grid-template-columns:\s*var\(--accessibility-header-icon-size\)\s+minmax\(var\(--space-0\),\s*1fr\)\s+repeat\(2,\s*var\(--accessibility-header-control-size\)\)/s);
    expect(accessibilityCss).not.toMatch(/@media\s*\(max-width:\s*30rem\)/);
    const rootBlocks = [...accessibilityCss.matchAll(/html\[data-accessibility-enabled="true"\](?:\[[^\]]+\])*\s*\{([^}]*)\}/g)]
      .map((match) => match[1]).join('\n');
    expect(rootBlocks).not.toMatch(/overflow-x:\s*(?:hidden|clip)/);
    expect(accessibilityCss).not.toMatch(/html\[data-accessibility-enabled="true"\][^{]*\s+body\s*\{[^}]*overflow-x:\s*(?:hidden|clip)/s);
  });

  it('contains page actions and footer contacts at 320px with 200% text', () => {
    const consumerRule = accessibilityCss.match(/html\[data-accessibility-enabled="true"\]\[data-accessibility-scale="200"\]\s+:where\(main, \.site-footer\)\s+:where\(\.button, a\)\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(consumerRule).toMatch(/min-inline-size:\s*var\(--space-0\)/);
    expect(consumerRule).toMatch(/max-inline-size:\s*100%/);
    expect(consumerRule).toMatch(/overflow-wrap:\s*anywhere/);
    expect(consumerRule).not.toMatch(/min-block-size:/);
  });

  it('contains readable section headings and decoration for every 200% spacing combination', () => {
    const headingLayoutRule = accessibilityCss.match(/html\[data-accessibility-enabled="true"\]\[data-accessibility-scale="200"\]\s+:where\(\.section-heading, \.about-section__heading, \.specialists-section__heading\)\s*>\s*\*\s*\{([^}]*)\}/)?.[1] ?? '';
    const readableHeadingRule = accessibilityCss.match(/html\[data-accessibility-enabled="true"\]\[data-accessibility-scale="200"\]\s+main\s+:where\(h1, h2, h3, h4, h5, h6, \.eyebrow\)\s*\{([^}]*)\}/)?.[1] ?? '';
    const decorationRule = accessibilityCss.match(/html\[data-accessibility-enabled="true"\]\[data-accessibility-scale="200"\]\s+\.home-decor\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(headingLayoutRule).toMatch(/min-inline-size:\s*var\(--space-0\)/);
    expect(headingLayoutRule).toMatch(/max-inline-size:\s*100%/);
    expect(readableHeadingRule).toMatch(/max-inline-size:\s*100%/);
    expect(readableHeadingRule).toMatch(/overflow-wrap:\s*anywhere/);
    expect(decorationRule).toMatch(/max-inline-size:\s*100%/);
    expect(accessibilityCss).not.toMatch(/html\[data-accessibility-enabled="true"\][^{]*overflow-x:\s*(?:hidden|clip)/s);
  });

  it('collapses intrinsic card widths at the 320px maximum text-spacing combination', () => {
    const maximumSettings = 'html\\[data-accessibility-enabled="true"\\]\\[data-accessibility-scale="200"\\]\\[data-accessibility-letter-spacing="large"\\]\\[data-accessibility-line-height="large"\\]\\[data-accessibility-paragraph-spacing="large"\\]';
    const grids = accessibilityCss.match(new RegExp(`${maximumSettings}\\s+:where\\(\\.quick-links__grid, \\.home-services__grid, \\.home-staff__grid, \\.home-patients__grid, \\.home-documents__cards, \\.footer-grid\\)\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    const cards = accessibilityCss.match(new RegExp(`${maximumSettings}\\s+:where\\(\\.quick-card, \\.home-service-card, \\.home-staff-card, \\.home-price-panel, \\.patient-link-card, \\.document-card, \\.footer-grid > section\\)\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    const text = accessibilityCss.match(new RegExp(`${maximumSettings}\\s+:where\\(main, \\.site-footer\\)\\s+:where\\(h1, h2, h3, h4, h5, h6, p, ul, ol, li, a, strong, small, span\\)\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    const cardActions = accessibilityCss.match(new RegExp(`${maximumSettings}\\s+:where\\(\\.quick-card a, \\.home-service-card a, \\.text-link\\)\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    const endDecoration = accessibilityCss.match(/html\[data-accessibility-enabled="true"\]\[data-accessibility-scale="200"\]\s+:where\(\.home-decor--hero-tooth, \.home-decor--quick-tooth, \.home-decor--services-dental, \.home-decor--patients-docs\)\s*\{([^}]*)\}/)?.[1] ?? '';
    const startDecoration = accessibilityCss.match(/html\[data-accessibility-enabled="true"\]\[data-accessibility-scale="200"\]\s+:where\(\.home-decor--hero-smile, \.home-decor--staff-jaw\)\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(grids).toMatch(/grid-template-columns:\s*minmax\(var\(--space-0\),\s*1fr\)/);
    expect(cards).toMatch(/min-inline-size:\s*var\(--space-0\)/);
    expect(cards).toMatch(/inline-size:\s*100%/);
    expect(cards).toMatch(/max-inline-size:\s*100%/);
    expect(text).toMatch(/max-inline-size:\s*100%/);
    expect(text).toMatch(/overflow-wrap:\s*anywhere/);
    expect(cardActions).toMatch(/grid-template-columns:\s*minmax\(var\(--space-0\),\s*1fr\)\s+auto/);
    expect(endDecoration).toMatch(/inset-inline-end:\s*var\(--space-0\)/);
    expect(startDecoration).toMatch(/inset-inline-start:\s*var\(--space-0\)/);
  });

  it('keeps the advanced dialog vertical-only and usable at the maximum text-spacing combination', () => {
    const maximumSettings = 'html\\[data-accessibility-enabled="true"\\]\\[data-accessibility-scale="200"\\]\\[data-accessibility-letter-spacing="large"\\]\\[data-accessibility-line-height="large"\\]\\[data-accessibility-paragraph-spacing="large"\\]';
    const panel = accessibilityCss.match(new RegExp(`${maximumSettings}\\s+\\.accessibility-settings-dialog__panel\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    const titleAndLegend = accessibilityCss.match(new RegExp(`${maximumSettings}\\s+\\.accessibility-settings-dialog\\s+:where\\(h2, legend\\)\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    const internals = accessibilityCss.match(new RegExp(`${maximumSettings}\\s+:where\\(\\.accessibility-settings-dialog__groups, \\.accessibility-settings-dialog \\.accessibility-panel__group, \\.accessibility-settings-dialog \\.accessibility-panel__choices\\)\\s*\\{([^}]*)\\}`))?.[1] ?? '';

    expect(panel).toMatch(/overflow-x:\s*hidden/);
    expect(panel).toMatch(/padding:\s*var\(--space-3\)/);
    expect(titleAndLegend).toMatch(/max-inline-size:\s*100%/);
    expect(titleAndLegend).toMatch(/letter-spacing:\s*normal/);
    expect(titleAndLegend).toMatch(/overflow-wrap:\s*anywhere/);
    expect(internals).toMatch(/min-inline-size:\s*var\(--space-0\)/);
    expect(internals).toMatch(/max-inline-size:\s*100%/);
  });

  it('uses compact layout primitives at 200% even on desktop viewports', () => {
    const scaleLayout = accessibilityCss.match(/html\[data-accessibility-enabled="true"\]\[data-accessibility-scale="200"\]\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(scaleLayout).toMatch(/--layout-footer-columns:\s*minmax\(var\(--space-0\),\s*1fr\)/);
    expect(scaleLayout).toMatch(/--layout-service-columns:\s*minmax\(var\(--space-0\),\s*1fr\)/);
    expect(scaleLayout).toMatch(/--layout-card-columns:\s*minmax\(var\(--space-0\),\s*1fr\)/);
    expect(scaleLayout).toMatch(/--layout-feature-columns:\s*minmax\(var\(--space-0\),\s*1fr\)/);
    expect(scaleLayout).toMatch(/--layout-split-columns:\s*minmax\(var\(--space-0\),\s*1fr\)/);
    expect(scaleLayout).toMatch(/--layout-services-tabs-display:\s*none/);
    expect(scaleLayout).toMatch(/--layout-services-disclosures-display:\s*grid/);

    const maximumGridRule = accessibilityCss.indexOf('html[data-accessibility-enabled="true"][data-accessibility-scale="200"][data-accessibility-letter-spacing="large"][data-accessibility-line-height="large"][data-accessibility-paragraph-spacing="large"] :where(.quick-links__grid');
    expect(maximumGridRule).toBeGreaterThanOrEqual(0);
    expect(maximumGridRule).toBeLessThan(accessibilityCss.indexOf('@media (max-width: 48rem)'));
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
      expect(contrastRatio(color('--color-primary-strong'), color('--color-surface-raised'))).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(color('--color-text'), color('--notice-background'))).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(color('--button-primary-text'), color('--button-primary-background'))).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(color('--accessibility-segment-selected-text'), color('--accessibility-segment-selected-background'))).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(color('--accessibility-segment-unselected-text'), color('--accessibility-segment-unselected-background'))).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(color('--color-border-strong'), color('--color-surface-page'))).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(color('--color-focus'), color('--color-surface-page'))).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(color('--color-focus'), color('--color-surface-raised'))).toBeGreaterThanOrEqual(3);
    },
  );

  it.each(['standard', 'black-white', 'white-black', 'blue-light'])(
    'keeps regular and strong UI boundaries at three to one in the %s theme',
    (theme) => {
      const themeTokens = themeDeclarations(theme);
      const values = new Map([...declarations(tokensCss), ...themeTokens]);
      const color = (name) => resolveToken(values, name);

      expect(contrastRatio(color('--accessibility-toolbar-group-border'), color('--color-surface-page'))).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(color('--accessibility-toolbar-group-border'), color('--accessibility-toolbar-group-background'))).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(color('--accessibility-dialog-border'), color('--accessibility-dialog-background'))).toBeGreaterThanOrEqual(3);
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

  it('wins the computed typography cascade for explicit readable selectors, then resets controls, brand, and icons', () => {
    const readableRule = accessibilityCss.match(/(\[data-accessibility-enabled="true"\]\[data-accessibility-letter-spacing\]\[data-accessibility-line-height\][^{]+)\{([^}]*)\}/);
    const readableSelector = readableRule?.[1] ?? '';
    const readableBlock = readableRule?.[2] ?? '';
    const controlResetIndex = accessibilityCss.indexOf('[data-accessibility-enabled="true"][data-accessibility-letter-spacing][data-accessibility-line-height] :where(.button');
    const readableIndex = readableRule?.index ?? -1;

    expect(accessibilityCss).toMatch(/\[data-accessibility-font="sans"\]\s*\{[^}]*--font-body:\s*var\(--accessibility-font-sans\)[^}]*--font-heading:\s*var\(--accessibility-font-sans\)/s);
    expect(accessibilityCss).toMatch(/\[data-accessibility-letter-spacing="medium"\]\s*\{[^}]*--accessibility-letter-spacing:/s);
    expect(accessibilityCss).toMatch(/\[data-accessibility-letter-spacing="large"\]\s*\{[^}]*--accessibility-letter-spacing:/s);
    for (const region of ['main', '.site-footer', '[role="dialog"]', '.site-search__dropdown', '.cookie-banner', '.accessibility-panel']) {
      expect(readableSelector).toContain(region);
    }
    for (const readable of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'legend', 'p', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'th', 'td', 'address', '[role="status"]', 'span']) {
      expect(readableSelector).toContain(readable);
    }
    expect(readableSelector.match(/\[data-accessibility-/g)).toHaveLength(3);
    expect(readableBlock).toMatch(/letter-spacing:\s*var\(--accessibility-letter-spacing\)/);
    expect(readableBlock).toMatch(/line-height:\s*var\(--accessibility-line-height\)/);
    expect(accessibilityCss).toMatch(/\[data-accessibility-line-height="medium"\]\s*\{[^}]*--accessibility-line-height:/s);
    expect(accessibilityCss).toMatch(/\[data-accessibility-line-height="large"\]\s*\{[^}]*--accessibility-line-height:/s);
    expect(accessibilityCss).toMatch(/\[data-accessibility-paragraph-spacing="large"\]\s*\{[^}]*--accessibility-paragraph-spacing:/s);
    expect(accessibilityCss).toMatch(/\[data-accessibility-enabled="true"\]\[data-accessibility-paragraph-spacing\][^{]+:where\(p, ul, ol, dl\)\s*\{[^}]*margin-block-end:\s*var\(--accessibility-paragraph-spacing\)/s);
    expect(baseCss).toMatch(/h1,[\s\S]*letter-spacing:\s*var\(--text-heading-letter-spacing\)/);
    expect(layoutCss).toMatch(/\.site-footer h2\s*\{[^}]*letter-spacing:\s*normal/s);
    expect(siteSearchCss).toMatch(/\.site-search__result-category\s*\{[^}]*letter-spacing:\s*var\(--text-label-letter-spacing\)/s);
    expect(pagesCss).toMatch(/\.about-fact dt\s*\{[^}]*line-height:\s*var\(--text-heading-line-height\)/s);
    expect(controlResetIndex).toBeGreaterThan(readableIndex);
    expect(accessibilityCss.slice(controlResetIndex)).toMatch(/:where\(\.button[\s\S]*button \*[\s\S]*\{[^}]*letter-spacing:\s*normal[^}]*line-height:\s*var\(--button-line-height\)/s);
    expect(accessibilityCss.slice(controlResetIndex)).toMatch(/:where\(\.brand, \.brand \*\)\s*\{[^}]*letter-spacing:\s*normal[^}]*line-height:\s*var\(--brand-line-height\)/s);
    expect(accessibilityCss.slice(controlResetIndex)).toMatch(/:where\(\.ui-icon, \.button-icon, \.header-icon, \.footer-icon/);
  });

  it('renders compact image alternatives while leaving logos and functional SVG alone', () => {
    expect(accessibilityCss).toMatch(/\.accessibility-image-alternative\s*\{[^}]*display:\s*block[^}]*max-inline-size:\s*100%[^}]*border:\s*var\(--border-width-strong\)\s+solid\s+var\(--color-border-strong\)[^}]*overflow-wrap:\s*anywhere/s);
    expect(accessibilityCss).not.toMatch(/(?:\.brand|svg)[^{]*\{[^}]*(?:display:\s*none|visibility:\s*hidden)/s);
  });

  it('keeps toolbar controls reachable, comfortably sized, and visibly focused', () => {
    const values = declarations(tokensCss);
    const minimum = resolveToken(values, '--accessibility-control-min-block-size');
    const primary = resolveToken(values, '--accessibility-action-min-block-size');

    expect(minimum).toBe('44px');
    expect(primary).toBe('44px');
    expect(accessibilityCss).toMatch(/\.accessibility-panel button,\s*\.accessibility-settings-dialog button\s*\{[^}]*min-block-size:\s*var\(--accessibility-control-min-block-size\)/s);
    expect(accessibilityCss).toMatch(/:where\(\[data-accessibility-advanced-open\], \[data-accessibility-standard\], \[data-accessibility-close\], \[data-accessibility-reset\], \[data-accessibility-dialog-close\]\)[^{]*\{[^}]*min-block-size:\s*var\(--accessibility-action-min-block-size\)/s);
    expect(accessibilityCss).toMatch(/\.accessibility-panel button:focus-visible,\s*\.accessibility-settings-dialog button:focus-visible\s*\{[^}]*outline:\s*var\(--focus-ring-width\)\s+solid\s+var\(--color-focus\)[^}]*outline-offset:\s*var\(--focus-ring-offset\)/s);
  });

  it('keeps action icons beside their labels and places the collapse chevron last', () => {
    const actionRule = accessibilityCss.match(/\.accessibility-action-button\s*\{([^}]*)\}/)?.[1] ?? '';
    const labelRule = accessibilityCss.match(/\.accessibility-action-button__label\s*\{([^}]*)\}/)?.[1] ?? '';
    const collapseRule = accessibilityCss.match(/\.accessibility-action-button--collapse\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(actionRule).toMatch(/display:\s*grid/);
    expect(actionRule).toMatch(/grid-template-columns:\s*auto\s+minmax\(var\(--space-0\),\s*1fr\)/);
    expect(actionRule).toMatch(/align-items:\s*center/);
    expect(actionRule).toMatch(/gap:\s*var\(--space-2\)/);
    expect(actionRule).toMatch(/text-align:\s*center/);
    expect(labelRule).toMatch(/min-inline-size:\s*var\(--space-0\)/);
    expect(labelRule).toMatch(/overflow-wrap:\s*anywhere/);
    expect(collapseRule).toMatch(/grid-template-columns:\s*minmax\(var\(--space-0\),\s*1fr\)\s+auto/);
  });

  it('styles the visible local-voice availability message as a compact wrapping notice', () => {
    const notice = accessibilityCss.match(/\.accessibility-panel__availability\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(notice).toMatch(/min-inline-size:\s*var\(--space-0\)/);
    expect(notice).toMatch(/max-inline-size:\s*100%/);
    expect(notice).toMatch(/padding:\s*var\(--space-2\)/);
    expect(notice).toMatch(/border-inline-start:\s*var\(--border-width-strong\)\s+solid\s+var\(--color-primary-strong\)/);
    expect(notice).toMatch(/color:\s*var\(--color-text\)/);
    expect(notice).toMatch(/background:\s*var\(--notice-background\)/);
    expect(notice).toMatch(/overflow-wrap:\s*anywhere/);
    expect(notice).not.toMatch(/(?:^|;)\s*(?:position:\s*(?:absolute|fixed)|inline-size:\s*\d|white-space:\s*nowrap)/);
  });

  it('uses compact intrinsic toolbar groups without a mobile scroller or fixed panel height', () => {
    const panelBlock = accessibilityCss.match(/\.accessibility-panel\s*\{([^}]*)\}/)?.[1] ?? '';
    const panelButtonsBlock = accessibilityCss.match(/\.accessibility-panel button,\s*\.accessibility-settings-dialog button\s*\{([^}]*)\}/)?.[1] ?? '';
    const toolbarBlock = accessibilityCss.match(/\.accessibility-toolbar\s*\{([^}]*)\}/)?.[1] ?? '';
    const groupBlock = accessibilityCss.match(/\.accessibility-toolbar\s*>\s*\.accessibility-panel__group\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(panelBlock).toMatch(/max-inline-size:\s*100%/);
    expect(panelBlock).not.toMatch(/position:\s*(?:fixed|sticky|absolute)|(?:block-size|height):/);
    expect(toolbarBlock).toMatch(/display:\s*flex/);
    expect(toolbarBlock).toMatch(/flex-wrap:\s*wrap/);
    expect(toolbarBlock).toMatch(/align-items:\s*stretch/);
    expect(groupBlock).toMatch(/flex:\s*1 1 var\(--accessibility-toolbar-group-basis\)/);
    expect(accessibilityCss).toMatch(/\.accessibility-panel__choices\s*\{[^}]*flex-wrap:\s*wrap/s);
    expect(`${panelBlock}\n${toolbarBlock}`).not.toMatch(/overflow-x:\s*(?:auto|scroll)|100vw|(?:block-size|height):/s);
    expect(panelButtonsBlock).not.toMatch(/(?:^|\s)inline-size:/m);
  });

  it('computes the intended flex basis for every live toolbar group', () => {
    const values = declarations(tokensCss);
    const expected = new Map([
      ['accessibility-toolbar__scale', '--accessibility-toolbar-scale-group-basis'],
      ['accessibility-toolbar__themes', '--accessibility-toolbar-theme-group-basis'],
      ['accessibility-toolbar__images', '--accessibility-toolbar-group-basis'],
      ['accessibility-toolbar__speech', '--accessibility-toolbar-group-basis'],
      ['accessibility-toolbar__actions', '--accessibility-toolbar-actions-group-basis'],
    ]);

    for (const [variant, token] of expected) {
      expect(effectiveToolbarFlexBasis(variant), variant).toBe(`var(${token})`);
    }

    const actions = Number.parseFloat(resolveToken(values, '--accessibility-toolbar-actions-group-basis'));
    for (const token of [...expected.values()].filter((name) => name !== '--accessibility-toolbar-actions-group-basis')) {
      expect(actions).toBeGreaterThan(Number.parseFloat(resolveToken(values, token)));
    }
  });

  it('renders the advanced settings dialog as a safe-area-aware topmost scrollable overlay', () => {
    const values = declarations(tokensCss);
    const layer = (name) => Number(resolveToken(values, name));
    const dialog = accessibilityCss.match(/\.accessibility-settings-dialog\s*\{([^}]*)\}/)?.[1] ?? '';
    const backdrop = accessibilityCss.match(/\.accessibility-settings-dialog__backdrop\s*\{([^}]*)\}/)?.[1] ?? '';
    const panel = accessibilityCss.match(/\.accessibility-settings-dialog__panel\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(layer('--accessibility-dialog-z-index')).toBeGreaterThan(layer('--z-cookie'));
    expect(layer('--accessibility-dialog-z-index')).toBeGreaterThan(layer('--z-menu-toggle'));
    expect(dialog).toMatch(/position:\s*fixed/);
    expect(dialog).toMatch(/z-index:\s*var\(--accessibility-dialog-z-index\)/);
    expect(dialog).toMatch(/inset:\s*var\(--space-0\)/);
    expect(dialog).toMatch(/display:\s*grid/);
    expect(dialog).toMatch(/place-items:\s*center/);
    for (const side of ['top', 'right', 'bottom', 'left']) {
      expect(dialog).toContain(`env(safe-area-inset-${side})`);
    }
    expect(backdrop).toMatch(/position:\s*absolute/);
    expect(backdrop).toMatch(/inset:\s*var\(--space-0\)/);
    expect(backdrop).toMatch(/background:\s*var\(--accessibility-dialog-backdrop\)/);
    expect(panel).toMatch(/inline-size:\s*100%/);
    expect(panel).toMatch(/max-inline-size:\s*var\(--accessibility-dialog-max-inline-size\)/);
    expect(panel).toMatch(/max-block-size:\s*var\(--accessibility-dialog-max-block-size\)/);
    expect(panel).toMatch(/overflow-y:\s*auto/);
    expect(accessibilityCss).toMatch(/\.accessibility-settings-dialog__groups\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*var\(--accessibility-dialog-group-basis\)\),\s*1fr\)\)/s);
  });

  it('releases the sticky header while the in-flow accessibility panel is open', () => {
    expect(accessibilityCss).toMatch(/\.site-header:has\(\.accessibility-panel:not\(\[hidden\]\)\)\s*\{[^}]*position:\s*static/s);
  });

  it('limits panel motion to opacity and a small block-axis transform and disables it when reduced', () => {
    expect(accessibilityCss).toMatch(/@keyframes\s+accessibility-panel-enter\s*\{[\s\S]*opacity:[\s\S]*translateY\(var\(--accessibility-panel-motion-distance\)\)[\s\S]*transform:\s*none/s);
    expect(accessibilityCss).not.toMatch(/@keyframes\s+accessibility-panel-enter\s*\{[\s\S]*translateX|scale\(/s);
    expect(accessibilityCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.accessibility-panel\s*\{[^}]*animation:\s*none[^}]*transform:\s*none/s);
    expect(accessibilityCss).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.accessibility-settings-dialog[^}]*\{[^}]*(?:animation|transition):\s*none/s);
  });

  it('removes transition and active transforms from panel and dialog buttons under reduced motion', () => {
    const reducedMotion = accessibilityCss.slice(accessibilityCss.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
    const reset = reducedMotion.match(/\.accessibility-panel button,\s*\.accessibility-panel button:active,\s*\.accessibility-settings-dialog button,\s*\.accessibility-settings-dialog button:active\s*\{([^}]*)\}/)?.[1] ?? '';

    expect(reset).toMatch(/transition:\s*none/);
    expect(reset).toMatch(/transform:\s*none/);
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
