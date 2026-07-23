(function () {
  var api = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/public/style-quiz";
  var questions = [];
  var currentQ = 0;
  var answers = {};
  var quizStarted = false;

  function init() {
    var container = document.getElementById("quizContainer");
    if (!container) return;
    loadQuestions();
  }

  function loadQuestions() {
    fetch(api + "/questions")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success && data.questions) {
          questions = data.questions;
          renderStart();
        }
      })
      .catch(function () {
        var el = document.getElementById("quizContainer");
        if (el) el.innerHTML = '<div class="quiz-error"><i class="fa-solid fa-triangle-exclamation"></i><p>Failed to load quiz. Please try again.</p><button onclick="location.reload()">Retry</button></div>';
      });
  }

  function renderStart() {
    var container = document.getElementById("quizContainer");
    if (!container) return;
    container.innerHTML =
      '<div class="quiz-start">' +
        '<div class="quiz-start-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></div>' +
        '<h2>Discover Your Style DNA</h2>' +
        '<p>Answer 5 quick questions and we\'ll identify your unique style profile and recommend the perfect pieces for you.</p>' +
        '<div class="quiz-start-features">' +
          '<div class="quiz-feature"><i class="fa-solid fa-bolt"></i><span>5 Questions</span></div>' +
          '<div class="quiz-feature"><i class="fa-solid fa-clock"></i><span>30 Seconds</span></div>' +
          '<div class="quiz-feature"><i class="fa-solid fa-gift"></i><span>Personalized Picks</span></div>' +
        '</div>' +
        '<button class="quiz-start-btn" onclick="PehrawaQuiz.start()">Start Quiz <i class="fa-solid fa-arrow-right"></i></button>' +
      '</div>';
  }

  function start() {
    currentQ = 0;
    answers = {};
    quizStarted = true;
    renderQuestion();
  }

  function renderQuestion() {
    var container = document.getElementById("quizContainer");
    if (!container || currentQ >= questions.length) { renderResult(); return; }

    var q = questions[currentQ];
    var progress = ((currentQ) / questions.length) * 100;

    var html = '<div class="quiz-active">';
    html += '<div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:' + progress + '%"></div></div>';
    html += '<div class="quiz-progress-text">Question ' + (currentQ + 1) + ' of ' + questions.length + '</div>';
    html += '<div class="quiz-question">';
    html += '<h3>' + q.text + '</h3>';
    html += '<div class="quiz-options">';
    q.options.forEach(function (opt, i) {
      var isSelected = answers[q.id] === i;
      html += '<button class="quiz-option' + (isSelected ? ' quiz-selected' : '') + '" onclick="PehrawaQuiz.answer(' + q.id.replace("q", "") + ',' + i + ')">';
      html += '<span class="quiz-option-text">' + opt.label + '</span>';
      html += '<i class="fa-solid fa-check quiz-check"></i>';
      html += '</button>';
    });
    html += '</div>';
    html += '<div class="quiz-nav">';
    if (currentQ > 0) html += '<button class="quiz-prev" onclick="PehrawaQuiz.prev()"><i class="fa-solid fa-arrow-left"></i> Back</button>';
    html += '<button class="quiz-next" id="quizNextBtn" onclick="PehrawaQuiz.next()" ' + (answers[q.id] === undefined ? 'disabled' : '') + '>Next <i class="fa-solid fa-arrow-right"></i></button>';
    html += '</div>';
    html += '</div></div>';
    container.innerHTML = html;
  }

  function answer(qIdx, optIdx) {
    answers["q" + qIdx] = optIdx;
    renderQuestion();
  }

  function next() {
    var q = questions[currentQ];
    if (answers[q.id] === undefined) return;
    if (currentQ < questions.length - 1) {
      currentQ++;
      renderQuestion();
    } else {
      submitQuiz();
    }
  }

  function prev() {
    if (currentQ > 0) {
      currentQ--;
      renderQuestion();
    }
  }

  function submitQuiz() {
    var container = document.getElementById("quizContainer");
    if (!container) return;
    container.innerHTML =
      '<div class="quiz-loading">' +
        '<div class="quiz-loading-spinner"></div>' +
        '<p>Analyzing your style DNA...</p>' +
      '</div>';

    var token = window.getCustomerToken ? window.getCustomerToken() : "";

    fetch(api + "/submit", {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, token ? { "Authorization": "Bearer " + token } : {}),
      body: JSON.stringify({ answers: answers })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success && data.result) {
          renderResult(data.result);
        } else {
          container.innerHTML = '<div class="quiz-error"><i class="fa-solid fa-triangle-exclamation"></i><p>Failed to process quiz. Please try again.</p><button onclick="PehrawaQuiz.start()">Retry</button></div>';
        }
      })
      .catch(function () {
        container.innerHTML = '<div class="quiz-error"><i class="fa-solid fa-triangle-exclamation"></i><p>Connection error. Please try again.</p><button onclick="PehrawaQuiz.start()">Retry</button></div>';
      });
  }

  function renderResult(result) {
    var container = document.getElementById("quizContainer");
    if (!container) return;

    if (!result) { renderStart(); return; }

    var profile = result.profile || {};
    var scores = result.scores || {};
    var products = result.products || [];

    var html = '<div class="quiz-result">';
    html += '<div class="quiz-result-hero" style="border-color:' + (profile.color || "#ff6b00") + '">';
    html += '<div class="quiz-result-icon" style="background:' + (profile.color || "#ff6b00") + '"><i class="fa-solid ' + (profile.icon || "fa-star") + '"></i></div>';
    html += '<h2>Your Style DNA</h2>';
    html += '<div class="quiz-result-type" style="color:' + (profile.color || "#ff6b00") + '">' + (profile.name || "Trendsetter") + '</div>';
    html += '<p class="quiz-result-desc">' + (profile.description || "You have a unique style!") + '</p>';
    html += '</div>';

    // Score breakdown
    html += '<div class="quiz-scores">';
    html += '<h3>Your Style Breakdown</h3>';
    var maxScore = 15;
    var styleNames = { minimal: "Minimalist", bold: "Bold", classic: "Classic", street: "Street", sporty: "Sporty" };
    var styleColors = { minimal: "#888", bold: "#ff6b00", classic: "#ffd700", street: "#3498db", sporty: "#2ecc71" };
    for (var style in scores) {
      var pct = Math.min(100, (scores[style] / maxScore) * 100);
      html += '<div class="quiz-score-row">';
      html += '<span class="quiz-score-label">' + (styleNames[style] || style) + '</span>';
      html += '<div class="quiz-score-bar"><div class="quiz-score-fill" style="width:' + pct + '%;background:' + (styleColors[style] || "#666") + '"></div></div>';
      html += '<span class="quiz-score-val">' + scores[style] + '</span>';
      html += '</div>';
    }
    html += '</div>';

    // Recommended products
    if (products.length > 0) {
      html += '<div class="quiz-products">';
      html += '<h3>Picked For Your Style</h3>';
      html += '<div class="quiz-products-grid">';
      products.forEach(function (p) {
        var img = p.image_url || "../images/product1.png";
        var price = Number(p.price) || 0;
        var orig = p.original_price ? Number(p.original_price) : null;
        html += '<a href="/product?id=' + p.id + '" class="quiz-prod-card">';
        html += '<div class="quiz-prod-img"><img src="' + img + '" alt="' + (p.name || "") + '" loading="lazy">';
        if (orig && orig > price) {
          var disc = Math.round((1 - price / orig) * 100);
          html += '<span class="quiz-prod-disc">-' + disc + '%</span>';
        }
        html += '</div>';
        html += '<div class="quiz-prod-info">';
        html += '<span class="quiz-prod-name">' + (p.name || "") + '</span>';
        html += '<span class="quiz-prod-price">₹' + price + '</span>';
        html += '</div></a>';
      });
      html += '</div></div>';
    }

    // Actions
    html += '<div class="quiz-actions">';
    html += '<a href="/shop" class="quiz-action-primary"><i class="fa-solid fa-bag-shopping"></i> Shop Now</a>';
    html += '<button class="quiz-action-secondary" onclick="PehrawaQuiz.start()"><i class="fa-solid fa-rotate-right"></i> Retake Quiz</button>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  }

  window.PehrawaQuiz = {
    start: start,
    answer: answer,
    next: next,
    prev: prev
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
