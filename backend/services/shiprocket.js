const https = require("https");
const BASE = "apiv2.shiprocket.in";

let cachedToken = null;
let tokenExpiry = null;

function api(method, path, payload, token) {
  return new Promise((resolve, reject) => {
    const data = payload ? JSON.stringify(payload) : "";
    const opts = { hostname: BASE, path: "/v1/external" + path, method, headers: { "Content-Type": "application/json" } };
    if (data) opts.headers["Content-Length"] = Buffer.byteLength(data);
    if (token) opts.headers["Authorization"] = "Bearer " + token;
    const req = https.request(opts, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error("Parse error: " + body.slice(0, 200))); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function getToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) return cachedToken;
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) throw new Error("Shiprocket credentials not set");

  const res = await api("POST", "/auth/login", { email, password });
  if (!res.token) throw new Error("Shiprocket auth failed");
  cachedToken = res.token;
  tokenExpiry = Date.now() + (res.token_ttl || 86400) * 1000;
  return cachedToken;
}

async function createOrder(orderData) {
  const token = await getToken();
  const items = (orderData.items_data || []).map((i, idx) => ({
    name: i.name || "Item",
    sku: i.sku || "SKU-" + (i.id || idx),
    units: "1",
    quantity: Number(i.quantity) || 1,
    price: Math.round(Number(i.price) || 0),
    selling_price: Math.round(Number(i.price) || 0),
  }));

  const payload = {
    order_id: orderData.tracking_id || "PHR-" + String(orderData.id || 0).padStart(6, "0"),
    order_date: new Date().toISOString().slice(0, 10),
    pickup_location: "Pehrawa Store",
    billing_customer_name: orderData.customer_name || "Customer",
    billing_last_name: ".",
    billing_address: orderData.address || "",
    billing_city: orderData.city || "Chandigarh",
    billing_pincode: orderData.pincode || "160001",
    billing_state: orderData.state || "Chandigarh",
    billing_country: "India",
    billing_email: orderData.email || "",
    billing_phone: orderData.phone || "8855700000",
    shipping_is_billing: true,
    order_items: items,
    payment_method: orderData.payment_status === "paid" ? "Prepaid" : "COD",
    sub_total: Math.round(Number(orderData.total_amount) || 0),
    length: 10, breadth: 10, height: 10, weight: 0.5,
  };

  return api("POST", "/orders/create/adhoc", payload, token);
}

async function assignAWB(shipmentId) {
  const token = await getToken();
  return api("POST", "/courier/assign/awb", { shipment_id: shipmentId, courier_id: "" }, token);
}

async function trackShipment(shipmentId) {
  const token = await getToken();
  return api("GET", "/courier/track/shipment/" + shipmentId, null, token);
}

module.exports = { createOrder, assignAWB, trackShipment };
