export function initDisclosures() {
  document.querySelectorAll('[data-disclosure-button]').forEach((button, index) => {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    const initiallyOpen = index === 0;
    button.setAttribute('aria-expanded', String(initiallyOpen));
    if (panel) panel.hidden = !initiallyOpen;

    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      if (panel) panel.hidden = !open;
    });
  });
}
