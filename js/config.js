(function () {
  var api = window.location.protocol + "//" + window.location.host;
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    api = "http://localhost:5000";
  }
  window.PEHRAWA_API_BASE = api;

  // Load store settings from backend
  window.PEHRAWA_SETTINGS = {};

  // Fetch Razorpay key
  window.PEHRAWA_RZP_KEY = "rzp_live_T6aA0kd4BdVC3q";
  fetch(api + "/api/public/razorpay-key")
    .then(function (r) { return r.json(); })
    .then(function (data) { if (data && data.key) window.PEHRAWA_RZP_KEY = data.key; })
    .catch(function () {});

  fetch(api + "/api/public/settings")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      window.PEHRAWA_SETTINGS = data;

      // Update copyright year dynamically
      var cp = document.querySelector(".copyright");
      if (cp) {
        var name = data.store_name || "Pehrawa";
        cp.textContent = "\u00A9 " + new Date().getFullYear() + " " + name + ". All Rights Reserved.";
      }

      // Update footer description with tagline from settings
      var footDesc = document.querySelector(".foot > div:first-child p");
      if (footDesc && data.store_tagline) {
        footDesc.textContent = data.store_tagline;
      }
    })
    .catch(function () {});
})();
