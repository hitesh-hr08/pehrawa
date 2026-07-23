(function () {
  // Scroll Reveal with IntersectionObserver
  function initScrollReveal() {
    var revealElements = document.querySelectorAll(
      ".product-card, .category-card, .dd-grid, .rv-card, .cs-grid-item, .gallery-item, .reward-card, .vault-item, .outfit-card, .benefit, .card, .value, .collection-box, .step"
    );

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

      revealElements.forEach(function (el) { observer.observe(el); });
    } else {
      revealElements.forEach(function (el) { el.classList.add("revealed"); });
    }
  }

  // Scroll Progress Bar
  function initScrollProgress() {
    var bar = document.querySelector(".scroll-progress");
    if (!bar) {
      bar = document.createElement("div");
      bar.className = "scroll-progress";
      document.body.appendChild(bar);
    }
    window.addEventListener("scroll", function () {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = progress + "%";
    });
  }

  // Smooth page transitions on internal links
  function initPageTransitions() {
    document.querySelectorAll('a[href^="/"]').forEach(function (link) {
      if (link.target === "_blank") return;
      link.addEventListener("click", function (e) {
        if (e.ctrlKey || e.metaKey) return;
        var href = link.getAttribute("href");
        if (!href || href.startsWith("/admin") || href.startsWith("/api")) return;
        e.preventDefault();
        document.body.classList.add("page-exit");
        setTimeout(function () { window.location.href = href; }, 350);
      });
    });
  }

  // Parallax on hero (subtle)
  function initParallax() {
    var heroImg = document.querySelector(".hero-img");
    if (!heroImg) return;
    window.addEventListener("scroll", function () {
      var scroll = window.scrollY;
      if (scroll < 1200) {
        heroImg.style.transform = "translateY(" + (scroll * 0.15) + "px)";
      }
    });
  }

  // Magnetic hover on buttons
  function initMagneticHover() {
    document.querySelectorAll(".dd-buy, .hero-btns a, .login-btn").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = "translate(" + (x * 0.15) + "px, " + (y * 0.15) + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  }

  // Shimmer text effect on section titles
  function initShimmerTitles() {
    document.querySelectorAll(".dd-label, .rv-title, .cs-title, .gallery-title").forEach(function (el) {
      el.classList.add("gradient-text");
    });
  }

  // Product card tilt on hover (3D effect)
  function initCardTilt() {
    document.querySelectorAll(".product-card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = "perspective(600px) rotateY(" + (x * 6) + "deg) rotateX(" + (-y * 6) + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initScrollReveal();
      initScrollProgress();
      initPageTransitions();
      initParallax();
      initMagneticHover();
      initShimmerTitles();
      setTimeout(initCardTilt, 500);
    });
  } else {
    initScrollReveal();
    initScrollProgress();
    initPageTransitions();
    initParallax();
    initMagneticHover();
    initShimmerTitles();
    setTimeout(initCardTilt, 500);
  }
})();
