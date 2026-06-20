// ===============================
// PEHRAWA PREMIUM ANIMATIONS
// ===============================

// === 1. NAVBAR GLASS ===
(function () {
  var header = document.querySelector(".header");
  if (!header) return;
  window.addEventListener("scroll", function () {
    header.classList.toggle("header-glass", window.scrollY > 50);
  });
})();

// === 2. SCROLL REVEAL (IntersectionObserver) ===
(function () {
  var els = document.querySelectorAll(
    ".product-card, .feature-box, .step, .process-card, .section-title, .hero-content, .hero-image, .custom-left, .custom-right, .shop-banner, .category-head, .footer-col, .why-card, .custom-hero, .custom-form-box, .about-content, .contact-content"
  );
  if (!("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("revealed"); });
    return;
  }
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  els.forEach(function (el) { obs.observe(el); });
})();

// === 3. STAGGER GRID ITEMS ===
(function () {
  document.querySelectorAll(".product-grid, .features-grid, .process-grid").forEach(function (grid) {
    grid.querySelectorAll(".product-card, .feature-box, .process-card").forEach(function (card, i) {
      card.style.setProperty("--delay", i * 0.08 + "s");
    });
  });
})();

// === 4. 3D TILT ON PRODUCT CARDS ===
(function () {
  var cards = document.querySelectorAll(".product-card");
  if (cards.length === 0) return;

  cards.forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var centerX = rect.width / 2;
      var centerY = rect.height / 2;
      var rotateX = ((y - centerY) / centerY) * -8;
      var rotateY = ((x - centerX) / centerX) * 8;
      card.style.setProperty("--rx", rotateX + "deg");
      card.style.setProperty("--ry", rotateY + "deg");
      card.style.setProperty("--s", "1.03");
      card.style.setProperty("--shadow-x", ((x - centerX) / centerX) * 10 + "px");
      card.style.setProperty("--shadow-y", ((y - centerY) / centerY) * 10 + "px");
    });
    card.addEventListener("mouseleave", function () {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--s", "1");
      card.style.setProperty("--shadow-x", "0px");
      card.style.setProperty("--shadow-y", "0px");
    });
  });
})();

// === 5. MAGNETIC BUTTONS ===
(function () {
  var btns = document.querySelectorAll(".btn-orange, .btn-dark, .buy-now-btn, .custom-submit-btn, .checkout-submit, .filter-btn");
  btns.forEach(function (btn) {
    btn.addEventListener("mousemove", function (e) {
      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left - rect.width / 2;
      var y = e.clientY - rect.top - rect.height / 2;
      var dist = Math.sqrt(x * x + y * y);
      var maxDist = 150;
      var strength = Math.max(0, 1 - dist / maxDist) * 8;
      btn.style.setProperty("--mx", (x / rect.width) * strength + "px");
      btn.style.setProperty("--my", (y / rect.height) * strength + "px");
    });
    btn.addEventListener("mouseleave", function () {
      btn.style.setProperty("--mx", "0px");
      btn.style.setProperty("--my", "0px");
    });
  });
})();

// === 6. HERO PARALLAX ===
(function () {
  var hero = document.querySelector(".hero");
  var hc = document.querySelector(".hero-content");
  var hi = document.querySelector(".hero-image");
  if (!hero || !hc || !hi) return;
  window.addEventListener("scroll", function () {
    var t = Math.max(0, -hero.getBoundingClientRect().top);
    if (t > 0 && t < 400) {
      hc.style.transform = "translateY(" + (t * 0.15) + "px)";
      hi.style.transform = "translateY(" + (t * -0.1) + "px)";
    }
  });
})();

// === 7. FOOTER ANIMATION: tiny logo spin ===
(function () {
  var logos = document.querySelectorAll(".footer-logo");
  logos.forEach(function (l) {
    l.addEventListener("mouseenter", function () {
      this.style.transform = "rotate(5deg) scale(1.05)";
    });
    l.addEventListener("mouseleave", function () {
      this.style.transform = "";
    });
  });
})();

// === 8. PRODUCT IMAGE ZOOM ON HOVER ===
(function () {
  document.querySelectorAll(".product-image").forEach(function (wrap) {
    var img = wrap.querySelector("img");
    if (!img) return;
    wrap.addEventListener("mousemove", function (e) {
      var r = wrap.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width) * 20 - 10;
      var y = ((e.clientY - r.top) / r.height) * 20 - 10;
      img.style.transform = "scale(1.12) translate(" + x + "px, " + y + "px)";
    });
    wrap.addEventListener("mouseleave", function () {
      img.style.transform = "";
    });
  });
})();

// ===============================
// HERO PARTICLES CANVAS
// ===============================
(function () {
  var hero = document.querySelector(".hero");
  if (!hero) return;
  var canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;";
  canvas.width = hero.offsetWidth;
  canvas.height = hero.offsetHeight;
  hero.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  var particles = [];
  var count = 60;

  function resize() {
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }
  window.addEventListener("resize", resize);

  for (var i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
      a: Math.random() * 0.4 + 0.1
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(function (p) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 122, 0, " + p.a + ")";
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// === 9. COUNT-UP NUMBERS ===
(function () {
  var counters = document.querySelectorAll(".count-num");
  if (!counters.length) return;
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        var target = parseInt(el.getAttribute("data-target")) || 0;
        var dur = 2000;
        var start = performance.now();
        function update(now) {
          var p = Math.min((now - start) / dur, 1);
          el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target);
          if (p < 1) requestAnimationFrame(update);
          else el.textContent = target;
        }
        requestAnimationFrame(update);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(function (c) { obs.observe(c); });
})();

console.log("Pehrawa premium animations loaded");
