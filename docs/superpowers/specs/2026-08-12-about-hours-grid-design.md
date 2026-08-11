# About Page Hours Grid Design

## Goal

Replace the vertical working-hours list in the final about-page appointment panel with a compact, scannable schedule grid.

## Approved composition

- Keep the schedule in the right side of the existing appointment panel.
- Place the clock icon and “Режим работы” heading on one line.
- Render four equal schedule cells: weekdays, Saturday, Sunday and the existing “Без перерыва” note.
- Use a 2×2 grid on narrow screens and a single four-cell row at the existing `75rem` desktop breakpoint.
- Keep all copy sourced from `HOURS`; do not change opening times or appointment behavior.
- Reuse existing semantic tokens, borders, surfaces and typography. Add no new colors or dependencies.

## Responsive and accessibility requirements

- The definition list remains semantic `<dl>` markup.
- Every cell can wrap without causing horizontal overflow at 320 px or in vision mode.
- The clock icon is decorative and rendered through the existing SVG icon helper.
- The fixed mobile appointment action must not cover the last schedule row.

## Verification

- Content test asserts four cells and exact values.
- Style test asserts two base columns and four desktop columns.
- Run the complete project verification gate and inspect the block at mobile and desktop widths.
