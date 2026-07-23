(function () {
  var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/public/daily-drop";
  var countdownInterval = null;

  function init() {
    fetch(api)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success && data.drop) renderDailyDrop(data.drop);
        else renderFallback();
      })
      .catch(function () { renderFallback(); });
  }

  function renderFallback() {
    var el = document.getElementById("dailyDropSection");
    if (el) el.style.display = "none";
  }

  function renderDailyDrop(drop) {
    var section = document.getElementById("dailyDropSection");
    if (!section) return;
    section.style.display = "block";

    var img = drop.image_url || "../images/product1.png";
    var price = Number(drop.price) || 0;
    var orig = drop.original_price ? Number(drop.original_price) : Math.round(price * 1.5);
    var disc = orig > price ? Math.round((1 - price / orig) * 100) : 0;

    var countdownHtml = '<div class="dd-countdown"><div class="dd-cd-item"><span id="ddHours">00</span><small>Hours</small></div><div class="dd-cd-sep">:</div><div class="dd-cd-item"><span id="ddMins">00</span><small>Mins</small></div><div class="dd-cd-sep">:</div><div class="dd-cd-item"><span id="ddSecs">00</span><small>Secs</small></div></div>';

    section.innerHTML =
      '<div class="container"><div class="dd-label"><i class="fa-solid fa-bolt"></i> TODAY\'S EXCLUSIVE DROP</div>' +
      '<div class="dd-grid">' +
      '<div class="dd-image"><img src="' + img + '" alt="' + drop.name + '">' +
      '<div class="dd-badge">-' + disc + '%</div></div>' +
      '<div class="dd-info">' +
      '<h2 class="dd-title">' + drop.name + '</h2>' +
      '<p class="dd-desc">' + (drop.description || "Premium limited edition piece. Once it's gone, it's gone.") + '</p>' +
      '<div class="dd-price">&#8377;' + price.toFixed(0) + '<span class="dd-orig">&#8377;' + orig + '</span><span class="dd-disc">' + disc + '% OFF</span></div>' +
      countdownHtml +
      '<div class="dd-stock"><i class="fa-solid fa-fire"></i> <span id="ddViewers">' + (Math.floor(Math.random() * 40) + 15) + '</span> people viewing this right now</div>' +
      '<div class="dd-actions">' +
      '<a href="/product?id=' + drop.product_id + '" class="dd-buy"><i class="fa-solid fa-bag-shopping"></i> GRAB IT NOW</a>' +
      '<button class="dd-wishlist-btn" onclick="addDropToWishlist(' + drop.product_id + ')"><i class="fa-regular fa-heart"></i></button>' +
      '</div></div></div>';

    startCountdown();
    animateViewers();
  }

  function startCountdown() {
    var now = new Date();
    var endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    function update() {
      var diff = endOfDay - new Date();
      if (diff <= 0) { diff = 0; clearInterval(countdownInterval); }
      var h = Math.floor(diff / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      var hEl = document.getElementById("ddHours");
      var mEl = document.getElementById("ddMins");
      var sEl = document.getElementById("ddSecs");
      if (hEl) hEl.textContent = h < 10 ? "0" + h : h;
      if (mEl) mEl.textContent = m < 10 ? "0" + m : m;
      if (sEl) sEl.textContent = s < 10 ? "0" + s : s;
    }
    update();
    countdownInterval = setInterval(update, 1000);
  }

  function animateViewers() {
    setInterval(function () {
      var el = document.getElementById("ddViewers");
      if (el) {
        var v = parseInt(el.textContent) || 20;
        var delta = Math.floor(Math.random() * 5) - 2;
        el.textContent = Math.max(10, v + delta);
      }
    }, 3000);
  }

  window.addDropToWishlist = function (id) {
    var items = JSON.parse(localStorage.getItem("wishlist")) || [];
    var exists = items.find(function (i) { return i.id == id; });
    if (!exists) {
      items.push({ id: id, name: "Daily Drop", price: 0, image: "../images/product1.png" });
      localStorage.setItem("wishlist", JSON.stringify(items));
      if (typeof showToast === "function") showToast("Added to wishlist");
    } else {
      if (typeof showToast === "function") showToast("Already in wishlist");
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
