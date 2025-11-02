document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("siteHeader");
  const hamburger = document.getElementById("hamburger");
  const mobileNav = document.getElementById("mobileNav");
  const themeToggle = document.getElementById("themeToggle");
  const yearEl = document.getElementById("year");

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Theme toggle
  const currentTheme = localStorage.getItem("theme");
  if (currentTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️";
  }

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const dark = document.body.classList.contains("dark");
    themeToggle.textContent = dark ? "☀️" : "🌙";
    localStorage.setItem("theme", dark ? "dark" : "light");
  });

  // Header shrink
  window.addEventListener("scroll", () => {
    header.classList.toggle("shrink", window.scrollY > 50);
  });

  // Mobile nav toggle
  hamburger.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
  });

  document.querySelectorAll("#mobileNav a").forEach(a =>
    a.addEventListener("click", () => mobileNav.classList.remove("open"))
  );

  // AOS animation observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("aos-animate");
    });
  }, { threshold: 0.12 });
  document.querySelectorAll("[data-aos]").forEach(el => observer.observe(el));

  // ======= LOAD DYNAMIC CONTENT FROM landing_data.js =======
  if (typeof loadLandingData === "function") loadLandingData();
});
