const loginForm = document.getElementById("loginForm");
const messageBox = document.getElementById("msg");

async function login(event) {
  if (event) event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  messageBox.innerText = "";

  try {
    const apiBase = window.PEHRAWA_API_BASE || "http://localhost:5000";
    const res = await fetch(`${apiBase}/api/customers/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("pehrawa_customer_token", data.token);
      localStorage.setItem("pehrawa_customer", JSON.stringify(data.customer));
      window.location.href = "home.html";
    } else {
      if (data.message && data.message.includes("Google")) {
        messageBox.innerHTML = data.message + '</p><div class="set-pw-box"><p style="color:#aaa;margin:8px 0;">Set a password for your Google account to login directly:</p><input type="password" id="setPwInput" placeholder="New password (min 6 chars)" style="margin-bottom:8px"><button class="google-btn-inline" id="setPwBtn"><i class="fa-solid fa-key"></i> Set Password & Login</button></div>';
        document.getElementById("setPwBtn").addEventListener("click", function () {
          var newPw = document.getElementById("setPwInput").value;
          if (!newPw || newPw.length < 6) { alert("Password must be at least 6 characters"); return; }
          var email = document.getElementById("email").value.trim();
          fetch(apiBase + "/api/customers/set-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, password: newPw })
          })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (d.success) {
              document.getElementById("password").value = newPw;
              login();
            } else {
              alert(d.message || "Failed");
            }
          })
          .catch(function () { alert("Server error"); });
        });
      } else {
        messageBox.innerText = data.message || "Login failed";
      }
    }
  } catch (err) {
    messageBox.innerText = "Start backend server before logging in.";
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", login);
}
