import React, { useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useCart } from "../context/CartContext";
import { showToast } from "../components/Toast";

const sizes = ["S", "M", "L", "XL", "XXL"];

const ProductDetailScreen = ({ route, navigation }) => {
  const product = route.params?.product;
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  if (!product) return <View style={styles.container}><Text style={{ color: "#fff", textAlign: "center", marginTop: 50 }}>Product not found</Text></View>;

  const price = Number(product.price) || 0;
  const orig = product.original_price ? Number(product.original_price) : Math.round(price * 1.5);
  const disc = orig > price ? Math.round((1 - price / orig) * 100) : 0;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart({ ...product, size: selectedSize, quantity: qty });
    showToast("Added to cart!");
  };

  const handleBuy = () => {
    if (!selectedSize) { showToast("Select size"); return; }
    navigation.navigate("Checkout", { product: { ...product, size: selectedSize, quantity: qty } });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />
        <View style={styles.info}>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{price.toFixed(2)}</Text>
            {orig > price && <Text style={styles.orig}>₹{orig.toFixed(0)}</Text>}
            {disc > 0 && <View style={styles.discBadge}><Text style={styles.discText}>{disc}% off</Text></View>}
          </View>
          <Text style={styles.taxInfo}>inclusive of all taxes</Text>
          <Text style={styles.desc}>{product.description || "Premium quality fabric. Comfortable fit. Designed for everyday wear."}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Select Size</Text>
          <View style={styles.sizeRow}>
            {sizes.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.sizeBtn, selectedSize === s && styles.sizeActive]}
                onPress={() => setSelectedSize(s)}
              >
                <Text style={[styles.sizeText, selectedSize === s && styles.sizeTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.qtyRow}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.qtyControl}>
              <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))} style={styles.qtyBtn} disabled={qty <= 1}>
                <Text style={[styles.qtyBtnText, qty <= 1 && { opacity: 0.3 }]}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyVal}>{qty}</Text>
              <TouchableOpacity onPress={() => setQty(Math.min(99, qty + 1))} style={styles.qtyBtn} disabled={qty >= 99}>
                <Text style={[styles.qtyBtnText, qty >= 99 && { opacity: 0.3 }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.wishBtn} onPress={() => { toggleWishlist(product); showToast(inWishlist ? "Removed" : "Added to wishlist"); }}>
          <Text style={[styles.wishBtnText, inWishlist && { color: "#ff6b00" }]}>{inWishlist ? "♥" : "♡"} Wishlist</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
          <Text style={styles.cartBtnText}>ADD TO CART</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyBtn} onPress={handleBuy}>
          <Text style={styles.buyBtnText}>BUY</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  image: { width: "100%", height: 380, backgroundColor: "#0a0a0a" },
  info: { padding: 20 },
  name: { color: "#fff", fontSize: 20, fontWeight: "600", marginBottom: 10 },
  priceRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  price: { color: "#ff6b00", fontSize: 24, fontWeight: "700" },
  orig: { color: "#666", fontSize: 16, textDecorationLine: "line-through", marginLeft: 8 },
  discBadge: { marginLeft: 8, backgroundColor: "#10b98120", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  discText: { color: "#10b981", fontSize: 13, fontWeight: "700" },
  taxInfo: { color: "#10b981", fontSize: 12, marginBottom: 16 },
  desc: { color: "#aaa", fontSize: 14, lineHeight: 22 },
  divider: { height: 1, backgroundColor: "#1a1a1a", marginVertical: 20 },
  sectionTitle: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 12 },
  sizeRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  sizeBtn: {
    width: 48, height: 48, borderRadius: 8, borderWidth: 1, borderColor: "#333",
    backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center",
  },
  sizeActive: { borderColor: "#ff6b00", backgroundColor: "#ff6b0015" },
  sizeText: { color: "#aaa", fontWeight: "600", fontSize: 14 },
  sizeTextActive: { color: "#ff6b00" },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  qtyControl: { flexDirection: "row", alignItems: "center" },
  qtyBtn: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: "#0a0a0a",
    borderWidth: 1, borderColor: "#333", alignItems: "center", justifyContent: "center",
  },
  qtyBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  qtyVal: { color: "#fff", fontSize: 16, fontWeight: "600", marginHorizontal: 16 },
  bottomBar: {
    flexDirection: "row", padding: 12, gap: 10, backgroundColor: "#0a0a0a",
    borderTopWidth: 1, borderTopColor: "#1a1a1a",
  },
  wishBtn: {
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 8,
    borderWidth: 1, borderColor: "#333", alignItems: "center", justifyContent: "center",
  },
  wishBtnText: { color: "#888", fontSize: 12, fontWeight: "600" },
  cartBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 8,
    borderWidth: 1, borderColor: "#ff6b00", alignItems: "center", justifyContent: "center",
  },
  cartBtnText: { color: "#ff6b00", fontWeight: "700", fontSize: 13 },
  buyBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 8,
    backgroundColor: "#ff6b00", alignItems: "center", justifyContent: "center",
  },
  buyBtnText: { color: "#000", fontWeight: "700", fontSize: 13 },
});

export default ProductDetailScreen;
