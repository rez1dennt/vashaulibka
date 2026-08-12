const positionFor = (index, activeIndex, length) => {
  const forward = (index - activeIndex + length) % length;
  if (forward === 0) return 'active';
  if (forward === 1) return 'next';
  if (forward === length - 1) return 'previous';
  return forward <= Math.floor(length / 2) ? 'far-next' : 'far-previous';
};

export function initSpecialistsCoverflow() {
  document.querySelectorAll('[data-specialists-coverflow]').forEach((root) => {
    const slides = [...root.querySelectorAll('[data-specialist-slide]')];
    const viewport = root.querySelector('[data-specialist-viewport]');
    const detailName = root.querySelector('[data-specialist-detail-name]');
    const detailRole = root.querySelector('[data-specialist-detail-role]');
    if (!slides.length || !viewport || root.classList.contains('is-enhanced')) return;

    let activeIndex = 0;
    let pointerStart = null;
    let suppressPointerClick = false;

    const activate = (index) => {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const position = positionFor(slideIndex, activeIndex, slides.length);
        const isActive = slideIndex === activeIndex;
        slide.dataset.position = position;

        if (isActive) {
          slide.setAttribute('aria-current', 'true');
          slide.removeAttribute('aria-hidden');
        } else {
          slide.removeAttribute('aria-current');
          slide.setAttribute('aria-hidden', 'true');
        }

        const select = slide.querySelector('[data-specialist-select]');
        if (select) select.tabIndex = isActive ? 0 : -1;
      });

      const active = slides[activeIndex];
      if (detailName) detailName.textContent = active.querySelector('.specialist-card__name')?.textContent.trim() || '';
      if (detailRole) detailRole.textContent = active.querySelector('.specialist-card__role')?.textContent.trim() || '';
    };

    root.querySelector('[data-specialist-prev]')?.addEventListener('click', () => activate(activeIndex - 1));
    root.querySelector('[data-specialist-next]')?.addEventListener('click', () => activate(activeIndex + 1));
    slides.forEach((slide, index) => slide.querySelector('[data-specialist-select]')
      ?.addEventListener('click', (event) => {
        if (suppressPointerClick) {
          event.preventDefault();
          return;
        }
        activate(index);
      }));

    viewport.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

      event.preventDefault();
      const target = event.key === 'Home' ? 0
        : event.key === 'End' ? slides.length - 1
          : activeIndex + (event.key === 'ArrowRight' ? 1 : -1);
      activate(target);
    });

    viewport.addEventListener('pointerdown', (event) => {
      pointerStart = event.clientX;
    });
    viewport.addEventListener('pointerup', (event) => {
      if (pointerStart === null) return;

      const distance = event.clientX - pointerStart;
      pointerStart = null;
      if (Math.abs(distance) >= 48) {
        suppressPointerClick = true;
        globalThis.setTimeout(() => {
          suppressPointerClick = false;
        }, 0);
        activate(activeIndex + (distance < 0 ? 1 : -1));
      }
    });
    viewport.addEventListener('pointercancel', () => {
      pointerStart = null;
    });

    root.classList.add('is-enhanced');
    const fragmentIndex = Number(window.location.hash.match(/^#specialist-(\d+)$/)?.[1]) - 1;
    activate(Number.isInteger(fragmentIndex) && fragmentIndex >= 0 && fragmentIndex < slides.length
      ? fragmentIndex
      : 0);
  });
}
