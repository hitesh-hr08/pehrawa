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
      messageBox.innerText = data.message || "Login failed";
    }
  } catch (err) {
    messageBox.innerText = "Start backend server before logging in.";
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", login);
}
