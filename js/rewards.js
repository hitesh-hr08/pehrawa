(function () {
  var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/public/rewards";

  function getToken() {
    return window.getCustomerToken ? window.getCustomerToken() : "";
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function init() {
    if (!isLoggedIn()) return;
    loadRewardsInfo();
  }

  function loadRewardsInfo() {
    fetch(api + "/points", {
      headers: { "Authorization": "Bearer " + getToken() }
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success) renderRewardsWidget(data);
      })
      .catch(function () {});
  }

  function renderRewardsWidget(data) {
    var widget = document.getElementById("rewardsWidget");
    if (!widget) return;

    var tier = data.tier || "bronze";
    var benefits = data.tierBenefits || { color: "#cd7f32", name: "Bronze" };
    var color = benefits.color || "#cd7f32";
    var progress = data.progress || { next: "Silver", progress: 0, needed: 0 };

    var html = '<div class="rw-card">' +
      '<div class="rw-header"><div class="rw-tier-badge" style="background:' + color + '">' + benefits.name + '</div>' +
      '<div class="rw-points-display"><span class="rw-points-num">' + (data.redeemable_points || data.points || 0) + '</span><span class="rw-points-label">REDEEMABLE POINTS</span></div></div>' +
      '<div class="rw-progress-wrap"><div class="rw-progress-bar"><div class="rw-progress-fill" style="width:' + (progress.progress || 0) + '%;background:' + color + '"></div></div>' +
      (progress.next ? '<div class="rw-progress-label">' + (progress.needed || 0) + ' points to ' + progress.next + '</div>' : '<div class="rw-progress-label">Max tier reached!</div>') +
      '</div>';

    if (benefits.freeShipping || benefits.earlyAccess || benefits.discount > 0) {
      html += '<div class="rw-benefits">';
      if (benefits.freeShipping) html += '<span class="rw-benefit"><i class="fa-solid fa-truck"></i> Free Shipping</span>';
      if (benefits.earlyAccess) html += '<span class="rw-benefit"><i class="fa-solid fa-clock"></i> Early Access</span>';
      if (benefits.discount > 0) html += '<span class="rw-benefit"><i class="fa-solid fa-percent"></i> ' + benefits.discount + '% Extra Off</span>';
      html += '<span class="rw-benefit"><i class="fa-solid fa-star"></i> ' + (benefits.pointsMultiplier || 1) + 'x Points</span>';
      html += '</div>';
    }

    html += '<div class="rw-actions"><button class="rw-redeem-btn" onclick="PehrawaRewards.showRedeemModal()">Redeem Points</button>' +
      '<a href="/passport" class="rw-dashboard-link">View Full Dashboard</a></div>';

    if (data.history && data.history.length > 0) {
      html += '<div class="rw-history"><h4>Recent Activity</h4>';
      data.history.slice(0, 5).forEach(function (h) {
        var date = new Date(h.created_at).toLocaleDateString();
        html += '<div class="rw-history-item"><span class="rw-h-desc">' + (h.description || h.type) + '</span>' +
          '<span class="rw-h-pts ' + (h.points > 0 ? "positive" : "negative") + '">' + (h.points > 0 ? "+" : "") + h.points + '</span>' +
          '<span class="rw-h-date">' + date + '</span></div>';
      });
      html += '</div>';
    }

    html += '</div>';
    widget.innerHTML = html;
  }

  window.PehrawaRewards = {
    showRedeemModal: function () {
      var points = 0;
      fetch(api + "/points", { headers: { "Authorization": "Bearer " + getToken() } })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          points = data.redeemable_points || data.points || 0;
          var discount = Math.floor(points / 100) * 10;
          var overlay = document.createElement("div");
          overlay.className = "checkout-overlay active";
          overlay.id = "redeemOverlay";
          overlay.innerHTML = '<div class="checkout-modal">' +
            '<span class="checkout-close" onclick="document.getElementById(\'redeemOverlay\').remove()">&times;</span>' +
            '<h3>Redeem Points</h3>' +
            '<p style="color:#aaa;margin-bottom:16px;">You have <strong style="color:#fff;">' + points + ' redeemable points</strong> (≈ Rs. ' + discount + ' discount)</p>' +
            '<div style="margin-bottom:16px;"><label style="color:#888;font-size:13px;">Points to redeem</label>' +
            '<input type="number" id="redeemPoints" min="100" max="' + points + '" step="100" value="100" style="width:100%;padding:12px;background:#0b0b0b;border:1px solid #333;color:#fff;border-radius:6px;margin-top:6px;font-size:14px;"></div>' +
            '<p style="color:#888;font-size:13px;">Discount: Rs. <span id="redeemDiscount">10</span></p>' +
            '<button onclick="PehrawaRewards.submitRedeem()" style="width:100%;padding:14px;background:#fff;color:#000;border:none;border-radius:6px;font-weight:700;cursor:pointer;margin-top:12px;">Apply Discount</button>' +
            '</div>';
          document.body.appendChild(overlay);
          document.getElementById("redeemPoints").addEventListener("input", function () {
            var pts = parseInt(this.value) || 0;
            document.getElementById("redeemDiscount").textContent = Math.floor(pts / 100) * 10;
          });
        });
    },
    submitRedeem: function () {
      var pts = parseInt(document.getElementById("redeemPoints").value) || 0;
      if (pts < 100) { if (typeof showToast === "function") showToast("Minimum 100 points"); return; }
      fetch(api + "/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + getToken() },
        body: JSON.stringify({ points_to_redeem: pts })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            var ov = document.getElementById("redeemOverlay");
            if (ov) ov.remove();
            if (typeof showToast === "function") showToast(data.message);
            localStorage.setItem("pehrawa_reward_discount", data.discount);
            loadRewardsInfo();
          } else {
            if (typeof showToast === "function") showToast(data.message || "Failed to redeem");
          }
        })
        .catch(function () {
          if (typeof showToast === "function") showToast("Error redeeming points");
        });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
