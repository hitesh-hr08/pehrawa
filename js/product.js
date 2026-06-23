let selectedSize = "";
let currentProduct = null;

const API_URL = `${window.PEHRAWA_API_BASE || "http://localhost:5000"}/api/public/products`;
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

var qtyInput = document.getElementById("quantity");
document.getElementById("qtyMinus").addEventListener("click", function(){
  var v = parseInt(qtyInput.value) || 1;
  if (v > 1) qtyInput.value = v - 1;
});
document.getElementById("qtyPlus").addEventListener("click", function(){
  var v = parseInt(qtyInput.value) || 1;
  if (v < 99) qtyInput.value = v + 1;
});

async function loadProductDetails() {
  if (!productId) {
    renderProduct({
      id: 0, name: "Fearless Oversized Tee", price: 799,
      description: "Premium cotton oversized t-shirt with high quality print.",
      image_url: "../images/product1.png", category: "T-SHIRTS", stock_status: "in_stock"
    });
    return;
  }

  try {
    const res = await fetch(`${API_URL}/${productId}`);
    const data = await res.json();

    if (!data.success) {
      document.getElementById("productName").innerText = "Product Not Found";
      document.getElementById("productDescription").innerText = data.message || "This product is unavailable.";
      document.getElementById("productPrice").innerHTML = "&#8377;0.00";
      document.getElementById("productImage").src = "../images/product1.png";
      return;
    }

    currentProduct = data.product;
    renderProduct(currentProduct);
  } catch (err) {
    document.getElementById("productName").innerText = "Unable To Load Product";
    document.getElementById("productDescription").innerText = "Start backend server to view live product details.";
  }
}

var categoryConfig = {
  "FOOTWEAR": {
    sizes: ["EU 39","EU 40","EU 41","EU 42","EU 43","EU 44"],
    sizeLabel: "Select EU Size",
    highlights: [
      {icon:"fa-solid fa-leaf", text:"Premium Leather"},
      {icon:"fa-solid fa-shoe-prints", text:"Comfort Sole"},
      {icon:"fa-solid fa-truck", text:"Free Shipping"}
    ],
    features: [
      "Genuine Leather & Premium Materials",
      "Cushioned Comfort Sole for All-Day Wear",
      "Durable Outsole with Great Grip",
      "Easy 30-Day Returns & Exchange"
    ]
  },
  "PANTS": {
    sizes: ["28","30","32","34","36"],
    sizeLabel: "Select Waist Size",
    highlights: [
      {icon:"fa-solid fa-leaf", text:"Premium Fabric"},
      {icon:"fa-solid fa-ruler", text:"Regular Fit"},
      {icon:"fa-solid fa-truck", text:"Free Shipping"}
    ],
    features: [
      "Premium Quality Fabric for Comfort",
      "Regular Fit with Stretch Comfort",
      "Durable Stitching & Finish",
      "Easy 30-Day Returns & Exchange"
    ]
  },
  "SHIRTS": {
    sizes: ["S","M","L","XL","XXL"],
    sizeLabel: "Select Size",
    highlights: [
      {icon:"fa-solid fa-leaf", text:"Premium Fabric"},
      {icon:"fa-solid fa-shirt", text:"Regular Fit"},
      {icon:"fa-solid fa-truck", text:"Free Shipping"}
    ],
    features: [
      "100% Premium Cotton Fabric",
      "Wrinkle Resistant & Easy Care",
      "Classic Collar Design",
      "Easy 30-Day Returns & Exchange"
    ]
  },
  "WATCHES": {
    sizes: [],
    sizeLabel: "",
    highlights: [
      {icon:"fa-solid fa-gear", text:"Premium Build"},
      {icon:"fa-solid fa-droplet", text:"Water Resistant"},
      {icon:"fa-solid fa-truck", text:"Free Shipping"}
    ],
    features: [
      "Premium Stainless Steel Build",
      "Japanese Quartz Movement",
      "Mineral Glass with Scratch Resistance",
      "1-Year Warranty Included"
    ]
  },
  "SUNGLASSES": {
    sizes: [],
    sizeLabel: "",
    highlights: [
      {icon:"fa-solid fa-sun", text:"UV Protection"},
      {icon:"fa-solid fa-glasses", text:"Premium Frame"},
      {icon:"fa-solid fa-truck", text:"Free Shipping"}
    ],
    features: [
      "UV400 Protection for Eye Safety",
      "Lightweight Premium Frame",
      "Scratch Resistant Lenses",
      "1-Year Warranty Included"
    ]
  }
};

categoryConfig["T-SHIRTS"] = categoryConfig["SHIRTS"];
categoryConfig["OVERSIZED GRAPHIC"] = categoryConfig["SHIRTS"];
categoryConfig["ANIME"] = categoryConfig["SHIRTS"];
categoryConfig["GRAPHIC"] = categoryConfig["SHIRTS"];
categoryConfig["MINIMAL"] = categoryConfig["SHIRTS"];
categoryConfig["OVERSIZED"] = categoryConfig["SHIRTS"];
categoryConfig["PRINTED T-SHIRTS"] = categoryConfig["SHIRTS"];

function getCategoryConfig(cat) {
  if (!cat) return categoryConfig["SHIRTS"];
  var upper = cat.toUpperCase();
  for (var key in categoryConfig) {
    if (upper.includes(key)) return categoryConfig[key];
  }
  return categoryConfig["SHIRTS"];
}

function renderProduct(product) {
  document.getElementById("productDetail").classList.add("visible");
  document.title = `${product.name} | Pehrawa Menswear`;
  document.getElementById("productImage").src = product.image_url || "../images/product1.png";
  document.getElementById("productImage").alt = product.name;
  document.getElementById("productName").innerText = product.name;
  var p = Number(product.price);
  var orig = Math.round(p * 1.5);
  document.getElementById("productPrice").innerHTML = '&#8377;' + (isNaN(p) ? "0.00" : p.toFixed(0)) + ' <small>&#8377;' + orig + '</small>';
  document.getElementById("productDescription").innerText =
    product.description || "Premium Pehrawa menswear product crafted for comfort and style.";
  document.getElementById("productSku").innerText = "PHR-" + String(product.id).padStart(6, "0");

  var config = getCategoryConfig(product.category);

  // Highlights
  var hlEl = document.getElementById("productHighlights");
  if (hlEl) {
    hlEl.innerHTML = config.highlights.map(function(h){
      return '<div class="hl-item"><i class="' + h.icon + '"></i><span>' + h.text + '</span></div>';
    }).join("");
  }

  // Sizes
  var sizeSection = document.getElementById("sizeSection");
  var sizeContainer = document.getElementById("sizeContainer");
  var sizeLabel = document.getElementById("sizeLabel");
  if (config.sizes.length > 0) {
    sizeSection.style.display = "block";
    sizeLabel.innerText = config.sizeLabel;
    sizeContainer.innerHTML = config.sizes.map(function(s, i){
      var active = i === 1 ? ' active' : '';
      return '<button class="size-btn' + active + '">' + s + '</button>';
    }).join("");
    selectedSize = config.sizes[1] || config.sizes[0];
    sizeContainer.querySelectorAll(".size-btn").forEach(function(btn){
      btn.addEventListener("click", function(){
        sizeContainer.querySelectorAll(".size-btn").forEach(function(b){ b.classList.remove("active"); });
        btn.classList.add("active");
        selectedSize = btn.innerText;
      });
    });
  } else {
    sizeSection.style.display = "none";
    selectedSize = "ONE";
  }

  // Features
  var featEl = document.getElementById("productFeatures");
  if (featEl) {
    featEl.innerHTML = config.features.map(function(f){
      return '<div class="pf-item"><i class="fa-solid fa-check-circle"></i> ' + f + '</div>';
    }).join("");
  }

  if (product.stock_status === "out_of_stock") {
    document.getElementById("addCartBtn").disabled = true;
    document.getElementById("addCartBtn").style.opacity = "0.5";
    document.getElementById("addCartBtn").style.cursor = "not-allowed";
    document.getElementById("addCartBtn").innerText = "OUT OF STOCK";
  } else {
    document.getElementById("addCartBtn").disabled = false;
    document.getElementById("addCartBtn").style.opacity = "1";
    document.getElementById("addCartBtn").style.cursor = "pointer";
    document.getElementById("addCartBtn").innerText = "ADD TO CART";
  }

  if (product.category) loadRelatedProducts(product.category, product.id);
}

document.getElementById("addCartBtn").addEventListener("click", () => {
  if (!currentProduct) return;

  const qty = Number(document.getElementById("quantity").value) || 1;
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  cart.push({
    id: currentProduct.id,
    name: currentProduct.name,
    price: Number(currentProduct.price),
    image: currentProduct.image_url || "../images/product1.png",
    size: selectedSize,
    quantity: qty
  });

  localStorage.setItem("cart", JSON.stringify(cart));

  const cartBadge = document.querySelector(".fa-cart-shopping")?.parentElement.querySelector("span");
  if (cartBadge) {
    cartBadge.textContent = cart.length;
  }

  if (typeof showToast === "function") {
    showToast(`${currentProduct.name} added to cart`);
  }
});

document.getElementById("buyWhatsapp").addEventListener("click", () => {
  if (!currentProduct) return;

  const qty = document.getElementById("quantity").value;
  const productName = document.getElementById("productName").innerText;
  const productPrice = document.getElementById("productPrice").innerText.replace("₹", "").trim();
  const productImage = document.getElementById("productImage").src;

  if (typeof openCheckout === "function") {
    openCheckout(currentProduct.id, productName, productPrice, productImage);
  }
});

loadProductDetails();

async function loadRelatedProducts(category, excludeId) {
  try {
    const res = await fetch(API_URL + "?search=" + encodeURIComponent(category));
    const data = await res.json();
    if (!data.success || !data.products) return;
    var related = data.products.filter(function(p){ return p.id !== excludeId; }).slice(0, 4);
    if (related.length === 0) return;
    renderRelatedProducts(related);
  } catch(e) {}
}

function renderRelatedProducts(products) {
  var grid = document.getElementById("relatedGrid");
  if (!grid) return;
  grid.innerHTML = products.map(function(p){
    var badges = "";
    if (p.stock_status === "out_of_stock") badges += '<span class="p-status p-out-of-stock">Out of Stock</span>';
    else if (p.stock_status === "limited_stock") badges += '<span class="p-status p-limited">Limited</span>';
    if (p.is_new_arrival) badges += '<span class="p-status p-new">New</span>';
    if (p.is_trending) badges += '<span class="p-status p-trending">Trending</span>';
    if (p.is_hot_seller) badges += '<span class="p-status p-hot">Hot</span>';
    var img = p.image_url || "../images/product1.png";
    return '<div class="product-card"><div class="product-image">' +
      badges +
      '<a href="product.html?id=' + p.id + '"><img src="' + img + '" alt="' + p.name + '"></a>' +
      '</div><div class="product-content"><h3><a href="product.html?id=' + p.id + '">' + p.name + '</a></h3>' +
      '<div class="price">&#8377;' + Number(p.price).toFixed(0) + '</div></div></div>';
  }).join("");
}

// Load reviews
(function () {
  if (!productId) return;
  var listEl = document.getElementById("reviewsList");
  if (!listEl) return;
  var api = window.PEHRAWA_API_BASE || "http://localhost:5000";

  fetch(api + "/api/products/" + productId + "/reviews")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success) {
        listEl.innerHTML = '<p class="reviews-empty">Could not load reviews.</p>';
        return;
      }

      var reviews = data.reviews || [];
      var stats = data.stats || { count: 0, avg_rating: 0 };

      // Summary
      var summaryEl = document.getElementById("reviewsSummary");
      if (summaryEl) {
        var avgEl = summaryEl.querySelector(".reviews-avg");
        if (avgEl) avgEl.textContent = stats.avg_rating || "--";
        var countEl = document.getElementById("reviewsCount");
        if (countEl) countEl.textContent = "(" + stats.count + " review" + (stats.count !== 1 ? "s" : "") + ")";
        var starsEl = document.getElementById("reviewsAvgStars");
        if (starsEl) {
          var avgStars = "";
          var avg = Math.round(stats.avg_rating || 0);
          for (var i = 1; i <= 5; i++) { avgStars += i <= avg ? "★" : "☆"; }
          starsEl.textContent = avgStars;
        }
      }

      // List
      if (reviews.length === 0) {
        listEl.innerHTML = '<p class="reviews-empty">No reviews yet. Be the first to review!</p>';
        return;
      }

      var html = reviews.map(function (r) {
        var stars = "";
        for (var i = 1; i <= 5; i++) { stars += i <= r.rating ? "★" : "☆"; }
        var date = new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        var text = r.review_text ? '<p class="review-card-text">' + r.review_text + '</p>' : "";
        return '<div class="review-card">' +
          '<div class="review-card-header">' +
            '<span class="review-card-name">' + (r.customer_name || "Anonymous") + '</span>' +
            '<span class="review-card-stars">' + stars + '</span>' +
          '</div>' +
          '<div class="review-card-date">' + date + '</div>' +
          text +
        '</div>';
      }).join("");

      listEl.innerHTML = html;
    })
    .catch(function () {
      listEl.innerHTML = '<p class="reviews-empty">Failed to load reviews.</p>';
    });
})();
