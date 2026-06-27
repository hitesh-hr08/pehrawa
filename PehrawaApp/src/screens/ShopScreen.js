import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../services/api";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";

const ShopScreen = () => {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("default");
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
    let result = products;
    const q = search.toLowerCase();
    if (q) result = result.filter((p) => p.name?.toLowerCase().includes(q));
    if (sortBy === "low") result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sortBy === "high") result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sortBy === "name") result = [...result].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    setFiltered(result);
  }, [search, sortBy]);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder='Search "t-shirts, hoodies..."'
            placeholderTextColor="#555"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterIcon}>⧉</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.sortRow}>
        <Text style={styles.resultCount}>{filtered.length} items</Text>
        <View style={styles.sortOptions}>
          {[
            { key: "default", label: "Sort" },
            { key: "low", label: "Price: Low" },
            { key: "high", label: "Price: High" },
            { key: "name", label: "Name" },
          ].map((o) => (
            <TouchableOpacity
              key={o.key}
              style={[styles.sortChip, sortBy === o.key && styles.sortChipActive]}
              onPress={() => setSortBy(o.key)}
            >
              <Text style={[styles.sortChipText, sortBy === o.key && styles.sortChipTextActive]}>
                {o.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>⊘</Text>
            <Text style={styles.emptyText}>No products found</Text>
            <TouchableOpacity style={styles.clearFilter} onPress={() => { setSearch(""); setSortBy("default"); }}>
              <Text style={styles.clearFilterText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  searchRow: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 12, gap: 8 },
  searchWrap: {
    flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#0a0a0a",
    borderWidth: 1, borderColor: "#1a1a1a", borderRadius: 8, paddingHorizontal: 12,
  },
  searchIcon: { color: "#666", fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, color: "#fff", fontSize: 14 },
  clearBtn: { color: "#666", fontSize: 16, padding: 4 },
  filterBtn: {
    width: 44, borderRadius: 8, backgroundColor: "#0a0a0a",
    borderWidth: 1, borderColor: "#1a1a1a", alignItems: "center", justifyContent: "center",
  },
  filterIcon: { color: "#ff6b00", fontSize: 20 },
  sortRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#0a0a0a",
  },
  resultCount: { color: "#666", fontSize: 12 },
  sortOptions: { flexDirection: "row", gap: 6 },
  sortChip: {
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12,
    backgroundColor: "#0a0a0a", borderWidth: 1, borderColor: "#1a1a1a",
  },
  sortChipActive: { borderColor: "#ff6b00", backgroundColor: "#ff6b0015" },
  sortChipText: { color: "#888", fontSize: 11, fontWeight: "600" },
  sortChipTextActive: { color: "#ff6b00" },
  list: { paddingBottom: 20 },
  row: { paddingHorizontal: 10, gap: 8 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: { fontSize: 48, color: "#333", marginBottom: 12 },
  emptyText: { color: "#666", fontSize: 16, marginBottom: 16 },
  clearFilter: { paddingVertical: 8, paddingHorizontal: 20, borderWidth: 1, borderColor: "#ff6b00", borderRadius: 6 },
  clearFilterText: { color: "#ff6b00", fontWeight: "600", fontSize: 12 },
});

export default ShopScreen;
