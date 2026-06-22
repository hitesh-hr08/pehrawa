const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) { cb(null, uploadDir); },
    filename: function (req, file, cb) {
      var unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, "custom-" + unique + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    var allowed = /jpeg|jpg|png|gif|webp/;
    var extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    var mimeOk = allowed.test((file.mimetype || "").split("/")[1]);
    if (extOk || mimeOk) return cb(null, true);
    cb(new Error("Only jpg, png, gif, webp allowed"));
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM custom_requests ORDER BY id DESC");
    res.json({ success: true, requests: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/count", async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*)::int AS count FROM custom_requests");
    res.json({ success: true, count: result.rows[0].count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { customer_name, phone, note, image_url, status } = req.body;

    const result = await pool.query(
      `INSERT INTO custom_requests (customer_name, phone, note, image_url, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [customer_name || null, phone || null, note || null, image_url || null, status || "Pending"]
    );

    res.status(201).json({ success: true, request: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/submit", upload.single("design_image"), async (req, res) => {
  try {
    var imageUrl = req.file ? "/uploads/" + req.file.filename : null;
    const result = await pool.query(
      `INSERT INTO custom_requests (customer_name, phone, note, image_url, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.body.name || null, req.body.phone || null, req.body.description || null, imageUrl, "Pending"]
    );
    res.status(201).json({ success: true, request: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      "UPDATE custom_requests SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    // Sync status to linked order in My Orders
    const reqData = result.rows[0];
    try {
      await pool.query(
        `UPDATE orders SET status = $1
         WHERE phone = $2 AND items ILIKE $3
         AND customer_name = $4`,
        [status, reqData.phone, '%Custom Printed T-Shirt%', reqData.customer_name]
      );
    } catch (syncErr) {
      console.error("Failed to sync order status:", syncErr.message);
    }

    res.json({ success: true, request: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM custom_requests WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    res.json({ success: true, message: "Request deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
