import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from './store';
import { COLORS, SIZES } from './utils/theme';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import AppNavigator from './navigation/AppNavigator';
import CategoryProductsScreen from './screens/CategoryProductsScreen';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import OrderSuccessScreen from './screens/OrderSuccessScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import AddressScreen from './screens/AddressScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import HelpSupportScreen from './screens/HelpSupportScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import EMIScreen from './screens/EMIScreen';
import ProductComparisonScreen from './screens/ProductComparisonScreen';
import VoiceSearchScreen from './screens/VoiceSearchScreen';
import LoyaltyPointsScreen from './screens/LoyaltyPointsScreen';

const Stack = createStackNavigator();

export default function App() {
  const { token, loadAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuth().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.splash}>
          <View style={styles.splashLogoCircle}>
            <Text style={styles.splashEmoji}>🛒</Text>
          </View>
          <Text style={styles.splashTitle}>FreshCart</Text>
          <Text style={styles.splashSubtitle}>Fresh groceries in 10 mins</Text>
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!token ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Main" component={AppNavigator} />
              <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
              <Stack.Screen name="Cart" component={CartScreen} />
              <Stack.Screen name="Checkout" component={CheckoutScreen} />
              <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
              <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
              <Stack.Screen name="AddressManagement" component={AddressScreen} />
              <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
              <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="EMI" component={EMIScreen} />
              <Stack.Screen name="ProductComparison" component={ProductComparisonScreen} />
              <Stack.Screen name="VoiceSearch" component={VoiceSearchScreen} />
              <Stack.Screen name="LoyaltyPoints" component={LoyaltyPointsScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  splashEmoji: { fontSize: 50 },
  splashTitle: {
    fontSize: SIZES.xxxl,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  splashSubtitle: {
    fontSize: SIZES.md,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
});
