(function () {
  var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/public/trending";

  function init() {
    var section = document.getElementById("trendingSection");
    if (!section) return;
    loadTrending();
  }

  function loadTrending() {
    fetch(api + "?limit=8")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success && data.products && data.products.length > 0) renderTrending(data.products);
        else { var el = document.getElementById("trendingSection"); if (el) el.style.display = "none"; }
      })
      .catch(function () { var el = document.getElementById("trendingSection"); if (el) el.style.display = "none"; });
  }

  function renderTrending(products) {
    var section = document.getElementById("trendingSection");
    if (!section) return;
    section.style.display = "block";

    var html = '<div class="tr-container">';
    html += '<div class="tr-header"><h2 class="tr-title"><i class="fa-solid fa-fire"></i> TRENDING NOW</h2>';
    html += '<p class="tr-sub">What everyone\'s wearing this week</p></div>';
    html += '<div class="tr-grid">';

    products.forEach(function (p, i) {
      var img = p.image_url || "../images/product1.png";
      var price = Number(p.price) || 0;
      var orig = p.original_price ? Number(p.original_price) : null;
      var disc = orig ? Math.round((1 - price / orig) * 100) : 0;

      html += '<a href="/product?id=' + p.id + '" class="tr-card">';
      html += '<div class="tr-card-img"><img src="' + img + '" alt="' + p.name + '" loading="lazy">';

      // Rank badge
      if (i < 3) {
        var rankColors = ["#ff6b00", "#c0c0c0", "#cd7f32"];
        html += '<div class="tr-rank" style="background:' + rankColors[i] + '">#' + (i + 1) + '</div>';
      }

      // Limited edition badge
      if (p.is_limited_edition && p.edition_number && p.edition_total) {
        html += '<div class="tr-limited"><i class="fa-solid fa-gem"></i> #' + p.edition_number + ' of ' + p.edition_total + '</div>';
      }

      // Discount
      if (disc > 0) html += '<span class="tr-disc">-' + disc + '%</span>';

      html += '</div>';
      html += '<div class="tr-card-info">';
      html += '<h4>' + p.name + '</h4>';
      html += '<div class="tr-card-price">';
      html += '<span class="tr-price">₹' + price.toFixed(0) + '</span>';
      if (orig) html += '<span class="tr-orig">₹' + orig + '</span>';
      html += '</div>';
      if (p.category) html += '<div class="tr-cat">' + p.category + '</div>';
      html += '</div></a>';
    });

    html += '</div></div>';
    section.innerHTML = html;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
