let locks = 0;
let previousPadding = '';

export function lockScroll() {
  if (locks === 0) {
    previousPadding = document.body.style.paddingRight;
    const scrollbar = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.body.style.paddingRight = scrollbar ? `${scrollbar}px` : previousPadding;
    document.body.classList.add('is-locked');
  }

  locks += 1;
}

export function unlockScroll() {
  if (locks === 0) return;

  locks -= 1;
  if (locks === 0) {
    document.body.classList.remove('is-locked');
    document.body.style.paddingRight = previousPadding;
  }
}
