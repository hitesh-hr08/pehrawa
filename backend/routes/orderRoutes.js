const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY id DESC");
    res.json({ success: true, orders: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/count", async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*)::int AS count FROM orders");
    res.json({ success: true, count: result.rows[0].count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { customer_name, phone, address, total_amount, status } = req.body;

    if (!customer_name || !phone || !address || total_amount === undefined || total_amount === "") {
      return res.status(400).json({
        success: false,
        message: "Customer name, phone, address, and amount are required"
      });
    }

    const customerResult = await pool.query(
      `INSERT INTO customers (name, phone, address)
       VALUES ($1, $2, $3)
       ON CONFLICT (phone)
       DO UPDATE SET
         name = COALESCE(EXCLUDED.name, customers.name),
         address = COALESCE(EXCLUDED.address, customers.address),
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [customer_name, phone, address]
    );

    const custId = customerResult.rows[0].id;
    const result = await pool.query(
      `INSERT INTO orders (customer_id, customer_name, phone, address, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [custId, customer_name, phone, address, total_amount, status || "Pending"]
    );

    // Auto-save address if customer is logged in
    if (req.body.customer_id) {
      const existing = await pool.query(
        "SELECT id FROM addresses WHERE customer_id = $1 AND address = $2 AND city = $3",
        [custId, address, req.body.city || ""]
      );
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO addresses (customer_id, label, address, pincode, city, state)
           VALUES ($1, 'Home', $2, $3, $4, $5)`,
          [custId, address, req.body.pincode || "", req.body.city || "", req.body.state || ""]
        );
      }
    }

    res.status(201).json({ success: true, order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM orders WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
