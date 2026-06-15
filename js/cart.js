let cart = JSON.parse(localStorage.getItem("cart")) || [];

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

  var savedCustomerId = (window.getCustomer ? window.getCustomer() : null)?.id || localStorage.getItem("customerId");

  checkoutBtn.disabled = true;
  checkoutBtn.textContent = "Processing...";

  var apiBase = window.PEHRAWA_API_BASE || "http://localhost:5000";

  try {
    var res = await fetch(apiBase + "/api/public/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      showToast(data.message || "Order could not be saved.");
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> BUY NOW';
      return;
    }

    cart = [];
    saveCart();
    renderCart();
    showToast("Order " + (data.order.tracking_id || "#" + data.order.id) + " placed! Track it in My Orders.");
  } catch (err) {
    showToast("Error placing order. Try again.");
  }

  checkoutBtn.disabled = false;
  checkoutBtn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> BUY NOW';
}

checkoutBtn.addEventListener("click", function () {
  window.requireAuth(function (loggedIn) {
    if (loggedIn) checkoutWithPayment();
  });
});
clearCartBtn.addEventListener("click", clearCart);

renderCart();
