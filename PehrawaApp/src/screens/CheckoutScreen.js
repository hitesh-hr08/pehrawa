import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { api } from "../services/api";
import { showToast } from "../components/Toast";

const CheckoutScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { cart, clearCart, getCartTotal } = useCart();
  const { product, cartItems } = route.params || {};

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [payerror, setPayError] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  useEffect(() => {
    if (user?.id) {
      api.getAddresses(user.id).then((data) => {
        if (data.success && data.addresses) {
          setSavedAddresses(data.addresses);
          const def = data.addresses.find((a) => a.is_default) || data.addresses[0];
          if (def) applyAddress(def);
        }
      }).catch(() => {});
    }
  }, [user]);

  const applyAddress = (addr) => {
    setAddress(addr.address || "");
    setPincode(addr.pincode || "");
    setCity(addr.city || "");
    setState(addr.state || "");
  };

  const items = product ? [product] : cartItems || cart;
  const total = product ? Number(product.price) * Number(product.quantity || 1) : getCartTotal();

  const getOrderPayload = (paymentId) => {
    const addr = address + ", " + city + ", " + state + " - " + pincode;
    return {
      customer_name: name,
      customer_id: user?.id || null,
      phone,
      address: addr,
      pincode,
      city,
      state,
      total_amount: total,
      status: paymentId ? "Processing" : "Pending",
      payment_id: paymentId || null,
      items: items.map((i) => ({
        id: product ? null : i.id,
        name: i.name,
        price: Number(i.price),
        quantity: Number(i.quantity || 1),
        size: i.size || "M",
      })),
    };
  };

  const handleRazorpayPayment = async () => {
    if (!name || !phone || !address || !pincode || !city || !state) {
      showToast("Please fill all address fields");
      return;
    }
    if (total < 1) { showToast("Invalid amount"); return; }
    setLoading(true);
    try {
      const orderData = await api.createRazorpayOrder(total);
      if (!orderData.success) { showToast("Failed to create payment"); setLoading(false); return; }

      const keyData = await api.getRazorpayKey();
      const key = keyData.key;

      const html = `
        <html><body>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <script>
          var options = {
            key: "${key}",
            amount: ${orderData.amount},
            currency: "${orderData.currency}",
            name: "Pehrawa Menswear",
            order_id: "${orderData.order_id}",
            handler: function(r) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: "success",
                razorpay_payment_id: r.razorpay_payment_id,
                razorpay_order_id: r.razorpay_order_id,
                razorpay_signature: r.razorpay_signature
              }));
            },
            modal: {
              ondismiss: function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: "cancelled" }));
              }
            },
            theme: { color: "#ff6b00" }
          };
          var rzp = new Razorpay(options);
          rzp.on("payment.failed", function(r) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: "failed", error: r.error.description }));
          });
          rzp.open();
        </script>
        </body></html>
      `;
      setPayerror(null);
      setPaymentUrl(html);
      setShowPayment(true);
    } catch (err) {
      showToast("Payment error");
    }
    setLoading(false);
  };

  const handleWebViewMessage = async (event) => {
    const msg = JSON.parse(event.nativeEvent.data);
    setShowPayment(false);

    if (msg.type === "success") {
      setLoading(true);
      try {
        const verifyData = await api.verifyRazorpayPayment({
          razorpay_order_id: msg.razorpay_order_id,
          razorpay_payment_id: msg.razorpay_payment_id,
          razorpay_signature: msg.razorpay_signature,
        });
        if (verifyData.success && verifyData.verified) {
          const orderData = await api.createOrder(getOrderPayload(msg.razorpay_payment_id));
          if (orderData.success) {
            showToast("✅ Payment successful! Order placed.");
            if (!product) clearCart();
            setTimeout(() => navigation.navigate("MyOrders"), 1500);
          } else {
            showToast("Order placement failed");
          }
        } else {
          showToast("Payment verification failed");
        }
      } catch (e) {
        showToast("Verification error");
      }
      setLoading(false);
    } else if (msg.type === "cancelled") {
      showToast("Payment cancelled");
    } else if (msg.type === "failed") {
      showToast("Payment failed: " + (msg.error || ""));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Shipping Details</Text>

      {savedAddresses.length > 0 && (
        <>
          <TouchableOpacity style={styles.savedAddrBtn} onPress={() => setShowAddressPicker(true)}>
            <Text style={styles.savedAddrBtnText}>📌 Saved Addresses ({savedAddresses.length})</Text>
          </TouchableOpacity>
          <Modal visible={showAddressPicker} transparent animationType="slide" onRequestClose={() => setShowAddressPicker(false)}>
            <View style={styles.addrModalOverlay}>
              <View style={styles.addrModal}>
                <Text style={styles.addrModalTitle}>Select Address</Text>
                {savedAddresses.map((a) => (
                  <TouchableOpacity key={a.id} style={styles.addrOption} onPress={() => { applyAddress(a); setShowAddressPicker(false); }}>
                    <Text style={styles.addrLabel}>{a.label}</Text>
                    <Text style={styles.addrText}>{a.address}, {a.city}, {a.state} - {a.pincode}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.addrCancel} onPress={() => setShowAddressPicker(false)}>
                  <Text style={{ color: "#ff6b00", fontWeight: "600" }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}

      <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#666" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#666" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Pincode" placeholderTextColor="#666" value={pincode} onChangeText={setPincode} keyboardType="number-pad" maxLength={6} />
      <TextInput style={styles.input} placeholder="City" placeholderTextColor="#666" value={city} onChangeText={setCity} />
      <TextInput style={styles.input} placeholder="State" placeholderTextColor="#666" value={state} onChangeText={setState} />
      <TextInput style={[styles.input, styles.textArea]} placeholder="Full Address" placeholderTextColor="#666" value={address} onChangeText={setAddress} multiline />

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        {items.slice(0, 3).map((item, i) => (
          <View key={i} style={styles.summaryRow}>
            <Text style={styles.summaryName} numberOfLines={1}>{item.name} x{item.quantity || 1}</Text>
            <Text style={styles.summaryPrice}>₹{(Number(item.price) * Number(item.quantity || 1)).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalVal}>₹{total.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.payBtn} onPress={handleRazorpayPayment} disabled={loading}>
        <Text style={styles.payBtnText}>{loading ? "PROCESSING..." : "PAY WITH RAZORPAY"}</Text>
      </TouchableOpacity>

      <Modal visible={showPayment} animationType="slide" onRequestClose={() => setShowPayment(false)}>
        <View style={{ flex: 1, marginTop: 40 }}>
          <TouchableOpacity onPress={() => setShowPayment(false)} style={{ padding: 12 }}>
            <Text style={{ color: "#ff6b00", fontSize: 16 }}>✕ Close</Text>
          </TouchableOpacity>
          <WebView source={{ html: paymentUrl }} onMessage={handleWebViewMessage} style={{ flex: 1 }} />
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505", padding: 16 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 16 },
  savedAddrBtn: { backgroundColor: "#0a0a0a", borderWidth: 1, borderColor: "#ff6b0033", borderRadius: 8, padding: 14, marginBottom: 10 },
  savedAddrBtnText: { color: "#ff6b00", fontWeight: "600", fontSize: 14 },
  addrModalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" },
  addrModal: { backgroundColor: "#111", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: "70%" },
  addrModalTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 16 },
  addrOption: { backgroundColor: "#0a0a0a", borderRadius: 8, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#222" },
  addrLabel: { color: "#ff6b00", fontSize: 13, fontWeight: "700", marginBottom: 2 },
  addrText: { color: "#ccc", fontSize: 13 },
  addrCancel: { alignItems: "center", padding: 12, marginTop: 4 },
  input: { backgroundColor: "#0a0a0a", borderWidth: 1, borderColor: "#222", borderRadius: 8, padding: 14, color: "#fff", marginBottom: 10, fontSize: 14 },
  textArea: { height: 80, textAlignVertical: "top" },
  summary: { backgroundColor: "#0a0a0a", borderRadius: 12, padding: 16, marginTop: 12, borderWidth: 1, borderColor: "#1a1a1a" },
  summaryTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summaryName: { color: "#aaa", fontSize: 13, flex: 1 },
  summaryPrice: { color: "#fff", fontSize: 13 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#222", paddingTop: 10, marginTop: 6 },
  totalLabel: { color: "#fff", fontSize: 16, fontWeight: "700" },
  totalVal: { color: "#ff6b00", fontSize: 18, fontWeight: "700" },
  payBtn: { backgroundColor: "#ff6b00", padding: 16, borderRadius: 8, alignItems: "center", marginTop: 20, marginBottom: 40 },
  payBtnText: { color: "#000", fontWeight: "700", fontSize: 15 },
});

export default CheckoutScreen;
