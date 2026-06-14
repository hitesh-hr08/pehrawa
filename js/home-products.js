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
