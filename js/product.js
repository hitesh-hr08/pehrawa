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
    document.getElementById("productName").innerText = "No Product Selected";
    document.getElementById("productDescription").innerText = "Please select a product from the shop.";
    document.getElementById("productPrice").innerHTML = "&#8377;0.00";
    document.getElementById("productImage").src = "../images/product1.png";
    document.getElementById("productDetail").classList.add("visible");
    document.getElementById("addCartBtn").style.display = "none";
    document.getElementById("buyBtn").style.display = "none";
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
      document.getElementById("productDetail").classList.add("visible");
      return;
    }

    currentProduct = data.product;
    renderProduct(currentProduct, data.images || []);
  } catch (err) {
    document.getElementById("productName").innerText = "Server Not Connected";
    document.getElementById("productDescription").innerText = "Could not load product. Please check your connection and try again.";
    document.getElementById("productPrice").innerHTML = "&#8377;0.00";
    document.getElementById("productImage").src = "../images/product1.png";
    document.getElementById("productDetail").classList.add("visible");
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
  document.title = `${product.name} | ${window.PEHRAWA_SETTINGS && window.PEHRAWA_SETTINGS.store_name ? window.PEHRAWA_SETTINGS.store_name : "Pehrawa"}`;
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

}

function loadRelatedProducts(category, excludeId) {
  var el = document.getElementById("relatedProducts");
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:20px;color:#888;"><i class="fa-solid fa-spinner fa-spin"></i></div>';
  fetch(API_URL)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.success || !data.products) return;
      var related = data.products.filter(function(p) { return p.id != excludeId && p.category && p.category.toUpperCase().includes(category.toUpperCase().slice(0,4)); }).slice(0, 4);
      if (related.length === 0) related = data.products.filter(function(p) { return p.id != excludeId; }).slice(0, 4);
      if (related.length === 0) { el.innerHTML = ""; return; }
      var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;padding:16px 0;">';
      related.forEach(function(p) {
        var img = p.image_url || "../images/product1.png";
        html += '<a href="product.html?id=' + p.id + '" style="text-decoration:none;color:inherit;">' +
          '<div style="border:1px solid #333;border-radius:8px;overflow:hidden;background:#1a1a1a;">' +
          '<img src="' + img + '" style="width:100%;height:180px;object-fit:cover;" onerror="this.src=\'../images/product1.png\'">' +
          '<div style="padding:8px 12px;"><div style="font-size:14px;">' + p.name + '</div>' +
          '<div style="color:#ff6b00;font-weight:600;">&#8377;' + (Number(p.price) || 0).toFixed(0) + '</div></div></div></a>';
      });
      html += '</div>';
      el.innerHTML = html;
    })
    .catch(function() { el.innerHTML = ""; });
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

// ---- Flipkart-style Address System for Buy Flow ----
var buySavedAddresses = [];
var buySelectedAddressId = null;
var buyUseNewAddress = false;

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

    loadBuySavedAddresses();
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

// ---- Flipkart-style Address Cards for Buy Flow ----
async function loadBuySavedAddresses() {
  var cust = window.getCustomer ? window.getCustomer() : null;
  if (!cust || !cust.id) return;
  var token = window.getCustomerToken ? window.getCustomerToken() : "";
  if (!token) return;
  var api = window.PEHRAWA_API_BASE || "http://localhost:5000";
  try {
    var res = await fetch(api + "/api/customers/" + cust.id + "/addresses", {
      headers: { "Authorization": "Bearer " + token }
    });
    var data = await res.json();
    if (data.success && data.addresses) {
      buySavedAddresses = data.addresses;
      renderBuyAddressCards();
    }
  } catch (e) {}
}

function renderBuyAddressCards() {
  var list = document.getElementById("buySavedAddressList");
  var section = document.getElementById("buySavedAddressesSection");
  var form = document.getElementById("buyNewAddressForm");
  if (!list || !section) return;
  if (buySavedAddresses.length === 0) {
    section.style.display = "none";
    return;
  }
  section.style.display = "block";
  var html = "";
  buySavedAddresses.forEach(function(addr) {
    var isSelected = buySelectedAddressId == addr.id || (!buySelectedAddressId && addr.is_default);
    var label = addr.label || "Home";
    html += '<div class="addr-card' + (isSelected ? ' addr-selected' : '') + '" data-id="' + addr.id + '" onclick="selectBuyAddrCard(' + addr.id + ')">' +
      '<div class="addr-radio"><span class="addr-radio-dot' + (isSelected ? ' active' : '') + '"></span></div>' +
      '<div class="addr-info">' +
        '<div class="addr-label"><span class="addr-badge">' + label + '</span>' + (addr.is_default ? '<span class="addr-default-badge">DEFAULT</span>' : '') + '</div>' +
        '<div class="addr-detail"><strong>' + (addr.address || "") + '</strong></div>' +
        '<div class="addr-detail">' + (addr.city || "") + (addr.city && addr.state ? ", " : "") + (addr.state || "") + ' - ' + (addr.pincode || "") + '</div>' +
      '</div>' +
      '<button class="addr-del-btn" onclick="event.stopPropagation();deleteBuyAddr(' + addr.id + ')" title="Remove"><i class="fa-solid fa-trash-can"></i></button>' +
    '</div>';
  });
  list.innerHTML = html;

  var defaultAddr = buySavedAddresses.find(function(a) { return a.is_default; }) || buySavedAddresses[0];
  if (defaultAddr && !buySelectedAddressId) {
    buySelectedAddressId = defaultAddr.id;
  }
}

window.selectBuyAddrCard = function(id) {
  buySelectedAddressId = id;
  buyUseNewAddress = false;
  var addr = buySavedAddresses.find(function(a) { return a.id == id; });
  if (addr) {
    var cust = window.getCustomer ? window.getCustomer() : null;
    if (document.getElementById("buyName")) document.getElementById("buyName").value = cust ? (cust.name || "") : "";
    if (document.getElementById("buyPhone")) document.getElementById("buyPhone").value = cust ? (cust.phone || "") : "";
    if (document.getElementById("buyAddress")) document.getElementById("buyAddress").value = addr.address || "";
    if (document.getElementById("buyPincode")) document.getElementById("buyPincode").value = addr.pincode || "";
    if (document.getElementById("buyCity")) document.getElementById("buyCity").value = addr.city || "";
    if (document.getElementById("buyDistrict")) document.getElementById("buyDistrict").value = "";
    if (document.getElementById("buyState")) document.getElementById("buyState").value = addr.state || "";
  }
  var list = document.getElementById("buySavedAddressList");
  var form = document.getElementById("buyNewAddressForm");
  if (list) list.style.display = "none";
  if (form) form.style.display = "block";
};

window.deleteBuyAddr = async function(id) {
  if (!confirm("Remove this address?")) return;
  var cust = window.getCustomer ? window.getCustomer() : null;
  if (!cust || !cust.id) return;
  var token = window.getCustomerToken ? window.getCustomerToken() : "";
  var api = window.PEHRAWA_API_BASE || "http://localhost:5000";
  try {
    await fetch(api + "/api/customers/" + cust.id + "/addresses/" + id, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + token }
    });
    buySavedAddresses = buySavedAddresses.filter(function(a) { return a.id !== id; });
    if (buySelectedAddressId === id) {
      buySelectedAddressId = buySavedAddresses.length > 0 ? buySavedAddresses[0].id : null;
    }
    if (buySavedAddresses.length === 0) {
      buyUseNewAddress = true;
      var form = document.getElementById("buyNewAddressForm");
      var section = document.getElementById("buySavedAddressesSection");
      if (form) form.style.display = "block";
      if (section) section.style.display = "none";
    }
    renderBuyAddressCards();
  } catch (e) {}
};

async function saveBuyAddress() {
  var cust = window.getCustomer ? window.getCustomer() : null;
  if (!cust || !cust.id) return;
  var token = window.getCustomerToken ? window.getCustomerToken() : "";
  if (!token) return;
  var addr = document.getElementById("buyAddress")?.value?.trim();
  if (!addr) return;
  var api = window.PEHRAWA_API_BASE || "http://localhost:5000";
  try {
    var res = await fetch(api + "/api/customers/" + cust.id + "/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify({
        label: document.getElementById("buyName")?.value?.trim() || "Home",
        address: addr,
        pincode: document.getElementById("buyPincode")?.value || "",
        city: document.getElementById("buyCity")?.value || "",
        state: document.getElementById("buyState")?.value || "",
        is_default: buySavedAddresses.length === 0
      })
    });
    var data = await res.json();
    if (data.success && data.address) {
      buySavedAddresses.push(data.address);
      buySelectedAddressId = data.address.id;
    }
  } catch (e) {}
}

// "Add New Address" toggle for buy flow
document.getElementById("buyToggleNewAddrBtn")?.addEventListener("click", function(e) {
  e.preventDefault();
  buyUseNewAddress = true;
  buySelectedAddressId = null;
  var form = document.getElementById("buyNewAddressForm");
  var list = document.getElementById("buySavedAddressList");
  if (list) list.style.display = "none";
  if (form) form.style.display = "block";
  var cust = window.getCustomer ? window.getCustomer() : null;
  if (cust) {
    if (document.getElementById("buyName")) document.getElementById("buyName").value = cust.name || "";
    if (document.getElementById("buyPhone")) document.getElementById("buyPhone").value = cust.phone || "";
  }
  document.getElementById("buyAddress").value = "";
  document.getElementById("buyPincode").value = "";
  document.getElementById("buyCity").value = "";
  document.getElementById("buyState").value = "";
  document.getElementById("buyDistrict").value = "";
  renderBuyAddressCards();
});

// "Back to saved addresses" button
document.getElementById("buyBackToSavedBtn")?.addEventListener("click", function() {
  buyUseNewAddress = false;
  var form = document.getElementById("buyNewAddressForm");
  var list = document.getElementById("buySavedAddressList");
  if (form) form.style.display = "none";
  if (list) list.style.display = "block";
  renderBuyAddressCards();
});

// Step navigation
function showBuyStep(step) {
  document.getElementById("buyStep1").style.display = step === 1 ? "block" : "none";
  document.getElementById("buyStep2").style.display = step === 2 ? "block" : "none";
  if (step === 2) populateBuyConfirmation();
}

// Step 1 — Address form submit
document.getElementById("buyAddressForm").addEventListener("submit", async function (e) {
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

  // Save address only if it's a new address (not a saved one)
  var saveCb = document.getElementById("buySaveAddressCheck");
  if (saveCb && saveCb.checked && !buySelectedAddressId) {
    await saveBuyAddress();
    loadBuySavedAddresses();
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
  // Use saved address if selected
  var name, address, pincode, city, state;
  if (buySelectedAddressId && !buyUseNewAddress) {
    var selAddr = buySavedAddresses.find(function(a) { return a.id === buySelectedAddressId; });
    if (selAddr) {
      var custData = window.getCustomer ? window.getCustomer() : null;
      name = custData ? (custData.name || "") : "";
      address = selAddr.address || "";
      pincode = selAddr.pincode || "";
      city = selAddr.city || "";
      state = selAddr.state || "";
    }
  }
  if (!name) name = document.getElementById("buyName").value;
  if (!address) address = document.getElementById("buyAddress").value;
  if (!pincode) pincode = document.getElementById("buyPincode").value;
  if (!city) city = document.getElementById("buyCity").value;
  if (!state) state = document.getElementById("buyState").value;
  var size = document.getElementById("buySize").value;
  var qty = document.getElementById("buyQty").value;
  var productName = document.getElementById("productName").innerText;
  var price = getProductPrice();
  var total = price * parseInt(qty);

  document.querySelector("#buyStep2 .buy-summary").innerHTML =
    '<div class="buy-summary-row"><span>Product</span><span>' + productName + '</span></div>' +
    '<div class="buy-summary-row"><span>Size</span><span>' + size + '</span></div>' +
    '<div class="buy-summary-row"><span>Quantity</span><span>' + qty + '</span></div>' +
    '<div class="buy-summary-row"><span>Name</span><span>' + name + '</span></div>' +
    '<div class="buy-summary-row"><span>Address</span><span style="font-size:12px;">' + address + ', ' + city + ', ' + state + ' - ' + pincode + '</span></div>' +
    '<div class="buy-summary-row" style="border-top:1px solid #333;padding-top:10px;margin-top:6px;text-align:center;"><span style="font-weight:700;font-size:16px;">Total Amount</span><span style="color:#ff6b00;font-weight:700;font-size:18px;display:block;text-align:center;margin-top:4px;">&#8377;' + total.toFixed(2) + '</span></div>';
}

async function placeBuyOrder() {
  var btn = document.getElementById("placeBuyOrderBtn");
  btn.disabled = true;
  btn.textContent = "Processing...";
  var qty = parseInt(document.getElementById("buyQty").value) || 1;
  var price = getProductPrice();
  var total = price * qty;
  if (total < 1) {
    if (typeof showToast === "function") showToast("Invalid amount");
    btn.disabled = false;
    btn.textContent = "Place Order";
    return;
  }
  // Use saved address if selected
  var name, phone, address, pincode, city, state;
  if (buySelectedAddressId && !buyUseNewAddress) {
    var selAddr = buySavedAddresses.find(function(a) { return a.id === buySelectedAddressId; });
    if (selAddr) {
      var custData = window.getCustomer ? window.getCustomer() : null;
      name = custData ? (custData.name || "") : "";
      phone = custData ? (custData.phone || "") : "";
      address = selAddr.address || "";
      pincode = selAddr.pincode || "";
      city = selAddr.city || "";
      state = selAddr.state || "";
    }
  }
  if (!name) name = document.getElementById("buyName").value;
  if (!phone) phone = document.getElementById("buyPhone").value;
  if (!address) address = document.getElementById("buyAddress").value;
  if (!pincode) pincode = document.getElementById("buyPincode").value;
  if (!city) city = document.getElementById("buyCity").value;
  if (!state) state = document.getElementById("buyState").value;

  // Save address first if checkbox is checked (only for new addresses)
  var buySaveCb = document.getElementById("buySaveAddressCheck");
  if (buySaveCb && buySaveCb.checked && !buySelectedAddressId) {
    await saveBuyAddress();
  }

  var size = document.getElementById("buySize").value;
  var productName = document.getElementById("productName").innerText;
  var district = document.getElementById("buyDistrict")?.value || "";
  var fullAddress = address + (district ? ", " + district : "") + ", " + city + ", " + state + " - " + pincode;
  var api = window.PEHRAWA_API_BASE || "http://localhost:5000";
  var cust = window.getCustomer ? window.getCustomer() : null;

  // Step 1: Create Razorpay order
  var rzpRes;
  try {
    rzpRes = await fetch(api + "/api/public/create-razorpay-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: total })
    });
  } catch (e) {
    if (typeof showToast === "function") showToast("Payment service unavailable");
    btn.disabled = false;
    btn.textContent = "Place Order";
    return;
  }
  var rzpData = await rzpRes.json();
  if (!rzpData.success) {
    if (typeof showToast === "function") showToast(rzpData.message || "Payment initiation failed");
    btn.disabled = false;
    btn.textContent = "Place Order";
    return;
  }

  // Step 2: Open Razorpay checkout
  var options = {
    key: "rzp_live_T6aA0kd4BdVC3q",
    amount: rzpData.amount,
    currency: "INR",
    name: "Pehrawa",
    order_id: rzpData.order_id,
    theme: { color: "#ff6b00" },
    handler: async function (response) {
      try {
        var res = await fetch(api + "/api/public/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_name: name,
            phone: phone,
            address: fullAddress,
            total_amount: total,
            status: "Pending",
            payment_status: "paid",
            razorpay_payment_id: response.razorpay_payment_id,
            customer_id: cust ? cust.id : (localStorage.getItem("customerId") || null),
            items: [{ name: productName, size: size, quantity: qty, price: price }]
          })
        });
        var data = await res.json();
        if (data.success) {
          if (typeof showToast === "function") showToast("✅ Payment successful! Order placed.");
          document.getElementById("buyCheckoutOverlay").classList.remove("active");
          setTimeout(function () { window.location.href = "my-orders.html"; }, 1500);
        } else {
          if (typeof showToast === "function") showToast(data.message || "Failed to place order");
        }
      } catch (err) {
        if (typeof showToast === "function") showToast("Error placing order");
      }
      btn.disabled = false;
      btn.textContent = "Place Order";
    },
    modal: {
      ondismiss: function () {
        if (typeof showToast === "function") showToast("Payment cancelled");
        btn.disabled = false;
        btn.textContent = "Place Order";
      }
    }
  };
  var rzp = new Razorpay(options);
  rzp.open();
}

loadProductDetails();
