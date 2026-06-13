(function () {
  var TOKEN_KEY = "pehrawa_customer_token";
  var CUSTOMER_KEY = "pehrawa_customer";

  window.getCustomerToken = function () {
    return localStorage.getItem(TOKEN_KEY);
  };

  window.getCustomer = function () {
    var data = localStorage.getItem(CUSTOMER_KEY);
    return data ? JSON.parse(data) : null;
  };

  window.isCustomerLoggedIn = function () {
    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    try {
      var payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 > Date.now();
    } catch (e) {
      return false;
    }
  };

  window.logoutCustomer = function () {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_KEY);
  };

  function saveAuth(token, customer) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  }

  function createModal() {
    if (document.getElementById("pehrawaAuthModal")) return;
    var div = document.createElement("div");
    div.id = "pehrawaAuthModal";
    div.className = "auth-modal-overlay";
    div.innerHTML =
      '<div class="auth-modal">' +
        '<button class="auth-close">&times;</button>' +
        '<div class="auth-tabs">' +
          '<button class="auth-tab active" data-tab="login">Login</button>' +
          '<button class="auth-tab" data-tab="register">Register</button>' +
        '</div>' +
        '<form id="authLoginForm" class="auth-form">' +
          '<h3>Welcome Back</h3>' +
          '<p>Login to continue shopping</p>' +
          '<label>Email</label>' +
          '<input type="email" id="authLoginEmail" placeholder="your@email.com" required>' +
          '<label>Password</label>' +
          '<input type="password" id="authLoginPassword" placeholder="Enter password" required>' +
          '<button type="submit" class="auth-submit">Login</button>' +
          '<p class="auth-error" id="authLoginError"></p>' +
        '</form>' +
        '<form id="authRegisterForm" class="auth-form" style="display:none">' +
          '<h3>Create Account</h3>' +
          '<p>Register to place orders</p>' +
          '<label>Full Name</label>' +
          '<input type="text" id="authRegName" placeholder="Your full name" required>' +
          '<label>Email</label>' +
          '<input type="email" id="authRegEmail" placeholder="your@email.com" required>' +
          '<label>Phone</label>' +
          '<input type="tel" id="authRegPhone" placeholder="9876543210">' +
          '<label>Password</label>' +
          '<input type="password" id="authRegPassword" placeholder="Create password" required>' +
          '<button type="submit" class="auth-submit">Register</button>' +
          '<p class="auth-error" id="authRegError"></p>' +
        '</form>' +
      '</div>';
    document.body.appendChild(div);

    var modal = div;
    var closeBtn = modal.querySelector(".auth-close");
    var tabs = modal.querySelectorAll(".auth-tab");
    var loginForm = document.getElementById("authLoginForm");
    var regForm = document.getElementById("authRegisterForm");

    closeBtn.addEventListener("click", function () {
      modal.classList.remove("active");
      if (window._authCallback) {
        window._authCallback(false);
        window._authCallback = null;
      }
    });

    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        modal.classList.remove("active");
        if (window._authCallback) {
          window._authCallback(false);
          window._authCallback = null;
        }
      }
    });

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("active"); });
        tab.classList.add("active");
        if (tab.dataset.tab === "login") {
          loginForm.style.display = "";
          regForm.style.display = "none";
        } else {
          loginForm.style.display = "none";
          regForm.style.display = "";
        }
      });
    });

    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      var btn = loginForm.querySelector(".auth-submit");
      var errEl = document.getElementById("authLoginError");
      btn.disabled = true;
      btn.textContent = "Logging in...";
      errEl.textContent = "";

      try {
        var api = window.PEHRAWA_API_BASE || "http://localhost:5000";
        var res = await fetch(api + "/api/customer/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: document.getElementById("authLoginEmail").value.trim(),
            password: document.getElementById("authLoginPassword").value
          })
        });
        var data = await res.json();
        if (data.success) {
          saveAuth(data.token, data.customer);
          modal.classList.remove("active");
          if (window._authCallback) {
            window._authCallback(true);
            window._authCallback = null;
          }
        } else {
          errEl.textContent = data.message || "Login failed";
        }
      } catch (err) {
        errEl.textContent = "Connection error. Try again.";
      }
      btn.disabled = false;
      btn.textContent = "Login";
    });

    regForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      var btn = regForm.querySelector(".auth-submit");
      var errEl = document.getElementById("authRegError");
      btn.disabled = true;
      btn.textContent = "Registering...";
      errEl.textContent = "";

      var name = document.getElementById("authRegName").value.trim();
      var email = document.getElementById("authRegEmail").value.trim();
      var phone = document.getElementById("authRegPhone").value.trim();
      var password = document.getElementById("authRegPassword").value;

      if (!name || !email || !password) {
        errEl.textContent = "Name, email and password are required";
        btn.disabled = false;
        btn.textContent = "Register";
        return;
      }

      try {
        var api = window.PEHRAWA_API_BASE || "http://localhost:5000";
        var res = await fetch(api + "/api/customer/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name, email: email, phone: phone, password: password })
        });
        var data = await res.json();
        if (data.success) {
          saveAuth(data.token, data.customer);
          modal.classList.remove("active");
          if (window._authCallback) {
            window._authCallback(true);
            window._authCallback = null;
          }
        } else {
          errEl.textContent = data.message || "Registration failed";
        }
      } catch (err) {
        errEl.textContent = "Connection error. Try again.";
      }
      btn.disabled = false;
      btn.textContent = "Register";
    });
  }

  window.requireAuth = function (callback) {
    if (window.isCustomerLoggedIn()) {
      if (callback) callback(true);
      return;
    }
    createModal();
    window._authCallback = callback;
    document.getElementById("pehrawaAuthModal").classList.add("active");
  };

  var style = document.createElement("style");
  style.textContent =
    ".auth-modal-overlay {" +
      "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:99999;" +
      "display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity 0.3s;" +
    "}" +
    ".auth-modal-overlay.active { opacity:1; pointer-events:all; }" +
    ".auth-modal {" +
      "background:#fff;border-radius:16px;padding:32px;width:420px;max-width:90vw;max-height:90vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.3);" +
    "}" +
    ".auth-close { position:absolute;top:12px;right:16px;background:none;border:none;font-size:28px;cursor:pointer;color:#666; }" +
    ".auth-tabs { display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid #eee; }" +
    ".auth-tab { flex:1;padding:10px;border:none;background:none;font-size:15px;font-weight:600;cursor:pointer;color:#999;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all 0.2s; }" +
    ".auth-tab.active { color:#f97316;border-bottom-color:#f97316; }" +
    ".auth-form h3 { margin:0 0 4px;font-size:22px; }" +
    ".auth-form p { margin:0 0 16px;color:#666;font-size:14px; }" +
    ".auth-form label { display:block;font-size:13px;font-weight:600;margin:10px 0 4px;color:#333; }" +
    ".auth-form input { width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box; }" +
    ".auth-form input:focus { outline:none;border-color:#f97316; }" +
    ".auth-submit { width:100%;padding:12px;margin-top:16px;background:#f97316;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer; }" +
    ".auth-submit:disabled { opacity:0.6;cursor:not-allowed; }" +
    ".auth-error { color:#e74c3c;font-size:13px;margin:8px 0 0;text-align:center; }";
  document.head.appendChild(style);
})();
