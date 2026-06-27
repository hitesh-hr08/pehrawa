// === TRACKING CONFIG ===
// Replace these with your actual IDs once you create the accounts.
var GA_MEASUREMENT_ID = "";   // e.g. "G-XXXXXXXXXX"
var META_PIXEL_ID = "";       // e.g. "1234567890"

// Google Analytics 4
if (GA_MEASUREMENT_ID) {
  var gaScript = document.createElement("script");
  gaScript.async = true;
  gaScript.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
  document.head.appendChild(gaScript);
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);
}

// Meta Pixel
if (META_PIXEL_ID) {
  var fbScript = document.createElement("script");
  fbScript.innerHTML = `
    !function(f,b,e,v,n,t,s){
      if(f.fbq)return; n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n; n.push=n; n.loaded=!0; n.version='2.0';
      n.queue=[]; t=b.createElement(e); t.async=!0;
      t.src=v; s=b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t,s);
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${META_PIXEL_ID}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(fbScript);
  var fbNoscript = document.createElement("noscript");
  fbNoscript.innerHTML = '<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=' + META_PIXEL_ID + '&ev=PageView&noscript=1">';
  document.head.appendChild(fbNoscript);
}
