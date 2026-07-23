(function () {
  var searchInputs = document.querySelectorAll(".search-input");
  var debounceTimer = null;

  searchInputs.forEach(function (input) {
    var wrapper = input.closest(".search-wrapper") || input.parentElement;
    var dropdown = document.createElement("div");
    dropdown.className = "ss-dropdown";
    dropdown.style.display = "none";
    wrapper.appendChild(dropdown);

    input.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      var q = input.value.trim();
      if (q.length < 2) { dropdown.style.display = "none"; return; }
      debounceTimer = setTimeout(function () { fetchSuggestions(q, dropdown); }, 250);
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        var q = input.value.trim();
        if (q) {
          dropdown.style.display = "none";
          window.location.href = "/shop?search=" + encodeURIComponent(q);
        }
      }
    });

    document.addEventListener("click", function (e) {
      if (!wrapper.contains(e.target)) dropdown.style.display = "none";
    });
  });

  function fetchSuggestions(q, dropdown) {
    var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/public/search?q=" + encodeURIComponent(q);
    fetch(api)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.success || !data.products || data.products.length === 0) {
          dropdown.innerHTML = '<div class="ss-empty">No products found for "' + q + '"</div>';
          dropdown.style.display = "block";
          return;
        }
        var html = '<div class="ss-results">';
        data.products.slice(0, 6).forEach(function (p) {
          var img = p.image_url || "../images/product1.png";
          var price = Number(p.price) || 0;
          html += '<a href="/product?id=' + p.id + '" class="ss-item">' +
            '<img src="' + img + '" class="ss-thumb" alt="' + p.name + '">' +
            '<div class="ss-item-info"><span class="ss-item-name">' + highlightMatch(p.name, q) + '</span>' +
            '<span class="ss-item-price">&#8377;' + price.toFixed(0) + '</span>' +
            '<span class="ss-item-cat">' + (p.category || "") + '</span></div></a>';
        });
        html += '</div>';
        if (data.products.length > 6) {
          html += '<a href="/shop?search=' + encodeURIComponent(q) + '" class="ss-view-all">View all ' + data.total + ' results &rarr;</a>';
        }
        dropdown.innerHTML = html;
        dropdown.style.display = "block";
      })
      .catch(function () { dropdown.style.display = "none"; });
  }

  function highlightMatch(text, q) {
    if (!q) return text;
    var regex = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
    return text.replace(regex, '<mark>$1</mark>');
  }

  var params = new URLSearchParams(window.location.search);
  var searchQ = params.get("search");
  if (searchQ) {
    searchInputs.forEach(function (input) { input.value = searchQ; });
  }
})();
