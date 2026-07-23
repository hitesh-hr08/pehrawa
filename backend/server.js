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
      if (existing.rows[0].cnt >= 10) {
        fs.unlink(req.file.path, function () {});
        return res.status(400).json({ success: false, message: "Maximum 10 images allowed per product" });
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
    let query = "SELECT *, COALESCE(stock, 0) as stock_count FROM products";
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

    if (customerId) {
      var rewardPts = Math.floor(Number(total_amount) || 0);
      if (rewardPts > 0) {
        pool.query("UPDATE customers SET total_spent = total_spent + $1 WHERE id = $2", [Number(total_amount) || 0, customerId]).catch(function() {});
        addRewardPoints(customerId, rewardPts, "order", "Order #" + order.id + " reward", order.id).catch(function() {});
        createScratchCard(customerId, order.id).catch(function() {});
        // Referral reward if this customer was referred
        pool.query("SELECT id FROM referrals WHERE referred_id = $1 AND reward_given = FALSE", [customerId]).then(function(r) {
          if (r.rows.length > 0) {
            var ref = r.rows[0];
            pool.query("UPDATE referrals SET reward_given = TRUE, order_id = $1 WHERE id = $2", [order.id, ref.id]).catch(function() {});
            addRewardPoints(customerId, 100, "referral_bonus", "Welcome referral bonus for first order", order.id).catch(function() {});
            pool.query("UPDATE referral_codes rc SET total_earned = total_earned + 200 FROM referrals r WHERE r.referral_code = rc.code AND r.id = $1", [ref.id]).catch(function() {});
            // Also reward the referrer
            pool.query("SELECT referrer_id FROM referrals WHERE id = $1", [ref.id]).then(function(ri) {
              if (ri.rows.length > 0) {
                addRewardPoints(ri.rows[0].referrer_id, 200, "referral", "Referral reward for bringing a friend", order.id).catch(function() {});
              }
            }).catch(function() {});
          }
        }).catch(function() {});
      }
    }
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

  // Add sizes column
  try {
    await pool.query(`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT NULL
    `);
    console.log("Database migration: sizes column added/verified");
  } catch (err) {
    console.error("Sizes migration error (non-fatal):", err.message);
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

  // ===========================
  // WISHLIST TABLE
  // ===========================
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        price_when_added NUMERIC(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(customer_id, product_id)
      )
    `);
    console.log("Database migration: wishlists table created");
  } catch (err) {
    console.error("Wishlists migration error (non-fatal):", err.message);
  }

  // ===========================
  // PRICE ALERTS TABLE
  // ===========================
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS price_alerts (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        target_price NUMERIC(10,2),
        is_active BOOLEAN DEFAULT TRUE,
        notified_at TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(customer_id, product_id)
      )
    `);
    console.log("Database migration: price_alerts table created");
  } catch (err) {
    console.error("Price alerts migration error (non-fatal):", err.message);
  }

  // ===========================
  // RECENTLY VIEWED TABLE
  // ===========================
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_views (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_product_views_customer ON product_views(customer_id, viewed_at DESC)
    `);
    console.log("Database migration: product_views table created");
  } catch (err) {
    console.error("Product views migration error (non-fatal):", err.message);
  }

  // ===========================
  // ADD redeemable_points to customers
  // ===========================
  try {
    await pool.query(`
      ALTER TABLE customers
        ADD COLUMN IF NOT EXISTS redeemable_points INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS lifetime_points INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS tier_upgraded_at TIMESTAMP DEFAULT NULL
    `);
    console.log("Database migration: customer points/tier columns added");
  } catch (err) {
    console.error("Customer points columns migration error (non-fatal):", err.message);
  }

  // ===========================
  // MIGRATE existing total_points to lifetime_points + redeemable_points
  // ===========================
  try {
    await pool.query(`
      UPDATE customers SET lifetime_points = total_points, redeemable_points = total_points
      WHERE lifetime_points = 0 AND total_points > 0
    `);
    console.log("Database migration: migrated existing points to lifetime/redeemable");
  } catch (err) {
    console.error("Points migration error (non-fatal):", err.message);
  }

  // ===========================
  // DAILY DROP TABLE
  // ===========================
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_drops (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        active_date DATE NOT NULL DEFAULT CURRENT_DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database migration: daily_drops table created");
  } catch (err) {
    console.error("Daily drops migration error (non-fatal):", err.message);
  }

  // ===========================
  // LUXURY FASHION FEATURES
  // ===========================

  // Rewards / Points table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rewards (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        points INTEGER NOT NULL DEFAULT 0,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database migration: rewards table created");
  } catch (err) {
    console.error("Rewards migration error (non-fatal):", err.message);
  }

  // Scratch Cards table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scratch_cards (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        reward_type VARCHAR(50) NOT NULL,
        reward_value NUMERIC(10,2) DEFAULT 0,
        reward_text VARCHAR(255),
        is_revealed BOOLEAN DEFAULT FALSE,
        is_redeemed BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database migration: scratch_cards table created");
  } catch (err) {
    console.error("Scratch cards migration error (non-fatal):", err.message);
  }

  // Coming Soon products table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coming_soon (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image_url TEXT,
        launch_date TIMESTAMP,
        category VARCHAR(100),
        notify_emails JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database migration: coming_soon table created");
  } catch (err) {
    console.error("Coming soon migration error (non-fatal):", err.message);
  }

  // Customer Gallery (Styled by Pehrawa)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customer_gallery (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        customer_name VARCHAR(150) DEFAULT 'Anonymous',
        image_url TEXT NOT NULL,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        caption TEXT,
        is_approved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database migration: customer_gallery table created");
  } catch (err) {
    console.error("Customer gallery migration error (non-fatal):", err.message);
  }

  // Pehrawa Vault (invite-only)
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vault_products (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        vault_price NUMERIC(10,2) NOT NULL,
        access_code VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database migration: vault_products table created");
  } catch (err) {
    console.error("Vault migration error (non-fatal):", err.message);
  }

  // Referral codes table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referral_codes (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        code VARCHAR(20) UNIQUE NOT NULL,
        total_referrals INTEGER DEFAULT 0,
        total_earned NUMERIC(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database migration: referral_codes table created");
  } catch (err) {
    console.error("Referral codes migration error (non-fatal):", err.message);
  }

  // Referral tracking table
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        referred_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        referral_code VARCHAR(20) NOT NULL,
        reward_given BOOLEAN DEFAULT FALSE,
        order_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database migration: referrals table created");
  } catch (err) {
    console.error("Referrals migration error (non-fatal):", err.message);
  }

  // Add referral_code column to customers
  try {
    await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20)`);
    console.log("Database migration: customer referral_code column added");
  } catch (err) {
    console.error("Customer referral_code migration error (non-fatal):", err.message);
  }

  // Add membership/tier columns to customers
  try {
    await pool.query(`
      ALTER TABLE customers
        ADD COLUMN IF NOT EXISTS membership_tier VARCHAR(20) DEFAULT 'bronze',
        ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_spent NUMERIC(10,2) DEFAULT 0
    `);
    console.log("Database migration: customer membership columns added");
  } catch (err) {
    console.error("Membership columns migration error (non-fatal):", err.message);
  }

  // Add color/tags to products
  try {
    await pool.query(`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS color VARCHAR(50) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb
    `);
    console.log("Database migration: product color/tags columns added");
  } catch (err) {
    console.error("Product color/tags migration error (non-fatal):", err.message);
  }

  // Add limited edition columns to products
  try {
    await pool.query(`
      ALTER TABLE products
        ADD COLUMN IF NOT EXISTS is_limited_edition BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS edition_number INTEGER DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS edition_total INTEGER DEFAULT NULL
    `);
    console.log("Database migration: product limited edition columns added");
  } catch (err) {
    console.error("Limited edition migration error (non-fatal):", err.message);
  }

  // Chat logs for AI assistant
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_logs (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        session_id VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        intent VARCHAR(50),
        products_recommended JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database migration: chat_logs table created");
  } catch (err) {
    console.error("Chat logs migration error (non-fatal):", err.message);
  }

  // Style DNA profiles
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS style_dna (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE UNIQUE,
        style_type VARCHAR(50) NOT NULL,
        answers JSONB NOT NULL DEFAULT '{}'::jsonb,
        scores JSONB NOT NULL DEFAULT '{}'::jsonb,
        recommended_categories JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database migration: style_dna table created");
  } catch (err) {
    console.error("Style DNA migration error (non-fatal):", err.message);
  }

  // Ensure style_dna has UNIQUE on customer_id (for existing deployments)
  try {
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'style_dna_customer_id_key'
        ) THEN
          ALTER TABLE style_dna ADD CONSTRAINT style_dna_customer_id_key UNIQUE (customer_id);
        END IF;
      END $$;
    `);
    console.log("Database migration: style_dna UNIQUE constraint verified");
  } catch (err) {
    console.error("Style DNA UNIQUE migration error (non-fatal):", err.message);
  }

  // AI analytics
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_analytics (
        id SERIAL PRIMARY KEY,
        feature VARCHAR(50) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database migration: ai_analytics table created");
  } catch (err) {
    console.error("AI analytics migration error (non-fatal):", err.message);
  }

  // Style DNA columns on customers
  try {
    await pool.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS style_dna_type VARCHAR(50) DEFAULT NULL`);
    console.log("Database migration: customer style_dna_type column added");
  } catch (err) {
    console.error("Customer style_dna_type migration error (non-fatal):", err.message);
  }

  // ===========================
  // DAILY DROP API
  // ===========================

  app.get("/api/public/daily-drop", async function (req, res) {
    try {
      var today = new Date().toISOString().slice(0, 10);
      var result = await pool.query(
        `SELECT dd.*, p.name, p.price, p.original_price, p.image_url, p.description, p.stock_status, p.category
         FROM daily_drops dd
         JOIN products p ON dd.product_id = p.id
         WHERE dd.active_date = $1 AND dd.is_active = TRUE
         ORDER BY dd.created_at DESC LIMIT 1`,
        [today]
      );
      if (result.rows.length === 0) {
        var fallback = await pool.query(
          `SELECT dd.*, p.name, p.price, p.original_price, p.image_url, p.description, p.stock_status, p.category
           FROM daily_drops dd
           JOIN products p ON dd.product_id = p.id
           WHERE dd.is_active = TRUE
           ORDER BY dd.active_date DESC LIMIT 1`
        );
        return res.json({ success: true, drop: fallback.rows[0] || null });
      }
      var drop = result.rows[0];
      var images = await pool.query("SELECT image_url FROM product_images WHERE product_id = $1 ORDER BY sort_order, id", [drop.product_id]);
      drop.gallery_images = images.rows.map(function(i) { return i.image_url; });
      res.json({ success: true, drop: drop });
    } catch (err) {
      console.error("Daily drop error:", err.message);
      res.json({ success: true, drop: null });
    }
  });

  app.post("/api/admin/daily-drop", verifyAdmin, async function (req, res) {
    try {
      var { product_id, active_date } = req.body;
      if (!product_id) return res.status(400).json({ success: false, message: "Product ID required" });
      var date = active_date || new Date().toISOString().slice(0, 10);
      await pool.query("UPDATE daily_drops SET is_active = FALSE WHERE active_date = $1", [date]);
      var result = await pool.query(
        "INSERT INTO daily_drops (product_id, active_date, is_active) VALUES ($1, $2, TRUE) RETURNING *",
        [product_id, date]
      );
      res.json({ success: true, drop: result.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/admin/daily-drops", verifyAdmin, async function (req, res) {
    try {
      var result = await pool.query(
        `SELECT dd.*, p.name as product_name, p.price as product_price, p.image_url as product_image
         FROM daily_drops dd
         LEFT JOIN products p ON dd.product_id = p.id
         ORDER BY dd.active_date DESC LIMIT 30`
      );
      res.json({ success: true, drops: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ===========================
  // REWARDS API
  // ===========================

  app.get("/api/public/rewards/points", async function (req, res) {
    try {
      var authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.json({ success: true, points: 0, tier: "bronze", history: [] });
      }
      var decoded;
      try { decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET); } catch (e) { return res.json({ success: true, points: 0, tier: "bronze", history: [] }); }
      if (!decoded || decoded.role !== "customer") return res.json({ success: true, points: 0, tier: "bronze", history: [] });

      var cust = await pool.query("SELECT total_points, redeemable_points, lifetime_points, membership_tier, total_spent FROM customers WHERE id = $1", [decoded.id]);
      if (cust.rows.length === 0) return res.json({ success: true, points: 0, tier: "bronze", history: [] });

      var history = await pool.query(
        "SELECT points, type, description, created_at FROM rewards WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 20",
        [decoded.id]
      );

      var c = cust.rows[0];
      var pts = parseInt(c.total_points) || 0;
      var spent = parseFloat(c.total_spent) || 0;

      res.json({
        success: true,
        points: pts,
        redeemable_points: parseInt(c.redeemable_points) || pts,
        lifetime_points: parseInt(c.lifetime_points) || pts,
        tier: c.membership_tier || "bronze",
        tierBenefits: getTierBenefits(c.membership_tier || "bronze"),
        progress: getTierProgress(pts, spent),
        total_spent: spent,
        history: history.rows
      });
    } catch (err) {
      res.json({ success: true, points: 0, tier: "bronze", history: [] });
    }
  });

  async function addRewardPoints(customerId, points, type, description, orderId) {
    try {
      await pool.query(
        "INSERT INTO rewards (customer_id, points, type, description, order_id) VALUES ($1, $2, $3, $4, $5)",
        [customerId, points, type, description || "", orderId || null]
      );
      await pool.query("UPDATE customers SET total_points = total_points + $1, lifetime_points = lifetime_points + $1, redeemable_points = redeemable_points + $1 WHERE id = $2", [points, customerId]);
      await updateCustomerTier(customerId);
    } catch (e) { console.error("addRewardPoints error:", e.message); }
  }

  async function updateCustomerTier(customerId) {
    try {
      var cust = await pool.query("SELECT total_points, lifetime_points, redeemable_points, total_spent, membership_tier FROM customers WHERE id = $1", [customerId]);
      if (cust.rows.length === 0) return;
      var c = cust.rows[0];
      var pts = parseInt(c.total_points) || 0;
      var spent = parseFloat(c.total_spent) || 0;
      var tier = "bronze";
      if (pts >= 5000 || spent >= 50000) tier = "black";
      else if (pts >= 2000 || spent >= 15000) tier = "gold";
      else if (pts >= 500 || spent >= 5000) tier = "silver";
      if (tier !== c.membership_tier) {
        await pool.query("UPDATE customers SET membership_tier = $1, tier_upgraded_at = NOW() WHERE id = $2", [tier, customerId]);
      }
    } catch (e) { console.error("updateCustomerTier error:", e.message); }
  }

  function getTierBenefits(tier) {
    var benefits = {
      bronze: { name: "Bronze", color: "#cd7f32", pointsMultiplier: 1, freeShipping: false, earlyAccess: false, discount: 0, nextTier: "Silver", nextThreshold: "500 points or \u20b95,000 spent" },
      silver: { name: "Silver", color: "#c0c0c0", pointsMultiplier: 1.2, freeShipping: true, earlyAccess: false, discount: 3, nextTier: "Gold", nextThreshold: "2,000 points or \u20b915,000 spent" },
      gold: { name: "Gold", color: "#ffd700", pointsMultiplier: 1.5, freeShipping: true, earlyAccess: true, discount: 5, nextTier: "Black", nextThreshold: "5,000 points or \u20b950,000 spent" },
      black: { name: "Black", color: "#1a1a1a", pointsMultiplier: 2, freeShipping: true, earlyAccess: true, discount: 10, nextTier: null, nextThreshold: null }
    };
    return benefits[tier] || benefits.bronze;
  }

  function getTierProgress(pts, spent) {
    var current = "bronze";
    var next = "silver";
    var currentMax = 0;
    var nextMin = 500;
    var spentNextMin = 5000;
    if (pts >= 5000 || spent >= 50000) return { current: "black", next: null, progress: 100, needed: 0 };
    if (pts >= 2000 || spent >= 15000) { current = "gold"; next = "black"; nextMin = 5000; spentNextMin = 50000; }
    else if (pts >= 500 || spent >= 5000) { current = "silver"; next = "gold"; nextMin = 2000; spentNextMin = 15000; }
    else { current = "bronze"; next = "silver"; nextMin = 500; spentNextMin = 5000; }
    var ptsProgress = Math.min(100, (pts / nextMin) * 100);
    var spentProgress = Math.min(100, (spent / spentNextMin) * 100);
    var progress = Math.max(ptsProgress, spentProgress);
    var needed = Math.max(0, nextMin - pts);
    return { current: current, next: next, progress: Math.round(progress), needed: needed };
  }

  app.post("/api/public/rewards/redeem", async function (req, res) {
    try {
      var authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Auth required" });
      var decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      if (!decoded || decoded.role !== "customer") return res.status(401).json({ success: false, message: "Auth required" });

      var { points_to_redeem } = req.body;
      points_to_redeem = parseInt(points_to_redeem) || 0;
      if (points_to_redeem < 100) return res.status(400).json({ success: false, message: "Minimum 100 points to redeem" });

      var cust = await pool.query("SELECT redeemable_points, total_points FROM customers WHERE id = $1", [decoded.id]);
      if (cust.rows.length === 0 || (cust.rows[0].redeemable_points || 0) < points_to_redeem) {
        return res.status(400).json({ success: false, message: "Insufficient redeemable points" });
      }

      await pool.query("UPDATE customers SET redeemable_points = redeemable_points - $1, total_points = total_points - $1 WHERE id = $2", [points_to_redeem, decoded.id]);
      await pool.query(
        "INSERT INTO rewards (customer_id, points, type, description) VALUES ($1, $2, 'redeem', $3)",
        [decoded.id, -points_to_redeem, "Redeemed " + points_to_redeem + " points"]
      );
      await updateCustomerTier(decoded.id);

      var discount = Math.floor(points_to_redeem / 100) * 10;
      res.json({ success: true, discount: discount, message: "Rs. " + discount + " discount applied" });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to redeem points" });
    }
  });

  // ===========================
  // SCRATCH CARD API
  // ===========================

  app.get("/api/public/scratch-cards", async function (req, res) {
    try {
      var authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) return res.json({ success: true, cards: [] });
      var decoded;
      try { decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET); } catch (e) { return res.json({ success: true, cards: [] }); }
      if (!decoded || decoded.role !== "customer") return res.json({ success: true, cards: [] });

      var cards = await pool.query(
        `SELECT * FROM scratch_cards WHERE customer_id = $1 AND (is_revealed = FALSE OR (is_revealed = TRUE AND is_redeemed = FALSE AND expires_at > NOW()))
         ORDER BY created_at DESC LIMIT 5`,
        [decoded.id]
      );
      res.json({ success: true, cards: cards.rows });
    } catch (err) {
      res.json({ success: true, cards: [] });
    }
  });

  app.post("/api/public/scratch-cards/:id/reveal", async function (req, res) {
    try {
      var authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Auth required" });
      var decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      if (!decoded || decoded.role !== "customer") return res.status(401).json({ success: false, message: "Auth required" });

      var card = await pool.query(
        "SELECT * FROM scratch_cards WHERE id = $1 AND customer_id = $2 AND is_revealed = FALSE",
        [req.params.id, decoded.id]
      );
      if (card.rows.length === 0) return res.status(404).json({ success: false, message: "Card not found or already revealed" });

      await pool.query("UPDATE scratch_cards SET is_revealed = TRUE WHERE id = $1", [req.params.id]);
      res.json({ success: true, card: card.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/public/scratch-cards/:id/redeem", async function (req, res) {
    try {
      var authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ success: false, message: "Auth required" });
      var decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      if (!decoded || decoded.role !== "customer") return res.status(401).json({ success: false, message: "Auth required" });

      var card = await pool.query(
        "SELECT * FROM scratch_cards WHERE id = $1 AND customer_id = $2 AND is_revealed = TRUE AND is_redeemed = FALSE",
        [req.params.id, decoded.id]
      );
      if (card.rows.length === 0) return res.status(404).json({ success: false, message: "Card not found or already redeemed" });

      var c = card.rows[0];
      if (c.expires_at && new Date(c.expires_at) < new Date()) {
        return res.status(400).json({ success: false, message: "Card expired" });
      }

      await pool.query("UPDATE scratch_cards SET is_redeemed = TRUE WHERE id = $1", [req.params.id]);

      if (c.reward_type === "points") {
        await addRewardPoints(decoded.id, c.reward_value, "scratch_card", c.reward_text, c.order_id);
      }

      res.json({ success: true, message: "Reward redeemed: " + c.reward_text });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  async function createScratchCard(customerId, orderId) {
    try {
      var rewards = [
        { type: "points", value: 50, text: "50 Bonus Points!" },
        { type: "points", value: 100, text: "100 Bonus Points!" },
        { type: "points", value: 200, text: "200 Bonus Points!" },
        { type: "discount", value: 10, text: "10% Off Next Order!" },
        { type: "discount", value: 15, text: "15% Off Next Order!" },
        { type: "points", value: 500, text: "500 Bonus Points!" },
        { type: "freebie", value: 0, text: "Free Cap with Next Order!" },
      ];
      var pick = rewards[Math.floor(Math.random() * rewards.length)];
      var expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await pool.query(
        `INSERT INTO scratch_cards (customer_id, order_id, reward_type, reward_value, reward_text, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [customerId, orderId, pick.type, pick.value, pick.text, expires]
      );
    } catch (e) { console.error("createScratchCard error:", e.message); }
  }

  // ===========================
  // COMING SOON API
  // ===========================

  app.get("/api/public/coming-soon", async function (req, res) {
    try {
      var result = await pool.query(
        "SELECT * FROM coming_soon WHERE launch_date > NOW() OR launch_date IS NULL ORDER BY launch_date ASC NULLS LAST LIMIT 10"
      );
      res.json({ success: true, items: result.rows });
    } catch (err) {
      res.json({ success: true, items: [] });
    }
  });

  app.post("/api/public/coming-soon/:id/notify", async function (req, res) {
    try {
      var { email } = req.body;
      if (!email) return res.status(400).json({ success: false, message: "Email required" });
      var result = await pool.query(
        "UPDATE coming_soon SET notify_emails = notify_emails || $1::jsonb WHERE id = $2 RETURNING notify_emails",
        [JSON.stringify([email]), req.params.id]
      );
      res.json({ success: true, message: "We'll notify you when it launches!" });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/admin/coming-soon", verifyAdmin, async function (req, res) {
    try {
      var { name, description, image_url, launch_date, category } = req.body;
      if (!name) return res.status(400).json({ success: false, message: "Name required" });
      var result = await pool.query(
        "INSERT INTO coming_soon (name, description, image_url, launch_date, category) VALUES ($1,$2,$3,$4,$5) RETURNING *",
        [name, description || null, image_url || null, launch_date || null, category || null]
      );
      res.status(201).json({ success: true, item: result.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete("/api/admin/coming-soon/:id", verifyAdmin, async function (req, res) {
    try {
      await pool.query("DELETE FROM coming_soon WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ===========================
  // CUSTOMER GALLERY API
  // ===========================

  app.get("/api/public/gallery", async function (req, res) {
    try {
      var result = await pool.query(
        `SELECT cg.*, p.name as product_name
         FROM customer_gallery cg
         LEFT JOIN products p ON cg.product_id = p.id
         WHERE cg.is_approved = TRUE
         ORDER BY cg.created_at DESC LIMIT 30`
      );
      res.json({ success: true, gallery: result.rows });
    } catch (err) {
      res.json({ success: true, gallery: [] });
    }
  });

  app.post("/api/public/gallery", upload.single("image"), async function (req, res) {
    try {
      var authHeader = req.headers.authorization;
      var customerId = null;
      var customerName = "Anonymous";
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          var decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
          if (decoded && decoded.id && decoded.role === "customer") {
            customerId = decoded.id;
            var cust = await pool.query("SELECT name FROM customers WHERE id = $1", [decoded.id]);
            if (cust.rows.length > 0) customerName = cust.rows[0].name;
          }
        } catch (e) {}
      }

      var imageUrl;
      if (req.file) {
        var cloudResult = await cloudinaryUpload.upload(req.file.path);
        imageUrl = cloudResult.url;
      } else if (req.body.image_url) {
        imageUrl = req.body.image_url;
      } else {
        return res.status(400).json({ success: false, message: "Image required" });
      }

      var { product_id, caption } = req.body;
      var result = await pool.query(
        "INSERT INTO customer_gallery (customer_id, customer_name, image_url, product_id, caption) VALUES ($1,$2,$3,$4,$5) RETURNING *",
        [customerId, customerName, imageUrl, product_id || null, caption || null]
      );
      res.status(201).json({ success: true, photo: result.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/admin/gallery", verifyAdmin, async function (req, res) {
    try {
      var result = await pool.query(
        `SELECT cg.*, p.name as product_name FROM customer_gallery cg LEFT JOIN products p ON cg.product_id = p.id ORDER BY cg.created_at DESC`
      );
      res.json({ success: true, gallery: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.put("/api/admin/gallery/:id/approve", verifyAdmin, async function (req, res) {
    try {
      await pool.query("UPDATE customer_gallery SET is_approved = TRUE WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete("/api/admin/gallery/:id", verifyAdmin, async function (req, res) {
    try {
      await pool.query("DELETE FROM customer_gallery WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ===========================
  // VAULT API
  // ===========================

  app.post("/api/public/vault/access", async function (req, res) {
    try {
      var { code } = req.body;
      if (!code) return res.status(400).json({ success: false, message: "Code required" });
      var result = await pool.query(
        `SELECT vp.*, p.name, p.price, p.original_price, p.image_url, p.description, p.category
         FROM vault_products vp
         JOIN products p ON vp.product_id = p.id
         WHERE vp.access_code = $1 AND vp.is_active = TRUE`,
        [code.toUpperCase()]
      );
      if (result.rows.length === 0) return res.status(403).json({ success: false, message: "Invalid access code" });
      res.json({ success: true, products: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.get("/api/admin/vault", verifyAdmin, async function (req, res) {
    try {
      var result = await pool.query(
        `SELECT vp.*, p.name, p.price, p.image_url FROM vault_products vp LEFT JOIN products p ON vp.product_id = p.id ORDER BY vp.id DESC`
      );
      res.json({ success: true, products: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post("/api/admin/vault", verifyAdmin, async function (req, res) {
    try {
      var { product_id, vault_price, access_code } = req.body;
      if (!product_id || !vault_price) return res.status(400).json({ success: false, message: "Product and price required" });
      var result = await pool.query(
        "INSERT INTO vault_products (product_id, vault_price, access_code) VALUES ($1, $2, $3) RETURNING *",
        [product_id, vault_price, (access_code || "PEHRAWA").toUpperCase()]
      );
      res.status(201).json({ success: true, product: result.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ===========================
  // ENHANCED SEARCH API
  // ===========================

  app.get("/api/public/search", async function (req, res) {
    try {
      var { q, category, color, min_price, max_price, sort } = req.query;
      var query = "SELECT * FROM products WHERE 1=1";
      var params = [];
      var idx = 1;

      if (q && q.trim()) {
        query += " AND (LOWER(name) LIKE LOWER($" + idx + ") OR LOWER(description) LIKE LOWER($" + idx + ") OR LOWER(category) LIKE LOWER($" + idx + ") OR LOWER(name) LIKE LOWER($" + (idx + 1) + "))";
        params.push("%" + q.trim() + "%", q.trim().split(/\s+/).join("%"));
        idx += 2;
      }
      if (category && category !== "ALL") {
        query += " AND LOWER(category) LIKE LOWER($" + idx + ")";
        params.push("%" + category + "%");
        idx++;
      }
      if (color) {
        query += " AND LOWER(color) = LOWER($" + idx + ")";
        params.push(color);
        idx++;
      }
      if (min_price) {
        query += " AND price >= $" + idx;
        params.push(parseFloat(min_price));
        idx++;
      }
      if (max_price) {
        query += " AND price <= $" + idx;
        params.push(parseFloat(max_price));
        idx++;
      }

      if (sort === "price_asc") query += " ORDER BY price ASC";
      else if (sort === "price_desc") query += " ORDER BY price DESC";
      else if (sort === "oldest") query += " ORDER BY id ASC";
      else query += " ORDER BY id DESC";

      var result = await pool.query(query, params);
      res.json({ success: true, products: result.rows, total: result.rows.length });
    } catch (err) {
      console.error("Search error:", err.message);
      res.status(500).json({ success: false, message: "Search failed" });
    }
  });

  // ===========================
  // DAILY DROP AUTO-ROTATION
  // ===========================
  async function autoAssignDailyDrop() {
    try {
      var today = new Date().toISOString().slice(0, 10);
      var existing = await pool.query(
        "SELECT id FROM daily_drops WHERE active_date = $1 AND is_active = TRUE",
        [today]
      );
      if (existing.rows.length > 0) return;
      var recentDrops = await pool.query("SELECT product_id FROM daily_drops ORDER BY active_date DESC LIMIT 10");
      var excludeIds = recentDrops.rows.map(function(r) { return r.product_id; });
      var excludeClause = excludeIds.length > 0 ? "AND id NOT IN (" + excludeIds.join(",") + ")" : "";
      var candidates = await pool.query(
        "SELECT id FROM products WHERE stock > 0 AND stock_status != 'out_of_stock' " + excludeClause + " ORDER BY RANDOM() LIMIT 1"
      );
      if (candidates.rows.length === 0) {
        candidates = await pool.query("SELECT id FROM products WHERE stock > 0 ORDER BY RANDOM() LIMIT 1");
      }
      if (candidates.rows.length === 0) return;
      await pool.query(
        "INSERT INTO daily_drops (product_id, active_date, is_active) VALUES ($1, $2, TRUE)",
        [candidates.rows[0].id, today]
      );
      console.log("Auto-assigned daily drop for " + today + ": product " + candidates.rows[0].id);
    } catch (e) { console.error("autoAssignDailyDrop error:", e.message); }
  }

  autoAssignDailyDrop();
  setInterval(function () {
    var now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) autoAssignDailyDrop();
  }, 60000);

  // ===========================
  // WISHLIST API
  // ===========================
  function verifyCustomerToken(req) {
    var authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    try {
      var decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      if (decoded && decoded.id && decoded.role === "customer") return decoded.id;
    } catch (e) {}
    return null;
  }

  app.get("/api/user/wishlist", async function (req, res) {
    try {
      var customerId = verifyCustomerToken(req);
      if (!customerId) return res.json({ success: true, wishlist: [] });
      var result = await pool.query(
        `SELECT w.id, w.product_id, w.price_when_added, w.created_at,
                p.name, p.price, p.original_price, p.image_url, p.stock_status
         FROM wishlists w
         JOIN products p ON w.product_id = p.id
         WHERE w.customer_id = $1 ORDER BY w.created_at DESC`,
        [customerId]
      );
      res.json({ success: true, wishlist: result.rows });
    } catch (err) {
      res.json({ success: true, wishlist: [] });
    }
  });

  app.post("/api/user/wishlist", async function (req, res) {
    try {
      var customerId = verifyCustomerToken(req);
      if (!customerId) return res.status(401).json({ success: false, message: "Auth required" });
      var { product_id } = req.body;
      if (!product_id) return res.status(400).json({ success: false, message: "Product ID required" });
      var product = await pool.query("SELECT id, price FROM products WHERE id = $1", [product_id]);
      if (product.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found" });
      var result = await pool.query(
        `INSERT INTO wishlists (customer_id, product_id, price_when_added)
         VALUES ($1, $2, $3)
         ON CONFLICT (customer_id, product_id) DO NOTHING
         RETURNING *`,
        [customerId, product_id, product.rows[0].price]
      );
      res.json({ success: true, message: "Added to wishlist", item: result.rows[0] || null });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to add to wishlist" });
    }
  });

  app.delete("/api/user/wishlist/:productId", async function (req, res) {
    try {
      var customerId = verifyCustomerToken(req);
      if (!customerId) return res.status(401).json({ success: false, message: "Auth required" });
      await pool.query("DELETE FROM wishlists WHERE customer_id = $1 AND product_id = $2", [customerId, req.params.productId]);
      res.json({ success: true, message: "Removed from wishlist" });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to remove from wishlist" });
    }
  });

  app.get("/api/user/wishlist/check/:productId", async function (req, res) {
    try {
      var customerId = verifyCustomerToken(req);
      if (!customerId) return res.json({ success: true, inWishlist: false });
      var result = await pool.query("SELECT id FROM wishlists WHERE customer_id = $1 AND product_id = $2", [customerId, req.params.productId]);
      res.json({ success: true, inWishlist: result.rows.length > 0 });
    } catch (err) {
      res.json({ success: true, inWishlist: false });
    }
  });

  // ===========================
  // RECENTLY VIEWED API
  // ===========================
  app.post("/api/user/recently-viewed", async function (req, res) {
    try {
      var customerId = verifyCustomerToken(req);
      if (!customerId) return res.json({ success: true });
      var { product_id } = req.body;
      if (!product_id) return res.json({ success: true });
      await pool.query("DELETE FROM product_views WHERE customer_id = $1 AND product_id = $2", [customerId, product_id]);
      await pool.query("INSERT INTO product_views (customer_id, product_id) VALUES ($1, $2)", [customerId, product_id]);
      await pool.query(
        "DELETE FROM product_views WHERE id NOT IN (SELECT id FROM product_views WHERE customer_id = $1 ORDER BY viewed_at DESC LIMIT 50)",
        [customerId]
      );
      res.json({ success: true });
    } catch (err) {
      res.json({ success: true });
    }
  });

  app.get("/api/user/recently-viewed", async function (req, res) {
    try {
      var customerId = verifyCustomerToken(req);
      if (!customerId) return res.json({ success: true, products: [] });
      var result = await pool.query(
        `SELECT pv.viewed_at, p.id, p.name, p.price, p.original_price, p.image_url, p.stock_status
         FROM product_views pv
         JOIN products p ON pv.product_id = p.id
         WHERE pv.customer_id = $1
         ORDER BY pv.viewed_at DESC LIMIT 12`,
        [customerId]
      );
      res.json({ success: true, products: result.rows });
    } catch (err) {
      res.json({ success: true, products: [] });
    }
  });

  // ===========================
  // PRICE ALERTS API
  // ===========================
  app.post("/api/user/price-alerts", async function (req, res) {
    try {
      var customerId = verifyCustomerToken(req);
      if (!customerId) return res.status(401).json({ success: false, message: "Auth required" });
      var { product_id } = req.body;
      if (!product_id) return res.status(400).json({ success: false, message: "Product ID required" });
      var product = await pool.query("SELECT id, price FROM products WHERE id = $1", [product_id]);
      if (product.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found" });
      var currentPrice = parseFloat(product.rows[0].price);
      var result = await pool.query(
        `INSERT INTO price_alerts (customer_id, product_id, target_price)
         VALUES ($1, $2, $3)
         ON CONFLICT (customer_id, product_id) DO UPDATE SET target_price = $3, is_active = TRUE
         RETURNING *`,
        [customerId, product_id, currentPrice]
      );
      res.json({ success: true, message: "Price alert set! We'll notify you when the price drops." });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to set price alert" });
    }
  });

  app.get("/api/user/price-alerts", async function (req, res) {
    try {
      var customerId = verifyCustomerToken(req);
      if (!customerId) return res.json({ success: true, alerts: [] });
      var result = await pool.query(
        `SELECT pa.*, p.name, p.price, p.image_url
         FROM price_alerts pa
         JOIN products p ON pa.product_id = p.id
         WHERE pa.customer_id = $1 AND pa.is_active = TRUE
         ORDER BY pa.created_at DESC`,
        [customerId]
      );
      res.json({ success: true, alerts: result.rows });
    } catch (err) {
      res.json({ success: true, alerts: [] });
    }
  });

  app.delete("/api/user/price-alerts/:id", async function (req, res) {
    try {
      var customerId = verifyCustomerToken(req);
      if (!customerId) return res.status(401).json({ success: false, message: "Auth required" });
      await pool.query("DELETE FROM price_alerts WHERE id = $1 AND customer_id = $2", [req.params.id, customerId]);
      res.json({ success: true, message: "Price alert cancelled" });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to cancel alert" });
    }
  });

  app.get("/api/user/price-alerts/check/:productId", async function (req, res) {
    try {
      var customerId = verifyCustomerToken(req);
      if (!customerId) return res.json({ success: true, hasAlert: false });
      var result = await pool.query("SELECT id FROM price_alerts WHERE customer_id = $1 AND product_id = $2 AND is_active = TRUE", [customerId, req.params.productId]);
      res.json({ success: true, hasAlert: result.rows.length > 0 });
    } catch (err) {
      res.json({ success: true, hasAlert: false });
    }
  });

  // ===========================
  // REWARD DASHBOARD API
  // ===========================
  app.get("/api/user/reward-dashboard", async function (req, res) {
    try {
      var customerId = verifyCustomerToken(req);
      if (!customerId) return res.json({
        success: true, dashboard: {
          tier: "bronze", tierBenefits: getTierBenefits("bronze"),
          points: { lifetime: 0, redeemable: 0 },
          progress: getTierProgress(0, 0),
          history: [], scratchCards: { unrevealed: 0, unredeemed: 0 },
          priceAlerts: 0, wishlistCount: 0, orderCount: 0, totalSpent: 0
        }
      });

      var cust = await pool.query(
        "SELECT total_points, lifetime_points, redeemable_points, membership_tier, total_spent, tier_upgraded_at, created_at FROM customers WHERE id = $1",
        [customerId]
      );
      if (cust.rows.length === 0) return res.json({ success: true, dashboard: null });
      var c = cust.rows[0];
      var tier = c.membership_tier || "bronze";
      var pts = parseInt(c.total_points) || 0;
      var spent = parseFloat(c.total_spent) || 0;

      var history = await pool.query(
        "SELECT points, type, description, created_at FROM rewards WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 30",
        [customerId]
      );

      var scratchStats = await pool.query(
        `SELECT
           SUM(CASE WHEN is_revealed = FALSE THEN 1 ELSE 0 END)::int as unrevealed,
           SUM(CASE WHEN is_revealed = TRUE AND is_redeemed = FALSE THEN 1 ELSE 0 END)::int as unredeemed
         FROM scratch_cards WHERE customer_id = $1`,
        [customerId]
      );

      var alertCount = await pool.query("SELECT COUNT(*)::int as cnt FROM price_alerts WHERE customer_id = $1 AND is_active = TRUE", [customerId]);
      var wishlistCount = await pool.query("SELECT COUNT(*)::int as cnt FROM wishlists WHERE customer_id = $1", [customerId]);
      var orderCount = await pool.query("SELECT COUNT(*)::int as cnt FROM orders WHERE customer_id = $1 AND payment_status = 'paid'", [customerId]);

      res.json({
        success: true,
        dashboard: {
          tier: tier,
          tierBenefits: getTierBenefits(tier),
          points: {
            lifetime: parseInt(c.lifetime_points) || pts,
            redeemable: parseInt(c.redeemable_points) || pts,
            current: pts
          },
          progress: getTierProgress(pts, spent),
          tierUpgradedAt: c.tier_upgraded_at,
          memberSince: c.created_at,
          history: history.rows,
          scratchCards: {
            unrevealed: scratchStats.rows[0].unrevealed || 0,
            unredeemed: scratchStats.rows[0].unredeemed || 0
          },
          priceAlerts: alertCount.rows[0].cnt || 0,
          wishlistCount: wishlistCount.rows[0].cnt || 0,
          orderCount: orderCount.rows[0].cnt || 0,
          totalSpent: spent
        }
      });
    } catch (err) {
      console.error("Reward dashboard error:", err.message);
      res.json({ success: true, dashboard: null });
    }
  });

  // ===========================
  // TIER INFO API (public, no auth needed)
  // ===========================
  app.get("/api/public/tier-info", async function (req, res) {
    try {
      res.json({
        success: true,
        tiers: {
          bronze: { name: "Bronze", color: "#cd7f32", pointsMultiplier: 1, freeShipping: false, earlyAccess: false, discount: 0, minPoints: 0, minSpent: 0 },
          silver: { name: "Silver", color: "#c0c0c0", pointsMultiplier: 1.2, freeShipping: true, earlyAccess: false, discount: 3, minPoints: 500, minSpent: 5000 },
          gold: { name: "Gold", color: "#ffd700", pointsMultiplier: 1.5, freeShipping: true, earlyAccess: true, discount: 5, minPoints: 2000, minSpent: 15000 },
          black: { name: "Black", color: "#1a1a1a", pointsMultiplier: 2, freeShipping: true, earlyAccess: true, discount: 10, minPoints: 5000, minSpent: 50000 }
        }
      });
    } catch (err) {
      res.json({ success: true, tiers: {} });
    }
  });

  // ===========================
  // ENHANCED ORDER - add points + scratch card (already handled in order POST)
  // ===========================

  // ===========================
  // VAULT ACCESS CODE VALIDATION
  // ===========================
  app.get("/api/public/vault/validate", async function (req, res) {
    try {
      var { code } = req.query;
      if (!code) return res.json({ success: false });
      var result = await pool.query("SELECT id FROM vault_products WHERE access_code = $1 AND is_active = TRUE", [code.toUpperCase()]);
      res.json({ success: result.rows.length > 0 });
    } catch (err) {
      res.json({ success: false });
    }
  });

  console.log("All luxury fashion feature routes initialized");

  // ===========================
  // REFERRAL PROGRAM API
  // ===========================

  function generateReferralCode(name) {
    var base = (name || "USER").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 5);
    var suffix = Math.random().toString(36).toUpperCase().slice(2, 6);
    return base + suffix;
  }

  // Get or create referral code for customer
  app.get("/api/user/referral-code", async function (req, res) {
    try {
      var customerId = verifyCustomerToken(req);
      if (!customerId) return res.status(401).json({ success: false, message: "Auth required" });

      var existing = await pool.query("SELECT * FROM referral_codes WHERE customer_id = $1 AND is_active = TRUE", [customerId]);
      if (existing.rows.length > 0) {
        var code = existing.rows[0];
        var stats = await pool.query(
          "SELECT COUNT(*)::int as referred, COUNT(CASE WHEN r.reward_given THEN 1 END)::int as rewarded FROM referrals r WHERE r.referral_code = $1",
          [code.code]
        );
        var s = stats.rows[0];
        return res.json({ success: true, code: code.code, totalReferred: s.referred, totalRewarded: s.rewarded, totalEarned: parseFloat(code.total_earned) || 0 });
      }

      var cust = await pool.query("SELECT name FROM customers WHERE id = $1", [customerId]);
      var code = generateReferralCode(cust.rows[0] && cust.rows[0].name);
      await pool.query("INSERT INTO referral_codes (customer_id, code) VALUES ($1, $2)", [customerId, code]);
      await pool.query("UPDATE customers SET referral_code = $1 WHERE id = $2", [code, customerId]);
      res.json({ success: true, code: code, totalReferred: 0, totalRewarded: 0, totalEarned: 0 });
    } catch (err) {
      console.error("Referral code error:", err.message);
      res.status(500).json({ success: false, message: "Failed to get referral code" });
    }
  });

  // Apply referral on signup (called from customer registration)
  app.post("/api/public/referral/apply", async function (req, res) {
    try {
      var { referralCode, newCustomerId } = req.body;
      if (!referralCode || !newCustomerId) return res.json({ success: false, message: "Missing data" });

      var refCode = await pool.query("SELECT * FROM referral_codes WHERE code = $1 AND is_active = TRUE", [referralCode.toUpperCase()]);
      if (refCode.rows.length === 0) return res.json({ success: false, message: "Invalid referral code" });

      var rc = refCode.rows[0];
      if (rc.customer_id === newCustomerId) return res.json({ success: false, message: "Cannot refer yourself" });

      var alreadyReferred = await pool.query("SELECT id FROM referrals WHERE referred_id = $1", [newCustomerId]);
      if (alreadyReferred.rows.length > 0) return res.json({ success: false, message: "Already referred" });

      await pool.query("INSERT INTO referrals (referrer_id, referred_id, referral_code) VALUES ($1, $2, $3)", [rc.customer_id, newCustomerId, referralCode.toUpperCase()]);
      await pool.query("UPDATE referral_codes SET total_referrals = total_referrals + 1 WHERE id = $1", [rc.id]);
      res.json({ success: true, message: "Referral recorded" });
    } catch (err) {
      console.error("Referral apply error:", err.message);
      res.json({ success: false, message: "Failed to apply referral" });
    }
  });

  // Reward referrer after referred user's first order
  app.post("/api/public/referral/reward", async function (req, res) {
    try {
      var { orderId, customerId } = req.body;
      if (!orderId || !customerId) return res.json({ success: false });

      var ref = await pool.query("SELECT * FROM referrals WHERE referred_id = $1 AND reward_given = FALSE LIMIT 1", [customerId]);
      if (ref.rows.length === 0) return res.json({ success: false });

      var r = ref.rows[0];
      var REWARD_POINTS = 200;
      var REFERRED_DISCOUNT = 100;

      // Reward referrer
      await addRewardPoints(r.referrer_id, REWARD_POINTS, "referral", "Referral reward for bringing a friend", orderId);

      // Discount for referred customer
      await pool.query("UPDATE customers SET redeemable_points = redeemable_points + $1 WHERE id = $2", [REFERRED_DISCOUNT, customerId]);
      await pool.query("INSERT INTO rewards (customer_id, points, type, description, order_id) VALUES ($1, $2, 'referral_bonus', 'Welcome referral bonus', $3)", [customerId, REFERRED_DISCOUNT, orderId]);

      await pool.query("UPDATE referrals SET reward_given = TRUE, order_id = $1 WHERE id = $2", [orderId, r.id]);
      await pool.query("UPDATE referral_codes SET total_earned = total_earned + $1 WHERE id = $2", [REWARD_POINTS, r.referrer_id]);

      res.json({ success: true });
    } catch (err) {
      console.error("Referral reward error:", err.message);
      res.json({ success: false });
    }
  });

  // Get referral stats
  app.get("/api/user/referral-stats", async function (req, res) {
    try {
      var customerId = verifyCustomerToken(req);
      if (!customerId) return res.status(401).json({ success: false, message: "Auth required" });

      var codeRow = await pool.query("SELECT * FROM referral_codes WHERE customer_id = $1 AND is_active = TRUE", [customerId]);
      if (codeRow.rows.length === 0) return res.json({ success: true, code: null, referrals: [], stats: { total: 0, rewarded: 0, earned: 0 } });

      var code = codeRow.rows[0];
      var referrals = await pool.query(
        `SELECT r.created_at, r.reward_given, c.name as referred_name
         FROM referrals r LEFT JOIN customers c ON r.referred_id = c.id
         WHERE r.referral_code = $1 ORDER BY r.created_at DESC LIMIT 20`,
        [code.code]
      );
      var stats = await pool.query(
        "SELECT COUNT(*)::int as total, COUNT(CASE WHEN reward_given THEN 1 END)::int as rewarded FROM referrals WHERE referral_code = $1",
        [code.code]
      );
      var s = stats.rows[0];
      res.json({ success: true, code: code.code, referrals: referrals.rows, stats: { total: s.total, rewarded: s.rewarded, earned: parseFloat(code.total_earned) || 0 } });
    } catch (err) {
      console.error("Referral stats error:", err.message);
      res.status(500).json({ success: false, message: "Failed to load stats" });
    }
  });

  // ===========================
  // PEHRAWA PASSPORT API
  // ===========================
  app.get("/api/user/passport", async function (req, res) {
    try {
      var customerId = verifyCustomerToken(req);
      if (!customerId) return res.status(401).json({ success: false, message: "Auth required" });

      var cust = await pool.query(
        "SELECT name, email, phone, membership_tier, lifetime_points, redeemable_points, total_spent, created_at FROM customers WHERE id = $1",
        [customerId]
      );
      if (cust.rows.length === 0) return res.status(404).json({ success: false, message: "Customer not found" });
      var c = cust.rows[0];

      var tier = c.membership_tier || "bronze";
      var lifetime = parseInt(c.lifetime_points) || 0;
      var redeemable = parseInt(c.redeemable_points) || 0;
      var spent = parseFloat(c.total_spent) || 0;

      // Order stats
      var orderStats = await pool.query(
        `SELECT COUNT(*)::int as totalOrders, COALESCE(SUM(total_amount),0)::numeric as totalValue,
         MIN(created_at) as firstOrder, MAX(created_at) as lastOrder
         FROM orders WHERE customer_id = $1 AND payment_status = 'paid'`,
        [customerId]
      );
      var os = orderStats.rows[0];

      // Reward history
      var history = await pool.query(
        "SELECT points, type, description, created_at FROM rewards WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 30",
        [customerId]
      );

      // Scratch card stats
      var scratchStats = await pool.query(
        `SELECT
           SUM(CASE WHEN is_revealed = FALSE THEN 1 ELSE 0 END)::int as unrevealed,
           SUM(CASE WHEN is_revealed = TRUE AND is_redeemed = TRUE THEN 1 ELSE 0 END)::int as redeemed,
           SUM(CASE WHEN is_revealed = TRUE AND is_redeemed = FALSE THEN 1 ELSE 0 END)::int as unredeemed
         FROM scratch_cards WHERE customer_id = $1`,
        [customerId]
      );
      var sc = scratchStats.rows[0];

      // Wishlist count
      var wlCount = await pool.query("SELECT COUNT(*)::int as cnt FROM wishlists WHERE customer_id = $1", [customerId]);

      // Referral stats
      var refCode = await pool.query("SELECT code, total_referrals, total_earned FROM referral_codes WHERE customer_id = $1 AND is_active = TRUE", [customerId]);
      var ref = refCode.rows[0] || { code: null, total_referrals: 0, total_earned: 0 };

      // Calculate badges
      var badges = [];
      if (os.totalOrders >= 1) badges.push({ id: "first_order", name: "First Purchase", icon: "fa-bag-shopping", color: "#ff6b00", desc: "Made your first order" });
      if (os.totalOrders >= 5) badges.push({ id: "loyal_5", name: "Loyal Customer", icon: "fa-heart", color: "#e74c3c", desc: "Completed 5 orders" });
      if (os.totalOrders >= 10) badges.push({ id: "loyal_10", name: "Pehrawa Legend", icon: "fa-crown", color: "#ffd700", desc: "Completed 10 orders" });
      if (spent >= 5000) badges.push({ id: "big_spender_5k", name: "Big Spender", icon: "fa-gem", color: "#9b59b6", desc: "Spent over ₹5,000" });
      if (spent >= 15000) badges.push({ id: "big_spender_15k", name: "VIP Shopper", icon: "fa-star", color: "#f39c12", desc: "Spent over ₹15,000" });
      if (spent >= 50000) badges.push({ id: "big_spender_50k", name: "Pehrawa Royalty", icon: "fa-trophy", color: "#1a1a1a", desc: "Spent over ₹50,000" });
      if (ref.total_referrals >= 1) badges.push({ id: "ref_1", name: "First Referral", icon: "fa-user-plus", color: "#3498db", desc: "Referred your first friend" });
      if (ref.total_referrals >= 5) badges.push({ id: "ref_5", name: "Brand Ambassador", icon: "fa-share-nodes", color: "#2ecc71", desc: "Referred 5 friends" });
      if (lifetime >= 500) badges.push({ id: "pts_500", name: "Point Collector", icon: "fa-coins", color: "#f1c40f", desc: "Earned 500 lifetime points" });
      if (lifetime >= 2000) badges.push({ id: "pts_2k", name: "Points Master", icon: "fa-coins", color: "#e67e22", desc: "Earned 2,000 lifetime points" });
      if (sc.redeemed >= 3) badges.push({ id: "scratch_3", name: "Lucky Streak", icon: "fa-dice", color: "#1abc9c", desc: "Redeemed 3 scratch cards" });
      if (tier === "silver") badges.push({ id: "tier_silver", name: "Silver Member", icon: "fa-medal", color: "#c0c0c0", desc: "Reached Silver tier" });
      if (tier === "gold") badges.push({ id: "tier_gold", name: "Gold Member", icon: "fa-medal", color: "#ffd700", desc: "Reached Gold tier" });
      if (tier === "black") badges.push({ id: "tier_black", name: "Black Member", icon: "fa-medal", color: "#1a1a1a", desc: "Reached Black tier" });

      // Days since first order
      var memberDays = 0;
      if (os.firstOrder) {
        memberDays = Math.floor((Date.now() - new Date(os.firstOrder).getTime()) / 86400000);
      }

      // Estimated savings from discounts applied
      var totalSavings = Math.round(spent * (getTierBenefits(tier).discount || 0) / 100);

      res.json({
        success: true,
        passport: {
          customer: { name: c.name, email: c.email, phone: c.phone },
          tier: tier,
          tierBenefits: getTierBenefits(tier),
          tierProgress: getTierProgress(lifetime, spent),
          points: { lifetime: lifetime, redeemable: redeemable },
          stats: {
            totalOrders: os.totalOrders,
            totalSpent: spent,
            totalSavings: totalSavings,
            memberDays: memberDays,
            memberSince: c.created_at,
            firstOrder: os.firstOrder,
            lastOrder: os.lastOrder
          },
          badges: badges,
          scratchCards: { unrevealed: sc.unrevealed || 0, unredeemed: sc.unredeemed || 0, redeemed: sc.redeemed || 0 },
          history: history.rows,
          referral: { code: ref.code, totalReferred: ref.total_referrals, totalEarned: parseFloat(ref.total_earned) || 0 },
          wishlistCount: wlCount.rows[0].cnt || 0
        }
      });
    } catch (err) {
      console.error("Passport error:", err.message, err.stack);
      res.status(500).json({ success: false, message: "Failed to load passport", detail: err.message });
    }
  });

  // ===========================
  // TRENDING PRODUCTS API (real data from views + orders)
  // ===========================
  app.get("/api/public/trending", async function (req, res) {
    try {
      var limit = parseInt(req.query.limit) || 8;
      // Score = recent views (7d) + orders (14d) weighted
      var result = await pool.query(
        `SELECT p.*,
           COALESCE(v.view_score, 0) + COALESCE(o.order_score, 0) as trending_score
         FROM products p
         LEFT JOIN (
           SELECT product_id, COUNT(*)::int * 2 as view_score
           FROM product_views
           WHERE viewed_at > NOW() - INTERVAL '7 days'
           GROUP BY product_id
         ) v ON p.id = v.product_id
         LEFT JOIN (
           SELECT
             (jsonb_array_elements_text(
               CASE WHEN items ~ '^\\[' THEN items::jsonb ELSE '[]'::jsonb END
             )::json->>'id')::int as pid,
             COUNT(*)::int * 5 as order_score
           FROM orders
           WHERE created_at > NOW() - INTERVAL '14 days' AND payment_status = 'paid'
           GROUP BY pid
         ) o ON p.id = o.pid
         WHERE p.stock_status != 'out_of_stock'
         ORDER BY trending_score DESC, p.created_at DESC
         LIMIT $1`,
        [limit]
      );
      res.json({ success: true, products: result.rows });
    } catch (err) {
      console.error("Trending error:", err.message);
      // Fallback: just return newest products
      try {
        var fallback = await pool.query(
          "SELECT *, 0 as trending_score FROM products WHERE stock_status != 'out_of_stock' ORDER BY created_at DESC LIMIT $1",
          [parseInt(req.query.limit) || 8]
        );
        res.json({ success: true, products: fallback.rows });
      } catch (e) {
        res.json({ success: true, products: [] });
      }
    }
  });

  // ===========================
  // PERSONALIZED RECOMMENDATIONS API
  // ===========================
  app.get("/api/user/recommendations", async function (req, res) {
    try {
      var customerId = verifyCustomerToken(req);
      if (!customerId) return res.json({ success: true, products: [], personalized: false });

      // Get viewed product categories
      var viewed = await pool.query(
        `SELECT p.category, COUNT(*)::int as views
         FROM product_views pv
         JOIN products p ON pv.product_id = p.id
         WHERE pv.customer_id = $1 AND pv.viewed_at > NOW() - INTERVAL '30 days'
         GROUP BY p.category ORDER BY views DESC LIMIT 3`,
        [customerId]
      );

      // Get ordered categories
      var ordered = await pool.query(
        `SELECT p.category, COUNT(*)::int as cnt
         FROM orders o, jsonb_array_elements_text(
           CASE WHEN o.items ~ '^\\[' THEN o.items::jsonb ELSE '[]'::jsonb END
         ) item
         JOIN products p ON (item::json->>'id')::int = p.id
         WHERE o.customer_id = $1 AND o.payment_status = 'paid'
         GROUP BY p.category ORDER BY cnt DESC LIMIT 3`,
        [customerId]
      );

      var categories = [];
      viewed.rows.forEach(function (r) { if (r.category && categories.indexOf(r.category) === -1) categories.push(r.category); });
      ordered.rows.forEach(function (r) { if (r.category && categories.indexOf(r.category) === -1) categories.push(r.category); });

      if (categories.length === 0) return res.json({ success: true, products: [], personalized: false });

      // Get viewed product IDs to exclude
      var viewedIds = await pool.query(
        "SELECT product_id FROM product_views WHERE customer_id = $1",
        [customerId]
      );
      var excludeIds = viewedIds.rows.map(function (r) { return r.product_id; });
      excludeIds.push(0); // safety

      // Get recommended products from those categories, excluding already viewed
      var result = await pool.query(
        `SELECT * FROM products
         WHERE category = ANY($1::text[]) AND stock_status != 'out_of_stock' AND id != ALL($2::int[])
         ORDER BY RANDOM() LIMIT 12`,
        [categories, excludeIds]
      );

      if (result.rows.length === 0) {
        // Fallback: random products from preferred categories
        result = await pool.query(
          "SELECT * FROM products WHERE category = ANY($1::text[]) AND stock_status != 'out_of_stock' ORDER BY RANDOM() LIMIT 12",
          [categories]
        );
      }

      res.json({ success: true, products: result.rows, personalized: true, categories: categories });
    } catch (err) {
      console.error("Recommendations error:", err.message);
      res.json({ success: true, products: [], personalized: false });
    }
  });

  // ===========================
  // ENHANCED VAULT - tier-based access + session persistence
  // ===========================
  app.get("/api/user/vault/access", async function (req, res) {
    try {
      var customerId = verifyCustomerToken(req);
      if (!customerId) return res.json({ success: false, hasAccess: false });

      var cust = await pool.query("SELECT membership_tier FROM customers WHERE id = $1", [customerId]);
      if (cust.rows.length === 0) return res.json({ success: false, hasAccess: false });

      var tier = cust.rows[0].membership_tier || "bronze";
      var hasAccess = (tier === "gold" || tier === "black");

      if (hasAccess) {
        var products = await pool.query(
          `SELECT vp.*, p.name, p.price, p.original_price, p.image_url, p.description, p.category
           FROM vault_products vp JOIN products p ON vp.product_id = p.id
           WHERE vp.is_active = TRUE`
        );
        return res.json({ success: true, hasAccess: true, products: products.rows, tier: tier });
      }

      res.json({ success: true, hasAccess: false, tier: tier });
    } catch (err) {
      res.json({ success: false, hasAccess: false });
    }
  });

  // ===========================
  // ADMIN: UPDATE PRODUCT LIMITED EDITION
  // ===========================
  app.put("/api/admin/products/:id/edition", verifyAdmin, async function (req, res) {
    try {
      var { is_limited_edition, edition_number, edition_total } = req.body;
      await pool.query(
        "UPDATE products SET is_limited_edition = $1, edition_number = $2, edition_total = $3 WHERE id = $4",
        [is_limited_edition || false, edition_number || null, edition_total || null, req.params.id]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ===========================
  // AI ANALYTICS HELPER
  // ===========================
  async function logAiEvent(feature, eventType, customerId, metadata) {
    try {
      await pool.query(
        "INSERT INTO ai_analytics (feature, event_type, customer_id, metadata) VALUES ($1, $2, $3, $4)",
        [feature, eventType, customerId || null, JSON.stringify(metadata || {})]
      );
    } catch (e) { /* non-fatal */ }
  }

  // ===========================
  // AI FASHION ASSISTANT CHATBOT
  // ===========================

  // Rule-based fashion knowledge base
  var fashionKB = {
    greetings: ["hey", "hi", "hello", "yo", "sup", "good morning", "good evening"],
    greetings_response: "Hey! Welcome to Pehrawa. I'm your style assistant. Ask me anything about our products, sizing, styling tips, or deals!",
    size_help: ["size", "sizing", "fit", "measurement", "too big", "too small", "which size"],
    size_response: "For our tees, go true to size for a regular fit. Size up for an oversized look. Check our Size Guide for exact measurements. What's your usual size?",
    shipping_help: ["shipping", "delivery", "when", "track", "dispatch", "ship"],
    shipping_response: "We offer free shipping on orders above ₹999! Standard delivery takes 3-5 business days. You can track your order at /track-order with your order ID.",
    price_help: ["price", "cost", "cheap", "affordable", "budget", "deal", "discount", "offer"],
    price_response: "Our tees start at ₹399! Plus, buy 2 tees and get 10% off. Check our Daily Drop for exclusive deals. Want me to suggest something in your budget?",
    trending_help: ["trending", "popular", "best", "selling", "hot", "favourite", "favorite"],
    trending_response: "Our most popular categories are Oversized Tees and Graphic Tees! Want me to show you what's trending right now?",
    category_help: ["t-shirt", "tee", "hoodie", "jeans", "oversized", "graphic", "plain", "pant"],
    category_response: "We have Premium Tees, Oversized Tees, Graphic Tees, Hoodies, and Jeans. Each category is crafted for quality and comfort. Which one interests you?",
    return_help: ["return", "exchange", "refund", "wrong", "damaged"],
    return_response: "We offer easy returns within 7 days of delivery. Contact us at heypehrawa@gmail.com or WhatsApp at +91 98557 07708 for instant support.",
    about_help: ["about", "brand", "who", "story", "pehrawa"],
    about_response: "Pehrawa is a premium menswear brand — 'Home of HM' (Handmade). We focus on quality prints, comfort fabric, and designs that stand out. Made in India, for India.",
    gift_help: ["gift", "surprise", "present", "birthday"],
    gift_response: "Great choice! Our gift options include our best-selling Graphic Tees and Hoodies. Orders above ₹1999 include a free gift! Need help picking something?",
    care_help: ["wash", "care", "maintain", "shrink", "fade"],
    care_response: "Wash inside out in cold water. Avoid bleach. Tumble dry low or hang dry. Our tees are pre-shrunk so they maintain fit wash after wash!",
    coupon_help: ["coupon", "code", "promo", "voucher"],
    coupon_response: "Check your email for exclusive promo codes after signup! Scratch cards after purchase also have hidden discounts. Want to join our rewards program?"
  };

  function detectIntent(message) {
    var lower = message.toLowerCase();
    for (var key in fashionKB) {
      if (key.endsWith("_help")) {
        var patterns = fashionKB[key];
        for (var i = 0; i < patterns.length; i++) {
          if (lower.indexOf(patterns[i]) !== -1) return key.replace("_help", "");
        }
      }
    }
    return "general";
  }

  function getChatResponse(intent, message) {
    var responseKey = intent + "_response";
    if (fashionKB[responseKey]) return fashionKB[responseKey];

    // General fallback
    var lower = message.toLowerCase();
    if (lower.indexOf("?") !== -1 || lower.indexOf("help") !== -1) {
      return "I can help with sizing, shipping, products, prices, returns, and styling tips. What would you like to know?";
    }
    if (lower.indexOf("thank") !== -1 || lower.indexOf("thanks") !== -1) {
      return "You're welcome! Happy to help. Anything else you'd like to know?";
    }
    if (lower.indexOf("bye") !== -1 || lower.indexOf("goodbye") !== -1) {
      return "Goodbye! Shop at pehrawa.store and stay stylish!";
    }
    return "I'm not sure about that, but I can help with sizing, shipping, products, prices, and styling. What would you like to know?";
  }

  async function getRecommendedProducts(intent, message) {
    try {
      var products = [];
      var lower = message.toLowerCase();
      if (intent === "trending") {
        var result = await pool.query(
          "SELECT id, name, price, image_url, category FROM products WHERE stock_status != 'out_of_stock' ORDER BY created_at DESC LIMIT 4"
        );
        products = result.rows;
      } else if (intent === "category") {
        var cat = "T-Shirt";
        if (lower.indexOf("hoodie") !== -1) cat = "Hoodie";
        else if (lower.indexOf("jean") !== -1) cat = "Jeans";
        else if (lower.indexOf("oversized") !== -1) cat = "Oversized T-Shirt";
        var result = await pool.query(
          "SELECT id, name, price, image_url, category FROM products WHERE LOWER(category) LIKE '%' || $1 || '%' AND stock_status != 'out_of_stock' LIMIT 4",
          [cat.toLowerCase()]
        );
        products = result.rows;
      } else if (intent === "price") {
        var result = await pool.query(
          "SELECT id, name, price, image_url, category FROM products WHERE stock_status != 'out_of_stock' ORDER BY price ASC LIMIT 4"
        );
        products = result.rows;
      }
      return products;
    } catch (e) { return []; }
  }

  app.post("/api/public/chatbot", async function (req, res) {
    try {
      var { message, session_id } = req.body;
      if (!message || !message.trim()) return res.status(400).json({ success: false, message: "Message required" });

      var customerId = null;
      var authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          var decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
          if (decoded && decoded.id && decoded.role === "customer") customerId = decoded.id;
        } catch (e) {}
      }

      var intent = detectIntent(message);
      var response = getChatResponse(intent, message);
      var products = await getRecommendedProducts(intent, message);
      var sid = session_id || "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

      // Log chat
      var token = req.headers.authorization && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
      logAiEvent("chatbot", "message", customerId, {
        session_id: sid, intent: intent, message_len: message.length,
        products_recommended: products.map(function(p) { return p.id; })
      }).catch(function() {});

      // Save to chat_logs
      pool.query(
        "INSERT INTO chat_logs (customer_id, session_id, message, response, intent, products_recommended) VALUES ($1, $2, $3, $4, $5, $6)",
        [customerId, sid, message, response, intent, JSON.stringify(products.map(function(p) { return p.id; }))]
      ).catch(function() {});

      res.json({
        success: true,
        response: response,
        intent: intent,
        products: products,
        session_id: sid,
        suggestions: intent === "trending" ? ["Show me trending", "What's new?"] :
          intent === "category" ? ["Show hoodies", "Show jeans", "Show tees"] :
          ["Sizing help", "Shipping info", "Best deals"]
      });
    } catch (err) {
      console.error("Chatbot error:", err.message);
      res.json({ success: true, response: "I'm having trouble right now. Try again or WhatsApp us at +91 98557 07708!", intent: "error", products: [], session_id: "err" });
    }
  });

  // ===========================
  // STYLE DNA QUIZ
  // ===========================
  var styleProfiles = {
    minimal: { name: "Clean Minimalist", description: "You love clean lines, solid colors, and understated elegance. Less is more for you.", icon: "fa-minus", color: "#888", categories: ["Plain T-Shirt", "Oversized T-Shirt", "Jeans"] },
    bold: { name: "Bold Trendsetter", description: "You stand out with eye-catching prints and vibrant energy. Fashion is your expression.", icon: "fa-fire", color: "#ff6b00", categories: ["Graphic T-Shirt", "Oversized T-Shirt", "Hoodie"] },
    classic: { name: "Classic Gentleman", description: "Timeless style that never goes out of fashion. Quality over trends.", icon: "fa-crown", color: "#ffd700", categories: ["Plain T-Shirt", "Hoodie", "Jeans"] },
    street: { name: "Street Style King", description: "Urban, relaxed, effortlessly cool. You set the streetwear trends.", icon: "fa-city", color: "#3498db", categories: ["Oversized T-Shirt", "Graphic T-Shirt", "Hoodie"] },
    sporty: { name: "Active Athlete", description: "Comfort meets performance. You need clothes that keep up with your lifestyle.", icon: "fa-person-running", color: "#2ecc71", categories: ["Oversized T-Shirt", "Plain T-Shirt", "Hoodie"] }
  };

  var quizQuestions = [
    { id: "q1", text: "Pick a vibe for your perfect weekend:", options: [
      { label: "Minimal café & clean aesthetics", styles: { minimal: 3, classic: 1 } },
      { label: "Festival / concert with friends", styles: { bold: 3, street: 2 } },
      { label: "Rooftop party, dress to impress", styles: { bold: 2, classic: 2 } },
      { label: "Street shopping & street food", styles: { street: 3, sporty: 1 } },
      { label: "Gym / sports activity", styles: { sporty: 3, street: 1 } }
    ]},
    { id: "q2", text: "Your wardrobe color palette:", options: [
      { label: "Black, white, grey — monochrome only", styles: { minimal: 3, classic: 2 } },
      { label: "Bold reds, oranges, neons", styles: { bold: 3, street: 1 } },
      { label: "Navy, olive, earth tones", styles: { classic: 3, street: 1 } },
      { label: "Mix of everything — no rules", styles: { street: 2, bold: 2, sporty: 1 } },
      { label: "Athletic colors — black, blue, grey with accents", styles: { sporty: 3, minimal: 1 } }
    ]},
    { id: "q3", text: "How do you like your tees to fit?", options: [
      { label: "Slim / Regular — clean and fitted", styles: { minimal: 2, classic: 3 } },
      { label: "Oversized / Baggy — relaxed vibe", styles: { street: 3, bold: 2 } },
      { label: "Boxy / Drop shoulder — modern edge", styles: { bold: 2, street: 2 } },
      { label: "Whatever's comfortable", styles: { sporty: 3, minimal: 1 } }
    ]},
    { id: "q4", text: "Pick your hero piece:", options: [
      { label: "Plain white tee — classic", styles: { minimal: 3, classic: 3 } },
      { label: "Bold graphic print tee", styles: { bold: 3, street: 2 } },
      { label: "Premium hoodie for layering", styles: { classic: 2, street: 2 } },
      { label: "Statement oversized tee", styles: { street: 3, bold: 1 } }
    ]},
    { id: "q5", text: "Your go-to footwear:", options: [
      { label: "White sneakers — always", styles: { minimal: 3, classic: 2 } },
      { label: "Chunky sneakers / Jordans", styles: { street: 3, bold: 2 } },
      { label: "Chelsea boots / loafers", styles: { classic: 3, minimal: 1 } },
      { label: "Running shoes / sports shoes", styles: { sporty: 3, street: 1 } }
    ]}
  ];

  app.get("/api/public/style-quiz/questions", async function (req, res) {
    try {
      logAiEvent("style_quiz", "quiz_started", null, {}).catch(function() {});
      res.json({ success: true, questions: quizQuestions });
    } catch (err) {
      res.json({ success: true, questions: quizQuestions });
    }
  });

  app.post("/api/public/style-quiz/submit", async function (req, res) {
    try {
      var { answers, session_id } = req.body;
      if (!answers || typeof answers !== "object") return res.status(400).json({ success: false, message: "Answers required" });

      // Calculate scores
      var scores = { minimal: 0, bold: 0, classic: 0, street: 0, sporty: 0 };
      quizQuestions.forEach(function (q) {
        var answerIdx = answers[q.id];
        if (answerIdx !== undefined && q.options[answerIdx]) {
          var optStyles = q.options[answerIdx].styles;
          for (var style in optStyles) {
            scores[style] = (scores[style] || 0) + optStyles[style];
          }
        }
      });

      // Find top style
      var topStyle = "minimal";
      var topScore = 0;
      for (var style in scores) {
        if (scores[style] > topScore) {
          topScore = scores[style];
          topStyle = style;
        }
      }

      var profile = styleProfiles[topStyle];
      var recommendedProducts = [];

      // Get products from recommended categories
      if (profile && profile.categories && profile.categories.length > 0) {
        try {
          var result = await pool.query(
            "SELECT id, name, price, image_url, category, original_price FROM products WHERE stock_status != 'out_of_stock' ORDER BY RANDOM() LIMIT 8"
          );
          recommendedProducts = result.rows;
        } catch (e) {}
      }

      // Save for logged-in user
      var customerId = null;
      var authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          var decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
          if (decoded && decoded.id && decoded.role === "customer") {
            customerId = decoded.id;
            // Upsert style DNA
            await pool.query(
              `INSERT INTO style_dna (customer_id, style_type, answers, scores, recommended_categories)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (customer_id) DO UPDATE SET
                 style_type = $2, answers = $3, scores = $4, recommended_categories = $5, updated_at = NOW()`,
              [customerId, topStyle, JSON.stringify(answers), JSON.stringify(scores), JSON.stringify(profile.categories)]
            ).catch(function() {});
            // Update customer style_dna_type
            await pool.query("UPDATE customers SET style_dna_type = $1 WHERE id = $2", [topStyle, customerId]).catch(function() {});
          }
        } catch (e) {}
      }

      logAiEvent("style_quiz", "quiz_completed", customerId, {
        style_type: topStyle, scores: scores, session_id: session_id
      }).catch(function() {});

      res.json({
        success: true,
        result: {
          styleType: topStyle,
          profile: profile,
          scores: scores,
          products: recommendedProducts
        }
      });
    } catch (err) {
      console.error("Style quiz error:", err.message);
      res.status(500).json({ success: false, message: "Failed to process quiz" });
    }
  });

  // Get saved style DNA
  app.get("/api/user/style-dna", async function (req, res) {
    try {
      var customerId = verifyCustomerToken(req);
      if (!customerId) return res.json({ success: true, dna: null });

      var result = await pool.query(
        "SELECT style_type, scores, recommended_categories, created_at FROM style_dna WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 1",
        [customerId]
      );
      if (result.rows.length === 0) return res.json({ success: true, dna: null });

      var dna = result.rows[0];
      var profile = styleProfiles[dna.style_type] || styleProfiles.minimal;
      res.json({
        success: true,
        dna: {
          styleType: dna.style_type,
          profile: profile,
          scores: dna.scores,
          categories: dna.recommended_categories,
          completedAt: dna.created_at
        }
      });
    } catch (err) {
      res.json({ success: true, dna: null });
    }
  });

  // ===========================
  // ENHANCED AI PRODUCT SUGGESTIONS
  // ===========================
  app.get("/api/public/ai-suggestions", async function (req, res) {
    try {
      var customerId = null;
      var authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          var decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
          if (decoded && decoded.id && decoded.role === "customer") customerId = decoded.id;
        } catch (e) {}
      }

      var styleType = null;
      if (customerId) {
        var cust = await pool.query("SELECT style_dna_type FROM customers WHERE id = $1", [customerId]);
        if (cust.rows.length > 0) styleType = cust.rows[0].style_dna_type;
      }

      var products = [];
      var reason = "popular";

      if (styleType && styleProfiles[styleType]) {
        // Style-based recommendations
        var cats = styleProfiles[styleType].categories;
        var result = await pool.query(
          "SELECT *, 0 as score FROM products WHERE stock_status != 'out_of_stock' ORDER BY RANDOM() LIMIT 12"
        );
        products = result.rows.map(function(p) {
          var score = 0;
          if (cats.indexOf(p.category) !== -1) score += 3;
          if (styleType === "bold" && p.is_new_arrival) score += 2;
          if (styleType === "street" && p.is_trending) score += 2;
          if (styleType === "minimal" && p.category && p.category.toLowerCase().indexOf("plain") !== -1) score += 3;
          if (styleType === "classic" && p.category && p.category.toLowerCase().indexOf("hoodie") !== -1) score += 2;
          if (styleType === "sporty" && p.category && p.category.toLowerCase().indexOf("oversized") !== -1) score += 2;
          p._score = score;
          return p;
        });
        products.sort(function(a, b) { return b._score - a._score; });
        reason = "style_" + styleType;
      } else {
        // Fallback: trending products
        var result = await pool.query(
          "SELECT *, 0 as _score FROM products WHERE stock_status != 'out_of_stock' ORDER BY created_at DESC LIMIT 12"
        );
        products = result.rows;
        reason = "trending";
      }

      logAiEvent("ai_suggestions", "suggestions_shown", customerId, {
        style_type: styleType, product_count: products.length, reason: reason
      }).catch(function() {});

      res.json({ success: true, products: products, reason: reason, styleType: styleType });
    } catch (err) {
      console.error("AI suggestions error:", err.message);
      res.json({ success: true, products: [], reason: "error" });
    }
  });

  // ===========================
  // ADMIN: AI ANALYTICS
  // ===========================
  app.get("/api/admin/ai-analytics", verifyAdmin, async function (req, res) {
    try {
      var { feature, days } = req.query;
      var d = parseInt(days) || 7;
      var where = "created_at > NOW() - ($1 || ' days')::interval";
      var params = [d];
      if (feature) {
        where += " AND feature = $2";
        params.push(feature);
      }

      var totalChats = await pool.query(
        "SELECT COUNT(*)::int as total FROM chat_logs WHERE " + where.replace("AND feature = $2", "AND customer_id IS NOT NULL"),
        params
      );

      var byFeature = await pool.query(
        "SELECT feature, COUNT(*)::int as count FROM ai_analytics WHERE " + where + " GROUP BY feature ORDER BY count DESC",
        params
      );

      var byIntent = await pool.query(
        "SELECT intent, COUNT(*)::int as count FROM chat_logs WHERE " + where + " AND intent IS NOT NULL GROUP BY intent ORDER BY count DESC",
        params
      );

      var quizCompletions = await pool.query(
        "SELECT COUNT(*)::int as total FROM ai_analytics WHERE feature = 'style_quiz' AND event_type = 'quiz_completed' AND " + where.replace("created_at > NOW() - ($1 || ' days')::interval", "created_at > NOW() - ($1 || ' days')::interval"),
        params
      );

      var styleDistribution = await pool.query(
        "SELECT style_type, COUNT(*)::int as count FROM style_dna GROUP BY style_type ORDER BY count DESC"
      );

      var dailyUsage = await pool.query(
        "SELECT DATE(created_at) as day, feature, COUNT(*)::int as count FROM ai_analytics WHERE " + where + " GROUP BY day, feature ORDER BY day",
        params
      );

      res.json({
        success: true,
        analytics: {
          totalChats: totalChats.rows[0].total,
          byFeature: byFeature.rows,
          topIntents: byIntent.rows,
          quizCompletions: quizCompletions.rows[0].total,
          styleDistribution: styleDistribution.rows,
          dailyUsage: dailyUsage.rows,
          period: d + " days"
        }
      });
    } catch (err) {
      console.error("AI analytics error:", err.message);
      res.json({ success: true, analytics: {} });
    }
  });

  // Admin: list chat logs
  app.get("/api/admin/chat-logs", verifyAdmin, async function (req, res) {
    try {
      var { limit, session_id } = req.query;
      var q = "SELECT cl.*, c.name as customer_name FROM chat_logs cl LEFT JOIN customers c ON cl.customer_id = c.id";
      var params = [];
      if (session_id) {
        q += " WHERE cl.session_id = $1";
        params.push(session_id);
      }
      q += " ORDER BY cl.created_at DESC LIMIT $" + (params.length + 1);
      params.push(parseInt(limit) || 50);
      var result = await pool.query(q, params);
      res.json({ success: true, logs: result.rows });
    } catch (err) {
      res.json({ success: true, logs: [] });
    }
  });

  // Admin: list style DNA results
  app.get("/api/admin/style-dna", verifyAdmin, async function (req, res) {
    try {
      var result = await pool.query(
        `SELECT sd.*, c.name as customer_name, c.email as customer_email
         FROM style_dna sd LEFT JOIN customers c ON sd.customer_id = c.id
         ORDER BY sd.created_at DESC LIMIT 100`
      );
      res.json({ success: true, results: result.rows });
    } catch (err) {
      res.json({ success: true, results: [] });
    }
  });

})();

// ===========================
// POST-ORDER REWARDS already handled in order POST route above
// ===========================

app.listen(PORT, HOST, function () {
  console.log("Pehrawa server running on " + HOST + ":" + PORT);
});
