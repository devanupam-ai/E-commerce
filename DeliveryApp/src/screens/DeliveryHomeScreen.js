import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, PermissionsAndroid
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import { deliveryOrderAPI } from '../api';
import { authState } from '../store/authState';
import { COLORS, SIZES } from '../utils/theme';
import messaging from '@react-native-firebase/messaging';

const STATUS_STEPS = ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'];
const getNextStatus = (current) => {
  const idx = STATUS_STEPS.indexOf(current);
  return idx < STATUS_STEPS.length - 1 ? STATUS_STEPS[idx + 1] : null;
};
const STATUS_COLOR = {
  ASSIGNED: '#F59E0B', PICKED_UP: '#F97316',
  OUT_FOR_DELIVERY: '#06B6D4', DELIVERED: '#10B981',
};

export default function DeliveryHomeScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [deliveredToday, setDeliveredToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const locationInterval = useRef(null);
  const activeOrderRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem('deliveryUser').then(u => u && setUser(JSON.parse(u)));
    loadOrders();
    setupFCM();
    requestLocationAndTrack();
    return () => { if (locationInterval.current) clearInterval(locationInterval.current); };
  }, []);

  const requestLocationAndTrack = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      locationInterval.current = setInterval(() => {
        Geolocation.getCurrentPosition(
          pos => {
            setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            if (activeOrderRef.current) {
              deliveryOrderAPI.updateLocation(
                activeOrderRef.current,
                pos.coords.latitude,
                pos.coords.longitude
              ).catch(() => {});
            }
          },
          () => {},
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }, 15000);
    } catch {}
  };

  const setupFCM = async () => {
    messaging().onMessage(async () => { loadOrders(); });
  };

  const loadOrders = async () => {
    try {
      const res = await deliveryOrderAPI.getMyOrders();
      const active = res.data.filter(o => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED');
      const today = res.data.filter(o => {
        if (o.orderStatus !== 'DELIVERED') return false;
        const d = new Date(o.updatedAt || o.createdAt);
        const now = new Date();
        return d.toDateString() === now.toDateString();
      });
      setOrders(active);
      setDeliveredToday(today.length);
      const outForDelivery = active.find(o => o.orderStatus === 'OUT_FOR_DELIVERY');
      activeOrderRef.current = outForDelivery?.id || null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusUpdate = async (order) => {
    const nextStatus = getNextStatus(order.orderStatus);
    if (!nextStatus) {
      navigation.navigate('VerifyOtp', { order });
      return;
    }
    try {
      await deliveryOrderAPI.updateStatus(order.id, nextStatus);
      loadOrders();
    } catch {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['deliveryToken', 'deliveryUser']);
          authState.setToken(null);
        },
      },
    ]);
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNum}>#{item.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[item.orderStatus] || '#6B7280') + '20' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[item.orderStatus] || '#6B7280' }]}>
            {item.orderStatus?.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionLabel}>👤 Customer</Text>
        <Text style={styles.infoText}>{item.customer?.name}</Text>
        <Text style={styles.infoText}>📞 {item.customer?.phone}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionLabel}>📍 Delivery Address</Text>
        <Text style={styles.infoText}>
          {item.address?.addressLine1}, {item.address?.city} - {item.address?.pincode}
        </Text>
        {item.customerLatitude && (
          <Text style={styles.coordText}>
            🗺 {parseFloat(item.customerLatitude).toFixed(5)}, {parseFloat(item.customerLongitude).toFixed(5)}
          </Text>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionLabel}>🛍️ Items ({item.items?.length})</Text>
        {item.items?.slice(0, 3).map(i => (
          <Text key={i.id} style={styles.itemText}>• {i.productName} × {i.quantity}</Text>
        ))}
        {item.items?.length > 3 && <Text style={styles.itemText}>+{item.items.length - 3} more</Text>}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.amount}>₹{item.totalAmount}</Text>
        <View style={[styles.paymentBadge, item.paymentType === 'COD' && styles.codBadge]}>
          <Text style={styles.paymentText}>{item.paymentType}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.actionBtn, item.orderStatus === 'OUT_FOR_DELIVERY' && styles.deliverBtn]}
        onPress={() => handleStatusUpdate(item)}
      >
        <Text style={styles.actionBtnText}>
          {item.orderStatus === 'OUT_FOR_DELIVERY' ? '✅ Verify OTP & Deliver' :
            item.orderStatus === 'ASSIGNED' ? '▶ Accept & Pick Up' : '📦 Mark Picked Up'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subGreeting}>
            {currentLocation
              ? `📍 ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
              : 'Fetching location...'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.onlineBadge}>
            <Text style={styles.onlineText}>🟢 Online</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{deliveredToday}</Text>
          <Text style={styles.statLabel}>Delivered Today</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {orders.filter(o => o.orderStatus === 'OUT_FOR_DELIVERY').length}
          </Text>
          <Text style={styles.statLabel}>On Route</Text>
        </View>
      </View>

      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: SIZES.padding }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 60 }}>🎉</Text>
              <Text style={styles.emptyText}>No active deliveries</Text>
              <Text style={styles.emptySubText}>Pull to refresh</Text>
            </View>
          }
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
  greeting: { fontSize: SIZES.xl, fontWeight: 'bold', color: COLORS.white },
  subGreeting: { fontSize: SIZES.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  onlineBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  onlineText: { color: COLORS.white, fontWeight: 'bold', fontSize: SIZES.sm },
  logoutBtn: { padding: 8 },
  logoutText: { fontSize: 20 },
  statsBar: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    paddingVertical: 12, elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: SIZES.xl, fontWeight: 'bold', color: COLORS.primary },
  statLabel: { fontSize: SIZES.xs, color: COLORS.gray, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: COLORS.lightGray },
  orderCard: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radius,
    padding: SIZES.padding, marginBottom: 12, elevation: 2,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderNum: { fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.black },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: SIZES.xs, fontWeight: 'bold' },
  infoSection: { marginBottom: 10 },
  sectionLabel: { fontSize: SIZES.xs, color: COLORS.gray, fontWeight: 'bold', marginBottom: 4 },
  infoText: { fontSize: SIZES.sm, color: COLORS.black },
  coordText: { fontSize: 11, color: COLORS.primary, marginTop: 2 },
  itemText: { fontSize: SIZES.sm, color: COLORS.gray },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  amount: { fontSize: SIZES.lg, fontWeight: 'bold', color: COLORS.black },
  paymentBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  codBadge: { backgroundColor: '#FEF3C7' },
  paymentText: { fontSize: SIZES.xs, fontWeight: 'bold', color: '#374151' },
  actionBtn: { backgroundColor: COLORS.primary, borderRadius: SIZES.radius, padding: 14, alignItems: 'center' },
  deliverBtn: { backgroundColor: '#10B981' },
  actionBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: SIZES.md },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: SIZES.xl, fontWeight: 'bold', color: COLORS.black, marginTop: 12 },
  emptySubText: { fontSize: SIZES.md, color: COLORS.gray, marginTop: 4 },
});
