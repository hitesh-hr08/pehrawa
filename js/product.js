let selectedSize = "M";
let currentProduct = null;

const API_URL = `${window.PEHRAWA_API_BASE || "http://localhost:5000"}/api/public/products`;
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

document.querySelectorAll(".size-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".size-btn").forEach((item) => item.classList.remove("active"));
    btn.classList.add("active");
    selectedSize = btn.innerText;
  });
});

async function loadProductDetails() {
  if (!productId) return;

  try {
    const res = await fetch(`${API_URL}/${productId}`);
    const data = await res.json();

    if (!data.success) {
      document.getElementById("productName").innerText = "Product Not Found";
      document.getElementById("productDescription").innerText = data.message || "This product is unavailable.";
      return;
    }

    currentProduct = data.product;
    renderProduct(currentProduct);
  } catch (err) {
    document.getElementById("productName").innerText = "Unable To Load Product";
    document.getElementById("productDescription").innerText = "Start backend server to view live product details.";
  }
}

function renderProduct(product) {
  document.title = `${product.name} | Pehrawa Menswear`;
  document.getElementById("productImage").src = product.image_url || "../images/product1.png";
  document.getElementById("productImage").alt = product.name;
  document.getElementById("productName").innerText = product.name;
  document.getElementById("productPrice").innerText = '&#8377;' + Number(product.price).toFixed(2);
  document.getElementById("productDescription").innerText =
    product.description || "Premium Pehrawa menswear product crafted for comfort and style.";
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
