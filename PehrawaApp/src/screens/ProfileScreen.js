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
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.sub}>Login to view your profile</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginBtnText}>LOGIN</Text>
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

        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate("MyOrders")}>
          <Text style={styles.menuBtnText}>📦 My Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate("TrackOrder")}>
          <Text style={styles.menuBtnText}>📋 Track Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505", padding: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: 8 },
  sub: { color: "#888", marginBottom: 24 },
  profile: { alignItems: "center", paddingTop: 40 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#ff6b00", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  avatarText: { color: "#000", fontSize: 32, fontWeight: "700" },
  name: { color: "#fff", fontSize: 22, fontWeight: "700" },
  email: { color: "#888", fontSize: 14, marginBottom: 32 },
  menuBtn: { width: "100%", backgroundColor: "#0a0a0a", padding: 16, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: "#1a1a1a" },
  menuBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  logoutBtn: { width: "100%", padding: 14, borderRadius: 8, borderWidth: 1, borderColor: "#ff4444", alignItems: "center", marginTop: 16 },
  logoutBtnText: { color: "#ff4444", fontWeight: "700" },
  loginBtn: { backgroundColor: "#ff6b00", paddingVertical: 12, paddingHorizontal: 40, borderRadius: 8 },
  loginBtnText: { color: "#000", fontWeight: "700" },
});

export default ProfileScreen;
