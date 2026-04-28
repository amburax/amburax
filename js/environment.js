const mobileQuery = window.matchMedia('(max-width: 767px)');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointerQuery = window.matchMedia('(pointer: coarse)');

export function addMediaQueryListener(query, handler) {
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', handler);
  } else if (typeof query.addListener === 'function') {
    query.addListener(handler);
  }
}

export function isMobileView() {
  return mobileQuery.matches;
}

export function prefersReducedMotion() {
  return reducedMotionQuery.matches;
}

export function prefersCoarsePointer() {
  return coarsePointerQuery.matches;
}

export function getPerformanceProfile() {
  const saveData = navigator.connection?.saveData ?? false;
  const deviceMemory = navigator.deviceMemory ?? 8;
  const hardwareConcurrency = navigator.hardwareConcurrency ?? 8;
  const mobile = isMobileView();
  const lowPower = saveData || deviceMemory <= 4 || hardwareConcurrency <= 4;
  const mediumPower = !lowPower && (deviceMemory <= 8 || hardwareConcurrency <= 8);
  const allowAmbientMotion = !saveData && !prefersReducedMotion() && (!mobile || (!lowPower && deviceMemory >= 4));
  const heroIntensity = saveData
    ? 0
    : mobile
      ? lowPower
        ? 0.18
        : mediumPower
          ? 0.24
          : 0.32
      : lowPower
        ? 0.45
        : mediumPower
          ? 0.72
          : 1;

  return {
    saveData,
    lowPower,
    mediumPower,
    allowAmbientMotion,
    allowHoverEffects: !prefersCoarsePointer() && !saveData && !prefersReducedMotion(),
    heroIntensity,
  };
}

export const media = {
  mobileQuery,
  reducedMotionQuery,
  coarsePointerQuery,
  addMediaQueryListener,
  getPerformanceProfile,
  isMobileView,
  prefersReducedMotion,
  prefersCoarsePointer,
};
