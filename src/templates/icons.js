const ICONS = Object.freeze({
  document: '<path d="M6 2.75h8l4 4V21.25H6z"/><path d="M14 2.75v4h4M9 12h6M9 16h6"/>',
  team: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19c.4-3.2 2.2-5 5.5-5s5.1 1.8 5.5 5"/><circle cx="17" cy="9" r="2.25"/><path d="M15.5 14.5c2.8-.4 4.6 1.1 5 4"/>',
  tooth: '<path d="M12 3.2C8.8.8 4.5 2.5 4.3 7.2c-.1 2.5 1.2 4.2 2.1 6.1 1 2.1 1 7.5 3.2 7.5 1.5 0 1.3-5.2 2.4-5.2s.9 5.2 2.4 5.2c2.2 0 2.2-5.4 3.2-7.5.9-1.9 2.2-3.6 2.1-6.1C19.5 2.5 15.2.8 12 3.2z"/>',
  ruble: '<path d="M8 20V4h5.2a4.2 4.2 0 0 1 0 8.4H8M6 12.4h9M6 16h8"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2.75v4.5M17 2.75v4.5M3 9.5h18M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 10.5v6M12 7.5h.01"/>',
  shield: '<path d="M12 2.8 20 6v5.5c0 4.9-3.2 8.1-8 9.7-4.8-1.6-8-4.8-8-9.7V6z"/><path d="m8.2 12 2.4 2.4 5.2-5.2"/>',
  phone: '<path d="M7.1 3.5 4.5 5.1c-.8.5-.9 1.5-.5 2.5 2.2 5.7 6.7 10.2 12.4 12.4 1 .4 2 .3 2.5-.5l1.6-2.6-4.7-3-1.6 2c-2.7-1.3-4.8-3.4-6.1-6.1l2-1.6z"/>',
  pin: '<path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
  eye: '<path d="M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.5"/>',
});

const SAFE_CLASS_NAMES = /^[a-z][a-z0-9_-]*(?:\s+[a-z][a-z0-9_-]*)*$/i;

export function renderIcon(name, className = 'ui-icon') {
  const content = ICONS[name];

  if (!content) {
    throw new Error(`Unknown icon: ${name}`);
  }

  if (!SAFE_CLASS_NAMES.test(className)) {
    throw new Error(`Invalid icon class: ${className}`);
  }

  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;
}
