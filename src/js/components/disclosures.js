export function initDisclosures() {
  const requestedService = window.location.hash.match(/^#service-([a-z0-9-]+)$/)?.[1];
  const serviceSlug = requestedService
    && document.getElementById(`services-disclosure-${requestedService}`)
    ? requestedService
    : null;
  document.querySelectorAll('[data-disclosure-button]').forEach((button, index) => {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    const matchesService = serviceSlug && button.id === `services-disclosure-${serviceSlug}`;
    const initiallyOpen = matchesService || (!serviceSlug && index === 0);
    button.setAttribute('aria-expanded', String(initiallyOpen));
    if (panel) panel.hidden = !initiallyOpen;

    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      if (panel) panel.hidden = !open;
    });
  });
}
