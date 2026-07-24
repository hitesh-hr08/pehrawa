(function () {
  var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/user/wishlist";

  function getToken() {
    return window.getCustomerToken ? window.getCustomerToken() : "";
  }

  function isLoggedIn() {
    return !!getToken();
  }

  window.PehrawaWishlist = {
    toggle: function (productId, productName, productPrice, productImage, callback) {
      var self = this;
      if (isLoggedIn()) {
        this.toggleServer(productId, callback);
      } else {
        this.toggleLocal(productId, productName, productPrice, productImage, callback);
      }
    },
    toggleServer: function (productId, callback) {
      var self = this;
      fetch(api + "/check/" + productId, {
        headers: { "Authorization": "Bearer " + getToken() }
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.inWishlist) {
            fetch(api + "/" + productId, {
              method: "DELETE",
              headers: { "Authorization": "Bearer " + getToken() }
            }).then(function (r) { return r.json(); }).then(function (d) {
              if (d.success) {
                updateWishlistIcons(productId, false);
                if (typeof showToast === "function") showToast("Removed from wishlist");
                if (callback) callback(false);
              } else { if (callback) callback(null); }
            }).catch(function () { if (callback) callback(null); });
          } else {
            fetch(api, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": "Bearer " + getToken() },
              body: JSON.stringify({ product_id: productId })
            }).then(function (r) { return r.json(); }).then(function (d) {
              if (d.success) {
                updateWishlistIcons(productId, true);
                if (typeof showToast === "function") showToast("Added to wishlist");
                if (callback) callback(true);
              } else { if (typeof showToast === "function") showToast(d.message || "Failed"); if (callback) callback(null); }
            }).catch(function () { if (callback) callback(null); });
          }
        }).catch(function () { if (callback) callback(null); });
    },
    toggleLocal: function (productId, name, price, image, callback) {
      var items = JSON.parse(localStorage.getItem("wishlist")) || [];
      var idx = items.findIndex(function (i) { return i.id == productId; });
      if (idx > -1) {
        items.splice(idx, 1);
        updateWishlistIcons(productId, false);
        if (typeof showToast === "function") showToast("Removed from wishlist");
        if (callback) callback(false);
      } else {
        items.push({ id: productId, name: name || "Product", price: Number(price) || 0, image: image || "../images/product1.png" });
        updateWishlistIcons(productId, true);
        if (typeof showToast === "function") showToast("Added to wishlist");
        if (callback) callback(true);
      }
      localStorage.setItem("wishlist", JSON.stringify(items));
      updateWishlistCount();
    },
    check: function (productId, callback) {
      if (isLoggedIn()) {
        fetch(api + "/check/" + productId, {
          headers: { "Authorization": "Bearer " + getToken() }
        })
          .then(function (r) { return r.json(); })
          .then(function (data) { if (callback) callback(data.inWishlist); });
      } else {
        var items = JSON.parse(localStorage.getItem("wishlist")) || [];
        if (callback) callback(items.some(function (i) { return i.id == productId; }));
      }
    },
    renderWishlistPage: function () {
      var container = document.getElementById("wishlistGrid") || document.getElementById("wishlistItems") || document.getElementById("wishlistContainer");
      if (!container) return false;

      if (!isLoggedIn()) {
        var localItems = JSON.parse(localStorage.getItem("wishlist")) || [];
        if (localItems.length === 0) {
          container.innerHTML = '<div style="text-align:center;padding:60px 20px;"><i class="fa-regular fa-heart" style="font-size:48px;color:#333;margin-bottom:16px;display:block;"></i><h3 style="color:#666;">Your wishlist is empty</h3><p style="color:#999;">Browse our collection and save items you love</p><a href="/shop" style="display:inline-block;margin-top:16px;padding:12px 32px;background:#ff6b00;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Shop Now</a></div>';
        } else {
          var html = '<div class="rv-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;">';
          localItems.forEach(function (item) {
            var price = Number(item.price) || 0;
            var orig = Math.round(price * 1.5);
            var disc = orig > price ? Math.round((1 - price / orig) * 100) : 0;
            html += '<div class="product-card revealed" style="position:relative;">' +
              '<div class="product-image">' +
              (disc > 0 ? '<span class="product-badge">-' + disc + '%</span>' : '') +
              '<a href="/product?id=' + item.id + '"><img src="' + (item.image || "../images/product1.png") + '" alt="' + item.name + '"></a>' +
              '</div><div class="product-content">' +
              '<h3>' + item.name + '</h3>' +
              '<div class="price">&#8377;' + price.toFixed(0) +
              (disc > 0 ? '<span class="orig">&#8377;' + orig + '</span>' : '') + '</div>' +
              '<div style="display:flex;gap:8px;margin-top:8px;">' +
              '<button class="add-cart-btn" onclick="addLocalWishItemToCart(' + item.id + ')" style="flex:1;padding:8px;background:#ff6b00;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;"><i class="fa-solid fa-cart-plus"></i> Add to Cart</button>' +
              '<button onclick="PehrawaWishlist.toggle(' + item.id + ',\'' + item.name.replace(/'/g, "\\'") + '\',' + price + ',\'' + (item.image || "").replace(/'/g, "\\'") + '\'); PehrawaWishlist.renderWishlistPage();" style="padding:8px 12px;background:none;border:1px solid #333;color:#e74c3c;border-radius:4px;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>' +
              '</div></div></div>';
          });
          html += '</div>';
          container.innerHTML = html;
        }
        return true;
      }

      container.innerHTML = '<div style="text-align:center;padding:40px;color:#888;"><i class="fa-solid fa-spinner fa-spin"></i></div>';
      fetch(api, { headers: { "Authorization": "Bearer " + getToken() } })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success && data.wishlist && data.wishlist.length > 0) {
            var html = '<div class="rv-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;">';
            data.wishlist.forEach(function (item) {
              var orig = item.original_price ? Number(item.original_price) : Math.round((Number(item.price) || 0) * 1.5);
              var disc = orig > Number(item.price) ? Math.round((1 - Number(item.price) / orig) * 100) : 0;
              html += '<div class="product-card revealed" style="position:relative;">' +
                '<div class="product-image">' +
                (disc > 0 ? '<span class="product-badge">-' + disc + '%</span>' : '') +
                '<a href="/product?id=' + item.product_id + '"><img src="' + (item.image_url || "../images/product1.png") + '" alt="' + item.name + '"></a>' +
                '</div><div class="product-content">' +
                '<h3>' + item.name + '</h3>' +
                '<div class="price">&#8377;' + (Number(item.price) || 0).toFixed(0) +
                (disc > 0 ? '<span class="orig">&#8377;' + orig + '</span>' : '') + '</div>' +
                '<div style="display:flex;gap:8px;margin-top:8px;">' +
                '<button class="add-cart-btn" onclick="addWishItemToCart(' + item.product_id + ')" style="flex:1;padding:8px;background:#ff6b00;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;"><i class="fa-solid fa-cart-plus"></i> Add to Cart</button>' +
                '<button onclick="PehrawaWishlist.toggle(' + item.product_id + ')" style="padding:8px 12px;background:none;border:1px solid #333;color:#e74c3c;border-radius:4px;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>' +
                '</div></div></div>';
            });
            html += '</div>';
            container.innerHTML = html;
          } else {
            container.innerHTML = '<div style="text-align:center;padding:60px 20px;"><i class="fa-regular fa-heart" style="font-size:48px;color:#333;margin-bottom:16px;display:block;"></i><h3 style="color:#666;">Your wishlist is empty</h3><p style="color:#999;">Browse our collection and save items you love</p><a href="/shop" style="display:inline-block;margin-top:16px;padding:12px 32px;background:#ff6b00;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Shop Now</a></div>';
          }
        });
      return true;
    },
    loadServerWishlist: function () {
      if (!isLoggedIn()) return;
      fetch(api, { headers: { "Authorization": "Bearer " + getToken() } })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success && data.wishlist) {
            data.wishlist.forEach(function (item) {
              updateWishlistIcons(item.product_id, true);
            });
          }
        });
    }
  };

  function updateWishlistIcons(productId, inWishlist) {
    var hearts = document.querySelectorAll('[data-wishlist-id="' + productId + '"]');
    hearts.forEach(function (el) {
      if (inWishlist) {
        el.classList.add("fa-solid");
        el.classList.remove("fa-regular");
        el.style.color = "#e74c3c";
      } else {
        el.classList.remove("fa-solid");
        el.classList.add("fa-regular");
        el.style.color = "";
      }
    });
  }

  function updateWishlistCount() {
    var badge = document.querySelector(".fa-heart") && document.querySelector(".fa-heart").parentElement.querySelector("span");
    if (badge) {
      var items = JSON.parse(localStorage.getItem("wishlist")) || [];
      badge.textContent = items.length;
    }
  }

  window.addWishItemToCart = function (productId) {
    var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/public/products/" + productId;
    fetch(api).then(function (r) { return r.json(); }).then(function (data) {
      if (data.success && data.product) {
        var p = data.product;
        var cart = JSON.parse(localStorage.getItem("cart")) || [];
        cart.push({ id: p.id, name: p.name, price: Number(p.price), image: p.image_url || "../images/product1.png", size: "M", quantity: 1 });
        localStorage.setItem("cart", JSON.stringify(cart));
        if (typeof showToast === "function") showToast(p.name + " added to cart");
      }
    });
  };

  window.addLocalWishItemToCart = function (productId) {
    var items = JSON.parse(localStorage.getItem("wishlist")) || [];
    var item = items.find(function (i) { return i.id == productId; });
    if (!item) {
      window.addWishItemToCart(productId);
      return;
    }
    var cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.push({ id: item.id, name: item.name, price: Number(item.price) || 0, image: item.image || "../images/product1.png", size: "M", quantity: 1 });
    localStorage.setItem("cart", JSON.stringify(cart));
    if (typeof showToast === "function") showToast(item.name + " added to cart");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(function () { PehrawaWishlist.loadServerWishlist(); }, 500);
    });
  } else {
    setTimeout(function () { PehrawaWishlist.loadServerWishlist(); }, 500);
  }
})();
