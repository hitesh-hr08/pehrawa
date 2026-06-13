(function () {
  var api = window.location.protocol + "//" + window.location.host;
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    api = "http://localhost:5000";
  }
  window.PEHRAWA_API_BASE = api;
})();
