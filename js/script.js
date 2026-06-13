/* ===================================
   PEHRAWA MENSWEAR
   script.js
=================================== */

// ===============================
// MOBILE SEARCH TOGGLE
// ===============================

const searchIcon = document.querySelector(".search-icon");
const searchWrapper = document.querySelector(".search-wrapper");

if (searchIcon && searchWrapper) {
  searchIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    searchWrapper.classList.toggle("search-open");
  });
  document.addEventListener("click", (e) => {
    if (!searchWrapper.contains(e.target)) {
      searchWrapper.classList.remove("search-open");
    }
  });
}

// ===============================
// MOBILE MENU
// ===============================

const menuBtn = document.querySelector(".menu-btn");
const navbar = document.querySelector(".navbar");

if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    navbar.classList.toggle("active");
  });
}

// ===============================
// SMOOTH SCROLL
// ===============================

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", function (e) {
    e.preventDefault();

    const target = document.querySelector(this.getAttribute("href"));

    if (target) {
      target.scrollIntoView({
        behavior: "smooth"
      });
    }
  });
});

// ===============================
// PRODUCT DATA
// ===============================

const products = [
  {
    id: 1,
    name: "Fearless Oversized Tee",
    price: 799
  },
  {
    id: 2,
    name: "Shadow Anime Tee",
    price: 749
  },
  {
    id: 3,
    name: "Abstract Vision Tee",
    price: 749
  },
  {
    id: 4,
    name: "Minimal Logo Tee",
    price: 699
  }
];

// ===============================
// CART SYSTEM
// ===============================

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function updateCartCount() {

  const cartBadge = document.querySelector(
    ".fa-cart-shopping + span"
  );

  if (cartBadge) {
    cartBadge.innerText = cart.length;
  }
}

function addToCart(productId) {

  const product = products.find(
    item => item.id === productId
  );

  if (!product) return;

  cart.push(product);

  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );

  updateCartCount();

  showToast(`${product.name} added to cart`);
}

updateCartCount();

// ===============================
// WISHLIST SYSTEM
// ===============================

let wishlist =
  JSON.parse(localStorage.getItem("wishlist")) || [];

function updateWishlistCount() {

  const wishBadge = document.querySelector(
    ".fa-heart + span"
  );

  if (wishBadge) {
    wishBadge.innerText = wishlist.length;
  }
}

function addToWishlist(productId) {

  const product = products.find(
    item => item.id === productId
  );

  if (!product) return;

  wishlist.push(product);

  localStorage.setItem(
    "wishlist",
    JSON.stringify(wishlist)
  );

  updateWishlistCount();

  showToast(`${product.name} added to wishlist`);
}

updateWishlistCount();

// ===============================
// WHATSAPP ORDER BUTTONS
// ===============================

const whatsappButtons =
  document.querySelectorAll(".whatsapp-btn");

whatsappButtons.forEach((button) => {

  button.addEventListener("click", (e) => {

    e.preventDefault();

    const card =
      button.closest(".product-card");

    const productName =
      card.querySelector("h3").innerText;

    const price =
      card.querySelector(".price").innerText;

    const message =
`Hello Pehrawa Menswear,

I want to order:

Product: ${productName}
Price: ${price}

Please share further details.`;

    const whatsappNumber =
      "919855707708";

    const whatsappURL =
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    window.open(
      whatsappURL,
      "_blank"
    );
  });

});

// ===============================
// HEADER SHADOW ON SCROLL
// ===============================

window.addEventListener("scroll", () => {

  const header =
    document.querySelector(".header");

  if (window.scrollY > 30) {

    header.style.boxShadow =
      "0 5px 20px rgba(0,0,0,.5)";

  } else {

    header.style.boxShadow =
      "none";
  }
});

// ===============================
// PRODUCT HOVER EFFECT
// ===============================

const cards =
  document.querySelectorAll(".product-card");

cards.forEach((card) => {

  card.addEventListener("mouseenter", () => {

    card.style.transform =
      "translateY(-10px)";
  });

  card.addEventListener("mouseleave", () => {

    card.style.transform =
      "translateY(0)";
  });

});

// ===============================
// TOAST NOTIFICATION
// ===============================

function showToast(message) {

  let toast =
    document.createElement("div");

  toast.className = "toast";

  toast.innerText = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  setTimeout(() => {

    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);

  }, 2500);
}

// ===============================
// REVEAL ANIMATION
// ===============================

const revealElements =
  document.querySelectorAll(
    ".product-card, .feature-box, .step"
  );

function revealOnScroll() {

  revealElements.forEach((element) => {

    const windowHeight =
      window.innerHeight;

    const revealTop =
      element.getBoundingClientRect().top;

    if (revealTop < windowHeight - 100) {

      element.classList.add("revealed");
    }

  });

}

window.addEventListener(
  "scroll",
  revealOnScroll
);

revealOnScroll();

// ===============================
// LOADER
// ===============================

window.addEventListener("load", () => {

  document.body.classList.add("loaded");

});

// ===============================
// YEAR AUTO UPDATE
// ===============================

const copyright =
  document.querySelector(".copyright");

if (copyright) {

  const year =
    new Date().getFullYear();

  copyright.innerHTML =
    `© ${year} Pehrawa Menswear. All Rights Reserved.`;

}

// ===============================
// FUTURE API PLACEHOLDER
// ===============================

// Fetch Products
// Fetch Orders
// User Login
// Admin Login
// Payment Gateway
// MongoDB Integration

console.log(
  "Pehrawa Menswear Loaded Successfully 🚀"
);
/* WhatsApp code temporary disable 
 ==========================
   CUSTOM PRINT WHATSAPP
========================== 

const customPrintForm =
document.getElementById("customPrintForm");

if(customPrintForm){

customPrintForm.addEventListener("submit", function(e){

e.preventDefault();

const name =
document.getElementById("name").value;

const phone =
document.getElementById("phone").value;

const email =
document.getElementById("email").value;

const size =
document.getElementById("size").value;

const quantity =
document.getElementById("quantity").value;

const requirements =
document.getElementById("requirements").value;

const message =

`🎨 CUSTOM PRINT REQUEST

👤 Name: ${name}

📞 Phone: ${phone}

📧 Email: ${email}

👕 Size: ${size}

📦 Quantity: ${quantity}

📝 Requirements:
${requirements}`;

const whatsappNumber =
"919855707708";

const whatsappURL =
`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

window.open(
whatsappURL,
"_blank"
);

});

} */

