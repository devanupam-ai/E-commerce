import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';

export default function OrderSuccessScreen({ navigation, route }) {
  const { order } = route.params;
  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50 }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.successIcon, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.checkmark}>✓</Text>
      </Animated.View>

      <Text style={styles.title}>Order Placed!</Text>
      <Text style={styles.orderNum}>#{order.orderNumber}</Text>
      <Text style={styles.subtitle}>Your order has been placed successfully</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Total Amount</Text>
          <Text style={styles.value}>₹{order.totalAmount}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment</Text>
          <Text style={styles.value}>{order.paymentType}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Delivery OTP</Text>
          <Text style={[styles.value, styles.otp]}>{order.deliveryOtp}</Text>
        </View>
        <Text style={styles.otpNote}>Share this OTP with delivery partner to confirm delivery</Text>
      </View>

      <TouchableOpacity style={styles.trackBtn} onPress={() => navigation.navigate('Orders')}>
        <Text style={styles.trackBtnText}>Track Order</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.replace('Main')}>
        <Text style={styles.homeBtnText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  checkmark: { fontSize: 50, color: COLORS.white, fontWeight: 'bold' },
  title: { fontSize: SIZES.xxxl, fontWeight: 'bold', color: COLORS.black },
  orderNum: { fontSize: SIZES.md, color: COLORS.gray, marginTop: 4 },
  subtitle: { fontSize: SIZES.md, color: COLORS.gray, marginTop: 8, marginBottom: 24, textAlign: 'center' },
  card: {
    width: '100%', backgroundColor: COLORS.background, borderRadius: SIZES.radius,
    padding: SIZES.padding, marginBottom: 24,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: SIZES.md, color: COLORS.gray },
  value: { fontSize: SIZES.md, fontWeight: 'bold', color: COLORS.black },
  otp: { fontSize: SIZES.xl, color: COLORS.primary, letterSpacing: 4 },
  otpNote: { fontSize: SIZES.xs, color: COLORS.gray, textAlign: 'center', marginTop: 4 },
  trackBtn: {
    width: '100%', backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
    padding: 16, alignItems: 'center', marginBottom: 12,
  },
  trackBtnText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: 'bold' },
  homeBtn: {
    width: '100%', borderWidth: 1.5, borderColor: COLORS.primary,
    borderRadius: SIZES.radius, padding: 16, alignItems: 'center',
  },
  homeBtnText: { color: COLORS.primary, fontSize: SIZES.lg, fontWeight: 'bold' },
});
