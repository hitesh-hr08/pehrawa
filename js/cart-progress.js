(function () {
  var FREE_SHIPPING_THRESHOLD = 999;
  var FREE_GIFT_THRESHOLD = 1999;
  var SHIPPING_COST = 99;

  function init() {
    var container = document.getElementById("cartProgressSection");
    if (!container) return;
    updateProgress();
    window.addEventListener("cart-updated", updateProgress);
  }

  function getCartTotal() {
    try {
      var cart = JSON.parse(localStorage.getItem("cart")) || [];
      return cart.reduce(function (sum, item) {
        return sum + (Number(item.price) || 0) * (Number(item.quantity) || 1);
      }, 0);
    } catch (e) { return 0; }
  }

  function updateProgress() {
    var container = document.getElementById("cartProgressSection");
    if (!container) return;
    var total = getCartTotal();
    var html = "";

    // Milestones config
    var milestones = [
      { threshold: FREE_SHIPPING_THRESHOLD, icon: "fa-truck", label: "Free Shipping", unlocked: total >= FREE_SHIPPING_THRESHOLD },
      { threshold: FREE_GIFT_THRESHOLD, icon: "fa-gift", label: "Free Gift", unlocked: total >= FREE_GIFT_THRESHOLD }
    ];

    // Overall progress percentage (based on highest milestone)
    var maxThreshold = FREE_GIFT_THRESHOLD;
    var progressPct = Math.min(100, (total / maxThreshold) * 100);

    // Progress bar
    html += '<div class="cpb-bar-wrap">';
    html += '<div class="cpb-bar"><div class="cpb-bar-fill" style="width:' + progressPct + '%"></div>';

    // Milestone markers on the bar
    milestones.forEach(function (m) {
      var pos = (m.threshold / maxThreshold) * 100;
      html += '<div class="cpb-marker' + (m.unlocked ? ' cpb-unlocked' : '') + '" style="left:' + pos + '%">' +
        '<div class="cpb-marker-dot"><i class="fa-solid ' + m.icon + '"></i></div>' +
        '</div>';
    });
    html += '</div></div>';

    // Milestone labels
    html += '<div class="cpb-milestones">';
    milestones.forEach(function (m) {
      var remaining = Math.max(0, m.threshold - total);
      html += '<div class="cpb-milestone' + (m.unlocked ? ' cpb-unlocked' : '') + '">';
      html += '<i class="fa-solid ' + (m.unlocked ? 'fa-circle-check' : m.icon) + '"></i>';
      if (m.unlocked) {
        html += '<span>' + m.label + ' unlocked!</span>';
      } else {
        html += '<span>Add ₹' + remaining + ' for ' + m.label + '</span>';
      }
      html += '</div>';
    });
    html += '</div>';

    // Status message
    if (total >= FREE_GIFT_THRESHOLD) {
      html += '<div class="cpb-status cpb-all"><i class="fa-solid fa-party-horn"></i> You\'ve unlocked FREE SHIPPING + FREE GIFT!</div>';
    } else if (total >= FREE_SHIPPING_THRESHOLD) {
      var needed = FREE_GIFT_THRESHOLD - total;
      html += '<div class="cpb-status cpb-shipping"><i class="fa-solid fa-truck"></i> Free shipping unlocked! Add ₹' + needed + ' more for a free gift.</div>';
    } else {
      var shipNeeded = FREE_SHIPPING_THRESHOLD - total;
      html += '<div class="cpb-status cpb-encourage"><i class="fa-solid fa-truck"></i> Add ₹' + shipNeeded + ' more for free shipping!</div>';
    }

    container.innerHTML = html;
  }

  // Patch: trigger cart-updated after renderCart
  var origRenderCart = window.renderCart;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(init, 300);
      // Hook into cart changes
      var origRemove = window.removeItem;
      var origUpdateQty = window.updateQuantity;
      if (typeof origRemove === "function") {
        window.removeItem = function (i) { origRemove(i); window.dispatchEvent(new Event("cart-updated")); };
      }
      if (typeof origUpdateQty === "function") {
        window.updateQuantity = function (i, c) { origUpdateQty(i, c); window.dispatchEvent(new Event("cart-updated")); };
      }
    });
  } else {
    setTimeout(init, 300);
    var origRemove = window.removeItem;
    var origUpdateQty = window.updateQuantity;
    if (typeof origRemove === "function") {
      window.removeItem = function (i) { origRemove(i); window.dispatchEvent(new Event("cart-updated")); };
    }
    if (typeof origUpdateQty === "function") {
      window.updateQuantity = function (i, c) { origUpdateQty(i, c); window.dispatchEvent(new Event("cart-updated")); };
    }
  }
})();
