(function () {
  var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/public/coming-soon";

  function init() {
    fetch(api)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success && data.items && data.items.length > 0) renderComingSoon(data.items);
        else { var el = document.getElementById("comingSoonSection"); if (el) el.style.display = "none"; }
      })
      .catch(function () { var el = document.getElementById("comingSoonSection"); if (el) el.style.display = "none"; });
  }

  function renderComingSoon(items) {
    var section = document.getElementById("comingSoonSection");
    if (!section) return;
    section.style.display = "block";

    var html = '<div class="cs-grid">';
    items.forEach(function (item) {
      var img = item.image_url || "../images/product1.png";
      var launchDate = item.launch_date ? new Date(item.launch_date).getTime() : null;
      var countdownHtml = "";
      if (launchDate && launchDate > Date.now()) {
        countdownHtml = '<div class="cs-countdown" data-launch="' + launchDate + '">' +
          '<div class="cs-cd"><span class="cs-cd-days">--</span><small>Days</small></div>' +
          '<div class="cs-cd"><span class="cs-cd-hours">--</span><small>Hours</small></div>' +
          '<div class="cs-cd"><span class="cs-cd-mins">--</span><small>Mins</small></div>' +
          '</div>';
      }
      html += '<div class="cs-grid-item">' +
        '<div class="cs-img"><img src="' + img + '" alt="' + item.name + '"><div class="cs-overlay-label">COMING SOON</div></div>' +
        '<div class="cs-info"><h4>' + item.name + '</h4>' +
        '<p>' + (item.description || "Something extraordinary is on its way.") + '</p>' +
        countdownHtml +
        '<div class="cs-notify"><input type="email" placeholder="Enter your email" id="csEmail_' + item.id + '">' +
        '<button onclick="PehrawaComingSoon.notify(' + item.id + ')">Notify Me</button></div>' +
        '</div></div>';
    });
    html += '</div>';
    section.querySelector(".cs-container").innerHTML = html;

    startCountdowns();
  }

  function startCountdowns() {
    document.querySelectorAll(".cs-countdown[data-launch]").forEach(function (el) {
      var launch = parseInt(el.getAttribute("data-launch"));

      function update() {
        var diff = launch - Date.now();
        if (diff <= 0) { el.innerHTML = '<span style="color:#fff;font-weight:700;">LAUNCHED!</span>'; return; }
        var d = Math.floor(diff / 86400000);
        var h = Math.floor((diff % 86400000) / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        var daysEl = el.querySelector(".cs-cd-days");
        var hoursEl = el.querySelector(".cs-cd-hours");
        var minsEl = el.querySelector(".cs-cd-mins");
        if (daysEl) daysEl.textContent = d;
        if (hoursEl) hoursEl.textContent = h < 10 ? "0" + h : h;
        if (minsEl) minsEl.textContent = m < 10 ? "0" + m : m;
      }

      update();
      setInterval(update, 60000);
    });
  }

  window.PehrawaComingSoon = {
    notify: function (id) {
      var input = document.getElementById("csEmail_" + id);
      if (!input) return;
      var email = input.value.trim();
      if (!email || !email.includes("@")) {
        if (typeof showToast === "function") showToast("Enter a valid email");
        return;
      }
      fetch(api + "/" + id + "/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            if (typeof showToast === "function") showToast(data.message);
            input.value = "";
            input.placeholder = "You're on the list!";
            input.disabled = true;
          }
        })
        .catch(function () {
          if (typeof showToast === "function") showToast("Failed to register");
        });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
