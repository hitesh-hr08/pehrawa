const express = require("express");
const router = express.Router();
const pool = require("../db");

async function saveVariants(productId, variants) {
  if (!Array.isArray(variants)) return null;
  await pool.query("DELETE FROM product_variants WHERE product_id = $1", [productId]);
  var cleaned = [];
  for (var v of variants) {
    if (!v || typeof v !== "object") continue;
    var color = String(v.color || "").trim();
    var size = String(v.size || "").trim();
    var stock = Math.max(0, parseInt(v.stock, 10) || 0);
    if (!color && !size) continue;
    cleaned.push({ color: color, size: size, stock: stock });
  }
  for (var item of cleaned) {
    await pool.query(
      `INSERT INTO product_variants (product_id, color, size, stock)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id, color, size) DO UPDATE SET stock = EXCLUDED.stock`,
      [productId, item.color, item.size, item.stock]
    );
  }
  if (cleaned.length > 0) {
    var total = cleaned.reduce(function(sum, v){ return sum + v.stock; }, 0);
    await pool.query("UPDATE products SET stock = $1 WHERE id = $2", [total, productId]);
    return { saved: cleaned.length, totalStock: total };
  }
  return { saved: 0, totalStock: null };
}

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
    let variantsByProduct = {};
    try {
      const vr = await pool.query("SELECT product_id, color, size, stock FROM product_variants ORDER BY id");
      vr.rows.forEach(function(row){
        if (!variantsByProduct[row.product_id]) variantsByProduct[row.product_id] = [];
        variantsByProduct[row.product_id].push({ color: row.color, size: row.size, stock: row.stock });
      });
    } catch (e) {}
    res.json({ success: true, products: result.rows.map(function(p){
      p.variants = variantsByProduct[p.id] || [];
      return p;
    }) });
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
    const { name, description, price, original_price, image_url, images, stock, category, stock_status, is_new_arrival, is_trending, is_hot_seller, sizes, key_points, colors } = req.body;

    if (!name || price === undefined || price === "") {
      return res.status(400).json({
        success: false,
        message: "Product name and price are required"
      });
    }

    const sizesJson = sizes && Array.isArray(sizes) ? JSON.stringify(sizes) : null;
    const colorsJson = colors && Array.isArray(colors) ? JSON.stringify(colors) : null;
    const keyPointsText = Array.isArray(key_points) ? key_points.join(", ") : (key_points || null);

    const result = await pool.query(
      `INSERT INTO products (name, description, price, original_price, image_url, stock, category, stock_status, is_new_arrival, is_trending, is_hot_seller, sizes, colors, key_points)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [name, description || null, price, original_price || null, image_url || null, stock || 0, category || null, stock_status || 'in_stock', is_new_arrival || false, is_trending || false, is_hot_seller || false, sizesJson, colorsJson, keyPointsText]
    );

    const product = result.rows[0];

    if (images && Array.isArray(images) && images.length) {
      for (var i = 0; i < images.length; i++) {
        await pool.query("INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3)", [product.id, images[i], i]);
      }
    }

    let variantInfo = null;
    try { variantInfo = await saveVariants(product.id, req.body.variants); } catch (e) { variantInfo = null; }

    res.status(201).json({ success: true, product: product, variants_saved: variantInfo ? variantInfo.saved : 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, original_price, image_url, images, stock, category, stock_status, is_new_arrival, is_trending, is_hot_seller, sizes, key_points, colors } = req.body;

    const sizesJson = sizes && Array.isArray(sizes) ? JSON.stringify(sizes) : null;
    const colorsJson = colors && Array.isArray(colors) ? JSON.stringify(colors) : null;
    const keyPointsText = Array.isArray(key_points) ? key_points.join(", ") : (key_points || null);

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
           is_hot_seller = $11,
           sizes = $13,
           colors = $14,
           key_points = $15
       WHERE id = $12
       RETURNING *`,
      [name, description || null, price, original_price || null, image_url || null, stock || 0, category || null, stock_status || 'in_stock', is_new_arrival || false, is_trending || false, is_hot_seller || false, id, sizesJson, colorsJson, keyPointsText]
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

    let variantInfo = null;
    try { variantInfo = await saveVariants(id, req.body.variants); } catch (e) { variantInfo = null; }
    let finalProduct = result.rows[0];
    if (variantInfo) finalProduct.stock = variantInfo.totalStock;

    res.json({ success: true, product: finalProduct, variants_saved: variantInfo ? variantInfo.saved : 0 });
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
