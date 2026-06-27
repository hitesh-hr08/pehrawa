import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../context/AuthContext";
import { showToast } from "../components/Toast";

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) { showToast("Please fill all fields"); return; }
    if (phone.length < 10) { showToast("Enter valid phone number"); return; }
    setLoading(true);
    const data = await register({ name, email, phone, password });
    setLoading(false);
    if (data.success) {
      showToast("Registration successful!");
      navigation.goBack();
    } else {
      showToast(data.message || "Registration failed");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.form}>
        <Text style={styles.title}>REGISTER</Text>
        <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#666" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#666" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "REGISTERING..." : "REGISTER"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Already have an account? Login</Text>
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

export default RegisterScreen;
