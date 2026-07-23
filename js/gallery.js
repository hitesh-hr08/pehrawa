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
        var fd = new FormData();
        fd.append("image", file);
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
