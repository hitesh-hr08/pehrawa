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

// Load reviews
(function () {
  if (!productId) return;
  var api = window.PEHRAWA_API_BASE || "http://localhost:5000";

  fetch(api + "/api/products/" + productId + "/reviews")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success) {
        document.getElementById("reviewsList").innerHTML = '<p class="reviews-empty">Could not load reviews.</p>';
        return;
      }

      var reviews = data.reviews || [];
      var stats = data.stats || { count: 0, avg_rating: 0 };

      // Summary
      document.getElementById("reviewsSummary").querySelector(".reviews-avg").textContent = stats.avg_rating || "--";
      document.getElementById("reviewsCount").textContent = "(" + stats.count + " review" + (stats.count !== 1 ? "s" : "") + ")";
      var avgStars = "";
      var avg = Math.round(stats.avg_rating || 0);
      for (var i = 1; i <= 5; i++) { avgStars += i <= avg ? "★" : "☆"; }
      document.getElementById("reviewsAvgStars").textContent = avgStars;

      // List
      if (reviews.length === 0) {
        document.getElementById("reviewsList").innerHTML = '<p class="reviews-empty">No reviews yet. Be the first to review!</p>';
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

      document.getElementById("reviewsList").innerHTML = html;
    })
    .catch(function () {
      document.getElementById("reviewsList").innerHTML = '<p class="reviews-empty">Failed to load reviews.</p>';
    });
})();
