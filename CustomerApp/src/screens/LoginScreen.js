import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView, StatusBar,
} from 'react-native';
import { authAPI } from '../api';
import { useAuthStore } from '../store';
import { COLORS, SIZES, PRESETS } from '../utils/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const setAuth = useAuthStore(s => s.setAuth);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Enter email and password');
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      await setAuth(res.data, res.data.token);
    } catch (e) {
      Alert.alert('Login Failed', e.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Green Header Section */}
        <View style={styles.topSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🛒</Text>
          </View>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Login to continue shopping</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Sign In</Text>

          <Text style={styles.fieldLabel}>Email Address</Text>
          <TextInput
            style={[styles.input, focusedField === 'email' && styles.inputFocused]}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField('')}
          />

          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput
            style={[styles.input, focusedField === 'password' && styles.inputFocused]}
            placeholder="Enter your password"
            placeholderTextColor={COLORS.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField('')}
          />

          <TouchableOpacity style={styles.forgotRow} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
          >
            <Text style={styles.registerText}>
              New user? <Text style={styles.registerBold}>Create Account</Text>
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
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: { fontSize: 40 },
  title: { fontSize: SIZES.xxxl, fontWeight: '800', color: COLORS.textInverse, marginBottom: 4 },
  subtitle: { fontSize: SIZES.md, color: 'rgba(255,255,255,0.8)' },

  formCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SIZES.paddingXL,
    paddingTop: 28,
  },
  formTitle: {
    fontSize: SIZES.xxl, fontWeight: '700', color: COLORS.textPrimary,
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary,
    marginBottom: 8, marginTop: 12,
  },
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
  forgotRow: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 4 },
  forgotText: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '600' },

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
    flexDirection: 'row', alignItems: 'center', marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.divider },
  dividerText: { fontSize: SIZES.sm, color: COLORS.textTertiary, marginHorizontal: 12, fontWeight: '500' },

  registerBtn: {
    alignItems: 'center', paddingVertical: 14,
    backgroundColor: COLORS.primaryLight,
    borderRadius: SIZES.radius,
  },
  registerText: { fontSize: SIZES.md, color: COLORS.textSecondary },
  registerBold: { color: COLORS.primary, fontWeight: '700' },
});
