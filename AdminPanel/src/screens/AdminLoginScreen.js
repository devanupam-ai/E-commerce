import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminAuthAPI } from '../api';
import { COLORS, SIZES } from '../utils/theme';

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState('admin@ecommerce.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await adminAuthAPI.login({ email, password });
      if (res.data.role !== 'ADMIN') return Alert.alert('Access Denied', 'Admin access only');
      await AsyncStorage.setItem('adminToken', res.data.token);
      await AsyncStorage.setItem('adminUser', JSON.stringify(res.data));
      navigation.replace('Dashboard');
    } catch (e) {
      Alert.alert('Error', 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>⚙️</Text>
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.subtitle}>Ecommerce Management System</Text>
      </View>
      <TextInput
        style={styles.input} placeholder="Admin Email" placeholderTextColor={COLORS.gray}
        value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
      />
      <TextInput
        style={styles.input} placeholder="Password" placeholderTextColor={COLORS.gray}
        value={password} onChangeText={setPassword} secureTextEntry
      />
      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login to Admin</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, padding: SIZES.padding, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 70, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary },
  subtitle: { fontSize: SIZES.md, color: COLORS.gray, marginTop: 4 },
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
