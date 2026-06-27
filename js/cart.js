const cartContainer = document.getElementById("cartItems");
const cartItemCount = document.getElementById("cartItemCount");
const cartSubtotal = document.getElementById("cartSubtotal");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const clearCartBtn = document.getElementById("clearCartBtn");
var customer = window.getCustomer ? window.getCustomer() : null;
if (customer) {
  if (document.getElementById("customerName")) document.getElementById("customerName").value = customer.name || "";
  if (document.getElementById("customerPhone")) document.getElementById("customerPhone").value = customer.phone || "";
  localStorage.setItem("customerId", customer.id);
}

// Load saved addresses
async function loadSavedAddresses() {
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
    if (data.success && data.addresses && data.addresses.length > 0) {
      var section = document.getElementById("savedAddressesSection");
      var select = document.getElementById("savedAddressSelect");
      if (section) section.style.display = "block";
      if (select) {
        select.innerHTML = '<option value="">-- Select a saved address --</option>';
        data.addresses.forEach(function (addr) {
          var opt = document.createElement("option");
          opt.value = addr.id;
          opt.textContent = addr.label + ": " + addr.address + (addr.city ? ", " + addr.city : "");
          if (addr.is_default) opt.selected = true;
          select.appendChild(opt);
        });
        // Auto-fill default
        var defaultAddr = data.addresses.find(function (a) { return a.is_default; }) || data.addresses[0];
        if (defaultAddr) fillAddressFields(defaultAddr);
      }
    }
  } catch (e) {}
}

function fillAddressFields(addr) {
  if (document.getElementById("customerName") && addr.label) {
    // Don't overwrite name from customer profile
  }
  if (document.getElementById("customerAddress")) document.getElementById("customerAddress").value = addr.address || "";
  if (document.getElementById("customerPincode")) document.getElementById("customerPincode").value = addr.pincode || "";
  if (document.getElementById("customerCity")) document.getElementById("customerCity").value = addr.city || "";
  if (document.getElementById("customerState")) document.getElementById("customerState").value = addr.state || "";
}

window.selectSavedAddress = function (addressId) {
  if (!addressId) return;
  var cust = window.getCustomer ? window.getCustomer() : null;
  if (!cust || !cust.id) return;
  var token = window.getCustomerToken ? window.getCustomerToken() : "";
  var api = window.PEHRAWA_API_BASE || "http://localhost:5000";
  fetch(api + "/api/customers/" + cust.id + "/addresses", {
    headers: { "Authorization": "Bearer " + token }
  })
  .then(function (r) { return r.json(); })
  .then(function (data) {
    if (data.success && data.addresses) {
      var addr = data.addresses.find(function (a) { return a.id == addressId; });
      if (addr) fillAddressFields(addr);
    }
  });
};

// Load saved addresses on page load
if (document.getElementById("savedAddressesSection")) {
  loadSavedAddresses();
}

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
  cartItemCount.innerText = itemCount;
  cartSubtotal.innerText = total.toFixed(2);
  cartTotal.innerText = total.toFixed(2);
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

async function checkoutWithPayment() {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  var customerName = document.getElementById("customerName").value.trim();
  var customerPhone = document.getElementById("customerPhone").value.trim();
  var customerAddress = document.getElementById("customerAddress").value.trim();

  if (!customerName || !customerPhone || !customerAddress) {
    alert("Please enter your name, phone number, and delivery address.");
    return;
  }

  var total = cart.reduce(function (sum, item) {
    return sum + (Number(item.price) * Number(item.quantity || 1));
  }, 0);

  var savedCustomerId = null;
  var cust = window.getCustomer ? window.getCustomer() : null;
  if (cust && cust.id) {
    savedCustomerId = cust.id;
    localStorage.setItem("customerId", cust.id);
  } else {
    savedCustomerId = localStorage.getItem("customerId");
  }

  checkoutBtn.disabled = true;
  checkoutBtn.textContent = "Processing...";

  var apiBase = window.PEHRAWA_API_BASE || "http://localhost:5000";

  try {
    var res = await fetch(apiBase + "/api/public/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + (window.getCustomerToken ? window.getCustomerToken() : "")
      },
      body: JSON.stringify({
        customer_name: customerName,
        customer_id: savedCustomerId,
        phone: customerPhone,
        address: customerAddress + ", " + (document.getElementById("customerCity")?.value || "") + ", " + (document.getElementById("customerState")?.value || "") + ", Pincode: " + (document.getElementById("customerPincode")?.value || ""),
        pincode: document.getElementById("customerPincode")?.value || "",
        city: document.getElementById("customerCity")?.value || "",
        state: document.getElementById("customerState")?.value || "",
        total_amount: total,
        items: cart.map(function (item) {
          return {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size
          };
        })
      })
    });

    var data = await res.json();

    if (!data.success) {
      if (typeof showToast === "function") showToast(data.message || "Order could not be saved.");
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> BUY NOW';
      return;
    }

    cart = [];
    saveCart();
    renderCart();
    if (typeof showToast === "function") showToast("Order " + (data.order.tracking_id || "#" + data.order.id) + " placed! Track it in My Orders.");
  } catch (err) {
    if (typeof showToast === "function") showToast("Error placing order. Try again.");
  }

  checkoutBtn.disabled = false;
  checkoutBtn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> BUY NOW';
}

checkoutBtn.addEventListener("click", function () {
  window.requireAuth(function (loggedIn) {
    if (loggedIn) checkoutWithPayment();
  });
});

async function placeOrderAfterPayment(paymentId) {
  var customerName = document.getElementById("customerName").value.trim();
  var customerPhone = document.getElementById("customerPhone").value.trim();
  var customerAddress = document.getElementById("customerAddress").value.trim();
  var total = cart.reduce(function (sum, item) {
    return sum + (Number(item.price) * Number(item.quantity || 1));
  }, 0);
  var savedCustomerId = null;
  var cust = window.getCustomer ? window.getCustomer() : null;
  if (cust && cust.id) {
    savedCustomerId = cust.id;
    localStorage.setItem("customerId", cust.id);
  } else {
    savedCustomerId = localStorage.getItem("customerId");
  }
  var api = window.PEHRAWA_API_BASE || "http://localhost:5000";
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
        address: customerAddress + ", " + (document.getElementById("customerCity")?.value || "") + ", " + (document.getElementById("customerState")?.value || "") + ", Pincode: " + (document.getElementById("customerPincode")?.value || ""),
        pincode: document.getElementById("customerPincode")?.value || "",
        city: document.getElementById("customerCity")?.value || "",
        state: document.getElementById("customerState")?.value || "",
        total_amount: total,
        status: paymentId ? "Processing" : "Pending",
        payment_id: paymentId || null,
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
      if (typeof showToast === "function") showToast("✅ Order submitted successfully!");
      setTimeout(function () { window.location.href = "my-orders.html"; }, 1500);
    } else {
      if (typeof showToast === "function") showToast(data.message || "Failed to place order");
    }
  } catch (err) {
    if (typeof showToast === "function") showToast("Error placing order");
  }
}

// Razorpay checkout handler
document.getElementById("razorpayCheckoutBtn").addEventListener("click", function () {
  window.requireAuth(function (loggedIn) {
    if (!loggedIn) return;
    if (cart.length === 0) { alert("Cart is empty"); return; }
    var name = document.getElementById("customerName").value.trim();
    var phone = document.getElementById("customerPhone").value.trim();
    var addr = document.getElementById("customerAddress").value.trim();
    if (!name || !phone || !addr) { alert("Please fill name, phone, and address"); return; }
    var total = cart.reduce(function (s, item) { return s + (Number(item.price) * Number(item.quantity || 1)); }, 0);
    if (total < 1) { alert("Invalid total"); return; }
    var btn = document.getElementById("razorpayCheckoutBtn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Opening...';
    razorpayCheckout(total, async function (paymentId) {
      await placeOrderAfterPayment(paymentId);
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-credit-card"></i> PAY WITH RAZORPAY';
    }, function () {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-credit-card"></i> PAY WITH RAZORPAY';
    });
  });
});

