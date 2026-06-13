const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function makeToken(customer) {
  return jwt.sign(
    {
      id: customer.id,
      email: customer.email,
      role: "customer"
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const existing = await pool.query("SELECT * FROM customers WHERE email = $1", [email]);
    const customer = existing.rows[0];

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Account not found. Please register first."
      });
    }

    if (!customer.password) {
      return res.status(401).json({
        success: false,
        message: "Please set a password by registering first."
      });
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      token: makeToken(customer),
      customer: {
        id: customer.id,
        name: customer.name || customer.email.split("@")[0],
        email: customer.email,
        phone: customer.phone
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim() || null;
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const phone = String(req.body.phone || "").trim() || null;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO customers (name, email, password, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, email, hashedPassword, phone]
    );
    const customer = result.rows[0];

    res.status(201).json({
      success: true,
      message: "Customer account created",
      token: makeToken(customer),
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      }
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Customer already exists. Please login."
      });
    }

    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
