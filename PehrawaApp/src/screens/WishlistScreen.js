import React from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useCart } from "../context/CartContext";
import { showToast } from "../components/Toast";

const WishlistScreen = () => {
  const { wishlist, toggleWishlist, addToCart } = useCart();
  const navigation = useNavigation();

  if (wishlist.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>♡</Text>
        <Text style={styles.emptyText}>Your wishlist is empty</Text>
        <Text style={styles.emptySub}>Save your favourite items here</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate("Shop")}>
          <Text style={styles.shopBtnText}>SHOP NOW</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={wishlist}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const price = Number(item.price) || 0;
        return (
          <View style={styles.item}>
            <TouchableOpacity onPress={() => navigation.navigate("ProductDetail", { product: item })}>
              <Image source={{ uri: item.image_url }} style={styles.image} />
            </TouchableOpacity>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.price}>₹{price.toFixed(2)}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cartBtn} onPress={() => { addToCart(item); toggleWishlist(item); showToast("Added to cart!"); }}>
                  <Text style={styles.cartBtnText}>ADD TO CART</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBtn} onPress={() => toggleWishlist(item)}>
                  <Text style={styles.removeBtnText}>♡</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  list: { padding: 12 },
  item: {
    flexDirection: "row", backgroundColor: "#0a0a0a", borderRadius: 10,
    padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#1a1a1a",
  },
  image: { width: 80, height: 100, borderRadius: 6, backgroundColor: "#111" },
  info: { flex: 1, marginLeft: 12, justifyContent: "center" },
  name: { color: "#fff", fontSize: 14, fontWeight: "500", marginBottom: 4 },
  price: { color: "#ff6b00", fontSize: 16, fontWeight: "700", marginBottom: 8 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  cartBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 6,
    borderWidth: 1, borderColor: "#ff6b00", alignItems: "center",
  },
  cartBtnText: { color: "#ff6b00", fontWeight: "700", fontSize: 11 },
  removeBtn: { padding: 6 },
  removeBtnText: { color: "#ff6b00", fontSize: 20 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#050505" },
  emptyIcon: { fontSize: 48, color: "#333", marginBottom: 12 },
  emptyText: { color: "#fff", fontSize: 18, fontWeight: "600", marginBottom: 4 },
  emptySub: { color: "#666", fontSize: 14, marginBottom: 24 },
  shopBtn: {
    backgroundColor: "#ff6b00", paddingVertical: 12, paddingHorizontal: 36, borderRadius: 8,
  },
  shopBtnText: { color: "#000", fontWeight: "700", fontSize: 13 },
});

export default WishlistScreen;
