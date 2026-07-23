(function () {
  var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/public/scratch-cards";

  function getToken() {
    return window.getCustomerToken ? window.getCustomerToken() : "";
  }

  function init() {
    if (!getToken()) return;
    loadScratchCards();
  }

  function loadScratchCards() {
    fetch(api, { headers: { "Authorization": "Bearer " + getToken() } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success && data.cards && data.cards.length > 0) {
          renderScratchCardNotification(data.cards[0]);
        }
      })
      .catch(function () {});
  }

  function renderScratchCardNotification(card) {
    if (card.is_revealed && card.is_redeemed) return;
    var existing = document.getElementById("scratchCardFloat");
    if (existing) return;

    var float = document.createElement("div");
    float.id = "scratchCardFloat";
    float.className = "sc-float";
    float.innerHTML = '<div class="sc-float-inner" onclick="PehrawaScratchCard.open(' + card.id + ')">' +
      '<i class="fa-solid fa-gift"></i>' +
      '<span>You have a mystery reward!</span>' +
      '</div>';
    document.body.appendChild(float);

    setTimeout(function () { float.classList.add("sc-show"); }, 2000);
  }

  window.PehrawaScratchCard = {
    open: function (cardId) {
      var overlay = document.createElement("div");
      overlay.className = "checkout-overlay active";
      overlay.id = "scratchOverlay";
      overlay.innerHTML = '<div class="sc-modal">' +
        '<span class="checkout-close" onclick="document.getElementById(\'scratchOverlay\').remove()">&times;</span>' +
        '<h3 class="sc-title">Mystery Reward</h3>' +
        '<p style="color:#888;margin-bottom:20px;">Scratch below to reveal your reward!</p>' +
        '<div class="sc-surface" id="scSurface" onclick="PehrawaScratchCard.reveal(' + cardId + ')">' +
        '<div class="sc-surface-pattern"></div>' +
        '<div class="sc-surface-text">SCRATCH HERE</div>' +
        '</div>' +
        '<div class="sc-reward" id="scReward" style="display:none;"></div>' +
        '<button class="sc-redeem-btn" id="scRedeemBtn" style="display:none;" onclick="PehrawaScratchCard.redeem(' + cardId + ')">Claim Reward</button>' +
        '</div>';
      document.body.appendChild(overlay);
    },

    reveal: function (cardId) {
      var surface = document.getElementById("scSurface");
      var rewardEl = document.getElementById("scReward");
      var redeemBtn = document.getElementById("scRedeemBtn");
      if (!surface) return;

      surface.classList.add("sc-scratching");
      setTimeout(function () {
        surface.style.display = "none";
        fetch(api + "/" + cardId + "/reveal", {
          method: "POST",
          headers: { "Authorization": "Bearer " + getToken() }
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data.success && data.card) {
              var card = data.card;
              var icon = card.reward_type === "points" ? "fa-coins" : card.reward_type === "discount" ? "fa-percent" : "fa-gift";
              rewardEl.innerHTML = '<i class="fa-solid ' + icon + ' sc-reward-icon"></i>' +
                '<div class="sc-reward-text">' + card.reward_text + '</div>' +
                '<div class="sc-reward-type">' + card.reward_type.toUpperCase() + '</div>';
              rewardEl.style.display = "block";
              redeemBtn.style.display = "block";
            }
          })
          .catch(function () {});
      }, 800);
    },

    redeem: function (cardId) {
      fetch(api + "/" + cardId + "/redeem", {
        method: "POST",
        headers: { "Authorization": "Bearer " + getToken() }
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            if (typeof showToast === "function") showToast(data.message);
            var ov = document.getElementById("scratchOverlay");
            if (ov) ov.remove();
            var float = document.getElementById("scratchCardFloat");
            if (float) float.remove();
          } else {
            if (typeof showToast === "function") showToast(data.message || "Failed to claim");
          }
        })
        .catch(function () {
          if (typeof showToast === "function") showToast("Error claiming reward");
        });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
