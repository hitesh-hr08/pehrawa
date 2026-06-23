/* ===================================
   PEHRAWA MENSWEAR
   script.js
=================================== */

// ===============================
// PINCODE AUTO-FETCH (city+state)
// ===============================
window.fetchPincode = function (pincode, prefix) {
  var districtEl = document.getElementById(prefix + "District");
  var stateEl = document.getElementById(prefix + "State");
  if (!districtEl || !stateEl) return;
  if (pincode.length !== 6 || isNaN(pincode)) {
    districtEl.value = ""; stateEl.value = "";
    return;
  }
  var url = "https://api.postalpincode.in/pincode/" + encodeURIComponent(pincode);
  fetch(url)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
        var po = data[0].PostOffice[0];
        districtEl.value = po.District || po.Division || po.Block || "";
        stateEl.value = po.State || "";
      }
    })
    .catch(function () {});
};

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
// CART SYSTEM
// ===============================

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function updateCartCount() {
  const cartBadge = document.querySelector(".fa-cart-shopping + span");
  if (cartBadge) {
    cartBadge.innerText = cart.length;
  }
}

function addToCart(productId) {
  var product = findProductInDOM(productId);
  if (!product) return;

  cart.push({
    id: productId,
    name: product.name,
    price: product.price,
    image: product.image || "../images/product1.png"
  });

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  showToast(product.name + " added to cart");
}

updateCartCount();

// ===============================
// WISHLIST SYSTEM
// ===============================

let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

function updateWishlistCount() {
  const wishBadge = document.querySelector(".fa-heart + span");
  if (wishBadge) {
    wishBadge.innerText = wishlist.length;
  }
}

function addToWishlist(productId) {
  var product = findProductInDOM(productId);
  if (!product) return;

  wishlist.push({
    id: productId,
    name: product.name,
    price: product.price,
    image: product.image || "../images/product1.png"
  });

  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  updateWishlistCount();
  showToast(product.name + " added to wishlist");
}

updateWishlistCount();

function findProductInDOM(productId) {
  var cards = document.querySelectorAll(".product-card");
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    var h3 = card.querySelector("h3");
    var priceEl = card.querySelector(".price");
    var img = card.querySelector(".product-image img");
    if (h3 && priceEl) {
      var name = h3.innerText || h3.textContent;
      var priceText = (priceEl.innerText || priceEl.textContent).replace(/[^0-9.]/g, "");
      return {
        name: name.trim(),
        price: parseFloat(priceText) || 0,
        image: img ? img.src : "../images/product1.png"
      };
    }
  }
  return null;
}

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

// ===============================
// CHECKOUT MODAL
// ===============================

var checkoutOverlay = document.getElementById("checkoutOverlay");
var checkoutClose = document.getElementById("checkoutClose");
var checkoutForm = document.getElementById("checkoutForm");

function openCheckout(productId, productName, price, image) {
  var overlay = document.getElementById("checkoutOverlay");
  if (!overlay) return;
  var pid = document.getElementById("checkoutProductId");
  var pprice = document.getElementById("checkoutPrice");
  var pname = document.getElementById("checkoutProduct");
  if (pid) pid.value = productId;
  if (pprice) pprice.value = price;
  if (pname) {
    pname.innerHTML = image
      ? '<img src="' + image + '" style="width:50px;height:50px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:10px;"><span>' + productName + ' - &#8377;' + Number(price).toFixed(2) + '</span>'
      : '<span>' + productName + ' - &#8377;' + Number(price).toFixed(2) + '</span>';
  }
  overlay.classList.add("active");
}

if (checkoutClose && checkoutOverlay) {
  checkoutClose.addEventListener("click", function () {
    checkoutOverlay.classList.remove("active");
  });
}

if (checkoutOverlay) {
  checkoutOverlay.addEventListener("click", function (e) {
    if (e.target === checkoutOverlay) {
      checkoutOverlay.classList.remove("active");
    }
  });
}

if (checkoutForm) {
  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = checkoutForm.querySelector(".checkout-submit");
    btn.disabled = true;
    btn.textContent = "Processing...";

    const productId = document.getElementById("checkoutProductId").value;
    const productNameEl = document.querySelector("#checkoutProduct span");
    const price = document.getElementById("checkoutPrice").value;

    var cust = window.getCustomer ? window.getCustomer() : null;
    var name = document.getElementById("checkoutName").value;
    var phone = document.getElementById("checkoutPhone").value;
    var address = document.getElementById("checkoutAddress").value + ", " + (document.getElementById("checkoutCity").value || "") + ", " + (document.getElementById("checkoutDistrict").value || "") + ", " + (document.getElementById("checkoutState").value || "") + ", Pincode: " + document.getElementById("checkoutPincode").value;

    var api = window.PEHRAWA_API_BASE || "http://localhost:5000";

    try {
      var payload = {
        customer_name: name,
        phone: phone,
        address: address,
        total_amount: Number(price),
        customer_id: cust ? cust.id : (localStorage.getItem("customerId") || null),
        items: [{
          name: productNameEl ? productNameEl.textContent.split(" - ")[0] : "Product",
          size: document.getElementById("checkoutSize").value,
          quantity: Number(document.getElementById("checkoutQty").value),
          price: Number(price)
        }]
      };

      const res = await fetch(api + "/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast("Order " + (data.order.tracking_id || "#" + data.order.id) + " placed! Track it in My Orders.");
        checkoutOverlay.classList.remove("active");
        checkoutForm.reset();
      } else {
        showToast(data.message || "Failed to place order");
      }
    } catch (err) {
      showToast("Error placing order. Try again.");
    }
    btn.disabled = false;
    btn.textContent = "Place Order";
  });
}

// ===============================
// BUY NOW BUTTONS (dynamic)
// ===============================

document.addEventListener("click", function (e) {
  var buyBtn = e.target.closest(".buy-now-btn");
  if (!buyBtn) return;
  e.preventDefault();

  window.requireAuth(function (loggedIn) {
    if (!loggedIn) return;
    var card = buyBtn.closest(".product-card");
    if (!card) return;

    var id = buyBtn.getAttribute("data-id");
    var name = buyBtn.getAttribute("data-name");
    var price = buyBtn.getAttribute("data-price");
    var img = buyBtn.getAttribute("data-image");

    if (!name) {
      name = card.querySelector("h3") ? card.querySelector("h3").innerText : "Product";
    }
    if (!price) {
      var priceText = card.querySelector(".price") ? card.querySelector(".price").innerText.replace(/[^0-9.]/g, "") : "0";
      price = parseFloat(priceText) || 0;
    }
    if (!img) {
      img = card.querySelector(".product-image img") ? card.querySelector(".product-image img").src : "../images/product1.png";
    }
    openCheckout(id || 0, name, price, img);
  });
});
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

// Announcement bar seamless marquee
(function(){
    var bar = document.querySelector('.announcement-bar p');
    if(!bar) return;
    var text = bar.textContent || bar.innerText;
    if(!text) return;
    var wrap = document.createElement('div');
    wrap.className = 'marquee-wrap';
    wrap.innerHTML = '<span>' + text + '</span><span>' + text + '</span>';
    bar.parentNode.replaceChild(wrap, bar);
})();

// ===============================
// MOBILE MENU TOGGLE
// ===============================
(function(){
  var menuBtn = document.querySelector('.menu-btn');
  var menu = document.getElementById('mobileMenu');
  var overlay = document.getElementById('mobileOverlay');
  var closeBtn = document.getElementById('mobileClose');
  if(!menuBtn || !menu || !overlay || !closeBtn) return;
  function openMenu(){
    menu.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu(){
    menu.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  menuBtn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);
})();

// reset mobile menu on page show (fix black screen on back navigation)
window.addEventListener('pageshow', function(){
  var menu = document.getElementById('mobileMenu');
  var overlay = document.getElementById('mobileOverlay');
  if(menu) menu.classList.remove('open');
  if(overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
});

