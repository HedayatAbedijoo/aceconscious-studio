(function () {
  "use strict";

  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".site-nav__links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const revealEls = document.querySelectorAll(".reveal");
  const showReveal = (el) => el.classList.add("visible");

  if (revealEls.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            showReveal(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -10% 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));

    // Failsafe: never leave the page blank if IO never fires (common on some mobile browsers).
    window.setTimeout(() => {
      revealEls.forEach((el) => {
        if (!el.classList.contains("visible")) showReveal(el);
      });
    }, 900);
  } else {
    revealEls.forEach(showReveal);
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
