/* ══════════════════════════════════════════════════════════════
   AMBURAX — Premium Homepage Script
   
   Architecture:
   1. Particle System (Canvas) — Radial fiber-optic burst
   2. Mouse Interaction Layer — Parallax + particle influence
   3. Scroll Animations — IntersectionObserver reveals
   4. UI Interactions — Nav, marquee, smooth behaviors
   ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── MOBILE DETECTION ───
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

  // ═══════════════════════════════════════════════════════════
  //  SECTION 1: GENERATIVE PARTICLE SYSTEM
  //  - Radial emission from center (fiber-optic burst)
  //  - Slow outward expansion with gentle fade
  //  - Mouse-reactive direction shifting
  // ═══════════════════════════════════════════════════════════

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, centerX, centerY;
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let particles = [];
  let connections = [];
  let animId;

  // Particle count scales with screen, capped for performance
  const getParticleCount = () => {
    if (isMobile) return 0; // Static gradient on mobile
    const area = window.innerWidth * window.innerHeight;
    return Math.min(Math.floor(area / 3000), 220);
  };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    centerX = W / 2;
    centerY = H / 2;
  }

  // ─── PARTICLE CLASS ───
  // Each particle radiates from center outward along a random angle.
  // Speed is slow; opacity fades as it travels further from origin.
  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      // Multi-origin spawn: particles emanate from multiple points across hero
      // This creates a distributed field instead of a single central burst
      const spawnPoints = [
        { x: centerX, y: centerY, weight: 0.35 },           // center (primary)
        { x: W * 0.2, y: H * 0.3, weight: 0.15 },           // top-left zone
        { x: W * 0.8, y: H * 0.25, weight: 0.15 },          // top-right zone
        { x: W * 0.15, y: H * 0.7, weight: 0.1 },           // bottom-left
        { x: W * 0.75, y: H * 0.65, weight: 0.1 },          // bottom-right
        { x: W * 0.5, y: H * 0.15, weight: 0.08 },          // top-center
        { x: W * 0.5, y: H * 0.85, weight: 0.07 },          // bottom-center
      ];
      // Weighted random selection of spawn point
      let r = Math.random(), cumulative = 0, origin = spawnPoints[0];
      for (const sp of spawnPoints) {
        cumulative += sp.weight;
        if (r <= cumulative) { origin = sp; break; }
      }
      const spawnRadius = Math.random() * 80;
      const angle = Math.random() * Math.PI * 2;

      this.x = origin.x + Math.cos(angle) * spawnRadius;
      this.y = origin.y + Math.sin(angle) * spawnRadius;
      this.angle = angle;

      // Slow outward velocity (0.15–0.5 px/frame)
      this.speed = 0.15 + Math.random() * 0.35;
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed;

      // Visual properties
      this.radius = 0.8 + Math.random() * 1.5;
      this.maxLife = 300 + Math.random() * 400;
      this.life = 0;
      this.opacity = 0;
      this.maxOpacity = 0.12 + Math.random() * 0.2;

      // Color: blend of blue/violet/indigo
      const colors = [
        [79, 70, 229],   // indigo
        [124, 58, 237],  // violet
        [99, 102, 241],  // blue
        [139, 92, 246],  // purple
        [59, 130, 246],  // sky blue
      ];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.life++;

      // Fade in during first 10%, fade out during last 30%
      const lifeRatio = this.life / this.maxLife;
      if (lifeRatio < 0.1) {
        this.opacity = (lifeRatio / 0.1) * this.maxOpacity;
      } else if (lifeRatio > 0.7) {
        this.opacity = ((1 - lifeRatio) / 0.3) * this.maxOpacity;
      } else {
        this.opacity = this.maxOpacity;
      }

      // Mouse influence: gently shift direction toward/away from cursor
      // Uses smoothed mouse position for calm, premium feel
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 250 && dist > 1) {
        // Gentle perpendicular deflection (not attraction, feels like flow)
        const force = 0.015 * (1 - dist / 250);
        this.vx += (-dy / dist) * force;
        this.vy += (dx / dist) * force;
      }

      // Slight deceleration to keep speeds stable
      const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (currentSpeed > this.speed * 1.5) {
        this.vx *= 0.99;
        this.vy *= 0.99;
      }

      this.x += this.vx;
      this.y += this.vy;

      // Reset if too old or out of bounds
      if (this.life >= this.maxLife || this.x < -50 || this.x > W + 50 || this.y < -50 || this.y > H + 50) {
        this.reset();
      }
    }

    draw() {
      if (this.opacity <= 0) return;
      const [r, g, b] = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${this.opacity})`;
      ctx.fill();
    }
  }

  // ─── FLOWING LINE CLASS ───
  // Gentle curved lines that radiate outward, creating fiber-optic feel
  class FlowLine {
    constructor() {
      this.reset();
    }

    reset() {
      this.angle = Math.random() * Math.PI * 2;
      this.length = 80 + Math.random() * 180;
      this.speed = 0.08 + Math.random() * 0.2;
      this.progress = 0;
      this.maxProgress = 1;
      this.width = 0.3 + Math.random() * 0.8;
      this.opacity = 0.04 + Math.random() * 0.08;
      this.curve = (Math.random() - 0.5) * 0.3;

      // Randomize origin across screen (not just center)
      this.originX = W * (0.15 + Math.random() * 0.7);
      this.originY = H * (0.1 + Math.random() * 0.8);
      this.startRadius = Math.random() * 40;
      this.life = 0;
      this.maxLife = 200 + Math.random() * 300;

      const colors = [
        [79, 70, 229, 0.06],
        [124, 58, 237, 0.05],
        [99, 102, 241, 0.07],
      ];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.life++;
      this.progress = Math.min(this.life / 60, 1);

      if (this.life >= this.maxLife) {
        this.reset();
      }
    }

    draw() {
      const lifeRatio = this.life / this.maxLife;
      let alpha = this.opacity;
      if (lifeRatio < 0.1) alpha *= lifeRatio / 0.1;
      else if (lifeRatio > 0.7) alpha *= (1 - lifeRatio) / 0.3;
      if (alpha <= 0.005) return;

      const ox = this.originX || centerX;
      const oy = this.originY || centerY;
      const startR = this.startRadius + this.life * this.speed;
      const endR = startR + this.length * this.progress;

      const sx = ox + Math.cos(this.angle) * startR;
      const sy = oy + Math.sin(this.angle) * startR;
      const ex = ox + Math.cos(this.angle + this.curve) * endR;
      const ey = oy + Math.sin(this.angle + this.curve) * endR;

      // Control point for curve
      const midR = (startR + endR) / 2;
      const cpAngle = this.angle + this.curve * 0.5;
      const cpx = ox + Math.cos(cpAngle) * midR + Math.sin(this.angle) * 20;
      const cpy = oy + Math.sin(cpAngle) * midR - Math.cos(this.angle) * 20;

      const [r, g, b] = this.color;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(cpx, cpy, ex, ey);
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.lineWidth = this.width;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  // ─── INIT PARTICLES ───
  function initParticles() {
    particles = [];
    connections = [];
    const count = getParticleCount();
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
    // Flowing lines (fewer, larger visual impact)
    const lineCount = Math.min(Math.floor(count / 3), 40);
    for (let i = 0; i < lineCount; i++) {
      connections.push(new FlowLine());
    }
  }

  // ─── DRAW CONNECTIONS BETWEEN NEARBY PARTICLES ───
  function drawParticleConnections() {
    const maxDist = 100;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = dx * dx + dy * dy;
        if (dist < maxDist * maxDist) {
          const alpha = (1 - Math.sqrt(dist) / maxDist) * 0.04;
          if (alpha > 0.005) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(79,70,229,${alpha})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }
    }
  }

  // ─── ANIMATION LOOP ───
  function animate() {
    ctx.clearRect(0, 0, W, H);

    // Smooth mouse interpolation (calm, premium feel)
    mouseX += (targetMouseX - mouseX) * 0.04;
    mouseY += (targetMouseY - mouseY) * 0.04;

    // Draw flowing lines first (background layer)
    for (const line of connections) {
      line.update();
      line.draw();
    }

    // Draw particles
    for (const p of particles) {
      p.update();
      p.draw();
    }

    // Draw subtle connections
    drawParticleConnections();

    // Central glow (soft radial gradient emanating from center)
    const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 300);
    grad.addColorStop(0, 'rgba(79,70,229,0.03)');
    grad.addColorStop(0.5, 'rgba(124,58,237,0.015)');
    grad.addColorStop(1, 'rgba(79,70,229,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    animId = requestAnimationFrame(animate);
  }

  // ─── MOUSE TRACKING (Layer 3: Interaction) ───
  if (!isMobile) {
    document.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    });
  }

  // ─── INIT & RESIZE ───
  function initCanvas() {
    resize();
    if (!isMobile) {
      initParticles();
      if (animId) cancelAnimationFrame(animId);
      animate();
    }
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      if (!isMobile) {
        initParticles();
      }
    }, 200);
  });

  initCanvas();

  // ═══════════════════════════════════════════════════════════
  //  SECTION 2: NAVBAR BEHAVIOR
  // ═══════════════════════════════════════════════════════════

  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  // Scroll state
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const st = window.scrollY;
    if (st > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = st;
  }, { passive: true });

  // Mobile toggle
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      navToggle.classList.toggle('active');
    });

    // Close on link click
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  SECTION 3: SCROLL REVEAL ANIMATIONS
  //  Uses IntersectionObserver for GPU-friendly reveals
  // ═══════════════════════════════════════════════════════════

  const revealElements = document.querySelectorAll(
    '.service-card, .division-card, .process-step, .statement-content, .cta-card, .section-header, .showcase-card, .testimonial-card'
  );

  revealElements.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger siblings for nice cascade
          const parent = entry.target.parentElement;
          const siblings = parent ? Array.from(parent.querySelectorAll('.reveal')) : [];
          const index = siblings.indexOf(entry.target);
          const delay = index >= 0 ? index * 100 : 0;

          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);

          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealElements.forEach(el => revealObserver.observe(el));

  // ═══════════════════════════════════════════════════════════
  //  SECTION 4: MARQUEE DUPLICATION
  //  Clone content for seamless infinite scroll
  // ═══════════════════════════════════════════════════════════

  const marqueeContent = document.getElementById('marquee-content');
  if (marqueeContent) {
    const clone = marqueeContent.cloneNode(true);
    clone.removeAttribute('id');
    marqueeContent.parentElement.appendChild(clone);
  }

  // ═══════════════════════════════════════════════════════════
  //  SECTION 5: GLASS CARD PARALLAX
  //  Subtle tilt on mouse move for depth
  // ═══════════════════════════════════════════════════════════

  if (!isMobile) {
    const glassCard = document.getElementById('glass-card');
    if (glassCard) {
      const heroSection = document.getElementById('hero');
      heroSection.addEventListener('mousemove', (e) => {
        const rect = heroSection.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        // Very subtle rotation (max 3deg)
        glassCard.style.transform = `
          perspective(1000px)
          rotateY(${x * 3}deg)
          rotateX(${-y * 3}deg)
        `;
      });

      heroSection.addEventListener('mouseleave', () => {
        glassCard.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
        glassCard.style.transition = 'transform 0.6s ease';
        setTimeout(() => { glassCard.style.transition = ''; }, 600);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  SECTION 6: SERVICE CARD GLOW FOLLOW
  //  Mouse-following radial glow on service cards
  // ═══════════════════════════════════════════════════════════

  if (!isMobile) {
    document.querySelectorAll('.service-card').forEach(card => {
      const glow = card.querySelector('.service-card-glow');
      if (!glow) return;

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        glow.style.left = `${x - rect.width}px`;
        glow.style.top = `${y - rect.height}px`;
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  SECTION 7: SMOOTH ANCHOR SCROLLING
  // ═══════════════════════════════════════════════════════════

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

})();
