import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    loadCart();
    loadWishlist();
  }, []);

  const loadCart = async () => {
    try {
      const data = await AsyncStorage.getItem("pehrawa_cart");
      if (data) setCart(JSON.parse(data));
    } catch (e) {}
  };

  const saveCart = async (items) => {
    setCart(items);
    await AsyncStorage.setItem("pehrawa_cart", JSON.stringify(items));
  };

  const loadWishlist = async () => {
    try {
      const data = await AsyncStorage.getItem("pehrawa_wishlist");
      if (data) setWishlist(JSON.parse(data));
    } catch (e) {}
  };

  const saveWishlist = async (items) => {
    setWishlist(items);
    await AsyncStorage.setItem("pehrawa_wishlist", JSON.stringify(items));
  };

  const addToCart = (product) => {
    const existing = cart.findIndex((i) => i.id === product.id);
    if (existing >= 0) {
      const updated = [...cart];
      updated[existing] = { ...updated[existing], quantity: (updated[existing].quantity || 1) + 1 };
      saveCart(updated);
    } else {
      saveCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => saveCart(cart.filter((i) => i.id !== id));

  const updateQuantity = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    saveCart(cart.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
  };

  const clearCart = () => saveCart([]);

  const toggleWishlist = (product) => {
    const exists = wishlist.find((i) => i.id === product.id);
    if (exists) {
      saveWishlist(wishlist.filter((i) => i.id !== product.id));
    } else {
      saveWishlist([...wishlist, product]);
    }
  };

  const isInWishlist = (id) => wishlist.some((i) => i.id === id);

  const getCartTotal = () => cart.reduce((s, i) => s + Number(i.price) * Number(i.quantity || 1), 0);
  const getCartCount = () => cart.reduce((s, i) => s + Number(i.quantity || 1), 0);

  return (
    <CartContext.Provider
      value={{
        cart, wishlist, addToCart, removeFromCart, updateQuantity, clearCart,
        toggleWishlist, isInWishlist, getCartTotal, getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
