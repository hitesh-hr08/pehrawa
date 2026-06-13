const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

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

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5500,http://localhost:3000").split(",");
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "frontend")));

app.get("/", (req, res) => {
  res.redirect("/home.html");
});

app.use("/api/admin", adminRoutes);
app.use("/api/products", verifyAdmin, productRoutes);
app.use("/api/orders", verifyAdmin, orderRoutes);
app.use("/api/requests", verifyAdmin, requestRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/user", customerRoutes);

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
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
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

app.post("/api/public/orders", async (req, res) => {
  try {
    const { customer_id, customer_name, phone, address, total_amount, items } = req.body;

    if (!customer_name || !phone || !address || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, address, and cart items are required"
      });
    }

    const itemSummary = items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      return `${item.name} | Size: ${item.size || "M"} | Qty: ${qty} | Rs. ${(price * qty).toFixed(2)}`;
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

    const result = await pool.query(
      `INSERT INTO orders (customer_id, customer_name, phone, address, total_amount, status, items)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [customerId, customer_name, phone, address, total_amount, "Pending", itemSummary]
    );

    res.status(201).json({ success: true, order: result.rows[0] });
  } catch (err) {
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

    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
});

app.post("/api/public/requests", async (req, res) => {
  try {
    const { customer_name, phone, note, image_url } = req.body;

    if (!customer_name || !phone || !note) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and request note are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO custom_requests (customer_name, phone, note, image_url, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [customer_name, phone, note, image_url || null, "Pending"]
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
