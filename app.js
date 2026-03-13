/* ═══════════════════════════════════════════════
   ANDREW ODONGO — NAIROBI PORTFOLIO
   Main Application Script
   ═══════════════════════════════════════════════ */

/* ──────────────────────────────
   1. PARTICLE SYSTEM (Canvas)
────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 1.5 + 0.3;
      this.alpha = Math.random() * 0.7 + 0.1;
      this.vx = (Math.random() - 0.5) * 0.15;
      this.vy = (Math.random() - 0.5) * 0.15;
      // Some particles are orange/gold, most are white
      const roll = Math.random();
      if (roll < 0.08)      this.color = '255,107,26';  // orange
      else if (roll < 0.14) this.color = '255,184,48';  // gold
      else                  this.color = '255,255,255';  // white
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    const count = Math.floor((W * H) / 9000);
    for (let i = 0; i < Math.min(count, 180); i++) particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }

  resize();
  initParticles();
  animate();
  window.addEventListener('resize', () => { resize(); initParticles(); });
})();

/* ──────────────────────────────
   2. CUSTOM CURSOR
────────────────────────────── */
(function initCursor() {
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  let mx = -100, my = -100, rx = -100, ry = -100;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  // Smooth ring lag
  function animateCursor() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    dot.style.left  = mx + 'px';
    dot.style.top   = my + 'px';
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Hover effect on interactive elements
  const interactives = document.querySelectorAll('a, button, .project-card, .about-card, .skill-panel, input, textarea');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
  });
})();

/* ──────────────────────────────
   3. SPLASH / LOADER
────────────────────────────── */
(function initSplash() {
  const splash   = document.getElementById('splashScreen');
  const fill     = document.getElementById('loaderFill');
  const pctEl    = document.getElementById('loaderPct');
  const btn      = document.getElementById('splashBtn');
  const wrapper  = document.getElementById('siteWrapper');
  if (!splash) return;

  // Hide site while loading
  wrapper.style.opacity = '0';

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 5 + 2;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      // Show enter button
      setTimeout(() => {
        if (btn) {
          btn.classList.add('show');
          // Auto-dismiss after 1s if user doesn't click
          setTimeout(() => { if (!dismissed) dismissSplash(); }, 5000);
        }
      }, 400);
    }
    fill.style.width = progress + '%';
    pctEl.textContent = Math.floor(progress) + '%';
  }, 60);

  let dismissed = false;
  function dismissSplash() {
    if (dismissed) return;
    dismissed = true;
    splash.classList.add('hide');
    wrapper.style.transition = 'opacity 0.8s ease';
    wrapper.style.opacity = '1';
    setTimeout(() => { splash.remove(); }, 900);
    typewriterHero();
    startSkillBars();
  }

  if (btn) btn.addEventListener('click', dismissSplash);
})();

/* ──────────────────────────────
   4. TYPEWRITER HERO
────────────────────────────── */
function typewriterHero() {
  const el = document.getElementById('heroTagline');
  if (!el) return;
  const phrases = [
    'Full-Stack Developer & AI Engineer',
    'Building Africa\'s digital future',
    'From Nairobi to the world 🌍',
    'Code. Ship. Impact.',
  ];
  let pIdx = 0, cIdx = 0, deleting = false;

  function type() {
    const current = phrases[pIdx];
    if (!deleting) {
      el.textContent = current.slice(0, ++cIdx);
      if (cIdx === current.length) {
        deleting = true;
        setTimeout(type, 2200);
        return;
      }
    } else {
      el.textContent = current.slice(0, --cIdx);
      if (cIdx === 0) {
        deleting = false;
        pIdx = (pIdx + 1) % phrases.length;
      }
    }
    setTimeout(type, deleting ? 40 : 75);
  }
  type();
}

/* ──────────────────────────────
   5. NAVIGATION
────────────────────────────── */
(function initNav() {
  const nav     = document.getElementById('mainNav');
  const burger  = document.getElementById('burgerBtn');
  const overlay = document.getElementById('menuOverlay');
  const close   = document.getElementById('menuClose');
  const links   = document.querySelectorAll('.menu-item');

  // Scroll shrink
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });

  function openMenu()  { overlay.classList.add('open');  burger.classList.add('active'); }
  function closeMenu() { overlay.classList.remove('open'); burger.classList.remove('active'); }

  if (burger)  burger.addEventListener('click', openMenu);
  if (close)   close.addEventListener('click', closeMenu);
  links.forEach(l => l.addEventListener('click', closeMenu));

  // Close on outside tap
  overlay.addEventListener('click', e => { if (e.target === overlay) closeMenu(); });
})();

/* ──────────────────────────────
   6. SCROLL REVEAL (IntersectionObserver)
────────────────────────────── */
(function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-text')
          .forEach(el => observer.observe(el));
})();

/* ──────────────────────────────
   7. SKILL BARS
────────────────────────────── */
function startSkillBars() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.skill-bar').forEach(bar => {
          const pct = bar.dataset.pct || '0';
          setTimeout(() => { bar.style.width = pct + '%'; }, 200);
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.skill-panel').forEach(p => observer.observe(p));
}

// Also init after DOM (if splash was already gone)
document.addEventListener('DOMContentLoaded', () => {
  // Fallback: if splash somehow was skipped
  setTimeout(startSkillBars, 3500);
});

/* ──────────────────────────────
   8. PARALLAX ON SCROLL
────────────────────────────── */
(function initParallax() {
  const els = document.querySelectorAll('.parallax-bg');
  if (!els.length) return;

  function onScroll() {
    const sy = window.scrollY;
    els.forEach(el => {
      const speed  = parseFloat(el.dataset.speed) || 0.3;
      const rect   = el.parentElement.getBoundingClientRect();
      const offset = (rect.top + sy) * speed;
      el.style.transform = `translate3d(0, ${offset * 0.25}px, 0)`;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ──────────────────────────────
   9. 3D TILT ON PROJECT CARDS
────────────────────────────── */
(function initTilt() {
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotX = -(y / rect.height) * 10;
      const rotY =  (x / rect.width)  * 10;
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ──────────────────────────────
   10. CONTACT FORM
────────────────────────────── */
(function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    const orig = btn.innerHTML;

    btn.innerHTML = '<span>Message Sent! ✓</span>';
    btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = orig;
      btn.style.background = '';
      btn.disabled = false;
      form.reset();
    }, 3000);
  });
})();

/* ──────────────────────────────
   11. STAT COUNTER ANIMATION
────────────────────────────── */
(function initCounters() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = el.textContent.trim();
      if (target === '∞') return;
      const numMatch = target.match(/[\d.]+/);
      if (!numMatch) return;
      const end = parseFloat(numMatch[0]);
      const suffix = target.replace(numMatch[0], '');
      let start = 0, duration = 1500, startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(ease * end) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-num').forEach(el => observer.observe(el));
})();

/* ──────────────────────────────
   12. SMOOTH SCROLL FOR ANCHORS
────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ──────────────────────────────
   13. ACTIVE NAV LINK HIGHLIGHT
────────────────────────────── */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 180) current = s.id;
    });
    navLinks.forEach(l => {
      l.style.color = l.getAttribute('href') === '#' + current
        ? 'var(--sunset-orange)' : '';
    });
  }, { passive: true });
})();
