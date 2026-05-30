import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput
} from 'react-native';
import { adminOrderAPI } from '../api';
import { COLORS, SIZES } from '../utils/theme';

const STATUS_FILTERS = ['ALL', 'PLACED', 'CONFIRMED', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const getStatusColor = (status) => {
  const map = {
    PLACED: '#F59E0B', CONFIRMED: '#3B82F6', ASSIGNED: '#8B5CF6',
    PICKED_UP: '#F97316', OUT_FOR_DELIVERY: '#06B6D4',
    DELIVERED: '#10B981', CANCELLED: '#EF4444',
  };
  return map[status] || '#6B7280';
};

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    let result = orders;
    if (activeFilter !== 'ALL') result = result.filter(o => o.orderStatus === activeFilter);
    if (search) result = result.filter(o =>
      o.orderNumber.includes(search) || o.customer?.name?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [orders, activeFilter, search]);

  const loadOrders = async () => {
    const res = await adminOrderAPI.getAllOrders();
    setOrders(res.data);
    setFiltered(res.data);
    setLoading(false);
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { order: item })}
    >
      <View style={styles.orderTop}>
        <View>
          <Text style={styles.orderNum}>#{item.orderNumber}</Text>
          <Text style={styles.customerName}>{item.customer?.name} • {item.customer?.phone}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.orderStatus) }]}>
            {item.orderStatus?.replace('_', ' ')}
          </Text>
        </View>
      </View>
      <View style={styles.orderMid}>
        <Text style={styles.itemsText}>{item.items?.length || 0} items</Text>
        <Text style={styles.paymentText}>{item.paymentType}</Text>
        <Text style={styles.shippingText}>{item.shippingType}</Text>
      </View>
      <View style={styles.orderBottom}>
        <Text style={styles.amount}>₹{item.totalAmount}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      {!item.deliveryBoy && item.orderStatus === 'PLACED' && (
        <View style={styles.assignAlert}>
          <Text style={styles.assignAlertText}>⚠️ Needs delivery assignment</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Orders ({filtered.length})</Text>
        <TouchableOpacity onPress={loadOrders}><Text style={{ fontSize: 22 }}>🔄</Text></TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search by order # or customer..."
        placeholderTextColor={COLORS.gray}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        horizontal data={STATUS_FILTERS} keyExtractor={i => i}
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
            onPress={() => setActiveFilter(item)}
          >
            <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: SIZES.padding }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SIZES.padding, backgroundColor: COLORS.primary,
  },
  headerTitle: { fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.white },
  search: {
    margin: SIZES.padding, backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    padding: 12, fontSize: SIZES.md, color: COLORS.black, elevation: 1,
  },
  filters: { paddingHorizontal: SIZES.padding, marginBottom: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: COLORS.white, marginRight: 8, borderWidth: 1, borderColor: COLORS.lightGray,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: SIZES.xs, color: COLORS.black },
  filterTextActive: { color: COLORS.white, fontWeight: 'bold' },
  orderCard: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    padding: SIZES.padding, marginBottom: 10, elevation: 1,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderNum: { fontSize: SIZES.md, fontWeight: 'bold', color: COLORS.black },
  customerName: { fontSize: SIZES.sm, color: COLORS.gray, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: SIZES.xs, fontWeight: 'bold' },
  orderMid: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  itemsText: { fontSize: SIZES.sm, color: COLORS.gray },
  paymentText: { fontSize: SIZES.sm, color: COLORS.info },
  shippingText: { fontSize: SIZES.sm, color: COLORS.accent },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  amount: { fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.primary },
  date: { fontSize: SIZES.xs, color: COLORS.gray },
  assignAlert: { backgroundColor: '#FFF3CD', padding: 8, borderRadius: 6, marginTop: 8 },
  assignAlertText: { fontSize: SIZES.xs, color: '#856404' },
});
