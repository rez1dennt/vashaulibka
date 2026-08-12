const SAFE_DECORATIONS = new Set([
  'hero-smile',
  'hero-tooth',
  'quick-tooth',
  'services-dental',
  'staff-jaw',
  'patients-docs',
]);

export function renderHomeDecoration(name) {
  if (!SAFE_DECORATIONS.has(name)) {
    throw new TypeError(`Unknown home decoration: ${name}`);
  }

  return `<span class="home-decor home-decor--${name}" aria-hidden="true"></span>`;
}
