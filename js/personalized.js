(function () {
  var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/user/recommendations";

  function getToken() { return window.getCustomerToken ? window.getCustomerToken() : ""; }

  function init() {
    var section = document.getElementById("personalizedSection");
    if (!section) return;
    if (!getToken()) { section.style.display = "none"; return; }
    loadRecommendations();
  }

  function loadRecommendations() {
    fetch(api, { headers: { "Authorization": "Bearer " + getToken() } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success && data.personalized && data.products && data.products.length > 0) {
          renderRecommendations(data.products, data.categories);
        } else {
          var el = document.getElementById("personalizedSection");
          if (el) el.style.display = "none";
        }
      })
      .catch(function () { var el = document.getElementById("personalizedSection"); if (el) el.style.display = "none"; });
  }

  function renderRecommendations(products, categories) {
    var section = document.getElementById("personalizedSection");
    if (!section) return;
    section.style.display = "block";

    var html = '<div class="rec-container">';
    html += '<div class="rec-header"><h2 class="rec-title"><i class="fa-solid fa-wand-magic-sparkles"></i> PICKED FOR YOU</h2>';
    if (categories && categories.length > 0) {
      html += '<p class="rec-sub">Based on your interest in ' + categories.join(", ").toLowerCase() + '</p>';
    }
    html += '</div>';
    html += '<div class="rec-grid">';

    products.slice(0, 8).forEach(function (p) {
      var img = p.image_url || "../images/product1.png";
      var price = Number(p.price) || 0;
      var orig = p.original_price ? Number(p.original_price) : null;
      var disc = orig ? Math.round((1 - price / orig) * 100) : 0;

      html += '<a href="/product?id=' + p.id + '" class="rec-card">';
      html += '<div class="rec-card-img"><img src="' + img + '" alt="' + p.name + '" loading="lazy">';

      if (p.is_limited_edition && p.edition_number) {
        html += '<div class="rec-limited"><i class="fa-solid fa-gem"></i> #' + p.edition_number + '</div>';
      }

      if (disc > 0) html += '<span class="rec-disc">-' + disc + '%</span>';
      if (p.is_new_arrival) html += '<span class="rec-new">NEW</span>';

      html += '</div>';
      html += '<div class="rec-card-info">';
      html += '<h4>' + p.name + '</h4>';
      html += '<div class="rec-card-price">';
      html += '<span class="rec-price">₹' + price.toFixed(0) + '</span>';
      if (orig) html += '<span class="rec-orig">₹' + orig + '</span>';
      html += '</div></div></a>';
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
