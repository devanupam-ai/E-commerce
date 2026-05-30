import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, StatusBar,
} from 'react-native';
import { authAPI } from '../api';
import { useAuthStore } from '../store';
import { COLORS, SIZES } from '../utils/theme';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const setAuth = useAuthStore(s => s.setAuth);

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.phone || !form.password)
      return Alert.alert('Error', 'All fields are required');
    if (form.password !== form.confirmPassword)
      return Alert.alert('Error', 'Passwords do not match');
    if (form.phone.length !== 10)
      return Alert.alert('Error', 'Enter valid 10-digit phone number');

    setLoading(true);
    try {
      const res = await authAPI.register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      await setAuth(res.data, res.data.token);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const FIELDS = [
    { key: 'name', label: 'Full Name', placeholder: 'Enter your full name', icon: '👤', keyboardType: 'default' },
    { key: 'email', label: 'Email Address', placeholder: 'you@example.com', icon: '✉️', keyboardType: 'email-address' },
    { key: 'phone', label: 'Phone Number', placeholder: '10-digit mobile number', icon: '📱', keyboardType: 'phone-pad' },
    { key: 'password', label: 'Password', placeholder: 'Create a strong password', icon: '🔒', keyboardType: 'default', secure: true },
    { key: 'confirmPassword', label: 'Confirm Password', placeholder: 'Re-enter your password', icon: '🔒', keyboardType: 'default', secure: true },
  ];

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Green Header Section */}
        <View style={styles.topSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🛒</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Shop faster, smarter</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Sign Up</Text>

          {FIELDS.map(field => (
            <View key={field.key}>
              <Text style={styles.fieldLabel}>{field.label} <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, focusedField === field.key && styles.inputFocused]}
                placeholder={field.placeholder}
                placeholderTextColor={COLORS.textTertiary}
                value={form[field.key]}
                onChangeText={v => setForm(p => ({ ...p, [field.key]: v }))}
                secureTextEntry={field.secure || false}
                keyboardType={field.keyboardType}
                autoCapitalize="none"
                maxLength={field.key === 'phone' ? 10 : undefined}
                onFocus={() => setFocusedField(field.key)}
                onBlur={() => setFocusedField('')}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scrollContent: { flexGrow: 1 },
  topSection: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 36,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  logoEmoji: { fontSize: 36 },
  title: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.textInverse, marginBottom: 4 },
  subtitle: { fontSize: SIZES.md, color: 'rgba(255,255,255,0.8)' },

  formCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SIZES.paddingXL,
    paddingTop: 24,
  },
  formTitle: {
    fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.textPrimary,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary,
    marginBottom: 6, marginTop: 8,
  },
  required: { color: COLORS.error },
  input: {
    height: SIZES.inputHeight,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: 16,
    fontSize: SIZES.md,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surfaceSecondary,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLighter,
    borderWidth: 2,
  },

  btn: {
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    ...SIZES.shadow.medium,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: COLORS.textInverse, fontSize: SIZES.lg, fontWeight: '700' },

  dividerRow: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 18,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.divider },
  dividerText: { fontSize: SIZES.sm, color: COLORS.textTertiary, marginHorizontal: 12, fontWeight: '500' },

  loginBtn: {
    alignItems: 'center', paddingVertical: 14,
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radius,
  },
  loginText: { fontSize: SIZES.md, color: COLORS.textSecondary },
  loginBold: { color: COLORS.primary, fontWeight: '700' },
});
