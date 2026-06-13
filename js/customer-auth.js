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
    updateProfileIcon();
  };

  function saveAuth(token, customer) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    updateProfileIcon();
  }

  function createModal() {
    if (document.getElementById("pehrawaAuthModal")) return;
    var div = document.createElement("div");
    div.id = "pehrawaAuthModal";
    div.className = "auth-modal-overlay";
    div.innerHTML =
      '<div class="auth-modal">' +
        '<button class="auth-close">&times;</button>' +
        '<div class="auth-social">' +
          '<button class="google-btn" id="googleSignInBtn">' +
            '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.86 7.35 2.54 10.53l7.97-6.2z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>' +
            '<span>Sign in with Google</span>' +
          '</button>' +
        '</div>' +
        '<div class="auth-divider"><span>or</span></div>' +
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

    document.getElementById("googleSignInBtn").addEventListener("click", function () {
      var api = window.PEHRAWA_API_BASE || "http://localhost:5000";
      var currentPage = window.location.pathname.split("/").pop() || "home.html";
      window.location.href = api + "/api/auth/google?state=" + encodeURIComponent(currentPage);
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
        var res = await fetch(api + "/api/customers/login", {
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
        var res = await fetch(api + "/api/customers/register", {
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

  function getInitials(name) {
    if (!name) return "?";
    return name.split(" ").map(function (w) { return w[0]; }).join("").toUpperCase().slice(0, 2);
  }

  window.updateProfileIcon = function () {
    var container = document.getElementById("pehrawaProfileContainer");
    if (!container) return;
    var loggedIn = window.isCustomerLoggedIn();
    var customer = window.getCustomer();
    var loginBtns = document.querySelectorAll(".login-btn");
    for (var i = 0; i < loginBtns.length; i++) {
      loginBtns[i].style.display = loggedIn ? "none" : "";
    }

    if (loggedIn && customer) {
      container.innerHTML =
        '<div class="profile-icon-wrapper">' +
          '<div class="profile-icon" id="profileIconBtn">' +
            '<span class="profile-avatar">' + getInitials(customer.name) + '</span>' +
          '</div>' +
          '<div class="profile-dropdown" id="profileDropdown">' +
            '<div class="dropdown-header">' +
              '<span class="dropdown-name">' + (customer.name || "Customer") + '</span>' +
              '<span class="dropdown-email">' + customer.email + '</span>' +
            '</div>' +
            '<a class="dropdown-item" href="my-orders.html"><i class="fa-solid fa-box"></i> My Orders</a>' +
            '<a class="dropdown-item" href="wishlist.html"><i class="fa-regular fa-heart"></i> My Wishlist</a>' +
            '<a class="dropdown-item" href="my-profile.html"><i class="fa-regular fa-user"></i> My Profile</a>' +
            '<div class="dropdown-divider"></div>' +
            '<a class="dropdown-item logout-item" id="profileLogoutBtn" href="#"><i class="fa-solid fa-sign-out-alt"></i> Logout</a>' +
          '</div>' +
        '</div>';
    } else {
      container.innerHTML = "";
    }
    bindProfileEvents();
  };

  function bindProfileEvents() {
    var iconBtn = document.getElementById("profileIconBtn");
    var dropdown = document.getElementById("profileDropdown");
    if (iconBtn && dropdown) {
      iconBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        dropdown.classList.toggle("open");
      });
    }
    var logoutBtn = document.getElementById("profileLogoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        window.logoutCustomer();
        window.updateProfileIcon();
        window.location.href = "home.html";
      });
    }
  }

  document.addEventListener("click", function () {
    var dropdown = document.getElementById("profileDropdown");
    if (dropdown) dropdown.classList.remove("open");
  });

  window.initProfileIcon = function () {
    if (document.getElementById("pehrawaProfileContainer")) return;
    var navIcons = document.querySelector(".nav-icons");
    if (!navIcons) {
      setTimeout(window.initProfileIcon, 300);
      return;
    }
    var container = document.createElement("div");
    container.id = "pehrawaProfileContainer";
    container.className = "profile-container";
    navIcons.appendChild(container);
    window.updateProfileIcon();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProfileIcon);
  } else {
    initProfileIcon();
  }
  window.addEventListener("load", function () {
    if (!document.getElementById("pehrawaProfileContainer")) {
      initProfileIcon();
    }
  });

  var style = document.createElement("style");
  style.textContent =
    ".auth-modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity 0.3s;}" +
    ".auth-modal-overlay.active{opacity:1;pointer-events:all;}" +
    ".auth-modal{background:#fff;border-radius:16px;padding:32px;width:420px;max-width:90vw;max-height:90vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.3);}" +
    ".auth-close{position:absolute;top:12px;right:16px;background:none;border:none;font-size:28px;cursor:pointer;color:#666;}" +
    ".auth-social{margin-bottom:8px;}" +
    ".google-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;font-size:15px;font-weight:500;color:#333;transition:all 0.2s;}" +
    ".google-btn:hover{background:#f8f8f8;border-color:#bbb;}" +
    ".auth-divider{display:flex;align-items:center;margin:16px 0;color:#999;font-size:13px;}" +
    ".auth-divider::before,.auth-divider::after{content:'';flex:1;height:1px;background:#eee;}" +
    ".auth-divider span{padding:0 12px;}" +
    ".auth-tabs{display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid #eee;}" +
    ".auth-tab{flex:1;padding:10px;border:none;background:none;font-size:15px;font-weight:600;cursor:pointer;color:#999;border-bottom:2px solid transparent;margin-bottom:-2px;transition:all 0.2s;}" +
    ".auth-tab.active{color:#f97316;border-bottom-color:#f97316;}" +
    ".auth-form h3{margin:0 0 4px;font-size:22px;}" +
    ".auth-form p{margin:0 0 16px;color:#666;font-size:14px;}" +
    ".auth-form label{display:block;font-size:13px;font-weight:600;margin:10px 0 4px;color:#333;}" +
    ".auth-form input{width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box;}" +
    ".auth-form input:focus{outline:none;border-color:#f97316;}" +
    ".auth-submit{width:100%;padding:12px;margin-top:16px;background:#f97316;color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;}" +
    ".auth-submit:disabled{opacity:0.6;cursor:not-allowed;}" +
    ".auth-error{color:#e74c3c;font-size:13px;margin:8px 0 0;text-align:center;}" +
    ".profile-container{display:inline-flex;align-items:center;vertical-align:middle;font-size:18px;}" +
    ".profile-container span{position:static!important;width:auto!important;height:auto!important;top:auto!important;right:auto!important;border-radius:0!important;background:none!important;font-size:inherit!important;color:inherit!important;display:inline!important;line-height:normal!important;}" +
    ".profile-icon-wrapper{position:relative;display:flex;align-items:center;}" +
    ".profile-icon{cursor:pointer;display:flex;align-items:center;justify-content:center;width:34px;height:34px;}" +
    ".profile-container .profile-avatar{width:28px!important;height:28px!important;border-radius:50%!important;background:linear-gradient(135deg,#f97316,#ea580c)!important;color:#fff!important;display:flex!important;align-items:center;justify-content:center;font-size:12px!important;font-weight:700!important;letter-spacing:0.5px;box-shadow:0 2px 6px rgba(249,115,22,0.3);}" +
    ".profile-dropdown{position:absolute;top:100%;right:-8px;margin-top:10px;background:#fff;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.15);min-width:230px;opacity:0;pointer-events:none;transform:translateY(-8px);transition:all 0.2s ease;z-index:9999;overflow:hidden;}" +
    ".profile-dropdown.open{opacity:1;pointer-events:all;transform:translateY(0);}" +
    ".dropdown-header{padding:14px 16px 10px;border-bottom:1px solid #f0f0f0;}" +
    ".dropdown-name{display:block;font-size:14px;font-weight:600;color:#222;}" +
    ".dropdown-email{display:block;font-size:12px;color:#888;margin-top:2px;}" +
    ".dropdown-item{display:flex;align-items:center;gap:10px;padding:10px 16px;color:#444;text-decoration:none;font-size:14px;transition:background 0.15s;}" +
    ".dropdown-item:hover{background:#f9f9f9;color:#f97316;}" +
    ".dropdown-item i{width:18px;text-align:center;font-size:15px;}" +
    ".dropdown-divider{height:1px;background:#f0f0f0;margin:4px 0;}" +
    ".logout-item{color:#e74c3c;}" +
    ".logout-item:hover{color:#e74c3c!important;background:#fef2f2;}";
  document.head.appendChild(style);
})();
