import { siteConfig } from './site-config.js';

let pageViewTracked = false;

export function trackEvent(name, detail = {}) {
  if (!siteConfig.analytics.enabled || !name) {
    return;
  }

  const payload = {
    event: name,
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
    ...detail,
  };

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(payload);
  } else {
    window.dataLayer = [payload];
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', name, detail);
  }

  if (typeof window.plausible === 'function') {
    window.plausible(name, { props: detail });
  }

  window.dispatchEvent(new CustomEvent('amburax:analytics', { detail: payload }));

  if (siteConfig.analytics.debug) {
    console.info('[Amburax analytics]', payload);
  }
}

export function initAnalytics() {
  if (!pageViewTracked) {
    trackEvent('page_view', { title: document.title });
    pageViewTracked = true;
  }

  document.querySelectorAll('[data-track]').forEach((element) => {
    if (element.dataset.trackBound === 'true') {
      return;
    }

    element.dataset.trackBound = 'true';
    element.addEventListener('click', () => {
      trackEvent(element.dataset.track || 'interaction', {
        label: element.dataset.trackLabel || '',
        location: element.dataset.trackLocation || '',
      });
    });
  });
}
