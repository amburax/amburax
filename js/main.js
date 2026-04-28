import { media } from './environment.js';
import { initAnalytics } from './analytics.js';
import { initNavigation } from './navigation.js';
import { initRevealAnimations, initMarquee, initAnchorScrolling } from './scroll-effects.js';
import { initContactForm } from './contact-form.js';
import { debounce, scheduleNonCritical } from './utils.js';

const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
const heroSection = document.getElementById('hero');
const glassCard = document.getElementById('glass-card');
const heroCanvas = document.getElementById('hero-canvas');
const heroCtx = heroCanvas ? heroCanvas.getContext('2d') : null;
const marqueeContent = document.querySelector('[data-marquee-track]');
const contactForm = document.getElementById('contact-form');
const formNote = document.getElementById('form-note');
const revealElements = document.querySelectorAll('[data-reveal]');
const serviceCards = document.querySelectorAll('[data-service-card]');

const navigation = initNavigation({
  navbar,
  navToggle,
  navLinks,
  isMobileView: media.isMobileView,
});

initAnalytics();
initAnchorScrolling({ prefersReducedMotion: media.prefersReducedMotion });
initContactForm({ contactForm, formNote });
let heroEffects = null;
let heroEffectsLoader = null;

function initNonCriticalUi() {
  initRevealAnimations({ revealElements, prefersReducedMotion: media.prefersReducedMotion });
  initMarquee({ marqueeContent, prefersReducedMotion: media.prefersReducedMotion });
}

async function ensureHeroEffects() {
  if (heroEffects) {
    return heroEffects;
  }

  const profile = media.getPerformanceProfile();
  if (!heroCanvas || !heroCtx || (!profile.allowAmbientMotion && !profile.allowHoverEffects)) {
    return null;
  }

  if (!heroEffectsLoader) {
    heroEffectsLoader = import('./hero-effects.js').then(({ HeroEffects }) => {
      heroEffects = new HeroEffects({
        media,
        heroSection,
        heroCanvas,
        heroCtx,
        glassCard,
        serviceCards,
      });
      heroEffects.init();
      return heroEffects;
    });
  }

  return heroEffectsLoader;
}

async function syncHeroEffects() {
  const activeHeroEffects = await ensureHeroEffects();
  activeHeroEffects?.sync();
}

const handleViewportChange = debounce(() => {
  void syncHeroEffects();

  if (!media.isMobileView() && navigation?.closeNav) {
    navigation.closeNav();
  }
}, 200);

window.addEventListener('resize', handleViewportChange);
document.addEventListener('visibilitychange', () => {
  heroEffects?.sync();
});

media.addMediaQueryListener(media.mobileQuery, handleViewportChange);
media.addMediaQueryListener(media.reducedMotionQuery, handleViewportChange);
media.addMediaQueryListener(media.coarsePointerQuery, handleViewportChange);

scheduleNonCritical(initNonCriticalUi);
scheduleNonCritical(() => {
  void ensureHeroEffects();
});
