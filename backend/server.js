const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const passport = require("passport");
require("dotenv").config();

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

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5500,http://localhost:3000,http://localhost:5000").split(",");
app.use(cors({ origin: allowedOrigins, credentials: true }));

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
app.use("/api/shopify", verifyAdmin, shopifyRoutes);
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
    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load product" });
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
    const { customer_id, customer_name, phone, address, total_amount, items } = req.body;

    if (!customer_name || !phone || !address || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, address, and cart items are required"
      });
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
      return item.name + " | Size: " + (item.size || "M") + " | Qty: " + qty + " | Rs. " + (price * qty).toFixed(2);
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
      `INSERT INTO orders (customer_id, customer_name, phone, address, total_amount, status, items)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [customerId, customer_name, phone, address, total_amount, "Pending", itemSummary]
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
    const { customer_name, phone, address, city, district, state, pincode, note, image_url, payment_id, amount } = req.body;

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

    res.status(201).json({ success: true, request: result.rows[0] });
  } catch (err) {
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
})();

app.listen(PORT, HOST, function () {
  console.log("Pehrawa server running on " + HOST + ":" + PORT);
});
