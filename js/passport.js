(function () {
  var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/user/passport";

  function getToken() { return window.getCustomerToken ? window.getCustomerToken() : ""; }

  function init() {
    var container = document.getElementById("passportContent");
    var notLogged = document.getElementById("passportNotLoggedIn");
    if (!getToken()) {
      if (container) container.style.display = "none";
      if (notLogged) notLogged.style.display = "flex";
      return;
    }
    if (container) container.style.display = "block";
    if (notLogged) notLogged.style.display = "none";
    loadPassport();
  }

  function loadPassport() {
    fetch(api, { headers: { "Authorization": "Bearer " + getToken() } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success && data.passport) renderPassport(data.passport);
        else if (typeof showToast === "function") showToast("Failed to load passport");
      })
      .catch(function () {
        if (typeof showToast === "function") showToast("Error loading passport");
      });
  }

  function renderPassport(p) {
    var container = document.getElementById("passportContent");
    if (!container) return;

    var tierColors = { bronze: "#cd7f32", silver: "#c0c0c0", gold: "#ffd700", black: "#1a1a1a" };
    var tierIcons = { bronze: "fa-medal", silver: "fa-medal", gold: "fa-medal", black: "fa-medal" };
    var tierNames = { bronze: "Bronze", silver: "Silver", gold: "Gold", black: "Black" };
    var tierColor = tierColors[p.tier] || "#cd7f32";
    var tierName = tierNames[p.tier] || "Bronze";

    var html = '';

    // Hero
    html += '<div class="pp-hero">';
    html += '<div class="pp-hero-content">';
    html += '<div class="pp-avatar"><i class="fa-solid fa-user"></i></div>';
    html += '<h1 class="pp-name">' + (p.customer.name || "Member") + '</h1>';
    html += '<div class="pp-tier-badge" style="background:' + tierColor + '"><i class="fa-solid ' + (tierIcons[p.tier] || "fa-medal") + '"></i> ' + tierName + ' Member</div>';
    var memberDate = p.stats.memberSince ? new Date(p.stats.memberSince) : new Date();
    html += '<div class="pp-member-since">Member since ' + memberDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) + ' &middot; ' + (p.stats.memberDays || 0) + ' days</div>';
    html += '</div></div>';

    // Stats Row
    html += '<div class="pp-stats-row">';
    html += '<div class="pp-stat-card"><div class="pp-stat-icon" style="background:rgba(255,107,0,.15);color:#ff6b00"><i class="fa-solid fa-bag-shopping"></i></div><div class="pp-stat-val">' + p.stats.totalOrders + '</div><div class="pp-stat-label">Orders</div></div>';
    html += '<div class="pp-stat-card"><div class="pp-stat-icon" style="background:rgba(34,197,94,.15);color:#22c55e"><i class="fa-solid fa-indian-rupee-sign"></i></div><div class="pp-stat-val">₹' + formatNum(p.stats.totalSpent) + '</div><div class="pp-stat-label">Total Spent</div></div>';
    html += '<div class="pp-stat-card"><div class="pp-stat-icon" style="background:rgba(241,196,15,.15);color:#f1c40f"><i class="fa-solid fa-coins"></i></div><div class="pp-stat-val">' + formatNum(p.points.lifetime) + '</div><div class="pp-stat-label">Lifetime Points</div></div>';
    html += '<div class="pp-stat-card"><div class="pp-stat-icon" style="background:rgba(155,89,182,.15);color:#9b59b6"><i class="fa-solid fa-piggy-bank"></i></div><div class="pp-stat-val">' + (p.points.redeemable || 0) + '</div><div class="pp-stat-label">Redeemable</div></div>';
    html += '</div>';

    // Tier Progress
    html += '<div class="pp-tier-progress">';
    html += '<h3><i class="fa-solid fa-ranking-star"></i> Tier Progress</h3>';
    var tp = p.tierProgress || {};
    var progressPct = Math.min(100, tp.percentage || 0);
    html += '<div class="pp-tier-bar"><div class="pp-tier-bar-fill" style="width:' + progressPct + '%;background:' + tierColor + '"></div>';
    // Tier markers
    var maxPts = 5000;
    var tiers = [{ name: "Bronze", pts: 0 }, { name: "Silver", pts: 500 }, { name: "Gold", pts: 2000 }, { name: "Black", pts: 5000 }];
    tiers.forEach(function (t) {
      var pos = (t.pts / maxPts) * 100;
      var isCurrent = false;
      if (t.name.toLowerCase() === p.tier) isCurrent = true;
      html += '<div class="pp-tier-marker' + (isCurrent ? ' pp-tier-current' : '') + '" style="left:' + pos + '%"><span class="pp-tier-marker-label">' + t.name + '</span></div>';
    });
    html += '</div>';
    if (tp.nextTier) {
      html += '<div class="pp-tier-next">Spend ₹' + formatNum(tp.amountNeeded || 0) + ' more to reach <strong>' + tp.nextTier + '</strong></div>';
    }
    html += '</div>';

    // Badges
    html += '<div class="pp-badges-section">';
    html += '<h3><i class="fa-solid fa-award"></i> Badges (' + p.badges.length + ')</h3>';
    if (p.badges.length === 0) {
      html += '<p class="pp-empty">Complete orders and refer friends to earn badges!</p>';
    } else {
      html += '<div class="pp-badges-grid">';
      p.badges.forEach(function (b) {
        html += '<div class="pp-badge" style="border-color:' + b.color + '">';
        html += '<div class="pp-badge-icon" style="background:' + b.color + '"><i class="fa-solid ' + b.icon + '"></i></div>';
        html += '<div class="pp-badge-name">' + b.name + '</div>';
        html += '<div class="pp-badge-desc">' + b.desc + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div>';

    // Benefits & Perks
    html += '<div class="pp-benefits-section">';
    html += '<h3><i class="fa-solid fa-gift"></i> Your Benefits</h3>';
    var benefits = p.tierBenefits || {};
    html += '<div class="pp-benefits-grid">';
    html += '<div class="pp-benefit' + (benefits.freeShipping ? ' pp-active' : '') + '"><i class="fa-solid fa-truck"></i><span>Free Shipping</span><small>' + (benefits.freeShipping ? "Active" : "Silver+") + '</small></div>';
    html += '<div class="pp-benefit pp-active"><i class="fa-solid fa-coins"></i><span>' + (benefits.pointsMultiplier || 1) + 'x Points</span><small>On every order</small></div>';
    html += '<div class="pp-benefit' + (benefits.discount ? ' pp-active' : '') + '"><i class="fa-solid fa-percent"></i><span>' + (benefits.discount || 0) + '% Off</span><small>' + (benefits.discount ? "Active" : "Higher tiers") + '</small></div>';
    html += '<div class="pp-benefit' + (benefits.earlyAccess ? ' pp-active' : '') + '"><i class="fa-solid fa-bolt"></i><span>Early Access</span><small>' + (benefits.earlyAccess ? "Active" : "Gold+") + '</small></div>';
    html += '</div></div>';

    // Scratch Cards
    if (p.scratchCards && (p.scratchCards.unrevealed > 0 || p.scratchCards.unredeemed > 0)) {
      html += '<div class="pp-scratch-section">';
      html += '<h3><i class="fa-solid fa-dice"></i> Scratch Cards</h3>';
      html += '<div class="pp-scratch-stats">';
      if (p.scratchCards.unrevealed > 0) html += '<div class="pp-scratch-stat pp-unrevealed"><span>' + p.scratchCards.unrevealed + '</span> Unrevealed</div>';
      if (p.scratchCards.unredeemed > 0) html += '<div class="pp-scratch-stat pp-unredeemed"><span>' + p.scratchCards.unredeemed + '</span> Ready to claim</div>';
      html += '<div class="pp-scratch-stat"><span>' + p.scratchCards.redeemed + '</span> Claimed</div>';
      html += '</div></div>';
    }

    // Quick Actions
    html += '<div class="pp-actions">';
    html += '<a href="/wishlist" class="pp-action-btn"><i class="fa-regular fa-heart"></i> My Wishlist (' + (p.wishlistCount || 0) + ')</a>';
    html += '<a href="/my-orders" class="pp-action-btn"><i class="fa-solid fa-box"></i> My Orders</a>';
    html += '<a href="/rewards" class="pp-action-btn"><i class="fa-solid fa-star"></i> Rewards Hub</a>';
    html += '<a href="/shop" class="pp-action-btn"><i class="fa-solid fa-bag-shopping"></i> Shop Now</a>';
    html += '</div>';

    container.innerHTML = html;
  }

  function formatNum(n) {
    n = Number(n) || 0;
    if (n >= 100000) return (n / 100000).toFixed(1) + "L";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toFixed(0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
