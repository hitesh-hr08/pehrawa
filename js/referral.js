(function () {
  var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/user/referral-code";

  function getToken() { return window.getCustomerToken ? window.getCustomerToken() : ""; }

  function init() {
    var section = document.getElementById("referralSection");
    if (!section) return;
    if (!getToken()) { section.style.display = "none"; return; }
    loadReferral();
  }

  function loadReferral() {
    fetch(api, { headers: { "Authorization": "Bearer " + getToken() } })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success && data.code) renderReferral(data);
        else { var el = document.getElementById("referralSection"); if (el) el.style.display = "none"; }
      })
      .catch(function () { var el = document.getElementById("referralSection"); if (el) el.style.display = "none"; });
  }

  function renderReferral(data) {
    var section = document.getElementById("referralSection");
    if (!section) return;
    section.style.display = "block";

    var baseUrl = window.location.origin;
    var referralLink = baseUrl + "/register?ref=" + data.code;
    var shareText = "Join Pehrawa and get exclusive tees! Use my code " + data.code + " for a welcome bonus: " + referralLink;

    var html = '<div class="ref-card">';
    html += '<div class="ref-header"><h3><i class="fa-solid fa-share-nodes"></i> REFER & EARN</h3>';
    html += '<p>Share your code with friends. Both of you earn rewards!</p></div>';

    html += '<div class="ref-code-area">';
    html += '<div class="ref-code-label">Your Referral Code</div>';
    html += '<div class="ref-code-display">';
    html += '<span class="ref-code" id="refCodeText">' + data.code + '</span>';
    html += '<button class="ref-copy-btn" onclick="PehrawaReferral.copyCode()"><i class="fa-regular fa-copy"></i> Copy</button>';
    html += '</div></div>';

    html += '<div class="ref-link-area">';
    html += '<div class="ref-code-label">Your Referral Link</div>';
    html += '<div class="ref-link-display">';
    html += '<input type="text" class="ref-link-input" id="refLinkInput" value="' + referralLink + '" readonly>';
    html += '<button class="ref-copy-btn" onclick="PehrawaReferral.copyLink()"><i class="fa-regular fa-copy"></i></button>';
    html += '</div></div>';

    html += '<div class="ref-stats">';
    html += '<div class="ref-stat"><div class="ref-stat-val">' + data.totalReferred + '</div><div class="ref-stat-label">Friends Referred</div></div>';
    html += '<div class="ref-stat"><div class="ref-stat-val">' + data.totalRewarded + '</div><div class="ref-stat-label">Rewards Claimed</div></div>';
    html += '<div class="ref-stat"><div class="ref-stat-val">' + (data.totalEarned || 0) + '</div><div class="ref-stat-label">Points Earned</div></div>';
    html += '</div>';

    html += '<div class="ref-share">';
    html += '<a href="https://wa.me/?text=' + encodeURIComponent(shareText) + '" target="_blank" class="ref-share-btn ref-whatsapp"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>';
    html += '<a href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText) + '" target="_blank" class="ref-share-btn ref-twitter"><i class="fa-brands fa-twitter"></i> Twitter</a>';
    html += '<button class="ref-share-btn ref-more" onclick="PehrawaReferral.share()"><i class="fa-solid fa-share-from-square"></i> Share</button>';
    html += '</div>';

    html += '<div class="ref-reward-info">';
    html += '<h4>How it works</h4>';
    html += '<ul>';
    html += '<li><i class="fa-solid fa-circle-check"></i> Friend signs up using your code</li>';
    html += '<li><i class="fa-solid fa-circle-check"></i> You get <strong>200 points</strong> after their first order</li>';
    html += '<li><i class="fa-solid fa-circle-check"></li> Friend gets <strong>100 bonus points</strong> welcome reward</li>';
    html += '</ul></div>';

    html += '</div>';
    section.innerHTML = html;
  }

  window.PehrawaReferral = {
    copyCode: function () {
      var code = document.getElementById("refCodeText");
      if (!code) return;
      navigator.clipboard.writeText(code.textContent).then(function () {
        if (typeof showToast === "function") showToast("Code copied!");
      }).catch(function () {
        var input = document.createElement("input");
        input.value = code.textContent;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
        if (typeof showToast === "function") showToast("Code copied!");
      });
    },
    copyLink: function () {
      var input = document.getElementById("refLinkInput");
      if (!input) return;
      navigator.clipboard.writeText(input.value).then(function () {
        if (typeof showToast === "function") showToast("Link copied!");
      }).catch(function () {
        input.select();
        document.execCommand("copy");
        if (typeof showToast === "function") showToast("Link copied!");
      });
    },
    share: function () {
      var code = document.getElementById("refCodeText");
      var baseUrl = window.location.origin;
      var link = baseUrl + "/register?ref=" + (code ? code.textContent : "");
      var text = "Join Pehrawa for exclusive tees! Use my code " + (code ? code.textContent : "") + ": " + link;
      if (navigator.share) {
        navigator.share({ title: "Join Pehrawa", text: text, url: link }).catch(function () {});
      } else {
        navigator.clipboard.writeText(text).then(function () {
          if (typeof showToast === "function") showToast("Share link copied!");
        });
      }
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
