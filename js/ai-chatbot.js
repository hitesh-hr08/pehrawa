(function () {
  var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/public/chatbot";
  var sessionId = "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  var isOpen = false;
  var hasGreeted = false;

  function getToken() { return window.getCustomerToken ? window.getCustomerToken() : ""; }

  // Skip on admin pages
  if (window.location.pathname.indexOf("/admin") === 0) return;

  function createWidget() {
    // Floating button
    var btn = document.createElement("div");
    btn.id = "aiChatBtn";
    btn.className = "ai-chat-btn";
    btn.innerHTML = '<i class="fa-solid fa-robot"></i>';
    btn.title = "Chat with Pehrawa AI";
    btn.onclick = toggleChat;
    document.body.appendChild(btn);

    // Chat window
    var chat = document.createElement("div");
    chat.id = "aiChatWindow";
    chat.className = "ai-chat-window";
    chat.innerHTML =
      '<div class="ai-chat-header">' +
        '<div class="ai-chat-header-left">' +
          '<div class="ai-chat-avatar"><i class="fa-solid fa-robot"></i></div>' +
          '<div><div class="ai-chat-name">Pehrawa AI</div><div class="ai-chat-status"><span class="ai-status-dot"></span> Online</div></div>' +
        '</div>' +
        '<button class="ai-chat-close" onclick="PehrawaChat.toggle()">&times;</button>' +
      '</div>' +
      '<div class="ai-chat-body" id="aiChatBody">' +
        '<div class="ai-chat-messages" id="aiChatMessages"></div>' +
      '</div>' +
      '<div class="ai-chat-suggestions" id="aiChatSuggestions"></div>' +
      '<div class="ai-chat-input-area">' +
        '<input type="text" id="aiChatInput" class="ai-chat-input" placeholder="Ask about sizing, products, deals..." maxlength="500">' +
        '<button class="ai-chat-send" id="aiChatSend" onclick="PehrawaChat.send()"><i class="fa-solid fa-paper-plane"></i></button>' +
      '</div>';
    document.body.appendChild(chat);

    // Enter key
    var input = document.getElementById("aiChatInput");
    if (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          PehrawaChat.send();
        }
      });
    }

    // Auto-greet after 30s
    setTimeout(function () {
      if (!isOpen && !hasGreeted) {
        btn.classList.add("ai-chat-pulse");
      }
    }, 30000);
  }

  function toggleChat() {
    var window = document.getElementById("aiChatWindow");
    var btn = document.getElementById("aiChatBtn");
    if (!window) return;

    isOpen = !isOpen;
    if (isOpen) {
      window.classList.add("ai-chat-open");
      btn.classList.remove("ai-chat-pulse");
      var input = document.getElementById("aiChatInput");
      if (input) input.focus();
      if (!hasGreeted) {
        hasGreeted = true;
        addBotMessage("Hey! I'm your Pehrawa style assistant. Ask me anything about our products, sizing, shipping, or deals!", [
          "What's trending?", "Size help", "Best deals", "Show tees"
        ]);
      }
    } else {
      window.classList.remove("ai-chat-open");
    }
  }

  function addBotMessage(text, suggestions) {
    var container = document.getElementById("aiChatMessages");
    if (!container) return;

    var msgEl = document.createElement("div");
    msgEl.className = "ai-msg ai-msg-bot";
    msgEl.innerHTML = '<div class="ai-msg-avatar"><i class="fa-solid fa-robot"></i></div>' +
      '<div class="ai-msg-content"><div class="ai-msg-text">' + escapeHtml(text) + '</div></div>';
    container.appendChild(msgEl);

    // Suggestions
    if (suggestions && suggestions.length > 0) {
      var sugEl = document.getElementById("aiChatSuggestions");
      if (sugEl) {
        sugEl.innerHTML = "";
        suggestions.forEach(function (s) {
          var btn = document.createElement("button");
          btn.className = "ai-sug-btn";
          btn.textContent = s;
          btn.onclick = function () {
            document.getElementById("aiChatInput").value = s;
            PehrawaChat.send();
          };
          sugEl.appendChild(btn);
        });
      }
    }

    scrollToBottom();
  }

  function addBotProducts(products) {
    if (!products || products.length === 0) return;
    var container = document.getElementById("aiChatMessages");
    if (!container) return;

    var prodEl = document.createElement("div");
    prodEl.className = "ai-msg ai-msg-bot";
    var html = '<div class="ai-msg-avatar"><i class="fa-solid fa-robot"></i></div>';
    html += '<div class="ai-msg-content"><div class="ai-msg-products">';
    products.forEach(function (p) {
      var img = p.image_url || "../images/product1.png";
      html += '<a href="/product?id=' + p.id + '" class="ai-prod-card">';
      html += '<img src="' + img + '" alt="' + (p.name || "") + '" loading="lazy">';
      html += '<div class="ai-prod-info">';
      html += '<span class="ai-prod-name">' + (p.name || "") + '</span>';
      html += '<span class="ai-prod-price">₹' + (Number(p.price) || 0) + '</span>';
      html += '</div></a>';
    });
    html += '</div></div>';
    prodEl.innerHTML = html;
    container.appendChild(prodEl);
    scrollToBottom();
  }

  function addUserMessage(text) {
    var container = document.getElementById("aiChatMessages");
    if (!container) return;
    var msgEl = document.createElement("div");
    msgEl.className = "ai-msg ai-msg-user";
    msgEl.innerHTML = '<div class="ai-msg-content"><div class="ai-msg-text">' + escapeHtml(text) + '</div></div>';
    container.appendChild(msgEl);
    scrollToBottom();
  }

  function showTyping() {
    var container = document.getElementById("aiChatMessages");
    if (!container) return;
    var typing = document.createElement("div");
    typing.className = "ai-msg ai-msg-bot ai-typing";
    typing.id = "aiTyping";
    typing.innerHTML = '<div class="ai-msg-avatar"><i class="fa-solid fa-robot"></i></div>' +
      '<div class="ai-msg-content"><div class="ai-typing-dots"><span></span><span></span><span></span></div></div>';
    container.appendChild(typing);
    scrollToBottom();
  }

  function hideTyping() {
    var el = document.getElementById("aiTyping");
    if (el) el.remove();
  }

  function send() {
    var input = document.getElementById("aiChatInput");
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    input.value = "";

    addUserMessage(text);

    var sugEl = document.getElementById("aiChatSuggestions");
    if (sugEl) sugEl.innerHTML = "";

    showTyping();

    var token = getToken();
    fetch(api, {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, token ? { "Authorization": "Bearer " + token } : {}),
      body: JSON.stringify({ message: text, session_id: sessionId })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        hideTyping();
        if (data.success) {
          addBotMessage(data.response, data.suggestions);
          if (data.products && data.products.length > 0) {
            addBotProducts(data.products);
          }
        } else {
          addBotMessage("Sorry, something went wrong. Try again or WhatsApp us!", []);
        }
      })
      .catch(function () {
        hideTyping();
        addBotMessage("Connection error. Try again later or WhatsApp us at +91 98557 07708.", []);
      });
  }

  function scrollToBottom() {
    var body = document.getElementById("aiChatBody");
    if (body) setTimeout(function () { body.scrollTop = body.scrollHeight; }, 100);
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  window.PehrawaChat = {
    toggle: toggleChat,
    send: send,
    open: function () { if (!isOpen) toggleChat(); }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(createWidget, 2000);
    });
  } else {
    setTimeout(createWidget, 2000);
  }
})();
