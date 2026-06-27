import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.icon}>👤</Text>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.sub}>Sign in for orders, wishlist & more</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginBtnText}>SIGN IN</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.link}>New user? <Text style={styles.linkHighlight}>Create Account</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name ? user.name.charAt(0).toUpperCase() : "U"}</Text>
        </View>
        <Text style={styles.name}>{user.name || "User"}</Text>
        <Text style={styles.email}>{user.email || ""}</Text>
        <Text style={styles.phone}>{user.phone || ""}</Text>
      </View>
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate("MyOrders")}>
          <Text style={styles.menuIcon}>📦</Text>
          <View style={styles.menuInfo}>
            <Text style={styles.menuBtnText}>My Orders</Text>
            <Text style={styles.menuSub}>View order history & status</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate("Wishlist")}>
          <Text style={styles.menuIcon}>♥</Text>
          <View style={styles.menuInfo}>
            <Text style={styles.menuBtnText}>My Wishlist</Text>
            <Text style={styles.menuSub}>Saved items</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate("TrackOrder")}>
          <Text style={styles.menuIcon}>🚚</Text>
          <View style={styles.menuInfo}>
            <Text style={styles.menuBtnText}>Track Order</Text>
            <Text style={styles.menuSub}>Track your delivery</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutBtnText}>SIGN OUT</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505", padding: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 6 },
  sub: { color: "#888", fontSize: 14, marginBottom: 28, textAlign: "center" },
  loginBtn: {
    backgroundColor: "#ff6b00", paddingVertical: 12, paddingHorizontal: 48, borderRadius: 10,
    marginBottom: 16,
  },
  loginBtnText: { color: "#000", fontWeight: "700", fontSize: 14 },
  link: { color: "#666", fontSize: 14 },
  linkHighlight: { color: "#ff6b00", fontWeight: "600" },
  profile: { alignItems: "center", paddingTop: 20, paddingBottom: 28 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "#ff6b00",
    alignItems: "center", justifyContent: "center", marginBottom: 14,
  },
  avatarText: { color: "#000", fontSize: 32, fontWeight: "700" },
  name: { color: "#fff", fontSize: 22, fontWeight: "700" },
  email: { color: "#888", fontSize: 14, marginTop: 4 },
  phone: { color: "#666", fontSize: 13, marginTop: 2 },
  menu: { gap: 10 },
  menuBtn: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#0a0a0a",
    padding: 16, borderRadius: 10, borderWidth: 1, borderColor: "#1a1a1a",
  },
  menuIcon: { fontSize: 22, width: 36, textAlign: "center" },
  menuInfo: { flex: 1, marginLeft: 12 },
  menuBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  menuSub: { color: "#666", fontSize: 12, marginTop: 2 },
  arrow: { color: "#555", fontSize: 22, fontWeight: "300" },
  logoutBtn: {
    paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: "#ff4444",
    alignItems: "center", marginTop: 24,
  },
  logoutBtnText: { color: "#ff4444", fontWeight: "700", fontSize: 14 },
});

export default ProfileScreen;
