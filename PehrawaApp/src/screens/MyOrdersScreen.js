import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const statusColors = {
  Pending: "#f59e0b",
  "Verifying Payment": "#f59e0b",
  Processing: "#3b82f6",
  Shipped: "#8b5cf6",
  Delivered: "#10b981",
  Cancelled: "#ef4444",
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
      <View style={styles.header}>
        <Text style={styles.id}>{item.tracking_id || "#" + item.id}</Text>
        <Text style={[styles.status, { color: statusColors[item.status] || "#fff" }]}>{item.status}</Text>
      </View>
      <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
      <Text style={styles.amount}>₹{Number(item.total_amount).toFixed(2)}</Text>
      <Text style={styles.trackBtn}>📦 Track Order</Text>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Please login to view orders</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate("Login")}><Text style={styles.loginBtnText}>LOGIN</Text></TouchableOpacity>
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
      ListEmptyComponent={<Text style={styles.emptyText}>No orders yet</Text>}
    />
  );
};

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: { backgroundColor: "#0a0a0a", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  id: { color: "#fff", fontSize: 14, fontWeight: "700" },
  status: { fontSize: 12, fontWeight: "600" },
  date: { color: "#888", fontSize: 12, marginBottom: 4 },
  amount: { color: "#ff6b00", fontSize: 18, fontWeight: "700" },
  trackBtn: { color: "#ff6b00", fontSize: 13, fontWeight: "600", marginTop: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#050505" },
  emptyText: { color: "#666", fontSize: 16 },
  loginBtn: { backgroundColor: "#ff6b00", paddingVertical: 10, paddingHorizontal: 30, borderRadius: 8, marginTop: 16 },
  loginBtnText: { color: "#000", fontWeight: "700" },
});

export default MyOrdersScreen;
