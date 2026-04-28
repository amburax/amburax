export class HeroEffects {
  constructor({ media, heroSection, heroCanvas, heroCtx, glassCard, serviceCards }) {
    this.media = media;
    this.heroSection = heroSection;
    this.heroCanvas = heroCanvas;
    this.heroCtx = heroCtx;
    this.glassCard = glassCard;
    this.serviceCards = [...serviceCards];

    this.heroWidth = 0;
    this.heroHeight = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.particles = [];
    this.connections = [];
    this.heroAnimId = null;
    this.heroInView = true;
    this.visibilityObserver = null;
  }

  init() {
    if (!this.heroCanvas || !this.heroCtx) {
      return;
    }

    this.bindPointerTracking();
    this.bindHoverEffects();
    this.observeHeroVisibility();
    this.sync();
  }

  getProfile() {
    return this.media.getPerformanceProfile();
  }

  shouldAnimate() {
    return this.getProfile().allowAmbientMotion && this.heroInView && !document.hidden;
  }

  resizeCanvas() {
    if (!this.heroCanvas || !this.heroCtx) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.heroWidth = this.heroCanvas.offsetWidth;
    this.heroHeight = this.heroCanvas.offsetHeight;
    this.heroCanvas.width = this.heroWidth * dpr;
    this.heroCanvas.height = this.heroHeight * dpr;
    this.heroCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.centerX = this.heroWidth / 2;
    this.centerY = this.heroHeight / 2;
  }

  getParticleCount() {
    const area = window.innerWidth * window.innerHeight;
    const baseCount = Math.min(Math.floor(area / 3000), 220);
    return Math.max(0, Math.floor(baseCount * this.getProfile().heroIntensity));
  }

  initParticles() {
    this.particles = [];
    this.connections = [];

    const count = this.getParticleCount();
    for (let i = 0; i < count; i += 1) {
      this.particles.push(new ParticleFieldParticle(this));
    }

    const lineCount = Math.min(Math.floor(count / 3), 40);
    for (let i = 0; i < lineCount; i += 1) {
      this.connections.push(new ParticleFieldLine(this));
    }
  }

  drawParticleConnections() {
    const maxDist = 100;
    for (let i = 0; i < this.particles.length; i += 1) {
      for (let j = i + 1; j < this.particles.length; j += 1) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = dx * dx + dy * dy;

        if (dist < maxDist * maxDist) {
          const alpha = (1 - Math.sqrt(dist) / maxDist) * 0.04;
          if (alpha > 0.005) {
            this.heroCtx.beginPath();
            this.heroCtx.moveTo(this.particles[i].x, this.particles[i].y);
            this.heroCtx.lineTo(this.particles[j].x, this.particles[j].y);
            this.heroCtx.strokeStyle = `rgba(79,70,229,${alpha})`;
            this.heroCtx.lineWidth = 0.4;
            this.heroCtx.stroke();
          }
        }
      }
    }
  }

  animate() {
    if (!this.shouldAnimate()) {
      this.heroAnimId = null;
      return;
    }

    this.heroCtx.clearRect(0, 0, this.heroWidth, this.heroHeight);
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.04;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.04;

    for (const line of this.connections) {
      line.update();
      line.draw();
    }

    for (const particle of this.particles) {
      particle.update();
      particle.draw();
    }

    this.drawParticleConnections();

    const gradient = this.heroCtx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, 300);
    gradient.addColorStop(0, 'rgba(79,70,229,0.03)');
    gradient.addColorStop(0.5, 'rgba(124,58,237,0.015)');
    gradient.addColorStop(1, 'rgba(79,70,229,0)');
    this.heroCtx.fillStyle = gradient;
    this.heroCtx.fillRect(0, 0, this.heroWidth, this.heroHeight);

    this.heroAnimId = window.requestAnimationFrame(() => this.animate());
  }

  stop() {
    if (this.heroAnimId) {
      window.cancelAnimationFrame(this.heroAnimId);
      this.heroAnimId = null;
    }

    if (this.heroCtx && this.heroCanvas) {
      this.heroCtx.clearRect(0, 0, this.heroCanvas.width, this.heroCanvas.height);
    }
  }

  resetInteractiveStyles() {
    if (this.glassCard) {
      this.glassCard.style.transform = '';
      this.glassCard.style.transition = '';
    }

    this.serviceCards.forEach((card) => {
      const glow = card.querySelector('.service-card-glow');
      if (!glow) {
        return;
      }

      glow.style.left = '';
      glow.style.top = '';
    });
  }

  sync() {
    if (!this.heroCanvas || !this.heroCtx) {
      return;
    }

    if (this.shouldAnimate()) {
      this.resizeCanvas();
      this.initParticles();
      this.mouseX = this.centerX;
      this.mouseY = this.centerY;
      this.targetMouseX = this.centerX;
      this.targetMouseY = this.centerY;

      if (!this.heroAnimId) {
        this.animate();
      }
    } else {
      this.stop();
      this.resetInteractiveStyles();
    }
  }

  bindPointerTracking() {
    document.addEventListener('mousemove', (event) => {
      if (!this.getProfile().allowHoverEffects || !this.heroCanvas || !this.shouldAnimate()) {
        return;
      }

      const rect = this.heroCanvas.getBoundingClientRect();
      this.targetMouseX = event.clientX - rect.left;
      this.targetMouseY = event.clientY - rect.top;
    });
  }

  bindHoverEffects() {
    if (this.heroSection && this.glassCard) {
      this.heroSection.addEventListener('mousemove', (event) => {
        if (!this.getProfile().allowHoverEffects || !this.shouldAnimate()) {
          return;
        }

        const rect = this.heroSection.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        this.glassCard.style.transform = `perspective(1000px) rotateY(${x * 3}deg) rotateX(${-y * 3}deg)`;
      });

      this.heroSection.addEventListener('mouseleave', () => {
        if (!this.glassCard) {
          return;
        }

        this.glassCard.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
        this.glassCard.style.transition = 'transform 0.6s ease';
        window.setTimeout(() => {
          this.glassCard.style.transition = '';
        }, 600);
      });
    }

    this.serviceCards.forEach((card) => {
      const glow = card.querySelector('.service-card-glow');
      if (!glow) {
        return;
      }

      card.addEventListener('mousemove', (event) => {
        if (!this.getProfile().allowHoverEffects || !this.shouldAnimate()) {
          return;
        }

        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        glow.style.left = `${x - rect.width}px`;
        glow.style.top = `${y - rect.height}px`;
      });
    });
  }

  observeHeroVisibility() {
    if (!this.heroSection || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.heroInView = entry.isIntersecting;
          this.sync();
        });
      },
      { threshold: 0.08 }
    );

    this.visibilityObserver.observe(this.heroSection);
  }
}

class ParticleFieldParticle {
  constructor(field) {
    this.field = field;
    this.reset();
  }

  reset() {
    const spawnPoints = [
      { x: this.field.centerX, y: this.field.centerY, weight: 0.35 },
      { x: this.field.heroWidth * 0.2, y: this.field.heroHeight * 0.3, weight: 0.15 },
      { x: this.field.heroWidth * 0.8, y: this.field.heroHeight * 0.25, weight: 0.15 },
      { x: this.field.heroWidth * 0.15, y: this.field.heroHeight * 0.7, weight: 0.1 },
      { x: this.field.heroWidth * 0.75, y: this.field.heroHeight * 0.65, weight: 0.1 },
      { x: this.field.heroWidth * 0.5, y: this.field.heroHeight * 0.15, weight: 0.08 },
      { x: this.field.heroWidth * 0.5, y: this.field.heroHeight * 0.85, weight: 0.07 },
    ];

    let roll = Math.random();
    let cumulative = 0;
    let origin = spawnPoints[0];

    for (const point of spawnPoints) {
      cumulative += point.weight;
      if (roll <= cumulative) {
        origin = point;
        break;
      }
    }

    const spawnRadius = Math.random() * 80;
    const angle = Math.random() * Math.PI * 2;

    this.x = origin.x + Math.cos(angle) * spawnRadius;
    this.y = origin.y + Math.sin(angle) * spawnRadius;
    this.speed = 0.15 + Math.random() * 0.35;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.radius = 0.8 + Math.random() * 1.5;
    this.maxLife = 300 + Math.random() * 400;
    this.life = 0;
    this.opacity = 0;
    this.maxOpacity = 0.12 + Math.random() * 0.2;

    const colors = [
      [79, 70, 229],
      [124, 58, 237],
      [99, 102, 241],
      [139, 92, 246],
      [59, 130, 246],
    ];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.life += 1;
    const lifeRatio = this.life / this.maxLife;

    if (lifeRatio < 0.1) {
      this.opacity = (lifeRatio / 0.1) * this.maxOpacity;
    } else if (lifeRatio > 0.7) {
      this.opacity = ((1 - lifeRatio) / 0.3) * this.maxOpacity;
    } else {
      this.opacity = this.maxOpacity;
    }

    const dx = this.field.mouseX - this.x;
    const dy = this.field.mouseY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 250 && dist > 1) {
      const force = 0.015 * (1 - dist / 250);
      this.vx += (-dy / dist) * force;
      this.vy += (dx / dist) * force;
    }

    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (currentSpeed > this.speed * 1.5) {
      this.vx *= 0.99;
      this.vy *= 0.99;
    }

    this.x += this.vx;
    this.y += this.vy;

    if (
      this.life >= this.maxLife ||
      this.x < -50 ||
      this.x > this.field.heroWidth + 50 ||
      this.y < -50 ||
      this.y > this.field.heroHeight + 50
    ) {
      this.reset();
    }
  }

  draw() {
    if (this.opacity <= 0) {
      return;
    }

    const [r, g, b] = this.color;
    this.field.heroCtx.beginPath();
    this.field.heroCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    this.field.heroCtx.fillStyle = `rgba(${r},${g},${b},${this.opacity})`;
    this.field.heroCtx.fill();
  }
}

class ParticleFieldLine {
  constructor(field) {
    this.field = field;
    this.reset();
  }

  reset() {
    this.angle = Math.random() * Math.PI * 2;
    this.length = 80 + Math.random() * 180;
    this.speed = 0.08 + Math.random() * 0.2;
    this.progress = 0;
    this.width = 0.3 + Math.random() * 0.8;
    this.opacity = 0.04 + Math.random() * 0.08;
    this.curve = (Math.random() - 0.5) * 0.3;
    this.originX = this.field.heroWidth * (0.15 + Math.random() * 0.7);
    this.originY = this.field.heroHeight * (0.1 + Math.random() * 0.8);
    this.startRadius = Math.random() * 40;
    this.life = 0;
    this.maxLife = 200 + Math.random() * 300;

    const colors = [
      [79, 70, 229],
      [124, 58, 237],
      [99, 102, 241],
    ];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.life += 1;
    this.progress = Math.min(this.life / 60, 1);

    if (this.life >= this.maxLife) {
      this.reset();
    }
  }

  draw() {
    const lifeRatio = this.life / this.maxLife;
    let alpha = this.opacity;

    if (lifeRatio < 0.1) {
      alpha *= lifeRatio / 0.1;
    } else if (lifeRatio > 0.7) {
      alpha *= (1 - lifeRatio) / 0.3;
    }

    if (alpha <= 0.005) {
      return;
    }

    const startRadius = this.startRadius + this.life * this.speed;
    const endRadius = startRadius + this.length * this.progress;
    const startX = this.originX + Math.cos(this.angle) * startRadius;
    const startY = this.originY + Math.sin(this.angle) * startRadius;
    const endX = this.originX + Math.cos(this.angle + this.curve) * endRadius;
    const endY = this.originY + Math.sin(this.angle + this.curve) * endRadius;
    const midRadius = (startRadius + endRadius) / 2;
    const controlAngle = this.angle + this.curve * 0.5;
    const controlX = this.originX + Math.cos(controlAngle) * midRadius + Math.sin(this.angle) * 20;
    const controlY = this.originY + Math.sin(controlAngle) * midRadius - Math.cos(this.angle) * 20;
    const [r, g, b] = this.color;

    this.field.heroCtx.beginPath();
    this.field.heroCtx.moveTo(startX, startY);
    this.field.heroCtx.quadraticCurveTo(controlX, controlY, endX, endY);
    this.field.heroCtx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
    this.field.heroCtx.lineWidth = this.width;
    this.field.heroCtx.lineCap = 'round';
    this.field.heroCtx.stroke();
  }
}
