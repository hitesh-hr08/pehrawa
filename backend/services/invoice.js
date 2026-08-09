const PDFDocument = require("pdfkit");

function formatMoney(n) {
  return "Rs. " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseItems(order) {
  let items = [];
  try {
    if (order.items_data) {
      const parsed = typeof order.items_data === "string" ? JSON.parse(order.items_data) : order.items_data;
      if (Array.isArray(parsed) && parsed.length) {
        items = parsed;
      }
    }
  } catch (e) {}
  if (!items.length && order.items) {
    const lines = String(order.items).split("\n").filter(Boolean);
    lines.forEach(function (line) {
      const nameMatch = line.split("|")[0];
      const sizeMatch = line.match(/Size:\s*(\S+)/i);
      const qtyMatch = line.match(/Qty:\s*(\d+)/i);
      const priceMatch = line.match(/Rs\.\s*([\d,]+\.?\d*)/i);
      items.push({
        name: (nameMatch || "").trim(),
        size: sizeMatch ? sizeMatch[1] : "M",
        quantity: parseInt(qtyMatch ? qtyMatch[1] : 1, 10),
        price: parseFloat((priceMatch ? priceMatch[1] : "0").replace(/,/g, "")) || 0,
      });
    });
  }
  return items;
}

function buildInvoicePdf(order, items, storeName) {
  const trackingId = "PHR-" + String(order.id).padStart(6, "0");
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  const accent = "#ff6b00";
  const dark = "#1a1a1a";
  const grey = "#777777";
  const lineColor = "#e8e8e8";

  // Header band
  doc.rect(0, 0, doc.page.width, 92).fill(accent);
  doc.fill("#ffffff").font("Helvetica-Bold").fontSize(24).text(storeName || "PEHRAWA", 48, 26);
  doc.font("Helvetica").fontSize(10).text("Premium Menswear", 48, 52).fill("#fff");
  doc.font("Helvetica-Bold").fontSize(12).text("INVOICE", doc.page.width - 48 - 100, 30, { width: 100, align: "right" });
  doc.font("Helvetica").fontSize(9).fill("#fff").text("Order Bill", doc.page.width - 48 - 100, 48, { width: 100, align: "right" });

  let y = 130;

  // Bill to / details
  doc.fill(dark).font("Helvetica-Bold").fontSize(11).text("BILL TO");
  doc.font("Helvetica").fontSize(10).fill(dark);
  doc.text(order.customer_name || "", 48, y + 16);
  doc.text(order.phone || "", 48, y + 30);
  const addr = (order.address || "").split(",");
  let addrY = y + 44;
  addr.forEach(function (part) {
    const p = String(part).trim();
    if (p) { doc.text(p, 48, addrY); addrY += 13; }
  });

  const detailsX = doc.page.width - 48 - 210;
  doc.fill(dark).font("Helvetica-Bold").fontSize(10).text("INVOICE DETAILS", detailsX, y);
  doc.font("Helvetica").fontSize(9);
  const detailRows = [
    ["Invoice No.", "#" + trackingId],
    ["Order Date", new Date(order.created_at || Date.now()).toISOString().slice(0, 10)],
    ["Payment Status", order.payment_status === "paid" ? "Paid" : "Paid"],
    ["Payment ID", order.razorpay_payment_id || "—"],
  ];
  let dy = y + 16;
  detailRows.forEach(function (r) {
    doc.fill(grey).text(r[0], detailsX, dy);
    doc.fill(dark).text(String(r[1]), detailsX + 100, dy, { width: 110, align: "right" });
    dy += 15;
  });

  y = addrY + 24;

  // Items table
  doc.rect(48, y, doc.page.width - 96, 24).fill("#f4f4f4");
  doc.fill(dark).font("Helvetica-Bold").fontSize(9);
  const colX = { item: 56, size: 260, qty: 330, price: 400, total: 480 };
  doc.text("ITEM", colX.item, y + 8);
  doc.text("SIZE", colX.size, y + 8);
  doc.text("QTY", colX.qty, y + 8);
  doc.text("PRICE", colX.price, y + 8);
  doc.text("TOTAL", colX.total, y + 8);

  y += 24;
  doc.font("Helvetica").fontSize(9).fill(dark);
  const safeItems = items && items.length ? items : [];
  safeItems.forEach(function (it, i) {
    if (y > doc.page.height - 130) { doc.addPage(); y = 48; }
    if (i % 2 === 1) { doc.rect(48, y, doc.page.width - 96, 20).fill("#fafafa"); }
    doc.text(String(it.name || ""), colX.item, y + 6, { width: 190 });
    doc.text(String(it.size || "M"), colX.size, y + 6);
    doc.text(String(it.quantity || 1), colX.qty, y + 6);
    doc.text(formatMoney(it.price), colX.price, y + 6);
    doc.text(formatMoney((it.price || 0) * (it.quantity || 1)), colX.total, y + 6);
    y += 22;
  });

  y += 6;
  const totalX = doc.page.width - 48 - 230;
  doc.rect(totalX, y, 230, 30).fill(accent);
  doc.fill("#ffffff").font("Helvetica-Bold").fontSize(11).text("TOTAL (Paid)", totalX + 12, y + 9);
  doc.text(formatMoney(order.total_amount), totalX + 12, y + 9, { width: 206, align: "right" });

  y += 48;

  // Footer notes
  doc.fill(grey).font("Helvetica").fontSize(9);
  doc.text("Note: Prices shown are inclusive of all applicable taxes.", 48, y);
  doc.text("This is a computer-generated invoice. No signature required.", 48, y + 14);
  doc.text("Questions about this order? Contact us at support@pehrawa.in", 48, y + 28);

  doc.font("Helvetica-Bold").fontSize(9).fill(accent);
  doc.text("Thank you for shopping with Pehrawa!", 48, y + 48);

  // Footer band
  doc.rect(0, doc.page.height - 30, doc.page.width, 30).fill("#f4f4f4");
  doc.fill(grey).font("Helvetica").fontSize(8).text(storeName || "PEHRAWA", 48, doc.page.height - 21);
  doc.text(new Date().getFullYear() + " Pehrawa. All rights reserved.", doc.page.width - 48, doc.page.height - 21, { width: 200, align: "right" });

  doc.end();
  return new Promise(function (resolve, reject) {
    doc.on("end", function () { resolve(Buffer.concat(chunks)); });
    doc.on("error", reject);
  });
}

module.exports = { buildInvoicePdf, parseItems };
