import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { orderAPI, cartAPI } from '../api';
import { useCartStore } from '../store';
import { COLORS, SIZES } from '../utils/theme';

const STATUS_COLORS = {
  PLACED: '#F59E0B', CONFIRMED: '#3B82F6', ASSIGNED: '#8B5CF6',
  PICKED_UP: '#F97316', OUT_FOR_DELIVERY: '#06B6D4',
  DELIVERED: '#10B981', CANCELLED: '#EF4444',
};
const STATUS_ICONS = {
  PLACED: '📋', CONFIRMED: '✅', ASSIGNED: '🚴',
  PICKED_UP: '📦', OUT_FOR_DELIVERY: '🚚', DELIVERED: '🎉', CANCELLED: '❌',
};

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem, clearCart } = useCartStore();

  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const res = await orderAPI.getMyOrders();
      setOrders(res.data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Refresh when screen gains focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadOrders();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleReorder = useCallback((order) => {
    Alert.alert(
      'Reorder',
      `Add ${order.items?.length} item(s) from order #${order.orderNumber} to cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add to Cart',
          onPress: async () => {
            try {
              await cartAPI.clearCart();
              clearCart();
              for (const item of order.items || []) {
                const product = {
                  id: item.productId,
                  name: item.productName,
                  sellingPrice: item.unitPrice,
                  price: item.unitPrice,
                  stockQuantity: 99,
                };
                addItem(product);
                await cartAPI.addToCart(item.productId, item.quantity);
              }
              navigation.navigate('Cart');
            } catch {
              Alert.alert('Error', 'Failed to reorder. Some items may be unavailable.');
            }
          },
        },
      ]
    );
  }, [addItem, clearCart, navigation]);

  const renderOrder = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNum}>#{item.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.orderStatus] + '20' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.orderStatus] }]}>
            {STATUS_ICONS[item.orderStatus]} {item.orderStatus?.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      {item.items?.slice(0, 2).map(i => (
        <Text key={i.id} style={styles.itemLine}>• {i.productName} × {i.quantity}</Text>
      ))}
      {item.items?.length > 2 && (
        <Text style={styles.itemLine}>+{item.items.length - 2} more items</Text>
      )}

      <View style={styles.orderFooter}>
        <Text style={styles.amount}>₹{item.totalAmount}</Text>
        <Text style={styles.payment}>{item.paymentType}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>

      {item.orderStatus !== 'DELIVERED' && item.orderStatus !== 'CANCELLED' && (
        <View style={styles.otpBox}>
          <Text style={styles.otpLabel}>Delivery OTP: </Text>
          <Text style={styles.otpValue}>{item.deliveryOtp}</Text>
        </View>
      )}

      {(item.orderStatus === 'DELIVERED' || item.orderStatus === 'CANCELLED') && (
        <TouchableOpacity style={styles.reorderBtn} onPress={() => handleReorder(item)}>
          <Text style={styles.reorderBtnText}>🔄 Reorder</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  ), [handleReorder]);

  if (loading) return <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 My Orders</Text>
      </View>
      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 60 }}>📦</Text>
          <Text style={styles.emptyText}>No orders yet</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: SIZES.padding }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    padding: SIZES.padding, backgroundColor: COLORS.primary, paddingBottom: 14,
  },
  headerTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.textInverse },
  orderCard: {
    backgroundColor: COLORS.card, borderRadius: SIZES.radiusXL,
    padding: SIZES.padding, marginBottom: 12, ...SIZES.shadow.small,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderNum: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  statusText: { fontSize: SIZES.xs, fontWeight: '700' },
  itemLine: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 3 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.divider },
  amount: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.primary },
  payment: { fontSize: SIZES.sm, color: COLORS.textTertiary },
  date: { fontSize: SIZES.sm, color: COLORS.textTertiary },
  otpBox: {
    flexDirection: 'row', alignItems: 'center', marginTop: 10,
    backgroundColor: COLORS.warningLight, padding: 12, borderRadius: SIZES.radius,
  },
  otpLabel: { fontSize: SIZES.sm, color: COLORS.textPrimary },
  otpValue: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.primary, letterSpacing: 4 },
  reorderBtn: {
    marginTop: 10, borderWidth: 1.5, borderColor: COLORS.primary,
    borderRadius: SIZES.radius, padding: 12, alignItems: 'center',
    backgroundColor: COLORS.primaryLighter,
  },
  reorderBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: SIZES.sm },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: COLORS.background },
  emptyText: { fontSize: SIZES.lg, color: COLORS.textTertiary, marginTop: 12, marginBottom: 24 },
  shopBtn: {
    height: SIZES.buttonHeight, backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
    paddingHorizontal: 32, justifyContent: 'center', ...SIZES.shadow.medium,
  },
  shopBtnText: { color: COLORS.textInverse, fontWeight: '700', fontSize: SIZES.md },
});
