(function () {
  const API_URL = `${window.PEHRAWA_API_BASE || "http://localhost:5000"}/api/public/products`;
  const productGrid = document.getElementById("shopProductGrid");
  const searchInput = document.querySelector(".search-input");
  let shopProducts = [];
  let searchTerm = "";

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
    else if (parseInt(product.stock) > 0 && parseInt(product.stock) <= 10) badges += '<span class="p-status p-limited">Only ' + product.stock + ' left</span>';
    if (product.is_new_arrival) badges += '<span class="p-status p-new">New</span>';
    if (product.is_trending) badges += '<span class="p-status p-trending">Trending</span>';
    if (product.is_hot_seller) badges += '<span class="p-status p-hot">Hot</span>';
    if (product.is_limited_edition && product.edition_number && product.edition_total) badges += '<span class="p-status p-edition"><i class="fa-solid fa-gem"></i> #' + product.edition_number + ' of ' + product.edition_total + '</span>';

    return '<div class="product-card revealed">' +
      '<div class="product-image">' +
        '<span class="product-badge">-' + discount + '%</span>' +
        badges +
        '<button class="card-wishlist-btn" onclick="event.preventDefault();event.stopPropagation();if(window.PehrawaWishlist){PehrawaWishlist.toggle(' + product.id + ',\'' + product.name.replace(/'/g, "\\'") + '\',' + price + ',\'' + imageUrl.replace(/'/g, "\\'") + '\')}" style="position:absolute;top:8px;right:8px;z-index:5;background:rgba(0,0,0,0.5);border:none;color:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:14px;"><i class="fa-regular fa-heart"></i></button>' +
        '<a href="/product?id=' + product.id + '">' +
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

  function getActiveCategories() {
    var cbs = document.querySelectorAll(".filter-cb:checked");
    var cats = [];
    cbs.forEach(function(cb) {
      cats.push(cb.getAttribute("data-category"));
    });
    return cats;
  }

  function isAllChecked() {
    var allCb = document.querySelector('.filter-cb[data-category="ALL"]');
    return allCb && allCb.checked;
  }

  function renderProducts() {
    var activeCats = getActiveCategories();

    const filtered = shopProducts.filter(function(product) {
      const category = (product.category || "").toUpperCase();
      const name = (product.name || "").toLowerCase();
      const description = (product.description || "").toLowerCase();

      var matchesFilter = false;
      if (activeCats.length === 0 || isAllChecked()) {
        matchesFilter = true;
      } else {
        matchesFilter = activeCats.some(function(cat) {
          if (cat === "T-SHIRTS") {
            return ["ANIME","GRAPHIC","MINIMAL","OVERSIZED","PRINTED T-SHIRTS","T-SHIRTS","PLAIN","POLO"].some(function(k) {
              return category.includes(k);
            });
          }
          if (cat === "SHIRTS") {
            return category.includes("SHIRT") && !category.includes("T-SHIRT");
          }
          if (cat === "PANTS") {
            return ["JEANS","PANT","TROUSER","CHINO","JOGGER","TRACKPANT","DENIM","JEAN"].some(function(k) {
              return category.includes(k);
            });
          }
          if (cat === "HOODIES") {
            return ["HOODIE","HOOD","SWEAT","SWEATER"].some(function(k) {
              return category.includes(k);
            });
          }
          if (cat === "PERFUME") {
            return ["PERFUME","FRAGRANCE","COLOGNE","SCENT","MIST","DEODORANT","BODY SPRAY"].some(function(k) {
              return category.includes(k);
            });
          }
          if (cat === "ACCESSORIES") {
            return ["ACCESSOR","BELT","CAP","HAT","BAG","WALLET","SCARF","JEWEL","CHAIN","RING","WATCH","SUNGLASS","GLASS","EYEWEAR"].some(function(k) {
              return category.includes(k);
            });
          }
          return category.includes(cat);
        });
      }

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
    return shopProducts.find(function(item) { return item.id === productId; });
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
      size: product.sizes && product.sizes.length ? product.sizes[0] : "M",
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

  productGrid.addEventListener("click", function(e) {
    var btn = e.target.closest(".add-cart-btn");
    if (!btn) return;
    e.preventDefault();
    var id = parseInt(btn.getAttribute("data-id"));
    if (id) window.addToCart(id);
  });

  document.addEventListener("change", function(e) {
    var cb = e.target.closest(".filter-cb");
    if (!cb) return;

    var cat = cb.getAttribute("data-category");
    var allCb = document.querySelector('.filter-cb[data-category="ALL"]');

    if (cat === "ALL") {
      document.querySelectorAll('.filter-cb[data-category]:not([data-category="ALL"])').forEach(function(c) {
        c.checked = false;
      });
    } else {
      if (allCb) allCb.checked = false;
    }

    var checkedSpecific = document.querySelectorAll('.filter-cb[data-category]:not([data-category="ALL"]):checked');
    if (checkedSpecific.length === 0 && allCb) {
      allCb.checked = true;
    }

    renderProducts();
  });

  // Mobile filter toggle
  var filterToggle = document.getElementById("filterToggle");
  var filtersPanel = document.getElementById("filtersPanel");
  var filtersClose = document.getElementById("filtersClose");
  var shopFilters = document.getElementById("shopFilters");

  if (filterToggle && filtersPanel && shopFilters) {
    filterToggle.addEventListener("click", function() {
      var body = filtersPanel.querySelector(".filters-panel-body");
      if (body && !body.hasChildNodes()) {
        var clone = shopFilters.cloneNode(true);
        clone.id = "mobileFilters";
        body.appendChild(clone);
      }
      filtersPanel.classList.add("open");
      document.body.style.overflow = "hidden";
    });

    function closeFilters() {
      filtersPanel.classList.remove("open");
      document.body.style.overflow = "";
    }

    if (filtersClose) filtersClose.addEventListener("click", closeFilters);
    filtersPanel.addEventListener("click", function(e) {
      if (e.target === filtersPanel) closeFilters();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function() {
      searchTerm = searchInput.value.trim().toLowerCase();
      renderProducts();
    });
  }

  productGrid.innerHTML = '<div class="shop-state"><i class="fa-solid fa-spinner fa-spin"></i> Loading products...</div>';

  fetch(API_URL)
    .then(function(r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function(data) {
      if (data.success && data.products && data.products.length > 0) {
        shopProducts = data.products;
        renderProducts();
      } else {
        productGrid.innerHTML = '<div class="shop-state">No products available.</div>';
      }
    })
    .catch(function() {
      productGrid.innerHTML = '<div class="shop-state">Server not connected. <button onclick="location.reload()" style="background:#ff6b00;color:#fff;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;margin-top:10px;">Retry</button></div>';
    });
})();