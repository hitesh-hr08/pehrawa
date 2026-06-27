import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";

let toastRef = null;

export const showToast = (message) => {
  if (toastRef) toastRef(message);
};

const Toast = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const opacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    toastRef = (msg) => {
      setMessage(msg);
      setVisible(true);
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setVisible(false));
      }, 2500);
    };
    return () => { toastRef = null; };
  }, []);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { position: "absolute", bottom: 100, left: 20, right: 20, backgroundColor: "#ff6b00", padding: 14, borderRadius: 8, alignItems: "center", zIndex: 9999 },
  text: { color: "#000", fontWeight: "600", fontSize: 14 },
});

export default Toast;
