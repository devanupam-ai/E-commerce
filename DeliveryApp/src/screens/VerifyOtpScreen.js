import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Animated
} from 'react-native';
import { deliveryOrderAPI } from '../api';
import { COLORS, SIZES } from '../utils/theme';

export default function VerifyOtpScreen({ navigation, route }) {
  const { order } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
    if (!value && index > 0) inputs.current[index - 1]?.focus();
  };

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) return Alert.alert('Error', 'Enter 6-digit OTP');

    setLoading(true);
    try {
      await deliveryOrderAPI.verifyOtp(order.id, otpString);
      navigation.replace('DeliverySuccess', { order });
    } catch (e) {
      shakeError();
      Alert.alert('Invalid OTP', 'The OTP entered is incorrect. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Delivery OTP</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>
          Ask the customer for the 6-digit OTP to confirm delivery
        </Text>

        <View style={styles.orderInfo}>
          <Text style={styles.orderNum}>Order #{order.orderNumber}</Text>
          <Text style={styles.customerName}>{order.customer?.name}</Text>
        </View>

        <Animated.View style={[styles.otpContainer, { transform: [{ translateX: shakeAnim }] }]}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => inputs.current[index] = ref}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={v => handleOtpChange(v.replace(/[^0-9]/g, ''), index)}
              keyboardType="numeric"
              maxLength={1}
              textAlign="center"
            />
          ))}
        </Animated.View>

        <TouchableOpacity
          style={[styles.verifyBtn, otp.join('').length !== 6 && styles.verifyBtnDisabled]}
          onPress={handleVerify}
          disabled={loading || otp.join('').length !== 6}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.verifyBtnText}>✅ Confirm Delivery</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: SIZES.padding,
    backgroundColor: COLORS.primary,
  },
  backBtn: { fontSize: 24, marginRight: 12, color: COLORS.white },
  headerTitle: { fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.white },
  content: { flex: 1, padding: SIZES.padding, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 80, marginBottom: 16 },
  title: { fontSize: SIZES.xxl, fontWeight: 'bold', color: COLORS.black },
  subtitle: { fontSize: SIZES.md, color: COLORS.gray, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  orderInfo: {
    backgroundColor: COLORS.background, borderRadius: SIZES.radius,
    padding: 16, alignItems: 'center', marginBottom: 32, width: '100%',
  },
  orderNum: { fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.black },
  customerName: { fontSize: SIZES.md, color: COLORS.gray, marginTop: 4 },
  otpContainer: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  otpInput: {
    width: 48, height: 56, borderWidth: 2, borderColor: COLORS.lightGray,
    borderRadius: 12, fontSize: SIZES.xl, fontWeight: 'bold', color: COLORS.black,
    backgroundColor: COLORS.background,
  },
  otpInputFilled: { borderColor: COLORS.primary, backgroundColor: '#F0FFF4' },
  verifyBtn: {
    backgroundColor: COLORS.success, borderRadius: SIZES.radius,
    padding: 16, alignItems: 'center', width: '100%',
  },
  verifyBtnDisabled: { backgroundColor: COLORS.lightGray },
  verifyBtnText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: 'bold' },
});
