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
        <Text style={styles.emptyText}>Your wishlist is empty</Text>
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
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Image source={{ uri: item.image_url }} style={styles.image} />
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.price}>₹{Number(item.price).toFixed(2)}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cartBtn} onPress={() => { addToCart(item); showToast("Added to cart!"); }}>
                <Text style={styles.cartBtnText}>ADD TO CART</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleWishlist(item)}>
                <Text style={styles.removeIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  list: { padding: 12 },
  item: { flexDirection: "row", backgroundColor: "#0a0a0a", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#1a1a1a" },
  image: { width: 80, height: 80, borderRadius: 8 },
  info: { flex: 1, marginLeft: 12, justifyContent: "center" },
  name: { color: "#fff", fontSize: 14, fontWeight: "600" },
  price: { color: "#ff6b00", fontSize: 15, fontWeight: "700", marginTop: 4 },
  actions: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 12 },
  cartBtn: { backgroundColor: "#ff6b00", paddingVertical: 6, paddingHorizontal: 16, borderRadius: 6 },
  cartBtnText: { color: "#000", fontWeight: "700", fontSize: 11 },
  removeIcon: { fontSize: 20 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#050505" },
  emptyText: { color: "#666", fontSize: 18, marginBottom: 20 },
  shopBtn: { backgroundColor: "#ff6b00", paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  shopBtnText: { color: "#000", fontWeight: "700" },
});

export default WishlistScreen;
