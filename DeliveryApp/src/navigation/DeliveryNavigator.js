import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeliveryLoginScreen from '../screens/DeliveryLoginScreen';
import DeliveryHomeScreen from '../screens/DeliveryHomeScreen';
import VerifyOtpScreen from '../screens/VerifyOtpScreen';
import DeliverySuccessScreen from '../screens/DeliverySuccessScreen';
import { COLORS } from '../utils/theme';
import { authState } from '../store/authState';

const Stack = createStackNavigator();

export default function DeliveryNavigator() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('deliveryToken').then(t => {
      _token = t;
      setToken(t);
      setLoading(false);
    });
    return authState.subscribe(setToken);
  }, []);

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <Stack.Screen name="Login" component={DeliveryLoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={DeliveryHomeScreen} />
            <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
            <Stack.Screen name="DeliverySuccess" component={DeliverySuccessScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
