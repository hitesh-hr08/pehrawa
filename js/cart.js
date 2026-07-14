const cartContainer = document.getElementById("cartItems");
const cartItemCount = document.getElementById("cartItemCount");
const cartSubtotal = document.getElementById("cartSubtotal");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const clearCartBtn = document.getElementById("clearCartBtn");

// ===============================
// FLIPKART-STYLE ADDRESS SYSTEM
// ===============================
var selectedAddressId = null;
var savedAddresses = [];
var useNewAddress = false;

async function loadSavedAddresses() {
  var cust = window.getCustomer ? window.getCustomer() : null;
  if (!cust || !cust.id) return;
  var token = window.getCustomerToken ? window.getCustomerToken() : "";
  if (!token) return;
  var api = window.PEHRAWA_API_BASE || "http://localhost:5000";
  document.getElementById("savedAddressesSection").style.display = "none";
  try {
    var res = await fetch(api + "/api/customers/" + cust.id + "/addresses", {
      headers: { "Authorization": "Bearer " + token }
    });
    var data = await res.json();
    if (data.success && data.addresses) {
      savedAddresses = data.addresses;
      renderAddressCards();
    }
  } catch (e) {}
}

function renderAddressCards() {
  var list = document.getElementById("savedAddressList");
  if (!list) return;
  if (savedAddresses.length === 0) {
    document.getElementById("savedAddressesSection").style.display = "none";
    return;
  }
  document.getElementById("savedAddressesSection").style.display = "block";
  var html = "";
  savedAddresses.forEach(function(addr, idx) {
    var isSelected = selectedAddressId === addr.id || (!selectedAddressId && addr.is_default);
    var label = addr.label || "Home";
    html += '<div class="addr-card' + (isSelected ? ' addr-selected' : '') + '" data-id="' + addr.id + '" onclick="selectAddressCard(' + addr.id + ')">' +
      '<div class="addr-radio"><span class="addr-radio-dot' + (isSelected ? ' active' : '') + '"></span></div>' +
      '<div class="addr-info">' +
        '<div class="addr-label"><span class="addr-badge">' + label + '</span>' + (addr.is_default ? '<span class="addr-default-badge">DEFAULT</span>' : '') + '</div>' +
        '<div class="addr-detail"><strong>' + (addr.address || "") + '</strong></div>' +
        '<div class="addr-detail">' + (addr.city || "") + (addr.city && addr.state ? ", " : "") + (addr.state || "") + ' - ' + (addr.pincode || "") + '</div>' +
      '</div>' +
      '<button class="addr-del-btn" onclick="event.stopPropagation();deleteAddress(' + addr.id + ')" title="Remove"><i class="fa-solid fa-trash-can"></i></button>' +
    '</div>';
  });
  list.innerHTML = html;

  // Auto-select default
  var defaultAddr = savedAddresses.find(function(a) { return a.is_default; }) || savedAddresses[0];
  if (defaultAddr && !selectedAddressId) {
    selectedAddressId = defaultAddr.id;
    fillAddressFromSelected();
  }
}

window.selectAddressCard = function(id) {
  selectedAddressId = id;
  useNewAddress = false;
  document.getElementById("newAddressForm").style.display = "none";
  document.getElementById("toggleNewAddressWrap").style.display = "block";
  fillAddressFromSelected();
  renderAddressCards();
};

function fillAddressFromSelected() {
  var addr = savedAddresses.find(function(a) { return a.id === selectedAddressId; });
  if (!addr) return;
  if (document.getElementById("customerName")) document.getElementById("customerName").value = addr.label || "";
  if (document.getElementById("customerAddress")) document.getElementById("customerAddress").value = addr.address || "";
  if (document.getElementById("customerPincode")) document.getElementById("customerPincode").value = addr.pincode || "";
  if (document.getElementById("customerCity")) document.getElementById("customerCity").value = addr.city || "";
  if (document.getElementById("customerState")) document.getElementById("customerState").value = addr.state || "";
  if (document.getElementById("customerDistrict")) document.getElementById("customerDistrict").value = "";
}

window.deleteAddress = async function(id) {
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
    savedAddresses = savedAddresses.filter(function(a) { return a.id !== id; });
    if (selectedAddressId === id) selectedAddressId = null;
    renderAddressCards();
    if (savedAddresses.length === 0) showNewAddressForm();
  } catch (e) {}
};

async function saveCurrentAddress() {
  var cust = window.getCustomer ? window.getCustomer() : null;
  if (!cust || !cust.id) return;
  var token = window.getCustomerToken ? window.getCustomerToken() : "";
  if (!token) return;
  var addr = document.getElementById("customerAddress")?.value?.trim();
  if (!addr) return;
  var api = window.PEHRAWA_API_BASE || "http://localhost:5000";
  try {
    await fetch(api + "/api/customers/" + cust.id + "/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify({
        label: document.getElementById("customerName")?.value?.trim() || "Home",
        address: addr,
        pincode: document.getElementById("customerPincode")?.value || "",
        city: document.getElementById("customerCity")?.value || "",
        state: document.getElementById("customerState")?.value || "",
        is_default: savedAddresses.length === 0
      })
    });
  } catch (e) {}
}

function showNewAddressForm() {
  useNewAddress = true;
  selectedAddressId = null;
  document.getElementById("newAddressForm").style.display = "block";
  document.getElementById("toggleNewAddressWrap").style.display = "none";
  renderAddressCards();
  var cust = window.getCustomer ? window.getCustomer() : null;
  if (cust) {
    if (document.getElementById("customerName")) document.getElementById("customerName").value = cust.name || "";
    if (document.getElementById("customerPhone")) document.getElementById("customerPhone").value = cust.phone || "";
  }
}

document.addEventListener("click", function(e) {
  var btn = e.target.closest("#toggleNewAddressBtn");
  if (btn) {
    e.preventDefault();
    showNewAddressForm();
  }
});

// ===============================
// INIT
// ===============================
var customer = window.getCustomer ? window.getCustomer() : null;
if (customer) {
  localStorage.setItem("customerId", customer.id);
}
loadSavedAddresses();

// Coupon state
var appliedCoupon = null;
var couponDiscount = 0;

function normalizeCart() {
  cart = cart.map(function (item) {
    return {
      ...item,
      id: item.id || null,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      size: item.size || "M",
      image: item.image || "../images/product1.png"
    };
  });
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function renderCart() {
  normalizeCart();

  if (cart.length === 0) {
    cartContainer.innerHTML =
      '<div class="empty-cart">' +
        '<i class="fa-solid fa-cart-shopping"></i>' +
        '<h3>Your cart is empty</h3>' +
        '<p>Add Pehrawa products from the shop to place your order.</p>' +
        '<a href="shop.html">Shop Collection</a>' +
      '</div>';
    updateSummary(0, 0);
    return;
  }

  var total = 0;
  var itemCount = 0;

  cartContainer.innerHTML = cart.map(function (product, index) {
    var itemTotal = product.price * product.quantity;
    total += itemTotal;
    itemCount += product.quantity;

    return '<div class="cart-item">' +
        '<img src="' + product.image + '" alt="' + product.name + '">' +
        '<div class="cart-item-info">' +
          '<span class="cart-sku">PEHRAWA ITEM</span>' +
          '<h3>' + product.name + '</h3>' +
          '<p>Size: ' + product.size + '</p>' +
          '<strong>Rs. ' + product.price.toFixed(2) + '</strong>' +
        '</div>' +
        '<div class="quantity-control">' +
          '<button onclick="updateQuantity(' + index + ', -1)">-</button>' +
          '<span>' + product.quantity + '</span>' +
          '<button onclick="updateQuantity(' + index + ', 1)">+</button>' +
        '</div>' +
        '<div class="item-total">' +
          '<span>Subtotal</span>' +
          '<strong>Rs. ' + itemTotal.toFixed(2) + '</strong>' +
        '</div>' +
        '<button class="remove-btn" onclick="removeItem(' + index + ')">' +
          '<i class="fa-solid fa-trash"></i>' +
        '</button>' +
      '</div>';
  }).join("");

  updateSummary(itemCount, total);
  saveCart();
}

function updateSummary(itemCount, total) {
  var finalTotal = total - couponDiscount;
  if (finalTotal < 0) finalTotal = 0;
  cartItemCount.innerText = itemCount;
  cartSubtotal.innerText = total.toFixed(2);
  cartTotal.innerText = finalTotal.toFixed(2);
  var summaryCount = document.getElementById("summaryItemCount");
  if (summaryCount) summaryCount.innerText = itemCount;
  updateHeaderCartCount(itemCount);
}

function updateHeaderCartCount(count) {
  var cartIcon = document.querySelector(".fa-cart-shopping");
  var badge = cartIcon && cartIcon.parentElement.querySelector("span");
  if (badge) {
    badge.innerText = count;
  }
}

function updateQuantity(index, change) {
  cart[index].quantity = Math.max(1, (Number(cart[index].quantity) || 1) + change);
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function clearCart() {
  if (cart.length === 0) return;
  if (!confirm("Clear all items from cart?")) return;
  cart = [];
  saveCart();
  renderCart();
}

async function placeOrder() {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  // If a saved address is selected, use it directly
  var customerName, customerPhone, customerAddress, customerPincode, customerCity, customerState;
  if (selectedAddressId && !useNewAddress) {
    var selAddr = savedAddresses.find(function(a) { return a.id === selectedAddressId; });
    if (selAddr) {
      var custData = window.getCustomer ? window.getCustomer() : null;
      customerName = custData ? (custData.name || "") : "";
      customerPhone = custData ? (custData.phone || "") : "";
      customerAddress = selAddr.address || "";
      customerPincode = selAddr.pincode || "";
      customerCity = selAddr.city || "";
      customerState = selAddr.state || "";
    }
  }
  if (!customerName) customerName = document.getElementById("customerName").value.trim();
  if (!customerPhone) customerPhone = document.getElementById("customerPhone").value.trim();
  if (!customerAddress) customerAddress = document.getElementById("customerAddress").value.trim();
  customerPincode = customerPincode || document.getElementById("customerPincode")?.value || "";
  customerCity = customerCity || document.getElementById("customerCity")?.value || "";
  customerState = customerState || document.getElementById("customerState")?.value || "";

  if (!customerName || !customerPhone || !customerAddress) {
    alert("Please fill name, phone, and address");
    return;
  }

  var subtotal = cart.reduce(function (sum, item) {
    return sum + (Number(item.price) * Number(item.quantity || 1));
  }, 0);
  var finalTotal = subtotal - couponDiscount;
  if (finalTotal < 0) finalTotal = 0;

  var savedCustomerId = null;
  var cust = window.getCustomer ? window.getCustomer() : null;
  if (cust && cust.id) {
    savedCustomerId = cust.id;
    localStorage.setItem("customerId", cust.id);
  } else {
    savedCustomerId = localStorage.getItem("customerId");
  }

  checkoutBtn.disabled = true;
  checkoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

  var saveCb = document.getElementById("saveAddressCheck");
  if (saveCb && saveCb.checked && !selectedAddressId) {
    await saveCurrentAddress();
  }

  var api = window.PEHRAWA_API_BASE || "http://localhost:5000";

  // Step 1: Create Razorpay order
  var rzpRes;
  try {
    rzpRes = await fetch(api + "/api/public/create-razorpay-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: finalTotal })
    });
  } catch (e) {
    if (typeof showToast === "function") showToast("Payment service unavailable");
    checkoutBtn.disabled = false;
    checkoutBtn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> PLACE ORDER';
    return;
  }
  var rzpData = await rzpRes.json();
  if (!rzpData.success) {
    if (typeof showToast === "function") showToast(rzpData.message || "Payment initiation failed");
    checkoutBtn.disabled = false;
    checkoutBtn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> PLACE ORDER';
    return;
  }

  // Step 2: Open Razorpay checkout
  var fullAddress = customerAddress + ", " + customerCity + ", " + customerState + " - " + customerPincode;
  var options = {
    key: window.PEHRAWA_RZP_KEY || "rzp_live_T6aA0kd4BdVC3q",
    amount: rzpData.amount,
    currency: "INR",
    name: "Pehrawa",
    order_id: rzpData.order_id,
    theme: { color: "#ff6b00" },
    handler: async function (response) {
      try {
        var res = await fetch(api + "/api/public/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + (window.getCustomerToken ? window.getCustomerToken() : "")
          },
          body: JSON.stringify({
            customer_name: customerName,
            customer_id: savedCustomerId,
            phone: customerPhone,
            address: fullAddress,
            total_amount: finalTotal,
            original_amount: subtotal,
            status: "Pending",
            payment_status: "paid",
            coupon_code: appliedCoupon ? appliedCoupon.code : null,
            coupon_discount: couponDiscount,
            razorpay_payment_id: response.razorpay_payment_id,
            items: cart.map(function (item) {
              return { id: item.id, name: item.name, price: item.price, quantity: item.quantity, size: item.size };
            })
          })
        });
        var data = await res.json();
        if (data.success) {
          cart = [];
          saveCart();
          renderCart();
          appliedCoupon = null;
          couponDiscount = 0;
          if (typeof showToast === "function") showToast("✅ Payment successful! Order placed.");
          setTimeout(function () { window.location.href = "my-orders.html"; }, 1500);
        } else {
          if (typeof showToast === "function") showToast(data.message || "Order failed");
        }
      } catch (err) {
        if (typeof showToast === "function") showToast("Error placing order");
      }
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> PLACE ORDER';
    },
    modal: {
      ondismiss: function () {
        if (typeof showToast === "function") showToast("Payment cancelled");
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> PLACE ORDER';
      }
    }
  };
  var rzp = new Razorpay(options);
  rzp.open();
}

if (checkoutBtn) {
  checkoutBtn.addEventListener("click", function () {
    window.requireAuth(function (loggedIn) {
      if (loggedIn) placeOrder();
    });
  });
}

if (clearCartBtn) {
  clearCartBtn.addEventListener("click", clearCart);
}

// ===============================
// COUPON UI
// ===============================
document.getElementById("applyCouponBtn").addEventListener("click", async function() {
  var input = document.getElementById("couponInput");
  var code = input.value.trim();
  if (!code) {
    document.getElementById("couponMessage").textContent = "Please enter a coupon code";
    return;
  }
  var total = cart.reduce(function(sum, item) {
    return sum + (Number(item.price) * Number(item.quantity || 1));
  }, 0);
  var api = window.PEHRAWA_API_BASE || "http://localhost:5000";
  var btn = document.getElementById("applyCouponBtn");
  btn.disabled = true;
  btn.textContent = "Validating...";
  try {
    var res = await fetch(api + "/api/public/validate-coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code, order_amount: total })
    });
    var data = await res.json();
    if (data.success) {
      appliedCoupon = data.coupon;
      couponDiscount = data.discount;
      document.getElementById("couponMessage").textContent = "";
      document.getElementById("appliedCoupon").style.display = "flex";
      document.getElementById("couponCodeDisplay").textContent = data.coupon.code;
      document.getElementById("couponDiscountDisplay").textContent = "- Rs. " + couponDiscount.toFixed(2);
      renderCart();
    } else {
      couponDiscount = 0;
      appliedCoupon = null;
      document.getElementById("appliedCoupon").style.display = "none";
      document.getElementById("couponMessage").textContent = data.message || "Invalid coupon";
      document.getElementById("couponMessage").style.color = "#ff4d4d";
      renderCart();
    }
  } catch (err) {
    document.getElementById("couponMessage").textContent = "Failed to validate coupon";
  }
  btn.disabled = false;
  btn.textContent = "Apply";
});

document.getElementById("removeCouponBtn").addEventListener("click", function() {
  appliedCoupon = null;
  couponDiscount = 0;
  document.getElementById("appliedCoupon").style.display = "none";
  document.getElementById("couponInput").value = "";
  document.getElementById("couponMessage").textContent = "";
  renderCart();
});

renderCart();
