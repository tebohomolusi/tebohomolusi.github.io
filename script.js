// ---------- Theme ----------
(function themeInit() {
  try {
    const stored = localStorage.getItem('theme');
    if (stored) document.documentElement.setAttribute('data-theme', stored);
  } catch (err) {
    console.warn('[theme-init]', err);
  }
})();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

function readThemeColors() {
  const cs = getComputedStyle(document.documentElement);
  return {
    trail: cs.getPropertyValue('--rain-trail').trim(),
    green: cs.getPropertyValue('--rain-green').trim(),
    blue: cs.getPropertyValue('--rain-blue').trim(),
  };
}

// Every independent feature is wrapped so a failure in one can never
// stop the ones after it from running — each block reports quietly
// to the console instead of taking the rest of the page down with it.
function safe(name, fn) {
  try {
    fn();
  } catch (err) {
    console.warn('[' + name + ']', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  let rainColors = readThemeColors();

  // ---------- Theme toggle ----------
  safe('theme-toggle', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const setIcon = () => {
      if (!themeToggle) return;
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      themeToggle.textContent = isLight ? '[ dark ]' : '[ light ]';
    };
    setIcon();

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        safe('theme-toggle-click', () => {
          const isLight = document.documentElement.getAttribute('data-theme') === 'light';
          if (isLight) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
          } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
          }
          setIcon();
          rainColors = readThemeColors();
        });
      });
    }
  });

  // ---------- Mobile nav toggle ----------
  let nav = null;
  safe('mobile-nav', () => {
    const navToggle = document.getElementById('nav-toggle');
    nav = document.getElementById('site-nav');
    function setMenu(open) {
      if (!nav || !navToggle) return;
      nav.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      navToggle.textContent = open ? '[ ✕ ]' : '[ ☰ ]';
    }
    if (nav && navToggle) {
      navToggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
      nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    }
  });

  // ---------- Footer year ----------
  safe('footer-year', () => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });

  // ---------- Hide the PDF button if the CV file isn't published yet ----------
  safe('resume-check', () => {
    const resumeBtn = document.getElementById('resume-download');
    if (resumeBtn && location.protocol.startsWith('http')) {
      fetch(resumeBtn.getAttribute('href'), { method: 'HEAD' })
        .then((r) => { if (!r.ok) resumeBtn.style.display = 'none'; })
        .catch(() => { resumeBtn.style.display = 'none'; });
    }
  });

  // ---------- Header fade on scroll ----------
  safe('header-fade', () => {
    const header = document.getElementById('site-header');
    if (header) {
      function updateHeader() {
        header.classList.toggle('is-faded', window.scrollY > window.innerHeight * 0.6);
      }
      window.addEventListener('scroll', updateHeader, { passive: true });
      updateHeader();
    }
  });

  // ---------- Active section highlight ----------
  safe('nav-highlight', () => {
    if (!nav) return;
    const navLinks = Array.from(nav.querySelectorAll('a[href^="#"]'));
    const sections = navLinks
      .map((a) => {
        try {
          return document.querySelector(a.getAttribute('href'));
        } catch (err) {
          console.warn('[nav-highlight] bad selector on link', a.getAttribute('href'), err);
          return null;
        }
      })
      .filter(Boolean);

    if ('IntersectionObserver' in window) {
      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const id = '#' + entry.target.id;
          const link = navLinks.find((a) => a.getAttribute('href') === id);
          if (!link || !entry.isIntersecting) return;
          navLinks.forEach((a) => a.classList.remove('nav-active'));
          link.classList.add('nav-active');
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      sections.forEach((s) => sectionObserver.observe(s));
    }
  });

  // ---------- Scroll reveal ----------
  safe('scroll-reveal', () => {
    const revealElements = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      revealElements.forEach((el) => revealObserver.observe(el));
    } else {
      revealElements.forEach((el) => el.classList.add('is-visible'));
    }
  });

  // ---------- Typing / deleting role line ----------
  safe('typing-line', () => {
    const typingEl = document.getElementById('typing-line');
    const roles = [
      'ICT Support Specialist_',
      'Systems Administrator_',
      'Microsoft 365 / Endpoint Specialist_',
      'IT Consultant_'
    ];
    if (typingEl && !reduceMotion) {
      let roleIndex = 0;
      let charIndex = 0;
      let deleting = false;
      const textNode = document.createElement('span');
      typingEl.textContent = '> ';
      typingEl.appendChild(textNode);

      function tick() {
        const current = roles[roleIndex];
        if (!deleting) {
          charIndex++;
          textNode.textContent = current.slice(0, charIndex);
          if (charIndex === current.length) {
            deleting = true;
            setTimeout(tick, 1600);
            return;
          }
          setTimeout(tick, 85);
        } else {
          charIndex--;
          textNode.textContent = current.slice(0, charIndex);
          if (charIndex === 0) {
            deleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            setTimeout(tick, 400);
            return;
          }
          setTimeout(tick, 40);
        }
      }
      tick();
    } else if (typingEl) {
      typingEl.textContent = '> ' + roles[0];
    }
  });

  // ---------- Mouse-follow glow ----------
  // Intentionally disabled on touch devices: there is no mouse to follow,
  // and the fixed full-screen radial gradient creates unnecessary mobile repaints.
  safe('cursor-glow', () => {
    const glow = document.querySelector('.cursor-glow');
    if (!reduceMotion && !isTouchDevice && glow) {
      let targetX = 50;
      let targetY = 38;
      let curX = 50;
      let curY = 38;

      window.addEventListener('pointermove', (e) => {
        targetX = (e.clientX / window.innerWidth) * 100;
        targetY = (e.clientY / window.innerHeight) * 100;
      }, { passive: true });

      function glowTick() {
        curX += (targetX - curX) * 0.08;
        curY += (targetY - curY) * 0.08;
        glow.style.setProperty('--mx', curX + '%');
        glow.style.setProperty('--my', curY + '%');
        requestAnimationFrame(glowTick);
      }
      glowTick();
    }
  });

  // ---------- Count-up stats ----------
  safe('count-up', () => {
    const counterElements = document.querySelectorAll('[data-count-to]');
    if ('IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          counterObserver.unobserve(el);
          const to = parseInt(el.getAttribute('data-count-to'), 10);
          const from = parseInt(el.getAttribute('data-count-from') || '0', 10);
          const suffix = el.getAttribute('data-suffix') || '';
          if (reduceMotion) {
            el.textContent = to + suffix;
            return;
          }
          const duration = 1200;
          const start = performance.now();
          function step(now) {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(from + (to - from) * eased) + suffix;
            if (progress < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      }, { threshold: 0.4 });
      counterElements.forEach((el) => counterObserver.observe(el));
    } else {
      counterElements.forEach((el) => {
        el.textContent = el.getAttribute('data-count-to') + (el.getAttribute('data-suffix') || '');
      });
    }
  });

  // ---------- Digital rain ----------
  safe('digital-rain', () => {
    const canvas = document.getElementById('rain-canvas');
    const hero = document.querySelector('.hero');
    if (!canvas || !hero) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches || isTouchDevice;

    const FONT_SIZE = isMobile ? 20 : 18;
    const COLUMN_GAP = isMobile ? 5 : 3;
    const FRAME_INTERVAL = isMobile ? 140 : 90;

    let columns = 0;
    let drops = [];
    let speeds = [];
    let animId = null;
    let running = false;
    let lastTime = 0;
    let resizeTimer = null;

    const chars = '01アイウエオカキクケコサシスセソΔΣΘΦΨΩ≈≠';

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));

      const slots = Math.floor(canvas.width / FONT_SIZE);
      columns = Math.ceil(slots / COLUMN_GAP);
      drops = Array.from({ length: columns }, () => Math.random() * -60);
      speeds = Array.from({ length: columns }, () => 0.4 + Math.random() * 0.8);
    }

    function draw(now) {
      if (!running) return;

      if (now - lastTime < FRAME_INTERVAL) {
        animId = requestAnimationFrame(draw);
        return;
      }

      lastTime = now;

      ctx.fillStyle = rainColors.trail;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = FONT_SIZE + 'px monospace';

      for (let i = 0; i < columns; i++) {
        const x = i * COLUMN_GAP * FONT_SIZE;
        const char = chars[Math.floor(Math.random() * chars.length)];
        const isBlue = Math.random() < 0.05;

        ctx.fillStyle = isBlue ? rainColors.blue : rainColors.green;
        ctx.fillText(char, x, drops[i] * FONT_SIZE);

        drops[i] += speeds[i] * 0.4;
        if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.985) {
          drops[i] = 0;
        }
      }

      animId = requestAnimationFrame(draw);
    }

    function start() {
      if (running || document.hidden) return;
      running = true;
      lastTime = performance.now();
      animId = requestAnimationFrame(draw);
    }

    function stop() {
      running = false;
      if (animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    }

    resize();

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stop();
      } else if (!reduceMotion) {
        start();
      }
    });

    if (reduceMotion) {
      ctx.fillStyle = rainColors.trail;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if ('IntersectionObserver' in window) {
      const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) start();
          else stop();
        });
      }, { threshold: 0.05 });
      heroObserver.observe(hero);
    } else {
      start();
    }
  });
});
