import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Image
} from 'react-native';
import { useCartStore } from '../store';
import { COLORS, SIZES } from '../utils/theme';

const CartItem = ({ item, onDecrement, onIncrement }) => {
  const price = parseFloat(item.product.sellingPrice || item.product.price) || 0;
  const lineTotal = (price * item.quantity).toFixed(2);
  return (
    <View style={styles.item}>
      <View style={styles.itemImage}>
        <Text style={{ fontSize: 36 }}>{item.product.category?.emoji || '🛍️'}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.product.name}</Text>
        <Text style={styles.itemUnit}>{item.product.unit}</Text>
        <Text style={styles.itemPrice}>₹{price} × {item.quantity}</Text>
      </View>
      <View style={styles.qtyControl}>
        <TouchableOpacity onPress={onDecrement} style={styles.qtyBtn}>
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity onPress={onIncrement} style={styles.qtyBtn}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.totalPrice}>₹{lineTotal}</Text>
    </View>
  );
};

export default function CartScreen({ navigation }) {
  const { items, getSubtotal, getTotalItems, updateQty } = useCartStore();
  const subtotal = getSubtotal();
  const deliveryCharge = subtotal >= 200 ? 0 : 30;
  const total = subtotal + deliveryCharge;

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleCheckout = useCallback(() => navigation.navigate('Checkout'), [navigation]);
  const makeDecrement = useCallback((id, qty) => () => updateQty(id, qty - 1), [updateQty]);
  const makeIncrement = useCallback((id, qty) => () => updateQty(id, qty + 1), [updateQty]);

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add items to get started</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={handleGoBack}>
          <Text style={styles.shopBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart ({getTotalItems()} items)</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.product.id.toString()}
        renderItem={({ item }) => (
          <CartItem
            item={item}
            onDecrement={makeDecrement(item.product.id, item.quantity)}
            onIncrement={makeIncrement(item.product.id, item.quantity)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 200 }}
      />

      {/* Bill Summary */}
      <View style={styles.billCard}>
        <Text style={styles.billTitle}>Bill Details</Text>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Item Total</Text>
          <Text style={styles.billValue}>₹{subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Delivery Charge</Text>
          <Text style={[styles.billValue, deliveryCharge === 0 && { color: COLORS.success }]}>
            {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
          </Text>
        </View>
        {deliveryCharge === 0 && (
          <Text style={styles.freeDeliveryNote}>🎉 Free delivery on orders above ₹200</Text>
        )}
        <View style={[styles.billRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>To Pay</Text>
          <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: SIZES.padding,
    backgroundColor: COLORS.primary, paddingBottom: 14,
  },
  backBtn: { fontSize: 24, marginRight: 12, color: COLORS.textInverse },
  headerTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.textInverse },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    margin: 6, marginHorizontal: SIZES.padding, borderRadius: SIZES.radiusXL,
    padding: 14, ...SIZES.shadow.small,
  },
  itemImage: {
    width: 64, height: 64, backgroundColor: COLORS.background,
    borderRadius: SIZES.radius, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
  itemUnit: { fontSize: SIZES.xs, color: COLORS.textTertiary },
  itemPrice: { fontSize: SIZES.sm, color: COLORS.primary, fontWeight: '700', marginTop: 4 },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primary, borderRadius: 8, marginHorizontal: 8,
  },
  qtyBtn: { padding: 8 },
  qtyBtnText: { color: COLORS.textInverse, fontSize: SIZES.lg, fontWeight: 'bold' },
  qtyText: { color: COLORS.textInverse, fontWeight: 'bold', minWidth: 24, textAlign: 'center' },
  totalPrice: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.textPrimary, minWidth: 60, textAlign: 'right' },
  billCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SIZES.paddingXL, ...SIZES.shadow.large,
  },
  billTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel: { fontSize: SIZES.md, color: COLORS.textSecondary },
  billValue: { fontSize: SIZES.md, color: COLORS.textPrimary },
  freeDeliveryNote: { fontSize: SIZES.xs, color: COLORS.success, marginBottom: 8, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  totalValue: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.primary },
  checkoutBtn: {
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
    justifyContent: 'center', alignItems: 'center', marginTop: 12,
    ...SIZES.shadow.medium,
  },
  checkoutBtnText: { color: COLORS.textInverse, fontSize: SIZES.lg, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: COLORS.background },
  emptyEmoji: { fontSize: 80, marginBottom: 16 },
  emptyTitle: { fontSize: SIZES.xl, fontWeight: '700', color: COLORS.textPrimary },
  emptySubtitle: { fontSize: SIZES.md, color: COLORS.textTertiary, marginTop: 8 },
  shopBtn: {
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
    paddingHorizontal: 32, justifyContent: 'center', marginTop: 24,
    ...SIZES.shadow.medium,
  },
  shopBtnText: { color: COLORS.textInverse, fontWeight: '700', fontSize: SIZES.md },
});
