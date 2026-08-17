export function initTabs() {
  document.querySelectorAll('[role="tablist"]').forEach((list) => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const activate = (tab, focus = false) => {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(item.getAttribute('aria-controls'));
        if (panel) panel.hidden = !selected;
      });
      if (focus) tab.focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

        event.preventDefault();
        const targetIndex = event.key === 'Home' ? 0
          : event.key === 'End' ? tabs.length - 1
            : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        activate(tabs[targetIndex], true);
      });
    });

    const tabFromFragment = () => {
      const serviceSlug = window.location.hash.match(/^#service-([a-z0-9-]+)$/)?.[1];
      return serviceSlug
        ? tabs.find((tab) => tab.id === `services-tab-${serviceSlug}`)
        : null;
    };
    const initialTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0];
    const fragmentTab = tabFromFragment();
    if (fragmentTab || initialTab) activate(fragmentTab || initialTab);
    window.addEventListener('hashchange', () => {
      const requestedTab = tabFromFragment();
      if (requestedTab) activate(requestedTab);
    });
  });
}
