// ---------- Theme ----------
(function themeInit() {
  const stored = localStorage.getItem('theme');
  if (stored) document.documentElement.setAttribute('data-theme', stored);
})();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function readThemeColors() {
  const cs = getComputedStyle(document.documentElement);
  return {
    trail: cs.getPropertyValue('--rain-trail').trim(),
    green: cs.getPropertyValue('--rain-green').trim(),
    blue: cs.getPropertyValue('--rain-blue').trim(),
  };
}

document.addEventListener('DOMContentLoaded', () => {
  let rainColors = readThemeColors();

  const themeToggle = document.getElementById('theme-toggle');
  const setIcon = () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    themeToggle.textContent = isLight ? '[ dark ]' : '[ light ]';
  };
  setIcon();
  themeToggle.addEventListener('click', () => {
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

  // ---------- Mobile nav toggle ----------
  const navToggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    navToggle.textContent = open ? '[ ✕ ]' : '[ ☰ ]';
  }
  navToggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // ---------- Footer year ----------
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Hide the PDF button if the CV file isn't published yet (only checkable over http/https) ----------
  const resumeBtn = document.getElementById('resume-download');
  if (resumeBtn && location.protocol.startsWith('http')) {
    fetch(resumeBtn.getAttribute('href'), { method: 'HEAD' })
      .then((r) => { if (!r.ok) resumeBtn.style.display = 'none'; })
      .catch(() => { resumeBtn.style.display = 'none'; });
  }

  // ---------- Header fade on scroll ----------
  const header = document.getElementById('site-header');
  function updateHeader() {
    header.classList.toggle('is-faded', window.scrollY > window.innerHeight * 0.6);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // ---------- Active section highlight ----------
  const navLinks = Array.from(nav.querySelectorAll('a[href^="#"]'));
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
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

  // ---------- Scroll reveal ----------
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  // ---------- Typing / deleting role line ----------
  const typingEl = document.getElementById('typing-line');
  const roles = [
    'ICT Support Specialist_',
    'Systems Administrator_',
    'Microsoft 365 / Endpoint Specialist_',
    'IT Consultant_'
  ];
  if (typingEl && !reduceMotion) {
    let roleIndex = 0, charIndex = 0, deleting = false;
    const textNode = document.createElement('span');
    typingEl.textContent = '> ';
    typingEl.appendChild(textNode);
    function tick() {
      const current = roles[roleIndex];
      if (!deleting) {
        charIndex++;
        textNode.textContent = current.slice(0, charIndex);
        if (charIndex === current.length) { deleting = true; setTimeout(tick, 1600); return; }
        setTimeout(tick, 85);
      } else {
        charIndex--;
        textNode.textContent = current.slice(0, charIndex);
        if (charIndex === 0) { deleting = false; roleIndex = (roleIndex + 1) % roles.length; setTimeout(tick, 400); return; }
        setTimeout(tick, 40);
      }
    }
    tick();
  } else if (typingEl) {
    typingEl.textContent = '> ' + roles[0];
  }

  // ---------- Mouse-follow glow (smoothed, site-wide) ----------
  const hero = document.querySelector('.hero');
  const glow = document.querySelector('.cursor-glow');
  if (!reduceMotion && glow) {
    let targetX = 50, targetY = 38, curX = 50, curY = 38;
    let glowFrame;
    window.addEventListener('pointermove', (e) => {
      targetX = (e.clientX / window.innerWidth) * 100;
      targetY = (e.clientY / window.innerHeight) * 100;
    });
    function glowTick() {
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;
      glow.style.setProperty('--mx', curX + '%');
      glow.style.setProperty('--my', curY + '%');
      glowFrame = requestAnimationFrame(glowTick);
    }
    glowTick();
  }

  // ---------- Count-up stats ----------
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      counterObserver.unobserve(el);
      const to = parseInt(el.getAttribute('data-count-to'), 10);
      const from = parseInt(el.getAttribute('data-count-from') || '0', 10);
      const suffix = el.getAttribute('data-suffix') || '';
      if (reduceMotion) { el.textContent = to + suffix; return; }
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
  document.querySelectorAll('[data-count-to]').forEach((el) => counterObserver.observe(el));

  // ---------- Digital rain (slow, sparse, theme-aware) ----------
  const canvas = document.getElementById('rain-canvas');
  const ctx = canvas.getContext('2d');
  let columns, drops, speeds, animId, running = false, lastTime = 0;
  const chars = '01アイウエオカキクケコサシスセソΔΣΘΦΨΩ≈≠';
  const FONT_SIZE = 18;
  const COLUMN_GAP = 3;
  const FRAME_INTERVAL = 90;

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const slots = Math.floor(canvas.width / FONT_SIZE);
    columns = Math.ceil(slots / COLUMN_GAP);
    drops = new Array(columns).fill(0).map(() => Math.random() * -60);
    speeds = new Array(columns).fill(0).map(() => 0.4 + Math.random() * 0.8);
  }

  function draw(now) {
    if (!running) return;
    animId = requestAnimationFrame(draw);
    if (now - lastTime < FRAME_INTERVAL) return;
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
      if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.985) drops[i] = 0;
    }
  }

  function start() { if (!running) { running = true; lastTime = 0; animId = requestAnimationFrame(draw); } }
  function stop() { running = false; cancelAnimationFrame(animId); }

  resize();
  window.addEventListener('resize', resize);
  if (reduceMotion) {
    ctx.fillStyle = rainColors.trail.replace(/[\d.]+\)$/, '1)');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
    }, { threshold: 0.05 });
    heroObserver.observe(hero);
  }
});
