export function debounce(callback, delay = 100) {
  let timerId = null;

  return (...args) => {
    window.clearTimeout(timerId);
    timerId = window.setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

export function scheduleNonCritical(task, { timeout = 1200 } = {}) {
  const runTask = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => task(), { timeout });
      return;
    }

    window.setTimeout(task, 32);
  };

  if ('requestAnimationFrame' in window) {
    window.requestAnimationFrame(() => runTask());
    return;
  }

  runTask();
}
