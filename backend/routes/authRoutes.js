const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const pool = require("../db");
const jwt = require("jsonwebtoken");

function makeToken(customer) {
  return jwt.sign(
    { id: customer.id, email: customer.email, role: "customer" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
var BASE_URL = process.env.BASE_URL || "https://pehrawa-api.onrender.com";
var FRONTEND_URL = process.env.FRONTEND_URL || "https://pehrawa.store";

if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID" || GOOGLE_CLIENT_ID === "dummy") {
  console.warn("[AUTH] WARNING: GOOGLE_CLIENT_ID is not set. Google Sign-In will not work.");
  console.warn("[AUTH] Set GOOGLE_CLIENT_ID in Render Environment Variables.");
}
if (!GOOGLE_CLIENT_SECRET || GOOGLE_CLIENT_SECRET === "YOUR_GOOGLE_CLIENT_SECRET" || GOOGLE_CLIENT_SECRET === "dummy") {
  console.warn("[AUTH] WARNING: GOOGLE_CLIENT_SECRET is not set. Google Sign-In will not work.");
  console.warn("[AUTH] Set GOOGLE_CLIENT_SECRET in Render Environment Variables.");
}

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET &&
    GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID" && GOOGLE_CLIENT_ID !== "dummy") {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: BASE_URL + "/api/auth/google/callback"
  }, async function (accessToken, refreshToken, profile, done) {
    try {
      const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || profile.id + "@google.com";
      const name = profile.displayName || email.split("@")[0];
      const googleId = profile.id;

      var existing = await pool.query("SELECT * FROM customers WHERE email = $1", [email]);
      var customer;

      if (existing.rows.length > 0) {
        customer = existing.rows[0];
        if (!customer.google_id) {
          await pool.query("UPDATE customers SET google_id = $1, name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3", [googleId, name, customer.id]);
        }
      } else {
        var photo = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
        var result = await pool.query(
          "INSERT INTO customers (name, email, google_id, image_url) VALUES ($1, $2, $3, $4) RETURNING *",
          [name, email, googleId, photo]
        );
        customer = result.rows[0];
      }

      return done(null, customer);
    } catch (err) {
      return done(err, null);
    }
  }));
}

passport.serializeUser(function (user, done) { done(null, user.id); });
passport.deserializeUser(async function (id, done) {
  try {
    var result = await pool.query("SELECT * FROM customers WHERE id = $1", [id]);
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err, null);
  }
});

router.get("/google", function (req, res) {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID" || GOOGLE_CLIENT_ID === "dummy") {
    return res.status(503).json({ success: false, message: "Google Sign-In is not configured. Please set GOOGLE_CLIENT_ID in server environment." });
  }
  passport.authenticate("google", { scope: ["profile", "email"], state: req.query.redirect || "/" })(req, res);
});

router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: FRONTEND_URL + "/login?error=google_failed" }),
  function (req, res) {
    if (!req.user) {
      return res.redirect(FRONTEND_URL + "/login?error=failed");
    }

    var token = makeToken(req.user);
    var hasPassword = req.user.password ? "true" : "false";
    var customer = JSON.stringify({ id: req.user.id, name: req.user.name, email: req.user.email, phone: req.user.phone || "" });
    var redirect = req.query.state || "/";
    if (redirect === "redirect" || !redirect || redirect === "home.html") redirect = "/";

    var url = FRONTEND_URL + "/auth-callback?token=" + encodeURIComponent(token) + "&customer=" + encodeURIComponent(customer) + "&redirect=" + encodeURIComponent(redirect) + "&hasPassword=" + hasPassword;
    res.redirect(url);
  }
);

module.exports = router;
