import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

import HomeScreen from "../screens/HomeScreen";
import ShopScreen from "../screens/ShopScreen";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import CartScreen from "../screens/CartScreen";
import WishlistScreen from "../screens/WishlistScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ProfileScreen from "../screens/ProfileScreen";
import MyOrdersScreen from "../screens/MyOrdersScreen";
import TrackOrderScreen from "../screens/TrackOrderScreen";
import CheckoutScreen from "../screens/CheckoutScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({ name, focused }) => {
  const icons = {
    Home: { on: "⌂", off: "⌂" },
    Shop: { on: "⊞", off: "⊟" },
    Cart: { on: "●", off: "○" },
    Wishlist: { on: "♥", off: "♡" },
    Profile: { on: "■", off: "□" },
  };
  const icon = icons[name] || { on: "●", off: "○" };
  return (
    <Text style={[styles.tabIcon, { color: focused ? "#ff6b00" : "#666" }]}>
      {focused ? icon.on : icon.off}
    </Text>
  );
};

const CartBadge = () => {
  const { getCartCount } = useCart();
  const count = getCartCount();
  if (count === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      tabBarStyle: {
        backgroundColor: "#0a0a0a", borderTopColor: "#1a1a1a",
        height: 60, paddingBottom: 8, paddingTop: 4,
      },
      tabBarActiveTintColor: "#ff6b00",
      tabBarInactiveTintColor: "#666",
      headerStyle: { backgroundColor: "#050505" },
      headerTintColor: "#fff",
      tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      tabBarShowLabel: true,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false, tabBarLabel: "Home" }} />
    <Tab.Screen name="Shop" component={ShopScreen} options={{ headerShown: false, tabBarLabel: "Shop" }} />
    <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarLabel: "Cart", tabBarIcon: ({ focused }) => <View><TabIcon name="Cart" focused={focused} /><CartBadge /></View> }} />
    <Tab.Screen name="Wishlist" component={WishlistScreen} options={{ headerShown: false, tabBarLabel: "Wishlist" }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false, tabBarLabel: "Profile" }} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { user } = useAuth();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: "#050505" }, headerTintColor: "#fff", headerTitleStyle: { fontWeight: "700" } }}>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "Product Details", headerBackTitle: "Back" }} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Checkout" }} />
        <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: "My Orders" }} />
        <Stack.Screen name="TrackOrder" component={TrackOrderScreen} options={{ title: "Track Order" }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Sign In", headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Create Account", headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabIcon: { fontSize: 22, fontWeight: "700" },
  badge: {
    position: "absolute", top: -6, right: -10, minWidth: 16, height: 16,
    borderRadius: 8, backgroundColor: "#ff6b00", alignItems: "center", justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#000", fontSize: 9, fontWeight: "800" },
});

export default AppNavigator;
