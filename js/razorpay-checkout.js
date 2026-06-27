async function razorpayCheckout(amount, onSuccess, onError) {
  try {
    var api = window.PEHRAWA_API_BASE || "http://localhost:5000";
    var keyRes = await fetch(api + "/api/razorpay-key");
    var keyData = await keyRes.json();
    if (!keyData.key) {
      if (typeof showToast === "function") showToast("Payment gateway not configured");
      if (onError) onError("No key");
      return;
    }
    var orderRes = await fetch(api + "/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amount, currency: "INR" })
    });
    var orderData = await orderRes.json();
    if (!orderData.success) {
      if (typeof showToast === "function") showToast(orderData.message || "Failed to create payment");
      if (onError) onError("Order creation failed");
      return;
    }
    var options = {
      key: keyData.key,
      amount: orderData.amount,
      currency: orderData.currency || "INR",
      name: "Pehrawa Menswear",
      description: "Order Payment",
      order_id: orderData.order_id,
      handler: async function (response) {
        try {
          var verifyRes = await fetch(api + "/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          var verifyData = await verifyRes.json();
          if (verifyData.success && verifyData.verified) {
            if (onSuccess) onSuccess(response.razorpay_payment_id);
          } else {
            if (typeof showToast === "function") showToast("Payment verification failed");
            if (onError) onError("Verification failed");
          }
        } catch (e) {
          if (typeof showToast === "function") showToast("Payment verification error");
          if (onError) onError(e);
        }
      },
      modal: {
        ondismiss: function () {
          if (typeof showToast === "function") showToast("Payment cancelled");
          if (onError) onError("Cancelled");
        }
      },
      theme: { color: "#ff6b00" }
    };
    var rzp = new Razorpay(options);
    rzp.on("payment.failed", function (response) {
      if (typeof showToast === "function") showToast("Payment failed: " + (response.error.description || "Please try again"));
      if (onError) onError(response.error);
    });
    rzp.open();
  } catch (err) {
    if (typeof showToast === "function") showToast("Payment error. Please try again.");
    if (onError) onError(err);
  }
}
