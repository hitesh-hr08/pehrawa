// === PEHRAWA ANALYTICS ===
(function () {
  var api = window.PEHRAWA_API_BASE || (window.location.protocol + "//" + window.location.host);
  var vid = localStorage.getItem("pehrawa_visitor_id");
  if (!vid) {
    vid = "v_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("pehrawa_visitor_id", vid);
  }

  var data = JSON.stringify({
    visitor_id: vid,
    page_path: window.location.pathname,
    referrer: document.referrer || ""
  });

  try {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", api + "/api/public/track/pageview", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(data);
  } catch (e) {}

  // Visit heartbeat every 30s to track active time
  setInterval(function () {
    try {
      var hb = new XMLHttpRequest();
      hb.open("POST", api + "/api/public/track/pageview", true);
      hb.setRequestHeader("Content-Type", "application/json");
      hb.send(data);
    } catch (e) {}
  }, 30000);
})();

// === TRACKING CONFIG (GA4 + Meta Pixel) ===
var GA_MEASUREMENT_ID = "";
var META_PIXEL_ID = "";

if (GA_MEASUREMENT_ID) {
  (function () {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID);
  })();
}

if (META_PIXEL_ID) {
  (function () {
    var s = document.createElement("script");
    s.innerHTML = "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','" + META_PIXEL_ID + "');fbq('track','PageView');";
    document.head.appendChild(s);
    var n = document.createElement("noscript");
    n.innerHTML = '<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=" + META_PIXEL_ID + "&ev=PageView&noscript=1">';
    document.head.appendChild(n);
  })();
}
