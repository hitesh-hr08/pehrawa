(function () {
  // Skip on admin pages
  if (window.location.pathname.indexOf("/admin") === 0) return;

  // Check if loader already dismissed this session
  if (sessionStorage.getItem("pehrawa_loader_done")) return;

  function create() {
    var loader = document.createElement("div");
    loader.id = "premiumLoader";
    loader.className = "premium-loader";
    loader.innerHTML =
      '<div class="pl-inner">' +
      '<div class="pl-logo-wrap">' +
      '<div class="pl-ring"></div>' +
      '<img src="' + getLogoPath() + '" alt="Pehrawa" class="pl-logo">' +
      '</div>' +
      '<div class="pl-tagline">Premium Menswear</div>' +
      '<div class="pl-bar"><div class="pl-bar-fill"></div></div>' +
      '</div>';

    // Inline critical styles
    var style = document.createElement("style");
    style.textContent =
      '.premium-loader{position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:999999;display:flex;align-items:center;justify-content:center;transition:opacity .5s,visibility .5s;}' +
      '.premium-loader.pl-hide{opacity:0;visibility:hidden;pointer-events:none;}' +
      '.pl-inner{text-align:center;}' +
      '.pl-logo-wrap{position:relative;width:100px;height:100px;margin:0 auto 20px;}' +
      '.pl-ring{position:absolute;top:-10px;left:-10px;width:120px;height:120px;border:2px solid transparent;border-top-color:#ff6b00;border-radius:50%;animation:plSpin 1.2s linear infinite;}' +
      '.pl-logo{width:100px;height:auto;opacity:0;animation:plFadeIn .6s .3s forwards;}' +
      '.pl-tagline{color:#666;font-size:11px;letter-spacing:4px;text-transform:uppercase;margin-bottom:24px;font-family:Poppins,sans-serif;}' +
      '.pl-bar{width:200px;height:2px;background:#1a1a1a;border-radius:1px;margin:0 auto;overflow:hidden;}' +
      '.pl-bar-fill{width:0;height:100%;background:linear-gradient(90deg,#ff6b00,#ff8c33);border-radius:1px;animation:plBar 1.5s .2s ease-out forwards;}' +
      '@keyframes plSpin{to{transform:rotate(360deg);}}' +
      '@keyframes plFadeIn{to{opacity:1;}}' +
      '@keyframes plBar{to{width:100%;}}';
    document.head.appendChild(style);
    document.body.appendChild(loader);
    document.body.style.overflow = "hidden";

    setTimeout(function () {
      loader.classList.add("pl-hide");
      document.body.style.overflow = "";
      sessionStorage.setItem("pehrawa_loader_done", "1");
      setTimeout(function () { loader.remove(); }, 600);
    }, 1800);
  }

  function getLogoPath() {
    var path = window.location.pathname;
    if (path.indexOf("/admin") === 0) return "../images/logo.png";
    return "../images/logo.png";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", create);
  } else {
    create();
  }
})();
