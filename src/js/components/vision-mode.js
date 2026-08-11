import { safeStorage } from '../core/storage.js';

export function initVisionMode() {
  const button = document.querySelector('[data-vision-toggle]');
  if (!button) return;

  const apply = (enabled) => {
    document.documentElement.classList.toggle('vision-mode', enabled);
    button.setAttribute('aria-pressed', String(enabled));
  };

  apply(safeStorage.get('vision-mode') === 'on');
  button.addEventListener('click', () => {
    const enabled = !document.documentElement.classList.contains('vision-mode');
    apply(enabled);
    safeStorage.set('vision-mode', enabled ? 'on' : 'off');
  });
}
