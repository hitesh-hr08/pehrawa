(function () {
  var localProducts = [
    { id: 1, name: "Oversized Graphic Tee", price: 799, image: "../images/product1.png" },
    { id: 2, name: "Premium Streetwear Tee", price: 899, image: "../images/product2.png" },
    { id: 3, name: "Pehrawa Signature T-Shirt", price: 749, image: "../images/product3.png" },
    { id: 4, name: "Classic Printed T-Shirt", price: 699, image: "../images/product4.png" },
    { id: 5, name: "Urban Style Tee", price: 849, image: "../images/product5.png" },
    { id: 6, name: "Minimal Logo Tee", price: 649, image: "../images/product6.png" }
  ];

  function renderProducts(products) {
    return products.map(function (p) {
      var img = p.image_url || p.image;
      var origPrice = Math.round(p.price * 1.5);
      var discount = Math.round((1 - p.price / origPrice) * 100);
      var rating = (3.5 + Math.random() * 1.5).toFixed(1);
      var reviews = Math.floor(Math.random() * 500) + 20;
      return '<div class="product-card revealed">' +
        '<div class="product-image">' +
          '<span class="product-badge">-' + discount + '%</span>' +
          '<a href="product.html?id=' + p.id + '">' +
            '<img src="' + img + '" alt="' + p.name + '">' +
          '</a>' +
        '</div>' +
        '<div class="product-content">' +
          '<h3><a href="product.html?id=' + p.id + '" class="product-link">' + p.name + '</a></h3>' +
          '<div class="product-rating">' +
            '<span class="stars">' + '★'.repeat(Math.round(rating)) + '</span>' +
            '<span class="count">' + rating + ' (' + reviews + ')</span>' +
          '</div>' +
          '<div class="price">&#8377;' + Number(p.price).toFixed(0) +
            '<span class="orig">&#8377;' + origPrice + '</span>' +
            '<span class="discount">' + discount + '% off</span>' +
          '</div>' +
          '<button class="buy-now-btn" data-id="' + p.id + '" data-name="' + p.name + '" data-price="' + p.price + '" data-image="' + img + '">' +
            '<i class="fa-solid fa-bag-shopping"></i>ADD TO CART' +
          '</button>' +
        '</div>' +
      '</div>';
    }).join("");
  }

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
          grid.innerHTML = renderProducts(localProducts);
          return;
        }
        var products = data.products.slice(0, 4);
        grid.innerHTML = renderProducts(products);
      })
      .catch(function () {
        grid.innerHTML = renderProducts(localProducts);
      });
  }

  function initProducts() {
    var grid = document.getElementById("bestSellerGrid");
    if (grid) grid.innerHTML = renderProducts(localProducts);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", loadProducts);
    } else {
      loadProducts();
    }
  }

  initProducts();
})();
