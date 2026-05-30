import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deliveryAuthAPI } from '../api';
import { authState } from '../store/authState';
import { COLORS, SIZES } from '../utils/theme';

export default function DeliveryLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Enter credentials');
    setLoading(true);
    try {
      const res = await deliveryAuthAPI.login({ email, password });
      if (res.data.role !== 'DELIVERY_BOY')
        return Alert.alert('Access Denied', 'Delivery boy access only');
      await AsyncStorage.setItem('deliveryToken', res.data.token);
      await AsyncStorage.setItem('deliveryUser', JSON.stringify(res.data));
      authState.setToken(res.data.token);
    } catch {
      Alert.alert('Login Failed', 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Text style={styles.logo}>🚴</Text>
      <Text style={styles.title}>Delivery Partner</Text>
      <Text style={styles.subtitle}>Login to start delivering</Text>

      <TextInput
        style={styles.input} placeholder="Email" placeholderTextColor={COLORS.gray}
        value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
      />
      <TextInput
        style={styles.input} placeholder="Password" placeholderTextColor={COLORS.gray}
        value={password} onChangeText={setPassword} secureTextEntry
      />
      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, padding: SIZES.padding, justifyContent: 'center' },
  logo: { fontSize: 80, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center' },
  subtitle: { fontSize: SIZES.md, color: COLORS.gray, textAlign: 'center', marginBottom: 32 },
  input: {
    borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: SIZES.radius,
    padding: 14, marginBottom: 12, fontSize: SIZES.md, color: COLORS.black,
    backgroundColor: COLORS.background,
  },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  btnText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: 'bold' },
});
