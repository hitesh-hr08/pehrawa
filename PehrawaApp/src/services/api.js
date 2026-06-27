import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../constants/config";

const request = async (endpoint, options = {}) => {
  const headers = { "Content-Type": "application/json", ...options.headers };
  try {
    const token = await AsyncStorage.getItem("pehrawa_customer_token");
    if (token) headers["Authorization"] = "Bearer " + token;
  } catch (e) {}
  const res = await fetch(API_BASE + endpoint, { ...options, headers });
  return res.json();
};

export const api = {
  // Products
  getProducts: (search) =>
    request("/api/public/products" + (search ? "?search=" + encodeURIComponent(search) : "")),

  getProductById: async (id) => {
    const data = await request("/api/public/products");
    if (data.success && data.products)
      return data.products.find((p) => p.id == id);
    return null;
  },

  // Auth
  login: (email, password) =>
    request("/api/customers/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data) =>
    request("/api/customers/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  googleAuth: (token) =>
    request("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  // Orders
  createOrder: (data) =>
    request("/api/public/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCustomerOrders: (customerId) =>
    request("/api/customers/" + customerId + "/orders"),

  getOrderByTracking: (trackingId, phone) =>
    request("/api/public/orders/" + encodeURIComponent(trackingId) + "?phone=" + encodeURIComponent(phone)),

  // Razorpay
  createRazorpayOrder: (amount) =>
    request("/api/create-order", {
      method: "POST",
      body: JSON.stringify({ amount, currency: "INR" }),
    }),

  verifyRazorpayPayment: (data) =>
    request("/api/verify-payment", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getRazorpayKey: () => request("/api/razorpay-key"),

  // Addresses
  getAddresses: (customerId) =>
    request("/api/customers/" + customerId + "/addresses"),

  saveAddress: (customerId, data) =>
    request("/api/customers/" + customerId + "/addresses", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteAddress: (customerId, addressId) =>
    request("/api/customers/" + customerId + "/addresses/" + addressId, {
      method: "DELETE",
    }),
};
