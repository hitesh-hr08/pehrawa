import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { api } from "../services/api";

const steps = [
  { key: "placed", label: "Order Placed", icon: "📦" },
  { key: "verify", label: "Verify Payment", icon: "🔄" },
  { key: "processing", label: "Processing", icon: "⚙️" },
  { key: "shipped", label: "Shipped", icon: "🚚" },
  { key: "delivered", label: "Delivered", icon: "✅" },
];

const getActiveStep = (status) => {
  const map = { "Pending": 0, "Verifying Payment": 1, "Processing": 2, "Shipped": 3, "Delivered": 4 };
  return map[status] ?? 0;
};

const TrackOrderScreen = ({ route }) => {
  const params = route.params || {};
  const [trackingId, setTrackingId] = useState(params.trackingId || "");
  const [phone, setPhone] = useState(params.phone || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async () => {
    if (!trackingId || !phone) { setError("Enter Order ID and Phone"); return; }
    setLoading(true);
    setError("");
    const data = await api.getOrderByTracking(trackingId, phone);
    if (data.success && data.order) {
      setOrder(data.order);
    } else {
      setError(data.message || "Order not found");
    }
    setLoading(false);
  };

  const activeStep = order ? getActiveStep(order.status) : -1;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Track Your Order</Text>
      <TextInput style={styles.input} placeholder="Order ID (e.g. PHR-000018)" placeholderTextColor="#666" value={trackingId} onChangeText={setTrackingId} />
      <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#666" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TouchableOpacity style={styles.trackBtn} onPress={handleTrack} disabled={loading}>
        <Text style={styles.trackBtnText}>{loading ? "TRACKING..." : "TRACK ORDER"}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {order && (
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>{order.tracking_id || "#" + order.id}</Text>
          <Text style={styles.orderStatus}>Status: {order.status}</Text>
          <Text style={styles.orderAmount}>₹{Number(order.total_amount).toFixed(2)}</Text>
        </View>
      )}

      {order && (
        <View style={styles.timeline}>
          {steps.map((step, i) => (
            <View key={step.key} style={styles.stepRow}>
              <View style={styles.stepIconWrap}>
                <View style={[styles.stepCircle, i <= activeStep && styles.activeCircle]}>
                  <Text style={[styles.stepIcon, i <= activeStep && styles.activeIcon]}>{step.icon}</Text>
                </View>
                {i < steps.length - 1 && <View style={[styles.stepLine, i < activeStep && styles.activeLine]} />}
              </View>
              <Text style={[styles.stepLabel, i <= activeStep && styles.activeLabel]}>{step.label}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505", padding: 16 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  input: { backgroundColor: "#0a0a0a", borderWidth: 1, borderColor: "#222", borderRadius: 8, padding: 14, color: "#fff", marginBottom: 10, fontSize: 14 },
  trackBtn: { backgroundColor: "#ff6b00", padding: 14, borderRadius: 8, alignItems: "center", marginBottom: 8 },
  trackBtnText: { color: "#000", fontWeight: "700" },
  error: { color: "#ef4444", textAlign: "center", marginBottom: 12 },
  orderInfo: { backgroundColor: "#0a0a0a", borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, borderColor: "#1a1a1a", alignItems: "center" },
  orderId: { color: "#fff", fontSize: 16, fontWeight: "700" },
  orderStatus: { color: "#f59e0b", fontSize: 14, marginTop: 4 },
  orderAmount: { color: "#ff6b00", fontSize: 22, fontWeight: "700", marginTop: 8 },
  timeline: { marginTop: 24, paddingLeft: 20 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  stepIconWrap: { alignItems: "center", width: 40 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center", zIndex: 1 },
  activeCircle: { backgroundColor: "#ff6b00" },
  stepIcon: { fontSize: 14 },
  activeIcon: {},
  stepLine: { width: 2, height: 40, backgroundColor: "#1a1a1a", position: "absolute", top: 32 },
  activeLine: { backgroundColor: "#ff6b00" },
  stepLabel: { color: "#666", fontSize: 14, marginLeft: 12, paddingTop: 6 },
  activeLabel: { color: "#fff", fontWeight: "600" },
});

export default TrackOrderScreen;
