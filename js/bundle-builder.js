(function () {
  var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/public/products";

  function init() {
    var section = document.getElementById("bundleSection");
    if (!section) return;
    loadAndRender();
  }

  function loadAndRender() {
    fetch(api)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.success || !data.products) return;
        renderBundle(data.products);
      })
      .catch(function () {});
  }

  function renderBundle(products) {
    var section = document.getElementById("bundleSection");
    if (!section || products.length < 2) { section.style.display = "none"; return; }
    section.style.display = "block";

    var params = new URLSearchParams(window.location.search);
    var currentId = parseInt(params.get("id")) || 0;
    var current = products.find(function (p) { return p.id == currentId; });
    if (!current) { section.style.display = "none"; return; }

    // Find products in same category for bundle
    var sameCat = products.filter(function (p) {
      return p.id !== current.id && p.category && p.category === current.category && p.stock_status !== "out_of_stock";
    });

    if (sameCat.length < 1) {
      // Fall back to any products
      sameCat = products.filter(function (p) {
        return p.id !== current.id && p.stock_status !== "out_of_stock";
      });
    }

    if (sameCat.length === 0) { section.style.display = "none"; return; }

    // Pick top 2 complementary items
    var bundleItems = sameCat.slice(0, 2);
    var allItems = [current].concat(bundleItems);

    // Calculate bundle pricing
    var totalOriginal = allItems.reduce(function (sum, p) {
      var orig = p.original_price ? Number(p.original_price) : Math.round((Number(p.price) || 0) * 1.5);
      return sum + orig;
    }, 0);
    var totalNow = allItems.reduce(function (sum, p) { return sum + (Number(p.price) || 0); }, 0);
    var bundleDiscount = 15;
    var bundleTotal = Math.round(totalNow * (1 - bundleDiscount / 100));
    var savings = totalNow - bundleTotal;

    var html = '<div class="bundle-header">';
    html += '<div class="bundle-title"><i class="fa-solid fa-layer-group"></i> <span>BUNDLE & SAVE ' + bundleDiscount + '%</span></div>';
    html += '<div class="bundle-subtitle">Buy these ' + allItems.length + ' items together and save ₹' + savings + '</div>';
    html += '</div>';

    html += '<div class="bundle-grid">';
    allItems.forEach(function (p, i) {
      var img = p.image_url || "../images/product1.png";
      var price = Number(p.price) || 0;
      var orig = p.original_price ? Number(p.original_price) : Math.round(price * 1.5);
      html += '<div class="bundle-item">';
      html += '<div class="bundle-item-img"><img src="' + img + '" alt="' + p.name + '" loading="lazy">';
      if (i === 0) html += '<span class="bundle-item-badge">THIS ITEM</span>';
      html += '</div>';
      html += '<div class="bundle-item-info">';
      html += '<h4>' + p.name + '</h4>';
      html += '<div class="bundle-item-price">';
      html += '<span class="bundle-price-current">₹' + price.toFixed(0) + '</span>';
      html += '<span class="bundle-price-original">₹' + orig + '</span>';
      html += '</div></div>';
      if (i < allItems.length - 1) html += '<div class="bundle-plus"><i class="fa-solid fa-plus"></i></div>';
      html += '</div>';
    });
    html += '</div>';

    // Summary + CTA
    html += '<div class="bundle-summary">';
    html += '<div class="bundle-pricing">';
    html += '<div class="bundle-row"><span>Regular Price</span><span class="bundle-orig-total">₹' + totalNow + '</span></div>';
    html += '<div class="bundle-row bundle-discount-row"><span>Bundle Discount (' + bundleDiscount + '%)</span><span class="bundle-disc-amount">-₹' + savings + '</span></div>';
    html += '<div class="bundle-row bundle-total-row"><span>Bundle Price</span><span class="bundle-final-total">₹' + bundleTotal + '</span></div>';
    html += '</div>';
    html += '<button class="bundle-cta" onclick="PehrawaBundle.addAllToCart()"><i class="fa-solid fa-cart-plus"></i> Add Bundle to Cart — ₹' + bundleTotal + '</button>';
    html += '<div class="bundle-savings-text">You save ₹' + savings + ' on this bundle!</div>';
    html += '</div>';

    section.querySelector(".bundle-container").innerHTML = html;
  }

  window.PehrawaBundle = {
    addAllToCart: function () {
      var params = new URLSearchParams(window.location.search);
      var currentId = parseInt(params.get("id")) || 0;
      if (!currentId) return;

      fetch(api)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.success || !data.products) return;
          var current = data.products.find(function (p) { return p.id == currentId; });
          if (!current) return;

          var sameCat = data.products.filter(function (p) {
            return p.id !== current.id && p.category && p.category === current.category && p.stock_status !== "out_of_stock";
          });
          if (sameCat.length < 1) {
            sameCat = data.products.filter(function (p) {
              return p.id !== current.id && p.stock_status !== "out_of_stock";
            });
          }

          var bundleItems = [current].concat(sameCat.slice(0, 2));
          var cart = JSON.parse(localStorage.getItem("cart")) || [];

          bundleItems.forEach(function (p) {
            cart.push({
              id: p.id,
              name: p.name,
              price: Number(p.price) || 0,
              image: p.image_url || "../images/product1.png",
              size: "M",
              quantity: 1
            });
          });

          localStorage.setItem("cart", JSON.stringify(cart));

          // Update header badge
          var badge = document.querySelector(".fa-cart-shopping") && document.querySelector(".fa-cart-shopping").parentElement.querySelector("span");
          if (badge) badge.textContent = cart.length;

          if (typeof showToast === "function") showToast("Bundle added to cart! " + bundleItems.length + " items added.");
          setTimeout(function () { window.location.href = "/cart"; }, 1200);
        });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
