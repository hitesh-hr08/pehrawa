(function () {
  const API_URL = `${window.PEHRAWA_API_BASE || "http://localhost:5000"}/api/public/products`;
  const productGrid = document.getElementById("shopProductGrid");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const searchInput = document.querySelector(".search-input");
  let shopProducts = [];
  let activeFilter = "ALL";
  let searchTerm = "";

  const staticFallback = [
    { id: 1, name: "Fearless Oversized Tee", price: 799, image_url: "../images/product1.png", category: "OVERSIZED GRAPHIC" },
    { id: 2, name: "Shadow Anime Tee", price: 749, image_url: "../images/product2.png", category: "ANIME" },
    { id: 3, name: "Abstract Vision Tee", price: 749, image_url: "../images/product3.png", category: "GRAPHIC" },
    { id: 4, name: "Minimal Logo Tee", price: 699, image_url: "../images/product4.png", category: "MINIMAL" },
    { id: 5, name: "Street Graphic Tee", price: 849, image_url: "../images/product5.png", category: "GRAPHIC" },
    { id: 6, name: "Urban Anime Tee", price: 799, image_url: "../images/product6.png", category: "ANIME OVERSIZED" },
    { id: 7, name: "Classic Oxford Shirt", price: 1299, image_url: "../images/Shirt1.avif", category: "SHIRTS" },
    { id: 8, name: "Black Cuban Collar Shirt", price: 1399, image_url: "../images/Shirt2.webp", category: "SHIRTS" },
    { id: 9, name: "Relaxed Denim Shirt", price: 1599, image_url: "../images/Shirt3.webp", category: "SHIRTS" },
    { id: 10, name: "White Street Sneakers", price: 2499, image_url: "../images/Footwear1.webp", category: "FOOTWEAR" },
    { id: 11, name: "Urban Slip-On Loafers", price: 2199, image_url: "../images/Footwear2.jpg", category: "FOOTWEAR" },
    { id: 12, name: "Chunky Street Sneakers", price: 2899, image_url: "../images/Footwear3.jpg", category: "FOOTWEAR" },
    { id: 13, name: "Aviator Sunglasses", price: 999, image_url: "../images/Sunglasses1.webp", category: "SUNGLASSES" },
    { id: 14, name: "Square Black Sunglasses", price: 1099, image_url: "../images/Sunglasses2.webp", category: "SUNGLASSES" },
    { id: 15, name: "Minimal Black Watch", price: 1899, image_url: "../images/Watch1.jpg", category: "WATCHES" },
    { id: 16, name: "Brown Strap Chrono Watch", price: 2299, image_url: "../images/Watch2.jpg", category: "WATCHES" }
  ];

  if (!productGrid) return;

  function renderCard(product) {
    const imageUrl = product.image_url || "../images/product1.png";
    const price = parseFloat(product.price) || 0;
    const origPrice = product.original_price ? Number(product.original_price) : Math.round(price * 1.5);
    const discount = origPrice > price ? Math.round((1 - price / origPrice) * 100) : 0;
    const rating = (3.5 + Math.random() * 1.5).toFixed(1);
    const reviews = Math.floor(Math.random() * 500) + 20;

    var badges = "";
    if (product.stock_status === "out_of_stock") badges += '<span class="p-status p-out-of-stock">Out of Stock</span>';
    else if (product.stock_status === "limited_stock") badges += '<span class="p-status p-limited">Limited</span>';
    if (product.is_new_arrival) badges += '<span class="p-status p-new">New</span>';
    if (product.is_trending) badges += '<span class="p-status p-trending">Trending</span>';
    if (product.is_hot_seller) badges += '<span class="p-status p-hot">Hot</span>';

    return '<div class="product-card revealed">' +
      '<div class="product-image">' +
        '<span class="product-badge">-' + discount + '%</span>' +
        badges +
        '<a href="product.html?id=' + product.id + '">' +
          '<img src="' + imageUrl + '" alt="' + product.name + '">' +
        '</a>' +
      '</div>' +
      '<div class="product-content">' +
        '<h3>' + product.name + '</h3>' +
        '<div class="product-rating">' +
          '<span class="stars">' + '&#9733;'.repeat(Math.round(rating)) + '</span>' +
          '<span class="count">' + rating + ' (' + reviews + ')</span>' +
        '</div>' +
        '<div class="price">&#8377;' + price.toFixed(0) +
          '<span class="orig">&#8377;' + origPrice + '</span>' +
          '<span class="discount">' + discount + '% off</span>' +
        '</div>' +
        '<div class="shop-btn-group">' +
        '<button class="add-cart-btn" data-id="' + product.id + '">' +
          '<i class="fa-solid fa-cart-plus"></i> ADD TO CART' +
        '</button>' +
        '<button class="buy-now-btn" data-id="' + product.id + '" data-name="' + product.name.replace(/'/g, "\\'") + '" data-price="' + price + '" data-image="' + imageUrl + '">' +
          '<i class="fa-solid fa-bag-shopping"></i> BUY NOW' +
        '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderProducts() {
    var tshirtCats = ["ANIME","GRAPHIC","MINIMAL","OVERSIZED","PRINTED T-SHIRTS"];
    var filterMap = {
      "T-SHIRTS": function(cat){ return tshirtCats.some(function(k){ return cat.includes(k); }); },
      "SHIRTS": function(cat){ return cat.includes("SHIRTS") && !cat.includes("T-SHIRTS"); },
      "JEANS": function(cat){ return cat.includes("JEANS"); }
    };
    const filtered = shopProducts.filter(function(product) {
      const category = (product.category || "").toUpperCase();
      const name = (product.name || "").toLowerCase();
      const description = (product.description || "").toLowerCase();
      var matchFn = filterMap[activeFilter];
      const matchesFilter = activeFilter === "ALL" || (matchFn ? matchFn(category) : category.includes(activeFilter));
      const matchesSearch = !searchTerm || name.includes(searchTerm) || description.includes(searchTerm) || category.toLowerCase().includes(searchTerm);
      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      productGrid.innerHTML = '<div class="shop-state">No products found.</div>';
      return;
    }
    productGrid.innerHTML = filtered.map(renderCard).join("");
  }

  function findProduct(productId) {
    return shopProducts.find(function(item) { return item.id === productId; }) || staticFallback.find(function(item) { return item.id === productId; });
  }

  function saveItem(key, productId) {
    const product = findProduct(productId);
    if (!product) return;
    const currentItems = JSON.parse(localStorage.getItem(key)) || [];
    currentItems.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image_url || "../images/product1.png",
      size: "M",
      quantity: 1
    });
    localStorage.setItem(key, JSON.stringify(currentItems));
    var selector = key === "cart" ? ".fa-cart-shopping" : ".fa-heart";
    var icon = document.querySelector(selector);
    var badge = icon && icon.parentElement.querySelector("span");
    if (badge) badge.textContent = currentItems.length;
    if (typeof showToast === "function") showToast(product.name + " added to " + key);
  }

  window.addToCart = function (productId) { saveItem("cart", productId); };
  window.addToWishlist = function (productId) { saveItem("wishlist", productId); };

  // Add to Cart button handler
  productGrid.addEventListener("click", function(e) {
    var btn = e.target.closest(".add-cart-btn");
    if (!btn) return;
    e.preventDefault();
    var id = parseInt(btn.getAttribute("data-id"));
    if (id) window.addToCart(id);
  });

  filterButtons.forEach(function(button) {
    button.addEventListener("click", function() {
      filterButtons.forEach(function(item) { item.classList.remove("active"); });
      button.classList.add("active");
      activeFilter = (button.dataset.filter || button.textContent).trim().toUpperCase();
      renderProducts();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", function() {
      searchTerm = searchInput.value.trim().toLowerCase();
      renderProducts();
    });
  }

  shopProducts = staticFallback.slice();
  renderProducts();

  fetch(API_URL)
    .then(function(r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function(data) {
      if (data.success && data.products && data.products.length > 0) {
        shopProducts = data.products;
        renderProducts();
      }
    })
    .catch(function() {});
})();