import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Modal, FlatList, ActivityIndicator
} from 'react-native';
import { adminOrderAPI, adminAPI } from '../api';
import { COLORS, SIZES } from '../utils/theme';

export default function OrderDetailScreen({ navigation, route }) {
  const [order, setOrder] = useState(route.params.order);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    adminAPI.getDeliveryBoys().then(res => setDeliveryBoys(res.data));
  }, []);

  const handleAssign = async (deliveryBoyId) => {
    setAssigning(true);
    try {
      const res = await adminOrderAPI.assignDelivery(order.id, deliveryBoyId);
      setOrder(res.data);
      setShowAssignModal(false);
      Alert.alert('Success', 'Delivery boy assigned successfully!');
    } catch (e) {
      Alert.alert('Error', 'Assignment failed');
    } finally { setAssigning(false); }
  };

  const InfoRow = ({ label, value, valueStyle }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.orderNumber}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: SIZES.padding }}>
        {/* Order Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Status</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: '#10B98120' }]}>
              <Text style={[styles.statusText, { color: '#10B981' }]}>{order.orderStatus}</Text>
            </View>
            <Text style={styles.dateText}>{new Date(order.createdAt).toLocaleString()}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Customer Information</Text>
          <InfoRow label="Name" value={order.customer?.name} />
          <InfoRow label="Phone" value={order.customer?.phone} />
          <InfoRow label="Email" value={order.customer?.email} />
        </View>

        {/* Shipping Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Shipping Address</Text>
          <Text style={styles.addressText}>
            {order.address?.addressLine1}{'\n'}
            {order.address?.city}, {order.address?.state} - {order.address?.pincode}
          </Text>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛍️ Order Items</Text>
          {order.items?.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemQty}>Qty: {item.quantity} × ₹{item.unitPrice}</Text>
              </View>
              <Text style={styles.itemTotal}>₹{item.totalPrice}</Text>
            </View>
          ))}
        </View>

        {/* Billing */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧾 Billing Details</Text>
          <InfoRow label="Subtotal" value={`₹${order.subtotal}`} />
          <InfoRow label="Delivery Charge" value={`₹${order.deliveryCharge}`} />
          <InfoRow label="Discount" value={`-₹${order.discount}`} />
          <InfoRow label="Payment Type" value={order.paymentType} />
          <InfoRow label="Shipping Type" value={order.shippingType} />
          <InfoRow label="Payment Status" value={order.paymentStatus}
            valueStyle={{ color: order.paymentStatus === 'SUCCESS' ? COLORS.success : COLORS.danger }} />
          <View style={[styles.infoRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{order.totalAmount}</Text>
          </View>
        </View>

        {/* Delivery Assignment */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚴 Delivery Assignment</Text>
          {order.deliveryBoy ? (
            <>
              <InfoRow label="Assigned To" value={order.deliveryBoy.name} />
              <InfoRow label="Phone" value={order.deliveryBoy.phone} />
              <InfoRow label="OTP" value={order.deliveryOtp} valueStyle={{ color: COLORS.primary, fontWeight: 'bold', letterSpacing: 4 }} />
            </>
          ) : (
            <Text style={styles.unassignedText}>Not yet assigned</Text>
          )}
          {order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED' && (
            <TouchableOpacity style={styles.assignBtn} onPress={() => setShowAssignModal(true)}>
              <Text style={styles.assignBtnText}>
                {order.deliveryBoy ? '🔄 Reassign Delivery Boy' : '+ Assign Delivery Boy'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Assign Modal */}
      <Modal visible={showAssignModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Delivery Boy</Text>
            {assigning ? <ActivityIndicator color={COLORS.primary} /> : (
              <FlatList
                data={deliveryBoys}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.deliveryBoyRow} onPress={() => handleAssign(item.id)}>
                    <Text style={styles.deliveryBoyIcon}>🚴</Text>
                    <View>
                      <Text style={styles.deliveryBoyName}>{item.name}</Text>
                      <Text style={styles.deliveryBoyPhone}>{item.phone}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity onPress={() => setShowAssignModal(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: SIZES.padding,
    backgroundColor: COLORS.primary,
  },
  backBtn: { fontSize: 24, marginRight: 12, color: COLORS.white },
  headerTitle: { fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.white },
  card: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    padding: SIZES.padding, marginBottom: 12, elevation: 1,
  },
  cardTitle: { fontSize: SIZES.md, fontWeight: 'bold', color: COLORS.black, marginBottom: 12 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontWeight: 'bold', fontSize: SIZES.sm },
  dateText: { fontSize: SIZES.xs, color: COLORS.gray },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: SIZES.sm, color: COLORS.gray },
  infoValue: { fontSize: SIZES.sm, color: COLORS.black, fontWeight: '500' },
  addressText: { fontSize: SIZES.sm, color: COLORS.black, lineHeight: 22 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.lightGray,
  },
  itemName: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.black },
  itemQty: { fontSize: SIZES.xs, color: COLORS.gray, marginTop: 2 },
  itemTotal: { fontSize: SIZES.md, fontWeight: 'bold', color: COLORS.primary },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.lightGray, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.black },
  totalValue: { fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.primary },
  unassignedText: { color: COLORS.gray, fontStyle: 'italic', marginBottom: 12 },
  assignBtn: {
    backgroundColor: COLORS.primary, borderRadius: SIZES.radius,
    padding: 12, alignItems: 'center', marginTop: 8,
  },
  assignBtnText: { color: COLORS.white, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: SIZES.padding, maxHeight: '70%',
  },
  modalTitle: { fontSize: SIZES.xl, fontWeight: 'bold', color: COLORS.black, marginBottom: 16 },
  deliveryBoyRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.lightGray,
  },
  deliveryBoyIcon: { fontSize: 32, marginRight: 12 },
  deliveryBoyName: { fontSize: SIZES.md, fontWeight: 'bold', color: COLORS.black },
  deliveryBoyPhone: { fontSize: SIZES.sm, color: COLORS.gray },
  cancelBtn: { padding: 16, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { color: COLORS.gray, fontSize: SIZES.md },
});
