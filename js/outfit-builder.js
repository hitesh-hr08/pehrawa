(function () {
  var allProducts = [];
  var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/public/products";

  function init() {
    var section = document.getElementById("outfitSection");
    if (!section) return;
    loadProducts();
  }

  function loadProducts() {
    fetch(api)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success && data.products) {
          allProducts = data.products;
          renderOutfitSuggestions();
        }
      })
      .catch(function () {});
  }

  function renderOutfitSuggestions() {
    var section = document.getElementById("outfitSection");
    if (!section || allProducts.length < 2) { section.style.display = "none"; return; }
    section.style.display = "block";

    var params = new URLSearchParams(window.location.search);
    var currentId = parseInt(params.get("id")) || 0;
    var current = allProducts.find(function (p) { return p.id == currentId; });
    if (!current) { section.style.display = "none"; return; }

    var suggestions = allProducts.filter(function (p) {
      return p.id !== current.id;
    });

    // Prioritize same category, then different category for contrast
    var sameCat = suggestions.filter(function (p) { return p.category === current.category; });
    var diffCat = suggestions.filter(function (p) { return p.category !== current.category; });

    var picks = [];
    if (sameCat.length > 0) picks.push(sameCat[0]);
    if (diffCat.length > 0) picks.push(diffCat[0]);
    if (diffCat.length > 1) picks.push(diffCat[1]);
    if (sameCat.length > 1) picks.push(sameCat[1]);
    picks = picks.slice(0, 4);

    if (picks.length === 0) { section.style.display = "none"; return; }

    var outfitLabels = ["Top Pick", "Best Match", "Style Pair", "Complete Look"];
    var html = '<div class="outfit-grid">';
    picks.forEach(function (p, i) {
      var img = p.image_url || "../images/product1.png";
      var price = Number(p.price) || 0;
      html += '<a href="/product?id=' + p.id + '" class="outfit-card">' +
        '<div class="outfit-img"><img src="' + img + '" alt="' + p.name + '" loading="lazy">' +
        '<span class="outfit-label">' + outfitLabels[i] + '</span></div>' +
        '<div class="outfit-info"><h4>' + p.name + '</h4>' +
        '<div class="outfit-price">&#8377;' + price.toFixed(0) + '</div>' +
        '</div></a>';
    });
    html += '</div>';
    section.querySelector(".outfit-container").innerHTML = html;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
