import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { adminOrderAPI } from '../api';
import { COLORS, SIZES } from '../utils/theme';

const StatCard = ({ title, value, icon, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

export default function DashboardScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const res = await adminOrderAPI.getAllOrders();
      setOrders(res.data);
    } finally { setLoading(false); }
  };

  const stats = {
    total: orders.length,
    placed: orders.filter(o => o.orderStatus === 'PLACED').length,
    delivering: orders.filter(o => o.orderStatus === 'OUT_FOR_DELIVERY').length,
    delivered: orders.filter(o => o.orderStatus === 'DELIVERED').length,
    revenue: orders.filter(o => o.paymentStatus === 'SUCCESS')
      .reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0).toFixed(0),
  };

  const recentOrders = orders.slice(0, 5);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity onPress={loadOrders}>
          <Text style={styles.refreshBtn}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
        <StatCard title="Total Orders" value={stats.total} icon="📋" color={COLORS.info} />
        <StatCard title="New Orders" value={stats.placed} icon="🆕" color={COLORS.warning} />
        <StatCard title="Delivering" value={stats.delivering} icon="🚚" color={COLORS.accent} />
        <StatCard title="Delivered" value={stats.delivered} icon="✅" color={COLORS.success} />
        <StatCard title="Revenue" value={`₹${stats.revenue}`} icon="💰" color={COLORS.primary} />
      </ScrollView>

      {/* Recent Orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.viewAll}>View All →</Text>
          </TouchableOpacity>
        </View>
        {loading ? <ActivityIndicator color={COLORS.primary} /> :
          recentOrders.map(order => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderRow}
              onPress={() => navigation.navigate('OrderDetail', { order })}
            >
              <View>
                <Text style={styles.orderNum}>#{order.orderNumber}</Text>
                <Text style={styles.customerName}>{order.customer?.name}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.orderAmount}>₹{order.totalAmount}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.orderStatus) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.orderStatus) }]}>
                    {order.orderStatus}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        }
      </View>
    </ScrollView>
  );
}

const getStatusColor = (status) => {
  const map = {
    PLACED: '#F59E0B', CONFIRMED: '#3B82F6', ASSIGNED: '#8B5CF6',
    PICKED_UP: '#F97316', OUT_FOR_DELIVERY: '#06B6D4',
    DELIVERED: '#10B981', CANCELLED: '#EF4444',
  };
  return map[status] || '#6B7280';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SIZES.padding, backgroundColor: COLORS.primary,
  },
  headerTitle: { fontSize: SIZES.xl, fontWeight: 'bold', color: COLORS.white },
  refreshBtn: { fontSize: 24 },
  statsRow: { padding: SIZES.padding },
  statCard: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 16,
    marginRight: 12, minWidth: 120, borderLeftWidth: 4, elevation: 2,
  },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: SIZES.xxl, fontWeight: 'bold', color: COLORS.black },
  statTitle: { fontSize: SIZES.xs, color: COLORS.gray, marginTop: 4 },
  section: {
    backgroundColor: COLORS.white, margin: SIZES.padding,
    borderRadius: SIZES.radius, padding: SIZES.padding, elevation: 1,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.black },
  viewAll: { color: COLORS.primary, fontWeight: 'bold' },
  orderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray,
  },
  orderNum: { fontSize: SIZES.md, fontWeight: 'bold', color: COLORS.black },
  customerName: { fontSize: SIZES.sm, color: COLORS.gray, marginTop: 2 },
  orderAmount: { fontSize: SIZES.md, fontWeight: 'bold', color: COLORS.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
  statusText: { fontSize: SIZES.xs, fontWeight: 'bold' },
});
