(function () {
  function renderCard(p) {
    var img = p.image_url || p.image || "../images/product1.png";
    var origPrice = p.original_price ? Number(p.original_price) : Math.round(Number(p.price) * 1.5);
    var pr = Number(p.price) || 0;
    var disc = origPrice > pr ? Math.round((1 - pr / origPrice) * 100) : 0;
    var rating = (3.5 + Math.random() * 1.5).toFixed(1);
    var reviews = Math.floor(Math.random() * 500) + 20;
    var badges = "";
    if (p.stock_status === "out_of_stock") badges += '<span class="p-status p-out-of-stock">Out of Stock</span>';
    else if (p.stock_status === "limited_stock") badges += '<span class="p-status p-limited">Limited</span>';
    if (p.is_new_arrival) badges += '<span class="p-status p-new">New</span>';
    if (p.is_trending) badges += '<span class="p-status p-trending">Trending</span>';
    if (p.is_hot_seller) badges += '<span class="p-status p-hot">Hot</span>';
    return '<div class="product-card revealed">' +
      '<div class="product-image">' +
        '<span class="product-badge">-' + disc + '%</span>' +
        badges +
        '<a href="product.html?id=' + p.id + '">' +
          '<img src="' + img + '" alt="' + p.name + '">' +
        '</a>' +
      '</div>' +
      '<div class="product-content">' +
        '<h3><a href="product.html?id=' + p.id + '" class="product-link">' + p.name + '</a></h3>' +
        '<div class="product-rating">' +
          '<span class="stars">' + '&#9733;'.repeat(Math.round(rating)) + '</span>' +
          '<span class="count">' + rating + ' (' + reviews + ')</span>' +
        '</div>' +
        '<div class="price">&#8377;' + pr.toFixed(0) +
          '<span class="orig">&#8377;' + origPrice + '</span>' +
          '<span class="discount">' + disc + '% off</span>' +
        '</div>' +
        '<button class="buy-now-btn" data-id="' + p.id + '" data-name="' + p.name.replace(/'/g, "\\'") + '" data-price="' + pr + '" data-image="' + img + '">' +
          '<i class="fa-solid fa-bag-shopping"></i>ADD TO CART' +
        '</button>' +
      '</div>' +
    '</div>';
  }

  function showProducts(products) {
    var grid = document.getElementById("bestSellerGrid");
    if (!grid) return;
    grid.innerHTML = products.map(renderCard).join("");
  }

  function loadBestSellers() {
    var grid = document.getElementById("bestSellerGrid");
    if (!grid) return;
    grid.innerHTML = '<div style="text-align:center;padding:40px;color:#888;"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div>';

    var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/public/products";
    fetch(api)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        if (data.success && data.products && data.products.length > 0) {
          showProducts(data.products.slice(0, 6));
        } else {
          grid.innerHTML = '<div style="text-align:center;padding:40px;color:#888;">No products available.</div>';
        }
      })
      .catch(function () {
        grid.innerHTML = '<div style="text-align:center;padding:40px;color:#888;">Server not connected.</div>';
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadBestSellers);
  } else {
    loadBestSellers();
  }
})();
