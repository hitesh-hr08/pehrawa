import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";
import { AuthProvider } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
import AppNavigator from "./src/navigation/AppNavigator";
import Toast from "./src/components/Toast";

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar style="light" />
          <AppNavigator />
          <Toast />
        </SafeAreaView>
      </CartProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
});

export default App;
