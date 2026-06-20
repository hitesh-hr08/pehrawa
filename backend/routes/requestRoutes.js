const express = require("express");
const router = express.Router();
const pool = require("../db");

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
