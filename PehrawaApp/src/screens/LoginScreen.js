import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../context/AuthContext";
import { showToast } from "../components/Toast";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) { showToast("Please fill all fields"); return; }
    setLoading(true);
    const data = await login(email, password);
    setLoading(false);
    if (data.success) {
      showToast("Welcome back!");
      navigation.goBack();
    } else {
      showToast(data.message || "Invalid email or password");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.form}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Welcome back to Pehrawa</Text>
        <TextInput
          style={styles.input} placeholder="Email" placeholderTextColor="#555"
          value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
        />
        <TextInput
          style={styles.input} placeholder="Password" placeholderTextColor="#555"
          value={password} onChangeText={setPassword} secureTextEntry
        />
        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "SIGNING IN..." : "SIGN IN"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.link}>New here? <Text style={styles.linkHighlight}>Create Account</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505", justifyContent: "center", padding: 24 },
  backBtn: { position: "absolute", top: 50, left: 20, zIndex: 10 },
  backBtnText: { color: "#ff6b00", fontSize: 15, fontWeight: "600" },
  form: { backgroundColor: "#0a0a0a", padding: 28, borderRadius: 16, borderWidth: 1, borderColor: "#1a1a1a" },
  title: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: 4 },
  subtitle: { color: "#666", fontSize: 14, marginBottom: 28 },
  input: {
    backgroundColor: "#0d0d0d", borderWidth: 1, borderColor: "#222", borderRadius: 10,
    padding: 15, color: "#fff", marginBottom: 14, fontSize: 14,
  },
  btn: {
    backgroundColor: "#ff6b00", paddingVertical: 15, borderRadius: 10,
    alignItems: "center", marginTop: 8,
  },
  btnText: { color: "#000", fontWeight: "700", fontSize: 15 },
  link: { color: "#666", textAlign: "center", marginTop: 20, fontSize: 14 },
  linkHighlight: { color: "#ff6b00", fontWeight: "600" },
});

export default LoginScreen;
