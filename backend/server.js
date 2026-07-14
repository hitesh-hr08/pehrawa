const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, ".env") });

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
const Razorpay = require("razorpay");
const shiprocket = require("./services/shiprocket");
const cloudinaryUpload = require("./services/cloudinary");

const app = express();

app.use(helmet({
  contentSecurityPolicy: false
}));

const allowedOrigins = [
  "https://pehrawa.store",
  "https://www.pehrawa.store",
  "https://pehrawa.vercel.app",
  "https://pehrawa-7upe4t8o7-hitesh-hr08s-projects.vercel.app"
];
app.use(cors({
  origin: function (origin, cb) { cb(null, !origin || allowedOrigins.indexOf(origin) !== -1); },
  credentials: true
}));

app.use(express.json());



const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_live_T6aA0kd4BdVC3q",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "ebNPElLiEVqyDLmlNOZvESWS"
});

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
  res.sendFile(path.join(__dirname, "..", "frontend", "home.html"));
});

app.use(passport.initialize());
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", verifyAdmin, productRoutes);
app.use("/api/orders", verifyAdmin, orderRoutes);
app.use("/api/requests", verifyAdmin, requestRoutes);
app.post("/api/custom-print/submit", (req, res) => {
  const { name, phone, description } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: "Name and phone are required" });
  }
  pool.query(
    "INSERT INTO custom_requests (customer_name, phone, note, status) VALUES ($1, $2, $3, $4)",
    [name, phone, description || null, "Pending"]
  ).then(function () {
    res.json({ success: true, message: "Request submitted" });
  }).catch(function (err) {
    res.status(500).json({ success: false, message: "Server error" });
  });
});
app.use("/api/customers", customerRoutes);
app.use("/api/user", customerRoutes);

app.post("/api/upload", verifyAdmin, (req, res) => {
  upload.single("image")(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    try {
      const result = await cloudinaryUpload.upload(req.file.path);
      res.json({ success: true, url: result.url, filename: result.public_id });
    } catch (e) {
      res.status(500).json({ success: false, message: "Upload failed: " + e.message });
    }
  });
});

app.post("/api/admin/upload", verifyAdmin, (req, res) => {
  upload.single("image")(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    try {
      const result = await cloudinaryUpload.upload(req.file.path);
      res.json({ success: true, url: result.url, filename: result.public_id });
    } catch (e) {
      res.status(500).json({ success: false, message: "Upload failed: " + e.message });
    }
  });
});

app.post("/api/admin/products/:id/images", verifyAdmin, (req, res) => {
  upload.single("image")(req, res, async function (err) {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    try {
      const existing = await pool.query("SELECT COUNT(*)::int AS cnt FROM product_images WHERE product_id = $1", [req.params.id]);
      if (existing.rows[0].cnt >= 5) {
        fs.unlink(req.file.path, function () {});
        return res.status(400).json({ success: false, message: "Maximum 5 images allowed per product" });
      }
      const cloudResult = await cloudinaryUpload.upload(req.file.path);
      const result = await pool.query(
        "INSERT INTO product_images (product_id, image_url, sort_order) VALUES ($1, $2, $3) RETURNING *",
        [req.params.id, cloudResult.url, existing.rows[0].cnt]
      );
      res.json({ success: true, image: result.rows[0] });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
});

app.delete("/api/admin/products/:id/images/:imageId", verifyAdmin, async (req, res) => {
  try {
    const img = await pool.query("SELECT image_url FROM product_images WHERE id = $1 AND product_id = $2", [req.params.imageId, req.params.id]);
    if (img.rows.length > 0) {
      const pid = cloudinaryUpload.publicIdFromUrl(img.rows[0].image_url);
      if (pid) cloudinaryUpload.destroy(pid).catch(function () {});
    }
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

app.get("/api/public/razorpay-key", function (req, res) {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
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
    let { customer_id, customer_name, phone, address, total_amount, items, status, payment_status, razorpay_payment_id } = req.body;

    if (!customer_name || !phone || !address || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, address, and cart items are required"
      });
    }

    // If token provided, verify and extract customer_id
    var authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        var decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
        if (decoded && decoded.id && decoded.role === "customer") {
          customer_id = decoded.id;
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

    const itemsDataStr = JSON.stringify(items.map(function (i) { return { id: i.id || 0, name: i.name || "", quantity: Number(i.quantity) || 1, price: Number(i.price) || 0, size: i.size || "M" }; }));

    const result = await pool.query(
      "INSERT INTO orders (customer_id, customer_name, phone, address, total_amount, status, items, payment_status, razorpay_payment_id, items_data) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb) RETURNING *",
      [customerId, customer_name, phone, address, total_amount, status || "Pending", itemSummary, payment_status || "unpaid", razorpay_payment_id || null, itemsDataStr]
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

    shiprocket.createOrder({
      id: order.id,
      tracking_id: order.tracking_id,
      customer_name: order.customer_name,
      phone: order.phone,
      address: order.address,
      total_amount: order.total_amount,
      payment_status: order.payment_status,
      items_data: items,
    }).then(function (srRes) {
      if (srRes && srRes.shipment_id) {
        pool.query("UPDATE orders SET shiprocket_order_id = $1 WHERE id = $2", [String(srRes.shipment_id), order.id]).catch(function () {});
        if (srRes.awb_code) {
          pool.query("UPDATE orders SET awb_number = $1 WHERE id = $2", [srRes.awb_code, order.id]).catch(function () {});
        }
        if (srRes.shipment_id) {
          shiprocket.assignAWB(srRes.shipment_id).then(function (awbRes) {
            if (awbRes && awbRes.awb_charge_code) {
              pool.query("UPDATE orders SET awb_number = $1 WHERE id = $2", [awbRes.awb_code || awbRes.awb_charge_code, order.id]).catch(function () {});
            }
          }).catch(function () {});
        }
      }
    }).catch(function (err) {
      console.error("Shiprocket auto-creation failed for order " + order.id + ":", err.message);
    });

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

    const orderId = req.params.id.startsWith("PHR-") ? parseInt(req.params.id.replace("PHR-", ""), 10) : parseInt(req.params.id, 10);
    if (!orderId) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }
    const result = await pool.query(
      "SELECT id, customer_name, phone, address, total_amount, status, items, created_at, shiprocket_order_id, awb_number, tracking_status FROM orders WHERE id = $1 AND phone = $2",
      [orderId, phone]
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

app.get("/api/public/track/:id", async (req, res) => {
  try {
    const orderId = parseInt(req.params.id.replace("PHR-", ""), 10);
    if (!orderId) return res.status(400).json({ success: false, message: "Invalid order ID" });
    const result = await pool.query("SELECT id, shiprocket_order_id, awb_number, tracking_status FROM orders WHERE id = $1", [orderId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "Order not found" });
    const order = result.rows[0];
    if (!order.shiprocket_order_id) return res.json({ success: true, tracking: null, message: "No shipment created yet" });
    let tracking = null;
    try {
      const sid = parseInt(order.shiprocket_order_id, 10);
      if (!isNaN(sid)) {
        tracking = await shiprocket.trackShipment(sid);
        if (tracking && tracking.tracking_data && tracking.tracking_data.shipment_status && tracking.tracking_data.shipment_status !== order.tracking_status) {
          pool.query("UPDATE orders SET tracking_status = $1 WHERE id = $2", [tracking.tracking_data.shipment_status, order.id]).catch(function () {});
        }
      }
    } catch (e) { console.error("Track fetch error:", e.message); }
    res.json({ success: true, tracking: tracking, awb: order.awb_number });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch tracking" });
  }
});

app.post("/api/public/track/pageview", async (req, res) => {
  try {
    const { visitor_id, page_path, referrer } = req.body;
    if (!page_path) return res.json({ success: false });
    await pool.query(
      "INSERT INTO page_views (visitor_id, page_path, referrer, user_agent, ip_address) VALUES ($1, $2, $3, $4, $5)",
      [visitor_id || "anon", page_path, referrer || "", req.headers["user-agent"] || "", req.ip || req.connection.remoteAddress || ""]
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

app.post("/api/public/requests", async (req, res) => {
  try {
    const { customer_name, phone, address, city, district, state, pincode, note, image_url, amount, customer_id } = req.body;

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
      `INSERT INTO custom_requests (customer_name, phone, address, city, district, state, pincode, note, image_url, amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [customer_name, phone, address, city || null, district || null, state || null, pincode || null, note || null, image_url || null, amount || null, "Pending"]
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

// ===========================
// RAZORPAY PAYMENT API
// ===========================

app.post("/api/public/create-razorpay-order", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }
    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: "rcpt_" + Date.now()
    };
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order_id: order.id, amount: order.amount });
  } catch (err) {
    console.error("Razorpay order error:", err.message);
    res.status(500).json({ success: false, message: "Failed to create payment order" });
  }
});

app.post("/api/public/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment details" });
    }
    const crypto = require("crypto");
    const expectedSig = crypto
      .createHmac("sha256", razorpay.key_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }
    res.json({ success: true, message: "Payment verified", payment_id: razorpay_payment_id });
  } catch (err) {
    console.error("Payment verification error:", err.message);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
});

// ===========================
// COUPON API
// ===========================
app.post("/api/public/validate-coupon", async (req, res) => {
  try {
    var { code, order_amount } = req.body;
    if (!code) {
      return res.json({ success: false, message: "Coupon code is required" });
    }
    var result = await pool.query("SELECT * FROM coupons WHERE LOWER(code) = LOWER($1)", [code.trim()]);
    if (result.rows.length === 0) {
      return res.json({ success: false, message: "Invalid coupon code" });
    }
    var coupon = result.rows[0];
    if (!coupon.is_active) {
      return res.json({ success: false, message: "This coupon is no longer active" });
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.json({ success: false, message: "This coupon has expired" });
    }
    if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) {
      return res.json({ success: false, message: "This coupon has reached its usage limit" });
    }
    if (Number(order_amount) < Number(coupon.min_order_amount)) {
      return res.json({ success: false, message: "Minimum order amount of Rs. " + Number(coupon.min_order_amount).toFixed(0) + " required" });
    }
    var discount = 0;
    if (coupon.discount_type === "percentage") {
      discount = (Number(order_amount) * Number(coupon.discount_value)) / 100;
      if (coupon.max_discount_amount && discount > Number(coupon.max_discount_amount)) {
        discount = Number(coupon.max_discount_amount);
      }
    } else {
      discount = Number(coupon.discount_value);
    }
    res.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        max_discount_amount: coupon.max_discount_amount ? Number(coupon.max_discount_amount) : null
      },
      discount: Math.round(discount * 100) / 100
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to validate coupon" });
  }
});

app.post("/api/admin/coupons", verifyAdmin, async (req, res) => {
  try {
    var { code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, expires_at } = req.body;
    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({ success: false, message: "Code, discount type, and discount value are required" });
    }
    var result = await pool.query(
      `INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [code.toUpperCase(), discount_type, discount_value, min_order_amount || 0, max_discount_amount || null, usage_limit || 0, expires_at || null]
    );
    res.status(201).json({ success: true, coupon: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ success: false, message: "Coupon code already exists" });
    }
    res.status(500).json({ success: false, message: "Failed to create coupon" });
  }
});

app.get("/api/admin/coupons", verifyAdmin, async (req, res) => {
  try {
    var result = await pool.query("SELECT * FROM coupons ORDER BY id DESC");
    res.json({ success: true, coupons: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load coupons" });
  }
});

app.delete("/api/admin/coupons/:id", verifyAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM coupons WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "Coupon deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete coupon" });
  }
});

// ===========================
// FORGOT PASSWORD
// ===========================
app.post("/api/public/forgot-password", async (req, res) => {
  try {
    var email = String(req.body.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    var result = await pool.query("SELECT id, name, email FROM customers WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.json({ success: true, message: "If this email exists, a reset link will be sent." });
    }
    var customer = result.rows[0];
    if (!customer.email) {
      return res.json({ success: true, message: "If this email exists, a reset link will be sent." });
    }
    var crypto = require("crypto");
    var resetToken = crypto.randomBytes(32).toString("hex");
    var resetExpiry = new Date(Date.now() + 3600000);
    await pool.query(
      "UPDATE customers SET reset_token = $1, reset_expiry = $2 WHERE id = $3",
      [resetToken, resetExpiry, customer.id]
    );
    var resetLink = req.protocol + "://" + req.get("host") + "/reset-password.html?token=" + resetToken + "&email=" + encodeURIComponent(customer.email);
    console.log("Password reset link for " + customer.email + ": " + resetLink);
    res.json({ success: true, message: "Password reset link sent to your email. Check server console for the link (dev mode)." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to process request" });
  }
});

app.post("/api/public/reset-password", async (req, res) => {
  try {
    var { token, email, password } = req.body;
    if (!token || !email || !password) {
      return res.status(400).json({ success: false, message: "Token, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    var result = await pool.query(
      "SELECT id FROM customers WHERE email = $1 AND reset_token = $2 AND reset_expiry > NOW()",
      [email.toLowerCase().trim(), token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }
    var bcrypt = require("bcryptjs");
    var hashed = await bcrypt.hash(password, 10);
    await pool.query(
      "UPDATE customers SET password = $1, reset_token = NULL, reset_expiry = NULL WHERE id = $2",
      [hashed, result.rows[0].id]
    );
    res.json({ success: true, message: "Password reset successfully. You can now login." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to reset password" });
  }
});

app.get("/api/admin/seed", verifyAdmin, async (req, res) => {
  try {
    const bcrypt = require("bcryptjs");
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10);
    await pool.query(
      "INSERT INTO admins (name, email, password) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET password = $3, name = $1",
      [process.env.ADMIN_NAME || "Admin", process.env.ADMIN_EMAIL || "admin@pehrawa.in", hash]
    );
    res.json({ success: true, message: "Admin seeded" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/admin/analytics", verifyAdmin, async (req, res) => {
  try {
    const totalViews = await pool.query("SELECT COUNT(*) FROM page_views");
    const todayViews = await pool.query("SELECT COUNT(*) FROM page_views WHERE created_at::date = CURRENT_DATE");
    const yesterdayViews = await pool.query("SELECT COUNT(*) FROM page_views WHERE created_at::date = CURRENT_DATE - 1");
    const uniqueVisitors = await pool.query("SELECT COUNT(DISTINCT visitor_id) FROM page_views WHERE visitor_id != 'anon'");
    const totalCustomers = await pool.query("SELECT COUNT(*) FROM customers");
    const newCustomersToday = await pool.query("SELECT COUNT(*) FROM customers WHERE created_at::date = CURRENT_DATE");
    const totalOrders = await pool.query("SELECT COUNT(*) FROM orders");
    const newOrdersToday = await pool.query("SELECT COUNT(*) FROM orders WHERE created_at::date = CURRENT_DATE");
    const totalRevenue = await pool.query("SELECT COALESCE(SUM(total_amount), 0) AS coalesce FROM orders WHERE payment_status = 'paid'");
    const revenueToday = await pool.query("SELECT COALESCE(SUM(total_amount), 0) AS coalesce FROM orders WHERE payment_status = 'paid' AND created_at::date = CURRENT_DATE");
    const topPages = await pool.query("SELECT page_path, COUNT(*) as cnt FROM page_views GROUP BY page_path ORDER BY cnt DESC LIMIT 10");
    const dailyViews = await pool.query("SELECT DATE(created_at) as day, COUNT(*) as cnt FROM page_views WHERE created_at >= CURRENT_DATE - 6 GROUP BY DATE(created_at) ORDER BY day");

    res.json({
      success: true,
      analytics: {
        total_views: parseInt(totalViews.rows[0].count),
        today_views: parseInt(todayViews.rows[0].count),
        yesterday_views: parseInt(yesterdayViews.rows[0].count),
        unique_visitors: parseInt(uniqueVisitors.rows[0].count),
        total_customers: parseInt(totalCustomers.rows[0].count),
        new_customers_today: parseInt(newCustomersToday.rows[0].count),
        total_orders: parseInt(totalOrders.rows[0].count),
        new_orders_today: parseInt(newOrdersToday.rows[0].count),
        total_revenue: parseFloat(totalRevenue.rows[0].coalesce),
        revenue_today: parseFloat(revenueToday.rows[0].coalesce),
        top_pages: topPages.rows,
        daily_views: dailyViews.rows,
      }
    });
  } catch (err) {
    console.error("Analytics error:", err.message);
    res.json({ success: true, analytics: { total_views: 0, today_views: 0, yesterday_views: 0, unique_visitors: 0, total_customers: 0, new_customers_today: 0, total_orders: 0, new_orders_today: 0, total_revenue: 0, revenue_today: 0, top_pages: [], daily_views: [] } });
  }
});

app.post("/api/admin/shiprocket/:id", verifyAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (!orderId) return res.status(400).json({ success: false, message: "Invalid order ID" });

    const orderR = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (orderR.rows.length === 0) return res.status(404).json({ success: false, message: "Order not found" });

    const order = orderR.rows[0];
    const itemsData = Array.isArray(order.items_data) ? order.items_data : [];
    const trackingId = "PHR-" + String(order.id).padStart(6, "0");

    const srRes = await shiprocket.createOrder({
      id: order.id, tracking_id: trackingId,
      customer_name: order.customer_name, phone: order.phone,
      address: order.address, total_amount: order.total_amount,
      payment_status: order.payment_status, items_data: itemsData,
    });

    if (srRes && srRes.shipment_id) {
      await pool.query("UPDATE orders SET shiprocket_order_id = $1 WHERE id = $2", [String(srRes.shipment_id), order.id]);
      if (srRes.awb_code) await pool.query("UPDATE orders SET awb_number = $1 WHERE id = $2", [srRes.awb_code, order.id]);
      // Try to assign courier
      shiprocket.assignAWB(srRes.shipment_id).then(function (awb) {
        if (awb && awb.awb_code) pool.query("UPDATE orders SET awb_number = $1 WHERE id = $2", [awb.awb_code, order.id]).catch(function () {});
      }).catch(function () {});
      return res.json({ success: true, message: "Shipment created", data: srRes });
    }
    res.status(500).json({ success: false, message: "Shiprocket error", data: srRes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
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
    try {
      var decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      if (!decoded || !decoded.id || decoded.role !== "customer") {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }
      var customerId = decoded.id;
    } catch (e) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

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
    await pool.query(`CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT,
      price NUMERIC(10,2) NOT NULL, original_price NUMERIC(10,2),
      image_url TEXT, stock INTEGER DEFAULT 0, category VARCHAR(100),
      stock_status VARCHAR(20) DEFAULT 'in_stock',
      is_new_arrival BOOLEAN DEFAULT FALSE, is_trending BOOLEAN DEFAULT FALSE,
      is_hot_seller BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY, name VARCHAR(150), email VARCHAR(255) UNIQUE,
      password VARCHAR(255), phone VARCHAR(30) UNIQUE, address TEXT,
      google_id VARCHAR(255), image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY, customer_id INTEGER REFERENCES customers(id),
      customer_name VARCHAR(255), phone VARCHAR(20), address TEXT,
      total_amount NUMERIC(10,2), status VARCHAR(50) DEFAULT 'Pending',
      items TEXT, payment_status VARCHAR(50) DEFAULT 'unpaid',
      razorpay_payment_id TEXT, razorpay_order_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS custom_requests (
      id SERIAL PRIMARY KEY, customer_name VARCHAR(255), phone VARCHAR(20),
      note TEXT, image_url TEXT, status VARCHAR(50) DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS store_settings (
      id SERIAL PRIMARY KEY, store_name VARCHAR(255) NOT NULL DEFAULT 'Pehrawa',
      store_tagline VARCHAR(500) DEFAULT 'Premium Menswear',
      currency VARCHAR(10) DEFAULT 'INR', delivery_charge NUMERIC(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log("Database tables created/verified");
  } catch (err) {
    console.error("Table creation error (non-fatal):", err.message);
  }

  try {
    await pool.query(`
      ALTER TABLE custom_requests
        ADD COLUMN IF NOT EXISTS address TEXT,
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS district VARCHAR(100),
        ADD COLUMN IF NOT EXISTS state VARCHAR(100),
        ADD COLUMN IF NOT EXISTS pincode VARCHAR(10),
        ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2)
    `);
    console.log("Database migration: custom_requests columns added/verified");
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

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        label VARCHAR(50) DEFAULT 'Home',
        address TEXT NOT NULL,
        pincode VARCHAR(10) DEFAULT '',
        city VARCHAR(100) DEFAULT '',
        state VARCHAR(100) DEFAULT '',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database migration: addresses table created/verified");
  } catch (err) {
    console.error("Addresses migration error (non-fatal):", err.message);
  }

  // Add payment columns to orders table
  try {
    await pool.query(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid',
        ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
        ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT
    `);
    console.log("Database migration: payment columns added to orders");
  } catch (err) {
    console.error("Payment columns migration error (non-fatal):", err.message);
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

  // NOTE: Product image override disabled to preserve admin dashboard changes
  // Previously: updated product images by category (watch, sunglass, footwear, shirts, jeans)

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

  // Add reset_password fields to customers
  try {
    await pool.query(`
      ALTER TABLE customers
        ADD COLUMN IF NOT EXISTS reset_token TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS reset_expiry TIMESTAMP DEFAULT NULL
    `);
    console.log("Database migration: reset_token/reset_expiry columns added");
  } catch (err) {
    console.error("Reset password migration error (non-fatal):", err.message);
  }

  // Create coupons table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_type VARCHAR(10) NOT NULL DEFAULT 'percentage',
        discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
        min_order_amount NUMERIC(10,2) DEFAULT 0,
        max_discount_amount NUMERIC(10,2) DEFAULT NULL,
        usage_limit INTEGER DEFAULT 0,
        used_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Seed default coupon
    await pool.query(`
      INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, is_active)
      VALUES ('PEHRAWA10', 'percentage', 10, 999, 200, TRUE)
      ON CONFLICT (code) DO NOTHING
    `);
    await pool.query(`
      INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, is_active)
      VALUES ('WELCOME20', 'percentage', 20, 499, NULL, TRUE)
      ON CONFLICT (code) DO NOTHING
    `);
    console.log("Database migration: coupons table created/verified");
  } catch (err) {
    console.error("Coupons migration error (non-fatal):", err.message);
  }

  // Shiprocket columns for orders
  try {
    await pool.query(`
      ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS items_data JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS awb_number TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS tracking_status VARCHAR(50) DEFAULT NULL
    `);
    console.log("Database migration: shiprocket columns added to orders");
  } catch (err) {
    console.error("Shiprocket migration error (non-fatal):", err.message);
  }

  // Page views / analytics table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        visitor_id VARCHAR(255),
        page_path VARCHAR(500) NOT NULL,
        referrer TEXT DEFAULT '',
        user_agent TEXT DEFAULT '',
        ip_address VARCHAR(45) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database migration: page_views table created");
  } catch (err) {
    console.error("Page views migration error (non-fatal):", err.message);
  }

  // NOTE: T-Shirt price override disabled to preserve admin dashboard changes
  // Previously: UPDATE products SET price = 399, original_price = NULL WHERE category = 'T-Shirts'

  // NOTE: Black Printed Tees auto-insert removed to allow admin delete permanently
})();

app.listen(PORT, HOST, function () {
  console.log("Pehrawa server running on " + HOST + ":" + PORT);
});
