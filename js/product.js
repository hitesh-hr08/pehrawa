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
    currentProduct = {
      id: 0, name: "Fearless Oversized Tee", price: 799, original_price: 1199,
      description: "Premium cotton oversized t-shirt with high quality print.",
      image_url: "../images/product1.png", category: "T-SHIRTS", stock_status: "in_stock"
    };
    renderProduct(currentProduct, []);
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
    renderProduct(currentProduct, data.images || []);
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
  "JEANS": {
    sizes: ["28","30","32","34","36"],
    sizeLabel: "Select Waist Size",
    highlights: [
      {icon:"fa-solid fa-leaf", text:"Premium Denim"},
      {icon:"fa-solid fa-ruler", text:"Regular Fit"},
      {icon:"fa-solid fa-truck", text:"Free Shipping"}
    ],
    features: [
      "High Quality Denim Fabric",
      "Regular Fit with Comfort Stretch",
      "Reinforced Stitching for Durability",
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

function renderProduct(product, images) {
  document.getElementById("productDetail").classList.add("visible");
  document.title = `${product.name} | Pehrawa Menswear`;
  var allImages = images && images.length ? images.map(function(i){ return i.image_url; }) : [];
  if (product.image_url && allImages.indexOf(product.image_url) === -1) allImages.unshift(product.image_url);
  if (!allImages.length) allImages = ["../images/product1.png"];
  document.getElementById("productImage").src = allImages[0];
  document.getElementById("productImage").alt = product.name;
  var thumbsEl = document.getElementById("productThumbs");
  thumbsEl.innerHTML = allImages.map(function(url, i){
    return '<img src="' + url + '" style="width:70px;height:90px;object-fit:cover;cursor:pointer;border:' + (i === 0 ? '2px solid #ff6b00' : '1px solid #333') + ';border-radius:4px;" onclick="document.getElementById(\'productImage\').src=this.src;document.querySelectorAll(\'#productThumbs img\').forEach(function(t){t.style.border=\'1px solid #333\'});this.style.border=\'2px solid #ff6b00\'" onerror="this.style.display=\'none\'">';
  }).join("");
  document.getElementById("productName").innerText = product.name;
  var p = Number(product.price);
  var orig = product.original_price ? Number(product.original_price) : Math.round(p * 1.5);
  var disc = orig > p ? Math.round((1 - p / orig) * 100) : 0;
  document.getElementById("productPriceValue").innerHTML = '&#8377;' + (isNaN(p) ? "0.00" : p.toFixed(0)) + ' <small>&#8377;' + orig + '</small>';
  document.getElementById("productDiscount").textContent = disc > 0 ? disc + '% OFF' : '';
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

// ==========================================
// BUY BUTTON — Multi-step checkout flow
// ==========================================

document.getElementById("buyBtn").addEventListener("click", () => {
  if (!currentProduct) return;

  window.requireAuth(function (loggedIn) {
    if (!loggedIn) return;

    var qty = document.getElementById("quantity").value;
    document.getElementById("buyQty").value = qty;
    document.getElementById("buySize").value = selectedSize || "M";

    var cust = window.getCustomer ? window.getCustomer() : null;
    if (cust) {
      var nEl = document.getElementById("buyName");
      var pEl = document.getElementById("buyPhone");
      if (nEl && cust.name) nEl.value = cust.name;
      if (pEl && cust.phone) pEl.value = cust.phone;
    }

    showBuyStep(1);
    document.getElementById("buyCheckoutOverlay").classList.add("active");
  });
});

document.getElementById("buyCheckoutClose").addEventListener("click", function () {
  document.getElementById("buyCheckoutOverlay").classList.remove("active");
});
document.getElementById("buyCheckoutOverlay").addEventListener("click", function (e) {
  if (e.target === this) this.classList.remove("active");
});

// Step navigation
function showBuyStep(step) {
  document.getElementById("buyStep1").style.display = step === 1 ? "block" : "none";
  document.getElementById("buyStep2").style.display = step === 2 ? "block" : "none";
  document.getElementById("buyStep3").style.display = step === 3 ? "block" : "none";
  if (step === 2) populateBuyConfirmation();
  if (step === 3) generateBuyQrCode();
}

// Step 1 — Address form submit
document.getElementById("buyAddressForm").addEventListener("submit", function (e) {
  e.preventDefault();
  var name = document.getElementById("buyName").value.trim();
  var phone = document.getElementById("buyPhone").value.trim();
  var address = document.getElementById("buyAddress").value.trim();
  var pincode = document.getElementById("buyPincode").value.trim();
  var city = document.getElementById("buyCity").value.trim();
  var state = document.getElementById("buyState").value.trim();

  if (!name || !phone || !address || !pincode || !city || !state) {
    if (typeof showToast === "function") showToast("Please fill all fields");
    return;
  }
  if (phone.length < 10) {
    if (typeof showToast === "function") showToast("Enter valid phone number");
    return;
  }

  showBuyStep(2);
});

function getProductPrice() {
  if (currentProduct) return Number(currentProduct.price) || 0;
  var pv = document.getElementById("productPriceValue");
  if (pv) {
    var txt = pv.innerText.replace(/[^0-9.]/g, "");
    var match = txt.match(/^\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  }
  return 0;
}

function populateBuyConfirmation() {
  var name = document.getElementById("buyName").value;
  var phone = document.getElementById("buyPhone").value;
  var address = document.getElementById("buyAddress").value;
  var pincode = document.getElementById("buyPincode").value;
  var city = document.getElementById("buyCity").value;
  var state = document.getElementById("buyState").value;
  var size = document.getElementById("buySize").value;
  var qty = document.getElementById("buyQty").value;
  var productName = document.getElementById("productName").innerText;
  var price = getProductPrice();
  var total = price * parseInt(qty);

  document.querySelector("#buyStep2 .buy-summary").innerHTML =
    '<div class="buy-summary-row"><span>Product</span><span>' + productName + '</span></div>' +
    '<div class="buy-summary-row"><span>Size</span><span>' + size + '</span></div>' +
    '<div class="buy-summary-row"><span>Quantity</span><span>' + qty + '</span></div>' +
    '<div class="buy-summary-row" style="border-bottom:1px solid #222;padding-bottom:10px;margin-bottom:4px;"><span style="font-weight:700;">Total</span><span style="color:#ff6b00;font-weight:700;">&#8377;' + total.toFixed(2) + '</span></div>' +
    '<div class="buy-summary-row"><span>Name</span><span>' + name + '</span></div>' +
    '<div class="buy-summary-row"><span>Phone</span><span>' + phone + '</span></div>' +
    '<div class="buy-summary-row"><span>Address</span><span style="font-size:12px;">' + address + ', ' + city + ', ' + state + ' - ' + pincode + '</span></div>';
}

function generateBuyQrCode() {
  var qty = parseInt(document.getElementById("buyQty").value) || 1;
  var price = getProductPrice();
  var total = price * qty;
  var upiStr = "upi://pay?pa=hrandhan-1@okicici&pn=Pehrawa%20Menswear&am=" + total.toFixed(2) + "&cu=INR";
  document.getElementById("buyQrImage").src = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + encodeURIComponent(upiStr);
  // Set upi intent on each app button
  document.querySelectorAll("#buyStep3 .upi-app-btn").forEach(function (btn) {
    btn.onclick = function () { window.location.href = upiStr; };
  });
}

async function confirmBuyPayment() {
  var txnId = document.getElementById("buyTxnId").value.trim();
  var btn = document.querySelector("#buyStep3 .checkout-submit");
  if (!txnId) {
    if (typeof showToast === "function") showToast("Please complete the UPI payment and enter the Transaction ID");
    return;
  }
  btn.disabled = true;
  btn.textContent = "Placing Order...";

  var name = document.getElementById("buyName").value;
  var phone = document.getElementById("buyPhone").value;
  var address = document.getElementById("buyAddress").value;
  var pincode = document.getElementById("buyPincode").value;
  var city = document.getElementById("buyCity").value;
  var state = document.getElementById("buyState").value;
  var size = document.getElementById("buySize").value;
  var qty = document.getElementById("buyQty").value;
  var productName = document.getElementById("productName").innerText;
  var price = getProductPrice();
  var total = price * parseInt(qty);
  var district = document.getElementById("buyDistrict")?.value || "";
  var fullAddress = address + (district ? ", " + district : "") + ", " + city + ", " + state + " - " + pincode;
  var api = window.PEHRAWA_API_BASE || "http://localhost:5000";
  var cust = window.getCustomer ? window.getCustomer() : null;

  try {
    var res = await fetch(api + "/api/public/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: name,
        phone: phone,
        address: fullAddress,
        total_amount: total,
        status: "Verifying Payment",
        payment_id: txnId || null,
        customer_id: cust ? cust.id : (localStorage.getItem("customerId") || null),
        items: [{ name: productName, size: size, quantity: Number(qty), price: price }]
      })
    });
    var data = await res.json();
    if (data.success) {
      if (typeof showToast === "function") showToast("✅ Order submitted successfully!");
      document.getElementById("buyCheckoutOverlay").classList.remove("active");
      btn.disabled = true;
      btn.textContent = "Redirecting...";
      setTimeout(function () { window.location.href = "my-orders.html"; }, 1500);
      return;
    } else {
      if (typeof showToast === "function") showToast(data.message || "Failed to place order");
    }
  } catch (err) {
    if (typeof showToast === "function") showToast("Error placing order. Try again.");
  }
  btn.disabled = false;
  btn.textContent = "I've Paid — Place Order";
}

// Razorpay Buy handler
document.getElementById("razorpayBuyBtn").addEventListener("click", async function () {
  var qty = parseInt(document.getElementById("buyQty").value) || 1;
  var amount = getProductPrice() * qty;
  if (amount <= 0) {
    if (typeof showToast === "function") showToast("Invalid amount");
    return;
  }
  var api = window.PEHRAWA_API_BASE || "http://localhost:5000";
  try {
    var keyRes = await fetch(api + "/api/razorpay-key");
    var keyData = await keyRes.json();
    if (!keyData.key) {
      if (typeof showToast === "function") showToast("Razorpay not configured");
      return;
    }
    var orderRes = await fetch(api + "/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amount })
    });
    var orderData = await orderRes.json();
    if (!orderData.success) {
      if (typeof showToast === "function") showToast(orderData.message || "Payment error");
      return;
    }
    var options = {
      key: keyData.key,
      amount: orderData.amount,
      currency: orderData.currency || "INR",
      name: "Pehrawa Menswear",
      description: document.getElementById("productName").innerText,
      image: "../images/logo.png",
      order_id: orderData.order_id,
      handler: function (response) {
        document.getElementById("buyTxnId").value = response.razorpay_payment_id;
        confirmBuyPayment();
      },
      modal: {
        ondismiss: function () {
          if (typeof showToast === "function") showToast("Payment cancelled");
        }
      },
      prefill: {
        name: document.getElementById("buyName").value || "",
        contact: document.getElementById("buyPhone").value || "",
        email: ""
      },
      theme: { color: "#f97316" }
    };
    var rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    if (typeof showToast === "function") showToast("Payment failed to initialize");
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
    var price = Number(p.price) || 0;
    var orig = p.original_price ? Number(p.original_price) : Math.round(price * 1.5);
    var disc = orig > price ? Math.round((1 - price / orig) * 100) : 0;
    return '<div class="product-card"><div class="product-image">' +
      (disc > 0 ? '<span class="product-badge">-' + disc + '%</span>' : '') +
      badges +
      '<a href="product.html?id=' + p.id + '"><img src="' + img + '" alt="' + p.name + '"></a>' +
      '</div><div class="product-content"><h3><a href="product.html?id=' + p.id + '">' + p.name + '</a></h3>' +
      '<div class="price">&#8377;' + price.toFixed(0) +
      (orig > price ? '<span class="orig">&#8377;' + orig + '</span>' : '') +
      '</div></div></div>';
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
