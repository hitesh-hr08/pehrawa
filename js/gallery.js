(function () {
  var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/public/gallery";

  function init() {
    fetch(api)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success && data.gallery && data.gallery.length > 0) renderGallery(data.gallery);
        else { var el = document.getElementById("gallerySection"); if (el) el.style.display = "none"; }
      })
      .catch(function () { var el = document.getElementById("gallerySection"); if (el) el.style.display = "none"; });
  }

  function renderGallery(photos) {
    var section = document.getElementById("gallerySection");
    if (!section) return;
    section.style.display = "block";

    var html = '<div class="gallery-masonry">';
    photos.forEach(function (photo) {
      html += '<div class="gallery-item">' +
        '<img src="' + photo.image_url + '" alt="' + (photo.customer_name || "Customer") + '" loading="lazy">' +
        '<div class="gallery-overlay">' +
        '<span class="gallery-customer"><i class="fa-solid fa-user"></i> ' + (photo.customer_name || "Anonymous") + '</span>' +
        (photo.product_name ? '<span class="gallery-product"><i class="fa-solid fa-shirt"></i> ' + photo.product_name + '</span>' : '') +
        (photo.caption ? '<span class="gallery-caption">' + photo.caption + '</span>' : '') +
        '</div></div>';
    });
    html += '</div>';
    html += '<div class="gallery-cta"><p>Get featured! Tag us <strong>@pehrawa.store</strong> on Instagram</p></div>';
    section.querySelector(".gallery-container").innerHTML = html;
  }

  window.PehrawaGallery = {
    upload: function () {
      var input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = function () {
        var file = input.files[0];
        if (!file) return;
        function doUpload(f) {
          var fd = new FormData();
          fd.append("image", f);
          fd.append("caption", "Styled by Pehrawa");
          var token = window.getCustomerToken ? window.getCustomerToken() : "";
          fetch(api, {
            method: "POST",
            headers: token ? { "Authorization": "Bearer " + token } : {},
            body: fd
          })
            .then(function (r) { return r.json(); })
            .then(function (data) {
              if (data.success) {
                if (typeof showToast === "function") showToast("Photo submitted for review!");
                init();
              }
            })
            .catch(function () {
              if (typeof showToast === "function") showToast("Upload failed");
            });
        }
        if (file.size > 500000) {
          var img = new Image();
          var url = URL.createObjectURL(file);
          img.onload = function () {
            var w = img.width, h = img.height;
            if (w > 1200) { h = h * 1200 / w; w = 1200; }
            if (h > 1600) { w = w * 1600 / h; h = 1600; }
            var canvas = document.createElement("canvas");
            canvas.width = w; canvas.height = h;
            canvas.getContext("2d").drawImage(img, 0, 0, w, h);
            canvas.toBlob(function (blob) {
              URL.revokeObjectURL(url);
              doUpload(new File([blob], file.name, { type: "image/jpeg" }));
            }, "image/jpeg", 0.8);
          };
          img.src = url;
        } else {
          doUpload(file);
        }
      };
      input.click();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
