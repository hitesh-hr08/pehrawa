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
      if ((o.status || "").toLowerCase() === "shipped") statusColor = "#8b5cf6";
      else if ((o.status || "").toLowerCase() === "delivered") statusColor = "#10b981";
      else if ((o.status || "").toLowerCase() === "cancelled") statusColor = "#ef4444";
      html += '<div style="background:#0a0a0a;border:1px solid #181818;border-radius:10px;padding:24px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:12px;">' +
        '<span style="font-size:12px;color:#666;">ORDER #' + (o.tracking_id || "PHR-" + String(o.id).padStart(6, "0")) + "</span>" +
        '<span style="font-size:11px;padding:4px 12px;border-radius:20px;background:' + statusColor + ";color:#000;font-weight:600;text-transform:uppercase;\">" + (o.status || "Pending") + "</span>" +
        "</div>" +
        '<div style="color:#fff;font-size:15px;font-weight:500;margin-bottom:6px;">' + (o.customer_name || "") + "</div>" +
        '<div style="color:#aaa;font-size:13px;">Total: ₹' + (Number(o.total_amount) || 0).toLocaleString() + "</div>" +
        (o.items ? '<div style="color:#666;font-size:12px;margin-top:6px;">' + o.items.replace(/\n/g, "<br>") + "</div>" : "") +
        '<div style="color:#555;font-size:11px;margin-top:8px;">' + new Date(o.created_at).toLocaleDateString() + "</div>" +
        "</div>";
    });
    html += "</div>";
    container.innerHTML = html;
  })
  .catch(function () {
    container.innerHTML = '<div class="shop-state">Server not connected. Please try again later.</div>';
  });
})();
