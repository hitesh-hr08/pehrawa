var wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
var cart = JSON.parse(localStorage.getItem("cart")) || [];
var wishlistContainer = document.getElementById("wishlistItems");

function renderWishlist() {
  if (wishlist.length === 0) {
    wishlistContainer.innerHTML =
      '<div class="empty-wishlist">' +
        '<i class="fa-regular fa-heart" style="font-size:48px;color:#f97316;margin-bottom:16px;"></i>' +
        '<h3 style="color:#fff;font-size:20px;margin:0 0 8px;">Your wishlist is empty</h3>' +
        '<p style="color:#888;margin:0 0 20px;">Save your favorite Pehrawa products here.</p>' +
        '<a href="shop.html" class="shop-now-btn" style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;">Shop Collection</a>' +
      '</div>';
    return;
  }

  wishlistContainer.innerHTML = wishlist.map(function (product, index) {
    var img = product.image || "../images/product1.png";
    return '<div class="wishlist-item" style="display:flex;align-items:center;gap:16px;padding:16px;background:#1a1a1a;border-radius:12px;margin-bottom:12px;border:1px solid #2a2a2a;">' +
      '<img src="' + img + '" alt="' + product.name + '" style="width:60px;height:60px;border-radius:8px;object-fit:cover;">' +
      '<div style="flex:1;min-width:0;">' +
        '<h3 style="color:#fff;font-size:15px;font-weight:600;margin:0 0 4px;">' + product.name + '</h3>' +
        '<p style="color:#f97316;font-size:14px;font-weight:700;margin:0;">₹' + Number(product.price).toFixed(2) + '</p>' +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<button onclick="moveToCart(' + index + ')" style="padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border:none;">Move to Cart</button>' +
        '<button onclick="removeWishlist(' + index + ')" style="padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;background:transparent;color:#e74c3c;border:1px solid #e74c3c;">Remove</button>' +
      '</div>' +
    '</div>';
  }).join("");
}

function moveToCart(index) {
  cart.push(wishlist[index]);
  localStorage.setItem("cart", JSON.stringify(cart));
  wishlist.splice(index, 1);
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  renderWishlist();
}

function removeWishlist(index) {
  wishlist.splice(index, 1);
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  renderWishlist();
}

renderWishlist();
