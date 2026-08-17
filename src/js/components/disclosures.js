export function initDisclosures() {
  const buttons = [...document.querySelectorAll('[data-disclosure-button]')];
  const serviceFromFragment = () => {
    const requestedService = window.location.hash.match(/^#service-([a-z0-9-]+)$/)?.[1];
    return requestedService && document.getElementById(`services-disclosure-${requestedService}`)
      ? requestedService
      : null;
  };
  const setOpen = (button, open) => {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    button.setAttribute('aria-expanded', String(open));
    if (panel) panel.hidden = !open;
  };
  const activateService = (serviceSlug) => {
    if (!serviceSlug) return;
    buttons.forEach((button) => setOpen(button, button.id === `services-disclosure-${serviceSlug}`));
  };
  const serviceSlug = serviceFromFragment();

  buttons.forEach((button, index) => {
    const matchesService = serviceSlug && button.id === `services-disclosure-${serviceSlug}`;
    const initiallyOpen = matchesService || (!serviceSlug && index === 0);
    setOpen(button, initiallyOpen);

    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      setOpen(button, open);
    });
  });

  window.addEventListener('hashchange', () => activateService(serviceFromFragment()));
}
