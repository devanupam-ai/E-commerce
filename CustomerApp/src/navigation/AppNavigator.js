import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';

import HomeScreen from '../screens/HomeScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WishlistScreen from '../screens/WishlistScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ emoji, label, focused }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>{emoji}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    {focused && <View style={styles.tabIndicator} />}
  </View>
);

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textTertiary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarLabelStyle: { display: 'none' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="❤️" label="Wishlist" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📦" label="Orders" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabEmoji: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabEmojiFocused: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelFocused: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    top: -6,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
});
