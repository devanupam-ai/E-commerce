import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';

export default function DeliverySuccessScreen({ navigation, route }) {
  const { order } = route.params;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50 }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.successIcon, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.checkmark}>✓</Text>
      </Animated.View>

      <Text style={styles.title}>Delivered!</Text>
      <Text style={styles.orderNum}>#{order.orderNumber}</Text>
      <Text style={styles.subtitle}>Order delivered successfully</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Customer</Text>
          <Text style={styles.value}>{order.customer?.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.value}>₹{order.totalAmount}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment</Text>
          <Text style={styles.value}>{order.paymentType}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.replace('Home')}>
        <Text style={styles.homeBtnText}>Back to Orders</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.success,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  checkmark: { fontSize: 50, color: COLORS.white, fontWeight: 'bold' },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.black },
  orderNum: { fontSize: SIZES.md, color: COLORS.gray, marginTop: 4 },
  subtitle: { fontSize: SIZES.md, color: COLORS.gray, marginTop: 8, marginBottom: 24 },
  card: {
    width: '100%', backgroundColor: COLORS.background, borderRadius: SIZES.radius,
    padding: SIZES.padding, marginBottom: 24,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: SIZES.md, color: COLORS.gray },
  value: { fontSize: SIZES.md, fontWeight: 'bold', color: COLORS.black },
  homeBtn: {
    width: '100%', backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
    padding: 16, alignItems: 'center',
  },
  homeBtnText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: 'bold' },
});
