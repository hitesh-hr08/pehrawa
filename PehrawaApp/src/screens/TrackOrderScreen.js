import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { api } from "../services/api";

const steps = [
  { key: "placed", label: "Order Placed" },
  { key: "verify", label: "Verifying Payment" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const getActiveStep = (status) => {
  const map = { "Pending": 0, "Verifying Payment": 1, "Processing": 2, "Shipped": 3, "Delivered": 4, "Cancelled": -1 };
  return map[status] ?? -1;
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
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Track Your Order</Text>
      <TextInput
        style={styles.input} placeholder="Order ID (e.g. PHR-000018)" placeholderTextColor="#555"
        value={trackingId} onChangeText={setTrackingId} autoCapitalize="characters"
      />
      <TextInput
        style={styles.input} placeholder="Phone Number" placeholderTextColor="#555"
        value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10}
      />
      <TouchableOpacity style={styles.trackBtn} onPress={handleTrack} disabled={loading}>
        <Text style={styles.trackBtnText}>{loading ? "TRACKING..." : "TRACK ORDER"}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {order && (
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>{order.tracking_id || "#" + order.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: (order.status === "Delivered" ? "#10b981" : "#f59e0b") + "20" }]}>
            <Text style={[styles.statusLabel, { color: order.status === "Delivered" ? "#10b981" : "#f59e0b" }]}>{order.status}</Text>
          </View>
          <Text style={styles.orderAmount}>₹{Number(order.total_amount).toFixed(2)}</Text>
          {order.address && <Text style={styles.orderAddress}>{order.address}</Text>}
        </View>
      )}

      {order && activeStep >= 0 && (
        <View style={styles.timeline}>
          <Text style={styles.timelineTitle}>Order Status</Text>
          {steps.map((step, i) => {
            const isActive = i <= activeStep;
            const isLast = i === steps.length - 1;
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={styles.stepLineCol}>
                  <View style={[styles.stepDot, isActive && styles.stepDotActive]} />
                  {!isLast && <View style={[styles.stepLine, isActive && i < activeStep && styles.stepLineActive]} />}
                </View>
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>{step.label}</Text>
                {i === activeStep && order.status === "Delivered" && <Text style={styles.stepDone}>✓</Text>}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505", padding: 16 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  input: {
    backgroundColor: "#0a0a0a", borderWidth: 1, borderColor: "#222", borderRadius: 10,
    padding: 14, color: "#fff", marginBottom: 12, fontSize: 14,
  },
  trackBtn: { backgroundColor: "#ff6b00", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginBottom: 8 },
  trackBtnText: { color: "#000", fontWeight: "700", fontSize: 14 },
  error: { color: "#ef4444", textAlign: "center", marginBottom: 12, fontSize: 13 },
  orderInfo: {
    backgroundColor: "#0a0a0a", borderRadius: 12, padding: 20, marginTop: 16,
    borderWidth: 1, borderColor: "#1a1a1a", alignItems: "center",
  },
  orderId: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 8 },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  statusLabel: { fontSize: 13, fontWeight: "700" },
  orderAmount: { color: "#ff6b00", fontSize: 24, fontWeight: "700", marginBottom: 8 },
  orderAddress: { color: "#666", fontSize: 12, textAlign: "center" },
  timeline: { marginTop: 24, paddingLeft: 8 },
  timelineTitle: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 20 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  stepLineCol: { alignItems: "center", width: 32 },
  stepDot: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: "#1a1a1a",
    borderWidth: 2, borderColor: "#333", zIndex: 1,
  },
  stepDotActive: { backgroundColor: "#ff6b00", borderColor: "#ff6b00" },
  stepLine: { width: 2, height: 36, backgroundColor: "#1a1a1a" },
  stepLineActive: { backgroundColor: "#ff6b00" },
  stepLabel: { color: "#666", fontSize: 14, marginLeft: 12, paddingTop: 0 },
  stepLabelActive: { color: "#fff", fontWeight: "600" },
  stepDone: { color: "#10b981", fontSize: 16, fontWeight: "700", marginLeft: 8 },
});

export default TrackOrderScreen;
