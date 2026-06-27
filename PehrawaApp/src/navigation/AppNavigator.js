import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import { useAuth } from "../context/AuthContext";

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
  const icons = { Home: "🏠", Shop: "🛍️", Cart: "🛒", Wishlist: "❤️", Profile: "👤" };
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icons[name]}</Text>;
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      tabBarStyle: { backgroundColor: "#0a0a0a", borderTopColor: "#1a1a1a" },
      tabBarActiveTintColor: "#ff6b00",
      tabBarInactiveTintColor: "#666",
      headerStyle: { backgroundColor: "#050505" },
      headerTintColor: "#fff",
      tabBarLabelStyle: { fontSize: 11 },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Shop" component={ShopScreen} />
    <Tab.Screen name="Cart" component={CartScreen} />
    <Tab.Screen name="Wishlist" component={WishlistScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { user } = useAuth();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: "#050505" }, headerTintColor: "#fff" }}>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "Product" }} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Checkout" }} />
        <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: "My Orders" }} />
        <Stack.Screen name="TrackOrder" component={TrackOrderScreen} options={{ title: "Track Order" }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Login" }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Register" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
