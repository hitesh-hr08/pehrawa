const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
    res.json({ success: true, products: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/count", async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*)::int AS count FROM products");
    res.json({ success: true, count: result.rows[0].count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, description, price, original_price, image_url, images, stock, category, stock_status, is_new_arrival, is_trending, is_hot_seller } = req.body;

    if (!name || price === undefined || price === "") {
      return res.status(400).json({
        success: false,
        message: "Product name and price are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO products (name, description, price, original_price, image_url, stock, category, stock_status, is_new_arrival, is_trending, is_hot_seller)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [name, description || null, price, original_price || null, image_url || null, stock || 0, category || null, stock_status || 'in_stock', is_new_arrival || false, is_trending || false, is_hot_seller || false]
    );

    const product = result.rows[0];

    if (images && Array.isArray(images) && images.length) {
      for (var i = 0; i < images.length; i++) {
        await pool.query("INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3)", [product.id, images[i], i]);
      }
    }

    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, original_price, image_url, images, stock, category, stock_status, is_new_arrival, is_trending, is_hot_seller } = req.body;

    const result = await pool.query(
      `UPDATE products
       SET name = $1,
           description = $2,
           price = $3,
           original_price = $4,
           image_url = $5,
           stock = $6,
           category = $7,
           stock_status = $8,
           is_new_arrival = $9,
           is_trending = $10,
           is_hot_seller = $11
       WHERE id = $12
       RETURNING *`,
      [name, description || null, price, original_price || null, image_url || null, stock || 0, category || null, stock_status || 'in_stock', is_new_arrival || false, is_trending || false, is_hot_seller || false, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (images && Array.isArray(images)) {
      await pool.query("DELETE FROM product_images WHERE product_id = $1", [id]);
      for (var i = 0; i < images.length; i++) {
        await pool.query("INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3)", [id, images[i], i]);
      }
    }

    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
