const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    let result = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      if (process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL) {
        const hash = await bcrypt.hash(password, 10);
        await pool.query(
          "INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)",
          [process.env.ADMIN_NAME || "Admin", email, hash]
        );
        result = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);
      } else {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }
    }

    const admin = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: "admin"
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;
