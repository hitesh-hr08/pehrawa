import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

const ProductCard = ({ product, onPress, onAddToCart, onToggleWishlist, inWishlist }) => {
  const price = Number(product.price) || 0;
  const orig = product.original_price ? Number(product.original_price) : Math.round(price * 1.5);
  const disc = orig > price ? Math.round((1 - price / orig) * 100) : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(product)}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />
        {disc > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{disc}%</Text>
          </View>
        )}
        <TouchableOpacity style={styles.wishBtn} onPress={() => onToggleWishlist(product)}>
          <Text style={{ fontSize: 18 }}>{inWishlist ? "❤️" : "🤍"}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{price.toFixed(2)}</Text>
          {orig > price && <Text style={styles.orig}>₹{orig.toFixed(0)}</Text>}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => onAddToCart(product)}>
          <Text style={styles.addBtnText}>ADD TO CART</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: "#0a0a0a", borderRadius: 12, marginBottom: 16, overflow: "hidden", borderWidth: 1, borderColor: "#1a1a1a", flex: 1, margin: 6 },
  imageWrap: { position: "relative" },
  image: { width: "100%", height: 200 },
  badge: { position: "absolute", top: 8, left: 8, backgroundColor: "#ff6b00", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeText: { color: "#000", fontWeight: "700", fontSize: 12 },
  wishBtn: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 6 },
  info: { padding: 12 },
  name: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 4 },
  priceRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  price: { color: "#ff6b00", fontSize: 16, fontWeight: "700" },
  orig: { color: "#666", fontSize: 12, textDecorationLine: "line-through", marginLeft: 6 },
  addBtn: { backgroundColor: "#ff6b00", paddingVertical: 8, borderRadius: 6, alignItems: "center" },
  addBtnText: { color: "#000", fontWeight: "700", fontSize: 12 },
});

export default ProductCard;
