(function () {
  var container = document.getElementById("ordersContainer");
  if (!container) return;

  var token = localStorage.getItem("pehrawa_customer_token");
  var userData = localStorage.getItem("pehrawa_customer");

  if (!token || !userData) {
    container.innerHTML = '<div class="shop-state">Please <a href="login.html" style="color:#ff6b00;margin-left:6px;">login</a> to view your orders.</div>';
    return;
  }

  var user = JSON.parse(userData);
  var apiBase = window.PEHRAWA_API_BASE || "http://localhost:5000";

  window.cancelOrder = function(orderId, btn) {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    btn.disabled = true;
    btn.textContent = "Cancelling...";
    fetch(apiBase + "/api/customers/" + user.id + "/orders/" + orderId + "/cancel", {
      method: "PATCH",
      headers: { "Authorization": "Bearer " + token }
    })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.success) {
        if (typeof showToast === "function") showToast("Order cancelled successfully");
        location.reload();
      } else {
        alert(d.message || "Failed to cancel");
        btn.disabled = false;
        btn.textContent = "Cancel Order";
      }
    })
    .catch(function () {
      alert("Server error");
      btn.disabled = false;
      btn.textContent = "Cancel Order";
    });
  };

  fetch(apiBase + "/api/customers/" + user.id + "/orders", {
    headers: { "Authorization": "Bearer " + token }
  })
  .then(function (r) { return r.json(); })
  .then(function (data) {
    if (!data.success) {
      container.innerHTML = '<div class="shop-state">' + (data.message || "Failed to load orders") + "</div>";
      return;
    }
    if (!data.orders || data.orders.length === 0) {
      container.innerHTML = '<div class="shop-state">No orders yet. <a href="shop.html" style="color:#ff6b00;margin-left:6px;">Start shopping</a></div>';
      return;
    }
    var html = '<div style="display:flex;flex-direction:column;gap:16px;">';
    data.orders.forEach(function (o) {
      var statusColor = "#f59e0b";
      var s = (o.status || "").toLowerCase();
      if (s === "processing") statusColor = "#8b5cf6";
      else if (s === "shipped") statusColor = "#3b82f6";
      else if (s === "delivered") statusColor = "#10b981";
      else if (s === "cancelled") statusColor = "#ef4444";
      var canCancel = !["cancelled", "delivered", "shipped"].includes(s);
      var orderId = o.tracking_id || "PHR-" + String(o.id).padStart(6, "0");
      var trackUrl = "track-order.html?order=" + encodeURIComponent(orderId) + "&phone=" + encodeURIComponent(o.phone || user.phone || "");
      html += '<div style="background:#0a0a0a;border:1px solid #181818;border-radius:10px;padding:24px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:12px;">' +
        '<span style="font-size:12px;color:#666;">ORDER #' + orderId + "</span>" +
        '<span style="font-size:11px;padding:4px 12px;border-radius:20px;background:' + statusColor + ";color:#000;font-weight:600;text-transform:uppercase;\">" + (o.status || "Pending") + "</span>" +
        "</div>" +
        '<div style="color:#fff;font-size:15px;font-weight:500;margin-bottom:6px;">' + (o.customer_name || "") + "</div>" +
        '<div style="color:#aaa;font-size:13px;">Total: ₹' + (Number(o.total_amount) || 0).toLocaleString() + "</div>" +
        (o.items ? '<div style="color:#666;font-size:12px;margin-top:6px;">' + o.items.replace(/\n/g, "<br>") + "</div>" : "") +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">' +
        '<div style="color:#555;font-size:11px;">' + new Date(o.created_at).toLocaleDateString() + "</div>" +
        '<div style="display:flex;gap:8px;">' +
        (canCancel ? '<button onclick="cancelOrder(' + o.id + ', this)" style="padding:8px 14px;font-size:12px;font-weight:600;color:#ef4444;border:1px solid #ef4444;border-radius:6px;background:transparent;cursor:pointer;transition:.2s;" onmouseover="this.style.background=\'#ef4444\';this.style.color=\'#fff\';" onmouseout="this.style.background=\'transparent\';this.style.color=\'#ef4444\';">Cancel</button>' : "") +
        '<a href="' + trackUrl + '" style="display:inline-flex;align-items:center;gap:6px;padding:8px 18px;font-size:12px;font-weight:600;color:#ff6b00;border:1px solid #ff6b00;border-radius:6px;text-decoration:none;transition:.2s;" onmouseover="this.style.background=\'#ff6b00\';this.style.color=\'#000\';" onmouseout="this.style.background=\'transparent\';this.style.color=\'#ff6b00\';">Track</a>' +
        "</div>" +
        "</div>" +
        "</div>";
    });
    html += "</div>";
    container.innerHTML = html;
  })
  .catch(function () {
    container.innerHTML = '<div class="shop-state">Server not connected. Please try again later.</div>';
  });
})();
