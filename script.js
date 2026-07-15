(function () {
  "use strict";

  var html = document.documentElement;

  /* ---------- Theme toggle ----------
     No localStorage on purpose (keeps this safe to preview as a Claude
     artifact). Once hosted for real on GitHub Pages, persist the choice by
     adding localStorage.getItem/setItem('theme') at the two marked spots. */
  var prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  html.setAttribute("data-theme", prefersLight ? "light" : "dark");

  var themeToggle = document.getElementById("themeToggle");
  function setTheme(theme) {
    html.setAttribute("data-theme", theme);
    themeToggle.setAttribute("aria-pressed", theme === "light");
    themeToggle.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");
    // localStorage.setItem('theme', theme); // uncomment once deployed
  }
  themeToggle.addEventListener("click", function () {
    var current = html.getAttribute("data-theme");
    setTheme(current === "dark" ? "light" : "dark");
  });

  /* ---------- Mobile sidebar ---------- */
  var sidebar = document.getElementById("sidebar");
  var burger = document.getElementById("sidebarBurger");
  burger.addEventListener("click", function () {
    var isOpen = sidebar.classList.toggle("sidebar--open");
    burger.setAttribute("aria-expanded", isOpen);
  });
  document.querySelectorAll(".sidebar__nav a").forEach(function (link) {
    link.addEventListener("click", function () {
      sidebar.classList.remove("sidebar--open");
      burger.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- Active nav link on scroll ---------- */
  var navLinks = document.querySelectorAll(".sidebar__nav a");
  var sections = document.querySelectorAll("main > section[id], main > .home[id]");
  function setActive(id) {
    navLinks.forEach(function (l) {
      l.classList.toggle("active", l.getAttribute("href") === "#" + id);
    });
  }
  if ("IntersectionObserver" in window) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.getAttribute("id"));
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    sections.forEach(function (s) { navObserver.observe(s); });
  }
  setActive("home");

  /* ---------- Scroll reveal ---------- */
  var revealTargets = document.querySelectorAll(
    ".project-card, .lab-card, .cert-card, .chip, .timeline li, .about__copy, .stat, .status-widget"
  );
  revealTargets.forEach(function (el) { el.setAttribute("data-reveal", ""); });

  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll(".stat__value[data-count]");
  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1100;
    var start = null;
    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) window.requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    window.requestAnimationFrame(step);
  }
  if (counters.length && "IntersectionObserver" in window) {
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { counterObserver.observe(el); });
  }

  /* ---------- Sidebar clock (South Africa time, regardless of visitor timezone) ---------- */
  var clockTime = document.getElementById("clockTime");
  function updateClock() {
    var formatted = new Intl.DateTimeFormat("en-ZA", {
      timeZone: "Africa/Johannesburg",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(new Date());
    clockTime.textContent = formatted;
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ---------- Back to top ---------- */
  document.getElementById("backToTop").addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Contact form (mailto fallback) ----------
     GitHub Pages can't run a backend, so this builds a mailto: link from
     the form fields. Swap for a Formspree/Getform endpoint for an in-page
     send. */
  var form = document.getElementById("contactForm");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("cf-name").value;
    var email = document.getElementById("cf-email").value;
    var message = document.getElementById("cf-message").value;
    var subject = encodeURIComponent("Portfolio enquiry from " + name);
    var body = encodeURIComponent(message + "\n\n— " + name + " (" + email + ")");
    window.location.href = "mailto:molusiteboho@gmail.com?subject=" + subject + "&body=" + body;
  });
})();
