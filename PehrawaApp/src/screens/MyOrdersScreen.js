import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const statusColors = {
  Pending: "#f59e0b",
  Processing: "#3b82f6", Shipped: "#8b5cf6",
  Delivered: "#10b981", Cancelled: "#ef4444",
};

const MyOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigation = useNavigation();

  useEffect(() => { if (user?.id) loadOrders(); }, [user]);

  const loadOrders = async () => {
    const data = await api.getCustomerOrders(user.id);
    if (data.success) setOrders(data.orders || []);
    setLoading(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("TrackOrder", { trackingId: item.tracking_id, phone: item.phone })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>{item.tracking_id || "#" + item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: (statusColors[item.status] || "#888") + "20" }]}>
          <Text style={[styles.statusText, { color: statusColors[item.status] || "#888" }]}>{item.status}</Text>
        </View>
      </View>
      {item.items && item.items.length > 0 && (
        <Text style={styles.itemsCount}>{item.items.length} item(s)</Text>
      )}
      <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.amount}>₹{Number(item.total_amount).toFixed(2)}</Text>
        <Text style={styles.trackCta}>Tap to track ›</Text>
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🔒</Text>
        <Text style={styles.emptyText}>Sign in to view orders</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginBtnText}>SIGN IN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      renderItem={renderItem}
      refreshing={loading}
      onRefresh={loadOrders}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>No orders yet</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate("Shop")}>
            <Text style={styles.loginBtnText}>START SHOPPING</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: {
    backgroundColor: "#0a0a0a", borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "#1a1a1a",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  orderId: { color: "#fff", fontSize: 14, fontWeight: "700", letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: "700" },
  itemsCount: { color: "#888", fontSize: 12, marginBottom: 4 },
  date: { color: "#666", fontSize: 12, marginBottom: 10 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#1a1a1a", paddingTop: 10 },
  amount: { color: "#ff6b00", fontSize: 18, fontWeight: "700" },
  trackCta: { color: "#ff6b00", fontSize: 13, fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#050505" },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: "#888", fontSize: 16, marginBottom: 24 },
  loginBtn: {
    paddingVertical: 10, paddingHorizontal: 30, borderRadius: 8,
    backgroundColor: "#ff6b00",
  },
  loginBtnText: { color: "#000", fontWeight: "700", fontSize: 13 },
});

export default MyOrdersScreen;
