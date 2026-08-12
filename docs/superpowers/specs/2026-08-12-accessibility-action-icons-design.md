# Accessibility Action Icons Design

## Goal

Make the compact accessibility toolbar action buttons visually balanced: speaker and gear icons remain to the left of their labels, while the collapse chevron sits to the right of «Свернуть».

## Design

- Use one shared action-button layout class with two explicit grid columns so SVG icons cannot jump above their labels.
- Wrap every icon-bearing action label in a span to make icon/label ordering deterministic.
- Speaker and advanced-settings buttons use `icon | label`; collapse uses `label | icon`.
- Keep labels centered, icons non-shrinking, touch targets at least 44px, wrapping available at 200% text scale, and existing focus/reduced-motion/theme behavior unchanged.
- Do not add an icon to «Обычная версия сайта».

## Verification

- Template tests assert classes, child order, and accessible text.
- CSS tests assert the two-column layout, vertical centering, gap, and collapse-column reversal.
- Rebuild all 21 pages and inspect the toolbar at mobile and desktop widths.
