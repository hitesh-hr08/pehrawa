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
  card: { backgroundColor: "#080808", borderWidth: 1, borderColor: "#121212", flex: 1, margin: 6 },
  imageWrap: { position: "relative", overflow: "hidden" },
  image: { width: "100%", height: 200 },
  badge: { position: "absolute", top: 12, left: 12, backgroundColor: "#ff6b00", paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: "#000", fontWeight: "700", fontSize: 10, letterSpacing: 1 },
  wishBtn: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 6 },
  info: { padding: 12 },
  name: { color: "#e0e0e0", fontSize: 13, fontWeight: "500", marginBottom: 4 },
  priceRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  price: { color: "#ff6b00", fontSize: 16, fontWeight: "700" },
  orig: { color: "#555", fontSize: 12, textDecorationLine: "line-through", marginLeft: 6 },
  addBtn: { borderWidth: 1, borderColor: "rgba(255,107,0,0.3)", paddingVertical: 8, alignItems: "center", borderRadius: 3 },
  addBtnText: { color: "#ff6b00", fontWeight: "600", fontSize: 11, letterSpacing: 1 },
});

export default ProductCard;
