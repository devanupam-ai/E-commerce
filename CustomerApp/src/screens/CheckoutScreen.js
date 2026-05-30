import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, TextInput, Modal
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { addressAPI, orderAPI, cartAPI, couponAPI } from '../api';
import { useCartStore, useAuthStore } from '../store';
import { COLORS, SIZES } from '../utils/theme';

const PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI', icon: '📱', desc: 'Google Pay, PhonePe, Paytm' },
  { id: 'NET_BANKING', label: 'Net Banking', icon: '🏦', desc: 'All major banks' },
  { id: 'CREDIT_CARD', label: 'Credit/Debit Card', icon: '💳', desc: 'Visa, Mastercard, RuPay' },
  { id: 'COD', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when delivered' },
];

const SHIPPING_TYPES = [
  { id: 'INSTANT', label: '10 min delivery', icon: '⚡' },
  { id: 'EXPRESS', label: '30 min delivery', icon: '🚀' },
  { id: 'STANDARD', label: '2 hour delivery', icon: '📦' },
];

const LABELS = ['Home', 'Work', 'Other'];

const EMPTY_FORM = { label: 'Home', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' };

export default function CheckoutScreen({ navigation }) {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [shippingType, setShippingType] = useState('INSTANT');
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null); // null = add, object = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const { coupon, setCoupon } = useCartStore();

  const clearCart = useCartStore(s => s.clearCart);
  const cartItems = useCartStore(s => s.items);
  const userLocation = useCartStore(s => s.location);
  const user = useAuthStore(s => s.user);

  // Sync local cart to backend DB before placing order
  const syncCartToBackend = async () => {
    await cartAPI.clearCart();
    for (const item of cartItems) {
      await cartAPI.addToCart(item.product.id, item.quantity);
    }
  };

  const handleGoBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleOpenEdit = useCallback((addr) => () => openEdit(addr), []);
  const handleDeleteAddr = useCallback((addr) => () => handleDeleteAddress(addr), []);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const [addrRes, billRes] = await Promise.all([
        addressAPI.getAddresses(),
        orderAPI.getBillSummary(),
      ]);
      setAddresses(addrRes.data || []);
      setBill(billRes.data);
      if (addrRes.data?.length > 0 && !selectedAddress)
        setSelectedAddress(addrRes.data[0]);
    } catch (e) {
      Alert.alert('Error', 'Failed to load checkout data. Please try again.');
    } finally { setDataLoading(false); }
  };

  // Open modal for ADD
  const openAdd = () => {
    setEditingAddress(null);
    setForm(EMPTY_FORM);
    setShowAddressModal(true);
  };

  // Open modal for EDIT
  const openEdit = (addr) => {
    setEditingAddress(addr);
    setForm({
      label: addr.label || 'Home',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async () => {
    if (!form.addressLine1.trim() || !form.city.trim() || !form.pincode.trim())
      return Alert.alert('Missing Fields', 'Address, City and Pincode are required.');
    if (form.pincode.length !== 6)
      return Alert.alert('Invalid Pincode', 'Pincode must be 6 digits.');

    setSaving(true);
    try {
      if (editingAddress) {
        // EDIT existing
        const res = await addressAPI.updateAddress(editingAddress.id, form);
        setAddresses(prev => prev.map(a => a.id === editingAddress.id ? res.data : a));
        if (selectedAddress?.id === editingAddress.id) setSelectedAddress(res.data);
        Alert.alert('Updated', 'Address updated successfully.');
      } else {
        // ADD new
        const res = await addressAPI.addAddress(form);
        setAddresses(prev => [...prev, res.data]);
        setSelectedAddress(res.data);
      }
      setShowAddressModal(false);
    } catch {
      Alert.alert('Error', 'Failed to save address. Please try again.');
    } finally { setSaving(false); }
  };

  const handleDeleteAddress = (addr) => {
    Alert.alert(
      'Delete Address',
      `Remove "${addr.label}" address?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await addressAPI.deleteAddress(addr.id);
            const updated = addresses.filter(a => a.id !== addr.id);
            setAddresses(updated);
            if (selectedAddress?.id === addr.id)
              setSelectedAddress(updated.length > 0 ? updated[0] : null);
          },
        },
      ]
    );
  };

  // Coupon function
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert('Error', 'Enter a coupon code');
      return;
    }

    const subtotal = bill?.subtotal || 0;
    try {
      setLoading(true);
      const res = await couponAPI.validateCoupon(couponCode, subtotal);
      if (res.data.valid) {
        setAppliedCoupon(res.data.coupon);
        let discount = 0;
        if (res.data.coupon.discountType === 'PERCENTAGE') {
          discount = (res.data.coupon.discountValue * subtotal) / 100;
          if (res.data.coupon.maxDiscount) {
            discount = Math.min(discount, res.data.coupon.maxDiscount);
          }
        } else {
          discount = res.data.coupon.discountValue;
        }
        setCouponDiscount(discount);
        setCoupon(res.data.coupon);
        Alert.alert('Success', `Coupon applied! Discount: ₹${discount.toFixed(2)}`);
      } else {
        Alert.alert('Invalid', res.data.message || 'Coupon is invalid or expired');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to apply coupon');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress)
      return Alert.alert('No Address', 'Please add a delivery address first.');
    if (cartItems.length === 0)
      return Alert.alert('Empty Cart', 'Add items to cart before placing order.');
    setLoading(true);
    try {
      // Always sync local cart → backend DB before placing order
      await syncCartToBackend();

      const locationPayload = {
        customerLatitude: userLocation?.lat,
        customerLongitude: userLocation?.lng,
      };

      if (paymentMethod === 'COD') {
        const res = await orderAPI.placeOrder({
          addressId: selectedAddress.id,
          paymentType: 'COD',
          shippingType,
          couponCode: appliedCoupon?.code,
          ...locationPayload,
        });
        clearCart();
        navigation.replace('OrderSuccess', { order: res.data });
        return;
      }

      const paymentOrderRes = await orderAPI.createPaymentOrder({
        addressId: selectedAddress.id,
        paymentType: paymentMethod,
        shippingType,
        couponCode: appliedCoupon?.code,
      });
      const { razorpayOrderId, amount, keyId } = paymentOrderRes.data;

      const paymentData = await RazorpayCheckout.open({
        description: 'Order Payment',
        currency: 'INR',
        key: keyId,
        amount: (amount * 100).toString(),
        order_id: razorpayOrderId,
        name: 'QuickCommerce',
        prefill: { email: user?.email, contact: user?.phone, name: user?.name },
        theme: { color: COLORS.primary },
      });

      const res = await orderAPI.placeOrder({
        addressId: selectedAddress.id,
        paymentType: paymentMethod,
        shippingType,
        couponCode: appliedCoupon?.code,
        razorpayOrderId: paymentData.razorpay_order_id,
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpaySignature: paymentData.razorpay_signature,
        ...locationPayload,
      });
      clearCart();
      navigation.replace('OrderSuccess', { order: res.data });
    } catch (e) {
      if (e.code === 'PAYMENT_CANCELLED') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment.');
      } else {
        Alert.alert('Order Failed', e.response?.data?.message || e.message || 'Something went wrong.');
      }
    } finally { setLoading(false); }
  };

  if (dataLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const subtotal = bill?.subtotal || 0;
  const totalAmount = (bill?.totalAmount || 0) - couponDiscount;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── DELIVERY ADDRESS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Delivery Address</Text>

          {addresses.length === 0 ? (
            // Empty state — first time user
            <View style={styles.emptyAddress}>
              <Text style={styles.emptyAddressIcon}>🏠</Text>
              <Text style={styles.emptyAddressTitle}>No saved address</Text>
              <Text style={styles.emptyAddressSubtitle}>Add your delivery address to continue</Text>
              <TouchableOpacity style={styles.addFirstBtn} onPress={openAdd}>
                <Text style={styles.addFirstBtnText}>+ Add Delivery Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {addresses.map(addr => (
                <View key={addr.id} style={[styles.addressCard, selectedAddress?.id === addr.id && styles.selectedCard]}>
                  <TouchableOpacity style={styles.radioRow} onPress={() => setSelectedAddress(addr)}>
                    <View style={[styles.radio, selectedAddress?.id === addr.id && styles.radioSelected]} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.addressLabelRow}>
                        <View style={styles.labelBadge}>
                          <Text style={styles.labelBadgeText}>
                            {addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : '📌'} {addr.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.addressText}>{addr.addressLine1}</Text>
                      {addr.addressLine2 ? <Text style={styles.addressText}>{addr.addressLine2}</Text> : null}
                      <Text style={styles.addressText}>{addr.city}, {addr.state} - {addr.pincode}</Text>
                    </View>
                  </TouchableOpacity>
                  {/* Edit / Delete actions */}
                  <View style={styles.addressActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={handleOpenEdit(addr)}>
                      <Text style={styles.editBtnText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAddr(addr)}>
                      <Text style={styles.deleteBtnText}>🗑 Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.addAddressBtn} onPress={openAdd}>
                <Text style={styles.addAddressText}>+ Add New Address</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── COUPON SECTION ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎟️ Apply Coupon</Text>
          <View style={styles.couponInput}>
            <TextInput
              style={styles.input}
              placeholder="Enter promo code"
              value={couponCode}
              onChangeText={setCouponCode}
              editable={!appliedCoupon}
            />
            <TouchableOpacity
              style={[styles.applyBtn, appliedCoupon && styles.appliedBtn]}
              onPress={applyCoupon}
              disabled={appliedCoupon || loading}>
              <Text style={styles.applyBtnText}>
                {appliedCoupon ? '✅ Applied' : 'Apply'}
              </Text>
            </TouchableOpacity>
          </View>
          {appliedCoupon && (
            <View style={styles.appliedCouponCard}>
              <Text style={styles.appliedCouponText}>
                {appliedCoupon.code} - Discount: ₹{couponDiscount.toFixed(2)}
              </Text>
              <TouchableOpacity onPress={() => {
                setAppliedCoupon(null);
                setCouponCode('');
                setCouponDiscount(0);
                setCoupon(null);
              }}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── DELIVERY SPEED ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚚 Delivery Speed</Text>
          {SHIPPING_TYPES.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[styles.optionCard, shippingType === type.id && styles.selectedCard]}
              onPress={() => setShippingType(type.id)}
            >
              <View style={styles.radioRow}>
                <View style={[styles.radio, shippingType === type.id && styles.radioSelected]} />
                <Text style={styles.optionIcon}>{type.icon}</Text>
                <Text style={styles.optionLabel}>{type.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── PAYMENT METHOD ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Payment Method</Text>
          {PAYMENT_METHODS.map(method => (
            <TouchableOpacity
              key={method.id}
              style={[styles.optionCard, paymentMethod === method.id && styles.selectedCard]}
              onPress={() => setPaymentMethod(method.id)}
            >
              <View style={styles.radioRow}>
                <View style={[styles.radio, paymentMethod === method.id && styles.radioSelected]} />
                <Text style={styles.optionIcon}>{method.icon}</Text>
                <View>
                  <Text style={styles.optionLabel}>{method.label}</Text>
                  <Text style={styles.optionDesc}>{method.desc}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── BILL SUMMARY ── */}
        {bill && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🧾 Bill Summary</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total ({bill.itemCount} items)</Text>
              <Text style={styles.billValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            {couponDiscount > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Discount</Text>
                <Text style={[styles.billValue, { color: '#10B981' }]}>-₹{couponDiscount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Charge</Text>
              <Text style={[styles.billValue, bill.deliveryCharge === 0 && { color: COLORS.success }]}>
                {bill.deliveryCharge === 0 ? 'FREE' : `₹${bill.deliveryCharge}`}
              </Text>
            </View>
            <View style={[styles.billRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Place Order Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, (!selectedAddress || loading) && styles.placeOrderBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading || !selectedAddress}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.placeOrderText}>
                {selectedAddress ? `Place Order • ₹${totalAmount.toFixed(2)}` : 'Add Address to Continue'}
              </Text>
          }
        </TouchableOpacity>
      </View>

      {/* ── ADD / EDIT ADDRESS MODAL ── */}
      <Modal visible={showAddressModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddress ? '✏️ Edit Address' : '🏠 Add New Address'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Text style={{ fontSize: 22, color: COLORS.gray }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Label Picker */}
            <Text style={styles.fieldLabel}>Address Type</Text>
            <View style={styles.labelRow}>
              {LABELS.map(l => (
                <TouchableOpacity
                  key={l}
                  style={[styles.labelChip, form.label === l && styles.labelChipSelected]}
                  onPress={() => setForm(p => ({ ...p, label: l }))}
                >
                  <Text style={[styles.labelChipText, form.label === l && styles.labelChipTextSelected]}>
                    {l === 'Home' ? '🏠 Home' : l === 'Work' ? '💼 Work' : '📌 Other'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Fields */}
            {[
              { key: 'addressLine1', placeholder: 'House No, Street, Area *', required: true },
              { key: 'addressLine2', placeholder: 'Landmark (optional)' },
              { key: 'city', placeholder: 'City *', required: true },
              { key: 'state', placeholder: 'State *', required: true },
              { key: 'pincode', placeholder: 'Pincode *', keyboard: 'numeric', maxLength: 6, required: true },
            ].map(f => (
              <TextInput
                key={f.key}
                style={[styles.input, f.required && !form[f.key] && styles.inputError]}
                placeholder={f.placeholder}
                placeholderTextColor={COLORS.gray}
                value={form[f.key]}
                onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                keyboardType={f.keyboard || 'default'}
                maxLength={f.maxLength}
              />
            ))}

            <TouchableOpacity
              style={[styles.placeOrderBtn, saving && styles.placeOrderBtnDisabled]}
              onPress={handleSaveAddress}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.placeOrderText}>
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: SIZES.padding,
    backgroundColor: COLORS.white, elevation: 2,
  },
  backBtn: { fontSize: 24, marginRight: 12, color: COLORS.black },
  headerTitle: { fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.black },
  section: {
    backgroundColor: COLORS.white, margin: 8, borderRadius: SIZES.radius,
    padding: SIZES.padding, elevation: 1,
  },
  sectionTitle: { fontSize: SIZES.md, fontWeight: 'bold', color: COLORS.black, marginBottom: 12 },

  // Empty address state
  emptyAddress: { alignItems: 'center', paddingVertical: 24 },
  emptyAddressIcon: { fontSize: 52, marginBottom: 8 },
  emptyAddressTitle: { fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.black },
  emptyAddressSubtitle: { fontSize: SIZES.sm, color: COLORS.gray, marginTop: 4, marginBottom: 20, textAlign: 'center' },
  addFirstBtn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
    paddingVertical: 12, paddingHorizontal: 32,
  },
  addFirstBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: SIZES.md },

  // Address card
  addressCard: {
    borderWidth: 1.5, borderColor: COLORS.lightGray, borderRadius: 10,
    padding: 12, marginBottom: 10,
  },
  selectedCard: { borderColor: COLORS.primary, backgroundColor: '#F5F3FF' },
  radioRow: { flexDirection: 'row', alignItems: 'flex-start' },
  radio: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
    borderColor: COLORS.gray, marginRight: 10, marginTop: 2,
  },
  radioSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  addressLabelRow: { flexDirection: 'row', marginBottom: 4 },
  labelBadge: {
    backgroundColor: COLORS.background, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  labelBadgeText: { fontSize: 12, fontWeight: 'bold', color: COLORS.primary },
  addressText: { fontSize: SIZES.sm, color: COLORS.black, marginTop: 1 },
  addressActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
  editBtn: {
    borderWidth: 1, borderColor: COLORS.primary, borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  editBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  deleteBtn: {
    borderWidth: 1, borderColor: '#EF4444', borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  deleteBtnText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  addAddressBtn: {
    padding: 12, alignItems: 'center', borderWidth: 1.5,
    borderColor: COLORS.primary, borderRadius: 8, borderStyle: 'dashed', marginTop: 4,
  },
  addAddressText: { color: COLORS.primary, fontWeight: 'bold' },

  // Coupon styles
  couponInput: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: {
    flex: 1, borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: SIZES.radius,
    padding: 12, fontSize: SIZES.md, backgroundColor: COLORS.background,
  },
  applyBtn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
    paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center',
  },
  appliedBtn: { backgroundColor: '#10B981' },
  applyBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: SIZES.sm },
  appliedCouponCard: {
    backgroundColor: '#F0FDF4', borderRadius: 8, padding: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  appliedCouponText: { fontSize: SIZES.sm, color: '#059669', fontWeight: '600' },
  removeText: { color: '#DC2626', fontSize: SIZES.sm, fontWeight: '600' },

  // Options
  optionCard: {
    borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 8,
    padding: 12, marginBottom: 8,
  },
  optionIcon: { fontSize: 20, marginRight: 10 },
  optionLabel: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.black },
  optionDesc: { fontSize: SIZES.xs, color: COLORS.gray },

  // Bill
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel: { fontSize: SIZES.md, color: COLORS.gray },
  billValue: { fontSize: SIZES.md, color: COLORS.black },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.lightGray, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.black },
  totalValue: { fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.primary },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, padding: SIZES.padding, elevation: 10,
  },
  placeOrderBtn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
    padding: 16, alignItems: 'center',
  },
  placeOrderBtnDisabled: { backgroundColor: COLORS.gray },
  placeOrderText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: SIZES.padding, paddingBottom: 32,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: SIZES.xl, fontWeight: 'bold', color: COLORS.black },
  fieldLabel: { fontSize: SIZES.sm, color: COLORS.gray, fontWeight: '600', marginBottom: 8 },
  labelRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  labelChip: {
    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.lightGray, backgroundColor: COLORS.background,
  },
  labelChipSelected: { borderColor: COLORS.primary, backgroundColor: '#F5F3FF' },
  labelChipText: { fontSize: SIZES.sm, color: COLORS.gray, fontWeight: '600' },
  labelChipTextSelected: { color: COLORS.primary },
  inputError: { borderColor: '#FCA5A5' },
});