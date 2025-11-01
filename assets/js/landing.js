// landing.js - header shrink, mobile nav, smooth scroll, simple fade-in
document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("siteHeader");
  const hamburger = document.getElementById("hamburger");
  const nav = document.getElementById("mainNav");
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // shrink header
  function onScroll() {
    if (window.scrollY > 40) header.classList.add("shrink");
    else header.classList.remove("shrink");
  }
  onScroll();
  window.addEventListener("scroll", onScroll);

  // toggle mobile nav
  hamburger?.addEventListener("click", () => {
    nav.style.display = nav.style.display === "flex" ? "" : "flex";
  });

  // smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: "smooth" });
      if (window.innerWidth < 768) nav.style.display = "";
    });
  });

  // fade-in (simple AOS)
  const els = document.querySelectorAll(".section, .hero-content, img");
  const obs = new IntersectionObserver(entries => {
    entries.forEach(en => en.isIntersecting && en.target.classList.add("fade-in"));
  }, { threshold: 0.2 });
  els.forEach(el => obs.observe(el));
});
