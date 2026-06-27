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
      showToast("Login successful!");
      navigation.goBack();
    } else {
      showToast(data.message || "Login failed");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.form}>
        <Text style={styles.title}>LOGIN</Text>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "LOGGING IN..." : "LOGIN"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.link}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505", justifyContent: "center", padding: 24 },
  form: { backgroundColor: "#0a0a0a", padding: 24, borderRadius: 16, borderWidth: 1, borderColor: "#1a1a1a" },
  title: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: 24, textAlign: "center" },
  input: { backgroundColor: "#0d0d0d", borderWidth: 1, borderColor: "#222", borderRadius: 8, padding: 14, color: "#fff", marginBottom: 12, fontSize: 14 },
  btn: { backgroundColor: "#ff6b00", padding: 16, borderRadius: 8, alignItems: "center", marginTop: 8 },
  btnText: { color: "#000", fontWeight: "700", fontSize: 14 },
  link: { color: "#ff6b00", textAlign: "center", marginTop: 16, fontSize: 13 },
});

export default LoginScreen;
