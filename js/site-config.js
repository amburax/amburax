const defaultConfig = Object.freeze({
  analytics: {
    enabled: true,
    debug: false,
  },
  contact: {
    endpoint: ['127.0.0.1', 'localhost'].includes(window.location.hostname) ? '' : '/api/inquiries',
    recipient: 'amburax@gmail.com',
    minSubmitDelayMs: 3500,
    minBriefLength: 40,
  },
});

function mergeConfig(defaultValue, overrideValue) {
  if (!overrideValue || typeof overrideValue !== 'object') {
    return { ...defaultValue };
  }

  return {
    ...defaultValue,
    ...overrideValue,
  };
}

const runtimeConfig = window.AMBURAX_CONFIG || {};

export const siteConfig = {
  analytics: mergeConfig(defaultConfig.analytics, runtimeConfig.analytics),
  contact: mergeConfig(defaultConfig.contact, runtimeConfig.contact),
};

window.AMBURAX_CONFIG = siteConfig;
