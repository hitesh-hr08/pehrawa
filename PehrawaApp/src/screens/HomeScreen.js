import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../services/api";
import { useCart } from "../context/CartContext";
import { API_BASE } from "../constants/config";
import ProductCard from "../components/ProductCard";

const { width } = Dimensions.get("window");
const CARD_W = (width - 32 - 12) / 2;

const categories = [
  { name: "T-SHIRTS", desc: "Premium Printed Tees", image: "/images/Shirt1.avif" },
  { name: "SHIRTS", desc: "Classic & Formal", image: "/images/Shirt2.webp" },
  { name: "HOODIES", desc: "Streetwear Essential", image: "/images/Hero-Image.png" },
  { name: "PANTS", desc: "Comfort & Style", image: "/images/Jean1.webp" },
  { name: "FOOTWEAR", desc: "Premium Collection", image: "/images/Footwear1.webp" },
  { name: "SUNGLASSES", desc: "Complete the Look", image: "/images/Sunglasses1.webp" },
  { name: "WATCHES", desc: "Timeless Style", image: "/images/Watch1.jpg" },
  { name: "PERFUMES", desc: "Signature Scents", image: "/images/product1.png" },
];

const benefits = [
  { icon: "✓", title: "PREMIUM QUALITY", desc: "Finest Fabrics" },
  { icon: "✓", title: "SECURE PACKAGING", desc: "Packed with care" },
  { icon: "✓", title: "FAST DELIVERY", desc: "Pan India" },
  { icon: "✓", title: "EASY RETURNS", desc: "Hassle Free" },
];

const HomeScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { addToCart, toggleWishlist, isInWishlist, getCartCount } = useCart();

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const data = await api.getProducts();
    if (data.success) setProducts(data.products || []);
    setLoading(false);
  };

  const TopBar = () => (
    <View style={styles.topBar}>
      <Text style={styles.topBarText}>FREE SHIPPING ABOVE ₹999 | BUY 2 TEES GET 10% OFF</Text>
    </View>
  );

  const CustomHeader = () => (
    <View style={styles.header}>
      <Image source={{ uri: API_BASE + "/images/logo.png" }} style={styles.headerLogo} resizeMode="contain" />
      <View style={styles.headerRight}>
        <TouchableOpacity onPress={() => navigation.navigate("Wishlist")} style={styles.headerIcon}>
          <Text style={styles.headerIconText}>♡</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Cart")} style={styles.headerIcon}>
          <Text style={styles.headerIconText}>🛒</Text>
          {getCartCount() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{getCartCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={styles.loginBtn}>
          <Text style={styles.loginBtnText}>LOGIN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const HeroSection = () => (
    <View style={styles.hero}>
      <Image source={{ uri: API_BASE + "/images/Hero-Image.png" }} style={styles.heroBg} resizeMode="cover" />
      <View style={styles.heroOverlay} />
      <View style={styles.heroContent}>
        <Text style={styles.heroMini}>HM SIGNATURE COLLECTION</Text>
        <Text style={styles.heroTitle}>WEAR YOUR{'\n'}<Text style={styles.heroTitleSpan}>IDENTITY.</Text></Text>
        <Text style={styles.heroSub}>Premium Printed Wear. Built for Comfort. Made to Stand Out.</Text>
        <View style={styles.heroBtns}>
          <TouchableOpacity style={styles.heroBtnPrimary} onPress={() => navigation.navigate("Shop")}>
            <Text style={styles.heroBtnPrimaryText}>SHOP NOW</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroBtnSecondary} onPress={() => navigation.navigate("Shop")}>
            <Text style={styles.heroBtnSecondaryText}>EXPLORE COLLECTIONS</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.heroBrand}>
          <View style={styles.heroBrandLine} />
          <Image source={{ uri: API_BASE + "/images/HM-Logo.png" }} style={styles.heroHmLogo} resizeMode="contain" />
          <Text style={styles.heroBy}>BY</Text>
          <Image source={{ uri: API_BASE + "/images/logo.png" }} style={styles.heroPehrawaLogo} resizeMode="contain" />
        </View>
      </View>
    </View>
  );

  const CategoryCard = ({ item }) => (
    <TouchableOpacity style={styles.catCard} onPress={() => navigation.navigate("Shop")}>
      <Image source={{ uri: API_BASE + item.image }} style={styles.catImage} resizeMode="cover" />
      <View style={styles.catInfo}>
        <Text style={styles.catName}>{item.name}</Text>
        <Text style={styles.catDesc}>{item.desc}</Text>
      </View>
    </TouchableOpacity>
  );

  const CategoriesSection = () => {
    const leftCol = categories.filter((_, i) => i % 2 === 0);
    const rightCol = categories.filter((_, i) => i % 2 !== 0);
    return (
      <View style={styles.catSection}>
        <Text style={styles.sectionTitle}>SHOP BY CATEGORY</Text>
        <View style={styles.catGrid}>
          {categories.map((cat, i) => (
            <CategoryCard key={i} item={cat} />
          ))}
        </View>
      </View>
    );
  };

  const BenefitsSection = () => (
    <View style={styles.benefitsSection}>
      <Text style={styles.sectionTitle}>WHY PEHRAWA</Text>
      <View style={styles.benefitsGrid}>
        {benefits.map((b, i) => (
          <View key={i} style={styles.benefitCard}>
            <View style={styles.benefitIconWrap}>
              <Text style={styles.benefitIcon}>{b.icon}</Text>
            </View>
            <View style={styles.benefitTextWrap}>
              <Text style={styles.benefitTitle}>{b.title}</Text>
              <Text style={styles.benefitDesc}>{b.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const FooterSection = () => (
    <View style={styles.footer}>
      <View style={styles.footerTop}>
        <View style={styles.footerCol}>
          <Image source={{ uri: API_BASE + "/images/logo.png" }} style={styles.footerLogo} resizeMode="contain" />
          <Text style={styles.footerDesc}>HOME OF HM — Premium printed and custom printed t-shirts for men who love to stand out.</Text>
          <View style={styles.socials}>
            <TouchableOpacity style={styles.socialIcon}><Text style={styles.socialIconText}>f</Text></TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}><Text style={styles.socialIconText}>ig</Text></TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}><Text style={styles.socialIconText}>yt</Text></TouchableOpacity>
          </View>
          <Text style={styles.footerRights}>© 2026 Pehrawa. All Rights Reserved.</Text>
        </View>
        <View style={styles.footerCol}>
          <Text style={styles.footerHeading}>SHOP</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Shop")}><Text style={styles.footerLink}>All Products</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Shop")}><Text style={styles.footerLink}>T-Shirts</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Shop")}><Text style={styles.footerLink}>Hoodies</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Shop")}><Text style={styles.footerLink}>Collections</Text></TouchableOpacity>
        </View>
        <View style={styles.footerCol}>
          <Text style={styles.footerHeading}>HELP</Text>
          <TouchableOpacity><Text style={styles.footerLink}>Size Guide</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.footerLink}>Track Order</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.footerLink}>Shipping Policy</Text></TouchableOpacity>
          <TouchableOpacity><Text style={styles.footerLink}>Terms & Conditions</Text></TouchableOpacity>
        </View>
        <View style={styles.footerCol}>
          <Text style={styles.footerHeading}>CONTACT</Text>
          <Text style={styles.footerContact}><Text style={styles.footerContactLabel}>📞 </Text>+91 9855707708</Text>
          <Text style={styles.footerContact}><Text style={styles.footerContactLabel}>✉️ </Text>pehrawamenswear@gmail.com</Text>
          <Text style={styles.footerContact}><Text style={styles.footerContactLabel}>📍 </Text>Punjab, India</Text>
        </View>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View>
      <TopBar />
      <CustomHeader />
      <HeroSection />
      <CategoriesSection />
      <BenefitsSection />
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>BEST SELLERS</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Shop")}>
          <Text style={styles.viewAll}>VIEW ALL →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      data={products}
      numColumns={2}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={FooterSection}
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
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={styles.row}
    />
  );
};

const styles = StyleSheet.create({
  list: { paddingBottom: 20 },
  row: { paddingHorizontal: 12, gap: 8 },

  topBar: {
    height: 24, backgroundColor: "#0a0a0a", borderBottomWidth: 1, borderBottomColor: "#181818",
    alignItems: "center", justifyContent: "center",
  },
  topBarText: { color: "#d58c45", fontSize: 10, letterSpacing: 1, fontWeight: "500" },

  header: {
    height: 56, backgroundColor: "rgba(4,4,4,0.95)", borderBottomWidth: 1, borderBottomColor: "#121212",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16,
  },
  headerLogo: { width: 110, height: 40 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerIcon: { padding: 4, position: "relative" },
  headerIconText: { color: "#fff", fontSize: 20 },
  cartBadge: {
    position: "absolute", top: -4, right: -6, width: 16, height: 16, borderRadius: 8,
    backgroundColor: "#e53935", alignItems: "center", justifyContent: "center",
  },
  cartBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  loginBtn: {
    paddingVertical: 6, paddingHorizontal: 14, backgroundColor: "#ff6b00",
    borderRadius: 20,
  },
  loginBtnText: { color: "#000", fontSize: 11, fontWeight: "700" },

  hero: { height: 420, position: "relative", overflow: "hidden" },
  heroBg: { position: "absolute", width: "100%", height: "100%" },
  heroOverlay: {
    position: "absolute", width: "100%", height: "100%",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  heroContent: { flex: 1, justifyContent: "center", paddingHorizontal: 20, paddingTop: 20 },
  heroMini: { color: "#fff", fontSize: 11, letterSpacing: 5, opacity: 0.8, marginBottom: 12 },
  heroTitle: { color: "#fff", fontSize: 36, fontWeight: "700", lineHeight: 40, marginBottom: 10 },
  heroTitleSpan: { color: "#ff6b00" },
  heroSub: { color: "#ddd", fontSize: 14, lineHeight: 22, maxWidth: "90%" },
  heroBtns: { flexDirection: "row", gap: 10, marginTop: 20 },
  heroBtnPrimary: {
    backgroundColor: "#fff", paddingVertical: 12, paddingHorizontal: 22,
    borderRadius: 3,
  },
  heroBtnPrimaryText: { color: "#000", fontWeight: "700", fontSize: 12 },
  heroBtnSecondary: {
    borderWidth: 1, borderColor: "#444", paddingVertical: 12, paddingHorizontal: 22,
    borderRadius: 3,
  },
  heroBtnSecondaryText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  heroBrand: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 28 },
  heroBrandLine: { width: 40, height: 1, backgroundColor: "#444" },
  heroHmLogo: { width: 50, height: 24 },
  heroBy: { color: "#888", fontSize: 11, letterSpacing: 3, fontWeight: "500" },
  heroPehrawaLogo: { width: 60, height: 20, opacity: 0.95 },

  catSection: { paddingVertical: 30 },
  sectionTitle: {
    textAlign: "center", fontSize: 15, letterSpacing: 6, fontWeight: "500",
    color: "#fff", marginBottom: 24,
  },
  catGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 8 },
  catCard: {
    width: (width - 32) / 2, backgroundColor: "#080808", borderWidth: 1, borderColor: "#121212",
    overflow: "hidden",
  },
  catImage: { width: "100%", height: 130 },
  catInfo: { padding: 10 },
  catName: { color: "#fff", fontSize: 14, fontWeight: "500" },
  catDesc: { color: "#888", fontSize: 11, marginTop: 4 },

  benefitsSection: {
    paddingVertical: 30, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: "#121212",
    borderBottomWidth: 1, borderBottomColor: "#121212",
  },
  benefitsGrid: { gap: 14 },
  benefitCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#0a0a0a", borderRadius: 8, padding: 14,
    borderWidth: 1, borderColor: "#181818",
  },
  benefitIconWrap: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#ff6b0015",
    alignItems: "center", justifyContent: "center",
  },
  benefitIcon: { fontSize: 16, color: "#ff6b00", fontWeight: "700" },
  benefitTextWrap: { flex: 1 },
  benefitTitle: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 1, marginBottom: 2 },
  benefitDesc: { color: "#777", fontSize: 12 },

  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 28, paddingBottom: 16,
  },
  viewAll: { color: "#ddd", fontSize: 12, letterSpacing: 1 },

  footer: { borderTopWidth: 1, borderTopColor: "#111", paddingTop: 32, paddingBottom: 16 },
  footerTop: { paddingHorizontal: 20, gap: 28 },
  footerCol: {},
  footerLogo: { width: 100, height: 36, marginBottom: 12 },
  footerDesc: { color: "#aaa", fontSize: 12, lineHeight: 20, marginBottom: 12 },
  socials: { flexDirection: "row", gap: 10 },
  socialIcon: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#111",
    alignItems: "center", justifyContent: "center",
  },
  socialIconText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  footerHeading: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 12 },
  footerLink: { color: "#999", fontSize: 13, marginBottom: 8 },
  footerContact: { color: "#aaa", fontSize: 13, marginBottom: 6 },
  footerContactLabel: { fontSize: 12 },
  footerRights: { color: "#555", fontSize: 11, marginTop: 16 },
});

export default HomeScreen;
