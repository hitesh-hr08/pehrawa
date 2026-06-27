import React from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useCart } from "../context/CartContext";

const CartScreen = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const navigation = useNavigation();

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Image source={{ uri: item.image_url }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.price}>₹{Number(item.price).toFixed(2)}</Text>
        {item.size && <Text style={styles.size}>Size: {item.size}</Text>}
        <View style={styles.qtyRow}>
          <TouchableOpacity onPress={() => updateQuantity(item.id, (item.quantity || 1) - 1)} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>-</Text></TouchableOpacity>
          <Text style={styles.qtyVal}>{item.quantity || 1}</Text>
          <TouchableOpacity onPress={() => updateQuantity(item.id, (item.quantity || 1) + 1)} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}>
        <Text style={styles.removeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  if (cart.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate("Shop")}>
          <Text style={styles.shopBtnText}>SHOP NOW</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList data={cart} renderItem={renderItem} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.list} />
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalVal}>₹{getCartTotal().toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => navigation.navigate("Checkout", { cartItems: cart })}>
          <Text style={styles.checkoutBtnText}>PROCEED TO CHECKOUT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  list: { padding: 12 },
  item: { flexDirection: "row", backgroundColor: "#0a0a0a", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#1a1a1a" },
  image: { width: 80, height: 80, borderRadius: 8 },
  info: { flex: 1, marginLeft: 12, justifyContent: "center" },
  name: { color: "#fff", fontSize: 14, fontWeight: "600" },
  price: { color: "#ff6b00", fontSize: 15, fontWeight: "700", marginTop: 4 },
  size: { color: "#888", fontSize: 12, marginTop: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center" },
  qtyBtnText: { color: "#fff", fontWeight: "700" },
  qtyVal: { color: "#fff", marginHorizontal: 12, fontWeight: "600" },
  removeBtn: { padding: 8 },
  removeBtnText: { color: "#ff4444", fontSize: 18 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: "#1a1a1a" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  totalLabel: { color: "#888", fontSize: 16 },
  totalVal: { color: "#ff6b00", fontSize: 20, fontWeight: "700" },
  checkoutBtn: { backgroundColor: "#ff6b00", padding: 16, borderRadius: 8, alignItems: "center" },
  checkoutBtnText: { color: "#000", fontWeight: "700", fontSize: 14 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#050505" },
  emptyText: { color: "#666", fontSize: 18, marginBottom: 20 },
  shopBtn: { backgroundColor: "#ff6b00", paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  shopBtnText: { color: "#000", fontWeight: "700" },
});

export default CartScreen;
