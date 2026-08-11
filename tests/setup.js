import { afterEach } from 'vitest';

afterEach(() => {
  document.documentElement.innerHTML = '<head></head><body></body>';
  localStorage.clear();
});
