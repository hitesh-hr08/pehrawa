(function () {
  const API_URL = `${window.PEHRAWA_API_BASE || "http://localhost:5000"}/api/public/products`;
  const productGrid = document.querySelector(".product-grid");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const searchInput = document.querySelector(".search-input");
  let shopProducts = [];
  let activeFilter = "ALL";
  let searchTerm = "";

  const staticFallback = [
    { id: 1, name: "Fearless Oversized Tee", price: 799, image_url: "../images/product1.png" },
    { id: 2, name: "Shadow Anime Tee", price: 749, image_url: "../images/product2.png" },
    { id: 3, name: "Abstract Vision Tee", price: 749, image_url: "../images/product3.png" },
    { id: 4, name: "Minimal Logo Tee", price: 699, image_url: "../images/product4.png" },
    { id: 5, name: "Street Graphic Tee", price: 849, image_url: "../images/product5.png" },
    { id: 6, name: "Urban Anime Tee", price: 799, image_url: "../images/product6.png" }
  ];

  if (!productGrid) return;

  const staticProductsHTML = productGrid.innerHTML;

  async function loadShopProducts() {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();

      if (!data.success) {
        return;
      }

      shopProducts = data.products;
      renderProducts();
    } catch (err) {
      // Leave static HTML products visible
    }
  }

  function renderProducts() {
    var tshirtCats = ["ANIME","GRAPHIC","MINIMAL","OVERSIZED","PRINTED T-SHIRTS"];
    var filterMap = {
      "T-SHIRTS": function(cat){ return tshirtCats.some(function(k){ return cat.includes(k); }); },
      "SHIRTS": function(cat){ return cat.includes("SHIRTS") && !cat.includes("T-SHIRTS"); },
      "JEANS": function(){ return false; }
    };
    const filteredProducts = shopProducts.filter((product) => {
      const category = (product.category || "").toUpperCase();
      const name = (product.name || "").toLowerCase();
      const description = (product.description || "").toLowerCase();
      var matchFn = filterMap[activeFilter];
      const matchesFilter = activeFilter === "ALL" || (matchFn ? matchFn(category) : category.includes(activeFilter));
      const matchesSearch =
        !searchTerm ||
        name.includes(searchTerm) ||
        description.includes(searchTerm) ||
        category.toLowerCase().includes(searchTerm);

      return matchesFilter && matchesSearch;
    });

    if (filteredProducts.length === 0) {
      productGrid.innerHTML = `<div class="shop-state">No products found.</div>`;
      return;
    }

    productGrid.innerHTML = filteredProducts.map((product) => {
      const imageUrl = product.image_url || "../images/product1.png";
      const price = parseFloat(product.price) || 0;
      const origPrice = Math.round(price * 1.5);
      const discount = Math.round((1 - price / origPrice) * 100);
      const rating = (3.5 + Math.random() * 1.5).toFixed(1);
      const reviews = Math.floor(Math.random() * 500) + 20;

      return `
        <div class="product-card revealed">
          <div class="product-image">
            <span class="product-badge">-${discount}%</span>
            <a href="product.html?id=${product.id}">
              <img src="${imageUrl}" alt="${product.name}">
            </a>
          </div>

          <div class="product-content">
            <h3>${product.name}</h3>
            <div class="product-rating">
              <span class="stars">${'★'.repeat(Math.round(rating))}</span>
              <span class="count">${rating} (${reviews})</span>
            </div>
            <div class="price">&#8377;${price.toFixed(0)}
              <span class="orig">&#8377;${origPrice}</span>
              <span class="discount">${discount}% off</span>
            </div>

            <button class="buy-now-btn" data-id="${product.id}" data-name="${product.name}" data-price="${price}" data-image="${imageUrl}">
              <i class="fa-solid fa-bag-shopping"></i>ADD TO CART
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  function findProduct(productId) {
    return shopProducts.find((item) => item.id === productId) || staticFallback.find((item) => item.id === productId);
  }

  function saveItem(key, productId) {
    const product = findProduct(productId);
    if (!product) return;

    const currentItems = JSON.parse(localStorage.getItem(key)) || [];
    currentItems.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image_url || "../images/product1.png"
    });

    localStorage.setItem(key, JSON.stringify(currentItems));
    updateHeaderCount(key, currentItems.length);

    if (typeof showToast === "function") {
      showToast(`${product.name} added to ${key}`);
    }
  }

  function updateHeaderCount(key, count) {
    const selector = key === "cart" ? ".fa-cart-shopping" : ".fa-heart";
    const icon = document.querySelector(selector);
    const badge = icon && icon.parentElement.querySelector("span");

    if (badge) {
      badge.textContent = count;
    }
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      activeFilter = (button.dataset.filter || button.textContent).trim().toUpperCase();
      renderProducts();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchTerm = searchInput.value.trim().toLowerCase();
      renderProducts();
    });
  }

  window.addToCart = function (productId) {
    saveItem("cart", productId);
  };

  window.addToWishlist = function (productId) {
    saveItem("wishlist", productId);
  };

  loadShopProducts();
})();
