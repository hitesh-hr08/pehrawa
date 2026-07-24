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
const navbar = document.querySelector(".navbar") || document.querySelector(".mobile-menu");
const mobileOverlay = document.getElementById("mobileOverlay");
const mobileClose = document.getElementById("mobileClose");

function openMobileMenu() {
  if (navbar) navbar.classList.add("open");
  if (mobileOverlay) mobileOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeMobileMenu() {
  if (navbar) navbar.classList.remove("open");
  if (mobileOverlay) mobileOverlay.classList.remove("open");
  document.body.style.overflow = "";
}

if (menuBtn) {
  menuBtn.addEventListener("click", openMobileMenu);
}
if (mobileClose) {
  mobileClose.addEventListener("click", closeMobileMenu);
}
if (mobileOverlay) {
  mobileOverlay.addEventListener("click", closeMobileMenu);
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
  if (typeof showToast === "function") showToast(product.name + " added to cart");
}

updateCartCount();

// ===============================
// WISHLIST SYSTEM
// ===============================

let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

function updateWishlistCount(count) {
  const wishBadge = document.querySelector(".fa-heart") && document.querySelector(".fa-heart").parentElement.querySelector("span");
  if (wishBadge) {
    if (typeof count === "number") {
      wishBadge.innerText = count;
    } else {
      wishBadge.innerText = wishlist.length;
    }
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
  if (typeof showToast === "function") showToast(product.name + " added to wishlist");
}

updateWishlistCount();

function syncBadgeCounts() {
  var token = window.getCustomerToken ? window.getCustomerToken() : "";
  if (token) {
    var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/user/wishlist";
    fetch(api, { headers: { "Authorization": "Bearer " + token } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success && typeof data.wishlist.length === "number") {
          updateWishlistCount(data.wishlist.length);
        }
      }).catch(function () {});
  }
  updateCartCount();
}

setTimeout(syncBadgeCounts, 300);

function findProductInDOM(productId) {
  var card = document.querySelector('.product-card .buy-now-btn[data-id="' + productId + '"]');
  if (card) {
    card = card.closest(".product-card");
  } else {
    var cards = document.querySelectorAll(".product-card");
    for (var i = 0; i < cards.length; i++) {
      var btn = cards[i].querySelector('.buy-now-btn[data-id="' + productId + '"]');
      if (btn) { card = cards[i]; break; }
    }
    if (!card) return null;
  }
  if (!card) return null;
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
      card.querySelector("h3")?.innerText || "Product";

    const price =
      card.querySelector(".price")?.innerText || "₹0";

    const message =
`Hello Pehrawa,

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

var header = document.querySelector("header");
window.addEventListener("scroll", function () {
  if (!header) return;
  header.style.boxShadow = window.scrollY > 30 ? "0 5px 20px rgba(0,0,0,.5)" : "none";
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
    `© ${year} Pehrawa. All Rights Reserved.`;

}

// ===============================
// FUTURE API PLACEHOLDER
// ===============================

// Fetch Products
// Fetch Orders
// User Login
// Admin Login
// MongoDB Integration

console.log(
  "Pehrawa Loaded Successfully 🚀"
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

    const price = Number(document.getElementById("checkoutPrice").value);
    const qty = Number(document.getElementById("checkoutQty").value) || 1;
    const total = price * qty;

    if (total < 1) {
      showToast("Invalid amount");
      btn.disabled = false;
      btn.textContent = "Place Order";
      return;
    }

    var cust = window.getCustomer ? window.getCustomer() : null;
    var name = document.getElementById("checkoutName").value.trim();
    var phone = document.getElementById("checkoutPhone").value.trim();
    var address = document.getElementById("checkoutAddress").value.trim();
    var pincode = document.getElementById("checkoutPincode").value.trim();
    var city = document.getElementById("checkoutCity").value.trim();
    var district = document.getElementById("checkoutDistrict").value.trim();
    var state = document.getElementById("checkoutState").value.trim();

    if (!name || !phone || !address || !pincode) {
      showToast("Please fill all required fields");
      btn.disabled = false;
      btn.textContent = "Place Order";
      return;
    }

    var fullAddress = address + (district ? ", " + district : "") + ", " + city + ", " + state + " - " + pincode;
    var api = window.PEHRAWA_API_BASE || "http://localhost:5000";
    var productName = (document.querySelector("#checkoutProduct span")?.textContent?.split(" - ")[0]) || "Product";
    var size = document.getElementById("checkoutSize").value;

    // Step 1: Create Razorpay order
    var rzpRes;
    try {
      rzpRes = await fetch(api + "/api/public/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total })
      });
    } catch (e) {
      showToast("Payment service unavailable");
      btn.disabled = false;
      btn.textContent = "Place Order";
      return;
    }
    var rzpData = await rzpRes.json();
    if (!rzpData.success) {
      showToast(rzpData.message || "Payment initiation failed");
      btn.disabled = false;
      btn.textContent = "Place Order";
      return;
    }

    // Step 2: Open Razorpay checkout
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
            showToast("✅ Payment successful! Order placed.");
            checkoutOverlay.classList.remove("active");
            checkoutForm.reset();
            setTimeout(function () { window.location.href = "/my-orders"; }, 1500);
          } else {
            showToast(data.message || "Failed to place order");
          }
        } catch (err) {
          showToast("Error placing order");
        }
        btn.disabled = false;
        btn.textContent = "Place Order";
      },
      modal: {
        ondismiss: function () {
          showToast("Payment cancelled");
          btn.disabled = false;
          btn.textContent = "Place Order";
        }
      }
    };
    var rzp;
    if (typeof Razorpay !== "undefined") {
      rzp = new Razorpay(options);
      rzp.open();
    } else {
      showToast("Payment system loading. Please try again.");
      btn.disabled = false;
      btn.textContent = "Place Order";
    }
  });
}

// ===============================
// BUY NOW BUTTONS (dynamic)
// ===============================

document.addEventListener("click", function (e) {
  var buyBtn = e.target.closest(".buy-now-btn");
  if (!buyBtn) return;
  e.preventDefault();

  var doBuy = function (loggedIn) {
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
  };

  if (typeof window.requireAuth === "function") {
    window.requireAuth(doBuy);
  } else {
    doBuy(true);
  }
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

// reset mobile menu on page show (fix black screen on back navigation)
window.addEventListener('pageshow', function(){
  var menu = document.getElementById('mobileMenu');
  var overlay = document.getElementById('mobileOverlay');
  if(menu) menu.classList.remove('open');
  if(overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
  var loader = document.getElementById('premiumLoader');
  if(loader) { loader.classList.add('pl-hide'); loader.remove(); }
});

