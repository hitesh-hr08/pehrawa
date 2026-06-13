let cart = JSON.parse(localStorage.getItem("cart")) || [];

const cartContainer = document.getElementById("cartItems");
const cartItemCount = document.getElementById("cartItemCount");
const cartSubtotal = document.getElementById("cartSubtotal");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const clearCartBtn = document.getElementById("clearCartBtn");
const savedCustomerId = localStorage.getItem("customerId");
const savedCustomerName = localStorage.getItem("customerName");
const savedCustomerPhone = localStorage.getItem("customerPhone");

if (savedCustomerName && document.getElementById("customerName")) {
  document.getElementById("customerName").value = savedCustomerName;
}

if (savedCustomerPhone && document.getElementById("customerPhone")) {
  document.getElementById("customerPhone").value = savedCustomerPhone;
}

function normalizeCart() {
  cart = cart.map((item) => ({
    ...item,
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 1,
    size: item.size || "M",
    image: item.image || "../images/product1.png",
  }));
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function renderCart() {
  normalizeCart();

  if (cart.length === 0) {
    cartContainer.innerHTML = `
      <div class="empty-cart">
        <i class="fa-solid fa-cart-shopping"></i>
        <h3>Your cart is empty</h3>
        <p>Add Pehrawa products from the shop to place your order.</p>
        <a href="shop.html">Shop Collection</a>
      </div>
    `;

    updateSummary(0, 0);
    return;
  }

  let total = 0;
  let itemCount = 0;

  cartContainer.innerHTML = cart.map((product, index) => {
    const itemTotal = product.price * product.quantity;
    total += itemTotal;
    itemCount += product.quantity;

    return `
      <div class="cart-item">
        <img src="${product.image}" alt="${product.name}">

        <div class="cart-item-info">
          <span class="cart-sku">PEHRAWA ITEM</span>
          <h3>${product.name}</h3>
          <p>Size: ${product.size}</p>
          <strong>Rs. ${product.price.toFixed(2)}</strong>
        </div>

        <div class="quantity-control">
          <button onclick="updateQuantity(${index}, -1)">-</button>
          <span>${product.quantity}</span>
          <button onclick="updateQuantity(${index}, 1)">+</button>
        </div>

        <div class="item-total">
          <span>Subtotal</span>
          <strong>Rs. ${itemTotal.toFixed(2)}</strong>
        </div>

        <button class="remove-btn" onclick="removeItem(${index})">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
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
  const cartIcon = document.querySelector(".fa-cart-shopping");
  const badge = cartIcon && cartIcon.parentElement.querySelector("span");

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

function buildOrderText() {
  let orderText = "PEHRAWA ORDER\n\n";
  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = Number(item.price) * Number(item.quantity || 1);
    total += itemTotal;

    orderText += `${index + 1}. ${item.name}\n`;
    orderText += `Size: ${item.size || "M"}\n`;
    orderText += `Qty: ${item.quantity || 1}\n`;
    orderText += `Price: Rs. ${Number(item.price).toFixed(2)}\n`;
    orderText += `Subtotal: Rs. ${itemTotal.toFixed(2)}\n\n`;
  });

  orderText += `Total: Rs. ${total.toFixed(2)}\n\n`;
  return { orderText, total };
}

async function checkoutOnWhatsapp() {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  const customerName = document.getElementById("customerName").value.trim();
  const customerPhone = document.getElementById("customerPhone").value.trim();
  const customerAddress = document.getElementById("customerAddress").value.trim();

  if (!customerName || !customerPhone || !customerAddress) {
    alert("Please enter your name, phone number, and delivery address.");
    return;
  }

  const { orderText, total } = buildOrderText();
  const customerText =
    `Customer: ${customerName}\nPhone: ${customerPhone}\nAddress: ${customerAddress}\n\n`;

  try {
    const apiBase = window.PEHRAWA_API_BASE || "http://localhost:5000";
    const res = await fetch(`${apiBase}/api/public/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: customerName,
        customer_id: savedCustomerId,
        phone: customerPhone,
        address: customerAddress,
        total_amount: total,
        items: cart
      })
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Order could not be saved.");
      return;
    }

    window.open(
      `https://wa.me/919855707708?text=${encodeURIComponent(orderText + customerText + "Please confirm availability and delivery charges.")}`,
      "_blank"
    );

    cart = [];
    saveCart();
    renderCart();
    alert("Order saved successfully. Admin dashboard will show this order.");
  } catch (err) {
    alert("Start backend server before placing order.");
  }
}

checkoutBtn.addEventListener("click", checkoutOnWhatsapp);
clearCartBtn.addEventListener("click", clearCart);

renderCart();
