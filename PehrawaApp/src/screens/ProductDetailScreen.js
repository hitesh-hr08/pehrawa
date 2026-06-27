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

  const handleAddToCart = () => {
    addToCart({ ...product, size: selectedSize, quantity: qty });
    showToast("Added to cart!");
  };

  const handleBuy = () => {
    if (!selectedSize) { showToast("Select size"); return; }
    navigation.navigate("Checkout", { product: { ...product, size: selectedSize, quantity: qty } });
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.image_url }} style={styles.image} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.name}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{price.toFixed(2)}</Text>
          {orig > price && <Text style={styles.orig}>₹{orig.toFixed(0)}</Text>}
          {disc > 0 && <Text style={styles.disc}>-{disc}%</Text>}
        </View>
        <Text style={styles.desc}>{product.description}</Text>

        <Text style={styles.label}>Size</Text>
        <View style={styles.sizeRow}>
          {sizes.map((s) => (
            <TouchableOpacity key={s} style={[styles.sizeBtn, selectedSize === s && styles.sizeActive]} onPress={() => setSelectedSize(s)}>
              <Text style={[styles.sizeText, selectedSize === s && styles.sizeTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.qtyRow}>
          <Text style={styles.label}>Quantity</Text>
          <View style={styles.qtyControl}>
            <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>-</Text></TouchableOpacity>
            <Text style={styles.qtyVal}>{qty}</Text>
            <TouchableOpacity onPress={() => setQty(Math.min(99, qty + 1))} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
            <Text style={styles.cartBtnText}>ADD TO CART</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyBtn} onPress={handleBuy}>
            <Text style={styles.buyBtnText}>BUY</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.wishBtn} onPress={() => { toggleWishlist(product); showToast(isInWishlist(product.id) ? "Removed" : "Added to wishlist"); }}>
          <Text style={styles.wishText}>{isInWishlist(product.id) ? "❤️" : "🤍"} {isInWishlist(product.id) ? "In Wishlist" : "Add to Wishlist"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  image: { width: "100%", height: 400 },
  info: { padding: 20 },
  name: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  priceRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  price: { color: "#ff6b00", fontSize: 24, fontWeight: "700" },
  orig: { color: "#666", fontSize: 16, textDecorationLine: "line-through", marginLeft: 8 },
  disc: { color: "#10b981", fontSize: 14, fontWeight: "600", marginLeft: 8 },
  desc: { color: "#aaa", fontSize: 14, lineHeight: 22, marginBottom: 20 },
  label: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 8 },
  sizeRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  sizeBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: "#333", backgroundColor: "#0a0a0a" },
  sizeActive: { borderColor: "#ff6b00", backgroundColor: "#ff6b0020" },
  sizeText: { color: "#aaa", fontWeight: "600" },
  sizeTextActive: { color: "#ff6b00" },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  qtyControl: { flexDirection: "row", alignItems: "center" },
  qtyBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#0a0a0a", borderWidth: 1, borderColor: "#333", alignItems: "center", justifyContent: "center" },
  qtyBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  qtyVal: { color: "#fff", fontSize: 16, fontWeight: "600", marginHorizontal: 16 },
  actions: { flexDirection: "row", gap: 12, marginBottom: 16 },
  cartBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, borderWidth: 1, borderColor: "#ff6b00", alignItems: "center" },
  cartBtnText: { color: "#ff6b00", fontWeight: "700", fontSize: 13 },
  buyBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, backgroundColor: "#ff6b00", alignItems: "center" },
  buyBtnText: { color: "#000", fontWeight: "700", fontSize: 13 },
  wishBtn: { alignItems: "center", paddingVertical: 10 },
  wishText: { color: "#aaa", fontSize: 14 },
});

export default ProductDetailScreen;
