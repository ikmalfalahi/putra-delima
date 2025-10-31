// landing.js - lightweight interactions: header shrink, mobile nav, smooth scroll, simple AOS
document.addEventListener("DOMContentLoaded", () => {
  // header shrink
  const header = document.getElementById("siteHeader");
  const hamburger = document.getElementById("hamburger");
  const nav = document.getElementById("mainNav");
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function checkScroll() {
    if (window.scrollY > 40) header.classList.add("shrink");
    else header.classList.remove("shrink");
  }
  checkScroll();
  window.addEventListener("scroll", checkScroll);

  // mobile nav toggle
  hamburger && hamburger.addEventListener("click", () => {
    if (!nav) return;
    if (nav.style.display === "flex") {
      nav.style.display = "";
    } else {
      nav.style.display = "flex";
      nav.style.flexDirection = "column";
      nav.style.gap = "10px";
      nav.style.background = "rgba(0,0,0,0.85)";
      nav.style.padding = "12px";
      nav.style.position = "absolute";
      nav.style.right = "20px";
      nav.style.top = "64px";
      nav.style.borderRadius = "10px";
    }
  });

  // smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (href === "#" || href === "") return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const offset = window.scrollY + rect.top - 70; // account for header
      window.scrollTo({ top: offset, behavior: "smooth" });
      // close mobile nav if open
      if (nav && window.innerWidth <= 680) nav.style.display = "";
    });
  });

  // small AOS: add class when element in viewport
  const aosElements = document.querySelectorAll("[data-aos]");
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add("aos-animate");
      }
    });
  }, { threshold: 0.12 });

  aosElements.forEach(el => obs.observe(el));
});
