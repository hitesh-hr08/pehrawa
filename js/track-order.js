(function () {
  var API_URL = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/public/orders";
  var form = document.getElementById("trackOrderForm");
  var resultDiv = document.getElementById("trackResult");
  if (!resultDiv) {
    resultDiv = document.createElement("div");
    resultDiv.id = "trackResult";
    resultDiv.className = "track-result";
    var trackBox = document.querySelector(".track-box");
    if (trackBox) trackBox.appendChild(resultDiv);
  }

  function track(orderId, phone) {
    resultDiv.innerHTML = '<div class="track-loading">Looking up your order...</div>';
    var numericId = (orderId || "").replace(/^PHR-?/i, "");

    fetch(API_URL + "/" + encodeURIComponent(numericId) + "?phone=" + encodeURIComponent(phone))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.success || !data.order) {
          resultDiv.innerHTML = '<div class="track-error">Order not found. Please check your Order ID and Phone Number.</div>';
          return;
        }
        var order = data.order;
        var statusClass = (order.status || "").toLowerCase().replace(/\s+/g, "-");
        var itemsHtml = (order.items || "").split("\n").map(function (line) {
          return line.trim() ? "<li>" + line + "</li>" : "";
        }).join("");
        resultDiv.innerHTML =
          '<div class="track-card status-' + statusClass + '">' +
            '<div class="track-status-bar">' +
              '<span class="track-status-badge">' + (order.status || "Pending") + '</span>' +
            '</div>' +
            '<div class="track-details">' +
              '<p><strong>Tracking ID:</strong> ' + (order.tracking_id || "PHR-" + String(order.id).padStart(6, "0")) + '</p>' +
              '<p><strong>Customer:</strong> ' + (order.customer_name || "N/A") + '</p>' +
              '<p><strong>Phone:</strong> ' + (order.phone || "N/A") + '</p>' +
              '<p><strong>Address:</strong> ' + (order.address || "N/A") + '</p>' +
              '<p><strong>Total:</strong> &#8377;' + Number(order.total_amount || 0).toFixed(2) + '</p>' +
              '<p><strong>Ordered on:</strong> ' + new Date(order.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) + '</p>' +
              (itemsHtml ? '<div class="track-items"><strong>Items:</strong><ul>' + itemsHtml + '</ul></div>' : "") +
            '</div>' +
            '<div class="track-timeline">' +
              '<div class="tl-step completed"><span>Placed</span></div>' +
              '<div class="tl-step' + (["verifying-payment", "processing", "shipped", "delivered"].includes(statusClass) ? " completed" : "") + '"><span>Verify Payment</span></div>' +
              '<div class="tl-step' + (["processing", "shipped", "delivered"].includes(statusClass) ? " completed" : "") + '"><span>Processing</span></div>' +
              '<div class="tl-step' + (["shipped", "delivered"].includes(statusClass) ? " completed" : "") + '"><span>Shipped</span></div>' +
              '<div class="tl-step' + (statusClass === "delivered" ? " completed" : "") + '"><span>Delivered</span></div>' +
            '</div>' +
            '<p class="track-help">Need help? <a href="https://wa.me/919855707708" target="_blank">Chat on WhatsApp</a></p>' +
          '</div>';
      })
      .catch(function () {
        resultDiv.innerHTML = '<div class="track-error">Server connection error. Please try again later.</div>';
      });
  }

  // Auto-track from query params (?order=xxx&phone=yyy)
  var params = new URLSearchParams(window.location.search);
  var qOrder = params.get("order");
  var qPhone = params.get("phone");
  if (qOrder && qPhone) {
    var oi = document.getElementById("orderId");
    var pi = document.getElementById("customerPhone");
    if (oi) oi.value = qOrder;
    if (pi) pi.value = qPhone;
    track(qOrder, qPhone);
  }

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var orderId = document.getElementById("orderId").value.trim();
    var phone = document.getElementById("customerPhone").value.trim();
    if (!orderId || !phone) {
      resultDiv.innerHTML = '<div class="track-error">Please enter both Order ID and Phone Number</div>';
      return;
    }
    track(orderId, phone);
  });
})();
