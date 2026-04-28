export function initRevealAnimations({ revealElements, prefersReducedMotion }) {
  if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
    revealElements.forEach((element) => element.classList.add('visible'));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const parent = entry.target.parentElement;
        const siblings = parent ? Array.from(parent.querySelectorAll('[data-reveal]')) : [];
        const index = siblings.indexOf(entry.target);
        const delay = index >= 0 ? index * 100 : 0;

        window.setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);

        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
}

export function initMarquee({ marqueeContent, prefersReducedMotion }) {
  if (!marqueeContent || prefersReducedMotion()) {
    return;
  }

  const parent = marqueeContent.parentElement;
  if (!parent || parent.querySelector('[data-marquee-clone="true"]')) {
    return;
  }

  const clone = marqueeContent.cloneNode(true);
  clone.removeAttribute('id');
  clone.setAttribute('data-marquee-clone', 'true');
  parent.appendChild(clone);
}

export function initAnchorScrolling({ prefersReducedMotion }) {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const href = anchor.getAttribute('href');
      if (!href) {
        return;
      }

      if (href === '#') {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        return;
      }

      const targetId = href.slice(1);
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    });
  });
}
