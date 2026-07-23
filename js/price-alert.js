(function () {
  var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/user/price-alerts";

  function getToken() {
    return window.getCustomerToken ? window.getCustomerToken() : "";
  }

  function isLoggedIn() {
    return !!getToken();
  }

  window.PehrawaPriceAlert = {
    toggle: function (productId) {
      if (!isLoggedIn()) {
        if (typeof window.requireAuth === "function") {
          window.requireAuth(function (loggedIn) {
            if (loggedIn) PehrawaPriceAlert.toggle(productId);
          });
        }
        return;
      }
      fetch(api + "/check/" + productId, {
        headers: { "Authorization": "Bearer " + getToken() }
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.hasAlert) {
            fetch(api + "/" + data.alertId || "", {
              method: "DELETE",
              headers: { "Authorization": "Bearer " + getToken() }
            }).then(function () {
              renderPriceAlertBtn(productId, false);
              if (typeof showToast === "function") showToast("Price alert removed");
            });
          } else {
            fetch(api, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": "Bearer " + getToken() },
              body: JSON.stringify({ product_id: productId })
            }).then(function () {
              renderPriceAlertBtn(productId, true);
              if (typeof showToast === "function") showToast("Price alert set! We'll notify you on price drop.");
            });
          }
        });
    },
    check: function (productId) {
      if (!isLoggedIn()) return Promise.resolve(false);
      return fetch(api + "/check/" + productId, {
        headers: { "Authorization": "Bearer " + getToken() }
      })
        .then(function (r) { return r.json(); })
        .then(function (data) { return data.hasAlert; })
        .catch(function () { return false; });
    }
  };

  function renderPriceAlertBtn(productId, hasAlert) {
    var el = document.getElementById("priceAlertBtn");
    if (!el) return;
    if (hasAlert) {
      el.innerHTML = '<i class="fa-solid fa-bell"></i> Alert Set';
      el.classList.add("alert-active");
    } else {
      el.innerHTML = '<i class="fa-regular fa-bell"></i> Price Alert';
      el.classList.remove("alert-active");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("priceAlertBtn");
    if (!btn) return;
    var params = new URLSearchParams(window.location.search);
    var pid = params.get("id");
    if (!pid) return;
    PehrawaPriceAlert.check(pid).then(function (hasAlert) {
      renderPriceAlertBtn(pid, hasAlert);
    });
    btn.addEventListener("click", function () {
      PehrawaPriceAlert.toggle(pid);
    });
  });
})();
