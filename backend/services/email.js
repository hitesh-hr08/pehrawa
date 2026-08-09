const nodemailer = require("nodemailer");

const FROM_EMAIL = process.env.EMAIL_FROM || process.env.ADMIN_EMAIL || "heypehrawa@gmail.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "heypehrawa@gmail.com";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.SMTP_USER || FROM_EMAIL;
  const pass = process.env.SMTP_PASS || process.env.ADMIN_PASSWORD;
  if (!pass) {
    console.warn("Email disabled: SMTP_PASS / ADMIN_PASSWORD not configured");
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    secure: parseInt(process.env.SMTP_PORT || "465", 10) === 465,
    auth: { user, pass },
  });
  return transporter;
}

async function sendMail({ to, subject, html, attachments }) {
  try {
    const tr = getTransporter();
    if (!tr) {
      console.warn("Email skipped (no SMTP configured):", subject, "->", to);
      return { success: false, reason: "not_configured" };
    }
    await tr.sendMail({
      from: `"Pehrawa" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      attachments: attachments || [],
    });
    console.log("Email sent:", subject, "->", to);
    return { success: true };
  } catch (err) {
    console.error("Email send error:", err.message);
    return { success: false, reason: err.message };
  }
}

function formatMoney(n) {
  return "Rs. " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function orderToTable(order, items) {
  if (!items || !items.length) return "";
  let rows = "";
  items.forEach(function (it) {
    const colourCell = it.color ? `<br><span style="color:#888;font-size:11px;">Colour: ${escapeHtml(it.color)}</span>` : "";
    rows += `<tr>
      <td style="padding:10px;border-bottom:1px solid #eee;">${escapeHtml(it.name || "")}${colourCell}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${escapeHtml(it.size || "M")}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${it.quantity || 1}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${formatMoney(it.price)}</td>
      <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;"><b>${formatMoney((it.price || 0) * (it.quantity || 1))}</b></td>
    </tr>`;
  });
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;">
    <thead><tr style="background:#f7f7f7;">
      <th style="padding:10px;text-align:left;">Item</th>
      <th style="padding:10px;text-align:center;">Size</th>
      <th style="padding:10px;text-align:center;">Qty</th>
      <th style="padding:10px;text-align:right;">Price</th>
      <th style="padding:10px;text-align:right;">Total</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendNewAccountNotification(customer) {
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#fff;border:1px solid #eee;border-radius:12px;overflow:hidden;">
    <div style="background:#ff6b00;color:#fff;padding:22px 28px;"><h2 style="margin:0;font-size:20px;">New Account Registered</h2></div>
    <div style="padding:24px 28px;color:#333;font-size:14px;line-height:1.7;">
      <p style="margin:0 0 14px;">A new customer just created an account on Pehrawa.</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#888;width:140px;">Name</td><td><b>${escapeHtml(customer.name || "—")}</b></td></tr>
        <tr><td style="padding:8px 0;color:#888;">Email</td><td><b>${escapeHtml(customer.email || "—")}</b></td></tr>
        <tr><td style="padding:8px 0;color:#888;">Phone</td><td><b>${escapeHtml(customer.phone || "—")}</b></td></tr>
        <tr><td style="padding:8px 0;color:#888;">Registered</td><td><b>${new Date().toLocaleString("en-IN")}</b></td></tr>
      </table>
      <p style="margin:18px 0 0;padding-top:14px;border-top:1px solid #eee;color:#999;font-size:12px;">Pehrawa Admin Notification</p>
    </div>
  </div>`;
  return sendMail({ to: ADMIN_EMAIL, subject: "New account registered on Pehrawa 🎉", html });
}

async function sendNewOrderNotification(order, items, customerEmail) {
  const trackingId = "PHR-" + String(order.id).padStart(6, "0");
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border:1px solid #eee;border-radius:12px;overflow:hidden;">
    <div style="background:#ff6b00;color:#fff;padding:22px 28px;"><h2 style="margin:0;font-size:20px;">New Order Received 💰</h2></div>
    <div style="padding:24px 28px;color:#333;font-size:14px;line-height:1.7;">
      <p style="margin:0 0 14px;">Order <b>#${trackingId}</b> has been placed and payment is received.</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#888;width:140px;">Customer</td><td><b>${escapeHtml(order.customer_name || "—")}</b></td></tr>
        <tr><td style="padding:8px 0;color:#888;">Phone</td><td><b>${escapeHtml(order.phone || "—")}</b></td></tr>
        <tr><td style="padding:8px 0;color:#888;">Email</td><td><b>${escapeHtml(customerEmail || "—")}</b></td></tr>
        <tr><td style="padding:8px 0;color:#888;">Address</td><td><b>${escapeHtml(order.address || "—")}</b></td></tr>
        <tr><td style="padding:8px 0;color:#888;">Payment ID</td><td><b>${escapeHtml(order.razorpay_payment_id || "—")}</b></td></tr>
        <tr><td style="padding:8px 0;color:#888;">Order Total</td><td><b style="color:#ff6b00;font-size:16px;">${formatMoney(order.total_amount)}</b></td></tr>
      </table>
      <div style="margin:18px 0 0;">${orderToTable(order, items)}</div>
      <p style="margin:18px 0 0;padding-top:14px;border-top:1px solid #eee;color:#999;font-size:12px;">Pehrawa Admin Notification</p>
    </div>
  </div>`;
  return sendMail({ to: ADMIN_EMAIL, subject: "New order #" + trackingId + " — " + formatMoney(order.total_amount), html });
}

async function sendOrderConfirmationEmail(order, items, customerEmail) {
  if (!customerEmail) return { success: false, reason: "no_customer_email" };
  const trackingId = "PHR-" + String(order.id).padStart(6, "0");
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#fff;border:1px solid #eee;border-radius:12px;overflow:hidden;">
    <div style="background:#ff6b00;color:#fff;padding:22px 28px;">
      <h2 style="margin:0;font-size:20px;">Thank you, ${escapeHtml(order.customer_name || "customer")}!</h2>
      <p style="margin:6px 0 0;opacity:.9;">Your order has been placed successfully 🎉</p>
    </div>
    <div style="padding:24px 28px;color:#333;font-size:14px;line-height:1.7;">
      <p style="margin:0 0 14px;">Your order <b>#${trackingId}</b> is confirmed and payment is received. We'll start packing it right away.</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#888;width:140px;">Order ID</td><td><b>#${trackingId}</b></td></tr>
        <tr><td style="padding:8px 0;color:#888;">Order Date</td><td><b>${new Date(order.created_at || Date.now()).toLocaleString("en-IN")}</b></td></tr>
        <tr><td style="padding:8px 0;color:#888;">Payment</td><td><b>${escapeHtml(order.payment_status === "paid" ? "Paid" : order.payment_status || "Paid")}</b></td></tr>
        <tr><td style="padding:8px 0;color:#888;">Shipping Address</td><td><b>${escapeHtml(order.address || "—")}</b></td></tr>
      </table>
      <div style="margin:18px 0 0;">${orderToTable(order, items)}</div>
      <table style="width:100%;margin-top:14px;font-size:14px;">
        <tr><td style="padding:6px 0;color:#888;">Subtotal</td><td style="text-align:right;">${formatMoney(order.total_amount)}</td></tr>
        <tr><td style="padding:6px 0;color:#888;">Shipping</td><td style="text-align:right;">FREE</td></tr>
        <tr><td style="padding:8px 0;font-size:16px;"><b>Total Paid</b></td><td style="text-align:right;"><b style="color:#ff6b00;font-size:16px;">${formatMoney(order.total_amount)}</b></td></tr>
      </table>
      <p style="margin:18px 0 0;">Your invoice is attached as a PDF. Track your order anytime at <a href="${process.env.FRONTEND_URL || "https://pehrawa.store"}/track-order">pehrawa.store/track-order</a> (use Order ID <b>#${trackingId}</b> and your phone number).</p>
      <p style="margin:18px 0 0;padding-top:14px;border-top:1px solid #eee;color:#999;font-size:12px;">For any help, reply to this email or contact us at ${escapeHtml(FROM_EMAIL)}.</p>
    </div>
  </div>`;
  return sendMail({
    to: customerEmail,
    subject: "Order confirmed #" + trackingId + " — thank you for shopping at Pehrawa!",
    html,
    attachments: order.invoiceAttachment ? [order.invoiceAttachment] : [],
  });
}

module.exports = {
  sendNewAccountNotification,
  sendNewOrderNotification,
  sendOrderConfirmationEmail,
  sendMail,
  getTransporter,
};
