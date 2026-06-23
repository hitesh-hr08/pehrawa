const path = require("path");
const fs = require("fs");
const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const profileDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "..", "uploads");
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || ".png";
    cb(null, "profile-" + unique + ext);
  }
});
const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype.split("/")[1]);
    if (extOk || mimeOk) return cb(null, true);
    cb(new Error("Only image files (jpg, png, gif, webp) are allowed"));
  }
});

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
        message: "This account uses Google Sign-In. Please sign in with Google."
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
        phone: customer.phone,
        image_url: customer.image_url || null
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
        phone: customer.phone,
        image_url: customer.image_url || null
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

function verifyCustomer(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Login required" });
  }
  try {
    const decoded = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    if (decoded.role !== "customer") {
      return res.status(403).json({ success: false, message: "Customer access required" });
    }
    pool.query("SELECT id FROM customers WHERE id = $1", [decoded.id]).then(function (result) {
      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, message: "Account deleted" });
      }
      req.customer = decoded;
      next();
    }).catch(function () {
      return res.status(500).json({ success: false, message: "Server error" });
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Session expired" });
  }
}

router.get("/:id/orders", verifyCustomer, async (req, res) => {
  try {
    if (Number(req.params.id) !== req.customer.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    // Get orders by customer_id AND also by phone (for orders placed before customer_id fix)
    const result = await pool.query(
      `SELECT id, customer_name, phone, address, total_amount, status, items, created_at FROM orders
       WHERE customer_id = $1 OR (customer_id IS NULL AND phone = $2)
       ORDER BY created_at DESC`,
      [req.params.id, req.customer.phone]
    );
    var orders = result.rows.map(function (o) {
      o.tracking_id = "PHR-" + String(o.id).padStart(6, "0");
      return o;
    });
    res.json({ success: true, orders: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load orders" });
  }
});

router.post("/:id/profile-picture", verifyCustomer, function (req, res) {
  if (Number(req.params.id) !== req.customer.id) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  profileUpload.single("profile_picture")(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    try {
      const url = "/uploads/" + req.file.filename;
      await pool.query("UPDATE customers SET image_url = $1, updated_at = NOW() WHERE id = $2", [url, req.params.id]);
      const result = await pool.query("SELECT id, name, email, phone, image_url FROM customers WHERE id = $1", [req.params.id]);
      const customer = result.rows[0];
      res.json({
        success: true,
        message: "Profile picture updated",
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          image_url: customer.image_url
        }
      });
    } catch (dbErr) {
      res.status(500).json({ success: false, message: "Database error" });
    }
  });
});

router.delete("/:id/profile-picture", verifyCustomer, async (req, res) => {
  try {
    if (Number(req.params.id) !== req.customer.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    const result = await pool.query(
      "UPDATE customers SET image_url = NULL, updated_at = NOW() WHERE id = $1 RETURNING id, name, email, phone, image_url",
      [req.params.id]
    );
    const customer = result.rows[0];
    res.json({
      success: true,
      message: "Profile picture removed",
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        image_url: null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Database error" });
  }
});

router.post("/set-password", async (req, res) => {
  try {
    var email = String(req.body.email || "").trim().toLowerCase();
    var password = String(req.body.password || "");
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    var existing = await pool.query("SELECT * FROM customers WHERE email = $1", [email]);
    var customer = existing.rows[0];
    if (!customer) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }
    if (customer.password) {
      return res.status(400).json({ success: false, message: "Password already set. Use Forgot Password to reset." });
    }
    var hashed = await bcrypt.hash(password, 10);
    await pool.query("UPDATE customers SET password = $1, updated_at = NOW() WHERE id = $2", [hashed, customer.id]);
    res.json({ success: true, message: "Password set successfully. You can now login with email and password." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/:id", verifyCustomer, async (req, res) => {
  try {
    if (Number(req.params.id) !== req.customer.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    await pool.query("DELETE FROM customers WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Account deleted permanently" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/:id/check", verifyCustomer, async (req, res) => {
  try {
    var result = await pool.query("SELECT id FROM customers WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.json({ success: false, message: "Account not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

router.put("/:id", verifyCustomer, async (req, res) => {
  try {
    if (Number(req.params.id) !== req.customer.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    var name = String(req.body.name || "").trim();
    var phone = String(req.body.phone || "").trim();
    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    var result = await pool.query(
      "UPDATE customers SET name = $1, phone = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, email, phone, image_url",
      [name, phone || null, req.params.id]
    );
    var c = result.rows[0];
    res.json({
      success: true,
      message: "Profile updated",
      customer: { id: c.id, name: c.name, email: c.email, phone: c.phone, image_url: c.image_url }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.patch("/:id/orders/:orderId/cancel", verifyCustomer, async (req, res) => {
  try {
    if (Number(req.params.id) !== req.customer.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    var orderResult = await pool.query("SELECT * FROM orders WHERE id = $1 AND customer_id = $2", [req.params.orderId, req.params.id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    var order = orderResult.rows[0];
    if (["cancelled", "delivered", "shipped"].includes((order.status || "").toLowerCase())) {
      return res.status(400).json({ success: false, message: "Order cannot be cancelled" });
    }
    var items = order.items || "";
    var lines = items.split("\n").filter(Boolean);
    for (var i = 0; i < lines.length; i++) {
      var parts = lines[i].split("|");
      var prodName = (parts[0] || "").trim();
      var qtyMatch = lines[i].match(/Qty:\s*(\d+)/i);
      var qty = parseInt(qtyMatch ? qtyMatch[1] : 1);
      if (prodName) {
        await pool.query(
          "UPDATE products SET stock = stock + $1 WHERE LOWER(name) LIKE LOWER($2)",
          [qty, "%" + prodName + "%"]
        );
      }
    }
    await pool.query("UPDATE orders SET status = 'Cancelled' WHERE id = $1", [req.params.orderId]);
    res.json({ success: true, message: "Order cancelled successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
});

module.exports = router;
