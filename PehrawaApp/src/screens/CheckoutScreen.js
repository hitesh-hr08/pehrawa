import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal } from "react-native";
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
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  const items = product ? [product] : cartItems || cart;
  const total = product ? Number(product.price) * Number(product.quantity || 1) : getCartTotal();

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

  const getOrderPayload = () => {
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
      status: "Pending",
      items: items.map((i) => ({
        id: product ? null : i.id,
        name: i.name,
        price: Number(i.price),
        quantity: Number(i.quantity || 1),
        size: i.size || "M",
      })),
    };
  };

  const handlePlaceOrder = async () => {
    if (!name || !phone || !address || !pincode || !city || !state) {
      showToast("Please fill all address fields");
      return;
    }
    if (total < 1) {
      showToast("Invalid amount");
      return;
    }

    setLoading(true);
    try {
      const orderData = await api.createOrder(getOrderPayload());
      if (orderData.success) {
        showToast("Order placed successfully");
        if (!product) clearCart();
        setTimeout(() => navigation.navigate("MyOrders"), 1500);
      } else {
        showToast(orderData.message || "Order placement failed");
      }
    } catch (e) {
      showToast("Order placement failed");
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Shipping Details</Text>

      {savedAddresses.length > 0 && (
        <>
          <TouchableOpacity style={styles.savedAddrBtn} onPress={() => setShowAddressPicker(true)}>
            <Text style={styles.savedAddrBtnText}>Saved Addresses ({savedAddresses.length})</Text>
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
            <Text style={styles.summaryPrice}>Rs. {(Number(item.price) * Number(item.quantity || 1)).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalVal}>Rs. {total.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.payBtn} onPress={handlePlaceOrder} disabled={loading}>
        <Text style={styles.payBtnText}>{loading ? "PLACING..." : "PLACE ORDER"}</Text>
      </TouchableOpacity>
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
