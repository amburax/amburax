export function initNavigation({ navbar, navToggle, navLinks, isMobileView }) {
  if (!navbar) {
    return;
  }

  window.addEventListener(
    'scroll',
    () => {
      navbar.classList.toggle('scrolled', window.scrollY > 50);
    },
    { passive: true }
  );

  if (!navToggle || !navLinks) {
    return;
  }

  const setExpanded = (expanded) => {
    navLinks.classList.toggle('active', expanded);
    navToggle.classList.toggle('active', expanded);
    navToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  };

  const closeNav = () => {
    setExpanded(false);
  };

  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    setExpanded(!expanded);
  });

  navLinks.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
      closeNav();
      navToggle.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (
      isMobileView() &&
      navToggle.getAttribute('aria-expanded') === 'true' &&
      !navLinks.contains(event.target) &&
      !navToggle.contains(event.target)
    ) {
      closeNav();
    }
  });

  return { closeNav };
}
