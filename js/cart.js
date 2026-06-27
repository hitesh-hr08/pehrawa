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

// UPI Payment handlers
document.getElementById("upiCheckoutBtn").addEventListener("click", function () {
  window.requireAuth(function (loggedIn) {
    if (!loggedIn) return;
    if (cart.length === 0) { alert("Cart is empty"); return; }
    var name = document.getElementById("customerName").value.trim();
    var phone = document.getElementById("customerPhone").value.trim();
    var addr = document.getElementById("customerAddress").value.trim();
    if (!name || !phone || !addr) { alert("Please fill name, phone, and address"); return; }
    var total = cart.reduce(function (s, item) { return s + (Number(item.price) * Number(item.quantity || 1)); }, 0);
    var upiStr = "upi://pay?pa=hrandhan-1@okicici&pn=Pehrawa%20Menswear&am=" + total.toFixed(2) + "&cu=INR";
    // Load QR silently (ignore errors)
    var qr = document.getElementById("cartUpiQr");
    if (qr) {
      qr.onerror = function () { qr.style.display = "none"; };
      qr.src = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" + encodeURIComponent(upiStr);
    }
    // Open specific UPI app on button click
    document.querySelectorAll("#upiPaymentOverlay .upi-app-btn").forEach(function (btn) {
      btn.onclick = function () {
        var app = btn.getAttribute("data-upi-app");
        var amt = total.toFixed(2);
        var links = {
          gpay: "tez://upi/pay?pa=hrandhan-1@okicici&pn=Pehrawa%20Menswear&am=" + amt + "&cu=INR",
          phonepay: "phonepe://pay?pa=hrandhan-1@okicici&pn=Pehrawa%20Menswear&am=" + amt + "&cu=INR",
          paytm: "paytmmp://pay?pa=hrandhan-1@okicici&pn=Pehrawa%20Menswear&am=" + amt + "&cu=INR"
        };
        var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = links[app] || upiStr;
        } else {
          var input = document.getElementById("cartUpiTxnId");
          if (input) { input.value = ""; input.focus(); }
          if (typeof showToast === "function") showToast("Pay using UPI ID: hrandhan-1@okicici from your phone");
        }
      };
    });
    document.getElementById("upiPaymentOverlay").classList.add("active");
  });
});

document.getElementById("upiPaymentClose").addEventListener("click", function () {
  document.getElementById("upiPaymentOverlay").classList.remove("active");
});
document.getElementById("upiPaymentOverlay").addEventListener("click", function (e) {
  if (e.target === this) this.classList.remove("active");
});

document.getElementById("cartUpiConfirm").addEventListener("click", async function () {
  var txnId = document.getElementById("cartUpiTxnId").value.trim();
  var btn = document.getElementById("cartUpiConfirm");
  if (!txnId) {
    if (typeof showToast === "function") showToast("Please complete the UPI payment and enter the Transaction ID");
    return;
  }
  btn.disabled = true;
  btn.textContent = "Placing Order...";
  var name = document.getElementById("customerName").value.trim();
  var phone = document.getElementById("customerPhone").value.trim();
  var addr = document.getElementById("customerAddress").value.trim();
  var total = cart.reduce(function (s, item) { return s + (Number(item.price) * Number(item.quantity || 1)); }, 0);
  var cust = window.getCustomer ? window.getCustomer() : null;
  var api = window.PEHRAWA_API_BASE || "http://localhost:5000";
  try {
    var res = await fetch(api + "/api/public/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: name, customer_id: cust ? cust.id : localStorage.getItem("customerId"),
        phone: phone,
        address: addr + ", " + (document.getElementById("customerCity")?.value || "") + ", " + (document.getElementById("customerState")?.value || "") + ", Pincode: " + (document.getElementById("customerPincode")?.value || ""),
        total_amount: total, status: "Verifying Payment", payment_id: txnId || null,
        items: cart.map(function (item) { return { id: item.id, name: item.name, price: item.price, quantity: item.quantity, size: item.size }; })
      })
    });
    var data = await res.json();
    if (data.success) {
      cart = []; saveCart(); renderCart();
      document.getElementById("upiPaymentOverlay").classList.remove("active");
      if (typeof showToast === "function") showToast("✅ Order submitted successfully!");
      btn.disabled = true;
      btn.textContent = "Redirecting...";
      setTimeout(function () { window.location.href = "my-orders.html"; }, 1500);
      return;
    } else {
      if (typeof showToast === "function") showToast(data.message || "Failed to place order");
    }
  } catch (err) {
    if (typeof showToast === "function") showToast("Error placing order");
  }
  btn.disabled = false;
  btn.textContent = "I've Paid — Place Order";
});

clearCartBtn.addEventListener("click", clearCart);

renderCart();
