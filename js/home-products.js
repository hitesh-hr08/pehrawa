(function () {
  function loadProducts() {
    var grid = document.getElementById("bestSellerGrid");
    if (!grid) return;
    var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/public/products";
    fetch(api)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!data.success || !data.products || data.products.length === 0) {
          grid.innerHTML = '<div class="shop-state">No products available.</div>';
          return;
        }
        var products = data.products.slice(0, 4);
        grid.innerHTML = products.map(function (p) {
          var img = p.image_url || "../images/product1.png";
          return '<div class="product-card revealed">' +
            '<div class="product-image">' +
              '<a href="product.html?id=' + p.id + '">' +
                '<img src="' + img + '" alt="' + p.name + '">' +
              '</a>' +
            '</div>' +
            '<div class="product-content">' +
              '<p class="sku">PM-' + String(p.id).padStart(3, "0") + '</p>' +
              '<h3><a href="product.html?id=' + p.id + '" class="product-link">' + p.name + '</a></h3>' +
              '<div class="price">&#8377;' + Number(p.price).toFixed(2) + '</div>' +
              '<button class="buy-now-btn" data-id="' + p.id + '" data-name="' + p.name + '" data-price="' + p.price + '" data-image="' + img + '">' +
                '<i class="fa-solid fa-bag-shopping"></i>BUY NOW' +
              '</button>' +
            '</div>' +
          '</div>';
        }).join("");
      })
      .catch(function () {
        grid.innerHTML = '<div class="shop-state">Unable to load products.</div>';
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadProducts);
  } else {
    loadProducts();
  }
})();
