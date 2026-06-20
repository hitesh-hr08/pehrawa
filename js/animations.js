// ===============================
// PEHRAWA LUXURY ANIMATIONS
// ===============================

// === Navbar Glass Effect on Scroll ===
(function navGlass() {
  var header = document.querySelector(".header");
  if (!header) return;
  window.addEventListener("scroll", function () {
    if (window.scrollY > 50) {
      header.classList.add("header-glass");
    } else {
      header.classList.remove("header-glass");
    }
  });
})();

// === Scroll Reveal with IntersectionObserver ===
(function scrollReveal() {
  var revealElements = document.querySelectorAll(
    ".product-card, .feature-box, .step, .process-card, .section-title, .hero-content, .hero-image, .custom-left, .custom-right, .shop-banner, .category-head, .footer-col, .why-card, .custom-hero, .custom-form-box"
  );

  if (!("IntersectionObserver" in window)) {
    revealElements.forEach(function (el) { el.classList.add("revealed"); });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  revealElements.forEach(function (el) {
    observer.observe(el);
  });
})();

// === Stagger Animation for Product Grid ===
(function staggerCards() {
  var grids = document.querySelectorAll(".product-grid, .features-grid, .process-grid");
  grids.forEach(function (grid) {
    var cards = grid.querySelectorAll(".product-card, .feature-box, .process-card");
    cards.forEach(function (card, i) {
      card.style.setProperty("--delay", i * 0.08 + "s");
    });
  });
})();

// === Counter Animation ===
(function counterAnim() {
  var counters = document.querySelectorAll(".count-num");
  if (counters.length === 0) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var target = parseInt(el.getAttribute("data-target")) || 0;
          var duration = 2000;
          var start = performance.now();

          function update(now) {
            var elapsed = now - start;
            var progress = Math.min(elapsed / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target);
            if (progress < 1) requestAnimationFrame(update);
            else el.textContent = target;
          }
          requestAnimationFrame(update);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(function (c) { observer.observe(c); });
})();

// === Hero Parallax ===
(function heroParallax() {
  var hero = document.querySelector(".hero");
  var heroContent = document.querySelector(".hero-content");
  var heroImage = document.querySelector(".hero-image");
  if (!hero || !heroContent || !heroImage) return;

  window.addEventListener("scroll", function () {
    var rect = hero.getBoundingClientRect();
    var scrolled = Math.max(0, -rect.top);
    if (scrolled > 0 && scrolled < 400) {
      heroContent.style.transform = "translateY(" + (scrolled * 0.15) + "px)";
      heroImage.style.transform = "translateY(" + (scrolled * -0.1) + "px)";
    }
  });
})();

// === Smooth Number Counter for Price Display ===
// (no-op — kept for extension)

console.log("Pehrawa animations loaded");
