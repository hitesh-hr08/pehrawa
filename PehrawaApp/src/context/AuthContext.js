import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuth();
  }, []);

  const loadAuth = async () => {
    try {
      const savedUser = await AsyncStorage.getItem("pehrawa_customer");
      const savedToken = await AsyncStorage.getItem("pehrawa_customer_token");
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
    } catch (e) {}
    setLoading(false);
  };

  const login = async (email, password) => {
    const data = await api.login(email, password);
    if (data.success) {
      await AsyncStorage.setItem("pehrawa_customer", JSON.stringify(data.customer || data.user));
      await AsyncStorage.setItem("pehrawa_customer_token", data.token);
      setUser(data.customer || data.user);
      setToken(data.token);
    }
    return data;
  };

  const register = async (form) => {
    const data = await api.register(form);
    if (data.success && data.token) {
      await AsyncStorage.setItem("pehrawa_customer", JSON.stringify(data.customer || data.user));
      await AsyncStorage.setItem("pehrawa_customer_token", data.token);
      setUser(data.customer || data.user);
      setToken(data.token);
    }
    return data;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["pehrawa_customer", "pehrawa_customer_token", "customerId"]);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
