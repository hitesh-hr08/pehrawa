import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../services/api";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";

const { width } = Dimensions.get("window");

const HomeScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await api.getProducts();
    if (data.success) setProducts(data.products || []);
    setLoading(false);
  };

  const renderHeader = () => (
    <View>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>HOME OF HM</Text>
        <Text style={styles.heroSub}>Premium Streetwear</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Best Sellers</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={products}
      numColumns={2}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={renderHeader}
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          inWishlist={isInWishlist(item.id)}
          onPress={(p) => navigation.navigate("ProductDetail", { product: p })}
          onAddToCart={addToCart}
          onToggleWishlist={toggleWishlist}
        />
      )}
      contentContainerStyle={styles.list}
      refreshing={loading}
      onRefresh={loadProducts}
    />
  );
};

const styles = StyleSheet.create({
  list: { paddingBottom: 20 },
  hero: { padding: 40, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  heroTitle: { fontSize: 36, fontWeight: "800", color: "#fff", letterSpacing: 3 },
  heroSub: { fontSize: 14, color: "#888", marginTop: 8, letterSpacing: 1 },
  section: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  sectionTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
});

export default HomeScreen;
