(function () {
  var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/public/vault";

  window.PehrawaVault = {
    open: function () {
      var existing = document.getElementById("vaultOverlay");
      if (existing) return;

      var overlay = document.createElement("div");
      overlay.className = "checkout-overlay active";
      overlay.id = "vaultOverlay";
      overlay.innerHTML = '<div class="vault-modal">' +
        '<span class="checkout-close" onclick="document.getElementById(\'vaultOverlay\').remove()">&times;</span>' +
        '<div class="vault-header">' +
        '<div class="vault-icon"><i class="fa-solid fa-lock"></i></div>' +
        '<h2>PEHRAWA VAULT</h2>' +
        '<p>Exclusive access-only collection</p>' +
        '</div>' +
        '<div id="vaultContent">' +
        '<div class="vault-access-form">' +
        '<input type="text" id="vaultCode" placeholder="Enter vault access code" style="width:100%;padding:14px;background:#0b0b0b;border:1px solid #333;color:#fff;border-radius:8px;font-size:15px;text-align:center;letter-spacing:4px;text-transform:uppercase;">' +
        '<button onclick="PehrawaVault.access()" style="width:100%;padding:14px;background:#fff;color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer;margin-top:12px;">Enter Vault</button>' +
        '</div>' +
        '</div></div>';
      document.body.appendChild(overlay);

      document.getElementById("vaultCode").addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); PehrawaVault.access(); }
      });
    },

    access: function () {
      var code = (document.getElementById("vaultCode").value || "").trim();
      if (!code) { if (typeof showToast === "function") showToast("Enter access code"); return; }

      var content = document.getElementById("vaultContent");
      content.innerHTML = '<div style="text-align:center;padding:30px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:#fff;"></i></div>';

      fetch(api + "/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success && data.products && data.products.length > 0) {
            renderVaultProducts(data.products, code);
          } else {
            content.innerHTML = '<div style="text-align:center;padding:30px;">' +
              '<i class="fa-solid fa-lock" style="font-size:40px;color:#ff3f3f;margin-bottom:12px;"></i>' +
              '<p style="color:#ff3f3f;">Invalid access code</p>' +
              '<button onclick="document.getElementById(\'vaultContent\').innerHTML=\'<div class=vault-access-form><input type=text id=vaultCode placeholder=Enter vault access code style=width:100%;padding:14px;background:#0b0b0b;border:1px solid #333;color:#fff;border-radius:8px;font-size:15px;text-align:center;letter-spacing:4px;text-transform:uppercase;><button onclick=PehrawaVault.access() style=width:100%;padding:14px;background:#fff;color:#000;border:none;border-radius:8px;font-weight:700;cursor:pointer;margin-top:12px;>Enter Vault</button></div>\';" style="margin-top:12px;padding:10px 20px;background:#1a1a1a;border:1px solid #333;color:#fff;border-radius:6px;cursor:pointer;">Try Again</button>' +
              '</div>';
          }
        })
        .catch(function () {
          content.innerHTML = '<div style="text-align:center;padding:30px;"><p style="color:#ff3f3f;">Connection error</p></div>';
        });
    }
  };

  function renderVaultProducts(products, code) {
    var content = document.getElementById("vaultContent");
    var html = '<div class="vault-products">';
    products.forEach(function (p) {
      var img = p.image_url || "../images/product1.png";
      var price = Number(p.vault_price) || Number(p.price) || 0;
      var orig = p.original_price ? Number(p.original_price) : Math.round(price * 1.5);
      var disc = orig > price ? Math.round((1 - price / orig) * 100) : 0;
      html += '<a href="/product?id=' + p.product_id + '" class="vault-item">' +
        '<div class="vault-item-img"><img src="' + img + '" alt="' + p.name + '">' +
        '<span class="vault-item-badge">VAULT EXCLUSIVE</span></div>' +
        '<div class="vault-item-info"><h4>' + p.name + '</h4>' +
        '<div class="vault-item-price">&#8377;' + price.toFixed(0) +
        '<span class="vault-item-orig">&#8377;' + orig + '</span>' +
        '<span class="vault-item-disc">' + disc + '% OFF</span></div>' +
        '</div></a>';
    });
    html += '</div>';
    content.innerHTML = html;
  }
})();
