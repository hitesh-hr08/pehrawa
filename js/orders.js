var API = (window.PEHRAWA_API_BASE || "http://localhost:5000") + "/api/orders";

async function loadOrders() {
  try {
    var res = await fetch(API);
    var data = await res.json();
    var tbody = document.getElementById("ordersTable");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach(function(order) {
      tbody.innerHTML += '<tr><td>' + (order.orderId || order.id) + '</td><td>' + order.name + '</td><td>' + order.phone + '</td><td>' + order.quantity + '</td><td><select onchange="updateStatus(\'' + (order._id || order.id) + '\', this.value)"><option value="Pending"' + (order.status === "Pending" ? " selected" : "") + '>Pending</option><option value="Shipped"' + (order.status === "Shipped" ? " selected" : "") + '>Shipped</option><option value="Delivered"' + (order.status === "Delivered" ? " selected" : "") + '>Delivered</option></select></td></tr>';
    });
  } catch (err) {
    console.log("Order Load Error:", err);
  }
}

async function updateStatus(id, status) {
  try {
    await fetch(API + "/" + id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status })
    });
    loadOrders();
  } catch (err) {
    console.log("Status Update Error:", err);
  }
}

async function createOrder(orderData) {
  try {
    var res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    });
    return await res.json();
  } catch (err) {
    console.log("Create Order Error:", err);
  }
}

window.onload = function() { loadOrders(); };
