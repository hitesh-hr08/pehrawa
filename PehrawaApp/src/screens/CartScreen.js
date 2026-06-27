import React from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useCart } from "../context/CartContext";

const CartScreen = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const navigation = useNavigation();

  const deliveryFee = getCartTotal() >= 999 ? 0 : 99;
  const total = getCartTotal() + deliveryFee;

  const renderItem = ({ item }) => {
    const price = Number(item.price) || 0;
    const qty = item.quantity || 1;
    return (
      <View style={styles.item}>
        <Image source={{ uri: item.image_url }} style={styles.image} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          {item.size && <Text style={styles.size}>Size: {item.size}</Text>}
          <Text style={styles.price}>₹{price.toFixed(2)}</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity onPress={() => updateQuantity(item.id, qty - 1)} style={styles.qtyBtn}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyVal}>{qty}</Text>
            <TouchableOpacity onPress={() => updateQuantity(item.id, qty + 1)} style={styles.qtyBtn}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
          <Text style={styles.removeBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (cart.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <Text style={styles.emptySub}>Add items to get started</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate("Shop")}>
          <Text style={styles.shopBtnText}>SHOP NOW</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.offerBanner}>
        <Text style={styles.offerIcon}>🏷</Text>
        <Text style={styles.offerText}>Free delivery on orders above ₹999</Text>
      </View>
      <FlatList
        data={cart}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
      />
      <View style={styles.footer}>
        <View style={styles.priceBreakdown}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>MRP</Text>
            <Text style={styles.rowValue}>₹{getCartTotal().toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Delivery</Text>
            <Text style={[styles.rowValue, deliveryFee === 0 && styles.freeDelivery]}>
              {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
            </Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalVal}>₹{total.toFixed(2)}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => navigation.navigate("Checkout", { cartItems: cart })}>
          <Text style={styles.checkoutBtnText}>PROCEED TO CHECKOUT • ₹{total.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  offerBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: "#0a0a0a", borderBottomWidth: 1, borderBottomColor: "#1a1a1a",
  },
  offerIcon: { fontSize: 16 },
  offerText: { color: "#10b981", fontSize: 12, fontWeight: "600" },
  list: { padding: 12 },
  item: {
    flexDirection: "row", backgroundColor: "#0a0a0a", borderRadius: 10,
    padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#1a1a1a",
  },
  image: { width: 90, height: 110, borderRadius: 6, backgroundColor: "#111" },
  info: { flex: 1, marginLeft: 12, justifyContent: "center" },
  name: { color: "#fff", fontSize: 14, fontWeight: "500", marginBottom: 4 },
  size: { color: "#888", fontSize: 12, marginBottom: 4 },
  price: { color: "#ff6b00", fontSize: 16, fontWeight: "700", marginBottom: 8 },
  qtyRow: { flexDirection: "row", alignItems: "center" },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 6, backgroundColor: "#1a1a1a",
    alignItems: "center", justifyContent: "center",
  },
  qtyBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  qtyVal: { color: "#fff", marginHorizontal: 12, fontWeight: "600", fontSize: 14 },
  removeBtn: { padding: 8, justifyContent: "center" },
  removeBtnText: { fontSize: 18, opacity: 0.6 },
  footer: {
    padding: 16, borderTopWidth: 1, borderTopColor: "#1a1a1a",
    backgroundColor: "#0a0a0a",
  },
  priceBreakdown: { gap: 6, marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { color: "#888", fontSize: 13 },
  rowValue: { color: "#ddd", fontSize: 13 },
  freeDelivery: { color: "#10b981", fontWeight: "600" },
  totalRow: { borderTopWidth: 1, borderTopColor: "#1a1a1a", paddingTop: 8, marginTop: 4 },
  totalLabel: { color: "#fff", fontSize: 15, fontWeight: "700" },
  totalVal: { color: "#ff6b00", fontSize: 18, fontWeight: "700" },
  checkoutBtn: {
    backgroundColor: "#ff6b00", paddingVertical: 14, borderRadius: 8, alignItems: "center",
  },
  checkoutBtnText: { color: "#000", fontWeight: "700", fontSize: 14 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#050505" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#fff", fontSize: 18, fontWeight: "600", marginBottom: 4 },
  emptySub: { color: "#666", fontSize: 14, marginBottom: 24 },
  shopBtn: {
    backgroundColor: "#ff6b00", paddingVertical: 12, paddingHorizontal: 36, borderRadius: 8,
  },
  shopBtnText: { color: "#000", fontWeight: "700", fontSize: 13 },
});

export default CartScreen;
