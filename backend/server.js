const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const passport = require("passport");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();

var razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== "rzp_test_YOUR_KEY_ID_HERE") {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log("Razorpay initialized with key: " + process.env.RAZORPAY_KEY_ID.slice(0, 12) + "...");
} else {
  console.log("Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
}

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

const pool = require("./db");
const adminRoutes = require("./routes/adminRoutes");
const customerRoutes = require("./routes/customerRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const requestRoutes = require("./routes/requestRoutes");
const verifyAdmin = require("./middleware/auth");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors({ origin: true, credentials: true }));

app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use(express.static(path.join(__dirname, "..")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "uploads");
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || ".png";
    cb(null, unique + ext);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype.split("/")[1]);
    if (extOk || mimeOk) return cb(null, true);
    cb(new Error("Only image files (jpg, png, gif, webp, svg) are allowed"));
  }
});

app.get("/", (req, res) => {
  res.redirect("/home.html");
});

app.use(passport.initialize());
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", verifyAdmin, productRoutes);
app.use("/api/orders", verifyAdmin, orderRoutes);
app.use("/api/requests", verifyAdmin, requestRoutes);
app.use("/api/custom-print", requestRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/user", customerRoutes);

app.post("/api/upload", (req, res) => {
  upload.single("image")(req, res, function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const url = "/uploads/" + req.file.filename;
    res.json({ success: true, url: url, filename: req.file.filename });
  });
});

app.post("/api/admin/upload", verifyAdmin, (req, res) => {
  upload.single("image")(req, res, function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const url = "/uploads/" + req.file.filename;
    res.json({ success: true, url: url, filename: req.file.filename });
  });
});

app.post("/api/admin/products/:id/images", verifyAdmin, (req, res) => {
  upload.single("image")(req, res, async function (err) {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    try {
      const existing = await pool.query("SELECT COUNT(*)::int AS cnt FROM product_images WHERE product_id = $1", [req.params.id]);
      if (existing.rows[0].cnt >= 5) {
        return res.status(400).json({ success: false, message: "Maximum 5 images allowed per product" });
      }
      const url = "/uploads/" + req.file.filename;
      const result = await pool.query(
        "INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3) RETURNING *",
        [req.params.id, url, existing.rows[0].cnt]
      );
      res.json({ success: true, image: result.rows[0] });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
});

app.delete("/api/admin/products/:id/images/:imageId", verifyAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM product_images WHERE id = $1 AND product_id = $2", [req.params.imageId, req.params.id]);
    res.json({ success: true, message: "Image deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/customers/all", verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.name, c.email, c.phone, c.address, c.created_at,
        COALESCE(o.order_count, 0) AS order_count,
        COALESCE(o.total_spent, 0) AS total_spent
      FROM customers c
      LEFT JOIN (
        SELECT customer_id, COUNT(*) AS order_count, SUM(total_amount) AS total_spent
        FROM orders GROUP BY customer_id
      ) o ON c.id = o.customer_id
      ORDER BY c.id DESC
    `);
    res.json({ success: true, customers: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load customers" });
  }
});

app.delete("/api/customers/all/:id", verifyAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM customers WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete customer" });
  }
});

app.get("/api/settings", verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM store_settings LIMIT 1");
    res.json({ success: true, settings: result.rows[0] || {} });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load settings" });
  }
});

app.put("/api/settings", verifyAdmin, async (req, res) => {
  try {
    const { store_name, store_tagline, currency, delivery_charge } = req.body;
    const result = await pool.query(
      `INSERT INTO store_settings (store_name, store_tagline, currency, delivery_charge)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         store_name = COALESCE(EXCLUDED.store_name, store_settings.store_name),
         store_tagline = COALESCE(EXCLUDED.store_tagline, store_settings.store_tagline),
         currency = COALESCE(EXCLUDED.currency, store_settings.currency),
         delivery_charge = COALESCE(EXCLUDED.delivery_charge, store_settings.delivery_charge),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [store_name || "Pehrawa", store_tagline || "Premium Menswear", currency || "INR", delivery_charge || 0]
    );
    res.json({ success: true, settings: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to save settings" });
  }
});

// ===============================
// RAZORPAY PAYMENT API
// ===============================

app.post("/api/create-order", async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(400).json({ success: false, message: "Payment gateway not configured. Use UPI/manual payment." });
    }
    var { amount, currency } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }
    var options = {
      amount: Math.round(amount * 100),
      currency: currency || "INR",
      receipt: "rcpt_" + Date.now()
    };
    var order = await razorpay.orders.create(options);
    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    console.error("Razorpay order error:", err.message);
    res.status(500).json({ success: false, message: "Failed to create payment order" });
  }
});

app.post("/api/verify-payment", async (req, res) => {
  try {
    var { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    var expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
    if (expectedSig === razorpay_signature) {
      res.json({ success: true, verified: true, payment_id: razorpay_payment_id });
    } else {
      res.json({ success: false, verified: false, message: "Payment verification failed" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Verification error" });
  }
});

app.get("/api/razorpay-key", function (req, res) {
  res.json({ key: process.env.RAZORPAY_KEY_ID || "" });
});

// ===============================

app.get("/api/public/products", async (req, res) => {
  try {
    const search = req.query.search || "";
    let query = "SELECT * FROM products";
    let params = [];

    if (search.trim()) {
      query += " WHERE LOWER(name) LIKE LOWER($1) OR LOWER(description) LIKE LOWER($1) OR LOWER(category) LIKE LOWER($1)";
      params.push("%" + search.trim() + "%");
    }

    query += " ORDER BY id DESC";

    const result = await pool.query(query, params);
    res.json({ success: true, products: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load products" });
  }
});

app.get("/api/public/products/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    const images = await pool.query("SELECT id, image_url, sort_order FROM product_images WHERE product_id = $1 ORDER BY sort_order, id", [req.params.id]);
    res.json({ success: true, product: result.rows[0], images: images.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load product" });
  }
});

app.get("/api/products/:id/images", verifyAdmin, async (req, res) => {
  try {
    const images = await pool.query("SELECT id, image_url, sort_order FROM product_images WHERE product_id = $1 ORDER BY sort_order, id", [req.params.id]);
    res.json({ success: true, images: images.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/public/settings", async (req, res) => {
  try {
    const result = await pool.query("SELECT store_name, store_tagline, currency, delivery_charge FROM store_settings LIMIT 1");
    res.json({ success: true, settings: result.rows[0] || { store_name: "Pehrawa", store_tagline: "Premium Menswear", currency: "INR", delivery_charge: 0 } });
  } catch (err) {
    res.json({ success: true, settings: { store_name: "Pehrawa", store_tagline: "Premium Menswear", currency: "INR", delivery_charge: 0 } });
  }
});

app.post("/api/public/orders", async (req, res) => {
  try {
    let { customer_id, customer_name, phone, address, total_amount, items, status } = req.body;

    if (!customer_name || !phone || !address || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, address, and cart items are required"
      });
    }

    // If token provided, extract customer_id from it
    var authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        var token = authHeader.slice(7);
        var payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
        if (payload && payload.id) {
          customer_id = payload.id;
        }
      } catch (e) {}
    }

    for (const item of items) {
      if (item.id) {
        const stockResult = await pool.query("SELECT stock FROM products WHERE id = $1", [item.id]);
        if (stockResult.rows.length > 0) {
          const currentStock = stockResult.rows[0].stock;
          const qty = Number(item.quantity) || 1;
          if (currentStock < qty) {
            return res.status(400).json({
              success: false,
              message: "Insufficient stock for " + item.name + ". Available: " + currentStock
            });
          }
        }
      }
    }

    const itemSummary = items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      return item.name + " | ID: " + (item.id || 0) + " | Size: " + (item.size || "M") + " | Qty: " + qty + " | Rs. " + price.toFixed(2) + " | Total: Rs. " + (price * qty).toFixed(2);
    }).join("\n");

    let customerId = customer_id || null;

    if (!customerId) {
      const existingCustomer = await pool.query(
        "SELECT id FROM customers WHERE phone = $1 ORDER BY id DESC LIMIT 1",
        [phone]
      );

      if (existingCustomer.rows.length > 0) {
        customerId = existingCustomer.rows[0].id;
        await pool.query(
          "UPDATE customers SET name = COALESCE($1, name), address = COALESCE($2, address), updated_at = CURRENT_TIMESTAMP WHERE id = $3",
          [customer_name, address, customerId]
        );
      } else {
        const createdCustomer = await pool.query(
          "INSERT INTO customers (name, phone, address) VALUES ($1, $2, $3) RETURNING id",
          [customer_name, phone, address]
        );
        customerId = createdCustomer.rows[0].id;
      }
    }

    if (customerId) {
      var custCheck = await pool.query("SELECT id FROM customers WHERE id = $1", [customerId]);
      if (custCheck.rows.length === 0) customerId = null;
    }

    const result = await pool.query(
      `INSERT INTO orders (customer_id, customer_name, phone, address, total_amount, status, items, payment_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [customerId, customer_name, phone, address, total_amount, status || "Pending", itemSummary, req.body.payment_id || null]
    );

    for (const item of items) {
      if (item.id) {
        await pool.query(
          "UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2",
          [Number(item.quantity) || 1, item.id]
        );
      }
    }

    var order = result.rows[0];
    order.tracking_id = "PHR-" + String(order.id).padStart(6, "0");
    res.status(201).json({ success: true, order: order });
  } catch (err) {
    console.error("Order placement error:", err.message, err.stack);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
});

app.get("/api/public/orders/:id", async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    const result = await pool.query(
      "SELECT id, customer_name, phone, address, total_amount, status, items, created_at FROM orders WHERE id = $1 AND phone = $2",
      [req.params.id, phone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    var order = result.rows[0];
    order.tracking_id = "PHR-" + String(order.id).padStart(6, "0");
    res.json({ success: true, order: order });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
});

app.post("/api/public/requests", async (req, res) => {
  try {
    const { customer_name, phone, address, city, district, state, pincode, note, image_url, payment_id, amount, customer_id } = req.body;

    if (!customer_name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone are required"
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required"
      });
    }

    const result = await pool.query(
      `INSERT INTO custom_requests (customer_name, phone, address, city, district, state, pincode, note, image_url, payment_id, amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [customer_name, phone, address, city || null, district || null, state || null, pincode || null, note || null, image_url || null, payment_id || null, amount || null, payment_id ? "Paid" : "Pending"]
    );

    var request = result.rows[0];
    var trackingId = "PCR-" + String(request.id).padStart(6, "0");

    // Also create an order entry so it shows in My Orders
    var orderItems = "Custom Printed T-Shirt (Request #" + request.id + ") | Size: " + (note.match(/Size:\s*(\S+)/i) || ["", "M"])[1] + " | Qty: " + (note.match(/Qty:\s*(\d+)/i) || ["", "1"])[1] + " | Rs. " + (Number(amount) || 499).toFixed(2);
    var orderResult = null;
    try {
      orderResult = await pool.query(
        `INSERT INTO orders (customer_id, customer_name, phone, address, total_amount, status, items)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [customer_id || null, customer_name, phone, address, amount || 499, "Pending", orderItems]
      );
    } catch (orderErr) {
      console.error("Failed to create order for custom request:", orderErr.message);
    }

    res.status(201).json({
      success: true,
      request: request,
      tracking_id: trackingId,
      order_id: orderResult ? orderResult.rows[0].id : null
    });
  } catch (err) {
    console.error("Custom request error:", err.message);
    res.status(500).json({ success: false, message: "Failed to submit request" });
  }
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "healthy", db: "connected" });
  } catch (err) {
    res.status(503).json({ status: "unhealthy", db: "disconnected" });
  }
});

app.get("/api", (req, res) => {
  res.json({ success: true, message: "Pehrawa API Running" });
});

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ===========================
// REVIEWS API
// ===========================

// Submit a review (requires auth + delivered order)
app.post("/api/reviews", async (req, res) => {
  try {
    var authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    var token = authHeader.slice(7);
    var payload;
    try {
      payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    } catch (e) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    if (!payload || !payload.id) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    var customerId = payload.id;

    var { product_id, order_id, rating, review_text } = req.body;

    if (!product_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Product ID and rating (1-5) are required" });
    }

    // Verify order belongs to this customer and is delivered
    if (order_id) {
      var orderCheck = await pool.query(
        "SELECT id, status, customer_id FROM orders WHERE id = $1 AND customer_id = $2",
        [order_id, customerId]
      );
      if (orderCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: "Order not found or not yours" });
      }
      if (orderCheck.rows[0].status.toLowerCase() !== "delivered") {
        return res.status(400).json({ success: false, message: "Can only review delivered orders" });
      }
    }

    // Insert review
    var result = await pool.query(
      `INSERT INTO reviews (product_id, customer_id, order_id, rating, review_text)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (order_id, product_id)
       DO UPDATE SET rating = EXCLUDED.rating, review_text = EXCLUDED.review_text, created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [product_id, customerId, order_id || null, rating, review_text || null]
    );

    res.status(201).json({ success: true, review: result.rows[0] });
  } catch (err) {
    console.error("Review submission error:", err.message);
    res.status(500).json({ success: false, message: "Failed to submit review" });
  }
});

// Get reviews for a product
app.get("/api/products/:id/reviews", async (req, res) => {
  try {
    var result = await pool.query(
      `SELECT r.id, r.rating, r.review_text, r.created_at,
              COALESCE(c.name, 'Anonymous') AS customer_name
       FROM reviews r
       LEFT JOIN customers c ON r.customer_id = c.id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );

    var stats = await pool.query(
      "SELECT COUNT(*)::int AS count, COALESCE(ROUND(AVG(rating), 1), 0)::float AS avg_rating FROM reviews WHERE product_id = $1",
      [req.params.id]
    );

    res.json({
      success: true,
      reviews: result.rows,
      stats: stats.rows[0]
    });
  } catch (err) {
    console.error("Fetch reviews error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
});

var PORT = process.env.PORT || 5000;
var HOST = process.env.HOST || "0.0.0.0";

(async function () {
  try {
    await pool.query(`
      ALTER TABLE custom_requests
        ADD COLUMN IF NOT EXISTS address TEXT,
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS district VARCHAR(100),
        ADD COLUMN IF NOT EXISTS state VARCHAR(100),
        ADD COLUMN IF NOT EXISTS pincode VARCHAR(10),
        ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2)
    `);
    console.log("Database migration: custom_requests columns added/verified");
  } catch (err) {
    console.error("Migration error (non-fatal):", err.message);
  }

  try {
    await pool.query(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255)
    `);
    console.log("Database migration: orders.payment_id column added/verified");
  } catch (err) {
    console.error("Migration error (non-fatal):", err.message);
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(order_id, product_id)
      )
    `);
    console.log("Database migration: reviews table created/verified");
  } catch (err) {
    console.error("Reviews migration error (non-fatal):", err.message);
  }

  // Back-fill customer_id on old orders where customer_id is NULL
  try {
    await pool.query(`
      UPDATE orders o
      SET customer_id = c.id
      FROM customers c
      WHERE o.customer_id IS NULL AND o.phone = c.phone
    `);
    console.log("Database migration: back-filled customer_id on old orders");
  } catch (err) {
    console.error("Back-fill migration error (non-fatal):", err.message);
  }

  // Update product images to use dedicated images (by category order, works on any DB)
  try {
    // WATCHES
    await pool.query(
      `WITH ranked AS (SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn FROM products WHERE category = 'WATCHES')
       UPDATE products SET image_url = CASE ranked.rn
         WHEN 1 THEN '/images/Watch1.jpg'
         WHEN 2 THEN '/images/Watch2.jpg'
         ELSE image_url END
       FROM ranked WHERE products.id = ranked.id`
    );
    // SUNGLASSES
    await pool.query(
      `WITH ranked AS (SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn FROM products WHERE category = 'SUNGLASSES')
       UPDATE products SET image_url = CASE ranked.rn
         WHEN 1 THEN '/images/Sunglasses1.webp'
         WHEN 2 THEN '/images/Sunglasses2.webp'
         ELSE image_url END
       FROM ranked WHERE products.id = ranked.id`
    );
    // FOOTWEAR
    await pool.query(
      `WITH ranked AS (SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn FROM products WHERE category = 'FOOTWEAR')
       UPDATE products SET image_url = CASE ranked.rn
         WHEN 1 THEN '/images/Footwear1.webp'
         WHEN 2 THEN '/images/Footwear2.jpg'
         WHEN 3 THEN '/images/Footwear3.jpg'
         ELSE image_url END
       FROM ranked WHERE products.id = ranked.id`
    );
    // SHIRTS
    await pool.query(
      `WITH ranked AS (SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn FROM products WHERE category = 'SHIRTS')
       UPDATE products SET image_url = CASE ranked.rn
         WHEN 1 THEN '/images/Shirt1.avif'
         WHEN 2 THEN '/images/Shirt2.webp'
         WHEN 3 THEN '/images/Shirt3.webp'
         ELSE image_url END
       FROM ranked WHERE products.id = ranked.id`
    );
    // JEANS
    await pool.query(
      `WITH ranked AS (SELECT id, ROW_NUMBER() OVER (ORDER BY id) as rn FROM products WHERE category = 'JEANS')
       UPDATE products SET image_url = CASE ranked.rn
         WHEN 1 THEN '/images/Jean1.webp'
         WHEN 2 THEN '/images/Jean2.webp'
         ELSE image_url END
       FROM ranked WHERE products.id = ranked.id`
    );
    console.log("Database migration: updated product images by category (watch, sunglass, footwear, shirts, jeans)");
  } catch (err) {
    console.error("Product image migration error (non-fatal):", err.message);
  }

  // Add product status/tag columns
  try {
    await pool.query(`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS stock_status VARCHAR(20) DEFAULT 'in_stock',
        ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS is_hot_seller BOOLEAN DEFAULT FALSE
    `);
    console.log("Database migration: product status columns added/verified");
  } catch (err) {
    console.error("Product status migration error (non-fatal):", err.message);
  }

  // Add original_price column
  try {
    await pool.query(`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2) DEFAULT NULL
    `);
    console.log("Database migration: original_price column added/verified");
  } catch (err) {
    console.error("Original price migration error (non-fatal):", err.message);
  }

  // Create product_images table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database migration: product_images table created/verified");
  } catch (err) {
    console.error("Product images table migration error (non-fatal):", err.message);
  }
})();

app.listen(PORT, HOST, function () {
  console.log("Pehrawa server running on " + HOST + ":" + PORT);
});
