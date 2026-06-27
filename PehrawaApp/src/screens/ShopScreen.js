import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TextInput, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../services/api";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";

const ShopScreen = () => {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const data = await api.getProducts();
    if (data.success) {
      setProducts(data.products || []);
      setFiltered(data.products || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(products.filter((p) => p.name?.toLowerCase().includes(q)));
  }, [search]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search products..."
        placeholderTextColor="#666"
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={(item) => String(item.id)}
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
        ListEmptyComponent={<Text style={styles.empty}>No products found</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  search: { margin: 12, padding: 12, backgroundColor: "#0a0a0a", borderRadius: 8, color: "#fff", borderWidth: 1, borderColor: "#1a1a1a", fontSize: 14 },
  list: { paddingHorizontal: 6, paddingBottom: 20 },
  empty: { color: "#666", textAlign: "center", marginTop: 50, fontSize: 16 },
});

export default ShopScreen;
