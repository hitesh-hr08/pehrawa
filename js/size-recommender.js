(function () {
  var sizeChart = {
    "T-SHIRTS": { XS: { chest: [34, 36], length: [25, 26] }, S: { chest: [36, 38], length: [26, 27] }, M: { chest: [38, 40], length: [27, 28] }, L: { chest: [40, 42], length: [28, 29] }, XL: { chest: [42, 44], length: [29, 30] }, XXL: { chest: [44, 46], length: [30, 31] } },
    "SHIRTS": { S: { chest: [36, 38] }, M: { chest: [38, 40] }, L: { chest: [40, 42] }, XL: { chest: [42, 44] }, XXL: { chest: [44, 46] } },
    "JEANS": { "28": { waist: [28, 29] }, "30": { waist: [30, 31] }, "32": { waist: [32, 33] }, "34": { waist: [34, 35] }, "36": { waist: [36, 37] } },
    "FOOTWEAR": { "EU 39": { eu: 39 }, "EU 40": { eu: 40 }, "EU 41": { eu: 41 }, "EU 42": { eu: 42 }, "EU 43": { eu: 43 }, "EU 44": { eu: 44 } }
  };

  window.PehrawaSizeRecommender = {
    open: function () {
      var overlay = document.createElement("div");
      overlay.className = "checkout-overlay active";
      overlay.id = "sizeRecOverlay";
      overlay.innerHTML = '<div class="checkout-modal" style="max-width:460px;">' +
        '<span class="checkout-close" onclick="document.getElementById(\'sizeRecOverlay\').remove()">&times;</span>' +
        '<h3 style="margin-bottom:4px;">AI Size Recommendation</h3>' +
        '<p style="color:#888;font-size:13px;margin-bottom:16px;">Tell us your measurements and we\'ll find your perfect fit.</p>' +
        '<form id="sizeRecForm" style="display:flex;flex-direction:column;gap:12px;">' +
        '<div><label style="color:#888;font-size:12px;">Height (cm)</label>' +
        '<input type="number" id="srHeight" placeholder="175" min="100" max="250" style="width:100%;padding:12px;background:#0b0b0b;border:1px solid #333;color:#fff;border-radius:6px;margin-top:4px;"></div>' +
        '<div><label style="color:#888;font-size:12px;">Weight (kg)</label>' +
        '<input type="number" id="srWeight" placeholder="70" min="30" max="200" style="width:100%;padding:12px;background:#0b0b0b;border:1px solid #333;color:#fff;border-radius:6px;margin-top:4px;"></div>' +
        '<div><label style="color:#888;font-size:12px;">Body Type</label>' +
        '<select id="srBody" style="width:100%;padding:12px;background:#0b0b0b;border:1px solid #333;color:#fff;border-radius:6px;margin-top:4px;">' +
        '<option value="lean">Lean / Slim</option>' +
        '<option value="athletic">Athletic / Muscular</option>' +
        '<option value="regular" selected>Regular</option>' +
        '<option value="chubby">Chubby / Plus</option>' +
        '</select></div>' +
        '<div><label style="color:#888;font-size:12px;">Preferred Fit</label>' +
        '<select id="srFit" style="width:100%;padding:12px;background:#0b0b0b;border:1px solid #333;color:#fff;border-radius:6px;margin-top:4px;">' +
        '<option value="slim">Slim Fit</option>' +
        '<option value="regular" selected>Regular Fit</option>' +
        '<option value="loose">Loose / Oversized</option>' +
        '</select></div>' +
        '<button type="submit" style="padding:14px;background:#fff;color:#000;border:none;border-radius:6px;font-weight:700;cursor:pointer;">Get Recommendation</button>' +
        '</form>' +
        '<div id="sizeRecResult" style="display:none;margin-top:16px;padding:16px;background:#111;border-radius:8px;border:1px solid #333;"></div>' +
        '</div>';
      document.body.appendChild(overlay);

      document.getElementById("sizeRecForm").addEventListener("submit", function (e) {
        e.preventDefault();
        var height = parseInt(document.getElementById("srHeight").value) || 0;
        var weight = parseInt(document.getElementById("srWeight").value) || 0;
        var body = document.getElementById("srBody").value;
        var fit = document.getElementById("srFit").value;
        if (!height || !weight) { if (typeof showToast === "function") showToast("Enter height and weight"); return; }

        var bmi = weight / ((height / 100) * (height / 100));
        var chestInch = Math.round(height * 0.48 + (bmi - 22) * 0.8);
        var waistInch = Math.round(chestInch - 6 + (bmi - 22) * 0.5);

        if (fit === "slim") { chestInch -= 1; waistInch -= 1; }
        if (fit === "loose") { chestInch += 2; waistInch += 2; }

        var recommended = "M";
        if (chestInch <= 36) recommended = "S";
        else if (chestInch <= 38) recommended = "M";
        else if (chestInch <= 40) recommended = "L";
        else if (chestInch <= 42) recommended = "XL";
        else recommended = "XXL";

        var allSizes = ["S", "M", "L", "XL", "XXL"];
        var sizeIdx = allSizes.indexOf(recommended);
        var alt1 = allSizes[Math.max(0, sizeIdx - 1)];
        var alt2 = allSizes[Math.min(allSizes.length - 1, sizeIdx + 1)];

        var resultEl = document.getElementById("sizeRecResult");
        resultEl.style.display = "block";
        resultEl.innerHTML = '<div style="text-align:center;">' +
          '<div style="font-size:11px;color:#888;letter-spacing:2px;margin-bottom:8px;">YOUR RECOMMENDED SIZE</div>' +
          '<div style="font-size:48px;font-weight:800;color:#fff;margin-bottom:8px;">' + recommended + '</div>' +
          '<div style="color:#aaa;font-size:13px;margin-bottom:12px;">Est. chest: ~' + chestInch + '" | Est. waist: ~' + waistInch + '"</div>' +
          '<div style="display:flex;gap:8px;justify-content:center;">' +
          '<span style="padding:6px 14px;background:#1a1a1a;border-radius:4px;color:#888;font-size:12px;">Also try: ' + alt1 + '</span>' +
          '<span style="padding:6px 14px;background:#1a1a1a;border-radius:4px;color:#888;font-size:12px;">Or: ' + alt2 + '</span>' +
          '</div>' +
          '<p style="color:#666;font-size:11px;margin-top:12px;">This is an AI estimate. For best fit, check our <a href="/size-guide" style="color:#fff;text-decoration:underline;">Size Guide</a>.</p>' +
          '</div>';
      });
    }
  };
})();
