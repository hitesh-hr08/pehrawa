(function () {
  var STORAGE_KEY = "pehrawa_recently_viewed";
  var MAX_ITEMS = 12;

  function getRecentlyViewed() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (e) { return []; }
  }

  function addRecentlyViewed(product) {
    var items = getRecentlyViewed();
    items = items.filter(function (i) { return i.id !== product.id; });
    items.unshift({
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      original_price: product.original_price ? Number(product.original_price) : null,
      image: product.image_url || "../images/product1.png",
      category: product.category || "",
      timestamp: Date.now()
    });
    if (items.length > MAX_ITEMS) items = items.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function renderRecentlyViewed() {
    var el = document.getElementById("recentlyViewedSection");
    if (!el) return;
    var items = getRecentlyViewed().filter(function (i) {
      return Date.now() - i.timestamp < 7 * 24 * 60 * 60 * 1000;
    });
    if (items.length === 0) { el.style.display = "none"; return; }
    el.style.display = "block";

    var html = '<div class="rv-grid">';
    items.slice(0, 8).forEach(function (item) {
      var orig = item.original_price || Math.round(item.price * 1.5);
      var disc = orig > item.price ? Math.round((1 - item.price / orig) * 100) : 0;
      html += '<a href="/product?id=' + item.id + '" class="rv-card">' +
        '<div class="rv-img"><img src="' + item.image + '" alt="' + item.name + '" onerror="this.src=\'../images/product1.png\'">' +
        (disc > 0 ? '<span class="rv-disc">-' + disc + '%</span>' : '') +
        '</div>' +
        '<div class="rv-info"><h4>' + item.name + '</h4>' +
        '<div class="rv-price">&#8377;' + item.price.toFixed(0) +
        (disc > 0 ? '<span class="rv-orig">&#8377;' + orig + '</span>' : '') +
        '</div></div></a>';
    });
    html += '</div>';
    el.querySelector(".rv-container").innerHTML = html;
  }

  window.PehrawaRecentlyViewed = { add: addRecentlyViewed, render: renderRecentlyViewed };

  document.addEventListener("DOMContentLoaded", function () {
    var params = new URLSearchParams(window.location.search);
    var pid = params.get("id");
    if (pid) {
      var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/public/products/" + pid;
      fetch(api).then(function (r) { return r.json(); }).then(function (data) {
        if (data.success && data.product) addRecentlyViewed(data.product);
      }).catch(function () {});
    }
    renderRecentlyViewed();
  });
})();
